

// backend/src/services/notificationService.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { addDays } from 'date-fns';
import GamificationService from './gamificationService.js';
import { notificationQueue } from '../queues/notificationQueue.js';

const prisma = new PrismaClient();

class NotificationService {
    /**
     * Adiciona um job na fila para enviar uma notificação push.
     * @param {string} encryptedSubscription - O objeto de inscrição criptografado.
     * @param {string} title - O título da notificação.
     * @param {string} body - O corpo da notificação.
     * @param {object} data - Dados adicionais para enviar com a notificação.
     */
    static async sendPushNotification(encryptedSubscription, title, body, data = {}) {
        if (!encryptedSubscription) {
            console.log("Usuário sem inscrição para push, pulando notificação.");
            return;
        }

        const payload = JSON.stringify({
            title,
            body,
            data,
        });

        // Adiciona o job de envio de notificação à fila, em vez de enviar diretamente.
        // O worker irá descriptografar a subscription.
        try {
            await notificationQueue.add('send-push-notification', { encryptedSubscription, payload });
        } catch (error) {
            console.error("Falha ao adicionar job de notificação à fila:", error);
        }
    }

    static async createNotification(prismaInstance, user, { title, message, type, relatedId, actions }) {
        let canNotify = true;
        switch (type) {
            case 'ACHIEVEMENT_UNLOCKED':
                canNotify = user.enableAchievementNotifications;
                break;
            case 'BUDGET_ALERT':
                canNotify = user.enableBudgetNotifications;
                break;
            case 'LIMIT_ALERT':
                canNotify = user.enableLimitAlerts;
                break;
            case 'UPCOMING_PAYMENT':
                canNotify = user.enableUpcomingPaymentNotifications;
                break;
            case 'PAYMENT_DUE': // Notificações de pagamento vencido são sempre importantes
                canNotify = true;
                break;
            case 'SECURITY_ALERT':
                canNotify = true;
                break;
            default:
                break;
        }
        
        if (!canNotify) {
            return null;
        }

        // Envia a notificação push para a fila
        await this.sendPushNotification(user.pushSubscription, title, message, { type, relatedId: relatedId || '' });

        // Salva a notificação no banco de dados
        return prismaInstance.notification.create({
            data: {
                userId: user.id,
                title,
                message,
                type,
                relatedId: relatedId || null,
                actions: actions || [],
            },
        });
    }

    // Esta função agora é chamada pelo Worker
    static async runChecks(userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return;
        
        try {
            await this.checkForDuePayments(user);
            if (user.enableUpcomingPaymentNotifications) {
                await this.checkForUpcomingPayments(user);
            }
        } catch (error) {
            console.error(`Erro ao verificar notificações para o usuário ${userId}:`, error);
        }
    }
    
    static async checkForDuePayments(user) {
        await prisma.$transaction(async (tx) => {
            const dueTransactions = await tx.transaction.findMany({
                where: {
                    userId: user.id,
                    pago: false,
                    tipo: 'despesa',
                    data: { lt: new Date() },
                    metodoPagamento: { not: 'credito' }
                }
            });

            for (const transaction of dueTransactions) {
                const existingNotification = await tx.notification.findFirst({
                    where: { userId: user.id, type: 'PAYMENT_DUE', relatedId: transaction.id }
                });

                if (!existingNotification) {
                    const actions = [
                        { label: 'Marcar como Paga', action: 'MARK_AS_PAID', variant: 'default' },
                        { label: 'Manter Pendente', action: 'KEEP_UNPAID', variant: 'destructive' },
                    ];

                    if (transaction.recorrenciaId) {
                        actions.push({ label: 'Remover Recorrência', action: 'REMOVE_RECURRENCE', variant: 'destructive' });
                    }

                    await this.createNotification(tx, user, {
                        title: 'Pagamento Vencido',
                        message: `Sua conta '${transaction.descricao}' de R$ ${transaction.valor.toFixed(2)} venceu.`,
                        type: 'PAYMENT_DUE',
                        relatedId: transaction.id,
                        actions,
                    });

                    // Aplica penalidade de XP
                    await GamificationService.triggerXpEvent(tx, user.id, 'PAYMENT_DUE');
                }
            }
        });
    }
    
    static async checkForUpcomingPayments(user) {
        const reminderDays = user.daysUntilDueReminder;
        const today = new Date();
        const reminderDate = addDays(today, reminderDays);

        const upcomingTransactions = await prisma.transaction.findMany({
            where: {
                userId: user.id,
                pago: false,
                tipo: 'despesa',
                data: {
                    gte: today,
                    lte: reminderDate
                },
                metodoPagamento: { not: 'credito' }
            }
        });

        for (const transaction of upcomingTransactions) {
            const existingNotification = await prisma.notification.findFirst({
                where: { userId: user.id, type: 'UPCOMING_PAYMENT', relatedId: transaction.id }
            });

            if (!existingNotification) {
                await this.createNotification(prisma, user, {
                    title: 'Lembrete de Pagamento',
                    message: `Sua conta '${transaction.descricao}' de R$ ${transaction.valor.toFixed(2)} vence em breve.`,
                    type: 'UPCOMING_PAYMENT',
                    relatedId: transaction.id,
                });
            }
        }
    }
    
    static async handleMarkAsPaid(userId, transactionId) {
        return prisma.$transaction(async (tx) => {
            const updatedTransaction = await tx.transaction.update({
                where: { id: transactionId, userId },
                data: { pago: true }
            });

            // Concede XP ao marcar como pago
            await GamificationService.triggerXpEvent(tx, userId, 'BILL_PAID', { amount: updatedTransaction.valor });
            await GamificationService.checkAndAwardAchievements(tx, userId, 'PAYMENT_ON_TIME', updatedTransaction.id);

            return { updatedTransaction };
        });
    }
    
    static async handleKeepUnpaid(userId, transactionId, tx) {
        const prismaInstance = tx || prisma;
        const transaction = await prismaInstance.transaction.findFirst({
            where: { id: transactionId, userId }
        });

        if (transaction && transaction.recorrenciaId) {
            const deletedCount = await prismaInstance.transaction.deleteMany({
                where: {
                    userId,
                    recorrenciaId: transaction.recorrenciaId,
                    pago: false,
                    id: { not: transactionId }
                }
            });
            const updatedTransaction = await prismaInstance.transaction.update({
                where: { id: transactionId },
                data: { recorrenciaId: null }
            });
            return { updatedTransaction, futureTransactionsRemoved: deletedCount.count };
        }
        return { message: "Transação mantida como não paga."};
    }
    
    static async handleBulkKeepUnpaid(userId, transactionIds, tx) {
        const transactions = await tx.transaction.findMany({
            where: { id: { in: transactionIds }, userId: userId }
        });

        const recurrenceIds = transactions
            .filter(t => t.recorrenciaId)
            .map(t => t.recorrenciaId);

        if (recurrenceIds.length > 0) {
            await tx.transaction.deleteMany({
                where: {
                    userId,
                    recorrenciaId: { in: recurrenceIds },
                    pago: false,
                    id: { notIn: transactionIds }
                }
            });
            await tx.transaction.updateMany({
                where: { id: { in: transactionIds } },
                data: { recorrenciaId: null }
            });
        }
    }

    static async handleRemoveRecurrence(userId, transactionId) {
        const transaction = await prisma.transaction.findFirst({
            where: { id: transactionId, userId: userId },
        });

        if (!transaction || !transaction.recorrenciaId) {
            throw { statusCode: 404, message: 'Transação recorrente não encontrada.' };
        }
        
        const deletedTransactions = await prisma.transaction.deleteMany({
            where: {
                userId: userId,
                recorrenciaId: transaction.recorrenciaId,
                pago: false,
            },
        });

        return { 
            message: `Recorrência "${transaction.descricao.replace(/\s\(\d+\/\d+\)$/, '')}" removida.`, 
            transactionsRemoved: deletedTransactions.count 
        };
    }
}

export default NotificationService;
