// backend/tests/financial-calculations.test.js
import test from 'node:test';
import assert from 'node:assert/strict';

import CardBalanceService from '../src/services/cardBalanceService.js';
import TransactionService from '../src/services/transactionService.js';

const baseCategories = [
  { id: 'cat_pagamento', nome: 'Pagamento Fatura' },
  { id: 'cat_juros', nome: 'DividasEEmprestimos' },
  { id: 'cat_moradia', nome: 'Moradia' },
];

const defaultCard = {
  id: 'card-1',
  nome: 'Visa Platinum',
  limite: 1000,
  diaFechamento: 5,
  diaVencimento: 10,
  jurosRotativo: 10,
};

function createInvoiceMocks({
  categories = baseCategories,
  card = defaultCard,
  invoiceTransactions = [],
  existingPayment = null,
} = {}) {
  const createdTransactions = [];

  return {
    category: {
      findMany: async () => categories,
    },
    card: {
      findUnique: async () => card,
    },
    transaction: {
      findMany: async () => invoiceTransactions,
      findFirst: async () => existingPayment,
      create: async ({ data }) => {
        const tx = { id: `tx-${createdTransactions.length + 1}`, ...data };
        createdTransactions.push(tx);
        return tx;
      },
    },
    _created: createdTransactions,
  };
}

test('cardBalanceService recalculates invoice amount and available limit', async () => {
  let updatedData = null;
  const mockClient = {
    card: {
      findUnique: async ({ where }) =>
        where.id === 'card-1' ? { ...defaultCard } : null,
      update: async ({ data }) => {
        updatedData = data;
      },
    },
    transaction: {
      aggregate: async ({ where }) => {
        if (where.tipo === 'despesa') {
          return { _sum: { valor: 750 } };
        }
        if (where.tipo === 'receita') {
          return { _sum: { valor: 200 } };
        }
        return { _sum: { valor: 0 } };
      },
    },
  };

  await CardBalanceService.recalculateCardSummary('card-1', mockClient);
  assert.deepEqual(updatedData, { currentInvoiceAmount: 550, availableLimit: 450 });
});

test('cardBalanceService ignores missing cards', async () => {
  let updateCalled = false;
  const mockClient = {
    card: {
      findUnique: async () => null,
      update: async () => {
        updateCalled = true;
      },
    },
    transaction: {
      aggregate: async () => ({ _sum: { valor: 0 } }),
    },
  };

  await CardBalanceService.recalculateCardSummary('missing-card', mockClient);
  assert.equal(updateCalled, false);
});

test('handleBillPayment prevents paying more than invoice total', async () => {
  const invoiceTransactions = [
    { descricao: 'Compra 1', tipo: 'despesa', valor: 400 },
    { descricao: 'Pagamento Fatura Anterior', tipo: 'despesa', valor: 200 },
    { descricao: 'Cashback', tipo: 'receita', valor: 50 },
  ];
  const prismaMock = createInvoiceMocks({ invoiceTransactions });

  await assert.rejects(
    () =>
      TransactionService.handleBillPayment(
        'user-1',
        'card-1',
        'account-1',
        700,
        new Date('2024-07-15'),
        prismaMock
      ),
    (err) => {
      assert.equal(err.statusCode, 400);
      assert.match(err.message, /não pode ser maior/i);
      return true;
    }
  );
});

test('handleBillPayment creates entries and interest for partial payment', async () => {
  const invoiceTransactions = [
    { descricao: 'Mercado', tipo: 'despesa', valor: 400 },
    { descricao: 'Gasolina', tipo: 'despesa', valor: 200 },
  ];
  const prismaMock = createInvoiceMocks({ invoiceTransactions });
  const originalRecalc = CardBalanceService.recalculateCardSummary;
  const recalcCalls = [];
  CardBalanceService.recalculateCardSummary = async (...args) => {
    recalcCalls.push(args);
  };

  try {
    const paymentDate = new Date('2024-07-15T12:00:00Z');
    const result = await TransactionService.handleBillPayment(
      'user-1',
      'card-1',
      'account-1',
      300,
      paymentDate,
      prismaMock
    );

    assert.equal(prismaMock._created.length, 3);
    const [expenseTx, incomeTx, interestTx] = prismaMock._created;

    assert.equal(expenseTx.descricao, 'Pagamento Fatura Visa Platinum');
    assert.equal(expenseTx.tipo, 'despesa');
    assert.equal(expenseTx.valor, 300);
    assert.equal(expenseTx.accountId, 'account-1');

    assert.equal(incomeTx.descricao, 'Pagamento Fatura');
    assert.equal(incomeTx.tipo, 'receita');
    assert.equal(incomeTx.cardId, 'card-1');
    assert.equal(incomeTx.isInvoicePayment, true);

    assert.equal(interestTx.tipo, 'despesa');
    assert.equal(interestTx.cardId, 'card-1');
    assert.equal(interestTx.valor, 30); // 300 restantes * 10% de juros

    assert.ok(result.expenseTransaction && result.incomeTransaction);
    assert.equal(recalcCalls.length, 1);
    assert.equal(recalcCalls[0][0], 'card-1');
    assert.strictEqual(recalcCalls[0][1], prismaMock);
  } finally {
    CardBalanceService.recalculateCardSummary = originalRecalc;
  }
});
