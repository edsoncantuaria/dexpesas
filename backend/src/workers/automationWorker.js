// backend/src/workers/automationWorker.js
import { Worker } from 'bullmq';
import cron from 'node-cron';
import { redisClient } from '../config/redis.js';
import AutomationService from '../services/automationService.js';
import prisma from '../config/prismaClient.js';
import { startOfDay, endOfDay } from 'date-fns';

const QUEUE_NAME = 'automations';

class AutomationWorker {
    constructor() {
        const workerConnection = redisClient.duplicate();
        this.worker = new Worker(QUEUE_NAME, this.processJob.bind(this), {
            connection: workerConnection,
            concurrency: 5,
        });

        this.worker.on('completed', (job) => {
            console.log(`✅ Job de automação #${job.id} (${job.name}) completo.`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`❌ Job de automação #${job.id} (${job.name}) falhou:`, err.message);
        });

        // Agenda o "cron job" para rodar todos os dias à 1h da manhã
        cron.schedule('0 1 * * *', () => {
            console.log('⏰ Cron: Disparando verificação diária de automações...');
            this.scheduleDailyAutomationChecks();
        }, {
            scheduled: true,
            timezone: "America/Sao_Paulo"
        });
    }
    
    /**
     * Adiciona um job na fila para cada usuário que tem automações ativas.
     */
    async scheduleDailyAutomationChecks() {
        try {
            const usersWithAutomations = await prisma.user.findMany({
                where: {
                    automations: { some: { enabled: true } }
                },
                select: { id: true }
            });

            for (const user of usersWithAutomations) {
                console.log(`-- Adicionando job de automação para usuário ${user.id}`);
                await this.worker.queue.add('run-user-automations', { userId: user.id });
            }
        } catch (error) {
            console.error("Erro ao agendar verificações de automação:", error);
        }
    }

    async processJob(job) {
        const { name, data } = job;
        
        switch (name) {
            case 'run-user-automations':
                console.log(`🤖 Executando automações para o usuário: ${data.userId}`);
                await this.runUserAutomations(data.userId);
                break;
            
            default:
                throw new Error(`Tipo de job de automação desconhecido: ${name}`);
        }
    }

    /**
     * Roda todas as automações agendadas para um usuário específico.
     */
    async runUserAutomations(userId) {
        const automations = await prisma.automation.findMany({
            where: { userId, enabled: true }
        });

        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = Domingo, 5 = Sexta
        const dayOfMonth = today.getDate();

        for (const auto of automations) {
            try {
                if (auto.type === 'ROUND_UP') {
                    let shouldRun = false;
                    switch (auto.scheduleType) {
                        case 'WEEKLY': if (dayOfWeek === 5) shouldRun = true; break;
                        case 'MONTHLY': if (dayOfMonth === 1) shouldRun = true; break;
                        case 'THRESHOLD': shouldRun = true; break; // A lógica do threshold é interna ao serviço
                    }
                    if (shouldRun) {
                        console.log(`--- Executando automação ROUND_UP para ${userId} (Schedule: ${auto.scheduleType})`);
                        await AutomationService.runRoundUp(userId);
                    }
                } else if (auto.type === 'BILL_PAY' && auto.recorrenciaId) {
                    await this.runBillPay(userId, auto.recorrenciaId, auto.config?.sourceAccountId);
                }
            } catch (error) {
                 console.error(`Erro ao rodar automação tipo ${auto.type} para user ${userId}:`, error.message);
            }
        }
    }

    /**
     * Executa a lógica de pagamento automático para uma série de transações recorrentes.
     */
    async runBillPay(userId, recorrenciaId, sourceAccountId) {
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());

        // Encontra a próxima transação não paga da série que vence hoje
        const upcomingBill = await prisma.transaction.findFirst({
            where: {
                userId,
                recorrenciaId,
                pago: false,
                data: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
        });

        if (upcomingBill) {
            console.log(`--- Executando automação BILL_PAY para transação ${upcomingBill.id}`);
            await AutomationService.runBillPayment(userId, upcomingBill.id, sourceAccountId);
        }
    }

    run() {
        console.log(`🛠️  Worker de automações (${QUEUE_NAME}) iniciado.`);
    }

    async close() {
        await this.worker.close();
    }
}

export default new AutomationWorker();
