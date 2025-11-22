// backend/src/services/invoiceReconciliationService.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { getInvoicePeriod } from '../utils/date-helpers.js';
import { format } from 'date-fns';

const prisma = new PrismaClient();

const TOLERANCE = 0.01; // R$ 0,01 de tolerância

class InvoiceReconciliationService {
    /**
     * Calcula os totais de uma fatura para validação
     * @param {string} cardId - ID do cartão
     * @param {string} invoiceMonth - Mês da fatura (YYYY-MM)
     * @param {Date} referenceDate - Data de referência para cálculo do período
     * @returns {Promise<{totalExpenses: number, totalPayments: number, netBalance: number, period: {start: Date, end: Date}}>}
     */
    async calculateInvoiceTotals(cardId, invoiceMonth, referenceDate) {
        const card = await prisma.card.findUnique({
            where: { id: cardId }
        });

        if (!card) {
            throw new Error('Cartão não encontrado');
        }

        const period = getInvoicePeriod(card, referenceDate);

        // Buscar apenas despesas de crédito do período da fatura
        const expenses = await prisma.transaction.aggregate({
            _sum: { valor: true },
            where: {
                cardId,
                tipo: 'despesa',
                metodoPagamento: 'credito',
                data: {
                    gte: period.start,
                    lte: period.end
                }
            }
        });

        // Buscar pagamentos de fatura do período
        const payments = await prisma.transaction.aggregate({
            _sum: { valor: true },
            where: {
                cardId,
                tipo: 'receita',
                isInvoicePayment: true,
                data: {
                    gte: period.start,
                    lte: period.end
                }
            }
        });

        const totalExpenses = Number(expenses._sum.valor || 0);
        const totalPayments = Number(payments._sum.valor || 0);
        const netBalance = totalExpenses - totalPayments;

        return {
            totalExpenses,
            totalPayments,
            netBalance,
            period
        };
    }

    /**
     * Valida se o valor total do OFX bate com as despesas da fatura
     * @param {string} cardId - ID do cartão
     * @param {string} invoiceMonth - Mês da fatura (YYYY-MM)
     * @param {number} ofxTotalAmount - Valor total do OFX
     * @param {Date} referenceDate - Data de referência
     * @returns {Promise<{isValid: boolean, difference: number, manualTotal: number, ofxTotal: number}>}
     */
    async validateInvoiceMatch(cardId, invoiceMonth, ofxTotalAmount, referenceDate) {
        const { totalExpenses, totalPayments, netBalance } = await this.calculateInvoiceTotals(
            cardId,
            invoiceMonth,
            referenceDate
        );

        // Comparar soma das despesas com total do OFX
        const difference = Math.abs(totalExpenses - ofxTotalAmount);
        const isValid = difference <= TOLERANCE;

        return {
            isValid,
            difference,
            manualTotal: totalExpenses,
            ofxTotal: ofxTotalAmount,
            payments: totalPayments,
            netBalance
        };
    }

    /**
     * Substitui as transações manuais da fatura pelas do OFX
     * @param {string} reconciliationId - ID da reconciliação
     * @param {string} cardId - ID do cartão
     * @param {string} invoiceMonth - Mês da fatura (YYYY-MM)
     * @param {Date} referenceDate - Data de referência
     * @returns {Promise<{deletedCount: number, importedCount: number}>}
     */
    async replaceInvoiceTransactions(reconciliationId, cardId, invoiceMonth, referenceDate) {
        const card = await prisma.card.findUnique({
            where: { id: cardId }
        });

        if (!card) {
            throw new Error('Cartão não encontrado');
        }

        const period = getInvoicePeriod(card, referenceDate);

        return await prisma.$transaction(async (tx) => {
            // 1. Deletar APENAS despesas de crédito do período da fatura
            const deleteResult = await tx.transaction.deleteMany({
                where: {
                    cardId,
                    tipo: 'despesa',
                    metodoPagamento: 'credito',
                    data: {
                        gte: period.start,
                        lte: period.end
                    }
                }
            });

            // 2. Contar transações importadas que serão criadas
            const importedTransactions = await tx.importedTransaction.findMany({
                where: {
                    reconciliationId,
                    status: { in: ['PENDING', 'SUGGESTED'] }
                }
            });

            // 3. Marcar reconciliação como completa
            await tx.reconciliation.update({
                where: { id: reconciliationId },
                data: {
                    status: 'COMPLETED'
                }
            });

            return {
                deletedCount: deleteResult.count,
                importedCount: importedTransactions.length,
                period: {
                    start: format(period.start, 'dd/MM/yyyy'),
                    end: format(period.end, 'dd/MM/yyyy')
                }
            };
        });
    }

    /**
     * Busca o status de uma reconciliação de fatura em andamento
     * @param {string} cardId - ID do cartão
     * @param {string} invoiceMonth - Mês da fatura (YYYY-MM)
     * @param {string} userId - ID do usuário
     * @returns {Promise<Reconciliation | null>}
     */
    async getInvoiceReconciliationStatus(cardId, invoiceMonth, userId) {
        return await prisma.reconciliation.findFirst({
            where: {
                cardId,
                invoiceMonth,
                userId,
                replaceMode: true,
                status: { in: ['PROCESSING', 'PENDING_REVIEW'] }
            },
            include: {
                importedTransactions: {
                    orderBy: { date: 'asc' }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }

    /**
     * Cancela uma reconciliação de fatura e remove dados importados
     * @param {string} reconciliationId - ID da reconciliação
     * @param {string} userId - ID do usuário
     * @returns {Promise<void>}
     */
    async cancelInvoiceReconciliation(reconciliationId, userId) {
        const reconciliation = await prisma.reconciliation.findFirst({
            where: {
                id: reconciliationId,
                userId,
                replaceMode: true,
                status: { not: 'COMPLETED' }
            }
        });

        if (!reconciliation) {
            throw new Error('Reconciliação não encontrada ou já finalizada');
        }

        await prisma.$transaction(async (tx) => {
            // Deletar transações importadas
            await tx.importedTransaction.deleteMany({
                where: { reconciliationId }
            });

            // Deletar reconciliação
            await tx.reconciliation.delete({
                where: { id: reconciliationId }
            });
        });
    }
}

export default new InvoiceReconciliationService();
