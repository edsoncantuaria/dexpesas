// backend/src/controllers/investmentController.js
import pkg from '@prisma/client';
import InvestmentPlannerService from '../services/investmentPlannerService.js';
import AuditService from '../services/auditService.js';

const { PrismaClient } = pkg;
const prisma = new PrismaClient();

class InvestmentController {
    async getPlan(req, res, next) {
        try {
            const { month } = req.query;
            const payload = await InvestmentPlannerService.getPlanWithAnalysis(req.user.id, month);
            res.json(payload);
        } catch (error) {
            next(error);
        }
    }

    async upsertPlan(req, res, next) {
        try {
            const result = await InvestmentPlannerService.upsertPlan(req.user.id, req.body || {});
            await AuditService.log({
                userId: req.user.id,
                action: result.created ? 'CREATE_INVESTMENT_PLAN' : 'UPDATE_INVESTMENT_PLAN',
                entity: 'INVESTMENT_PLAN',
                entityId: result.plan.id || req.user.id,
                details: { plan: result.plan },
                ipAddress: req.ip,
            });
            res.status(result.created ? 201 : 200).json(result);
        } catch (error) {
            next(error);
        }
    }

    async createContribution(req, res, next) {
        try {
            const contribution = await InvestmentPlannerService.recordContribution(req.user.id, req.body || {});
            res.status(201).json(contribution);
        } catch (error) {
            next(error);
        }
    }

    async getPerformance(req, res, next) {
        try {
            const { month } = req.query;
            const data = await InvestmentPlannerService.getPerformance(req.user.id, month);
            res.json(data);
        } catch (error) {
            next(error);
        }
    }

    async getHoldings(req, res, next) {
        try {
            const holdings = await InvestmentPlannerService.getHoldings(req.user.id);
            res.json(holdings);
        } catch (error) {
            next(error);
        }
    }

    async createHolding(req, res, next) {
        try {
            const holding = await InvestmentPlannerService.createHolding(req.user.id, req.body || {});
            res.status(201).json(holding);
        } catch (error) {
            next(error);
        }
    }

    async updateHolding(req, res, next) {
        try {
            const { id } = req.params;
            const holding = await InvestmentPlannerService.updateHolding(req.user.id, id, req.body || {});
            res.json(holding);
        } catch (error) {
            next(error);
        }
    }

    async deleteHolding(req, res, next) {
        try {
            const { id } = req.params;
            await InvestmentPlannerService.deleteHolding(req.user.id, id);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    async getMetrics(req, res, next) {
        try {
            const { month } = req.query;
            let snapshot = null;
            if (month) {
                snapshot = await prisma.investmentMetricSnapshot.findUnique({ where: { month } });
            }
            if (!snapshot) {
                snapshot = await prisma.investmentMetricSnapshot.findFirst({ orderBy: { month: 'desc' } });
            }
            res.json(snapshot || {});
        } catch (error) {
            next(error);
        }
    }

    async startOnboarding(req, res, next) {
        try {
            const { fixedMonthlyIncome, month, ...planPayload } = req.body || {};
            if (fixedMonthlyIncome === undefined || fixedMonthlyIncome === null) {
                return res.status(400).json({ message: 'Informe a renda fixa mensal para personalizar o plano.' });
            }

            await prisma.user.update({
                where: { id: req.user.id },
                data: { fixedMonthlyIncome: parseFloat(fixedMonthlyIncome) },
            });

            const result = await InvestmentPlannerService.upsertPlan(req.user.id, planPayload);
            const freshPlanRecord = await InvestmentPlannerService.getPlanRecord(req.user.id);
            const analysis = await InvestmentPlannerService.calculateFreeToInvest(
                req.user.id,
                month,
                freshPlanRecord,
            );

            await AuditService.log({
                userId: req.user.id,
                action: 'INVESTMENT_ONBOARDING',
                entity: 'INVESTMENT_PLAN',
                entityId: result.plan?.id || req.user.id,
                details: { fixedMonthlyIncome, plan: result.plan },
                ipAddress: req.ip,
            });

            res.status(201).json({
                plan: result.plan,
                analysis,
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new InvestmentController();
