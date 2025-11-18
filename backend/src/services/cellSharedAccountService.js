// backend/src/services/cellSharedAccountService.js
import prisma from '../config/prismaClient.js';

const ROLE_VALUES = new Set(['LEADER', 'ADMIN', 'MEMBER']);

function createError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

class CellSharedAccountService {
  static normalizeRoles(roles = []) {
    if (!Array.isArray(roles)) {
      return [];
    }
    return roles.filter((role) => ROLE_VALUES.has(role));
  }

  static async ensureAccountForCell(cellId, accountId) {
    if (!accountId) {
      throw createError(400, 'Conta inválida para compartilhamento.');
    }

    const account = await prisma.account.findUnique({
      where: { id: accountId },
      select: { id: true, nome: true, userId: true },
    });
    if (!account) {
      throw createError(404, 'Conta não encontrada.');
    }

    const membership = await prisma.clanMember.findUnique({
      where: {
        userId_clanId: {
          userId: account.userId,
          clanId: cellId,
        },
      },
    });

    if (!membership) {
      throw createError(400, 'A conta precisa pertencer a um membro da família.');
    }

    return account;
  }

  static async list(cellId) {
    return prisma.cellSharedAccount.findMany({
      where: { cellId },
      include: { account: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async link(cellId, payload) {
    const visibility = payload.visibility || 'MEMBERS';
    const account = await this.ensureAccountForCell(cellId, payload.accountId);

    const existing = await prisma.cellSharedAccount.findUnique({
      where: {
        cellId_accountId: {
          cellId,
          accountId: account.id,
        },
      },
    });

    if (existing) {
      throw createError(409, 'Esta conta já está compartilhada com a família.');
    }

    const allowedRoles =
      visibility === 'CUSTOM'
        ? this.normalizeRoles(payload.allowedRoles || [])
        : [];

    return prisma.cellSharedAccount.create({
      data: {
        cellId,
        accountId: account.id,
        visibility,
        allowedRoles,
        metadata: payload.metadata || null,
      },
      include: { account: true },
    });
  }

  static async unlink(cellId, sharedAccountId) {
    const record = await prisma.cellSharedAccount.findUnique({
      where: { id: sharedAccountId },
      include: { account: true },
    });

    if (!record || record.cellId !== cellId) {
      throw createError(404, 'Compartilhamento não encontrado para esta família.');
    }

    await prisma.cellSharedAccount.delete({ where: { id: sharedAccountId } });
    return record;
  }
}

export default CellSharedAccountService;
