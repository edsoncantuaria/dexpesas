
// backend/src/services/transactionService.js
import { PrismaClient } from '@prisma/client';
import { getInvoicePeriod } from '../utils/date-helpers.js';
import { setDate, format, startOfDay, endOfDay, addMonths } from 'date-fns';
import CardBalanceService from './cardBalanceService.js';

const prisma = new PrismaClient();

async function getCategoryMap(tx) {
    const prismaInstance = tx || prisma;
    const categories = await prismaInstance.category.findMany();
    return new Map(categories.map(cat => [cat.nome, cat.id]));
}

class TransactionService {

    static async handleBillPayment(userId, cardId, accountId, paymentAmount, paymentDate, prismaTx) {
        const executor = prismaTx
            ? (callback) => callback(prismaTx)
            : (callback) => prisma.$transaction(callback);
        return executor(async (tx) => {
            const categoryMap = await getCategoryMap(tx);
            const pagamentoFaturaCategoryId =
                ['Pagamento Fatura', 'PagamentoFatura', 'PagamentosFatura']
                    .map(name => categoryMap.get(name))
                    .find(Boolean) || categoryMap.get('Moradia');
            const jurosCategoryId =
                categoryMap.get('DividasEEmprestimos') || categoryMap.get('Dividas');
            const payDate = paymentDate ? new Date(paymentDate) : new Date();

            if (!pagamentoFaturaCategoryId || !jurosCategoryId) {
                const err = new Error("Categorias padrão para pagamento ou juros não encontradas.");
                err.statusCode = 500;
                throw err;
            }

            const card = await tx.card.findUnique({ where: { id: cardId } });
            if (!card) {
                const err = new Error("Cartão não encontrado.");
                err.statusCode = 404;
                throw err;
            }
            
            // Para o cálculo da fatura, consideramos a data do pagamento.
            const { start, end } = getInvoicePeriod(card, payDate);
            
            const invoiceTransactions = await tx.transaction.findMany({
                where: { cardId, data: { gte: start, lte: end } }
            });
            const totalBill = invoiceTransactions.reduce((sum, t) => {
                if (t.descricao.includes('Pagamento Fatura')) return sum; // Ignora pagamentos anteriores
                return t.tipo === 'despesa' ? sum + Number(t.valor) : sum - Number(t.valor);
            }, 0);

            if (paymentAmount > totalBill) {
                const err = new Error(`O pagamento (R$${paymentAmount.toFixed(2)}) não pode ser maior que o total da fatura (R$${totalBill.toFixed(2)}).`);
                err.statusCode = 400;
                throw err;
            }
            
            // Prevenção de pagamento duplicado
            const startOfPayDate = startOfDay(payDate);
            const endOfPayDate = endOfDay(payDate);
            const existingPayment = await tx.transaction.findFirst({
                where: {
                    accountId: accountId,
                    cardId: null, // Pagamento sai da conta
                    descricao: `Pagamento Fatura ${card.nome}`,
                    data: { gte: startOfPayDate, lte: endOfPayDate },
                    valor: paymentAmount,
                }
            });
            
            if (existingPayment) {
                 const err = new Error(`Um pagamento idêntico já foi registrado hoje para este cartão.`);
                 err.statusCode = 409; // Conflict
                 throw err;
            }


            // Cria a despesa na conta de origem
            const expenseTransaction = await tx.transaction.create({
                data: {
                    userId, accountId,
                    descricao: `Pagamento Fatura ${card.nome}`,
                    valor: paymentAmount, data: payDate, tipo: 'despesa',
                    pago: true, metodoPagamento: 'debito', categoryId: pagamentoFaturaCategoryId,
                }
            });

            // Cria a receita no cartão para abater o saldo
            const incomeTransaction = await tx.transaction.create({
                data: {
                    userId, cardId,
                    descricao: `Pagamento Fatura`,
                    valor: paymentAmount, data: payDate, tipo: 'receita',
                    pago: true, metodoPagamento: 'credito', categoryId: pagamentoFaturaCategoryId,
                    isInvoicePayment: true,
                }
            });

            // Verifica se houve pagamento parcial e se precisa aplicar juros
            const remainingBalance = totalBill - paymentAmount;
            if (remainingBalance > 0 && card.jurosRotativo && card.jurosRotativo > 0) {
                const interestAmount = remainingBalance * (card.jurosRotativo / 100);
                
                await tx.transaction.create({
                    data: {
                        userId, cardId,
                        descricao: `Juros do Rotativo - Fatura ${format(start, 'MMM/yy')}`,
                        valor: interestAmount,
                        data: setDate(addMonths(new Date(), 1), card.diaVencimento), // Juros lançados no vencimento da *próxima* fatura
                        tipo: 'despesa', pago: true, metodoPagamento: 'credito',
                        categoryId: jurosCategoryId,
                    }
                });
            }

            await CardBalanceService.recalculateCardSummary(cardId, tx);
            return { expenseTransaction, incomeTransaction };
        });
    }
}

export default TransactionService;
