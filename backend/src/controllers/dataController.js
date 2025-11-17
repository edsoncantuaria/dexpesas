// src/controllers/dataController.js
import { PrismaClient } from '@prisma/client';
import CacheService from '../services/cacheService.js';
import GamificationService from '../services/gamificationService.js';
import { startOfMonth, endOfMonth, subMonths, format, endOfDay } from 'date-fns';
import SecurityService from '../services/securityService.js';
import { decryptValue } from '../utils/fieldEncryption.js';

const prisma = new PrismaClient();

async function getAccountsWithBalance(userId) {
    const accounts = await prisma.account.findMany({
        where: { userId, isArchived: false },
        orderBy: { nome: 'asc' },
    });
    if (accounts.length === 0) {
        return [];
    }

    const accountIds = accounts.map(account => account.id);
    const [transactionsSums, transactionsSumsPaid] = await Promise.all([
        prisma.transaction.groupBy({
            by: ['accountId', 'tipo'],
            where: {
                userId,
                accountId: { in: accountIds },
                data: { lte: endOfDay(new Date()) },
            },
            _sum: { valor: true },
        }),
        prisma.transaction.groupBy({
            by: ['accountId', 'tipo'],
            where: {
                userId,
                pago: true,
                accountId: { in: accountIds },
                data: { lte: endOfDay(new Date()) },
            },
            _sum: { valor: true },
        }),
    ]);

    const receitasMap = new Map();
    const despesasMap = new Map();
    const receitasPagasMap = new Map();
    const despesasPagasMap = new Map();

    transactionsSums.forEach(group => {
        if (group.tipo === 'receita') {
            receitasMap.set(group.accountId, group._sum.valor || 0);
        } else {
            despesasMap.set(group.accountId, group._sum.valor || 0);
        }
    });

    transactionsSumsPaid.forEach(group => {
        if (group.tipo === 'receita') {
            receitasPagasMap.set(group.accountId, group._sum.valor || 0);
        } else {
            despesasPagasMap.set(group.accountId, group._sum.valor || 0);
        }
    });

    return accounts.map(account => {
        const totalReceitas = Number(receitasMap.get(account.id) || 0);
        const totalDespesas = Number(despesasMap.get(account.id) || 0);
        const totalReceitasPagas = Number(receitasPagasMap.get(account.id) || 0);
        const totalDespesasPagas = Number(despesasPagasMap.get(account.id) || 0);
        const saldo = Number(account.saldoInicial) + totalReceitas - totalDespesas;
        const saldoPago = Number(account.saldoInicial) + totalReceitasPagas - totalDespesasPagas;
        return { ...account, saldo, saldoPago };
    });
}

async function buildBudgetSnapshot(userId, monthKey, startDate, endDate) {
    const budgets = await prisma.budget.findMany({
        where: { userId, month: monthKey },
        include: { category: true },
    });

    if (budgets.length === 0) {
        return [];
    }

    const previousMonthDate = subMonths(startDate, 1);
    const prevMonthStr = format(previousMonthDate, 'yyyy-MM');
    const prevMonthStartDate = startOfMonth(previousMonthDate);
    const prevMonthEndDate = endOfMonth(previousMonthDate);
    const categoryIds = budgets.map(budget => budget.categoryId);

    const [currentExpenses, previousBudgets, previousExpenses] = await Promise.all([
        prisma.transaction.groupBy({
            by: ['categoryId'],
            where: { userId, pago: true, tipo: 'despesa', data: { gte: startDate, lte: endDate }, categoryId: { in: categoryIds } },
            _sum: { valor: true },
        }),
        prisma.budget.findMany({
            where: { userId, month: prevMonthStr, categoryId: { in: categoryIds }, rollover: true },
        }),
        prisma.transaction.groupBy({
            by: ['categoryId'],
            where: { userId, pago: true, tipo: 'despesa', data: { gte: prevMonthStartDate, lte: prevMonthEndDate }, categoryId: { in: categoryIds } },
            _sum: { valor: true },
        }),
    ]);

    const currentSpentMap = new Map(currentExpenses.map(expense => [expense.categoryId, expense._sum.valor || 0]));
    const previousSpentMap = new Map(previousExpenses.map(expense => [expense.categoryId, expense._sum.valor || 0]));
    const previousBudgetMap = new Map(previousBudgets.map(budget => [budget.categoryId, budget.limit]));

    return budgets.map(budget => {
        let adjustedLimit = parseFloat(budget.limit);
        let rolloverAmount = 0;
        if (budget.rollover && previousBudgetMap.has(budget.categoryId)) {
            const prevLimit = previousBudgetMap.get(budget.categoryId) || 0;
            const prevSpent = previousSpentMap.get(budget.categoryId) || 0;
            rolloverAmount = parseFloat(prevLimit) - parseFloat(prevSpent);
            adjustedLimit += rolloverAmount;
        }
        return {
            ...budget,
            limit: adjustedLimit,
            originalLimit: parseFloat(budget.limit),
            rolloverAmount,
            spent: currentSpentMap.get(budget.categoryId) || 0,
        };
    });
}

const CACHE_KEYS = {
    CATEGORIES: 'categories',
};

class DataController {
    async getAllCategories(req, res, next) {
        const cacheKey = CACHE_KEYS.CATEGORIES;
        try {
            // 1. Tenta buscar do cache primeiro
            const cachedCategories = await CacheService.get(cacheKey);
            if (cachedCategories) {
                return res.json(cachedCategories);
            }

            // 2. Se não estiver no cache, busca no banco
            const categories = await prisma.category.findMany({
                orderBy: {
                    label: 'asc',
                }
            });
            
            // 3. Salva no cache por 1 hora (3600 segundos)
            await CacheService.set(cacheKey, categories, 3600);

            res.json(categories);
        } catch (error) {
            next(error);
        }
    }

    async getGamificationProfile(req, res, next) {
        // Modificado para aceitar um ID de usuário, ou usar o do usuário logado
        const userId = req.params.userId || req.user.id;
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    level: true,
                    xp: true,
                    heroClass: true,
                    gamificationMode: true,
                }
            });

            if (!user) {
                return res.status(404).json({ message: 'Perfil de gamificação não encontrado.' });
            }

            if (user.gamificationMode === 'OFF') {
                return res.status(403).json({ message: 'Recursos de gamificação desativados para este usuário.' });
            }

            // Invoca o serviço para calcular os atributos dinamicamente
            const calculatedAttributes = await GamificationService.calculateAllAttributes(userId);

            const xpTarget = GamificationService.getXpNeeded(user.level);
            const xpToNextLevel = Math.max(xpTarget - user.xp, 0);

            const profileData = {
                level: user.level,
                xp: user.xp,
                heroClass: user.heroClass,
                xpTarget,
                xpToNextLevel,
                xpProgressPercent: xpTarget > 0 ? Math.min(100, Math.round((user.xp / xpTarget) * 100)) : 0,
                gamificationMode: user.gamificationMode,
                ...calculatedAttributes // Combina os atributos calculados
            };
            
            res.json(profileData);
        } catch (error) {
            next(error);
        }
    }

    async getAllAchievements(req, res, next) {
        try {
            const achievements = await prisma.achievement.findMany({
                orderBy: { name: 'asc' }
            });
            res.json(achievements);
        } catch (error) {
            next(error);
        }
    }

    async getUnlockedAchievements(req, res, next) {
        try {
            const unlocked = await prisma.unlockedAchievement.findMany({
                where: { userId: req.user.id },
                include: { achievement: true }
            });
            res.json(unlocked);
        } catch (error) {
            next(error);
        }
    }

    async getFinancialOverview(req, res, next) {
        const userId = req.user.id;
        const now = new Date();
        const startDate = startOfMonth(now);
        const endDate = endOfMonth(now);
        const previousStart = startOfMonth(subMonths(now, 1));
        const previousEnd = endOfMonth(subMonths(now, 1));
        const monthKey = format(now, 'yyyy-MM');

        try {
            const [
                accountsWithBalance,
                transactions,
                previousTransactions,
                cards,
                budgetSnapshots,
                overdueTransactions,
                userRecord,
            ] = await Promise.all([
                getAccountsWithBalance(userId),
                prisma.transaction.findMany({
                    where: { userId, data: { gte: startDate, lte: endDate } },
                    select: {
                        id: true,
                        descricao: true,
                        valor: true,
                        tipo: true,
                        pago: true,
                        data: true,
                        category: { select: { id: true, nome: true, label: true } },
                    },
                }),
                prisma.transaction.findMany({
                    where: { userId, data: { gte: previousStart, lte: previousEnd } },
                    select: {
                        id: true,
                        valor: true,
                        tipo: true,
                        pago: true,
                    },
                }),
                prisma.card.findMany({ where: { userId }, orderBy: { nome: 'asc' } }),
                buildBudgetSnapshot(userId, monthKey, startDate, endDate),
                prisma.transaction.findMany({
                    where: { userId, tipo: 'despesa', pago: false, data: { lt: new Date() } },
                    select: { id: true, descricao: true, data: true, valor: true },
                    orderBy: { data: 'asc' },
                    take: 5,
                }),
                prisma.user.findUnique({
                    where: { id: userId },
                    select: {
                        id: true,
                        fixedMonthlyIncome: true,
                        favoriteCategories: true,
                        dashboardPreferences: true,
                        hideFamilyMode: true,
                        twoFactorEnabled: true,
                        phoneVerified: true,
                        phoneNumber: true,
                        clanMemberships: {
                            select: { clanId: true, role: true, joinedAt: true },
                            orderBy: { joinedAt: 'asc' },
                            take: 1,
                        },
                    },
                }),
            ]);

            if (!userRecord) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }

            const summary = transactions.reduce((acc, transaction) => {
                const value = Number(transaction.valor);
                if (transaction.tipo === 'receita') {
                    if (transaction.pago) acc.received += value;
                    else acc.toReceive += value;
                } else {
                    if (transaction.pago) acc.spent += value;
                    else acc.toPay += value;
                }
                return acc;
            }, { received: 0, spent: 0, toReceive: 0, toPay: 0 });

            const balance = summary.received - summary.spent;
            const projectedBalance = (summary.received + summary.toReceive) - (summary.spent + summary.toPay);

            const previousPaidIncome = previousTransactions
                .filter(transaction => transaction.tipo === 'receita' && transaction.pago)
                .reduce((acc, transaction) => acc + Number(transaction.valor), 0);
            const previousPaidExpense = previousTransactions
                .filter(transaction => transaction.tipo === 'despesa' && transaction.pago)
                .reduce((acc, transaction) => acc + Number(transaction.valor), 0);
            const previousBalance = previousPaidIncome - previousPaidExpense;
            const variationPercentage = previousBalance === 0
                ? null
                : ((balance - previousBalance) / Math.abs(previousBalance)) * 100;

            const categorySpendingMap = new Map();
            transactions
                .filter(transaction => transaction.tipo === 'despesa')
                .forEach(transaction => {
                    const key = transaction.category?.label || transaction.category?.nome || 'Outros';
                    const current = categorySpendingMap.get(key) || {
                        categoryId: transaction.category?.id || 'uncategorized',
                        label: key,
                        amount: 0,
                    };
                    current.amount += Number(transaction.valor);
                    categorySpendingMap.set(key, current);
                });

            const categoryHighlights = Array.from(categorySpendingMap.values())
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 5);

            const cardsWithUsage = cards.map(card => {
                const limit = Number(card.limite || 0);
                const invoiceAmount = Number(card.currentInvoiceAmount || 0);
                const usagePercentage = limit > 0 ? (invoiceAmount / limit) * 100 : 0;
                return { ...card, usagePercentage };
            });

            const alerts = [];
            overdueTransactions.forEach(transaction => {
                alerts.push({
                    id: `bill-${transaction.id}`,
                    title: 'Conta atrasada',
                    description: `${transaction.descricao} venceu em ${format(new Date(transaction.data), 'dd/MM')}`,
                    severity: 'critical',
                    href: '/dashboard/transacoes',
                });
            });

            budgetSnapshots
                .filter(budget => Number(budget.spent) > Number(budget.limit))
                .forEach(budget => {
                    alerts.push({
                        id: `budget-${budget.id}`,
                        title: `Orçamento estourado (${budget.category?.label || budget.category?.nome})`,
                        description: `Gasto de ${Number(budget.spent).toFixed(2)} para limite de ${Number(budget.limit).toFixed(2)}`,
                        severity: 'warning',
                        href: '/dashboard/orcamentos',
                    });
                });

            cardsWithUsage
                .filter(card => card.usagePercentage >= 85)
                .forEach(card => {
                    alerts.push({
                        id: `card-${card.id}`,
                        title: `Limite próximo (${card.nome})`,
                        description: `Você já usou ${card.usagePercentage.toFixed(0)}% do limite deste cartão.`,
                        severity: 'warning',
                        href: '/dashboard/cartoes',
                    });
                });

            const decryptedPhoneNumber = userRecord.phoneNumber ? decryptValue(userRecord.phoneNumber) : null;
            const normalizedUser = { ...userRecord, phoneNumber: decryptedPhoneNumber };

            const familySummary = await this.buildFamilySummary(normalizedUser, startDate, endDate);
            const securitySummary = await SecurityService.getSecuritySummary({
                id: normalizedUser.id,
                twoFactorEnabled: normalizedUser.twoFactorEnabled,
                phoneVerified: normalizedUser.phoneVerified,
                phoneNumber: normalizedUser.phoneNumber,
            });

            const favoriteCategories = this.parseJsonArray(normalizedUser.favoriteCategories);
            const dashboardPreferences = this.parseJsonObject(normalizedUser.dashboardPreferences);

            res.json({
                monthSummary: {
                    ...summary,
                    balance,
                    projectedBalance,
                    previousBalance,
                    variationPercentage,
                },
                accounts: accountsWithBalance.map(account => ({
                    id: account.id,
                    nome: account.nome,
                    instituicao: account.instituicao,
                    saldo: account.saldo,
                    saldoPago: account.saldoPago,
                    tipo: account.tipo,
                })),
                cards: cardsWithUsage,
                budgets: budgetSnapshots.map(budget => ({
                    id: budget.id,
                    categoryId: budget.categoryId,
                    label: budget.category?.label || budget.category?.nome,
                    limit: Number(budget.limit),
                    spent: Number(budget.spent),
                })),
                categoryHighlights,
                alerts,
                favoriteCategories,
                fixedMonthlyIncome: normalizedUser.fixedMonthlyIncome ? Number(normalizedUser.fixedMonthlyIncome) : null,
                dashboardPreferences,
                hideFamilyMode: normalizedUser.hideFamilyMode,
                familySummary,
                security: securitySummary,
            });
        } catch (error) {
            next(error);
        }
    }

    parseJsonArray(value) {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        }
        return [];
    }

    parseJsonObject(value) {
        if (!value) return {};
        if (typeof value === 'object') return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return typeof parsed === 'object' && parsed !== null ? parsed : {};
            } catch {
                return {};
            }
        }
        return {};
    }

    async buildFamilySummary(userRecord, startDate, endDate) {
        if (!userRecord || userRecord.hideFamilyMode) return null;
        const membership = userRecord.clanMemberships?.[0];
        if (!membership?.clanId) return null;

        const clan = await prisma.clan.findUnique({
            where: { id: membership.clanId },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, avatarUrl: true },
                        },
                    },
                },
            },
        });

        if (!clan) {
            return null;
        }

        const sharedExpenses = await prisma.sharedExpense.findMany({
            where: { clanId: clan.id, createdAt: { gte: startDate, lte: endDate } },
            select: { creatorId: true, totalAmount: true },
        });

        const rankingMap = new Map();
        sharedExpenses.forEach(expense => {
            const total = Number(expense.totalAmount);
            rankingMap.set(expense.creatorId, (rankingMap.get(expense.creatorId) || 0) + total);
        });

        const ranking = clan.members.map(member => ({
            memberId: member.userId,
            name: member.user?.name || 'Membro',
            avatarUrl: member.user?.avatarUrl,
            spent: rankingMap.get(member.userId) || 0,
            role: member.role,
        })).sort((a, b) => b.spent - a.spent);

        return {
            clan: {
                id: clan.id,
                name: clan.name,
                balance: Number(clan.balance),
            },
            ranking,
            totalMembers: clan.members.length,
        };
    }
    
    async getInventory(req, res, next) {
        const userId = req.user.id;
        try {
            const inventory = await prisma.userItem.findMany({
                where: { userId },
                include: { item: true },
                orderBy: { item: { name: 'asc' } },
            });
            res.json(inventory);
        } catch (error) {
            next(error);
        }
    }
}

export default new DataController();
