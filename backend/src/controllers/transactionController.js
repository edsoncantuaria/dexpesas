// src/controllers/transactionController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { addMonths, format, startOfMonth, endOfMonth, parseISO, addWeeks, addDays, isBefore } from 'date-fns';
import NotificationService from '../services/notificationService.js';
import AutomationService from '../services/automationService.js';
import CategorizationService from '../services/categorizationService.js';
import ReconciliationService from '../services/reconciliationService.js';
import { stringify as stringifyCsv } from 'csv-stringify/sync';
import AuditService from '../services/auditService.js';
import GamificationService from '../services/gamificationService.js';
import { suggestCategoryFlow } from '../ai/flows/category-suggestion-flow.js';
import CardBalanceService from '../services/cardBalanceService.js';
import { getInvoicePeriod } from '../utils/date-helpers.js';


const prisma = new PrismaClient();

// Helper para buscar e mapear categorias
async function getCategoryMap(tx) {
    const prismaInstance = tx || prisma;
    const categories = await prismaInstance.category.findMany();
    return new Map(categories.map(cat => [cat.nome, cat.id]));
}

/**
 * Helper interno para encapsular a lógica de criação de transações.
 */
async function createTransactionLogic(tx, userId, data) {
    const {
        descricao, valor, tipo, data: transactionDateStr, categoryId, metodoPagamento, pago,
        contaCartaoId, entryType, totalInstallments,
        withInterest, interestRate, recurrenceType, attachmentUrl, notes,
        tags
    } = data;
    
    const valorOriginal = parseFloat(valor);
    const transactionDate = new Date(transactionDateStr);

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) {
        const err = new Error('Usuário não encontrado.');
        err.statusCode = 404;
        throw err;
    }
    
    let finalCategoryId = categoryId;
    
    if (!finalCategoryId && tipo === 'despesa') {
        const categoryNameFromRule = await CategorizationService.applyRulesAndGetName(userId, descricao);
        if(categoryNameFromRule) {
            const category = await tx.category.findFirst({ where: { nome: categoryNameFromRule }});
            if (category) finalCategoryId = category.id;
        }
    }

    if (!finalCategoryId) {
        const categoryIdMap = await getCategoryMap(tx);
        finalCategoryId = tipo === 'receita' ? categoryIdMap.get('OutrasReceitas') : categoryIdMap.get('Outros');
    }

    if (!finalCategoryId) {
        const error = new Error('Categoria padrão não encontrada. Execute o seed do banco.');
        error.statusCode = 500;
        throw error;
    }

    let accountId = ['debito', 'pix', 'dinheiro'].includes(metodoPagamento) ? contaCartaoId : (tipo === 'receita' ? contaCartaoId : null);
    let cardId = metodoPagamento === 'credito' ? contaCartaoId : undefined;
    
    const tagsToConnect = tags && tags.length > 0 ? { connect: tags.map((tagId) => ({ id: tagId })) } : undefined;

    // **NOVO**: Validação de Saldo para qualquer despesa de débito/pix
    if (tipo === 'despesa' && pago && ['debito', 'pix'].includes(metodoPagamento) && accountId) {
        const account = await tx.account.findUnique({ where: { id: accountId } });
        const receitas = await tx.transaction.aggregate({ _sum: { valor: true }, where: { accountId: accountId, tipo: 'receita' } });
        const despesas = await tx.transaction.aggregate({ _sum: { valor: true }, where: { accountId: accountId, tipo: 'despesa' } });
        const currentBalance = Number(account.saldoInicial) + (receitas._sum.valor || 0) - (despesas._sum.valor || 0);

        if (currentBalance < valorOriginal) {
            throw { statusCode: 400, message: `Saldo insuficiente na conta "${account.nome}".` };
        }
    }
    
    if (metodoPagamento === 'credito' && tipo === 'despesa') {
        const card = await tx.card.findFirst({ where: { id: contaCartaoId, userId: userId }});
        if (!card) {
            const error = new Error('Cartão de crédito não encontrado.'); error.statusCode = 404; throw error;
        }
        const valorDaCompra = (withInterest && interestRate > 0 && totalInstallments > 1) ? ((valorOriginal * (interestRate / 100)) / (1 - Math.pow(1 + (interestRate / 100), -totalInstallments))) * totalInstallments : valorOriginal;
        const { start: invoiceStart, end: invoiceEnd } = getInvoicePeriod(card, transactionDate);
        const [periodExpenses, periodPayments] = await Promise.all([
            tx.transaction.aggregate({
                _sum: { valor: true },
                where: {
                    cardId: card.id,
                    tipo: 'despesa',
                    metodoPagamento: 'credito',
                    data: { gte: invoiceStart, lte: invoiceEnd },
                },
            }),
            tx.transaction.aggregate({
                _sum: { valor: true },
                where: {
                    cardId: card.id,
                    tipo: 'receita',
                    isInvoicePayment: true,
                    data: { gte: invoiceStart, lte: invoiceEnd },
                },
            }),
        ]);
        const saldoFatura = Number(periodExpenses._sum.valor || 0) - Number(periodPayments._sum.valor || 0);
        const limiteDisponivel = Number(card.availableLimit ?? (parseFloat(card.limite) - saldoFatura));
        if (valorDaCompra > limiteDisponivel) {
            const error = new Error('Limite do cartão de crédito excedido.'); error.statusCode = 403;
            error.details = { message: 'Limite do cartão de crédito excedido.', limiteDisponivel: limiteDisponivel.toFixed(2), valorExcedido: (valorDaCompra - limiteDisponivel).toFixed(2) };
            throw error;
        }
    }
    
    if (entryType === 'recurring' && recurrenceType && recurrenceType !== 'NONE') {
        const recorrenciaId = `recur-${Date.now()}`;
        const transactionsToCreate = [];
        const projectionCount = user.futureProjectionCount || 1;

        for (let i = 0; i < projectionCount; i++) {
            let nextDate;
            switch(recurrenceType) {
                case 'WEEKLY': nextDate = addWeeks(transactionDate, i); break;
                case 'BIWEEKLY': nextDate = addWeeks(transactionDate, i * 2); break;
                case 'MONTHLY': nextDate = addMonths(transactionDate, i); break;
                case 'BIMONTHLY': nextDate = addMonths(transactionDate, i * 2); break;
                case 'TRIMONTHLY': nextDate = addMonths(transactionDate, i * 3); break;
                case 'SEMIANNUALLY': nextDate = addMonths(transactionDate, i * 6); break;
                default: nextDate = addMonths(transactionDate, i);
            }
            
            const transactionData = {
                descricao, valor: valorOriginal, data: nextDate, tipo, 
                categoryId: finalCategoryId, metodoPagamento, accountId, cardId, userId, 
                recurrenceType, recorrenciaId, 
                pago: i === 0 ? pago : false, // Apenas a primeira transação respeita o status do form
                attachmentUrl: i === 0 ? attachmentUrl : null, // Anexo só na primeira
                notes: i === 0 ? notes : null,
                tags: i === 0 ? tagsToConnect : undefined,
            };
            transactionsToCreate.push(transactionData);
        }

        await tx.transaction.createMany({
            data: transactionsToCreate,
        });

        return await tx.transaction.findMany({ where: { recorrenciaId } });
    } else if (entryType === 'installment' && totalInstallments > 1 && tipo === 'despesa') {
        const installmentId = `inst-${Date.now()}`;
        let installmentValue = valorOriginal / totalInstallments;
        let totalComJuros = valorOriginal;
        
        if (withInterest && interestRate > 0) {
            const monthlyRate = interestRate / 100;
            installmentValue = (valorOriginal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalInstallments));
            totalComJuros = installmentValue * totalInstallments;
        }

        const installmentValueFixed = parseFloat(installmentValue.toFixed(2));
        const transactionsToCreate = [];

        for (let i = 0; i < totalInstallments; i++) {
            transactionsToCreate.push({
                descricao: `${descricao} (${i + 1}/${totalInstallments})`,
                valor: installmentValueFixed,
                valorTotal: valorOriginal,
                data: addMonths(transactionDate, i),
                tipo,
                categoryId: finalCategoryId,
                metodoPagamento,
                cardId,
                userId,
                pago: true,
                installment: true,
                installmentId,
                installmentNumber: i + 1,
                totalInstallments,
                withInterest: withInterest || false,
                interestRate: interestRate || null,
                totalWithInterest: totalComJuros,
                attachmentUrl,
                notes,
            });
        }
        
        transactionsToCreate[0].tags = tagsToConnect;

        await tx.transaction.createMany({
            data: transactionsToCreate,
        });

        return await tx.transaction.findMany({ where: { installmentId }});
    } else {
         const newTransaction = await tx.transaction.create({
            data: {
                descricao, valor: valorOriginal, tipo, data: transactionDate, categoryId: finalCategoryId, metodoPagamento,
                pago: pago, accountId, cardId, userId, installment: false, attachmentUrl, notes,
                tags: tagsToConnect,
            }
        });
        return [newTransaction];
    }
}


class TransactionController {

    async getTransactions(req, res, next) {
        const { cardId, accountId, startDate, endDate, includePending, month, includeShared } = req.query;
        try {
            const whereClause = { userId: req.user.id };

            if (cardId) whereClause.cardId = cardId;
            if (accountId) whereClause.accountId = accountId;
            
            // Otimização: A lógica de data foi simplificada para priorizar `month`
            if (month && /^\d{4}-\d{2}$/.test(month)) {
                 const monthDate = parseISO(`${month}-01`);
                 whereClause.data = {
                    gte: startOfMonth(monthDate),
                    lte: endOfMonth(monthDate),
                };
            } else if (startDate && endDate) {
                whereClause.data = {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                };
            } else if (month === 'all') {
                // Remove a restrição de data para buscar tudo
            } else {
                // Fallback para o mês atual se nenhuma data for especificada
                const today = new Date();
                whereClause.data = {
                    gte: startOfMonth(today),
                    lte: endOfMonth(today),
                };
            }

             if (includePending !== 'true') {
                whereClause.pago = true;
            }

            const transactions = await prisma.transaction.findMany({
                where: whereClause,
                orderBy: { data: 'desc' },
                include: { category: true, tags: true }
            });
            const formattedTransactions = transactions.map(t => ({
                ...t,
                categoria: t.category?.label || t.category?.nome || 'Sem Categoria'
            }));

            res.json(formattedTransactions);
        } catch (error) {
            next(error);
        }
    }

    async createTransaction(req, res, next) {
        const userId = req.user.id;
        try {
            const newTransactions = await prisma.$transaction(async (tx) => {
                const created = await createTransactionLogic(tx, userId, req.body);
                // Lógica de Gamificação
                if (created && created[0].pago) {
                    await GamificationService.triggerXpEvent(tx, userId, 'TRANSACTION_CREATED', { amount: created[0].valor });
                }
                return created;
            });

            if (newTransactions && newTransactions.length > 0) {
                for (const trans of newTransactions) {
                    await AutomationService.handleRoundUpEntry(prisma, userId, trans);
                    await AuditService.log({
                        userId: userId, action: 'CREATE_TRANSACTION', entity: 'TRANSACTION', entityId: trans.id,
                        details: { after: trans, entryType: req.body.entryType }, status: 'SUCCESS', origin: 'WEB_APP', ipAddress: req.ip
                    });
                }
                const cardIdsToRefresh = [...new Set(newTransactions.map(t => t.cardId).filter(Boolean))];
                for (const cardId of cardIdsToRefresh) {
                    await CardBalanceService.recalculateCardSummary(cardId);
                }
                const user = await prisma.user.findUnique({ where: { id: userId } });
                if (user) {
                  await NotificationService.createNotification(prisma, user, {
                      title: `Nova ${req.body.tipo === 'receita' ? 'receita' : 'despesa'} registrada`,
                      message: `${req.body.descricao} - R$ ${parseFloat(req.body.valor).toFixed(2)}`, type: 'TRANSACTION_CREATED', relatedId: newTransactions[0].id,
                  });
                }
            }

            res.status(202).json(newTransactions);
        } catch (error) {
             if (error.statusCode) { return res.status(error.statusCode).json(error.details || { message: error.message }); }
            next(error);
        }
    }

    async updateTransaction(req, res, next) {
        const { id } = req.params;
        const userId = req.user.id;
    
        try {
            const originalTransaction = await prisma.transaction.findUnique({ 
                where: { id: id, userId: userId },
                include: { tags: true }
            });

            if (!originalTransaction) {
                return res.status(404).json({ message: "Transação não encontrada." });
            }

            const isSimpleTransaction = !originalTransaction.recorrenciaId && !originalTransaction.installmentId;
            const isBecomingComplex = req.body.entryType === 'recurring' || req.body.entryType === 'installment';

            if (isSimpleTransaction && !isBecomingComplex) {
                const { contaCartaoId, ...dataToUpdate } = req.body;
                if (dataToUpdate.valor) dataToUpdate.valor = parseFloat(dataToUpdate.valor);
                dataToUpdate.accountId = ['debito', 'pix', 'dinheiro'].includes(dataToUpdate.metodoPagamento) ? contaCartaoId : (dataToUpdate.tipo === 'receita' ? contaCartaoId : null);
                dataToUpdate.cardId = dataToUpdate.metodoPagamento === 'credito' ? contaCartaoId : null;
                if (dataToUpdate.accountId) dataToUpdate.cardId = null;
                else if (dataToUpdate.cardId) dataToUpdate.accountId = null;

                const updatedTransaction = await prisma.transaction.update({
                    where: { id: id },
                    data: {
                        ...dataToUpdate,
                        tags: dataToUpdate.tags ? { set: dataToUpdate.tags.map((tagId) => ({ id: tagId })) } : { set: [] }
                    }
                });

                await AuditService.log({
                    userId, action: 'UPDATE_TRANSACTION', entity: 'TRANSACTION', entityId: id,
                    details: { before: originalTransaction, after: updatedTransaction },
                    status: 'SUCCESS', ipAddress: req.ip
                });
                const affectedCardIds = new Set(
                    [originalTransaction.cardId, updatedTransaction.cardId].filter(Boolean)
                );
                for (const cardId of affectedCardIds) {
                    await CardBalanceService.recalculateCardSummary(cardId);
                }
                return res.json([updatedTransaction]);
            }

            const newTransactions = await prisma.$transaction(async (tx) => {
                const seriesId = originalTransaction.recorrenciaId || originalTransaction.installmentId;
                if (seriesId) {
                    const isInstallment = !!originalTransaction.installmentId;
                    const seriesField = isInstallment ? 'installmentId' : 'recorrenciaId';
                    await tx.transaction.deleteMany({ where: { [seriesField]: seriesId, userId: userId } });
                } else {
                    await tx.transaction.delete({ where: { id: id } });
                }
                const createdTransactions = await createTransactionLogic(tx, userId, req.body);
                await AuditService.log({
                    userId, action: 'UPDATE_TRANSACTION', entity: 'TRANSACTION', entityId: id,
                    details: { before: originalTransaction, after: createdTransactions[0] },
                    status: 'SUCCESS', ipAddress: req.ip
                });
    
                return createdTransactions;
            });

            const cardsToRefresh = new Set(
                [
                    originalTransaction.cardId,
                    ...(newTransactions || []).map(t => t.cardId)
                ].filter(Boolean)
            );
            for (const cardId of cardsToRefresh) {
                await CardBalanceService.recalculateCardSummary(cardId);
            }

            res.json(newTransactions);
            
        } catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json(error.details || { message: error.message });
            }
            next(error);
        }
    }

    async deleteTransaction(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            const transactionToDelete = await prisma.transaction.findUnique({ where: { id, userId }});
            if (!transactionToDelete) { return res.status(404).json({ message: 'Transação não encontrada.' }); }

            await prisma.$transaction(async (tx) => {
                 const seriesId = transactionToDelete.installmentId || transactionToDelete.recorrenciaId;
                 if (seriesId) {
                    await tx.transaction.deleteMany({ where: { [seriesId.startsWith('inst') ? 'installmentId' : 'recorrenciaId']: seriesId, userId }});
                } else {
                    await tx.transaction.delete({ where: { id: id, userId: userId } });
                }
            });

            await AuditService.log({
                userId, action: 'DELETE_TRANSACTION', entity: 'TRANSACTION', entityId: id,
                details: { before: transactionToDelete }, status: 'SUCCESS', ipAddress: req.ip
            });
            if (transactionToDelete.cardId) {
                await CardBalanceService.recalculateCardSummary(transactionToDelete.cardId);
            }

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async togglePaidStatus(req, res, next) {
        const { id } = req.params;
        const userId = req.user.id;
        try {
            const transaction = await prisma.transaction.findUnique({ where: { id, userId }});
            if (!transaction) { return res.status(404).json({ message: 'Transação não encontrada.' }); }
            
            const wasPaid = transaction.pago;
            
            const updatedTransaction = await prisma.$transaction(async (tx) => {
                 const updated = await tx.transaction.update({
                    where: { id }, data: { pago: !transaction.pago }
                });

                // Se a transação foi marcada como PAGA, concede XP.
                if (!wasPaid && updated.pago) {
                    await GamificationService.triggerXpEvent(tx, userId, 'BILL_PAID', { amount: updated.valor });
                } 
                // Se foi desmarcada (de PAGA para NÃO PAGA), remove XP.
                else if (wasPaid && !updated.pago) {
                    await GamificationService.triggerXpEvent(tx, userId, 'BILL_UNPAID', { amount: updated.valor });
                }
                
                return updated;
            });


            await AuditService.log({
                userId, action: 'TOGGLE_PAID_STATUS', entity: 'TRANSACTION', entityId: id,
                details: { before: transaction, after: updatedTransaction }, status: 'SUCCESS', ipAddress: req.ip
            });
            if (updatedTransaction.cardId || transaction.cardId) {
                const cardIds = new Set([transaction.cardId, updatedTransaction.cardId].filter(Boolean));
                for (const cardId of cardIds) {
                    await CardBalanceService.recalculateCardSummary(cardId);
                }
            }

            res.json(updatedTransaction);
        } catch (error) {
            next(error);
        }
    }

    async exportTransactions(req, res, next) {
        const userId = req.user.id;
        const { text, categories, accounts, cards, methods, type, dateRange, includePending } = req.body;
        try {
            const whereClause = { userId };
            if (includePending !== true) whereClause.pago = true;
            if (text) whereClause.descricao = { contains: text, mode: 'insensitive' };
            if (type) whereClause.tipo = type;
            if (dateRange?.from) { whereClause.data = { gte: new Date(dateRange.from), lte: dateRange.to ? new Date(dateRange.to) : new Date() }; }
            const orConditions = [];
            if (accounts?.length > 0) orConditions.push({ accountId: { in: accounts } });
            if (cards?.length > 0) orConditions.push({ cardId: { in: cards } });
            if(orConditions.length > 0) { if (!whereClause.AND) whereClause.AND = []; whereClause.AND.push({ OR: orConditions }); }
            if(categories?.length > 0) { if (!whereClause.AND) whereClause.AND = []; whereClause.AND.push({ category: { nome: { in: categories } } }); }
            if(methods?.length > 0) { if (!whereClause.AND) whereClause.AND = []; whereClause.AND.push({ metodoPagamento: { in: methods } }); }
            const transactions = await prisma.transaction.findMany({
                where: whereClause, include: { category: true, account: true, card: true }, orderBy: { data: 'desc' },
            });
            const dataToExport = transactions.map(t => ({
                Data: format(parseISO(t.data), 'dd/MM/yyyy'), Descricao: t.descricao, Valor: t.valor, Tipo: t.tipo === 'receita' ? 'Receita' : 'Despesa',
                Categoria: t.category?.nome || 'N/A', Status: t.pago ? 'Pago' : 'Pendente', Metodo: t.metodoPagamento, Fonte: t.account?.nome || t.card?.nome || 'N/A',
            }));
            const csv = stringifyCsv(dataToExport, { header: true });
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=jornada_financeira_export.csv');
            res.status(200).send(csv);
        } catch (error) {
            next(error);
        }
    }

    async createFromImported(req, res, next) {
        const { importedTransactionId } = req.body;
        const userId = req.user.id;

        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) throw { statusCode: 404, message: 'Usuário não encontrado.' };

            const importedTx = await prisma.importedTransaction.findFirst({
                where: { id: importedTransactionId, reconciliation: { userId } },
                include: { reconciliation: true }
            });

            if (!importedTx) {
                throw { statusCode: 404, message: 'Transação importada não encontrada.' };
            }
            if (importedTx.status !== 'PENDING' && importedTx.status !== 'SUGGESTED') {
                throw { statusCode: 400, message: 'Esta transação já foi processada.' };
            }

            const result = await prisma.$transaction(async (tx) => {
                const accountId = importedTx.reconciliation.accountId;
                const cardId = importedTx.reconciliation.cardId;
                const tipo = importedTx.type === 'CREDIT' ? 'receita' : 'despesa';
                
                const categoryMap = await getCategoryMap(tx);
                let categoryId = tipo === 'receita' ? categoryMap.get('OutrasReceitas') : categoryMap.get('Outros');

                if(tipo === 'despesa') {
                    const categoryNameFromRule = await CategorizationService.applyRulesAndGetName(userId, importedTx.description);
                    if (categoryNameFromRule && categoryMap.has(categoryNameFromRule)) {
                        categoryId = categoryMap.get(categoryNameFromRule);
                    } else if (user.enableReconciliationAi) {
                        const suggestion = await suggestCategoryFlow({ description: importedTx.description });
                        if(suggestion && categoryMap.has(suggestion.category)) {
                            categoryId = categoryMap.get(suggestion.category);
                        }
                    }
                }

                const newManualTx = await tx.transaction.create({
                    data: {
                        userId,
                        accountId,
                        cardId,
                        descricao: importedTx.description,
                        valor: importedTx.amount,
                        data: new Date(importedTx.date),
                        tipo,
                        pago: true,
                        isReconciled: true,
                        categoryId: categoryId,
                        metodoPagamento: accountId ? 'debito' : 'credito',
                        importedTransactionId: importedTx.id,
                    },
                });

                await tx.importedTransaction.update({
                    where: { id: importedTx.id },
                    data: {
                        status: 'RECONCILED',
                        manualTransactionId: newManualTx.id,
                    },
                });

                 await AuditService.log({
                    userId,
                    action: 'CREATE_FROM_IMPORTED',
                    entity: 'TRANSACTION',
                    entityId: newManualTx.id,
                    details: { after: newManualTx, importedId: importedTx.id },
                    ipAddress: req.ip,
                });

                return { transaction: newManualTx, reconciliationId: importedTx.reconciliationId };
            });
            
            await ReconciliationService.updateBalanceSnapshot(result.reconciliationId);

            res.status(201).json(result.transaction);

        } catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            next(error);
        }
    }
}

export default new TransactionController();
