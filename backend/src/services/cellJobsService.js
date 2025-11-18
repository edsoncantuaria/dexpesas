// backend/src/services/cellJobsService.js
import { PrismaClient } from '@prisma/client';
import { subHours } from 'date-fns';

const prisma = new PrismaClient();
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
    const where = cellId ? { id: cellId } : {};
    const cells = await prisma.clan.findMany({
      where,
      select: { id: true, name: true },
    });

    if (!cells.length) {
      emit({
        type: 'CELL_JOB_RUN',
        job: 'SplitEngine',
        status: 'EMPTY',
        filter: cellId || 'ALL',
        processedCells: 0,
        evaluatedExpenses: 0,
      });
      return { processedCells: 0, evaluatedExpenses: 0 };
    }

    const expenseTotals = await prisma.sharedExpense.groupBy({
      by: ['clanId'],
      _count: { _all: true },
      where: cellId ? { clanId: cellId } : {},
    });

    const totalsMap = new Map(
      expenseTotals.map((item) => [item.clanId, item._count._all]),
    );

    const evaluatedExpenses = cells.reduce(
      (acc, cell) => acc + (totalsMap.get(cell.id) || 0),
      0,
    );

    emit({
      type: 'CELL_JOB_RUN',
      job: 'SplitEngine',
      trigger,
      processedCells: cells.length,
      evaluatedExpenses,
    });

    return {
      processedCells: cells.length,
      evaluatedExpenses,
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
}

export default CellJobsService;
