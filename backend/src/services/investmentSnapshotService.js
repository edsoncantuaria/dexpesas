// backend/src/services/investmentSnapshotService.js
import { differenceInDays, endOfMonth, format, parseISO, startOfMonth, subDays, subMonths } from 'date-fns';
import pkg from '@prisma/client';
import InvestmentPlannerService from './investmentPlannerService.js';
import GamificationService from './gamificationService.js';

const { PrismaClient, InvestmentContributionStatus, AiAnalysisType } = pkg;
const prisma = new PrismaClient();

const DEFAULT_CDI = 0.1375;
const CDI_ANNUAL_RATE = Number.parseFloat(process.env.CDI_ANNUAL_RATE || `${DEFAULT_CDI}`);
const CDI_MONTHLY_RATE =
    Number.isFinite(CDI_ANNUAL_RATE) && CDI_ANNUAL_RATE > 0
        ? Math.pow(1 + CDI_ANNUAL_RATE, 1 / 12) - 1
        : Math.pow(1 + DEFAULT_CDI, 1 / 12) - 1;

function monthKeyOrDefault(monthKey) {
    if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) {
        return monthKey;
    }
    const previous = subMonths(new Date(), 1);
    return format(previous, 'yyyy-MM');
}

function toNumber(value, fallback = 0) {
    if (value === null || value === undefined) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

class InvestmentSnapshotService {
    async generateMonthlyRollup(targetMonth) {
        const month = monthKeyOrDefault(targetMonth);
        console.log(`📊 [InvestmentSnapshot] Gerando rollup para ${month}`);

        const plans = await prisma.investmentPlan.findMany({
            where: { status: 'ACTIVE' },
            include: { holdings: true },
        });

        for (const plan of plans) {
            try {
                const snapshotExists = await prisma.investmentSnapshot.findUnique({
                    where: { planId_month: { planId: plan.id, month } },
                });
                if (snapshotExists) {
                    continue;
                }

                const analysis = await InvestmentPlannerService.calculateFreeToInvest(plan.userId, month, plan);
                const monthContributions = await prisma.investmentContribution.aggregate({
                    _sum: { amount: true },
                    where: {
                        planId: plan.id,
                        month,
                        status: InvestmentContributionStatus.EXECUTED,
                    },
                });
                const cumulative = await prisma.investmentContribution.aggregate({
                    _sum: { amount: true },
                    where: {
                        planId: plan.id,
                        status: InvestmentContributionStatus.EXECUTED,
                        month: { lte: month },
                    },
                });

                const holdingsReturn = plan.holdings.reduce((acc, holding) => {
                    if (!holding.expectedReturn || !holding.currentAmount) return acc;
                    const expected = Number(holding.expectedReturn);
                    const currentAmount = Number(holding.currentAmount);
                    if (!Number.isFinite(expected) || !Number.isFinite(currentAmount)) {
                        return acc;
                    }
                    // Considera o valor como taxa anual e converte para mensal
                    return acc + currentAmount * (expected / 12);
                }, 0);

                const monthInvested = toNumber(monthContributions._sum.amount);
                const totalInvested = toNumber(cumulative._sum.amount);
                const suggestedInvestment = analysis?.suggestedInvestment ?? 0;
                const deltaVsPlan = monthInvested - suggestedInvestment;
                const benchmarkMonthlyReturn = totalInvested > 0 ? totalInvested * CDI_MONTHLY_RATE : 0;

                await prisma.investmentSnapshot.create({
                    data: {
                        planId: plan.id,
                        userId: plan.userId,
                        month,
                        totalInvested,
                        totalReturns: holdingsReturn,
                        leisureSpent: analysis?.leisureSpent ?? 0,
                        deltaVsPlan,
                        confidenceScore: analysis?.confidenceScore ?? null,
                        commentaryJson: {
                            available: analysis?.available ?? 0,
                            suggestedInvestment,
                            warnings: analysis?.warnings ?? [],
                            basicNeeds: analysis?.basicNeeds ?? [],
                            monthInvested,
                            cdiMonthlyRate: CDI_MONTHLY_RATE,
                            benchmarkMonthlyReturn,
                        },
                    },
                });

                await this.rewardInvestmentStreak(plan.id, plan.userId);
            } catch (error) {
                console.error(`Erro ao gerar snapshot para plano ${plan.id}:`, error.message);
            }
        }

        await this.generateMetricSnapshot(month);
    }

    async runSmartNudges() {
        console.log('📬 [InvestmentSnapshot] Checando planos para smart nudges.');
        const plans = await prisma.investmentPlan.findMany({
            where: { status: 'ACTIVE' },
        });

        for (const plan of plans) {
            try {
                const snapshots = await prisma.investmentSnapshot.findMany({
                    where: { planId: plan.id },
                    orderBy: { month: 'desc' },
                    take: 3,
                });
                if (snapshots.length < 2) continue;

                const [latest, previous] = snapshots;
                const latestDelta = toNumber(latest.deltaVsPlan);
                const previousDelta = toNumber(previous.deltaVsPlan);
                const marker = `investment-plan:${plan.id}:${latest.month}`;
                const deltaExisting = await prisma.aiAnalysis.findFirst({
                    where: {
                        userId: plan.userId,
                        relevantTransactionIds: marker,
                    },
                });
                if (latestDelta < 0 && previousDelta < 0 && !deltaExisting) {
                    const analysisRecord = await prisma.aiAnalysis.create({
                        data: {
                            userId: plan.userId,
                            type: AiAnalysisType.OPPORTUNITY_ANALYSIS,
                            relevantTransactionIds: marker,
                            analysisText: `Seu plano de investimentos ficou abaixo da meta por dois meses seguidos (Delta atual: ${latestDelta.toFixed(
                                2,
                            )}). Considere ajustar o lazer ou automatizar um aporte recorrente.`,
                        },
                    });

                    await prisma.investmentNudgeConversion.create({
                        data: {
                            planId: plan.id,
                            userId: plan.userId,
                            aiAnalysisId: analysisRecord.id,
                            targetAmount: Number(latest.commentaryJson?.suggestedInvestment ?? 0),
                            triggeredAt: analysisRecord.createdAt,
                        },
                    });
                }

                const cdiMarker = `investment-plan:${plan.id}:cdi:${latest.month}`;
                const cdiExisting = await prisma.aiAnalysis.findFirst({
                    where: {
                        userId: plan.userId,
                        relevantTransactionIds: cdiMarker,
                    },
                });
                const recentForCdi = snapshots.slice(0, 3);
                if (
                    !cdiExisting &&
                    recentForCdi.length === 3 &&
                    recentForCdi.every((snapshot) => {
                        const benchmark = Number(snapshot.commentaryJson?.benchmarkMonthlyReturn ?? 0);
                        if (benchmark <= 0) return false;
                        const returnsValue = Number(snapshot.totalReturns ?? 0);
                        return returnsValue < benchmark;
                    })
                ) {
                    const latestBenchmark = Number(latest.commentaryJson?.benchmarkMonthlyReturn ?? 0);
                    const analysisRecord = await prisma.aiAnalysis.create({
                        data: {
                            userId: plan.userId,
                            type: AiAnalysisType.OPPORTUNITY_ANALYSIS,
                            relevantTransactionIds: cdiMarker,
                            analysisText: `Sua rentabilidade ficou abaixo do CDI por três meses consecutivos (R$ ${Number(
                                latest.totalReturns ?? 0,
                            ).toFixed(2)} vs. R$ ${latestBenchmark.toFixed(
                                2,
                            )}). Considere migrar parte do patrimônio para Tesouro Direto ou CDBs 110% do CDI.`,
                        },
                    });

                    await prisma.investmentNudgeConversion.create({
                        data: {
                            planId: plan.id,
                            userId: plan.userId,
                            aiAnalysisId: analysisRecord.id,
                            targetAmount: latestBenchmark,
                            triggeredAt: analysisRecord.createdAt,
                        },
                    });
                }
            } catch (error) {
                console.error(`Erro ao gerar smart nudge para plano ${plan.id}:`, error.message);
            }
        }
    }

    async generateMetricSnapshot(month) {
        const exists = await prisma.investmentMetricSnapshot.findUnique({ where: { month } });
        if (exists) return;

        const referenceDate = parseISO(`${month}-01T00:00:00.000Z`);
        const monthStart = startOfMonth(referenceDate);
        const monthEnd = endOfMonth(referenceDate);
        const windowStart = subDays(monthEnd, 30);

        const soloUsers = await prisma.user.findMany({
            where: {
                createdAt: { gte: windowStart, lte: monthEnd },
                clanMemberships: { none: {} },
            },
            select: {
                id: true,
                createdAt: true,
                fixedMonthlyIncome: true,
                investmentPlan: { select: { id: true, createdAt: true } },
            },
        });

        let soloWindowCount = 0;
        let soloPlanWithin30 = 0;
        soloUsers.forEach((user) => {
            soloWindowCount += 1;
            if (user.investmentPlan?.createdAt) {
                const diffDays = Math.abs(differenceInDays(user.investmentPlan.createdAt, user.createdAt));
                if (diffDays <= 30) {
                    soloPlanWithin30 += 1;
                }
            }
        });
        const soloPlanAdoptionPct = soloWindowCount ? soloPlanWithin30 / soloWindowCount : 0;

        const contributions = await prisma.investmentContribution.groupBy({
            by: ['userId'],
            where: {
                month,
                status: InvestmentContributionStatus.EXECUTED,
            },
            _sum: { amount: true },
        });
        const contributionUserIds = contributions.map((entry) => entry.userId);
        const incomeUsers = await prisma.user.findMany({
            where: {
                id: { in: contributionUserIds },
            },
            select: { id: true, fixedMonthlyIncome: true },
        });
        const incomeMap = new Map(incomeUsers.map((item) => [item.id, Number(item.fixedMonthlyIncome || 0)]));
        let ratioSum = 0;
        let ratioCount = 0;
        contributions.forEach((entry) => {
            const income = incomeMap.get(entry.userId);
            const contributionValue = toNumber(entry._sum.amount);
            if (income && income > 0) {
                ratioSum += contributionValue / income;
                ratioCount += 1;
            }
        });
        const avgContributionIncomeRatio = ratioCount ? ratioSum / ratioCount : 0;

        const monthsWindow = [
            month,
            format(subMonths(referenceDate, 1), 'yyyy-MM'),
            format(subMonths(referenceDate, 2), 'yyyy-MM'),
        ];
        const recentSnapshots = await prisma.investmentSnapshot.findMany({
            where: { month: { in: monthsWindow } },
        });
        const snapshotMap = new Map();
        recentSnapshots.forEach((snapshot) => {
            const list = snapshotMap.get(snapshot.planId) || [];
            list.push(snapshot);
            snapshotMap.set(snapshot.planId, list);
        });

        let adherenceCount = 0;
        let adherenceConsidered = 0;
        snapshotMap.forEach((list) => {
            const sorted = list.sort((a, b) => (a.month < b.month ? 1 : -1));
            if (sorted.length < 3) return;
            adherenceConsidered += 1;
            const adherent = sorted.slice(0, 3).every((snapshot) => {
                const suggested = Number(snapshot.commentaryJson?.suggestedInvestment ?? 0);
                const monthInvested = Number(snapshot.commentaryJson?.monthInvested ?? 0);
                if (suggested === 0) return true;
                return monthInvested >= 0.8 * suggested;
            });
            if (adherent) {
                adherenceCount += 1;
            }
        });
        const planAdherenceRate = adherenceConsidered ? adherenceCount / adherenceConsidered : 0;

        const nudgeConversions = await prisma.investmentNudgeConversion.findMany({
            where: { triggeredAt: { gte: monthStart, lte: monthEnd } },
            select: { convertedAt: true },
        });
        const totalNudges = nudgeConversions.length;
        const convertedNudges = nudgeConversions.filter((nudge) => Boolean(nudge.convertedAt)).length;
        const nudgeConversionRate = totalNudges ? convertedNudges / totalNudges : 0;

        const activeTransactions = await prisma.transaction.findMany({
            where: { data: { gte: monthStart, lte: monthEnd } },
            select: { userId: true },
            distinct: ['userId'],
        });
        const activeUserIds = activeTransactions.map((tx) => tx.userId);
        const activePlanUsers = await prisma.investmentPlan.findMany({
            where: {
                status: 'ACTIVE',
                userId: { in: activeUserIds },
            },
            select: { userId: true },
        });
        const adoptionRate = activeUserIds.length ? activePlanUsers.length / activeUserIds.length : 0;

        const previousMonth = format(subMonths(referenceDate, 1), 'yyyy-MM');
        const prevPlanIds = new Set(
            (
                await prisma.investmentContribution.findMany({
                    where: { month: previousMonth, status: InvestmentContributionStatus.EXECUTED },
                    select: { planId: true },
                })
            ).map((entry) => entry.planId),
        );
        const currentPlanIds = new Set(
            (
                await prisma.investmentContribution.findMany({
                    where: { month, status: InvestmentContributionStatus.EXECUTED },
                    select: { planId: true },
                })
            ).map((entry) => entry.planId),
        );
        let churnCount = 0;
        prevPlanIds.forEach((planId) => {
            if (!currentPlanIds.has(planId)) {
                churnCount += 1;
            }
        });
        const churnRate = prevPlanIds.size ? churnCount / prevPlanIds.size : 0;

        await prisma.investmentMetricSnapshot.create({
            data: {
                month,
                soloPlanAdoptionPct,
                avgContributionIncomeRatio,
                planAdherenceRate,
                nudgeConversionRate,
                adoptionRate,
                churnRate,
            },
        });
    }

    async rewardInvestmentStreak(planId, userId) {
        const snapshots = await prisma.investmentSnapshot.findMany({
            where: { planId },
            orderBy: { month: 'desc' },
            take: 3,
        });
        if (snapshots.length < 3) return;
        const inStreak = snapshots.every((snapshot) => {
            const suggested = Number(snapshot.commentaryJson?.suggestedInvestment ?? 0);
            const monthInvested = Number(snapshot.commentaryJson?.monthInvested ?? 0);
            if (suggested <= 0) return false;
            return monthInvested >= 0.8 * suggested;
        });
        if (!inStreak) return;

        try {
            await GamificationService.triggerXpEvent(prisma, userId, 'INVESTMENT_PLAN_STREAK', {
                planId,
                month: snapshots[0].month,
            });
        } catch (error) {
            console.error(`Erro ao registrar streak de investimentos para ${planId}:`, error.message);
        }
    }
}

export default new InvestmentSnapshotService();
