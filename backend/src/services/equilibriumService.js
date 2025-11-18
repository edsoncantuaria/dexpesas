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
