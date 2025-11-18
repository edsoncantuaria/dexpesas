// backend/src/services/cellBudgetService.js
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import CellBudgetSyncService from './cellBudgetSyncService.js';
import prisma from '../config/prismaClient.js';

class CellBudgetService {
  static async ensureCategory(categoryId) {
    if (!categoryId) {
      const error = new Error('Selecione uma categoria válida para este orçamento.');
      error.statusCode = 400;
      throw error;
    }
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true, userId: true },
    });
    if (!category || category.userId) {
      const error = new Error('Categoria selecionada não existe ou não está disponível para o Modo Família.');
      error.statusCode = 400;
      throw error;
    }
    return category;
  }
  static normalizeType(type) {
    if (!type) return 'CELL';
    const allowed = ['CELL', 'HYBRID', 'PERSONAL'];
    return allowed.includes(type) ? type : 'CELL';
  }

  static async listBudgets(cellId, month = null) {
    const budgets = await prisma.cellBudget.findMany({
      where: { cellId },
      include: {
        category: true,
        fund: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!month) {
      return budgets;
    }

    const parsedMonth = month.match(/^\d{4}-\d{2}$/)
      ? month
      : format(new Date(), 'yyyy-MM');
    const baseDate = parseISO(`${parsedMonth}-01`);
    const startDate = startOfMonth(baseDate);
    const endDate = endOfMonth(baseDate);

    const expenses = await prisma.sharedExpense.groupBy({
      by: ['categoryId'],
      where: {
        clanId: cellId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { totalAmount: true },
    });

    const spentMap = new Map(
      expenses.map((item) => [item.categoryId, Number(item._sum.totalAmount || 0)]),
    );

    return budgets.map((budget) => {
      const limitValue =
        typeof budget.limit === 'object' && budget.limit !== null && typeof budget.limit.toNumber === 'function'
          ? Number(budget.limit.toNumber())
          : Number(budget.limit || 0);
      return {
        ...budget,
        limit: limitValue,
        aggregatedSpent: budget.categoryId ? spentMap.get(budget.categoryId) || 0 : 0,
      };
    });
  }

  static async getBudgetById(budgetId) {
    return prisma.cellBudget.findUnique({
      where: { id: budgetId },
      include: { category: true, fund: true },
    });
  }

  static async createBudget(cellId, payload) {
    await this.ensureCategory(payload.categoryId);
    const data = {
      cellId,
      categoryId: payload.categoryId,
      label: payload.label || null,
      type: this.normalizeType(payload.type),
      recurrenceType: payload.recurrenceType || 'MONTHLY',
      recurrenceDays: payload.recurrenceDays || null,
      splitConfig: payload.splitConfig || null,
      fundId: payload.fundId || null,
      limit: payload.limit,
      effectiveFrom: payload.effectiveFrom
        ? new Date(payload.effectiveFrom)
        : null,
      effectiveTo: payload.effectiveTo ? new Date(payload.effectiveTo) : null,
    };

    const budget = await prisma.cellBudget.create({ data });
    await CellBudgetSyncService.resyncBudget(budget.id);
    return budget;
  }

  static async updateBudget(budgetId, payload) {
    if (payload.categoryId !== undefined) {
      await this.ensureCategory(payload.categoryId);
    }
    const data = {
      categoryId:
        payload.categoryId === undefined ? undefined : payload.categoryId,
      label: payload.label === undefined ? undefined : payload.label,
      type:
        payload.type === undefined
          ? undefined
          : this.normalizeType(payload.type),
      recurrenceType:
        payload.recurrenceType === undefined ? undefined : payload.recurrenceType,
      recurrenceDays:
        payload.recurrenceDays === undefined ? undefined : payload.recurrenceDays,
      splitConfig: payload.splitConfig === undefined ? undefined : payload.splitConfig,
      fundId: payload.fundId === undefined ? undefined : payload.fundId,
      limit: payload.limit === undefined ? undefined : payload.limit,
      effectiveFrom:
        payload.effectiveFrom === undefined
          ? undefined
          : payload.effectiveFrom
          ? new Date(payload.effectiveFrom)
          : null,
      effectiveTo:
        payload.effectiveTo === undefined
          ? undefined
          : payload.effectiveTo
          ? new Date(payload.effectiveTo)
          : null,
    };

    const updated = await prisma.cellBudget.update({
      where: { id: budgetId },
      data,
    });
    await CellBudgetSyncService.resyncBudget(updated.id);
    return updated;
  }

  static async deleteBudget(budgetId) {
    await CellBudgetSyncService.removeMirrors(budgetId);
    await prisma.cellBudget.delete({ where: { id: budgetId } });
  }

  static async attachFund(budgetId, fundId) {
    return prisma.cellBudget.update({
      where: { id: budgetId },
      data: { fundId },
      include: { fund: true },
    });
  }
}

export default CellBudgetService;
