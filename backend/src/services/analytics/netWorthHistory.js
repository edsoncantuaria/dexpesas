// backend/src/services/analytics/netWorthHistory.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

const prisma = new PrismaClient();

class NetWorthHistoryService {
    /**
     * Calculate net worth for a specific date
     * Net Worth = (Account Balances + Goal Funds) - Card Debts
     */
    async calculateNetWorthAtDate(userId, targetDate) {
        const dateEnd = endOfMonth(targetDate);

        // 1. Calculate account balances (initial balance + transactions up to date)
        const accounts = await prisma.account.findMany({
            where: { userId },
            select: {
                id: true,
                nome: true,
                saldoInicial: true,
                createdAt: true
            }
        });

        let totalAccounts = 0;
        for (const account of accounts) {
            // Only include accounts created before or at target date
            if (account.createdAt > dateEnd) continue;

            const [income, expenses] = await Promise.all([
                prisma.transaction.aggregate({
                    _sum: { valor: true },
                    where: {
                        accountId: account.id,
                        tipo: 'receita',
                        data: { lte: dateEnd },
                        pago: true
                    }
                }),
                prisma.transaction.aggregate({
                    _sum: { valor: true },
                    where: {
                        accountId: account.id,
                        tipo: 'despesa',
                        data: { lte: dateEnd },
                        pago: true
                    }
                })
            ]);

            const balance = Number(account.saldoInicial) +
                (Number(income._sum.valor) || 0) -
                (Number(expenses._sum.valor) || 0);

            totalAccounts += balance;
        }

        // 2. Calculate goal funds
        const goals = await prisma.goal.findMany({
            where: {
                userId,
                createdAt: { lte: dateEnd }
            },
            select: {
                id: true,
                currentAmount: true
            }
        });

        const totalGoals = goals.reduce((sum, goal) => sum + Number(goal.currentAmount || 0), 0);

        // 3. Calculate card debts (unpaid invoices)
        const cards = await prisma.card.findMany({
            where: {
                userId,
                createdAt: { lte: dateEnd }
            },
            select: { id: true }
        });

        let totalDebts = 0;
        for (const card of cards) {
            const unpaidExpenses = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: {
                    cardId: card.id,
                    tipo: 'despesa',
                    metodoPagamento: 'credito',
                    data: { lte: dateEnd },
                    pago: true,
                    // Exclude expenses that were paid off
                }
            });

            const cardPayments = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: {
                    cardId: card.id,
                    tipo: 'receita',
                    isInvoicePayment: true,
                    data: { lte: dateEnd }
                }
            });

            const debt = (Number(unpaidExpenses._sum.valor) || 0) - (Number(cardPayments._sum.valor) || 0);
            totalDebts += Math.max(0, debt); // Only count positive debt
        }

        return {
            date: targetDate,
            accounts: totalAccounts,
            goals: totalGoals,
            debts: totalDebts,
            netWorth: totalAccounts + totalGoals - totalDebts
        };
    }

    /**
     * Get net worth history for the last N months
     */
    async getHistory(userId, months = 12) {
        const history = [];
        const today = new Date();

        for (let i = months - 1; i >= 0; i--) {
            const targetDate = subMonths(today, i);
            const point = await this.calculateNetWorthAtDate(userId, targetDate);
            history.push({
                ...point,
                month: format(targetDate, 'MMM yyyy', { locale: require('date-fns/locale/pt-BR') }),
                monthKey: format(targetDate, 'yyyy-MM')
            });
        }

        return history;
    }
}

export default new NetWorthHistoryService();
