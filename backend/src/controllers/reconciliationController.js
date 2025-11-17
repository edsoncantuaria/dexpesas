// src/controllers/reconciliationController.js
import { PrismaClient } from '@prisma/client';
import { reconciliationQueue } from '../queues/reconciliationQueue.js';
import AuditService from '../services/auditService.js';
import GamificationService from '../services/gamificationService.js';
import minioClient from '../config/minioClient.js';
import config from '../config/config.js';
import crypto from 'crypto';


const prisma = new PrismaClient();


class ReconciliationController {

    /**
     * Recebe o upload de um arquivo de extrato (OFX ou CSV), salva no MinIO, cria um registro
     * e adiciona um job à fila para processamento em background.
     */
    async uploadStatement(req, res, next) {
        const { targetId, targetType, fileType, mapping, saveTemplate, templateName } = req.body;
        const userId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo de extrato enviado.' });
        }
        if (!targetId || !targetType) {
            return res.status(400).json({ message: 'O alvo da reconciliação (conta ou cartão) é obrigatório.' });
        }

        const bucketName = config.minio.bucketName;
        if (!bucketName) {
            return res.status(500).json({ message: 'MINIO_BUCKET_NAME não está configurado.' });
        }

        try {
            // 1. Faz o upload do arquivo para o MinIO
            const fileExtension = req.file.originalname.split('.').pop();
            const objectName = `reconciliations/${userId}/${crypto.randomBytes(16).toString('hex')}.${fileExtension}`;
            
            const bucketExists = await minioClient.bucketExists(bucketName);
            if (!bucketExists) await minioClient.makeBucket(bucketName);

            await minioClient.putObject(bucketName, objectName, req.file.buffer, req.file.size);

            // 2. Cria o registro de reconciliação com o objectName como filePath
            const data = {
                userId,
                status: 'PROCESSING',
                filePath: objectName,
                fileType: fileType || 'OFX',
            };

            if (targetType === 'account') {
                data.accountId = targetId;
            } else if (targetType === 'card') {
                data.cardId = targetId;
            } else {
                 return res.status(400).json({ message: 'Tipo de alvo inválido. Deve ser "account" ou "card".' });
            }

            const reconciliation = await prisma.reconciliation.create({ data });
            
            let templateId = null;

            if (fileType === 'CSV' && saveTemplate === 'true' && templateName) {
                const newTemplate = await prisma.importTemplate.create({
                    data: {
                        userId,
                        name: templateName,
                        mapping: JSON.parse(mapping),
                    }
                });
                templateId = newTemplate.id;
                
                await prisma.reconciliation.update({
                    where: { id: reconciliation.id },
                    data: { importTemplateId: templateId }
                });
            }

            // 3. Adiciona job à fila passando o objectName (filePath)
            await reconciliationQueue.add('process-statement-file', {
                filePath: objectName, // Passa o nome do objeto para o worker
                reconciliationId: reconciliation.id,
                userId: userId,
                fileType: fileType || 'OFX',
                mapping: fileType === 'CSV' ? JSON.parse(mapping) : null
            });
            
            await AuditService.log({
                userId,
                action: 'UPLOAD_STATEMENT',
                entity: 'RECONCILIATION',
                entityId: reconciliation.id,
                details: { fileName: req.file.originalname, objectName: objectName },
                ipAddress: req.ip,
            });

            res.status(202).json({
                message: "Arquivo recebido. A reconciliação está sendo processada em segundo plano.",
                reconciliationId: reconciliation.id,
            });

        } catch (error) {
            console.error('Erro no upload para o MinIO:', error);
            next(error);
        }
    }
    
    /**
     * Busca os templates de importação CSV salvos pelo usuário.
     */
    async getImportTemplates(req, res, next) {
        const userId = req.user.id;
        try {
            const templates = await prisma.importTemplate.findMany({
                where: { userId },
                orderBy: { name: 'asc' }
            });
            res.json(templates);
        } catch (error) {
            next(error);
        }
    }


    /**
     * Busca os dados de uma reconciliação específica pelo ID ou a última pendente
     * de uma conta e suas transações pendentes.
     */
    async getReconciliationStatus(req, res, next) {
        const { reconciliationId, accountId, cardId } = req.query; // Busca por accountId OU reconciliationId
        const userId = req.user.id;

        try {
            const whereClause = { userId };
            if (reconciliationId) {
                whereClause.id = reconciliationId;
            } else if (accountId) {
                whereClause.accountId = accountId;
            } else if (cardId) {
                whereClause.cardId = cardId;
            } else {
                 return res.status(400).json({ message: 'Um ID (reconciliationId, accountId ou cardId) é obrigatório.' });
            }

            const reconciliation = await prisma.reconciliation.findFirst({
                where: whereClause,
                orderBy: { createdAt: 'desc' },
                include: {
                    importedTransactions: {
                        where: { status: { in: ['PENDING', 'SUGGESTED'] } },
                        orderBy: { date: 'asc' },
                    },
                },
            });

            if (!reconciliation) {
                return res.status(404).json({ message: 'Nenhuma reconciliação encontrada para este alvo.' });
            }

            res.json(reconciliation);

        } catch (error) {
            next(error);
        }
    }
    
     /**
     * Busca o histórico de todas as reconciliações de um usuário.
     */
    async getReconciliationHistory(req, res, next) {
        const userId = req.user.id;
        try {
            const history = await prisma.reconciliation.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                include: {
                    account: { select: { nome: true } },
                    card: { select: { nome: true } },
                    _count: {
                        select: { 
                            importedTransactions: true,
                        }
                    }
                }
            });
            
            const historyWithDetails = await Promise.all(history.map(async (rec) => {
                const reconciledCount = await prisma.importedTransaction.count({
                    where: {
                        reconciliationId: rec.id,
                        status: 'RECONCILED'
                    }
                });
                return { 
                    ...rec, 
                    reconciledCount,
                    targetName: rec.account?.nome || rec.card?.nome || 'N/A'
                };
            }));

            res.json(historyWithDetails);
        } catch (error) {
            next(error);
        }
    }


    /**
     * Recebe o ID de uma transação importada e o ID de uma transação manual
     * para efetuar a conciliação.
     */
    async matchTransaction(req, res, next) {
        const { importedTransactionId, manualTransactionId } = req.body;
        const userId = req.user.id;

        try {
             // Usamos uma transação do Prisma para garantir a atomicidade
            const result = await prisma.$transaction(async (tx) => {
                // 1. Valida se a transação importada pertence ao usuário e está pendente
                const importedTx = await tx.importedTransaction.findFirst({
                    where: {
                        id: importedTransactionId,
                        reconciliation: { userId: userId },
                        status: { in: ['PENDING', 'SUGGESTED'] },
                    }
                });

                if (!importedTx) {
                    throw { statusCode: 404, message: 'Transação importada não encontrada ou já processada.' };
                }
                
                // 2. Valida se a transação manual pertence ao usuário
                const manualTx = await tx.transaction.findFirst({
                    where: {
                        id: manualTransactionId,
                        userId: userId,
                    }
                });
                
                if (!manualTx) {
                     throw { statusCode: 404, message: 'Transação manual não encontrada.' };
                }
                
                // 3. Atualiza o status de ambas as transações
                await tx.importedTransaction.update({
                    where: { id: importedTransactionId },
                    data: { status: 'RECONCILED', manualTransactionId: manualTransactionId },
                });
                
                const updatedManualTx = await tx.transaction.update({
                    where: { id: manualTransactionId },
                    data: { isReconciled: true, importedTransactionId: importedTransactionId },
                });
                
                 await AuditService.log({
                    userId,
                    action: 'MATCH_TRANSACTION',
                    entity: 'RECONCILIATION',
                    entityId: importedTx.reconciliationId,
                    details: {
                        importedTransactionId,
                        manualTransactionId,
                    },
                    ipAddress: req.ip,
                });

                return updatedManualTx;
            });

            res.status(200).json({ message: 'Transação conciliada com sucesso!', data: result });
        
        } catch (error) {
             if (error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            next(error);
        }
    }
    
    /**
     * Marca uma transação importada como descartada pelo usuário.
     */
    async discardTransaction(req, res, next) {
        const { importedTransactionId } = req.body;
        const userId = req.user.id;
        
        try {
             const importedTx = await prisma.importedTransaction.findFirst({
                where: {
                    id: importedTransactionId,
                    reconciliation: { userId: userId },
                    status: { in: ['PENDING', 'SUGGESTED'] },
                }
             });

             if (!importedTx) {
                return res.status(404).json({ message: 'Transação importada não encontrada ou já processada.' });
             }

             await prisma.importedTransaction.update({
                where: { id: importedTransactionId },
                data: { status: 'DISCARDED' }
            });

            await AuditService.log({
                userId,
                action: 'DISCARD_TRANSACTION',
                entity: 'RECONCILIATION',
                entityId: importedTx.reconciliationId,
                details: { importedTransactionId, description: importedTx.description },
                ipAddress: req.ip,
            });

            res.status(200).json({ message: 'Transação descartada com sucesso.' });

        } catch (error) {
            next(error);
        }
    }

     /**
     * Finaliza uma reconciliação, marcando-a como completa e descartando
     * todas as transações importadas que ainda estão pendentes.
     */
    async finalizeReconciliation(req, res, next) {
        const { reconciliationId } = req.params;
        const userId = req.user.id;

        try {
            await prisma.$transaction(async (tx) => {
                // 1. Atualiza a reconciliação principal para 'COMPLETED'
                const updatedReconciliation = await tx.reconciliation.updateMany({
                    where: { id: reconciliationId, userId },
                    data: { status: 'COMPLETED' },
                });
                
                if (updatedReconciliation.count === 0) {
                    throw { statusCode: 404, message: 'Reconciliação não encontrada ou não pertence ao usuário.' };
                }

                // 2. Atualiza todas as transações importadas pendentes para 'DISCARDED'
                await tx.importedTransaction.updateMany({
                    where: {
                        reconciliationId,
                        status: { in: ['PENDING', 'SUGGESTED'] },
                    },
                    data: { status: 'DISCARDED' },
                });

                await GamificationService.triggerXpEvent(tx, userId, 'RECONCILIATION_STREAK', { reconciliationId });
            });

            await AuditService.log({
                userId,
                action: 'FINALIZE_RECONCILIATION',
                entity: 'RECONCILIATION',
                entityId: reconciliationId,
                ipAddress: req.ip,
            });

            res.status(200).json({ message: 'Reconciliação finalizada com sucesso.' });
        } catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            next(error);
        }
    }

    /**
     * Exclui uma reconciliação e todas as suas transações importadas associadas.
     * Usado quando o usuário cancela o processo.
     */
    async deleteReconciliation(req, res, next) {
        const { reconciliationId } = req.params;
        const userId = req.user.id;

        try {
            const reconciliationToDelete = await prisma.reconciliation.findFirst({
                where: { id: reconciliationId, userId }
            });

            if (!reconciliationToDelete) {
                return res.status(404).json({ message: 'Reconciliação não encontrada.' });
            }

            await prisma.$transaction(async (tx) => {
                await tx.importedTransaction.deleteMany({
                    where: { reconciliationId: reconciliationId },
                });
                await tx.reconciliation.delete({
                    where: { id: reconciliationId },
                });
            });
            
            // Deleta o arquivo do MinIO se ele existir
            if(reconciliationToDelete.filePath) {
                 await minioClient.removeObject(config.minio.bucketName, reconciliationToDelete.filePath);
            }

            res.status(204).send();

        } catch (error) {
            next(error);
        }
    }

    async createAllFromImported(req, res, next) {
        const { reconciliationId } = req.params;
        const userId = req.user.id;
        const CHUNK_SIZE = 50;

        try {
            const reconciliation = await prisma.reconciliation.findFirst({
                where: { id: reconciliationId, userId },
                include: { importedTransactions: { where: { status: { in: ['PENDING', 'SUGGESTED'] } } } },
            });

            if (!reconciliation || reconciliation.importedTransactions.length === 0) {
                return res.status(404).json({ message: 'Nenhuma transação pendente encontrada.' });
            }
            
            const importedTransactions = reconciliation.importedTransactions;
            const totalJobs = Math.ceil(importedTransactions.length / CHUNK_SIZE);
            
            // Atualiza o registro principal com o número total de jobs
            await prisma.reconciliation.update({
                where: { id: reconciliationId },
                data: {
                    totalJobs: totalJobs,
                    completedJobs: 0,
                    status: 'PROCESSING',
                }
            });

            // Cria os jobs filhos (chunks)
            for (let i = 0; i < importedTransactions.length; i += CHUNK_SIZE) {
                const chunk = importedTransactions.slice(i, i + CHUNK_SIZE);
                await reconciliationQueue.add('process-chunk', {
                    reconciliationId,
                    userId,
                    accountId: reconciliation.accountId,
                    cardId: reconciliation.cardId,
                    transactions: chunk,
                });
            }
            
            res.status(202).json({ message: `${totalJobs} lotes de transações foram adicionados à fila para processamento.` });

        } catch (error) {
            console.error("Erro ao criar jobs de reconciliação:", error);
            next(error);
        }
    }
}

export default new ReconciliationController();
