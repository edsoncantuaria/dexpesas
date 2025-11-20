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
import CellBudgetSyncService from '../services/cellBudgetSyncService.js';
import CellSharedAccountService from '../services/cellSharedAccountService.js';

const CATEGORY_CACHE = new Map();
async function ensureCategoryId(label, tx = prisma) {
  if (CATEGORY_CACHE.has(label)) {
    return CATEGORY_CACHE.get(label);
  }
  const categories = await tx.category.findMany({
    select: { id: true, nome: true },
  });
  categories.forEach((category) => {
    if (!CATEGORY_CACHE.has(category.nome)) {
      CATEGORY_CACHE.set(category.nome, category.id);
    }
  });
  if (!CATEGORY_CACHE.has(label)) {
    throw new Error(`Categoria '${label}' não encontrada.`);
  }
  return CATEGORY_CACHE.get(label);
}

const normalizeValue = (value) => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'object') {
    if (typeof value.toNumber === 'function') {
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

const syncCellBudgets = async (cellId) => {
  try {
    await CellBudgetSyncService.resyncCellBudgets(cellId);
  } catch (error) {
    console.error('[CELL_SYNC] Falha ao sincronizar orçamentos da família', cellId, error);
  }
};

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
        return res.status(404).json({ message: 'Família não encontrada.' });
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
          message: 'Você já participa de uma família. Deixe a atual antes de criar outra.',
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
        return res.status(409).json({ message: 'Já existe uma família com este nome.' });
      }
      next(error);
    }
  }

  async updateCell(req, res, next) {
    const { cellId } = req.params;
    const userId = req.user.id;
    try {
      const membership = await applyCellPermissions(userId, cellId, { manageMembers: true });
      if (membership.role !== 'LEADER') {
        return res.status(403).json({ message: 'Somente o líder pode editar as informações da família.' });
      }

      const data = {
        name: req.body.name,
        description: req.body.description,
        iconUrl: req.body.iconUrl,
      };

      const filteredData = Object.fromEntries(
        Object.entries(data).filter(([, value]) => value !== undefined)
      );

      const updated = await prisma.clan.update({
        where: { id: cellId },
        data: filteredData,
      });

      await AuditService.log({
        userId,
        action: 'CELL_UPDATED',
        entity: 'CELL',
        entityId: cellId,
        details: filteredData,
      });

      res.json(serialize(updated));
    } catch (error) {
      next(error);
    }
  }

  async listBudgets(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, {});
      const month = req.query.month || null;
      const budgets = await CellBudgetService.listBudgets(cellId, month);
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
      if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
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
      if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
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
      await applyCellPermissions(req.user.id, cellId, {});
      const funds = await prisma.cellFund.findMany({
        where: { cellId },
        include: {
          contributions: true,
          custodian: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          goal: true,
        },
      });
      const ensuredFunds = await Promise.all(
        funds.map(async (fund) => {
          if (fund.goal) {
            return fund;
          }
          const goal = await prisma.goal.create({
            data: {
              clanId: cellId,
              cellFundId: fund.id,
              name: fund.name,
              targetAmount: fund.targetAmount,
              currentAmount: fund.currentAmount,
              status: 'IN_PROGRESS',
            },
          });
          return { ...fund, goal };
        }),
      );
      res.json(serialize(ensuredFunds));
    } catch (error) {
      next(error);
    }
  }

  async createFund(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, { manageFunds: true });

      const allowedRoles = ['LEADER', 'ADMIN', 'MEMBER'];
      const requestedCustodianId = req.body.custodianId || req.user.id;

      const custodianMembership = await prisma.clanMember.findFirst({
        where: {
          clanId: cellId,
          userId: requestedCustodianId,
        },
      });

      if (!custodianMembership) {
        return res.status(400).json({
          message: 'Escolha um responsável que participe dessa família.',
        });
      }

      const rawWithdrawalRoles = Array.isArray(req.body.withdrawalRoles) ? req.body.withdrawalRoles : [];
      const normalizedWithdrawalRoles = rawWithdrawalRoles
        .filter((role) => allowedRoles.includes(role))
        .filter((role, index, array) => array.indexOf(role) === index);
      const withdrawalRoles = normalizedWithdrawalRoles.length > 0 ? normalizedWithdrawalRoles : ['LEADER'];

      const validChannels = ['CELL_ACCOUNT', 'CUSTODIAN', 'MANUAL'];
      let depositInstructions = null;
      const custodianAccountLabel =
        typeof req.body.custodianAccountLabel === 'string' && req.body.custodianAccountLabel.trim().length
          ? req.body.custodianAccountLabel.trim()
          : null;
      if (req.body.depositInstructions && typeof req.body.depositInstructions === 'object') {
        const { channel, referenceLabel, notes } = req.body.depositInstructions;
        const sanitize = (value) =>
          typeof value === 'string' && value.trim().length ? value.trim() : null;
        if (channel && validChannels.includes(channel)) {
          depositInstructions = {
            channel,
            referenceLabel: sanitize(referenceLabel),
            notes: sanitize(notes),
          };
        }
      }

      const fund = await prisma.$transaction(async (tx) => {
        const createdFund = await tx.cellFund.create({
          data: {
            cellId,
            name: req.body.name,
            targetAmount: req.body.targetAmount,
            usagePolicy: req.body.usagePolicy || null,
            custodianId: requestedCustodianId,
            custodianAccountLabel,
            depositInstructions,
            withdrawalRoles,
            mirrorToCustodian: Boolean(req.body.mirrorToCustodian),
            status: req.body.status || 'ACTIVE',
            goalDeadline: req.body.goalDeadline ? new Date(req.body.goalDeadline) : null,
          },
        });

        await tx.goal.create({
          data: {
            clanId: cellId,
            cellFundId: createdFund.id,
            name: req.body.name,
            targetAmount: req.body.targetAmount,
            currentAmount: 0,
            status: 'IN_PROGRESS',
          },
        });

        return tx.cellFund.findUnique({
          where: { id: createdFund.id },
          include: {
            contributions: true,
            custodian: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            goal: true,
          },
        });
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

  async deleteFund(req, res, next) {
    const { fundId } = req.params;
    try {
      const fund = await prisma.cellFund.findUnique({
        where: { id: fundId },
      });
      if (!fund) {
        return res.status(404).json({ message: 'Fundo não encontrado.' });
      }

      await applyCellPermissions(req.user.id, fund.cellId, { manageFunds: true });

      if (Number(fund.currentAmount || 0) > 0) {
        return res.status(400).json({
          message: 'Só é possível excluir caixinhas zeradas.',
        });
      }

      await prisma.cellFund.delete({
        where: { id: fundId },
      });

      await AuditService.log({
        userId: req.user.id,
        action: 'CELL_FUND_DELETED',
        entity: 'CELL_FUND',
        entityId: fundId,
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async contributeToFund(req, res, next) {
    const { fundId } = req.params;
    const userId = req.user.id;
    try {
      await applyCellPermissions(req.user.id, null, { moveFunds: true }, { fundId });
      const fund = await prisma.cellFund.findUnique({
        where: { id: fundId },
        select: {
          name: true,
          goal: { select: { id: true } },
        },
      });
      if (!fund) {
        return res.status(404).json({ message: 'Fundo não encontrado.' });
      }
      const amount = Number(req.body.amount);
      if (!Number.isFinite(amount) || amount === 0) {
        return res.status(400).json({ message: 'Informe um valor válido.' });
      }
      const accountId = req.body.accountId;
      if (!accountId) {
        return res.status(400).json({ message: 'Selecione a conta utilizada.' });
      }
      const contribution = await prisma.$transaction(async (tx) => {
        const account = await tx.account.findFirst({
          where: {
            id: accountId,
            userId,
          },
        });
        if (!account) {
          const err = new Error('Conta não encontrada.');
          err.statusCode = 404;
          throw err;
        }
        const investimentosCategoryId = await ensureCategoryId('Investimentos', tx);
        const investing = amount > 0;
        const description = investing
          ? `Aporte na caixinha ${fund.name}`
          : `Resgate da caixinha ${fund.name}`;
        const transaction = await tx.transaction.create({
          data: {
            userId,
            accountId,
            descricao: description,
            valor: Math.abs(amount),
            data: new Date(),
            tipo: investing ? 'despesa' : 'receita',
            categoryId: investimentosCategoryId,
            metodoPagamento: investing ? 'debito' : 'dinheiro',
            pago: true,
          },
        });
        const metadata = {
          ...(req.body.metadata || {}),
          accountId,
          transactionId: transaction.id,
          direction: investing ? 'DEPOSIT' : 'WITHDRAW',
        };
        const createdContribution = await tx.cellFundContribution.create({
          data: {
            fundId,
            userId,
            amount,
            source: req.body.source || null,
            fromBudgetId: req.body.fromBudgetId || null,
            metadata,
          },
        });
        await tx.cellFund.update({
          where: { id: fundId },
          data: {
            currentAmount: {
              increment: amount,
            },
          },
        });
        if (fund.goal?.id) {
          await tx.goal.update({
            where: { id: fund.goal.id },
            data: {
              currentAmount: {
                increment: amount,
              },
            },
          });
          await tx.goalContribution.create({
            data: {
              goalId: fund.goal.id,
              amount,
              debitTransactionId: investing ? transaction.id : null,
            },
          });
        }
        return createdContribution;
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

  async listSharedExpenses(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, {});
      const expenses = await prisma.sharedExpense.findMany({
        where: { clanId: cellId },
        include: {
          category: {
            select: {
              id: true,
              nome: true,
            },
          },
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  avatarUrl: true,
                },
              },
              transaction: {
                select: {
                  id: true,
                  pago: true,
                  status: true,
                  accountId: true,
                  data: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      expenses.sort((a, b) => {
        const dateA = new Date(a.expenseDate || a.createdAt).getTime();
        const dateB = new Date(b.expenseDate || b.createdAt).getTime();
        return dateB - dateA;
      });
      res.json(serialize(expenses));
    } catch (error) {
      next(error);
    }
  }

  async createSharedExpense(req, res, next) {
    const { cellId } = req.params;
    const { description, categoryId, totalAmount, splits, splitMethod } = req.body;
    try {
      await applyCellPermissions(req.user.id, cellId, { recordTransactions: true });
      const parsedTotal = Number(totalAmount);
      if (!Number.isFinite(parsedTotal) || parsedTotal <= 0) {
        return res.status(400).json({ message: 'Informe um valor válido para o total.' });
      }
      const sanitizedSplits = Array.isArray(splits)
        ? splits
            .map((entry) => ({
              memberId: entry.memberId,
              amount: Number(entry.amount),
              accountId: entry.accountId,
            }))
            .filter(
              (entry) =>
                entry.memberId &&
                entry.accountId &&
                Number.isFinite(entry.amount) &&
                entry.amount > 0,
            )
        : [];
      if (!sanitizedSplits.length) {
        return res.status(400).json({ message: 'Defina os participantes do rateio.' });
      }
      const totalSplits = sanitizedSplits.reduce((acc, entry) => acc + entry.amount, 0);
      if (Math.round(totalSplits * 100) !== Math.round(parsedTotal * 100)) {
        return res.status(400).json({ message: 'A soma dos rateios precisa bater com o total.' });
      }
      const memberIds = sanitizedSplits.map((entry) => entry.memberId);
      const memberRecords = await prisma.clanMember.findMany({
        where: {
          clanId: cellId,
          userId: {
            in: memberIds,
          },
        },
        select: {
          userId: true,
        },
      });
      const allowedMembers = new Set(memberRecords.map((record) => record.userId));
      for (const entry of sanitizedSplits) {
        if (!allowedMembers.has(entry.memberId)) {
          return res.status(400).json({ message: 'Inclua apenas integrantes da família no rateio.' });
        }
      }
      const accountRecords = await prisma.cellSharedAccount.findMany({
        where: {
          cellId,
          accountId: {
            in: sanitizedSplits.map((entry) => entry.accountId),
          },
        },
        include: {
          account: {
            select: {
              id: true,
              userId: true,
              nome: true,
            },
          },
        },
      });
      const accountMap = new Map(accountRecords.map((record) => [record.accountId, record]));
      for (const entry of sanitizedSplits) {
        const sharedAccount = accountMap.get(entry.accountId);
        if (!sharedAccount) {
          return res.status(400).json({ message: 'A conta selecionada não está compartilhada com a família.' });
        }
        if (sharedAccount.account?.userId !== entry.memberId) {
          return res.status(400).json({ message: 'A conta precisa pertencer ao membro escolhido.' });
        }
      }
      const expenseDate = req.body.expenseDate ? new Date(req.body.expenseDate) : new Date();
      const expense = await prisma.$transaction(async (tx) => {
        const createdExpense = await tx.sharedExpense.create({
          data: {
            clanId: cellId,
            creatorId: req.user.id,
            description,
            totalAmount: parsedTotal,
            splitMethod: splitMethod || 'AMOUNT',
            categoryId,
            expenseDate,
          },
        });
        for (const split of sanitizedSplits) {
          const transaction = await tx.transaction.create({
            data: {
              userId: split.memberId,
              accountId: split.accountId,
              descricao: `Despesa compartilhada: ${description}`,
              valor: split.amount,
              data: new Date(),
              tipo: 'despesa',
              categoryId,
              metodoPagamento: 'debito',
              pago: false,
              status: 'PENDING',
            },
          });
          await tx.sharedExpenseParticipant.create({
            data: {
              sharedExpenseId: createdExpense.id,
              userId: split.memberId,
              amountOwed: split.amount,
              defaultAccountId: split.accountId || null,
              createdTransactionId: transaction.id,
            },
          });
        }
        return tx.sharedExpense.findUnique({
          where: { id: createdExpense.id },
          include: {
            category: {
              select: {
                id: true,
                nome: true,
              },
            },
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                  },
                },
                transaction: {
                  select: {
                    id: true,
                    pago: true,
                    status: true,
                    accountId: true,
                  },
                },
              },
            },
          },
        });
      });
      await TimelineService.appendEvent({
        cellId,
        actorId: req.user.id,
        type: 'CELL_SHARED_EXPENSE_CREATED',
        title: 'Despesa compartilhada cadastrada',
        description: `${description} • ${totalAmount}`,
        payload: {
          sharedExpenseId: expense.id,
          description,
          totalAmount,
        },
      });
      res.status(201).json(serialize(expense));
    } catch (error) {
      next(error);
    }
  }

  async settleSharedExpense(req, res, next) {
    const { cellId, expenseId } = req.params;
    const { participantId, accountId } = req.body;
    try {
      const participant = await prisma.sharedExpenseParticipant.findUnique({
        where: { id: participantId },
        include: {
          sharedExpense: {
            select: {
              clanId: true,
              description: true,
              categoryId: true,
            },
          },
          transaction: {
            select: {
              pago: true,
            },
          },
        },
      });
      if (!participant || participant.sharedExpense.clanId !== cellId) {
        return res.status(404).json({ message: 'Participante não encontrado.' });
      }
      if (participant.userId !== req.user.id) {
        await applyCellPermissions(req.user.id, cellId, { manageBudgets: true });
      } else {
        await applyCellPermissions(req.user.id, cellId, {});
      }
      if (!accountId) {
        return res.status(400).json({ message: 'Informe a conta utilizada.' });
      }
      if (participant.transaction?.pago) {
        return res.status(400).json({ message: 'Esta cota já foi quitada.' });
      }
      const account = await prisma.account.findFirst({
        where: {
          id: accountId,
          userId: participant.userId,
        },
      });
      if (!account) {
        return res.status(404).json({ message: 'Conta não encontrada para este membro.' });
      }
      const updatedParticipant = await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.update({
          where: { id: participant.createdTransactionId },
          data: {
            accountId,
            pago: true,
            status: 'POSTED',
            data: new Date(),
            clearedAt: new Date(),
          },
        });
        await TimelineService.appendEvent({
          cellId,
          actorId: req.user.id,
          type: 'CELL_SHARED_EXPENSE_SETTLED',
          title: 'Rateio quitado',
          description: `${participant.sharedExpense.description} • ${transaction.valor}`,
          payload: {
            participantId,
            transactionId: transaction.id,
          },
        });
        return tx.sharedExpenseParticipant.update({
          where: { id: participantId },
          data: {
            defaultAccountId: accountId,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
            transaction: {
              select: {
                id: true,
                pago: true,
                status: true,
                accountId: true,
              },
            },
          },
        });
      });
      res.json(serialize(updatedParticipant));
    } catch (error) {
      next(error);
    }
  }

  async deleteSharedExpense(req, res, next) {
    const { cellId, expenseId } = req.params;
    try {
      const expense = await prisma.sharedExpense.findUnique({
        where: { id: expenseId },
        include: {
          participants: true,
        },
      });
      if (!expense || expense.clanId !== cellId) {
        return res.status(404).json({ message: 'Despesa não encontrada.' });
      }
      await applyCellPermissions(req.user.id, cellId, { manageBudgets: true });
      await prisma.$transaction(async (tx) => {
        const transactionIds = expense.participants.map((participant) => participant.createdTransactionId);
        if (transactionIds.length) {
          try {
            await tx.transaction.deleteMany({
              where: {
                id: {
                  in: transactionIds,
                },
              },
            });
          } catch (error) {
            console.warn('[CELL_EXPENSE_DELETE] Falha ao remover transações do rateio', error);
          }
        }
        await tx.sharedExpenseParticipant.deleteMany({
          where: { sharedExpenseId: expense.id },
        });
        await tx.sharedExpense.delete({
          where: { id: expense.id },
        });
      });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async listSharedAccounts(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, {});
      const sharedAccounts = await CellSharedAccountService.list(cellId);
      res.json(serialize(sharedAccounts));
    } catch (error) {
      next(error);
    }
  }

  async linkSharedAccount(req, res, next) {
    const { cellId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, { manageSharedAccounts: true });
      const record = await CellSharedAccountService.link(cellId, req.body);

      await TimelineService.appendEvent({
        cellId,
        actorId: req.user.id,
        type: 'CELL_SHARED_ACCOUNT_LINKED',
        title: 'Conta compartilhada vinculada',
        description: `A conta ${record.account?.nome || record.accountId} agora está visível para a família.`,
        payload: {
          sharedAccountId: record.id,
          accountId: record.accountId,
          visibility: record.visibility,
        },
      });

      await AuditService.log({
        userId: req.user.id,
        action: 'CELL_SHARED_ACCOUNT_LINKED',
        entity: 'CELL',
        entityId: cellId,
        details: {
          sharedAccountId: record.id,
          accountId: record.accountId,
          visibility: record.visibility,
        },
      });

      res.status(201).json(serialize(record));
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
      next(error);
    }
  }

  async unlinkSharedAccount(req, res, next) {
    const { cellId, sharedAccountId } = req.params;
    try {
      await applyCellPermissions(req.user.id, cellId, { manageSharedAccounts: true });
      const removed = await CellSharedAccountService.unlink(cellId, sharedAccountId);

      await TimelineService.appendEvent({
        cellId,
        actorId: req.user.id,
        type: 'CELL_SHARED_ACCOUNT_UNLINKED',
        title: 'Conta compartilhada removida',
        description: `A conta ${removed.account?.nome || removed.accountId} foi desvinculada da família.`,
        payload: { sharedAccountId },
      });

      await AuditService.log({
        userId: req.user.id,
        action: 'CELL_SHARED_ACCOUNT_UNLINKED',
        entity: 'CELL',
        entityId: cellId,
        details: { sharedAccountId },
      });

      res.status(204).send();
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message });
      }
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
        return res.status(404).json({ message: 'Despesa não encontrada para esta família.' });
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
      await applyCellPermissions(req.user.id, cellId, {});
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

  async recordEquilibriumSettlement(req, res, next) {
    const { cellId } = req.params;
    const actorId = req.user.id;
    const { counterpartId, amount, direction, notes } = req.body;
    try {
      if (counterpartId === actorId) {
        return res.status(400).json({ message: 'Selecione outro membro para registrar o acerto.' });
      }
      const normalizedAmount = Number(amount);
      if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
        return res.status(400).json({ message: 'Informe um valor válido para registrar o acerto.' });
      }
      await applyCellPermissions(req.user.id, cellId, { moveFunds: true });
      const referenceMonth = EquilibriumService.buildReferenceMonth();
      const payerId = direction === 'PAY' ? actorId : counterpartId;
      const receiverId = direction === 'PAY' ? counterpartId : actorId;
      const settlement = await prisma.cellEquilibriumSettlement.create({
        data: {
          cellId,
          payerId,
          receiverId,
          amount: normalizedAmount,
          notes: notes?.trim() || null,
          referenceMonth,
        },
      });
      await EquilibriumService.snapshotCell(cellId, referenceMonth);
      await TimelineService.appendEvent({
        cellId,
        actorId,
        type: 'CELL_EQUILIBRIUM_SETTLEMENT',
        title: direction === 'PAY' ? 'Pagamento registrado' : 'Reembolso recebido',
        description:
          direction === 'PAY'
            ? 'Você registrou um PIX para quitar parte do Equilíbrio.'
            : 'Você registrou um recebimento no Equilíbrio.',
        payload: {
          settlementId: settlement.id,
          payerId,
          receiverId,
          amount: normalizedAmount,
          notes: settlement.notes,
        },
      });
      res.status(201).json(serialize(settlement));
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
        return res.status(400).json({ message: 'Usuário já participa da família.' });
      }
      const normalizedVisibility = {
        viewPersonalBudget: Boolean(requestedVisibility?.viewPersonalBudget),
        viewAccounts: Boolean(requestedVisibility?.viewAccounts),
        shareDebtSummary: Boolean(requestedVisibility?.shareDebtSummary),
      };
      const invite = await prisma.clanInvite.create({
        data: {
          clanId: cellId,
          invitedUserId,
          inviterId,
          expiresAt: addDays(new Date(), 7),
        },
      });
      await AuditService.log({
        userId: inviterId,
        action: 'CELL_INVITE_CREATED',
        entity: 'CELL_INVITE',
        entityId: invite.id,
        details: { cellId, invitedUserId, requestedVisibility: normalizedVisibility },
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
      let clanId = null;
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
         clanId = invite.clanId;
        if (invite.clan._count.members >= invite.clan.maxMembers) {
          throw { statusCode: 400, message: 'Família lotada.' };
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
      if (clanId) {
        await syncCellBudgets(clanId);
      }
      res.json({ message: 'Bem-vindo à família!' });
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

  async deleteCell(req, res, next) {
    const { cellId } = req.params;
    const userId = req.user.id;
    try {
      const membership = await applyCellPermissions(userId, cellId, { manageMembers: true });
      if (membership.role !== 'LEADER') {
        return res.status(403).json({ message: 'Somente o líder da família pode excluí-la.' });
      }

      const memberCount = await prisma.clanMember.count({
        where: { clanId: cellId },
      });

      if (memberCount > 1) {
        return res.status(400).json({
          message: 'Não é possível excluir a família enquanto houver outros membros. Peça para todos saírem antes.',
        });
      }

      const budgets = await prisma.cellBudget.findMany({
        where: { cellId },
        select: { id: true },
      });

      await Promise.all(
        budgets.map((budget) => CellBudgetSyncService.removeMirrors(budget.id)),
      );

      await prisma.clan.delete({
        where: { id: cellId },
      });

      await AuditService.log({
        userId,
        action: 'CELL_DELETED',
        entity: 'CELL',
        entityId: cellId,
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async leaveCell(req, res, next) {
    const { cellId } = req.params;
    const userId = req.user.id;
    try {
      const membership = await prisma.clanMember.findUnique({
        where: {
          userId_clanId: {
            userId,
            clanId: cellId,
          },
        },
      });

      if (!membership) {
        return res.status(404).json({ message: 'Você não participa desta família.' });
      }

      if (membership.role === 'LEADER') {
        const otherMembers = await prisma.clanMember.count({
          where: {
            clanId: cellId,
            NOT: { userId },
          },
        });
        if (otherMembers > 0) {
          return res.status(400).json({
            message: 'Como líder, você precisa transferir a liderança ou excluir a família antes de sair.',
          });
        }
        return res.status(400).json({
          message: 'Use a opção de excluír a família quando você for o último membro.',
        });
      }

      await prisma.clanMember.delete({
        where: { id: membership.id },
      });

      await AuditService.log({
        userId,
        action: 'CELL_MEMBER_LEFT',
        entity: 'CELL',
        entityId: cellId,
        details: { memberId: membership.id },
      });

      await syncCellBudgets(cellId);
      res.json({ message: 'Você saiu da família.' });
    } catch (error) {
      next(error);
    }
  }
}

export default new CellController();
