// backend/src/services/cellBudgetSyncService.js
import { format, endOfMonth, parseISO, startOfMonth, addDays } from 'date-fns';
import prisma from '../config/prismaClient.js';

class CellBudgetSyncService {
  static resolveMonth(budget) {
    if (budget.effectiveFrom) {
      return format(new Date(budget.effectiveFrom), 'yyyy-MM');
    }
    return format(new Date(), 'yyyy-MM');
  }

  static getMonthRange(month) {
    const base = parseISO(`${month}-01`);
    return {
      start: startOfMonth(base),
      end: endOfMonth(base),
    };
  }

  static async removeMirrors(cellBudgetId, month = null) {
    await prisma.budget.deleteMany({
      where: {
        cellBudgetId,
        ...(month ? { month } : {}),
      },
    });
  }

  static async fetchBudget(cellBudgetId) {
    return prisma.cellBudget.findUnique({
      where: { id: cellBudgetId },
      include: {
        cell: { include: { members: true } },
        category: true,
      },
    });
  }

  static getRecurrenceDays(budget) {
    switch (budget.recurrenceType) {
      case 'WEEKLY':
        return 7;
      case 'BIWEEKLY':
        return 14;
      case 'CUSTOM':
        return Math.max(1, budget.recurrenceDays || 30);
      default:
        return null;
    }
  }

  static buildIntervalsForMonth(budget, month) {
    const { start, end } = this.getMonthRange(month);
    const effectiveStart = budget.effectiveFrom ? new Date(budget.effectiveFrom) : null;
    const effectiveEnd = budget.effectiveTo ? new Date(budget.effectiveTo) : null;
    const windowStart = effectiveStart && effectiveStart > start ? effectiveStart : start;
    const windowEnd = effectiveEnd && effectiveEnd < end ? effectiveEnd : end;
    if (windowStart > windowEnd) return [];
    const periodDays = this.getRecurrenceDays(budget);
    if (!periodDays) {
      return [{ startDate: windowStart, endDate: windowEnd }];
    }
    const intervals = [];
    let cursor = windowStart;
    while (cursor <= windowEnd) {
      const intervalEnd = addDays(cursor, periodDays - 1);
      intervals.push({
        startDate: cursor,
        endDate: intervalEnd < windowEnd ? intervalEnd : windowEnd,
      });
      cursor = addDays(intervalEnd, 1);
    }
    return intervals;
  }

  static async syncBudgetEntry(budget, month) {
    const members = budget.cell?.members || [];
    if (!members.length || !budget.categoryId || !budget.category) return;
    const intervals = this.buildIntervalsForMonth(budget, month);
    if (!intervals.length) return;
    for (const interval of intervals) {
      await Promise.all(
        members.map((member) =>
          prisma.budget.upsert({
            where: {
              userId_categoryId_type_month_startDate_endDate_cellBudgetId: {
                userId: member.userId,
                categoryId: budget.categoryId,
                type: 'MONTHLY',
                month,
                startDate: interval.startDate,
                endDate: interval.endDate,
                cellBudgetId: budget.id,
              },
            },
            update: {
              limit: budget.limit,
              rollover: false,
              startDate: interval.startDate,
              endDate: interval.endDate,
            },
            create: {
              userId: member.userId,
              categoryId: budget.categoryId,
              month,
              limit: budget.limit,
              rollover: false,
              type: 'MONTHLY',
              startDate: interval.startDate,
              endDate: interval.endDate,
              cellBudgetId: budget.id,
            },
          }),
        ),
      );
    }
    await prisma.cellBudget.update({
      where: { id: budget.id },
      data: { lastSyncedAt: new Date() },
    });
  }

  static isActiveForMonth(budget, month) {
    const { start, end } = this.getMonthRange(month);
    const from = budget.effectiveFrom ? new Date(budget.effectiveFrom) : null;
    const to = budget.effectiveTo ? new Date(budget.effectiveTo) : null;
    const afterStart = !from || from <= end;
    const beforeEnd = !to || to >= start;
    return afterStart && beforeEnd;
  }

  static async syncBudget(cellBudgetId, targetMonth = null) {
    const budget = await this.fetchBudget(cellBudgetId);
    if (!budget || !budget.categoryId) {
      if (!targetMonth) {
        await this.removeMirrors(cellBudgetId);
      }
      return;
    }
    const month = targetMonth || this.resolveMonth(budget);
    if (!this.isActiveForMonth(budget, month)) {
      return;
    }
    await this.syncBudgetEntry(budget, month);
  }

  static async resyncBudget(cellBudgetId) {
    const budget = await this.fetchBudget(cellBudgetId);
    if (!budget || !budget.categoryId) {
      await this.removeMirrors(cellBudgetId);
      return;
    }
    const month = this.resolveMonth(budget);
    await this.removeMirrors(cellBudgetId, month);
    await this.syncBudgetEntry(budget, month);
  }

  static async resyncCellBudgets(cellId) {
    const budgets = await prisma.cellBudget.findMany({
      where: { cellId },
      select: { id: true },
    });
    await Promise.all(budgets.map((budget) => this.resyncBudget(budget.id)));
  }

  static async syncActiveBudgetsForMonth(month) {
    const budgets = await prisma.cellBudget.findMany({
      select: {
        id: true,
        effectiveFrom: true,
        effectiveTo: true,
        cellId: true,
      },
    });
    let processed = 0;
    for (const budget of budgets) {
      if (this.isActiveForMonth(budget, month)) {
        await this.removeMirrors(budget.id, month);
        await this.syncBudget(budget.id, month);
        processed += 1;
      }
    }
    return processed;
  }
}

export default CellBudgetSyncService;
