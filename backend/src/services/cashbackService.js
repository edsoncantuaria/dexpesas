// backend/src/services/cashbackService.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

class CashbackService {
    /**
     * Calcula o cashback de uma transação
     * @param {Object} transaction - Objeto da transação
     * @param {Object} card - Objeto do cartão
     * @returns {Object} { cashbackAmount, cashbackPercentage }
     */
    calculateCashback(transaction, card) {
        // Apenas despesas de cartão de crédito geram cashback
        if (transaction.tipo !== 'despesa' || transaction.metodoPagamento !== 'credito') {
            return { cashbackAmount: 0, cashbackPercentage: 0 };
        }

        // Usa a porcentagem da transação ou a padrão do cartão
        const percentage = transaction.cashbackPercentage || card.defaultCashbackRate || 0;

        if (percentage === 0) {
            return { cashbackAmount: 0, cashbackPercentage: 0 };
        }

        const amount = Number(transaction.valor || 0);
        const cashbackAmount = amount * (Number(percentage) / 100);

        return {
            cashbackAmount: parseFloat(cashbackAmount.toFixed(4)),
            cashbackPercentage: parseFloat(percentage)
        };
    }

    /**
     * Aplica cashback a uma transação existente
     * @param {string} transactionId - ID da transação
     * @param {Object} tx - Transação Prisma (opcional)
     */
    async applyCashbackToTransaction(transactionId, tx = prisma) {
        const transaction = await tx.transaction.findUnique({
            where: { id: transactionId },
            include: { card: true }
        });

        if (!transaction || !transaction.card) {
            return null;
        }

        const { cashbackAmount, cashbackPercentage } = this.calculateCashback(transaction, transaction.card);

        if (cashbackAmount > 0) {
            // Atualiza a transação com o cashback
            await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    cashbackAmount,
                    cashbackPercentage
                }
            });

            // Atualiza o total de cashback do cartão
            await tx.card.update({
                where: { id: transaction.cardId },
                data: {
                    totalCashbackEarned: {
                        increment: cashbackAmount
                    }
                }
            });

            return { cashbackAmount, cashbackPercentage };
        }

        return null;
    }

    /**
     * Retorna resumo de cashback de um usuário
     * @param {string} userId - ID do usuário
     * @param {string} cardId - ID do cartão (opcional)
     * @param {Date} startDate - Data inicial (opcional)
     * @param {Date} endDate - Data final (opcional)
     */
    async getCashbackSummary(userId, cardId = null, startDate = null, endDate = null) {
        const where = {
            userId,
            tipo: 'despesa',
            metodoPagamento: 'credito',
            cashbackAmount: { gt: 0 }
        };

        if (cardId) {
            where.cardId = cardId;
        }

        if (startDate || endDate) {
            where.data = {};
            if (startDate) where.data.gte = startDate;
            if (endDate) where.data.lte = endDate;
        }

        const transactions = await prisma.transaction.findMany({
            where,
            select: {
                cashbackAmount: true,
                cashbackPercentage: true,
                valor: true,
                data: true,
                cardId: true,
                categoryId: true
            }
        });

        const totalCashback = transactions.reduce((sum, t) => sum + Number(t.cashbackAmount), 0);
        const transactionCount = transactions.length;
        const avgPercentage = transactions.length > 0
            ? transactions.reduce((sum, t) => sum + Number(t.cashbackPercentage), 0) / transactions.length
            : 0;

        // Cashback por cartão
        const byCard = {};
        transactions.forEach(t => {
            if (!byCard[t.cardId]) {
                byCard[t.cardId] = {
                    total: 0,
                    count: 0
                };
            }
            byCard[t.cardId].total += Number(t.cashbackAmount);
            byCard[t.cardId].count += 1;
        });

        // Cashback por categoria
        const byCategory = {};
        transactions.forEach(t => {
            const catId = t.categoryId || 'uncategorized';
            if (!byCategory[catId]) {
                byCategory[catId] = {
                    total: 0,
                    count: 0
                };
            }
            byCategory[catId].total += Number(t.cashbackAmount);
            byCategory[catId].count += 1;
        });

        return {
            totalCashback: parseFloat(totalCashback.toFixed(4)),
            transactionCount,
            avgPercentage: parseFloat(avgPercentage.toFixed(2)),
            byCard,
            byCategory
        };
    }

    /**
     * Analytics de cashback
     * @param {string} userId - ID do usuário
     * @param {string} cardId - ID do cartão (opcional)
     * @param {string} period - Período ('month', 'quarter', 'year')
     */
    async getCashbackAnalytics(userId, cardId = null, period = 'month') {
        const now = new Date();
        let startDate;

        switch (period) {
            case 'quarter':
                startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            case 'month':
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
        }

        const where = {
            userId,
            tipo: 'despesa',
            metodoPagamento: 'credito',
            cashbackAmount: { gt: 0 },
            data: { gte: startDate }
        };

        if (cardId) {
            where.cardId = cardId;
        }

        const transactions = await prisma.transaction.findMany({
            where,
            select: {
                cashbackAmount: true,
                data: true,
                valor: true,
                category: {
                    select: {
                        id: true,
                        nome: true
                    }
                },
                card: {
                    select: {
                        id: true,
                        nome: true
                    }
                }
            },
            orderBy: { data: 'asc' }
        });

        // Agrupar por mês
        const monthlyData = {};
        transactions.forEach(t => {
            const monthKey = `${t.data.getFullYear()}-${String(t.data.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { cashback: 0, spending: 0, count: 0 };
            }
            monthlyData[monthKey].cashback += Number(t.cashbackAmount);
            monthlyData[monthKey].spending += Number(t.valor);
            monthlyData[monthKey].count += 1;
        });

        return {
            monthly: monthlyData,
            summary: await this.getCashbackSummary(userId, cardId, startDate)
        };
    }

    /**
     * Resgata cashback e cria transação de receita
     * @param {string} userId - ID do usuário
     * @param {string} cardId - ID do cartão
     * @param {number} amount - Valor a resgatar
     * @param {string} accountId - ID da conta destino (opcional)
     * @param {Object} tx - Transação Prisma (opcional)
     */
    async redeemCashback(userId, cardId, amount, accountId = null, tx = prisma) {
        const card = await tx.card.findFirst({
            where: { id: cardId, userId }
        });

        if (!card) {
            throw { statusCode: 404, message: 'Cartão não encontrado.' };
        }

        // Validar mínimo
        if (card.cashbackRedemptionMinimum && amount < Number(card.cashbackRedemptionMinimum)) {
            throw {
                statusCode: 400,
                message: `O valor mínimo para resgate é ${card.cashbackRedemptionMinimum}.`
            };
        }

        // Validar saldo disponível
        if (Number(card.totalCashbackEarned) < amount) {
            throw {
                statusCode: 400,
                message: 'Saldo de cashback insuficiente.'
            };
        }

        // Validar expiração
        if (card.cashbackExpiresAt && new Date() > card.cashbackExpiresAt) {
            throw {
                statusCode: 400,
                message: 'O cashback expirou.'
            };
        }

        // Criar transação de receita
        const transaction = await tx.transaction.create({
            data: {
                userId,
                accountId: accountId || card.paymentAccountId,
                tipo: 'receita',
                valor: amount,
                descricao: `Resgate de cashback - ${card.nome}`,
                data: new Date(),
                metodoPagamento: 'credito',
                notes: `Cashback resgatado do cartão ${card.nome}`
            }
        });

        // Deduzir do total de cashback do cartão
        await tx.card.update({
            where: { id: cardId },
            data: {
                totalCashbackEarned: {
                    decrement: amount
                }
            }
        });

        return {
            transaction,
            remainingCashback: Number(card.totalCashbackEarned) - amount
        };
    }
}

export default new CashbackService();
