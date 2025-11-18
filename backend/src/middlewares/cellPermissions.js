// backend/src/middlewares/cellPermissions.js
import prisma from '../config/prismaClient.js';

const DEFAULT_FLAGS = {
  manageMembers: false,
  manageBudgets: false,
  recordTransactions: true,
  moveFunds: false,
  viewPersonalBudget: false,
  manageFunds: false,
  vote: true,
  approveSplits: false,
  viewEquilibrium: true,
  viewAlerts: true,
};

function mergeFlags(role, permissions) {
  const flags = { ...DEFAULT_FLAGS, ...(permissions || {}) };
  if (role === 'LEADER' || role === 'ADMIN') {
    Object.keys(flags).forEach((key) => {
      flags[key] = true;
    });
  }
  return flags;
}

async function resolveMembership(userId, cellId, context = {}) {
  if (cellId) {
    return prisma.clanMember.findUnique({
      where: {
        userId_clanId: {
          userId,
          clanId: cellId,
        },
      },
    });
  }

  if (context.budgetId) {
    const budget = await prisma.cellBudget.findUnique({
      where: { id: context.budgetId },
    });
    if (!budget) return null;
    return prisma.clanMember.findUnique({
      where: {
        userId_clanId: {
          userId,
          clanId: budget.cellId,
        },
      },
    });
  }

  if (context.fundId) {
    const fund = await prisma.cellFund.findUnique({ where: { id: context.fundId } });
    if (!fund) return null;
    return prisma.clanMember.findUnique({
      where: {
        userId_clanId: {
          userId,
          clanId: fund.cellId,
        },
      },
    });
  }

  return null;
}

export async function applyCellPermissions(userId, cellId, requiredFlags = {}, context = {}) {
  const membership = await resolveMembership(userId, cellId, context);
  if (!membership) {
    const error = new Error('Acesso negado: usuário não pertence à célula.');
    error.statusCode = 403;
    throw error;
  }

  const permissions = mergeFlags(membership.role, membership.permissions);

  const missingFlag = Object.entries(requiredFlags).find(
    ([flag, value]) => value && !permissions[flag],
  );

  if (missingFlag) {
    const error = new Error(`Permissão negada (${missingFlag[0]}).`);
    error.statusCode = 403;
    throw error;
  }

  return membership;
}

export default applyCellPermissions;
