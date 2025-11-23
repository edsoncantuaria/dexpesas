// backend/src/workers/cardAlertWorker.js
import { Worker } from 'bullmq';
import { redisClient } from '../config/redis.js';
import CardAlertService from '../services/cardAlertService.js';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();
const QUEUE_NAME = 'card-alerts';

class CardAlertWorker {
    constructor() {
        const workerConnection = redisClient.duplicate();

        this.worker = new Worker(QUEUE_NAME, this.processJob.bind(this), {
            connection: workerConnection,
            concurrency: 5,
        });

        this.worker.on('completed', (job) => {
            console.log(`✅ Card Alert Job #${job.id} (${job.name}) completo.`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`❌ Card Alert Job #${job.id} (${job.name}) falhou:`, err.message);
        });
    }

    async processJob(job) {
        const { name, data } = job;

        switch (name) {
            case 'check-card-alerts-all-users':
                console.log('🔍 Verificando alertas de cartão para todos os usuários...');
                await this.checkAllUsers();
                break;

            case 'check-card-alerts-user':
                console.log(`🔍 Verificando alertas de cartão para usuário: ${data.userId}`);
                await CardAlertService.runAllChecks(data.userId);
                break;

            default:
                throw new Error(`Tipo de job desconhecido: ${name}`);
        }
    }

    async checkAllUsers() {
        try {
            // Buscar todos os usuários com alertas habilitados
            const users = await prisma.user.findMany({
                where: {
                    enableLimitAlerts: true,
                },
                select: {
                    id: true,
                },
            });

            console.log(`📊 Verificando alertas para ${users.length} usuários...`);

            let totalAlerts = 0;
            for (const user of users) {
                try {
                    const result = await CardAlertService.runAllChecks(user.id);
                    if (!result.skipped) {
                        totalAlerts += result.total;
                    }
                } catch (error) {
                    console.error(`Erro ao verificar alertas do usuário ${user.id}:`, error.message);
                }
            }

            console.log(`✅ Verificação concluída. ${totalAlerts} alertas criados.`);
        } catch (error) {
            console.error('Erro ao verificar alertas de todos usuários:', error);
            throw error;
        }
    }

    run() {
        console.log(`🛠️  Worker de alertas de cartão (${QUEUE_NAME}) iniciado.`);
    }

    async close() {
        await this.worker.close();
    }
}

export default new CardAlertWorker();
