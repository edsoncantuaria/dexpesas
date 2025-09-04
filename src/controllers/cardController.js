
// src/controllers/cardController.js
import { PrismaClient } from '@prisma/client';
import { setDate } from 'date-fns';
import AuditService from '../services/auditService.js';
import TransactionService from '../services/transactionService.js';
import { getInvoicePeriod } from '../utils/date-helpers.js';

const prisma = new PrismaClient();


class CardController {
    async getAllCards(req, res, next) {
        const userId = req.user.id;
        try {
            // 1. Busca todos os cartões do usuário.
            const cards = await prisma.card.findMany({
                where: { userId: userId },
                orderBy: { nome: 'asc' } 
            });

            if (cards.length === 0) {
                return res.json([]);
            }

            const cardIds = cards.map(c => c.id);

            // 2. Otimização Máxima: 1 única consulta para buscar todas as somas de transações
            const transactionsSums = await prisma.transaction.groupBy({
                by: ['cardId', 'tipo'], // Agrupa por cartão E por tipo
                where: { cardId: { in: cardIds } },
                _sum: { valor: true },
            });

            // Processa os resultados em memória
            const receitasMap = new Map();
            const despesasMap = new Map();

            transactionsSums.forEach(group => {
                if (group.tipo === 'receita') {
                    receitasMap.set(group.cardId, group._sum.valor || 0);
                } else {
                    despesasMap.set(group.cardId, group._sum.valor || 0);
                }
            });

            // 3. Calcula o saldo devedor em memória para cada cartão.
            const cardsWithInvoice = cards.map((card) => {
                const totalDespesas = Number(despesasMap.get(card.id)) || 0;
                const totalReceitas = Number(receitasMap.get(card.id)) || 0;
                const saldoFatura = totalDespesas - totalReceitas;

                const bestDayToBuy = setDate(new Date(), card.diaFechamento + 1);

                return { 
                    ...card, 
                    saldoFatura,
                    bestDayToBuy: bestDayToBuy.toISOString()
                };
            });

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
            const result = await TransactionService.handleBillPayment(userId, cardId, accountId, parsedAmount, payDate);
            
            await AuditService.log({
                userId: req.user.id,
                action: 'PAY_CARD_BILL',
                entity: 'CARD',
                entityId: cardId,
                details: {
                    cardId,
                    accountId,
                    amount: parsedAmount,
                    transactionsCreated: result,
                },
                ipAddress: req.ip,
            });

            res.status(201).json({ message: "Fatura paga com sucesso!", data: result });
        } catch (error) {
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
