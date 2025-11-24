import pkg from '@prisma/client';
const { PrismaClient } = pkg;
const prisma = new PrismaClient();
import GamificationService from './gamificationService.js';
import DebtNotificationService from './debtNotificationService.js';
import { subMonths } from 'date-fns';

class DebtService {
    /**
     * Create a new debt
     */
    async createDebt(userId, data) {
        return await prisma.debt.create({
            data: {
                userId,
                name: data.name,
                debtType: data.debtType,
                originalAmount: data.originalAmount,
                currentBalance: data.currentBalance,
                interestRate: data.interestRate,
                minimumPayment: data.minimumPayment,
                cardId: data.cardId || null,
                categoryId: data.categoryId || null,
                strategy: data.strategy || 'SNOWBALL',
                targetPayoffDate: data.targetPayoffDate ? new Date(data.targetPayoffDate) : null,
                extraMonthlyPayment: data.extraMonthlyPayment || 0,
                status: 'ACTIVE'
            }
        });
    }

    /**
     * Get all debts for a user
     */
    async getDebts(userId) {
        const debts = await prisma.debt.findMany({
            where: { userId },
            include: {
                card: {
                    select: {
                        id: true,
                        nome: true,
                        lastFourDigits: true,
                        bandeira: true
                    }
                },
                category: {
                    select: {
                        id: true,
                        nome: true,
                        icon: true
                    }
                },
                milestones: {
                    where: { celebrated: false },
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: {
                currentBalance: 'desc'
            }
        });

        return debts;
    }

    /**
     * Get a single debt by ID
     */
    async getDebtById(userId, debtId) {
        return await prisma.debt.findFirst({
            where: {
                id: debtId,
                userId
            },
            include: {
                payments: {
                    orderBy: { paymentDate: 'desc' },
                    take: 10
                },
                milestones: true,
                card: true
            }
        });
    }

    /**
     * Update a debt
     */
    async updateDebt(userId, debtId, data) {
        // Verify ownership
        const debt = await prisma.debt.findFirst({
            where: { id: debtId, userId }
        });

        if (!debt) {
            throw new Error('Debt not found');
        }

        return await prisma.debt.update({
            where: { id: debtId },
            data
        });
    }

    /**
     * Delete a debt
     */
    async deleteDebt(userId, debtId) {
        const debt = await prisma.debt.findFirst({
            where: { id: debtId, userId }
        });

        if (!debt) {
            throw new Error('Debt not found');
        }

        return await prisma.debt.delete({
            where: { id: debtId }
        });
    }

    /**
     * Record a payment for a debt
     */
    async recordPayment(userId, debtId, paymentData) {
        const debt = await prisma.debt.findFirst({
            where: { id: debtId, userId }
        });

        if (!debt) {
            throw new Error('Debt not found');
        }

        const { amount, transactionId, paymentDate, notes, isExtraPayment } = paymentData;

        // Calculate interest portion (simplified: monthly rate * current balance)
        // In a real app, this might need more complex logic or manual input
        const monthlyRate = Number(debt.interestRate) / 100 / 12;
        const estimatedInterest = Number(debt.currentBalance) * monthlyRate;

        // Ensure interest doesn't exceed payment amount
        const interestPortion = Math.min(estimatedInterest, Number(amount));
        const principalPortion = Number(amount) - interestPortion;

        const newBalance = Math.max(0, Number(debt.currentBalance) - principalPortion);

        // Use transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            // Create payment record
            const payment = await tx.debtPayment.create({
                data: {
                    debtId,
                    transactionId,
                    amount,
                    principal: principalPortion,
                    interest: interestPortion,
                    paymentDate: new Date(paymentDate || new Date()),
                    balanceAfter: newBalance,
                    isExtraPayment: isExtraPayment || false,
                    notes
                }
            });

            // Update debt balance
            const updatedDebt = await tx.debt.update({
                where: { id: debtId },
                data: {
                    currentBalance: newBalance,
                    status: newBalance <= 0.01 ? 'PAID_OFF' : 'ACTIVE',
                    paidOffAt: newBalance <= 0.01 ? new Date() : null,
                    lastPaymentAt: new Date(paymentDate || new Date())
                }
            });

            // Trigger Gamification Event for Payment
            await GamificationService.triggerXpEvent(tx, userId, 'DEBT_PAYMENT_MADE', { amount: Number(amount) });

            // Check for milestones
            if (newBalance <= 0.01) {
                await tx.debtMilestone.create({
                    data: {
                        debtId,
                        type: 'PAID_OFF',
                        targetAmount: 0,
                        achievedAt: new Date(),
                        celebrated: false
                    }
                });
                // Trigger Gamification Event for Debt Paid Off
                await GamificationService.triggerXpEvent(tx, userId, 'DEBT_PAID_OFF', { amount: Number(debt.originalAmount) });

                // Send notification for debt paid off
                await DebtNotificationService.notifyDebtPaidOff(userId, debt.name);

            } else if (Number(debt.originalAmount) > 0) {
                const progress = 1 - (newBalance / Number(debt.originalAmount));

                if (progress >= 0.5 && Number(debt.currentBalance) / Number(debt.originalAmount) > 0.5) {
                    // Just crossed 50%
                    await tx.debtMilestone.create({
                        data: {
                            debtId,
                            type: 'HALF_PAID',
                            targetAmount: Number(debt.originalAmount) / 2,
                            achievedAt: new Date(),
                            celebrated: false
                        }
                    });
                    // Trigger Gamification Event for Milestone
                    await GamificationService.triggerXpEvent(tx, userId, 'DEBT_MILESTONE_REACHED', { type: 'HALF_PAID' });
                }
            }

            return { payment, updatedDebt };
        });

        return result;
    }

    /**
     * Calculate payoff plan based on strategy
     */
    async calculatePayoffPlan(userId, strategy = 'SNOWBALL', extraMonthly = 0) {
        const debts = await this.getDebts(userId);
        const activeDebts = debts.filter(d => d.status === 'ACTIVE' && Number(d.currentBalance) > 0);

        if (activeDebts.length === 0) {
            return {
                debts: [],
                totalMonths: 0,
                totalInterest: 0,
                payoffDate: new Date(),
                schedule: []
            };
        }

        // Sort debts based on strategy
        const sortedDebts = [...activeDebts].sort((a, b) => {
            if (strategy === 'SNOWBALL') {
                return Number(a.currentBalance) - Number(b.currentBalance); // Smallest balance first
            } else if (strategy === 'AVALANCHE') {
                return Number(b.interestRate) - Number(a.interestRate); // Highest interest first
            } else {
                return Number(a.currentBalance) - Number(b.currentBalance); // Default to Snowball
            }
        });

        // Simulation
        let month = 0;
        let totalInterest = 0;
        const schedule = [];

        // Working copy of debts
        const workingDebts = sortedDebts.map(d => ({
            id: d.id,
            name: d.name,
            balance: Number(d.currentBalance),
            interestRate: Number(d.interestRate),
            minimumPayment: Number(d.minimumPayment),
            originalId: d.id
        }));

        const totalMinimumPayment = workingDebts.reduce((sum, d) => sum + d.minimumPayment, 0);
        const totalAvailable = totalMinimumPayment + Number(extraMonthly);

        while (workingDebts.some(d => d.balance > 0.01) && month < 600) { // 50 years limit
            month++;
            let availableFunds = totalAvailable;
            const monthlyPayments = [];

            // 1. Pay minimums
            workingDebts.forEach(debt => {
                if (debt.balance > 0.01) {
                    const payment = Math.min(debt.minimumPayment, debt.balance);
                    availableFunds -= payment;
                    monthlyPayments.push({ debtId: debt.originalId, amount: payment, type: 'MINIMUM' });
                }
            });

            // 2. Pay extra to target
            const targetDebt = workingDebts.find(d => d.balance > 0.01);
            if (targetDebt && availableFunds > 0) {
                const extra = Math.min(availableFunds, targetDebt.balance); // Note: balance here is pre-payment in this step logic, but we need to be careful. 
                // Actually, the standard algorithm:
                // Apply minimums first, reduce balance? Or calculate all payments then apply?
                // Usually: Interest accrues on current balance. Payment is applied.
                // Let's simplify: 
                // Interest = Balance * Rate
                // Balance = Balance + Interest - Payment

                // Let's re-do the loop correctly:
                // 1. Calculate Interest for all
                // 2. Determine Payments (Min + Extra)
                // 3. Apply updates
            }

            // Correct Loop:
            // Reset available for this month logic
            availableFunds = totalAvailable;
            const currentMonthActions = [];

            // First pass: Determine minimums
            workingDebts.forEach(debt => {
                if (debt.balance > 0.01) {
                    let payment = Math.min(debt.minimumPayment, debt.balance);
                    // If balance is very low, min payment might cover it all.

                    debt.paymentThisMonth = payment;
                    availableFunds -= payment;
                } else {
                    debt.paymentThisMonth = 0;
                }
            });

            // Second pass: Apply extra to target
            if (availableFunds > 0) {
                const target = workingDebts.find(d => d.balance - d.paymentThisMonth > 0.01);
                if (target) {
                    const extra = Math.min(availableFunds, target.balance - target.paymentThisMonth);
                    target.paymentThisMonth += extra;
                    availableFunds -= extra;
                }
            }

            // Third pass: Apply Interest and Payments
            workingDebts.forEach(debt => {
                if (debt.balance > 0.01) {
                    const monthlyRate = debt.interestRate / 100 / 12;
                    const interest = debt.balance * monthlyRate;
                    totalInterest += interest;

                    // Payment covers interest first, then principal
                    // But for balance update: NewBal = OldBal + Interest - Payment
                    debt.balance = Math.max(0, debt.balance + interest - debt.paymentThisMonth);
                }
            });

            // Record schedule (optional, maybe just summary)
            // schedule.push({ month, debts: JSON.parse(JSON.stringify(workingDebts)) });
        }

        const payoffDate = new Date();
        payoffDate.setMonth(payoffDate.getMonth() + month);

        return {
            strategy,
            totalMonths: month,
            totalInterest,
            payoffDate,
            sortedDebts: sortedDebts.map(d => ({
                id: d.id,
                name: d.name,
                balance: Number(d.currentBalance),
                interest: Number(d.interestRate),
                minPayment: Number(d.minimumPayment)
            }))
        };
    }

    /**
     * Get debt analytics
     */
    async getAnalytics(userId) {
        const debts = await this.getDebts(userId);
        const activeDebts = debts.filter(d => d.status === 'ACTIVE' && Number(d.currentBalance) > 0);

        const totalDebt = activeDebts.reduce((sum, d) => sum + Number(d.currentBalance), 0);
        const totalMonthlyMin = activeDebts.reduce((sum, d) => sum + Number(d.minimumPayment), 0);

        // Calculate Average Income (last 3 months)
        const threeMonthsAgo = subMonths(new Date(), 3);
        const incomeTransactions = await prisma.transaction.aggregate({
            _sum: { valor: true },
            where: {
                userId,
                tipo: 'receita',
                data: { gte: threeMonthsAgo }
            }
        });

        const totalIncome3Months = Number(incomeTransactions._sum.valor || 0);
        const averageMonthlyIncome = totalIncome3Months / 3;

        const dti = averageMonthlyIncome > 0 ? (totalMonthlyMin / averageMonthlyIncome) * 100 : 0;

        // Calculate Interest Projections
        const snowballPlan = await this.calculatePayoffPlan(userId, 'SNOWBALL', 0);
        const avalanchePlan = await this.calculatePayoffPlan(userId, 'AVALANCHE', 0);

        // Simulate "Minimum Only" (which is basically Snowball with 0 extra, but let's be explicit)
        // Actually, calculatePayoffPlan with 0 extra IS minimum only if we don't reallocate freed up cash?
        // Wait, standard Snowball/Avalanche reallocates "freed up minimums".
        // "Minimum Only" usually means: pay min on each, never increase payment when one is done.
        // My current calculatePayoffPlan ALWAYS reallocates (Snowball method).
        // So I can't easily calculate "Non-Snowball Minimum Only" without modifying the function.
        // For now, let's compare Snowball vs Avalanche vs Current Interest (simple projection).

        // Simple annual interest projection
        const annualInterest = activeDebts.reduce((sum, d) => sum + (Number(d.currentBalance) * (Number(d.interestRate) / 100 * 12)), 0);

        return {
            totalDebt,
            totalMonthlyMin,
            averageMonthlyIncome,
            dti,
            projectedInterest: {
                snowball: snowballPlan.totalInterest,
                avalanche: avalanchePlan.totalInterest,
                annualCurrent: annualInterest
            },
            payoffDates: {
                snowball: snowballPlan.payoffDate,
                avalanche: avalanchePlan.payoffDate
            }
        };
    }

    /**
     * Record an adjustment (late fee, renegotiation, etc)
     */
    async recordAdjustment(userId, debtId, adjustmentData) {
        const debt = await prisma.debt.findFirst({
            where: { id: debtId, userId }
        });

        if (!debt) {
            throw new Error('Debt not found');
        }

        const { amount, reason, description } = adjustmentData;
        const newBalance = Number(debt.currentBalance) + Number(amount);

        return await prisma.$transaction(async (tx) => {
            // Create adjustment record
            const adjustment = await tx.debtAdjustment.create({
                data: {
                    debtId,
                    amount,
                    reason,
                    description
                }
            });

            // Update debt balance
            const updatedDebt = await tx.debt.update({
                where: { id: debtId },
                data: {
                    currentBalance: newBalance,
                    lastReviewedAt: new Date()
                }
            });

            return { adjustment, updatedDebt };
        });
    }

    /**
     * Analyze debt trends over the last 3 months
     */
    async analyzeTrends(userId) {
        const threeMonthsAgo = subMonths(new Date(), 3);

        // Get all payments in the last 3 months
        const payments = await prisma.debtPayment.findMany({
            where: {
                debt: { userId },
                paymentDate: { gte: threeMonthsAgo }
            },
            include: {
                debt: true
            },
            orderBy: { paymentDate: 'asc' }
        });

        const debts = await this.getDebts(userId);
        const activeDebts = debts.filter(d => d.status === 'ACTIVE');

        // Analyze each debt
        const debtAnalysis = activeDebts.map(debt => {
            const debtPayments = payments.filter(p => p.debtId === debt.id);

            if (debtPayments.length === 0) {
                return {
                    debtId: debt.id,
                    debtName: debt.name,
                    isSnowballing: true, // No payments = problematic
                    monthlyChangeRate: 0,
                    projectedNextMonth: Number(debt.currentBalance) * (1 + Number(debt.interestRate) / 100),
                    riskLevel: 'HIGH',
                    alerts: ['Nenhum pagamento registrado nos últimos 3 meses']
                };
            }

            // Calculate average monthly reduction
            const totalPaid = debtPayments.reduce((sum, p) => sum + Number(p.principal), 0);
            const monthsWithPayments = debtPayments.length;
            const avgMonthlyReduction = totalPaid / Math.max(1, monthsWithPayments);
            const expectedMinPayment = Number(debt.minimumPayment);

            // Is it snowballing? (balance increasing or payments below minimum)
            const isSnowballing = avgMonthlyReduction < expectedMinPayment * 0.8;
            const monthlyChangeRate = ((avgMonthlyReduction - expectedMinPayment) / expectedMinPayment) * 100;

            // Project next month
            const projectedNextMonth = Number(debt.currentBalance) - avgMonthlyReduction +
                (Number(debt.currentBalance) * Number(debt.interestRate) / 100);

            // Determine risk level
            let riskLevel = 'LOW';
            const alerts = [];

            if (isSnowballing) {
                riskLevel = 'HIGH';
                alerts.push('⚠️ Dívida em crescimento! Pagamentos abaixo do mínimo.');
            } else if (avgMonthlyReduction < expectedMinPayment * 1.2) {
                riskLevel = 'MEDIUM';
                alerts.push('Pagamentos próximos ao mínimo. Considere aumentar.');
            }

            if (Number(debt.interestRate) > 5) {
                alerts.push('Taxa de juros elevada. Priorize esta dívida.');
            }

            return {
                debtId: debt.id,
                debtName: debt.name,
                isSnowballing,
                monthlyChangeRate,
                projectedNextMonth,
                riskLevel,
                alerts,
                avgMonthlyPayment: avgMonthlyReduction
            };
        });

        return {
            summary: {
                totalDebts: activeDebts.length,
                snowballingDebts: debtAnalysis.filter(d => d.isSnowballing).length,
                highRiskDebts: debtAnalysis.filter(d => d.riskLevel === 'HIGH').length
            },
            debts: debtAnalysis
        };
    }

    /**
     * Get intelligent debt recommendations
     */
    async getRecommendations(userId) {
        const debts = await this.getDebts(userId);
        const activeDebts = debts.filter(d => d.status === 'ACTIVE' && Number(d.currentBalance) > 0);

        if (activeDebts.length === 0) {
            return {
                suggestedStrategy: 'NONE',
                priorityDebts: [],
                suggestedExtraPayment: 0,
                reasoning: ['Parabéns! Você não possui dívidas ativas.'],
                warnings: []
            };
        }

        // Get income and DTI
        const threeMonthsAgo = subMonths(new Date(), 3);
        const incomeTransactions = await prisma.transaction.aggregate({
            _sum: { valor: true },
            where: {
                userId,
                tipo: 'receita',
                data: { gte: threeMonthsAgo }
            }
        });

        const totalIncome = Number(incomeTransactions._sum.valor || 0);
        const avgMonthlyIncome = totalIncome / 3;
        const totalMonthlyMin = activeDebts.reduce((sum, d) => sum + Number(d.minimumPayment), 0);
        const dti = avgMonthlyIncome > 0 ? (totalMonthlyMin / avgMonthlyIncome) * 100 : 0;

        const reasoning = [];
        const warnings = [];

        // Determine suggested strategy
        let suggestedStrategy = 'SNOWBALL';

        // If high interest debts exist, suggest avalanche
        const highInterestDebts = activeDebts.filter(d => Number(d.interestRate) > 3);
        if (highInterestDebts.length > 0) {
            const totalHighInterest = highInterestDebts.reduce((sum, d) => sum + Number(d.currentBalance), 0);
            const totalDebt = activeDebts.reduce((sum, d) => sum + Number(d.currentBalance), 0);

            if (totalHighInterest / totalDebt > 0.5) {
                suggestedStrategy = 'AVALANCHE';
                reasoning.push('Método Avalanche recomendado: você possui dívidas com juros altos.');
            } else {
                reasoning.push('Método Snowball recomendado: vitórias rápidas ajudam na motivação.');
            }
        } else {
            reasoning.push('Método Snowball recomendado: elimine dívidas pequenas primeiro para ganhar motivação.');
        }

        // Calculate suggested extra payment (10-20% of disposable income)
        const disposableIncome = avgMonthlyIncome - totalMonthlyMin;
        let suggestedExtraPayment = 0;

        if (disposableIncome > 0) {
            suggestedExtraPayment = Math.min(disposableIncome * 0.15, avgMonthlyIncome * 0.2);
            reasoning.push(`Com sua renda média de R$ ${avgMonthlyIncome.toFixed(2)}, você pode destinar R$ ${suggestedExtraPayment.toFixed(2)} extras mensalmente.`);
        } else {
            warnings.push('⚠️ Renda insuficiente para pagamentos extras. Considere aumentar renda ou reduzir despesas.');
        }

        // Prioritize debts
        let priorityDebts;
        if (suggestedStrategy === 'AVALANCHE') {
            priorityDebts = [...activeDebts]
                .sort((a, b) => Number(b.interestRate) - Number(a.interestRate))
                .slice(0, 3)
                .map(d => d.id);
        } else {
            priorityDebts = [...activeDebts]
                .sort((a, b) => Number(a.currentBalance) - Number(b.currentBalance))
                .slice(0, 3)
                .map(d => d.id);
        }

        // Warnings based on DTI
        if (dti > 40) {
            warnings.push('🔴 DTI Crítico (>40%): Sua renda está muito comprometida. Priorize reduzir dívidas urgentemente.');
        } else if (dti > 30) {
            warnings.push('🟡 DTI Alto (>30%): Cuidado! Você está próximo do limite recomendado.');
        }

        // Get trends for additional warnings
        const trends = await this.analyzeTrends(userId);
        if (trends.summary.snowballingDebts > 0) {
            warnings.push(`⚠️ ${trends.summary.snowballingDebts} dívida(s) em crescimento descontrolado!`);
        }

        return {
            suggestedStrategy,
            priorityDebts,
            suggestedExtraPayment: Math.round(suggestedExtraPayment * 100) / 100,
            avgMonthlyIncome: Math.round(avgMonthlyIncome * 100) / 100,
            currentDTI: Math.round(dti * 10) / 10,
            reasoning,
            warnings
        };
    }

    /**
     * Get payment history for a debt
     */
    async getPaymentHistory(userId, debtId) {
        const debt = await prisma.debt.findFirst({
            where: { id: debtId, userId },
            include: {
                payments: {
                    orderBy: { paymentDate: 'desc' },
                    include: {
                        transaction: {
                            select: {
                                id: true,
                                descricao: true
                            }
                        }
                    }
                },
                adjustments: {
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!debt) {
            throw new Error('Debt not found');
        }

        return {
            debt: {
                id: debt.id,
                name: debt.name,
                currentBalance: debt.currentBalance,
                originalAmount: debt.originalAmount
            },
            payments: debt.payments,
            adjustments: debt.adjustments
        };
    }

    /**
     * Simulate different payment scenarios
     */
    async simulateScenarios(userId, scenarios) {
        const debts = await this.getDebts(userId);
        const activeDebts = debts.filter(d => d.status === 'ACTIVE' && Number(d.currentBalance) > 0);

        if (activeDebts.length === 0) {
            return {
                scenarios: [],
                message: 'Nenhuma dívida ativa para simular'
            };
        }

        const results = [];

        for (const scenario of scenarios) {
            const { strategy = 'SNOWBALL', extraMonthly = 0, name } = scenario;
            const plan = await this.calculatePayoffPlan(userId, strategy, extraMonthly);

            results.push({
                name: name || `${strategy} com R$ ${extraMonthly} extra`,
                strategy,
                extraMonthly,
                totalMonths: plan.totalMonths,
                totalInterest: Math.round(plan.totalInterest * 100) / 100,
                payoffDate: plan.payoffDate,
                monthlyPayment: activeDebts.reduce((sum, d) => sum + Number(d.minimumPayment), 0) + extraMonthly
            });
        }

        // Sort by total interest (best to worst)
        results.sort((a, b) => a.totalInterest - b.totalInterest);

        return {
            scenarios: results,
            bestOption: results[0],
            savings: results.length > 1 ? Math.round((results[results.length - 1].totalInterest - results[0].totalInterest) * 100) / 100 : 0
        };
    }
}


export default new DebtService();
