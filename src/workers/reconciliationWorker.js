// backend/src/workers/reconciliationWorker.js
import { Worker } from 'bullmq';
import { redisClient } from '../config/redis.js';
import ReconciliationService from '../services/reconciliationService.js';
import { PrismaClient } from '@prisma/client';
import minioClient from '../config/minioClient.js';
import config from '../config/config.js';
import CategorizationService from '../services/categorizationService.js';
import { bulkSuggestCategoryFlow } from '../ai/flows/bulk-category-suggestion-flow.js';


const prisma = new PrismaClient();
const QUEUE_NAME = 'reconciliation';

// Helper para buscar e mapear categorias
async function getCategoryMap(tx) {
    const prismaInstance = tx || prisma;
    const categories = await prismaInstance.category.findMany();
    return new Map(categories.map(cat => [cat.nome, cat.id]));
}


class ReconciliationWorker {
    constructor() {
        const workerConnection = redisClient.duplicate();
        this.worker = new Worker(QUEUE_NAME, this.processJob.bind(this), {
            connection: workerConnection,
            concurrency: 5, // Aumenta a concorrência para processar chunks em paralelo
        });

        this.worker.on('completed', async (job, result) => {
            console.log(`✅ Job de reconciliação #${job.id} (${job.name}) completo.`);
            if (job.name === 'process-statement-file') {
                 await this.cleanupFile(job.data.filePath);
            }
        });

        this.worker.on('failed', async (job, err) => {
            console.error(`❌ Job de reconciliação #${job.id} (${job.name}) falhou:`, err.message);
            if (job.data.reconciliationId && job.name !== 'process-chunk') {
                try {
                    await prisma.reconciliation.update({
                        where: { id: job.data.reconciliationId },
                        data: { status: 'FAILED' },
                    });
                } catch (updateError) {
                    console.error("Erro ao atualizar status da reconciliação para FAILED:", updateError);
                }
            }
             if (job.name === 'process-statement-file') {
                await this.cleanupFile(job.data.filePath);
            }
        });
    }

    async processJob(job) {
        const { name, data } = job;
        
        switch (name) {
            case 'process-statement-file':
                console.log(`🔎 Processando arquivo de extrato (${data.fileType}) para reconciliação: ${data.reconciliationId}`);
                if (!data.filePath || !data.reconciliationId || !data.userId) {
                    throw new Error("Dados do job inválidos. filePath, reconciliationId e userId são obrigatórios.");
                }
                return await ReconciliationService.processStatementFile(data.filePath, data.reconciliationId, data.userId, data.fileType, data.mapping);

            case 'process-chunk':
                console.log(`🤖 Processando lote de transações para reconciliação: ${data.reconciliationId}`);
                await this.processTransactionChunk(data);
                break;
            
            default:
                throw new Error(`Tipo de job de reconciliação desconhecido: ${name}`);
        }
    }
    
     /**
     * Limpa o arquivo do MinIO após o processamento.
     */
    async cleanupFile(objectName) {
        try {
            if (objectName) {
                await minioClient.removeObject(config.minio.bucketName, objectName);
                console.log(`🗑️ Arquivo ${objectName} deletado do MinIO.`);
            }
        } catch (err) {
            console.error(`Erro ao deletar arquivo ${objectName} do MinIO:`, err);
        }
    }
    
    /**
     * Processa um lote (chunk) de transações importadas.
     */
    async processTransactionChunk(data) {
        const { reconciliationId, userId, accountId, transactions } = data;
        
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            throw new Error(`Usuário ${userId} não encontrado para processamento de lote.`);
        }

        const categoryMap = await getCategoryMap();
        let transactionsToCategorizeByAI = [];

        // 1. Aplica regras manuais
        for (const tx of transactions) {
            const categoryName = await CategorizationService.applyRulesAndGetName(userId, tx.description);
            if (categoryName && categoryMap.has(categoryName)) {
                tx.categoryId = categoryMap.get(categoryName);
            } else {
                transactionsToCategorizeByAI.push({ id: tx.id, description: tx.description });
            }
        }

        // 2. Aplica IA para o restante, se habilitado
        if (user.enableReconciliationAi && transactionsToCategorizeByAI.length > 0) {
            const aiResult = await bulkSuggestCategoryFlow({ transactions: JSON.stringify(transactionsToCategorizeByAI) });
            for (const tx of transactions) {
                if (aiResult[tx.id]) {
                    const categoryName = aiResult[tx.id];
                    if (categoryMap.has(categoryName)) {
                        tx.categoryId = categoryMap.get(categoryName);
                    }
                }
            }
        }

        // 3. Cria as transações no banco
        await prisma.$transaction(async (txPrisma) => {
            for (const importedTx of transactions) {
                const newManualTx = await txPrisma.transaction.create({
                    data: {
                        userId,
                        accountId,
                        descricao: importedTx.description,
                        valor: importedTx.amount,
                        data: new Date(importedTx.date),
                        tipo: importedTx.type === 'CREDIT' ? 'receita' : 'despesa',
                        pago: true,
                        isReconciled: true,
                        categoryId: importedTx.categoryId || categoryMap.get('Compras'),
                        metodoPagamento: 'debito',
                        importedTransactionId: importedTx.id,
                    },
                });

                await txPrisma.importedTransaction.update({
                    where: { id: importedTx.id },
                    data: { status: 'RECONCILED', manualTransactionId: newManualTx.id },
                });
            }
        });
    }


    run() {
        console.log(`🛠️  Worker de reconciliação (${QUEUE_NAME}) iniciado.`);
    }

    async close() {
        await this.worker.close();
    }
}

export default new ReconciliationWorker();
