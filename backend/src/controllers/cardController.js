
// src/controllers/cardController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { setDate } from 'date-fns';
import AuditService from '../services/auditService.js';
import TransactionService from '../services/transactionService.js';
import GamificationService from '../services/gamificationService.js';
import { getInvoicePeriod } from '../utils/date-helpers.js';
import CardBalanceService from '../services/cardBalanceService.js';

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

                    // 1. Transactions for CURRENT Invoice (for display)
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

                    // 2. Global Balance for Available Limit (All time)
                    const globalExpenses = await prisma.transaction.aggregate({
                        _sum: { valor: true },
                        where: { cardId: card.id, tipo: 'despesa' }
                    });
                    const globalPayments = await prisma.transaction.aggregate({
                        _sum: { valor: true },
                        where: { cardId: card.id, tipo: 'receita' }
                    });

                    const totalUsed = (Number(globalExpenses._sum.valor) || 0) - (Number(globalPayments._sum.valor) || 0);

                    // Best day to buy is the day after closing date
                    const bestDayToBuy = new Date(end);
                    bestDayToBuy.setDate(bestDayToBuy.getDate() + 1);

                    return {
                        ...card,
                        currentInvoiceAmount: totalUsed, // Global balance for card list
                        availableLimit: Number(card.limite) - totalUsed,
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
            const { end } = getInvoicePeriod(card, new Date());
            const bestDayToBuy = new Date(end);
            bestDayToBuy.setDate(bestDayToBuy.getDate() + 1);

            // Calcula o saldo da fatura ATUAL
            const { start: invoiceStart, end: invoiceEnd } = getInvoicePeriod(card, new Date());
            const invoiceExpenses = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: { cardId, tipo: 'despesa', data: { gte: invoiceStart, lte: invoiceEnd } }
            });
            const invoicePayments = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: { cardId, tipo: 'receita', data: { gte: invoiceStart, lte: invoiceEnd } }
            });
            const saldoFatura = (Number(invoiceExpenses._sum.valor) || 0) - (Number(invoicePayments._sum.valor) || 0);

            // Calcula o saldo GLOBAL para o limite disponível
            const globalExpenses = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: { cardId, tipo: 'despesa' }
            });
            const globalPayments = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: { cardId, tipo: 'receita' }
            });
            const totalUsed = (Number(globalExpenses._sum.valor) || 0) - (Number(globalPayments._sum.valor) || 0);

            const cardWithDetails = {
                ...card,
                currentInvoiceAmount: saldoFatura,
                availableLimit: Number(card.limite) - totalUsed,
                bestDayToBuy: bestDayToBuy.toISOString(),
            };


            res.json(cardWithDetails);
        } catch (error) {
            next(error);
        }
    }

    async createCard(req, res, next) {
        try {
            const {
                nome,
                limite,
                diaFechamento,
                diaVencimento,
                closingDayGap,
                bandeira,
                rewardsType,
                rewardsProgram,
                jurosRotativo,
                rewardsConversionRate,
                currencyForConversion,
                paymentAccountId,
                status = 'ACTIVE',
                lastFourDigits,
                issuer,
                billingCurrency = 'BRL',
                currentInvoiceAmount = 0,
                availableLimit,
            } = req.body;
            const newCard = await prisma.card.create({
                data: {
                    nome,
                    limite,
                    diaFechamento,
                    diaVencimento,
                    closingDayGap: closingDayGap ?? 7,
                    bandeira,
                    status,
                    rewardsType,
                    rewardsProgram,
                    rewardsConversionRate,
                    currencyForConversion,
                    jurosRotativo,
                    lastFourDigits: lastFourDigits || null,
                    issuer: issuer || null,
                    billingCurrency,
                    currentInvoiceAmount,
                    availableLimit: availableLimit ?? null,
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
            const {
                nome,
                limite,
                diaFechamento,
                diaVencimento,
                closingDayGap,
                bandeira,
                rewardsType,
                rewardsProgram,
                jurosRotativo,
                rewardsConversionRate,
                currencyForConversion,
                paymentAccountId,
                status,
                lastFourDigits,
                issuer,
                billingCurrency,
                currentInvoiceAmount,
                availableLimit,
            } = req.body;

            const originalCard = await prisma.card.findUnique({ where: { id: id, userId: req.user.id } });
            if (!originalCard) {
                return res.status(404).json({ message: 'Cartão não encontrado.' });
            }

            const updateData = {
                nome,
                limite,
                diaFechamento,
                diaVencimento,
                closingDayGap,
                bandeira,
                rewardsType,
                rewardsProgram,
                jurosRotativo,
                rewardsConversionRate,
                currencyForConversion,
                status,
                lastFourDigits: lastFourDigits ?? originalCard.lastFourDigits,
                issuer: issuer ?? originalCard.issuer,
                billingCurrency,
                currentInvoiceAmount,
                availableLimit,
                paymentAccountId: paymentAccountId === 'none' ? null : paymentAccountId,
            };
            Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

            const updatedCard = await prisma.card.update({
                where: { id: id, userId: req.user.id },
                data: updateData
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

            const cardToDelete = await prisma.card.findUnique({ where: { id: id, userId: req.user.id } });
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

                const receitas = await tx.transaction.aggregate({ _sum: { valor: true }, where: { accountId: accountId, tipo: 'receita' } });
                const despesas = await tx.transaction.aggregate({ _sum: { valor: true }, where: { accountId: accountId, tipo: 'despesa' } });
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


            await CardBalanceService.recalculateCardSummary(cardId);
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

    /**
     * GET /cards/:cardId/invoice/pdf?month=YYYY-MM
     * Gera PDF da fatura de um cartão
     */
    async generateInvoicePDF(req, res, next) {
        const { cardId } = req.params;
        const userId = req.user.id;
        const { month } = req.query; // YYYY-MM format

        try {
            // Import aqui para não carregar sempre
            const { default: PDFGeneratorService } = await import('../services/pdfGenerator.js');
            const { getInvoicePeriod } = await import('../utils/date-helpers.js');

            // Buscar cartão
            const card = await prisma.card.findFirst({
                where: { id: cardId, userId }
            });

            if (!card) {
                return res.status(404).json({ message: 'Cartão não encontrado' });
            }

            // Determinar período
            let referenceDate;
            if (month) {
                referenceDate = new Date(`${month}-15`); // Meio do mês
            } else {
                referenceDate = new Date();
            }

            const { start, end } = getInvoicePeriod(card, referenceDate);

            // Buscar transações do período
            const transactions = await prisma.transaction.findMany({
                where: {
                    cardId,
                    data: {
                        gte: start,
                        lte: end
                    }
                },
                include: {
                    categoria: {
                        select: {
                            nome: true,
                            icone: true,
                            cor: true
                        }
                    }
                },
                orderBy: {
                    data: 'asc'
                }
            });

            // Preparar dados
            const invoiceData = {
                monthLabel: month || new Date().toISOString().slice(0, 7),
                closingDate: end,
                dueDate: new Date(card.diaVencimento)
            };

            // Gerar PDF
            const pdfDoc = PDFGeneratorService.generateInvoicePDF(invoiceData, card, transactions);

            // Configurar headers
            const filename = `fatura-${card.nome.replace(/\s+/g, '-')}-${invoiceData.monthLabel}.pdf`;
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

            // Stream do PDF para response
            pdfDoc.pipe(res);
            pdfDoc.end();

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            next(error);
        }
    }
}

export default new CardController();
