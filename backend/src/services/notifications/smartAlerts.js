// backend/src/services/notifications/smartAlerts.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import {
    differenceInDays,
    addDays,
    startOfMonth,
    endOfMonth,
    subMonths,
    startOfDay,
    endOfDay,
    format
} from 'date-fns';
import NotificationService from '../notificationService.js';

const prisma = new PrismaClient();

class SmartAlertsService {
    /**
     * Check for bills due in 1, 3, or 7 days
     */
    async checkDueBills() {
        console.log('🔔 Checking for upcoming bill due dates...');

        const users = await prisma.user.findMany({
            where: {
                notificationPreferences: {
                    path: ['billReminders'],
                    equals: true
                }
            }
        });

        for (const user of users) {
            const today = new Date();
            const upcomingBills = await prisma.transaction.findMany({
                where: {
                    userId: user.id,
                    pago: false,
                    tipo: 'despesa',
                    data: {
                        gte: today,
                        lte: addDays(today, 7)
                    },
                    metodoPagamento: { not: 'credito' } // Credit card bills handled separately
                },
                include: {
                    category: true
                }
            });

            for (const bill of upcomingBills) {
                const daysUntilDue = differenceInDays(new Date(bill.data), today);

                // Only notify at specific intervals: 1, 3, and 7 days
                if ([1, 3, 7].includes(daysUntilDue)) {
                    // Check if we already notified for this specific due date
                    const existingNotification = await prisma.notification.findFirst({
                        where: {
                            userId: user.id,
                            type: 'BILL_DUE_REMINDER',
                            relatedId: bill.id,
                            createdAt: {
                                gte: startOfDay(today)
                            }
                        }
                    });

                    if (!existingNotification) {
                        await NotificationService.createNotification(prisma, user, {
                            type: 'BILL_DUE_REMINDER',
                            title: `Conta vence em ${daysUntilDue} dia${daysUntilDue > 1 ? 's' : ''}`,
                            message: `${bill.descricao} - R$ ${Number(bill.valor).toFixed(2)}`,
                            relatedId: bill.id
                        });
                        console.log(`  ✓ Notified ${user.email}: ${bill.descricao} due in ${daysUntilDue} days`);
                    }
                }
            }
        }
    }

    /**
     * Check for budgets exceeding 80% and 100%
     */
    async checkBudgetLimits() {
        console.log('💰 Checking budget limits...');

        const currentMonth = format(new Date(), 'yyyy-MM');
        const currentMonthStart = startOfMonth(new Date());
        const currentMonthEnd = endOfMonth(new Date());

        const budgets = await prisma.budget.findMany({
            where: { month: currentMonth },
            include: {
                user: true,
                category: {
                    include: {
                        parentCategory: true
                    }
                }
            }
        });

        for (const budget of budgets) {
            // Check user preference
            const prefs = budget.user.notificationPreferences || {};
            if (prefs.budgetAlerts === false) continue;

            // Calculate spent amount
            const spent = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: {
                    userId: budget.userId,
                    categoryId: budget.categoryId,
                    tipo: 'despesa',
                    pago: true,
                    data: {
                        gte: currentMonthStart,
                        lte: currentMonthEnd
                    }
                }
            });

            const spentAmount = Number(spent._sum.valor || 0);
            const limitAmount = Number(budget.limit);
            const percentage = (spentAmount / limitAmount) * 100;

            const categoryName = budget.category.parentCategory
                ? `${budget.category.parentCategory.label} > ${budget.category.label}`
                : budget.category.label;

            // Alert at 100%
            if (percentage >= 100 && !budget.alertedAt100) {
                await NotificationService.createNotification(prisma, budget.user, {
                    type: 'BUDGET_EXCEEDED',
                    title: 'Orçamento Excedido! 🚨',
                    message: `Você gastou R$ ${spentAmount.toFixed(2)} em ${categoryName} (limite: R$ ${limitAmount.toFixed(2)})`,
                    relatedId: budget.id
                });

                await prisma.budget.update({
                    where: { id: budget.id },
                    data: { alertedAt100: true }
                });
                console.log(`  ✓ Notified ${budget.user.email}: Budget exceeded for ${categoryName}`);
            }
            // Alert at 80%
            else if (percentage >= 80 && !budget.alertedAt80) {
                await NotificationService.createNotification(prisma, budget.user, {
                    type: 'BUDGET_WARNING',
                    title: 'Atenção ao Orçamento ⚠️',
                    message: `Você já gastou ${percentage.toFixed(0)}% do orçamento de ${categoryName}`,
                    relatedId: budget.id
                });

                await prisma.budget.update({
                    where: { id: budget.id },
                    data: { alertedAt80: true }
                });
                console.log(`  ✓ Notified ${budget.user.email}: Budget at ${percentage.toFixed(0)}% for ${categoryName}`);
            }
        }
    }

    /**
     * Check for goals with no contributions in 30+ days
     */
    async checkGoalReminders() {
        console.log('🎯 Checking goal reminders...');

        const goals = await prisma.goal.findMany({
            where: { status: 'IN_PROGRESS' },
            include: { user: true }
        });

        for (const goal of goals) {
            // Check user preference
            const prefs = goal.user.notificationPreferences || {};
            if (prefs.goalReminders === false) continue;

            // Find last contribution
            const lastContribution = await prisma.$queryRaw`
                SELECT createdAt 
                FROM AuditLog 
                WHERE userId = ${goal.userId} 
                  AND entity = 'GOAL' 
                  AND entityId = ${goal.id}
                  AND action = 'ADD_GOAL_CONTRIBUTION'
                ORDER BY createdAt DESC 
                LIMIT 1
            `;

            const lastContributionDate = lastContribution.length > 0
                ? new Date(lastContribution[0].createdAt)
                : new Date(goal.createdAt);

            const daysSinceContribution = differenceInDays(new Date(), lastContributionDate);

            if (daysSinceContribution >= 30) {
                // Check if we already sent a reminder recently (within 7 days)
                const recentReminder = await prisma.notification.findFirst({
                    where: {
                        userId: goal.userId,
                        type: 'GOAL_REMINDER',
                        relatedId: goal.id,
                        createdAt: {
                            gte: subMonths(new Date(), 1)
                        }
                    }
                });

                if (!recentReminder) {
                    await NotificationService.createNotification(prisma, goal.user, {
                        type: 'GOAL_REMINDER',
                        title: 'Lembrete de Meta 🎯',
                        message: `Faz ${daysSinceContribution} dias sem contribuir para "${goal.name}"`,
                        relatedId: goal.id
                    });
                    console.log(`  ✓ Notified ${goal.user.email}: Goal "${goal.name}" needs contribution`);
                }
            }
        }
    }

    /**
     * Detect unusual transactions (2x or more above average)
     */
    async checkUnusualTransactions() {
        console.log('⚠️  Checking for unusual transactions...');

        const users = await prisma.user.findMany({
            where: {
                notificationPreferences: {
                    path: ['unusualTransactions'],
                    equals: true
                }
            }
        });

        for (const user of users) {
            // Calculate 3-month average expense
            const threeMonthsAgo = subMonths(new Date(), 3);

            const avgExpense = await prisma.transaction.aggregate({
                _avg: { valor: true },
                where: {
                    userId: user.id,
                    tipo: 'despesa',
                    pago: true,
                    data: { gte: threeMonthsAgo }
                }
            });

            const average = Number(avgExpense._avg.valor || 0);
            if (average === 0) continue; // Skip if no history

            const threshold = average * 2; // 2x average

            // Check today's transactions
            const todayTransactions = await prisma.transaction.findMany({
                where: {
                    userId: user.id,
                    tipo: 'despesa',
                    data: {
                        gte: startOfDay(new Date()),
                        lte: endOfDay(new Date())
                    },
                    valor: { gte: threshold }
                },
                include: {
                    category: true
                }
            });

            for (const tx of todayTransactions) {
                // Check if already notified
                const existingNotification = await prisma.notification.findFirst({
                    where: {
                        userId: user.id,
                        type: 'UNUSUAL_TRANSACTION',
                        relatedId: tx.id
                    }
                });

                if (!existingNotification) {
                    const multiplier = (Number(tx.valor) / average).toFixed(1);
                    await NotificationService.createNotification(prisma, user, {
                        type: 'UNUSUAL_TRANSACTION',
                        title: 'Transação Incomum Detectada 🔍',
                        message: `Despesa de R$ ${Number(tx.valor).toFixed(2)} em "${tx.descricao}" (${multiplier}x acima da média)`,
                        relatedId: tx.id
                    });
                    console.log(`  ✓ Notified ${user.email}: Unusual transaction ${tx.descricao}`);
                }
            }
        }
    }

    /**
     * Run all smart alerts checks
     */
    async runAllChecks() {
        console.log('🚀 Starting smart alerts check...');
        const startTime = Date.now();

        try {
            await this.checkDueBills();
            await this.checkBudgetLimits();
            await this.checkGoalReminders();
            await this.checkUnusualTransactions();

            const duration = Date.now() - startTime;
            console.log(`✅ Smart alerts check completed in ${duration}ms`);
        } catch (error) {
            console.error('❌ Error running smart alerts:', error);
            throw error;
        }
    }
}

export default new SmartAlertsService();
