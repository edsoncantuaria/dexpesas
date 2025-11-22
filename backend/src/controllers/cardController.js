
// src/controllers/cardController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { setDate, addMonths, subMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import AuditService from '../services/auditService.js';
import TransactionService from '../services/transactionService.js';
import GamificationService from '../services/gamificationService.js';
import { getInvoicePeriod } from '../utils/date-helpers.js';
import CardBalanceService from '../services/cardBalanceService.js';
import InvoiceReconciliationService from '../services/invoiceReconciliationService.js';
import minioClient from '../config/minioClient.js';
import config from '../config/config.js';
import ReconciliationService from '../services/reconciliationService.js';

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
        const { amount, accountId, paymentDate, paymentType } = req.body; // paymentType: 'total', 'minimum', 'custom'
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
                        paymentType: paymentType || 'custom', // Log payment type
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

            // Ajuste para faturas que fecham no mês anterior ao vencimento
            if (card.diaVencimento < card.diaFechamento) {
                referenceDate = subMonths(referenceDate, 1);
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

    /**
     * GET /cards/:cardId/invoices/history
     * Retorna histórico de faturas do cartão
     */
    async getInvoiceHistory(req, res, next) {
        const { cardId } = req.params;
        const userId = req.user.id;
        const { months = 12 } = req.query; // Quantos meses para trás

        try {
            const { getInvoicePeriod } = await import('../utils/date-helpers.js');

            // Buscar cartão
            const card = await prisma.card.findFirst({
                where: { id: cardId, userId }
            });

            if (!card) {
                return res.status(404).json({ message: 'Cartão não encontrado' });
            }

            // Buscar primeira transação para determinar início do histórico
            const firstTransaction = await prisma.transaction.findFirst({
                where: { cardId },
                orderBy: { data: 'asc' },
                select: { data: true }
            });

            if (!firstTransaction) {
                // Sem transações, retornar apenas mês atual
                const today = new Date();
                const { start, end } = getInvoicePeriod(card, today);
                return res.json([{
                    month: today.toISOString().slice(0, 7),
                    year: today.getFullYear(),
                    monthNumber: today.getMonth() + 1,
                    period: { start, end },
                    dueDate: new Date(card.diaVencimento),
                    status: 'open',
                    totalAmount: 0,
                    paidAmount: 0,
                    balance: 0,
                    paymentDate: null
                }]);
            }

            // Gerar lista de meses desde primeira transação até hoje
            const today = new Date();
            const startDate = new Date(firstTransaction.data);
            const history = [];

            let currentDate = new Date(today);
            const maxMonths = parseInt(months);
            let monthCount = 0;

            // Ir retrocedendo mês a mês
            while (currentDate >= startDate && monthCount < maxMonths) {
                const { start, end } = getInvoicePeriod(card, currentDate);

                // Buscar transações deste período
                const transactions = await prisma.transaction.findMany({
                    where: {
                        cardId,
                        data: {
                            gte: start,
                            lte: end
                        }
                    }
                });

                const expenses = transactions
                    .filter(t => t.tipo === 'despesa')
                    .reduce((sum, t) => sum + Number(t.valor), 0);

                const payments = transactions
                    .filter(t => t.tipo === 'receita')
                    .reduce((sum, t) => sum + Number(t.valor), 0);

                const balance = expenses - payments;

                // Determinar status
                let status = 'open';
                let paymentDate = null;

                if (balance <= 0 && expenses > 0) {
                    status = 'paid';
                    // Buscar data do último pagamento
                    const lastPayment = transactions
                        .filter(t => t.tipo === 'receita')
                        .sort((a, b) => new Date(b.data) - new Date(a.data))[0];
                    if (lastPayment) {
                        paymentDate = lastPayment.data;
                    }
                } else if (end < today && balance > 0) {
                    status = 'overdue';
                }

                history.push({
                    month: currentDate.toISOString().slice(0, 7),
                    year: currentDate.getFullYear(),
                    monthNumber: currentDate.getMonth() + 1,
                    period: { start, end },
                    dueDate: new Date(card.diaVencimento),
                    status,
                    totalAmount: expenses,
                    paidAmount: payments,
                    balance,
                    paymentDate,
                    transactionCount: transactions.length
                });

                // Voltar 1 mês
                currentDate.setMonth(currentDate.getMonth() - 1);
                monthCount++;
            }

            res.json(history);

        } catch (error) {
            console.error('Erro ao buscar histórico:', error);
            next(error);
        }
    }
    /**
     * GET /cards/:id/analytics/spending
     * Gastos por categoria no mês atual (ou especificado)
     */
    async getSpendingAnalysis(req, res, next) {
        const { cardId } = req.params;
        const userId = req.user.id;
        const { month } = req.query; // YYYY-MM

        try {
            const card = await prisma.card.findFirst({ where: { id: cardId, userId } });
            if (!card) return res.status(404).json({ message: 'Cartão não encontrado' });

            let referenceDate = new Date();
            if (month) {
                referenceDate = new Date(`${month}-15`);
            }

            // Ajuste para faturas que fecham no mês anterior ao vencimento
            if (card.diaVencimento < card.diaFechamento) {
                referenceDate = subMonths(referenceDate, 1);
            }

            const { start, end } = getInvoicePeriod(card, referenceDate);

            const expenses = await prisma.transaction.findMany({
                where: {
                    cardId: cardId,
                    tipo: 'despesa',
                    data: { gte: start, lte: end }
                },
                include: {
                    category: {
                        select: { nome: true, icon: true, label: true }
                    }
                }
            });

            const byCategory = {};
            let total = 0;

            expenses.forEach(t => {
                const catId = t.categoryId || 'uncategorized';
                const catName = t.category?.nome || 'Sem Categoria';
                // Use label as color if it looks like a hex code, otherwise generate or use default
                const catColor = t.category?.label || '#94a3b8';

                if (!byCategory[catId]) {
                    byCategory[catId] = {
                        id: catId,
                        name: catName,
                        color: catColor,
                        value: 0,
                        count: 0
                    };
                }

                const val = Number(t.valor);
                byCategory[catId].value += val;
                byCategory[catId].count += 1;
                total += val;
            });

            const data = Object.values(byCategory)
                .map(cat => ({
                    ...cat,
                    percentage: total > 0 ? (cat.value / total) * 100 : 0
                }))
                .sort((a, b) => b.value - a.value);

            res.json({
                period: { start, end },
                total,
                categories: data
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /cards/:id/analytics/history
     * Evolução de gastos dos últimos 6 meses
     */
    async getMonthlyHistory(req, res, next) {
        const { cardId } = req.params;
        const userId = req.user.id;

        try {
            const card = await prisma.card.findFirst({ where: { id: cardId, userId } });
            if (!card) return res.status(404).json({ message: 'Cartão não encontrado' });

            const history = [];
            const today = new Date();

            // Loop last 6 months
            for (let i = 5; i >= 0; i--) {
                const date = subMonths(today, i);
                const { start, end } = getInvoicePeriod(card, date);

                const expenses = await prisma.transaction.aggregate({
                    _sum: { valor: true },
                    where: {
                        cardId: cardId,
                        tipo: 'despesa',
                        data: { gte: start, lte: end }
                    }
                });

                history.push({
                    month: format(date, 'MMM/yy'), // Ex: Nov/25
                    fullDate: format(date, 'yyyy-MM'),
                    amount: Number(expenses._sum.valor) || 0
                });
            }

            // Calculate variations
            const historyWithVariation = history.map((item, index) => {
                let variation = 0;
                if (index > 0) {
                    const prev = history[index - 1].amount;
                    if (prev > 0) {
                        variation = ((item.amount - prev) / prev) * 100;
                    } else if (item.amount > 0) {
                        variation = 100;
                    }
                }
                return { ...item, variation };
            });

            res.json(historyWithVariation);

        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /cards/:id/analytics/projection
     * Projeção de faturas futuras (3 meses)
     */
    async getInvoiceProjection(req, res, next) {
        const { cardId } = req.params;
        const userId = req.user.id;

        try {
            const card = await prisma.card.findFirst({ where: { id: cardId, userId } });
            if (!card) return res.status(404).json({ message: 'Cartão não encontrado' });

            const projection = [];
            const today = new Date();

            // Project next 3 months
            for (let i = 1; i <= 3; i++) {
                const date = addMonths(today, i);
                const { start, end } = getInvoicePeriod(card, date);

                // 1. Installments
                const installments = await prisma.transaction.aggregate({
                    _sum: { valor: true },
                    where: {
                        cardId: cardId,
                        installment: true,
                        data: { gte: start, lte: end }
                    }
                });

                // 2. Recurring (Active)
                // This is a simplified projection for recurring. 
                // Ideally we should reuse TransactionController logic but that's complex to import/couple.
                // We'll fetch active recurring transactions and sum them up assuming they repeat monthly.
                const recurring = await prisma.transaction.findMany({
                    where: {
                        cardId: cardId,
                        recurrenceType: { not: null },
                        // recurrenceEndDate check removed as per previous fix
                        data: { lte: end } // Started before end of period
                    }
                });

                // Filter recurring that actually fall in this period based on day of month?
                // For simplicity in this widget, we assume monthly recurrence adds to every future month.
                // A more robust logic would check the exact day.
                const recurringSum = recurring.reduce((sum, t) => sum + Number(t.valor), 0);

                const total = (Number(installments._sum.valor) || 0) + recurringSum;

                projection.push({
                    month: format(date, 'MMM/yy'),
                    fullDate: format(date, 'yyyy-MM'),
                    amount: total,
                    isEstimated: true
                });
            }

            res.json(projection);

        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /cards/:cardId/invoice/reconcile
     * Upload de OFX/CSV para reconciliação de fatura
     */
    async uploadInvoiceStatement(req, res, next) {
        const { cardId } = req.params;
        const userId = req.user.id;
        const { invoiceMonth } = req.body; // YYYY-MM
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'Arquivo OFX/CSV é obrigatório' });
        }

        if (!invoiceMonth) {
            return res.status(400).json({ message: 'Mês de referência da fatura é obrigatório (formato YYYY-MM)' });
        }

        try {
            // Verificar se cartão existe e pertence ao usuário
            const card = await prisma.card.findFirst({
                where: { id: cardId, userId }
            });

            if (!card) {
                return res.status(404).json({ message: 'Cartão não encontrado' });
            }

            // Salvar arquivo no MinIO
            const bucketName = config.minio.bucketName;
            const objectName = `reconciliation-invoices/${cardId}/${invoiceMonth}-${Date.now()}-${file.originalname}`;

            // Verificar se bucket existe, criar se não
            const bucketExists = await minioClient.bucketExists(bucketName);
            if (!bucketExists) {
                await minioClient.makeBucket(bucketName);
            }

            // Upload do arquivo
            await minioClient.putObject(bucketName, objectName, file.buffer, file.size);
            const filePath = objectName; // O ReconciliationService espera apenas objectName, não bucketName/objectName

            // Determinar tipo de arquivo
            const fileType = file.originalname.toLowerCase().endsWith('.ofx') ? 'OFX' : 'CSV';

            // Criar data de referência para cálculo do período
            let referenceDate = new Date(`${invoiceMonth}-15`);

            // Ajuste para faturas que fecham no mês anterior ao vencimento
            if (card.diaVencimento < card.diaFechamento) {
                referenceDate = subMonths(referenceDate, 1);
            }

            // Criar registro de reconciliação
            const reconciliation = await prisma.reconciliation.create({
                data: {
                    userId,
                    cardId,
                    filePath,
                    fileType,
                    status: 'PROCESSING',
                    invoiceMonth,
                    replaceMode: true
                }
            });

            // Processar arquivo em background
            try {
                // Processar baseado no tipo
                await ReconciliationService.processStatementFile(
                    filePath, // objectName - o service baixa do MinIO
                    reconciliation.id,
                    userId,
                    fileType,
                    null // mapping - não usado para OFX
                );

                // Atualizar status para PENDING_REVIEW após processamento
                await prisma.reconciliation.update({
                    where: { id: reconciliation.id },
                    data: { status: 'PENDING_REVIEW' }
                });

                // Calcular totais para validação
                const importedTransactions = await prisma.importedTransaction.findMany({
                    where: { reconciliationId: reconciliation.id }
                });

                const ofxTotal = importedTransactions
                    .filter(t => t.type === 'DEBIT')
                    .reduce((sum, t) => sum + Number(t.amount), 0);

                // Validar valores
                const validation = await InvoiceReconciliationService.validateInvoiceMatch(
                    cardId,
                    invoiceMonth,
                    ofxTotal,
                    referenceDate
                );

                res.json({
                    reconciliation,
                    validation,
                    importedCount: importedTransactions.length,
                    message: validation.isValid
                        ? 'Arquivo processado com sucesso! Valores conferem.'
                        : 'Arquivo processado, mas os valores não conferem.'
                });

            } catch (processingError) {
                // Marcar reconciliação como falhada
                await prisma.reconciliation.update({
                    where: { id: reconciliation.id },
                    data: { status: 'FAILED' }
                });
                throw processingError;
            }

        } catch (error) {
            console.error('Erro no upload de reconciliação de fatura:', error);
            next(error);
        }
    }

    /**
     * GET /cards/:cardId/invoice/reconciliation-status
     * Busca status de reconciliação em andamento
     */
    async getInvoiceReconciliationStatus(req, res, next) {
        const { cardId } = req.params;
        const userId = req.user.id;
        const { month } = req.query; // YYYY-MM

        if (!month) {
            return res.status(400).json({ message: 'Mês de referência é obrigatório (query param: month)' });
        }

        try {
            const reconciliation = await InvoiceReconciliationService.getInvoiceReconciliationStatus(
                cardId,
                month,
                userId
            );

            if (!reconciliation) {
                return res.json({ reconciliation: null, message: 'Nenhuma reconciliação em andamento' });
            }

            // Buscar cartão para obter dias de fechamento/vencimento
            const card = await prisma.card.findUnique({ where: { id: cardId } });
            if (!card) return res.status(404).json({ message: 'Cartão não encontrado' });

            // Calcular validação
            let referenceDate = new Date(`${month}-15`);

            // Ajuste para faturas que fecham no mês anterior ao vencimento
            if (card.diaVencimento < card.diaFechamento) {
                referenceDate = subMonths(referenceDate, 1);
            }
            const ofxTotal = reconciliation.importedTransactions
                .filter(t => t.type === 'DEBIT')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const validation = await InvoiceReconciliationService.validateInvoiceMatch(
                cardId,
                month,
                ofxTotal,
                referenceDate
            );

            res.json({
                reconciliation,
                validation,
                importedCount: reconciliation.importedTransactions.length
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /cards/:cardId/invoice/finalize-reconciliation
     * Finaliza reconciliação: deleta despesas manuais e importa do OFX
     */
    async finalizeInvoiceReconciliation(req, res, next) {
        const { cardId } = req.params;
        const userId = req.user.id;
        const { reconciliationId, invoiceMonth } = req.body;

        if (!reconciliationId || !invoiceMonth) {
            return res.status(400).json({ message: 'reconciliationId e invoiceMonth são obrigatórios' });
        }

        try {
            // Verificar reconciliação
            const reconciliation = await prisma.reconciliation.findFirst({
                where: {
                    id: reconciliationId,
                    userId,
                    cardId,
                    invoiceMonth,
                    replaceMode: true,
                    status: 'PENDING_REVIEW'
                }
            });

            if (!reconciliation) {
                return res.status(404).json({ message: 'Reconciliação não encontrada ou já finalizada' });
            }

            // Validar novamente antes de finalizar
            const card = await prisma.card.findUnique({ where: { id: cardId } });
            if (!card) return res.status(404).json({ message: 'Cartão não encontrado' });

            let referenceDate = new Date(`${invoiceMonth}-15`);

            // Ajuste para faturas que fecham no mês anterior ao vencimento
            if (card.diaVencimento < card.diaFechamento) {
                referenceDate = subMonths(referenceDate, 1);
            }
            const importedTransactions = await prisma.importedTransaction.findMany({
                where: { reconciliationId }
            });

            const ofxTotal = importedTransactions
                .filter(t => t.type === 'DEBIT')
                .reduce((sum, t) => sum + Number(t.amount), 0);

            const validation = await InvoiceReconciliationService.validateInvoiceMatch(
                cardId,
                invoiceMonth,
                ofxTotal,
                referenceDate
            );

            if (!validation.isValid) {
                return res.status(400).json({
                    message: 'Os valores não conferem. Diferença detectada.',
                    validation
                });
            }

            // Executar substituição
            const result = await InvoiceReconciliationService.replaceInvoiceTransactions(
                reconciliationId,
                cardId,
                invoiceMonth,
                referenceDate
            );
            // Criar transações a partir das importadas
            const period = getInvoicePeriod(card, referenceDate);

            for (const imported of importedTransactions) {
                if (imported.type === 'DEBIT') {
                    const transactionData = {
                        userId,
                        cardId,
                        descricao: imported.description,
                        valor: imported.amount,
                        data: imported.date,
                        tipo: 'despesa',
                        metodoPagamento: 'credito',
                        pago: false // Despesas do cartão só ficam pagas quando a fatura é paga
                    };

                    // Verificar se tem metadados de parcelamento
                    if (imported.metadata) {
                        const metadata = typeof imported.metadata === 'string'
                            ? JSON.parse(imported.metadata)
                            : imported.metadata;

                        if (metadata.installmentNumber && metadata.totalInstallments) {
                            transactionData.installment = true;
                            transactionData.installmentNumber = metadata.installmentNumber;
                            transactionData.totalInstallments = metadata.totalInstallments;
                            transactionData.installmentId = metadata.installmentGroupId;

                            // AJUSTE CRÍTICO: Para parcelas, a data do OFX muitas vezes é a data da compra original.
                            // Forçamos a data para o fechamento da fatura atual para garantir que caia no mês correto.
                            transactionData.data = period.end;
                        }
                    }

                    await prisma.transaction.create({
                        data: transactionData
                    });
                }
            }

            // Recalcular saldo do cartão
            await CardBalanceService.recalculateCardSummary(cardId);

            // Auditoria
            await AuditService.log({
                userId,
                action: 'FINALIZE_INVOICE_RECONCILIATION',
                entity: 'CARD',
                entityId: cardId,
                details: {
                    reconciliationId,
                    invoiceMonth,
                    deletedCount: result.deletedCount,
                    importedCount: result.importedCount
                },
                ipAddress: req.ip
            });

            res.json({
                message: 'Reconciliação de fatura finalizada com sucesso!',
                result
            });

        } catch (error) {
            console.error('Erro ao finalizar reconciliação:', error);
            next(error);
        }
    }

    /**
     * DELETE /cards/:cardId/invoice/cancel-reconciliation/:reconciliationId
     * Cancela reconciliação e remove dados importados
     */
    async cancelInvoiceReconciliation(req, res, next) {
        const { cardId, reconciliationId } = req.params;
        const userId = req.user.id;

        try {
            await InvoiceReconciliationService.cancelInvoiceReconciliation(reconciliationId, userId);

            await AuditService.log({
                userId,
                action: 'CANCEL_INVOICE_RECONCILIATION',
                entity: 'CARD',
                entityId: cardId,
                details: { reconciliationId },
                ipAddress: req.ip
            });

            res.json({ message: 'Reconciliação cancelada com sucesso' });

        } catch (error) {
            next(error);
        }
    }

}

export default new CardController();
