// backend/src/services/cellJobsService.js
import { subHours, format, addMonths, parseISO } from 'date-fns';
import CellBudgetSyncService from './cellBudgetSyncService.js';
import SplitEngineService from './splitEngineService.js';
import prisma from '../config/prismaClient.js';
const eventListeners = [];

export function onCellJobEvent(listener) {
  eventListeners.push(listener);
  return () => {
    const idx = eventListeners.indexOf(listener);
    if (idx >= 0) {
      eventListeners.splice(idx, 1);
    }
  };
}

function emitEvent(event) {
  eventListeners.forEach((listener) => {
    try {
      listener(event);
    } catch (error) {
      console.error('CELL_JOB_EVENT listener error:', error);
    }
  });
}

function emit(job) {
  const timestamp = new Date().toISOString();
  const event = { ...job, timestamp };
  emitEvent(event);
  console.log(`[CELL_JOB_EVENT]`, event);
}

class CellJobsService {
  static async runSplitEngine({ cellId = null, trigger = 'SCHEDULED' } = {}) {
    const pendingExpenses = await prisma.sharedExpense.findMany({
      where: {
        splitAppliedAt: null,
        ...(cellId ? { clanId: cellId } : {}),
        participants: { some: {} },
      },
      select: { id: true, clanId: true },
      orderBy: { createdAt: 'asc' },
    });

    if (!pendingExpenses.length) {
      emit({
        type: 'CELL_JOB_RUN',
        job: 'SplitEngine',
        status: 'EMPTY',
        filter: cellId || 'ALL',
        processedCells: 0,
        evaluatedExpenses: 0,
        appliedExpenses: 0,
        failedExpenses: 0,
      });
      return {
        processedCells: 0,
        evaluatedExpenses: 0,
        appliedExpenses: 0,
        failedExpenses: 0,
      };
    }

    let appliedExpenses = 0;
    let failedExpenses = 0;

    for (const expense of pendingExpenses) {
      try {
        await SplitEngineService.applyRuleToExpense(expense.id);
        appliedExpenses += 1;
      } catch (error) {
        failedExpenses += 1;
        console.error('[CELL_SPLIT_JOB_ERROR]', {
          expenseId: expense.id,
          cellId: expense.clanId,
          message: error.message,
        });
      }
    }

    const processedCells = new Set(
      pendingExpenses.map((item) => item.clanId),
    ).size;

    emit({
      type: 'CELL_JOB_RUN',
      job: 'SplitEngine',
      trigger,
      processedCells,
      evaluatedExpenses: pendingExpenses.length,
      appliedExpenses,
      failedExpenses,
    });

    return {
      processedCells,
      evaluatedExpenses: pendingExpenses.length,
      appliedExpenses,
      failedExpenses,
    };
  }

  static async runEquilibriumSnapshot({
    cellId = null,
    trigger = 'SCHEDULED',
  } = {}) {
    const participants = await prisma.sharedExpenseParticipant.findMany({
      where: cellId
        ? { sharedExpense: { clanId: cellId } }
        : {},
      select: {
        userId: true,
        amountOwed: true,
        sharedExpense: { select: { clanId: true } },
      },
    });

    const summaryByCell = new Map();
    for (const entry of participants) {
      const cell = entry.sharedExpense?.clanId;
      if (!cell) continue;
      if (!summaryByCell.has(cell)) {
        summaryByCell.set(cell, new Map());
      }
      const cellMap = summaryByCell.get(cell);
      cellMap.set(
        entry.userId,
        (cellMap.get(entry.userId) || 0) + Number(entry.amountOwed || 0),
      );
    }

    emit({
      type: 'CELL_JOB_RUN',
      job: 'EquilibriumSnapshot',
      trigger,
      processedCells: summaryByCell.size,
    });

    return {
      processedCells: summaryByCell.size,
      entries: summaryByCell,
    };
  }

  static async runCellAlerts({ trigger = 'SCHEDULED' } = {}) {
    const since = subHours(new Date(), 24);
    const events = await prisma.cellEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { id: true, cellId: true, type: true },
    });

    const grouped = events.reduce((acc, event) => {
      if (!acc[event.cellId]) {
        acc[event.cellId] = { total: 0, byType: {} };
      }
      acc[event.cellId].total += 1;
      acc[event.cellId].byType[event.type] =
        (acc[event.cellId].byType[event.type] || 0) + 1;
      return acc;
    }, {});

    emit({
      type: 'CELL_JOB_RUN',
      job: 'CellAlert',
      trigger,
      processedCells: Object.keys(grouped).length,
    });

    return grouped;
  }

  static async runBudgetMirrorRollup({
    month = format(new Date(), 'yyyy-MM'),
    includeNextMonth = true,
    trigger = 'SCHEDULED',
  } = {}) {
    const budgets = await prisma.cellBudget.findMany({
      select: {
        id: true,
        effectiveFrom: true,
        effectiveTo: true,
        cellId: true,
      },
    });

    const baseDate = parseISO(`${month}-01`);
    const monthsToProcess = [month];
    if (includeNextMonth) {
      monthsToProcess.push(format(addMonths(baseDate, 1), 'yyyy-MM'));
    }

    const processedByMonth = {};

    for (const targetMonth of monthsToProcess) {
      const { start, end } = CellBudgetSyncService.getMonthRange(targetMonth);
      let processed = 0;
      for (const budget of budgets) {
        const from = budget.effectiveFrom ? new Date(budget.effectiveFrom) : null;
        const to = budget.effectiveTo ? new Date(budget.effectiveTo) : null;
        const isActive = (!from || from <= end) && (!to || to >= start);
        if (!isActive) continue;
        await CellBudgetSyncService.removeMirrors(budget.id, targetMonth);
        await CellBudgetSyncService.syncBudget(budget.id, targetMonth);
        processed += 1;
      }
      processedByMonth[targetMonth] = processed;
    }

    emit({
      type: 'CELL_JOB_RUN',
      job: 'BudgetMirrorRollup',
      trigger,
      months: processedByMonth,
    });

    return { months: processedByMonth };
  }

  static async runFullBudgetResync({ trigger = 'SCHEDULED' } = {}) {
    const grouped = await prisma.cellBudget.groupBy({
      by: ['cellId'],
      _count: { _all: true },
    });

    let processed = 0;
    for (const entry of grouped) {
      await CellBudgetSyncService.resyncCellBudgets(entry.cellId);
      processed += 1;
    }

    emit({
      type: 'CELL_JOB_RUN',
      job: 'FamilyBudgetResync',
      trigger,
      processedFamilies: processed,
    });

    return { processedFamilies: processed };
  }
}

export default CellJobsService;
