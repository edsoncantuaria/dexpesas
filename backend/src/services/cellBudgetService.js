// backend/src/services/cellBudgetService.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

class CellBudgetService {
  static normalizeType(type) {
    if (!type) return 'CELL';
    const allowed = ['CELL', 'HYBRID', 'PERSONAL'];
    return allowed.includes(type) ? type : 'CELL';
  }

  static async listBudgets(cellId) {
    return prisma.cellBudget.findMany({
      where: { cellId },
      include: {
        category: true,
        fund: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getBudgetById(budgetId) {
    return prisma.cellBudget.findUnique({
      where: { id: budgetId },
      include: { category: true, fund: true },
    });
  }

  static async createBudget(cellId, payload) {
    const data = {
      cellId,
      categoryId: payload.categoryId || null,
      label: payload.label || null,
      type: this.normalizeType(payload.type),
      splitConfig: payload.splitConfig || null,
      fundId: payload.fundId || null,
      limit: payload.limit,
      effectiveFrom: payload.effectiveFrom
        ? new Date(payload.effectiveFrom)
        : null,
      effectiveTo: payload.effectiveTo ? new Date(payload.effectiveTo) : null,
    };

    return prisma.cellBudget.create({ data });
  }

  static async updateBudget(budgetId, payload) {
    const data = {
      categoryId:
        payload.categoryId === undefined ? undefined : payload.categoryId,
      label: payload.label === undefined ? undefined : payload.label,
      type:
        payload.type === undefined
          ? undefined
          : this.normalizeType(payload.type),
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

    return prisma.cellBudget.update({
      where: { id: budgetId },
      data,
    });
  }

  static async deleteBudget(budgetId) {
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
