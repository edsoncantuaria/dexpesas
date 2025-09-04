
// backend/src/workers/auditWorker.js
import { Worker } from 'bullmq';
import { redisClient } from '../config/redis.js';
import prisma from '../config/prismaClient.js'; // Alterado

const QUEUE_NAME = 'audit';

class AuditWorker {
    constructor() {
        const workerConnection = redisClient.duplicate();
        this.worker = new Worker(QUEUE_NAME, this.processJob.bind(this), {
            connection: workerConnection,
            concurrency: 10, // Pode processar vários logs em paralelo
        });

        this.worker.on('completed', (job) => {
            console.log(`✅ Log de auditoria #${job.id} (${job.data.action}) salvo com sucesso.`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`❌ Job de log de auditoria #${job.id} (${job.data.action}) falhou:`, err.message);
        });
    }

    async processJob(job) {
        const { userId, action, entity, entityId, details, status, origin, ipAddress } = job.data;

        if (!userId || !action || !entity || !entityId) {
            throw new Error("Dados de log de auditoria incompletos.");
        }

        await prisma.auditLog.create({
            data: {
                userId,
                action,
                entity,
                entityId,
                details: details || {},
                status: status || 'SUCCESS',
                origin: origin || 'UNKNOWN',
                ipAddress: ipAddress || null,
            },
        });
    }

    run() {
        console.log(`🛠️  Worker de auditoria (${QUEUE_NAME}) iniciado.`);
    }

    async close() {
        await this.worker.close();
    }
}

export default new AuditWorker();
    
    