// backend/src/services/cellAlertService.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class CellAlertService {
  static async evaluateBudgets(cellId) {
    const budgets = await prisma.cellBudget.findMany({
      where: { cellId },
      include: { category: true },
    });

    const alerts = [];
    for (const budget of budgets) {
      if (!budget.categoryId) continue;
      const spentAgg = await prisma.sharedExpense.aggregate({
        _sum: { totalAmount: true },
        where: {
          clanId: cellId,
          categoryId: budget.categoryId,
        },
      });
      const spent = Number(spentAgg._sum.totalAmount || 0);
      if (spent >= Number(budget.limit)) {
        alerts.push({
          type: 'CELL_BUDGET_RISK',
          severity: spent > budget.limit ? 'critical' : 'warning',
          title: `Orçamento ${budget.label || budget.category?.label} no limite`,
          description: `Gasto de ${spent.toFixed(2)} para limite ${Number(
            budget.limit,
          ).toFixed(2)}`,
        });
      }
    }
    return alerts;
  }

  static async evaluateFunds(cellId) {
    const funds = await prisma.cellFund.findMany({
      where: { cellId },
    });
    const alerts = [];
    funds.forEach((fund) => {
      const progress =
        Number(fund.currentAmount || 0) / Number(fund.targetAmount || 1);
      if (progress >= 0.8 && fund.status === 'ACTIVE') {
        alerts.push({
          type: 'FUND_TARGET_NEAR',
          severity: 'info',
          title: `Fundo ${fund.name} em ${Math.round(progress * 100)}%`,
          description: `Faltam ${(fund.targetAmount - fund.currentAmount).toFixed(2)} para atingir a meta.`,
        });
      }
    });
    return alerts;
  }

  static async evaluateCell(cellId) {
    const [budgetAlerts, fundAlerts] = await Promise.all([
      this.evaluateBudgets(cellId),
      this.evaluateFunds(cellId),
    ]);
    return [...budgetAlerts, ...fundAlerts];
  }
}

export default CellAlertService;
