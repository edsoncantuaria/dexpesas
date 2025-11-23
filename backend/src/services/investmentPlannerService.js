// backend/src/services/investmentPlannerService.js
import pkg from '@prisma/client';
const { PrismaClient, InvestmentContributionStatus, InvestmentContributionSource } = pkg;
import AuditService from './auditService.js';
import CategoryClassificationService from './categoryClassificationService.js';

const prisma = new PrismaClient();

const ESSENTIAL_CATEGORY_LABELS = [
    'Moradia',
    'Habitação',
    'Habitação e Moradia',
    'Aluguel',
    'Mercado',
    'Supermercado',
    'Transporte',
    'Educação',
    'Saúde',
    'Contas Fixas',
    'Luz',
    'Água',
    'Internet',
];

const TRACKED_BASIC_NEEDS = [
    { key: 'casa', label: 'Casa', keywords: ['casa', 'habitação', 'moradia'] },
    { key: 'mercado', label: 'Mercado', keywords: ['mercado', 'supermercado'] },
];

const DEFAULT_PLAN = {
    priority: 'investir',
    targetPercent: 0.2,
    targetAmountMin: 0,
    targetAmount: null,
    leisureFloor: 0,
    leisurePercentMin: 0.15,
    emergencyFundTarget: null,
    status: 'ACTIVE',
    notes: null,
};

function parseDecimalInput(value) {
    if (value === undefined || value === null || value === '') return null;
    const normalized = typeof value === 'string' ? value.replace(',', '.') : value;
    const numberValue = Number(normalized);
    if (!Number.isFinite(numberValue)) {
        return null;
    }
    return numberValue;
}

function clamp(value, min, max) {
    if (max === null || max === undefined) {
        return Math.max(min, value);
    }
    return Math.min(Math.max(min, value), max);
}

function toNumber(value, fallback = 0) {
    if (value === null || value === undefined) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeCategoryName(name = '') {
    return name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
}

function sanitizeMonth(month) {
    if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
        return month;
    }
    const today = new Date();
    const year = today.getUTCFullYear();
    const monthIndex = today.getUTCMonth() + 1;
    return `${year}-${String(monthIndex).padStart(2, '0')}`;
}

function getMonthRange(month) {
    const monthKey = sanitizeMonth(month);
    const [year, monthPart] = monthKey.split('-').map(Number);
    const startDate = new Date(Date.UTC(year, monthPart - 1, 1));
    const endDate = new Date(Date.UTC(year, monthPart, 0, 23, 59, 59, 999));
    return { monthKey, startDate, endDate };
}

async function ensureInvestmentsCategory(tx, userId) {
    const prismaClient = tx || prisma;
    const category = await prismaClient.category.findFirst({
        where: {
            nome: 'Investimentos',
            OR: [{ userId }, { userId: null }],
        },
        orderBy: { userId: 'desc' },
    });
    if (!category) {
        const error = new Error("Categoria 'Investimentos' não encontrada.");
        error.statusCode = 500;
        throw error;
    }
    return category.id;
}

function serializePlan(plan) {
    if (!plan) return null;
    return {
        id: plan.id,
        priority: plan.priority,
        targetPercent: toNumber(plan.targetPercent, DEFAULT_PLAN.targetPercent),
        targetAmountMin: toNumber(plan.targetAmountMin, 0),
        targetAmount: plan.targetAmount !== null ? toNumber(plan.targetAmount) : null,
        leisureFloor: toNumber(plan.leisureFloor, 0),
        leisurePercentMin: toNumber(plan.leisurePercentMin, DEFAULT_PLAN.leisurePercentMin),
        emergencyFundTarget: plan.emergencyFundTarget !== null ? toNumber(plan.emergencyFundTarget) : null,
        notes: plan.notes,
        status: plan.status,
        userId: plan.userId,
        createdAt: plan.createdAt,
        updatedAt: plan.updatedAt,
    };
}

function serializeContribution(contribution) {
    if (!contribution) return null;
    return {
        id: contribution.id,
        planId: contribution.planId,
        userId: contribution.userId,
        amount: toNumber(contribution.amount),
        leisureImpact: contribution.leisureImpact !== null ? toNumber(contribution.leisureImpact) : null,
        status: contribution.status,
        source: contribution.source,
        notes: contribution.notes,
        month: contribution.month,
        executedAt: contribution.executedAt,
        createdAt: contribution.createdAt,
        destinationAccountId: contribution.accountId,
        sourceAccountId: contribution.fromAccountId,
        holdingId: contribution.holdingId,
        analysisSnapshot: contribution.analysisSnapshot,
        destinationAccount: contribution.destinationAccount
            ? { id: contribution.destinationAccount.id, nome: contribution.destinationAccount.nome }
            : null,
        sourceAccount: contribution.sourceAccount
            ? { id: contribution.sourceAccount.id, nome: contribution.sourceAccount.nome }
            : null,
        holding: contribution.holding
            ? {
                id: contribution.holding.id,
                assetClass: contribution.holding.assetClass,
                ticker: contribution.holding.ticker,
            }
            : null,
    };
}

function serializeSnapshot(snapshot) {
    if (!snapshot) return null;
    return {
        id: snapshot.id,
        planId: snapshot.planId,
        userId: snapshot.userId,
        month: snapshot.month,
        totalInvested: toNumber(snapshot.totalInvested),
        totalReturns: toNumber(snapshot.totalReturns),
        leisureSpent: toNumber(snapshot.leisureSpent),
        deltaVsPlan: toNumber(snapshot.deltaVsPlan),
        confidenceScore: snapshot.confidenceScore !== null ? toNumber(snapshot.confidenceScore) : null,
        commentaryJson: snapshot.commentaryJson,
        createdAt: snapshot.createdAt,
    };
}

class InvestmentPlannerService {
    static async getPlanRecord(userId) {
        if (!userId) return null;
        return prisma.investmentPlan.findUnique({ where: { userId } });
    }

    static async getPlanWithAnalysis(userId, month) {
        const planRecord = await this.getPlanRecord(userId);
        const analysis = await this.calculateFreeToInvest(userId, month, planRecord);
        return {
            plan: planRecord ? serializePlan(planRecord) : null,
            defaults: planRecord ? null : { ...DEFAULT_PLAN },
            analysis,
        };
    }

    static buildPlanPayload(payload) {
        const data = {};
        if (payload.priority) {
            data.priority = payload.priority;
        }

        const percent = parseDecimalInput(payload.targetPercent);
        if (percent !== null) {
            data.targetPercent = clamp(percent, 0, 1);
        }

        const targetAmountMin = parseDecimalInput(payload.targetAmountMin);
        if (targetAmountMin !== null) {
            data.targetAmountMin = Math.max(0, targetAmountMin);
        }

        if ('targetAmount' in payload) {
            const targetAmount = parseDecimalInput(payload.targetAmount);
            data.targetAmount = targetAmount !== null ? Math.max(0, targetAmount) : null;
        }

        const leisureFloor = parseDecimalInput(payload.leisureFloor);
        if (leisureFloor !== null) {
            data.leisureFloor = Math.max(0, leisureFloor);
        }

        const leisurePercentMin = parseDecimalInput(payload.leisurePercentMin);
        if (leisurePercentMin !== null) {
            data.leisurePercentMin = clamp(leisurePercentMin, 0, 1);
        }

        if ('emergencyFundTarget' in payload) {
            const emergency = parseDecimalInput(payload.emergencyFundTarget);
            data.emergencyFundTarget = emergency !== null ? Math.max(0, emergency) : null;
        }

        if (payload.status) {
            data.status = payload.status;
        }

        if ('notes' in payload) {
            data.notes = payload.notes || null;
        }

        return data;
    }

    static async upsertPlan(userId, payload = {}) {
        const current = await this.getPlanRecord(userId);
        const data = this.buildPlanPayload(payload);
        let plan;
        let created = false;

        if (current) {
            plan = await prisma.investmentPlan.update({
                where: { id: current.id },
                data,
            });
        } else {
            plan = await prisma.investmentPlan.create({
                data: {
                    userId,
                    priority: data.priority || DEFAULT_PLAN.priority,
                    targetPercent: data.targetPercent ?? DEFAULT_PLAN.targetPercent,
                    targetAmountMin: data.targetAmountMin ?? DEFAULT_PLAN.targetAmountMin,
                    targetAmount: 'targetAmount' in data ? data.targetAmount : DEFAULT_PLAN.targetAmount,
                    leisureFloor: data.leisureFloor ?? DEFAULT_PLAN.leisureFloor,
                    leisurePercentMin: data.leisurePercentMin ?? DEFAULT_PLAN.leisurePercentMin,
                    emergencyFundTarget:
                        'emergencyFundTarget' in data ? data.emergencyFundTarget : DEFAULT_PLAN.emergencyFundTarget,
                    notes: data.notes ?? DEFAULT_PLAN.notes,
                    status: data.status || DEFAULT_PLAN.status,
                },
            });
            created = true;
        }

        return { plan: serializePlan(plan), created };
    }

    static async calculateFreeToInvest(userId, month, planRecord) {
        const { monthKey, startDate, endDate } = getMonthRange(month);
        const plan = planRecord ? serializePlan(planRecord) : { ...DEFAULT_PLAN, id: null, userId };

        // Obter IDs de categorias classificadas pelo usuário
        const [essentialCategoryIds, leisureCategoryIds, investmentCategoryIds] = await Promise.all([
            CategoryClassificationService.getCategoryIdsByType(userId, 'ESSENTIAL'),
            CategoryClassificationService.getCategoryIdsByType(userId, 'LEISURE'),
            CategoryClassificationService.getCategoryIdsByType(userId, 'INVESTMENT'),
        ]);

        const [user, budgets, incomeAggregate, spendingAggregate] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, select: { fixedMonthlyIncome: true } }),
            prisma.budget.findMany({
                where: { userId, month: monthKey, cellBudgetId: null },
                include: { category: true },
            }),
            prisma.transaction.aggregate({
                _sum: { valor: true },
                where: {
                    userId,
                    tipo: 'receita',
                    pago: true,
                    data: { gte: startDate, lte: endDate },
                },
            }),
            prisma.transaction.aggregate({
                _sum: { valor: true },
                where: {
                    userId,
                    tipo: 'despesa',
                    pago: true,
                    data: { gte: startDate, lte: endDate },
                },
            }),
        ]);

        const netIncome = toNumber(incomeAggregate._sum.valor);
        const totalSpent = toNumber(spendingAggregate._sum.valor);

        // Usar classificações dinâmicas em vez de hardcoded
        const essentialBudgets = budgets.filter((budget) =>
            essentialCategoryIds.includes(budget.categoryId)
        );
        const essentialBudget = essentialBudgets.reduce((acc, budget) => acc + toNumber(budget.limit), 0);

        let essentialSpent = 0;
        const essentialSpentMap = new Map();
        if (essentialCategoryIds.length) {
            const aggregates = await prisma.transaction.groupBy({
                by: ['categoryId'],
                where: {
                    userId,
                    pago: true,
                    tipo: 'despesa',
                    categoryId: { in: essentialCategoryIds },
                    data: { gte: startDate, lte: endDate },
                },
                _sum: { valor: true },
            });
            essentialSpent = aggregates.reduce((acc, entry) => acc + toNumber(entry._sum.valor), 0);
            aggregates.forEach((entry) => {
                essentialSpentMap.set(entry.categoryId, toNumber(entry._sum.valor));
            });
        } else {
            essentialSpent = Math.min(totalSpent, netIncome * 0.5);
        }

        const warnings = [];
        if (!budgets.length) {
            warnings.push('Nenhum orçamento pessoal configurado para este mês.');
        }
        if (netIncome <= 0) {
            warnings.push('Ainda não encontramos receitas confirmadas para este mês.');
        }

        const fixedIncome = toNumber(user?.fixedMonthlyIncome, netIncome);
        const baseBuffer = fixedIncome * 0.1;
        const emergencyBuffer = plan.emergencyFundTarget ? plan.emergencyFundTarget / 12 : 0;
        const safetyBuffer = Math.max(baseBuffer, emergencyBuffer);

        const rawAvailable = netIncome - essentialBudget - safetyBuffer;
        if (rawAvailable < 0) {
            warnings.push('Gastos essenciais + reserva de segurança excedem sua renda atual.');
        }

        const available = Math.max(0, rawAvailable);
        const leisureFloor = Math.max(plan.leisureFloor || 0, netIncome * (plan.leisurePercentMin || DEFAULT_PLAN.leisurePercentMin));
        const percentTarget = available * (plan.targetPercent ?? DEFAULT_PLAN.targetPercent);
        const minTarget = plan.targetAmountMin ?? 0;
        const maxTarget = plan.targetAmount !== null ? plan.targetAmount : null;

        let suggestedInvestment = clamp(percentTarget, minTarget, maxTarget);
        const investableCeiling = Math.max(0, available - leisureFloor);
        suggestedInvestment = Math.min(suggestedInvestment, investableCeiling);
        if (available <= 0) {
            suggestedInvestment = 0;
        }

        const leisureSuggested = Math.max(leisureFloor, available - suggestedInvestment);

        // Calcular gastos de lazer usando categorias classificadas (FIX: era totalSpent - essentialSpent)
        let leisureSpent = 0;
        if (leisureCategoryIds.length > 0) {
            const leisureAggregate = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: {
                    userId,
                    tipo: 'despesa',
                    pago: true,
                    categoryId: { in: leisureCategoryIds },
                    data: { gte: startDate, lte: endDate },
                },
            });
            leisureSpent = toNumber(leisureAggregate._sum.valor);
        }

        // Calcular gastos de investimento
        let investmentSpent = 0;
        if (investmentCategoryIds.length > 0) {
            const investmentAggregate = await prisma.transaction.aggregate({
                _sum: { valor: true },
                where: {
                    userId,
                    tipo: 'despesa',
                    pago: true,
                    categoryId: { in: investmentCategoryIds },
                    data: { gte: startDate, lte: endDate },
                },
            });
            investmentSpent = toNumber(investmentAggregate._sum.valor);
        }
        const basicNeeds = TRACKED_BASIC_NEEDS.map((config) => {
            const matchedBudget = budgets.find((budget) => {
                const catName = normalizeCategoryName(budget.category?.nome || budget.category?.label || '');
                return config.keywords.some((keyword) => catName.includes(keyword));
            });
            const limit = matchedBudget ? toNumber(matchedBudget.limit) : 0;
            const spentValue = matchedBudget ? toNumber(essentialSpentMap.get(matchedBudget.categoryId)) : 0;
            return {
                key: config.key,
                label: config.label,
                limit,
                spent: spentValue,
            };
        });

        let confidenceScore = 0.4;
        if (netIncome > 0) confidenceScore += 0.2;
        if (budgets.length) confidenceScore += 0.2;
        if (totalSpent > 0) confidenceScore += 0.1;
        if (essentialCategoryIds.length) confidenceScore += 0.1;
        confidenceScore = Math.min(1, confidenceScore);

        return {
            month: monthKey,
            range: { start: startDate.toISOString(), end: endDate.toISOString() },
            planUsed: plan,
            planWasDefault: !planRecord,
            netIncome,
            totalSpent,
            essentialBudget,
            essentialSpent,
            leisureSpent,
            investmentSpent, // Novo campo
            safetyBuffer,
            available,
            rawAvailable,
            suggestedInvestment,
            leisureSuggested,
            leisureFloor,
            confidenceScore,
            warnings,
            basicNeeds,
        };
    }

    static async recordContribution(userId, payload = {}) {
        const amountValue = parseDecimalInput(payload.amount);
        if (!amountValue || amountValue <= 0) {
            const error = new Error('Informe um valor válido para o aporte.');
            error.statusCode = 400;
            throw error;
        }

        if (!payload.sourceAccountId || !payload.destinationAccountId) {
            const error = new Error('É necessário informar as contas de origem e destino.');
            error.statusCode = 400;
            throw error;
        }

        if (payload.sourceAccountId === payload.destinationAccountId) {
            const error = new Error('As contas de origem e destino não podem ser iguais.');
            error.statusCode = 400;
            throw error;
        }

        const rawSource = (payload.sourceType || InvestmentContributionSource.MANUAL).toUpperCase();
        if (!Object.keys(InvestmentContributionSource).includes(rawSource)) {
            const error = new Error('Tipo de aporte inválido.');
            error.statusCode = 400;
            throw error;
        }
        const normalizedSource = rawSource;

        const planRecord = await this.getPlanRecord(userId);
        if (!planRecord) {
            const error = new Error('Crie um plano de investimentos antes de registrar aportes.');
            error.statusCode = 400;
            throw error;
        }

        const { monthKey } = getMonthRange(payload.month);
        const analysis = await this.calculateFreeToInvest(userId, monthKey, planRecord);
        const leisureImpact = Math.max(0, amountValue - analysis.suggestedInvestment);

        const contribution = await prisma.$transaction(async (tx) => {
            const [sourceAccount, destinationAccount] = await Promise.all([
                tx.account.findFirst({ where: { id: payload.sourceAccountId, userId } }),
                tx.account.findFirst({ where: { id: payload.destinationAccountId, userId } }),
            ]);

            if (!sourceAccount || !destinationAccount) {
                const error = new Error('Contas de origem ou destino não encontradas.');
                error.statusCode = 404;
                throw error;
            }
            if (destinationAccount.tipo !== 'investimento') {
                const error = new Error('A conta de destino deve ser do tipo investimento.');
                error.statusCode = 400;
                throw error;
            }

            const investmentsCategoryId = await ensureInvestmentsCategory(tx, userId);
            const executedAt = new Date();
            const description = payload.description || `Aporte em ${destinationAccount.nome}`;

            const debitTransaction = await tx.transaction.create({
                data: {
                    userId,
                    accountId: sourceAccount.id,
                    descricao: `Transferência para investimentos - ${destinationAccount.nome}`,
                    valor: amountValue,
                    data: executedAt,
                    tipo: 'despesa',
                    pago: true,
                    metodoPagamento: 'debito',
                    categoryId: investmentsCategoryId,
                },
            });

            const creditTransaction = await tx.transaction.create({
                data: {
                    userId,
                    accountId: destinationAccount.id,
                    descricao: description,
                    valor: amountValue,
                    data: executedAt,
                    tipo: 'receita',
                    pago: true,
                    metodoPagamento: 'debito',
                    categoryId: investmentsCategoryId,
                },
            });

            const holding = payload.holdingId
                ? await tx.investmentHolding.findFirst({
                    where: { id: payload.holdingId, planId: planRecord.id, userId },
                })
                : null;

            const createdContribution = await tx.investmentContribution.create({
                data: {
                    planId: planRecord.id,
                    userId,
                    accountId: destinationAccount.id,
                    fromAccountId: sourceAccount.id,
                    holdingId: holding ? holding.id : null,
                    amount: amountValue,
                    leisureImpact,
                    status: InvestmentContributionStatus.EXECUTED,
                    source: normalizedSource,
                    notes: payload.notes || null,
                    analysisSnapshot: {
                        month: analysis.month,
                        netIncome: analysis.netIncome,
                        suggestedInvestment: analysis.suggestedInvestment,
                        leisureSuggested: analysis.leisureSuggested,
                        available: analysis.available,
                        warnings: analysis.warnings,
                        plan: analysis.planUsed,
                        basicNeeds: analysis.basicNeeds,
                    },
                    debitTransactionId: debitTransaction.id,
                    creditTransactionId: creditTransaction.id,
                    executedAt,
                    month: monthKey,
                },
                include: {
                    destinationAccount: true,
                    sourceAccount: true,
                    holding: true,
                },
            });

            if (holding) {
                await tx.investmentHolding.update({
                    where: { id: holding.id },
                    data: { currentAmount: { increment: amountValue } },
                });
                if (holding.goalId) {
                    await tx.goalContribution.create({
                        data: {
                            goalId: holding.goalId,
                            amount: amountValue,
                            date: executedAt,
                            debitTransactionId: debitTransaction.id,
                            creditTransactionId: creditTransaction.id,
                        },
                    });
                    await tx.goal.update({
                        where: { id: holding.goalId },
                        data: { currentAmount: { increment: amountValue } },
                    });
                }
            }

            const pendingNudges = await tx.investmentNudgeConversion.findMany({
                where: {
                    planId: planRecord.id,
                    userId,
                    convertedAt: null,
                },
            });
            for (const nudge of pendingNudges) {
                const target = nudge.targetAmount || analysis.suggestedInvestment || 0;
                if (target <= 0) continue;
                if (executedAt > nudge.triggeredAt && amountValue >= target * 0.8) {
                    await tx.investmentNudgeConversion.update({
                        where: { id: nudge.id },
                        data: { convertedAt: executedAt },
                    });
                }
            }

            return createdContribution;
        });

        await AuditService.log({
            userId,
            action: 'CREATE_INVESTMENT_CONTRIBUTION',
            entity: 'INVESTMENT_CONTRIBUTION',
            entityId: contribution.id,
            details: {
                amount: amountValue,
                destinationAccountId: payload.destinationAccountId,
                sourceAccountId: payload.sourceAccountId,
            },
        });

        return {
            contribution: serializeContribution(contribution),
            analysis,
        };
    }

    static async getPerformance(userId, month) {
        const planRecord = await this.getPlanRecord(userId);
        if (!planRecord) {
            return {
                plan: null,
                snapshots: [],
                monthlyTotals: [],
                contributions: [],
            };
        }

        const { monthKey } = getMonthRange(month);
        const monthFilter = month ? { month: monthKey } : {};

        const [snapshots, contributions] = await Promise.all([
            prisma.investmentSnapshot.findMany({
                where: { planId: planRecord.id, userId, ...monthFilter },
                orderBy: { month: 'desc' },
                take: month ? undefined : 6,
            }),
            prisma.investmentContribution.findMany({
                where: { planId: planRecord.id, status: InvestmentContributionStatus.EXECUTED, ...monthFilter },
                orderBy: { executedAt: 'desc' },
                take: month ? undefined : 10,
                include: {
                    destinationAccount: true,
                    sourceAccount: true,
                    holding: true,
                },
            }),
        ]);

        const monthlyTotalsMap = new Map();
        contributions.forEach((contribution) => {
            const key = contribution.month;
            const current = monthlyTotalsMap.get(key) || { amount: 0, leisureImpact: 0, count: 0 };
            current.amount += toNumber(contribution.amount);
            current.leisureImpact += toNumber(contribution.leisureImpact);
            current.count += 1;
            monthlyTotalsMap.set(key, current);
        });

        const monthlyTotals = Array.from(monthlyTotalsMap.entries())
            .map(([key, value]) => ({
                month: key,
                amount: value.amount,
                leisureImpact: value.leisureImpact,
                contributions: value.count,
            }))
            .sort((a, b) => (a.month < b.month ? 1 : -1));

        return {
            plan: serializePlan(planRecord),
            snapshots: snapshots.map(serializeSnapshot),
            contributions: contributions.map(serializeContribution),
            monthlyTotals,
            month: month ? monthKey : null,
        };
    }

    static async getHoldings(userId) {
        const planRecord = await this.getPlanRecord(userId);
        if (!planRecord) return [];
        const holdings = await prisma.investmentHolding.findMany({
            where: { planId: planRecord.id, userId },
            include: { account: true, goal: true },
            orderBy: { createdAt: 'asc' },
        });
        return holdings;
    }

    static async updateHolding(userId, holdingId, payload = {}) {
        const planRecord = await this.getPlanRecord(userId);
        if (!planRecord) {
            const error = new Error('Crie um plano de investimentos antes de vincular holdings.');
            error.statusCode = 400;
            throw error;
        }

        const holding = await prisma.investmentHolding.findFirst({
            where: { id: holdingId, planId: planRecord.id, userId },
        });
        if (!holding) {
            const error = new Error('Holding não encontrada para este usuário.');
            error.statusCode = 404;
            throw error;
        }

        const data = {};

        if (payload.assetClass) data.assetClass = payload.assetClass;
        if ('ticker' in payload) data.ticker = payload.ticker || null;
        if ('expectedReturn' in payload) {
            const parsed = parseDecimalInput(payload.expectedReturn);
            data.expectedReturn = parsed !== null ? parsed : null;
        }
        if ('goalId' in payload) {
            const goalId = payload.goalId;
            if (goalId) {
                const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
                if (!goal) {
                    const error = new Error('Meta informada não existe ou não pertence a você.');
                    error.statusCode = 404;
                    throw error;
                }
            }
            data.goalId = goalId || null;
        }

        const updated = await prisma.investmentHolding.update({
            where: { id: holdingId },
            data,
            include: { account: true, goal: true },
        });

        return updated;
    }

    static async updateHoldingGoal(userId, holdingId, goalId) {
        return this.updateHolding(userId, holdingId, { goalId });
    }

    static async createHolding(userId, payload = {}) {
        const planRecord = await this.getPlanRecord(userId);
        if (!planRecord) {
            const error = new Error('Crie um plano de investimentos antes de adicionar holdings.');
            error.statusCode = 400;
            throw error;
        }

        if (!payload.accountId) {
            const error = new Error('Selecione uma conta de investimento para vincular ao holding.');
            error.statusCode = 400;
            throw error;
        }

        const account = await prisma.account.findFirst({
            where: { id: payload.accountId, userId, tipo: 'investimento' },
        });
        if (!account) {
            const error = new Error('Conta de investimento não encontrada.');
            error.statusCode = 404;
            throw error;
        }

        if (payload.goalId) {
            const goal = await prisma.goal.findFirst({ where: { id: goalId, userId } });
            if (!goal) {
                const error = new Error('Meta informada não existe ou não pertence a você.');
                error.statusCode = 404;
                throw error;
            }
        }

        const created = await prisma.investmentHolding.create({
            data: {
                planId: planRecord.id,
                userId,
                accountId: payload.accountId,
                goalId: payload.goalId || null,
                assetClass: payload.assetClass || 'Personalizado',
                ticker: payload.ticker || null,
                expectedReturn: payload.expectedReturn ? parseDecimalInput(payload.expectedReturn) : null,
                metadata: payload.metadata || null,
            },
            include: { account: true, goal: true },
        });

        return created;
    }

    static async deleteHolding(userId, holdingId) {
        const planRecord = await this.getPlanRecord(userId);
        if (!planRecord) {
            const error = new Error('Crie um plano de investimentos antes de remover holdings.');
            error.statusCode = 400;
            throw error;
        }

        const holding = await prisma.investmentHolding.findFirst({
            where: { id: holdingId, planId: planRecord.id, userId },
        });
        if (!holding) {
            const error = new Error('Holding não encontrado.');
            error.statusCode = 404;
            throw error;
        }

        await prisma.investmentHolding.delete({ where: { id: holdingId } });
        return { success: true };
    }
}

export default InvestmentPlannerService;
