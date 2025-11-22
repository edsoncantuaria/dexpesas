// backend/src/services/cardBalanceService.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { getInvoicePeriod } from '../utils/date-helpers.js';

const prisma = new PrismaClient();

async function recalculateCardSummary(cardId, prismaClient = prisma) {
  if (!cardId) return;

  const client = prismaClient;
  const card = await client.card.findUnique({ where: { id: cardId } });
  if (!card) return;
  const period = getInvoicePeriod(card, new Date());

  const [despesas, receitas, futureExpenses] = await Promise.all([
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
    // Calculate future unpaid expenses (installments)
    client.transaction.aggregate({
      _sum: { valor: true },
      where: {
        cardId,
        tipo: 'despesa',
        metodoPagamento: 'credito',
        data: { gt: period.end }, // Everything after current invoice
        pago: false,
      },
    }),
  ]);

  const totalDespesas = Number(despesas._sum.valor || 0);
  const totalReceitas = Number(receitas._sum.valor || 0);
  const futureUsedLimit = Number(futureExpenses._sum.valor || 0);

  const currentInvoiceAmount = totalDespesas - totalReceitas;

  // Available limit = Total Limit - (Current Invoice Balance + Future Unpaid Installments)
  const availableLimit = Number(card.limite) - (currentInvoiceAmount + futureUsedLimit);

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
