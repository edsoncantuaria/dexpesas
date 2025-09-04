
// src/controllers/cardController.js
import { PrismaClient } from '@prisma/client';
import { setDate } from 'date-fns';
import AuditService from '../services/auditService.js';
import TransactionService from '../services/transactionService.js';
import GamificationService from '../services/gamificationService.js';
import { getInvoicePeriod } from '../utils/date-helpers.js';

const prisma = new PrismaClient();


class CardController {
    async getAllCards(req, res, next) {
        const userId = req.user.id;
        try {
            const cards = await prisma.card.findMany({
                where: { userId: userId },
                orderBy: { nome: 'asc' } 
            });

            if (cards.length === 0) {
                return res.json([]);
            }

            const cardsWithInvoice = await Promise.all(
                cards.map(async (card) => {
                    const { start, end } = getInvoicePeriod(card, new Date());
                    
                    const invoiceTransactions = await prisma.transaction.findMany({
                        where: {
                            cardId: card.id,
                            data: {
                                gte: start,
                                lte: end,
                            },
                        },
                    });

                    const totalDespesasFatura = invoiceTransactions
                        .filter(t => t.tipo === 'despesa')
                        .reduce((sum, t) => sum + Number(t.valor), 0);

                    const totalReceitasFatura = invoiceTransactions
                        .filter(t => t.tipo === 'receita')
                        .reduce((sum, t) => sum + Number(t.valor), 0);

                    const saldoFatura = totalDespesasFatura - totalReceitasFatura;
                    const bestDayToBuy = setDate(new Date(), card.diaFechamento + 1);

                    return { 
                        ...card, 
                        saldoFatura,
                        bestDayToBuy: bestDayToBuy.toISOString()
                    };
                })
            );

            res.json(cardsWithInvoice);
        } catch (error) {
            next(error);
        }
    }

    async getCardById(req, res, next) {
        try {
            const { cardId } = req.params;
            const card = await prisma.card.findFirst({
                where: { id: cardId, userId: req.user.id },
            });

            if (!card) {
                const err = new Error('Cartão não encontrado.');
                err.statusCode = 404;
                return next(err);
            }

             // O melhor dia de compra é sempre calculado com base na data atual.
            const bestDayToBuy = setDate(new Date(), card.diaFechamento + 1);
            
            // Calcula o saldo devedor total do cartão para obter o limite disponível correto
            const despesas = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: { cardId, tipo: 'despesa' }
            });
            const receitas = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: { cardId, tipo: 'receita' }
            });
            const totalDespesas = Number(despesas._sum.valor) || 0;
            const totalReceitas = Number(receitas._sum.valor) || 0;
            const saldoFatura = totalDespesas - totalReceitas;


            const cardWithDetails = { ...card, bestDayToBuy: bestDayToBuy.toISOString(), saldoFatura };


            res.json(cardWithDetails);
        } catch (error) {
            next(error);
        }
    }

    async createCard(req, res, next) {
        try {
            const { nome, limite, diaFechamento, diaVencimento, bandeira, rewardsType, rewardsProgram, jurosRotativo, rewardsConversionRate, currencyForConversion, paymentAccountId } = req.body;
            const newCard = await prisma.card.create({
                data: {
                    nome,
                    limite,
                    diaFechamento,
                    diaVencimento,
                    bandeira,
                    rewardsType,
                    rewardsProgram,
                    rewardsConversionRate,
                    currencyForConversion,
                    jurosRotativo,
                    paymentAccountId: paymentAccountId === 'none' ? null : paymentAccountId,
                    userId: req.user.id,
                }
            });
            
            await AuditService.log({
                userId: req.user.id,
                action: 'CREATE_CARD',
                entity: 'CARD',
                entityId: newCard.id,
                details: { after: newCard },
                ipAddress: req.ip,
            });

            res.status(201).json(newCard);
        } catch (error) {
            next(error);
        }
    }

    async updateCard(req, res, next) {
        try {
            const { id } = req.params;
            const { nome, limite, diaFechamento, diaVencimento, bandeira, rewardsType, rewardsProgram, jurosRotativo, rewardsConversionRate, currencyForConversion, paymentAccountId } = req.body;
            
            const originalCard = await prisma.card.findUnique({ where: { id: id, userId: req.user.id }});
            if (!originalCard) {
                return res.status(404).json({ message: 'Cartão não encontrado.' });
            }

            const updatedCard = await prisma.card.update({
                where: { id: id, userId: req.user.id },
                data: { 
                    nome, 
                    limite, 
                    diaFechamento, 
                    diaVencimento, 
                    bandeira, 
                    rewardsType, 
                    rewardsProgram, 
                    jurosRotativo, 
                    rewardsConversionRate, 
                    currencyForConversion,
                    paymentAccountId: paymentAccountId === 'none' ? null : paymentAccountId,
                }
            });

            await AuditService.log({
                userId: req.user.id,
                action: 'UPDATE_CARD',
                entity: 'CARD',
                entityId: updatedCard.id,
                details: { before: originalCard, after: updatedCard },
                ipAddress: req.ip,
            });

            res.json(updatedCard);
        } catch (error) {
            next(error);
        }
    }

    async deleteCard(req, res, next) {
        try {
            const { id } = req.params;
            
            const cardToDelete = await prisma.card.findUnique({ where: { id: id, userId: req.user.id }});
            if (!cardToDelete) {
                return res.status(404).json({ message: 'Cartão não encontrado.' });
            }

            await prisma.card.delete({ where: { id: id, userId: req.user.id } });

            await AuditService.log({
                userId: req.user.id,
                action: 'DELETE_CARD',
                entity: 'CARD',
                entityId: id,
                details: { before: cardToDelete },
                ipAddress: req.ip,
            });

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async payCardBill(req, res, next) {
        const { cardId } = req.params;
        const { amount, accountId, paymentDate } = req.body;
        const userId = req.user.id;
        const parsedAmount = parseFloat(amount);
        const payDate = paymentDate ? new Date(paymentDate) : new Date();

        if (!parsedAmount || parsedAmount <= 0) {
             const err = new Error('O valor do pagamento deve ser positivo.');
             err.statusCode = 400;
             return next(err);
        }
        
         if (!accountId) {
             const err = new Error('A conta de origem do pagamento é obrigatória.');
             err.statusCode = 400;
             return next(err);
        }

        try {
            const result = await prisma.$transaction(async (tx) => {
                 // **NOVO**: Validação de saldo da conta de origem
                const sourceAccount = await tx.account.findUnique({ where: { id: accountId } });
                if (!sourceAccount) {
                    throw { statusCode: 404, message: 'Conta de origem não encontrada.' };
                }

                const receitas = await tx.transaction.aggregate({ _sum: { valor: true }, where: { accountId: accountId, tipo: 'receita', pago: true } });
                const despesas = await tx.transaction.aggregate({ _sum: { valor: true }, where: { accountId: accountId, tipo: 'despesa', pago: true } });
                const accountBalance = Number(sourceAccount.saldoInicial) + (receitas._sum.valor || 0) - (despesas._sum.valor || 0);

                if (accountBalance < parsedAmount) {
                    throw { statusCode: 400, message: 'Saldo insuficiente na conta de origem para pagar a fatura.' };
                }
                
                // O restante da lógica permanece
                const paymentResult = await TransactionService.handleBillPayment(userId, cardId, accountId, parsedAmount, payDate, tx);
                
                await GamificationService.triggerXpEvent(tx, userId, 'BILL_PAID', { amount: parsedAmount });
                await GamificationService.dealDamageToBoss(tx, userId, parsedAmount);

                await AuditService.log({
                    userId: req.user.id,
                    action: 'PAY_CARD_BILL',
                    entity: 'CARD',
                    entityId: cardId,
                    details: {
                        cardId,
                        accountId,
                        amount: parsedAmount,
                        transactionsCreated: paymentResult,
                    },
                    ipAddress: req.ip,
                });

                return paymentResult;
            });


            res.status(201).json({ message: "Fatura paga com sucesso!", data: result });
        } catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            next(error);
        }
    }

    // Melhoria: Nova rota para buscar lançamentos futuros (parcelas)
    async getFutureInstallments(req, res, next) {
        const { cardId } = req.params;
        const userId = req.user.id;
        try {
            const futureInstallments = await prisma.transaction.findMany({
                where: {
                    userId,
                    cardId,
                    installment: true,
                    // Garante que a data da parcela seja no futuro
                    data: {
                        gt: new Date(), 
                    },
                },
                orderBy: {
                    data: 'asc',
                },
            });
            res.json(futureInstallments);
        } catch (error) {
            next(error);
        }
    }
}

export default new CardController();
