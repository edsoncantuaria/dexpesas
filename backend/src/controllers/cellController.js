// backend/src/controllers/cellController.js
import { addDays } from 'date-fns';
import CellBudgetService from '../services/cellBudgetService.js';
import SplitEngineService from '../services/splitEngineService.js';
import EquilibriumService from '../services/equilibriumService.js';
import DecisionService from '../services/decisionService.js';
import TimelineService from '../services/timelineService.js';
import CellAlertService from '../services/cellAlertService.js';
import AuditService from '../services/auditService.js';

import prisma from '../config/prismaClient.js';
import { applyCellPermissions } from '../middlewares/cellPermissions.js';

const normalizeValue = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'object') {
    if (value.constructor?.name === 'Decimal' && typeof value.toNumber === 'function') {
      return value.toNumber();
    }
    if (Array.isArray(value)) {
      return value.map((item) => normalizeValue(item));
    }
    const result = {};
    for (const [key, innerValue] of Object.entries(value)) {
      result[key] = normalizeValue(innerValue);
    }
    return result;
  }
  return value;
};

const serialize = (payload) => normalizeValue(payload);

class CellController {
  async listCells(req, res, next) {
    const userId = req.user.id;
    try {
      const memberships = await prisma.clanMember.findMany({
        where: { userId },
        include: {
          clan: true,
        },
      });
      res.json(serialize(memberships.map((membership) => membership.clan)));
    } catch (error) {
      next(error);
    }
  }

  async getCellDetails(req, res, next) {
    const { cellId } = req.params;
    try {
      const cell = await prisma.clan.findUnique({
        where: { id: cellId },
        include: {
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                  level: true,
                },
              },
            },
          },
          leader: { select: { id: true, name: true, level: true } },
          _count: { select: { members: true } },
        },
      });
      if (!cell) {
        return res.status(404).json({ message: 'Célula não encontrada.' });
      }
      res.json(serialize(cell));
    } catch (error) {
      next(error);
    }
  }

  async createCell(req, res, next) {
    const { name, description, iconUrl } = req.body;
    const userId = req.user.id;
    try {
      const existingMembership = await prisma.clanMember.findFirst({
        where: { userId },
      });
      if (existingMembership) {
        return res.status(400).json({
          message: 'Você já participa de uma célula. Deixe a atual antes de criar outra.',
        });
      }
      const newCell = await prisma.$transaction(async (tx) => {
        const clan = await tx.clan.create({
          data: {
            name,
            description,
            iconUrl,
            leaderId: userId,
          },
        });

        await tx.clanMember.create({
          data: {
            clanId: clan.id,
            userId,
            role: 'LEADER',
          },
        });
        return clan;
      });
      await AuditService.log({
        userId,
        action: 'CELL_CREATED',
        entity: 'CELL',
        entityId: newCell.id,
        details: { name, description },
      });
      res.status(201).json(serialize(newCell));
    } catch (error) {
      if (error.code === 'P2002') {
        return res.status(409).json({ message: 'Já existe uma célula com este nome.' });
      }
      next(error);
    }
  }

  async listBudgets(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, { manageBudgets: true });
      const budgets = await CellBudgetService.listBudgets(cellId);
      res.json(serialize(budgets));
    } catch (error) {
      next(error);
    }
  }

  async createBudget(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, { manageBudgets: true });
      const budget = await CellBudgetService.createBudget(cellId, req.body);
      await AuditService.log({
        userId: req.user.id,
        action: 'CELL_BUDGET_CREATED',
        entity: 'CELL_BUDGET',
        entityId: budget.id,
        details: { cellId, payload: req.body },
      });
      res.status(201).json(serialize(budget));
    } catch (error) {
      next(error);
    }
  }

  async updateBudget(req, res, next) {
    const { budgetId } = req.params;
    try {
      await applyCellPermissions(req.user.id, null, { manageBudgets: true }, { budgetId });
      const budget = await CellBudgetService.updateBudget(budgetId, req.body);
      await AuditService.log({
        userId: req.user.id,
        action: 'CELL_BUDGET_UPDATED',
        entity: 'CELL_BUDGET',
        entityId: budgetId,
        details: { changes: req.body },
      });
      res.json(serialize(budget));
    } catch (error) {
      next(error);
    }
  }

  async deleteBudget(req, res, next) {
    const { budgetId } = req.params;
    try {
      await applyCellPermissions(req.user.id, null, { manageBudgets: true }, { budgetId });
      await CellBudgetService.deleteBudget(budgetId);
      await AuditService.log({
        userId: req.user.id,
        action: 'CELL_BUDGET_DELETED',
        entity: 'CELL_BUDGET',
        entityId: budgetId,
      });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async listFunds(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, { manageFunds: true });
      const funds = await prisma.cellFund.findMany({
        where: { cellId },
        include: {
          contributions: true,
        },
      });
      res.json(serialize(funds));
    } catch (error) {
      next(error);
    }
  }

  async createFund(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, { manageFunds: true });

      const fund = await prisma.cellFund.create({
        data: {
          cellId,
          name: req.body.name,
          targetAmount: req.body.targetAmount,
          usagePolicy: req.body.usagePolicy || null,
          status: req.body.status || 'ACTIVE',
          goalDeadline: req.body.goalDeadline
            ? new Date(req.body.goalDeadline)
            : null,
        },
      });
      await AuditService.log({
        userId: req.user.id,
        action: 'CELL_FUND_CREATED',
        entity: 'CELL_FUND',
        entityId: fund.id,
        details: { cellId, payload: req.body },
      });
      res.status(201).json(serialize(fund));
    } catch (error) {
      next(error);
    }
  }

  async contributeToFund(req, res, next) {
    const { fundId } = req.params;
    const userId = req.user.id;
    try {
      await applyCellPermissions(req.user.id, null, { moveFunds: true }, { fundId });
      const contribution = await prisma.cellFundContribution.create({
        data: {
          fundId,
          userId,
          amount: req.body.amount,
          source: req.body.source || null,
          fromBudgetId: req.body.fromBudgetId || null,
          metadata: req.body.metadata || null,
        },
      });
      await prisma.cellFund.update({
        where: { id: fundId },
        data: {
          currentAmount: {
            increment: req.body.amount,
          },
        },
      });
      await AuditService.log({
        userId,
        action: 'CELL_FUND_CONTRIBUTION',
        entity: 'CELL_FUND',
        entityId: fundId,
        details: { contribution },
      });
      res.status(201).json(serialize(contribution));
    } catch (error) {
      next(error);
    }
  }

  async runSplitEngine(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, { manageBudgets: true });
      const ruleId = req.body.ruleId || null;
      const expenseId = req.body.expenseId;
      const expense = await prisma.sharedExpense.findUnique({
        where: { id: expenseId },
      });
      if (!expense || expense.clanId !== cellId) {
        return res.status(404).json({ message: 'Despesa não encontrada para esta célula.' });
      }
      const result = await SplitEngineService.applyRuleToExpense(
        expenseId,
        ruleId,
      );
      const event = await TimelineService.appendEvent({
        cellId,
        actorId: req.user.id,
        type: 'CELL_SPLIT_APPLIED',
        title: 'Rateio aplicado',
        description: `Despesa ${expenseId} rateada com sucesso.`,
        payload: { expenseId, ruleId },
      });
      await AuditService.log({
        userId: req.user.id,
        action: 'CELL_SPLIT_APPLIED',
        entity: 'CELL',
        entityId: cellId,
        details: { expenseId, ruleId },
      });
      console.log('[CELL_EVENT]', {
        type: 'CELL_SPLIT_APPLIED',
        cellId,
        expenseId,
        ruleId,
        eventId: event.id,
      });
      res.json(serialize({ splits: result }));
    } catch (error) {
      next(error);
    }
  }

  async listSplitRules(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, { manageBudgets: true });
      const rules = await prisma.cellSplitRule.findMany({
        where: { cellId },
      });
      res.json(serialize(rules));
    } catch (error) {
      next(error);
    }
  }

  async createSplitRule(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, { manageBudgets: true });
      const rule = await prisma.cellSplitRule.create({
        data: {
          cellId,
          name: req.body.name,
          trigger: req.body.trigger,
          method: req.body.method,
          weightsConfig: req.body.weightsConfig || null,
          consumptionMetric: req.body.consumptionMetric || null,
          autoReimburse: Boolean(req.body.autoReimburse),
          metadata: req.body.metadata || null,
        },
      });
      res.status(201).json(serialize(rule));
    } catch (error) {
      next(error);
    }
  }

  async listDecisions(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, { vote: true });
      const decisions = await DecisionService.listDecisions(cellId);
      res.json(serialize(decisions));
    } catch (error) {
      next(error);
    }
  }

  async createDecision(req, res, next) {
    const { cellId } = req.params;
    const actorId = req.user.id;
    try {
      await applyCellPermissions(req.user.id, cellId, { vote: true });
      const event = await DecisionService.createDecision(cellId, actorId, req.body);
      console.log('[CELL_EVENT]', {
        type: 'CELL_DECISION_CREATED',
        cellId,
        decisionId: event?.payload?.decisionId,
        eventId: event.id,
      });
      await AuditService.log({
        userId: actorId,
        action: 'CELL_DECISION_CREATED',
        entity: 'CELL',
        entityId: cellId,
        details: { decision: event },
      });
      res.status(201).json(serialize(event));
    } catch (error) {
      next(error);
    }
  }

  async voteDecision(req, res, next) {
    const { cellId, decisionId } = req.params;
    const actorId = req.user.id;
    try {
      await applyCellPermissions(req.user.id, cellId, { vote: true });
      const event = await DecisionService.vote(cellId, decisionId, actorId, req.body.vote);
      console.log('[CELL_EVENT]', {
        type: 'CELL_DECISION_VOTE',
        cellId,
        decisionId,
        actorId,
        vote: req.body.vote,
        eventId: event.id,
      });
      await AuditService.log({
        userId: actorId,
        action: 'CELL_DECISION_VOTE',
        entity: 'CELL',
        entityId: cellId,
        details: { decisionId, vote: req.body.vote },
      });
      res.json(serialize(event));
    } catch (error) {
      next(error);
    }
  }

  async listTimeline(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, { recordTransactions: true });
      const events = await TimelineService.listEvents(cellId, {
        limit: Number(req.query.limit) || 50,
        cursor: req.query.cursor || null,
        types: req.query.types ? req.query.types.split(',') : [],
      });
      res.json(serialize(events));
    } catch (error) {
      next(error);
    }
  }

  async getEquilibrium(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, { viewEquilibrium: true });
      const summary = await EquilibriumService.snapshotCell(cellId);
      res.json(serialize(summary));
    } catch (error) {
      next(error);
    }
  }

  async listAlerts(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, { viewAlerts: true });
      const alerts = await CellAlertService.evaluateCell(cellId);
      res.json(serialize(alerts));
    } catch (error) {
      next(error);
    }
  }

  async inviteMember(req, res, next) {
    const { cellId } = req.params;
    const { invitedUserId, requestedVisibility } = req.body;
    const inviterId = req.user.id;
    try {
      await applyCellPermissions(inviterId, cellId, { manageMembers: true });
      if (invitedUserId === inviterId) {
        return res.status(400).json({ message: 'Você não pode se convidar.' });
      }
      const existingMember = await prisma.clanMember.findUnique({
        where: { userId_clanId: { userId: invitedUserId, clanId: cellId } },
      });
      if (existingMember) {
        return res.status(400).json({ message: 'Usuário já participa da célula.' });
      }
      const invite = await prisma.clanInvite.create({
        data: {
          clanId: cellId,
          invitedUserId,
          inviterId,
          expiresAt: addDays(new Date(), 7),
          metadata: {
            requestedVisibility: {
              viewPersonalBudget: Boolean(requestedVisibility?.viewPersonalBudget),
              viewAccounts: Boolean(requestedVisibility?.viewAccounts),
              shareDebtSummary: Boolean(requestedVisibility?.shareDebtSummary),
            },
          },
        },
      });
      await AuditService.log({
        userId: inviterId,
        action: 'CELL_INVITE_CREATED',
        entity: 'CELL_INVITE',
        entityId: invite.id,
        details: { cellId, invitedUserId },
      });
      res.status(201).json(serialize(invite));
    } catch (error) {
      next(error);
    }
  }

  async listPendingInvites(req, res, next) {
    try {
      const invites = await prisma.clanInvite.findMany({
        where: {
          invitedUserId: req.user.id,
          status: 'PENDING',
          expiresAt: { gte: new Date() },
        },
        include: { clan: true },
        orderBy: { createdAt: 'desc' },
      });
      res.json(serialize(invites));
    } catch (error) {
      next(error);
    }
  }

  async acceptInvite(req, res, next) {
    const { inviteId } = req.params;
    const userId = req.user.id;
    const { sharePersonalBudget = false, shareAccounts = false, shareDebtSummary = false } = req.body || {};
    try {
      await prisma.$transaction(async (tx) => {
        const invite = await tx.clanInvite.findFirst({
          where: { id: inviteId, invitedUserId: userId, status: 'PENDING' },
          include: {
            clan: { include: { _count: { select: { members: true } } } },
          },
        });
        if (!invite) {
          throw { statusCode: 404, message: 'Convite inválido ou expirado.' };
        }
        if (invite.clan._count.members >= invite.clan.maxMembers) {
          throw { statusCode: 400, message: 'Célula lotada.' };
        }
        await tx.clanMember.create({
          data: {
            clanId: invite.clanId,
            userId,
            role: 'MEMBER',
            permissions: {
              sharePersonalBudget: Boolean(sharePersonalBudget),
              shareAccounts: Boolean(shareAccounts),
              shareDebtSummary: Boolean(shareDebtSummary),
            },
          },
        });
        await tx.clanInvite.update({
          where: { id: inviteId },
          data: { status: 'ACCEPTED' },
        });
      });
      await AuditService.log({
        userId,
        action: 'CELL_INVITE_ACCEPTED',
        entity: 'CELL_INVITE',
        entityId: inviteId,
        details: { sharePersonalBudget, shareAccounts, shareDebtSummary },
      });
      res.json({ message: 'Bem-vindo à célula!' });
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(error);
    }
  }

  async declineInvite(req, res, next) {
    const { inviteId } = req.params;
    const userId = req.user.id;
    try {
      const result = await prisma.clanInvite.updateMany({
        where: { id: inviteId, invitedUserId: userId, status: 'PENDING' },
        data: { status: 'DECLINED' },
      });
      if (result.count === 0) {
        return res.status(404).json({ message: 'Convite inválido ou expirado.' });
      }
      await AuditService.log({
        userId,
        action: 'CELL_INVITE_DECLINED',
        entity: 'CELL_INVITE',
        entityId: inviteId,
      });
      res.json({ message: 'Convite recusado.' });
    } catch (error) {
      next(error);
    }
  }
}

export default new CellController();
