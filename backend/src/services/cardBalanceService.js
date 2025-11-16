// backend/src/services/cardBalanceService.js
import { PrismaClient } from '@prisma/client';
import { getInvoicePeriod } from '../utils/date-helpers.js';

const prisma = new PrismaClient();

async function recalculateCardSummary(cardId, prismaClient = prisma) {
  if (!cardId) return;

  const client = prismaClient;
  const card = await client.card.findUnique({ where: { id: cardId } });
  if (!card) return;
  const period = getInvoicePeriod(card, new Date());

  const [despesas, receitas] = await Promise.all([
    client.transaction.aggregate({
      _sum: { valor: true },
      where: {
        cardId,
        tipo: 'despesa',
        metodoPagamento: 'credito',
        data: { gte: period.start, lte: period.end },
      },
    }),
    client.transaction.aggregate({
      _sum: { valor: true },
      where: {
        cardId,
        tipo: 'receita',
        isInvoicePayment: true,
        data: { gte: period.start, lte: period.end },
      },
    }),
  ]);

  const totalDespesas = Number(despesas._sum.valor || 0);
  const totalReceitas = Number(receitas._sum.valor || 0);
  const currentInvoiceAmount = totalDespesas - totalReceitas;
  const availableLimit = Number(card.limite) - currentInvoiceAmount;

  await client.card.update({
    where: { id: cardId },
    data: {
      currentInvoiceAmount,
      availableLimit,
    },
  });
}

export default {
  recalculateCardSummary,
};
