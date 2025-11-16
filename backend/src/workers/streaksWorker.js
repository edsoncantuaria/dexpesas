
// backend/src/workers/streaksWorker.js
import { Worker } from 'bullmq';
import cron from 'node-cron';
import { redisClient } from '../config/redis.js';
import prisma from '../config/prismaClient.js';
import { startOfDay, endOfDay, subDays, isSameDay } from 'date-fns';
import NotificationService from '../services/notificationService.js';
import GamificationService from '../services/gamificationService.js';
import { streaksQueue } from '../queues/streaksQueue.js';

const QUEUE_NAME = 'streaks';

const STREAK_XP_REWARDS = {
    3: 50,
    7: 150,
    15: 300,
    30: 750,
};

class StreaksWorker {
    constructor() {
        const workerConnection = redisClient.duplicate();
        this.worker = new Worker(QUEUE_NAME, this.processJob.bind(this), {
            connection: workerConnection,
            concurrency: 1, // Processa um usuário de cada vez para evitar race conditions
        });

        this.worker.on('completed', (job) => console.log(`✅ Job de streak #${job.id} (${job.data.userId}) completo.`));
        this.worker.on('failed', (job, err) => console.error(`❌ Job de streak #${job.id} falhou:`, err.message));

        // Agenda o "cron job" para rodar todos os dias às 00:10
        cron.schedule('10 0 * * *', this.scheduleDailyStreakChecks.bind(this), {
            scheduled: true,
            timezone: "America/Sao_Paulo"
        });
    }
    
    async scheduleDailyStreakChecks() {
        console.log('⏰ Cron: Disparando verificação diária de streaks...');
        const users = await prisma.user.findMany({ select: { id: true } });
        for (const user of users) {
            await streaksQueue.add('check-user-streaks', { userId: user.id });
        }
    }

    async processJob(job) {
        const { userId } = job.data;
        if (!userId) return;

        console.log(`🔥 Verificando streaks para usuário: ${userId}`);
        await this.checkDailyTransactionStreak(userId);
        await this.checkNoViceSpendingStreak(userId);
    }
    
    async checkDailyTransactionStreak(userId) {
        const yesterdayStart = startOfDay(subDays(new Date(), 1));
        const yesterdayEnd = endOfDay(subDays(new Date(), 1));

        const transactionsYesterday = await prisma.transaction.count({
            where: { userId, data: { gte: yesterdayStart, lte: yesterdayEnd } },
        });

        await this.updateStreak(userId, 'DAILY_TRANSACTION', transactionsYesterday > 0);
    }

    async checkNoViceSpendingStreak(userId) {
        const yesterdayStart = startOfDay(subDays(new Date(), 1));
        const yesterdayEnd = endOfDay(subDays(new Date(), 1));
        
        const viceCategory = await prisma.category.findFirst({
            where: { nome: 'Vicios', userId: null }
        });
        if (!viceCategory) return;
        
        const viceSpendingYesterday = await prisma.transaction.count({
            where: {
                userId,
                categoryId: viceCategory.id,
                data: { gte: yesterdayStart, lte: yesterdayEnd },
            },
        });
        
        await this.updateStreak(userId, 'NO_VICE_SPENDING', viceSpendingYesterday === 0);
    }

    async updateStreak(userId, type, conditionMet) {
        await prisma.$transaction(async (tx) => {
            let streak = await tx.userStreak.findUnique({
                where: { userId_type: { userId, type } }
            });

            if (!streak) {
                streak = { userId, type, currentStreak: 0, longestStreak: 0, lastCheckedAt: subDays(new Date(), 1) };
            }

            // Verifica se a última checagem foi ontem
            const isConsecutiveDay = isSameDay(streak.lastCheckedAt, subDays(new Date(), 1));

            if (conditionMet) {
                const newStreakCount = isConsecutiveDay ? streak.currentStreak + 1 : 1;
                await tx.userStreak.upsert({
                    where: { userId_type: { userId, type } },
                    update: {
                        currentStreak: newStreakCount,
                        longestStreak: Math.max(streak.longestStreak, newStreakCount),
                        lastCheckedAt: new Date(),
                    },
                    create: { userId, type, currentStreak: 1, longestStreak: 1, lastCheckedAt: new Date() }
                });
                
                // Concede recompensa se a nova streak atingir um marco
                if (STREAK_XP_REWARDS[newStreakCount]) {
                    const user = await tx.user.findUnique({ where: { id: userId } });
                    const xp = STREAK_XP_REWARDS[newStreakCount];
                    await GamificationService.processXpChange(tx, userId, xp);
                    await NotificationService.createNotification(tx, user, {
                        title: `Sequência de ${newStreakCount} dias!`,
                        message: `Você ganhou +${xp} XP por manter seu hábito!`,
                        type: 'STREAK_AWARDED',
                    });
                }

            } else { // Se a condição não foi cumprida
                await tx.userStreak.updateMany({
                    where: { userId, type },
                    data: { currentStreak: 0, lastCheckedAt: new Date() }
                });
            }
        });
    }

    run() {
        console.log(`🛠️  Worker de streaks (${QUEUE_NAME}) iniciado.`);
        this.scheduleDailyStreakChecks(); // Roda uma vez ao iniciar para garantir que não perdeu nada
    }

    async close() {
        await this.worker.close();
    }
}

export default new StreaksWorker();
