// backend/src/services/debtNotificationService.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import NotificationService from './notificationService.js';

const prisma = new PrismaClient();

class DebtNotificationService {
    /**
     * Check for critical debt situations and create notifications
     * Should be called periodically (e.g., weekly)
     */
    async checkDebtAlerts(userId) {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    debts: {
                        where: {
                            status: 'ACTIVE'
                        }
                    }
                }
            });

            if (!user || user.debts.length === 0) {
                return;
            }

            // Check 1: High DTI (Debt-to-Income Ratio)
            await this.checkHighDTI(user);

            // Check 2: Snowballing Debts (growing debts)
            await this.checkSnowballingDebts(user);

            // Check 3: High Interest Debts
            await this.checkHighInterestDebts(user);

        } catch (error) {
            console.error('Error checking debt alerts:', error);
        }
    }

    async checkHighDTI(user) {
        // Calculate DTI
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        const incomeTransactions = await prisma.transaction.aggregate({
            _sum: { valor: true },
            where: {
                userId: user.id,
                tipo: 'receita',
                data: { gte: threeMonthsAgo }
            }
        });

        const totalIncome = Number(incomeTransactions._sum.valor || 0);
        const avgMonthlyIncome = totalIncome / 3;

        const totalMonthlyMin = user.debts.reduce((sum, d) => sum + Number(d.minimumPayment), 0);
        const dti = avgMonthlyIncome > 0 ? (totalMonthlyMin / avgMonthlyIncome) * 100 : 0;

        // DTI > 40% is critical
        if (dti > 40) {
            // Check if we already sent this notification recently (last 7 days)
            const recentNotification = await prisma.notification.findFirst({
                where: {
                    userId: user.id,
                    type: 'DEBT_ALERT',
                    message: { contains: 'DTI Crítico' },
                    createdAt: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                    }
                }
            });

            if (!recentNotification) {
                await NotificationService.createNotification(prisma, user, {
                    title: '⚠️ DTI Crítico Detectado',
                    message: `Sua Relação Dívida/Renda está em ${dti.toFixed(1)}%! Recomendado manter abaixo de 30%. Considere renegociar suas dívidas ou aumentar pagamentos.`,
                    type: 'DEBT_ALERT',
                    relatedId: null,
                    actions: [
                        {
                            label: 'Ver Recomendações',
                            action: 'navigate',
                            target: '/dashboard/dividas?tab=recommendations'
                        }
                    ]
                });
            }
        }
    }

    async checkSnowballingDebts(user) {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        for (const debt of user.debts) {
            // Check if debt has NO payments in last 3 months
            const recentPayments = await prisma.debtPayment.count({
                where: {
                    debtId: debt.id,
                    paymentDate: { gte: threeMonthsAgo }
                }
            });

            if (recentPayments === 0) {
                // Check if we already notified about this specific debt
                const recentNotification = await prisma.notification.findFirst({
                    where: {
                        userId: user.id,
                        type: 'DEBT_ALERT',
                        relatedId: debt.id,
                        message: { contains: 'sem pagamentos' },
                        createdAt: {
                            gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) // Last 14 days
                        }
                    }
                });

                if (!recentNotification) {
                    await NotificationService.createNotification(prisma, user, {
                        title: '🔴 Dívida em Crescimento',
                        message: `A dívida "${debt.name}" está sem pagamentos há 3 meses e crescendo! Saldo atual: R$ ${Number(debt.currentBalance).toFixed(2)}`,
                        type: 'DEBT_ALERT',
                        relatedId: debt.id,
                        actions: [
                            {
                                label: 'Registrar Pagamento',
                                action: 'navigate',
                                target: '/dashboard/dividas?tab=overview'
                            }
                        ]
                    });
                }
            }
        }
    }

    async checkHighInterestDebts(user) {
        const highInterestDebts = user.debts.filter(d => Number(d.interestRate) > 5);

        if (highInterestDebts.length > 0 && user.debts.length > 1) {
            // Check if we already sent this type of notification recently
            const recentNotification = await prisma.notification.findFirst({
                where: {
                    userId: user.id,
                    type: 'DEBT_ALERT',
                    message: { contains: 'juros elevados' },
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    }
                }
            });

            if (!recentNotification) {
                await NotificationService.createNotification(prisma, user, {
                    title: '💡 Dica de Economia',
                    message: `Você possui ${highInterestDebts.length} dívida(s) com juros elevados (>5% a.m.). Considere priorizar o pagamento dessas dívidas usando a estratégia Avalanche.`,
                    type: 'DEBT_ALERT',
                    relatedId: null,
                    actions: [
                        {
                            label: 'Ver Simulador',
                            action: 'navigate',
                            target: '/dashboard/dividas?tab=recommendations'
                        }
                    ]
                });
            }
        }
    }

    /**
     * Notify when a debt is paid off
     */
    async notifyDebtPaidOff(userId, debtName) {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });

        if (!user) return;

        await NotificationService.createNotification(prisma, user, {
            title: '🎉 Parabéns! Dívida Quitada',
            message: `Você quitou completamente a dívida "${debtName}"! Continue assim no caminho para a liberdade financeira!`,
            type: 'ACHIEVEMENT_UNLOCKED',
            relatedId: null,
            actions: []
        });
    }
}

export default new DebtNotificationService();
