// backend/src/workers/reconciliationWorker.js
import { Worker } from 'bullmq';
import { redisClient } from '../config/redis.js';
import ReconciliationService from '../services/reconciliationService.js';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import minioClient from '../config/minioClient.js';
import config from '../config/config.js';

const prisma = new PrismaClient();
const QUEUE_NAME = 'reconciliation';

class ReconciliationWorker {
    constructor() {
        const workerConnection = redisClient.duplicate();
        this.worker = new Worker(QUEUE_NAME, this.processJob.bind(this), {
            connection: workerConnection,
            concurrency: 5,
        });

        this.worker.on('completed', async (job, result) => {
            console.log(`✅ Job de reconciliação #${job.id} (${job.name}) completo.`);
            // Limpa o arquivo do storage após o sucesso do processamento inicial
            if (job.name === 'process-statement-file') {
                 await this.cleanupFile(job.data.filePath);
            }
        });

        this.worker.on('failed', async (job, err) => {
            console.error(`❌ Job de reconciliação #${job.id} (${job.name}) falhou:`, err.message);
            // Atualiza o status da reconciliação para FAILED no banco
            if (job.data.reconciliationId) {
                try {
                    await prisma.reconciliation.update({
                        where: { id: job.data.reconciliationId },
                        data: { status: 'FAILED' },
                    });
                } catch (updateError) {
                    console.error("Erro ao atualizar status da reconciliação para FAILED:", updateError);
                }
            }
            // Limpa o arquivo do storage mesmo em caso de falha para evitar lixo
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
            // Não relança o erro para não fazer o job falhar apenas por falha na limpeza
        }
    }

    run() {
        console.log(`🛠️  Worker de reconciliação (${QUEUE_NAME}) iniciado.`);
    }

    async close() {
        await this.worker.close();
    }
}

export default new ReconciliationWorker();
