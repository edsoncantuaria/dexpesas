// backend/src/services/equilibriumService.js
import { format } from 'date-fns';
import prisma from '../config/prismaClient.js';

class EquilibriumService {
  static buildReferenceMonth(date = new Date()) {
    return format(date, 'yyyy-MM');
  }

  static async getLedger(cellId) {
    const splits = await prisma.sharedExpenseParticipant.findMany({
      where: { sharedExpense: { clanId: cellId } },
      select: {
        userId: true,
        amountOwed: true,
        sharedExpense: { select: { creatorId: true, totalAmount: true } },
      },
    });

    const ledger = new Map();

    splits.forEach((entry) => {
      const owed = Number(entry.amountOwed || 0);
      const userBalance = ledger.get(entry.userId) || 0;
      ledger.set(entry.userId, userBalance - owed);

      const creatorId = entry.sharedExpense?.creatorId;
      if (creatorId) {
        ledger.set(creatorId, (ledger.get(creatorId) || 0) + owed);
      }
    });

    return ledger;
  }

  static async snapshotCell(cellId, reference = null) {
    const referenceMonth = reference || this.buildReferenceMonth();
    const ledger = await this.getLedger(cellId);
    const settlements = await prisma.cellEquilibriumSettlement.findMany({
      where: { cellId, referenceMonth },
    });

    settlements.forEach((settlement) => {
      const value = Number(settlement.amount || 0);
      if (!Number.isFinite(value) || value <= 0) return;
      const payerBalance = ledger.get(settlement.payerId) || 0;
      const receiverBalance = ledger.get(settlement.receiverId) || 0;
      ledger.set(settlement.payerId, payerBalance + value);
      ledger.set(settlement.receiverId, receiverBalance - value);
    });

    const summary = Array.from(ledger.entries()).map(([userId, balance]) => ({
      userId,
      balance,
    }));

    await prisma.cellEquilibriumSnapshot.upsert({
      where: {
        cellId_referenceMonth: {
          cellId,
          referenceMonth,
        },
      },
      update: { summary },
      create: {
        cellId,
        referenceMonth,
        summary,
      },
    });

    return summary;
  }

  static async summarizeAllCells() {
    const cells = await prisma.clan.findMany({ select: { id: true } });
    for (const cell of cells) {
      await this.snapshotCell(cell.id);
    }
  }
}

export default EquilibriumService;
