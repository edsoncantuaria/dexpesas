// backend/src/services/insightsService.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

const prisma = new PrismaClient();

class InsightsService {
    /**
     * Get financial insights for a user
     */
    async getInsights(userId) {
        const now = new Date();
        const currentMonthStart = startOfMonth(now);
        const currentMonthEnd = endOfMonth(now);
        const lastMonthStart = startOfMonth(subMonths(now, 1));
        const lastMonthEnd = endOfMonth(subMonths(now, 1));

        try {
            // 1. Calculate current and last month expenses
            const [currentMonthExpenses, lastMonthExpenses] = await Promise.all([
                prisma.transaction.aggregate({
                    _sum: { valor: true },
                    where: {
                        userId,
                        tipo: 'despesa',
                        pago: true,
                        data: { gte: currentMonthStart, lte: currentMonthEnd }
                    }
                }),
                prisma.transaction.aggregate({
                    _sum: { valor: true },
                    where: {
                        userId,
                        tipo: 'despesa',
                        pago: true,
                        data: { gte: lastMonthStart, lte: lastMonthEnd }
                    }
                })
            ]);

            const currentExpenses = Number(currentMonthExpenses._sum.valor || 0);
            const lastExpenses = Number(lastMonthExpenses._sum.valor || 0);
            const expenseTrend = lastExpenses > 0
                ? ((currentExpenses - lastExpenses) / lastExpenses) * 100
                : 0;

            // 2. Calculate income
            const [currentMonthIncome, lastMonthIncome] = await Promise.all([
                prisma.transaction.aggregate({
                    _sum: { valor: true },
                    where: {
                        userId,
                        tipo: 'receita',
                        pago: true,
                        data: { gte: currentMonthStart, lte: currentMonthEnd }
                    }
                }),
                prisma.transaction.aggregate({
                    _sum: { valor: true },
                    where: {
                        userId,
                        tipo: 'receita',
                        pago: true,
                        data: { gte: lastMonthStart, lte: lastMonthEnd }
                    }
                })
            ]);

            const currentIncome = Number(currentMonthIncome._sum.valor || 0);
            const lastIncome = Number(lastMonthIncome._sum.valor || 0);

            // 3. Savings rate
            const savingsRate = currentIncome > 0
                ? ((currentIncome - currentExpenses) / currentIncome) * 100
                : 0;

            // 4. Top expense category
            const categoryExpenses = await prisma.transaction.groupBy({
                by: ['categoryId'],
                where: {
                    userId,
                    tipo: 'despesa',
                    pago: true,
                    data: { gte: currentMonthStart, lte: currentMonthEnd }
                },
                _sum: { valor: true },
                orderBy: { _sum: { valor: 'desc' } },
                take: 1
            });

            let topCategory = null;
            if (categoryExpenses.length > 0 && categoryExpenses[0].categoryId) {
                const category = await prisma.category.findUnique({
                    where: { id: categoryExpenses[0].categoryId },
                    include: { parentCategory: true }
                });

                if (category) {
                    topCategory = {
                        name: category.parentCategory
                            ? `${category.parentCategory.label} > ${category.label}`
                            : category.label,
                        amount: Number(categoryExpenses[0]._sum.valor || 0),
                        percentage: currentExpenses > 0
                            ? (Number(categoryExpenses[0]._sum.valor || 0) / currentExpenses) * 100
                            : 0
                    };
                }
            }

            // 5. Budget adherence
            const currentMonth = format(now, 'yyyy-MM');
            const budgets = await prisma.budget.findMany({
                where: { userId, month: currentMonth }
            });

            let budgetScore = 100;
            let budgetsWithIssues = 0;

            for (const budget of budgets) {
                const spent = await prisma.transaction.aggregate({
                    _sum: { valor: true },
                    where: {
                        userId,
                        tipo: 'despesa',
                        pago: true,
                        categoryId: budget.categoryId,
                        data: { gte: currentMonthStart, lte: currentMonthEnd }
                    }
                });

                const spentAmount = Number(spent._sum.valor || 0);
                const limitAmount = Number(budget.limit);

                if (spentAmount > limitAmount) {
                    budgetsWithIssues++;
                    const overspend = ((spentAmount - limitAmount) / limitAmount) * 100;
                    budgetScore -= Math.min(overspend, 20); // Max 20 points per budget
                }
            }

            budgetScore = Math.max(0, Math.min(100, budgetScore));

            return {
                spendingTrend: {
                    current: currentExpenses,
                    last: lastExpenses,
                    changePercent: expenseTrend,
                    direction: expenseTrend > 0 ? 'up' : expenseTrend < 0 ? 'down' : 'stable'
                },
                income: {
                    current: currentIncome,
                    last: lastIncome
                },
                savingsRate: savingsRate,
                topCategory: topCategory,
                budgetAdherence: {
                    score: budgetScore,
                    totalBudgets: budgets.length,
                    budgetsOverLimit: budgetsWithIssues
                },
                monthRange: {
                    current: format(now, 'MMMM yyyy'),
                    last: format(subMonths(now, 1), 'MMMM yyyy')
                }
            };
        } catch (error) {
            console.error('Error generating insights:', error);
            throw error;
        }
    }
}

export default new InsightsService();
