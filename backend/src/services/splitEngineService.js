// backend/src/services/splitEngineService.js
import prisma from '../config/prismaClient.js';

class SplitEngineService {
  static async listRules(cellId) {
    return prisma.cellSplitRule.findMany({
      where: { cellId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static distributeAmount(method, total, members, config = {}) {
    const amount = Number(total) || 0;
    const splits = [];
    if (!members.length || amount === 0) return splits;

    if (method === 'WEIGHTED' && Array.isArray(config.weights)) {
      const weightSum = config.weights.reduce(
        (sum, item) => sum + Number(item.weight || 0),
        0,
      );
      members.forEach((member) => {
        const weightEntry = config.weights.find(
          (item) => item.memberId === member.userId,
        );
        const weight = Number(weightEntry?.weight || 0);
        const share = weightSum ? amount * (weight / weightSum) : amount / members.length;
        splits.push({ userId: member.userId, amount: share });
      });
      return splits;
    }

    if (method === 'CONSUMPTION' && Array.isArray(config.consumption)) {
      const totalConsumption = config.consumption.reduce(
        (sum, item) => sum + Number(item.value || 0),
        0,
      );
      members.forEach((member) => {
        const entry = config.consumption.find(
          (item) => item.memberId === member.userId,
        );
        const cons = Number(entry?.value || 0);
        const share = totalConsumption ? amount * (cons / totalConsumption) : amount / members.length;
        splits.push({ userId: member.userId, amount: share });
      });
      return splits;
    }

    if (method === 'PAYER_REIMBURSED' && config.payerId) {
      const perPerson = amount / members.length;
      members.forEach((member) => {
        if (member.userId === config.payerId) {
          splits.push({ userId: member.userId, amount: 0 });
        } else {
          splits.push({ userId: member.userId, amount: perPerson });
        }
      });
      return splits;
    }

    const equalShare = amount / members.length;
    members.forEach((member) => {
      splits.push({ userId: member.userId, amount: equalShare });
    });
    return splits;
  }

  static async applyRuleToExpense(expenseId, ruleId = null) {
    const expense = await prisma.sharedExpense.findUnique({
      where: { id: expenseId },
      include: {
        clan: {
          include: { members: true },
        },
        participants: true,
      },
    });

    if (!expense) {
      throw new Error('Despesa compartilhada não encontrada.');
    }

    const rule = ruleId
      ? await prisma.cellSplitRule.findUnique({ where: { id: ruleId } })
      : await prisma.cellSplitRule.findFirst({
          where: { cellId: expense.clanId, active: true },
          orderBy: { createdAt: 'asc' },
        });

    if (!rule) {
      throw new Error('Nenhuma regra de rateio encontrada para a família.');
    }

    const members = expense.clan.members;
    if (!members.length) {
      throw new Error('Não há membros na família para aplicar o rateio.');
    }

    const splits = this.distributeAmount(
      rule.method,
      Number(expense.totalAmount),
      members,
      rule.weightsConfig || {},
    );

    await prisma.$transaction(async (tx) => {
      await tx.sharedExpenseParticipant.deleteMany({
        where: { sharedExpenseId: expense.id },
      });

      for (const split of splits) {
        const participantEntry = expense.participants.find(
          (p) => p.userId === split.userId,
        );
        if (!participantEntry?.createdTransactionId) {
          throw new Error(
            'Despesa compartilhada não possui transação de origem para todos os participantes.',
          );
        }
        await tx.sharedExpenseParticipant.create({
          data: {
            sharedExpenseId: expense.id,
            userId: split.userId,
            amountOwed: split.amount,
            createdTransactionId: participantEntry.createdTransactionId,
          },
        });
      }

      await tx.sharedExpense.update({
        where: { id: expense.id },
        data: { splitAppliedAt: new Date() },
      });
    });

    return splits;
  }
}

export default SplitEngineService;
