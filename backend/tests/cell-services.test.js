// backend/tests/cell-services.test.js
import test from 'node:test';
import assert from 'node:assert/strict';

import prisma from '../src/config/prismaClient.js';
import CellBudgetService from '../src/services/cellBudgetService.js';
import SplitEngineService from '../src/services/splitEngineService.js';
import EquilibriumService from '../src/services/equilibriumService.js';

test('CellBudgetService.listBudgets agrega o gasto compartilhado do mês solicitado', async () => {
  const originalFindMany = prisma.cellBudget.findMany;
  const originalSharedFindMany = prisma.sharedExpense.findMany;
  const originalCategoryFindMany = prisma.category.findMany;

  try {
    prisma.cellBudget.findMany = async () => [
      {
        id: 'budget-1',
        cellId: 'cell-1',
        categoryId: 'cat-1',
        label: 'Mercado Família',
        limit: { toNumber: () => 500 },
        fund: null,
        category: { id: 'cat-1', nome: 'Mercado' },
        createdAt: new Date(),
      },
    ];

    prisma.sharedExpense.findMany = async ({ where }) => {
      assert.equal(where.clanId, 'cell-1');
      return [
        {
          categoryId: 'cat-1',
          totalAmount: 150,
        },
      ];
    };

    // Mock category findMany for map
    prisma.category.findMany = async () => [
      { id: 'cat-1', parentCategoryId: null }
    ];

    const [budget] = await CellBudgetService.listBudgets('cell-1', '2024-09');
    assert.equal(budget.limit, 500);
    assert.equal(budget.aggregatedSpent, 150);
  } finally {
    prisma.cellBudget.findMany = originalFindMany;
    prisma.sharedExpense.findMany = originalSharedFindMany;
    prisma.category.findMany = originalCategoryFindMany;
  }
});

test('SplitEngineService.applyRuleToExpense reaplica pesos e marca a despesa como sincronizada', async () => {
  const originalExpenseFind = prisma.sharedExpense.findUnique;
  const originalRuleFind = prisma.cellSplitRule.findFirst;
  const originalTransaction = prisma.$transaction;

  const createdParticipants = [];
  const updates = [];

  try {
    prisma.sharedExpense.findUnique = async () => ({
      id: 'expense-1',
      clanId: 'cell-1',
      totalAmount: 300,
      clan: {
        members: [
          { userId: 'user-1' },
          { userId: 'user-2' },
        ],
      },
      participants: [
        { userId: 'user-1', createdTransactionId: 'tx-1' },
        { userId: 'user-2', createdTransactionId: 'tx-2' },
      ],
    });

    prisma.cellSplitRule.findFirst = async () => ({
      id: 'rule-1',
      method: 'WEIGHTED',
      weightsConfig: {
        weights: [
          { memberId: 'user-1', weight: 2 },
          { memberId: 'user-2', weight: 1 },
        ],
      },
    });

    prisma.$transaction = async (callback) =>
      callback({
        sharedExpenseParticipant: {
          deleteMany: async () => { },
          create: async ({ data }) => {
            createdParticipants.push(data);
          },
        },
        sharedExpense: {
          update: async (args) => {
            updates.push(args);
          },
        },
      });

    const splits = await SplitEngineService.applyRuleToExpense('expense-1');
    assert.equal(splits.length, 2);
    assert.equal(createdParticipants.length, 2);
    assert.equal(createdParticipants[0].amountOwed, 200);
    assert.equal(createdParticipants[1].amountOwed, 100);
    assert.equal(updates.length, 1);
    assert.equal(updates[0].data.splitAppliedAt instanceof Date, true);
  } finally {
    prisma.sharedExpense.findUnique = originalExpenseFind;
    prisma.cellSplitRule.findFirst = originalRuleFind;
    prisma.$transaction = originalTransaction;
  }
});

test('EquilibriumService.snapshotCell consolida saldos devidos entre membros', async () => {
  const originalFindMany = prisma.sharedExpenseParticipant.findMany;
  const originalUpsert = prisma.cellEquilibriumSnapshot.upsert;
  const recorded = [];

  try {
    prisma.sharedExpenseParticipant.findMany = async () => [
      {
        userId: 'user-1',
        amountOwed: 60,
        sharedExpense: { creatorId: 'user-2', totalAmount: 60 },
      },
      {
        userId: 'user-2',
        amountOwed: 30,
        sharedExpense: { creatorId: 'user-1', totalAmount: 30 },
      },
    ];

    prisma.cellEquilibriumSnapshot.upsert = async (args) => {
      recorded.push(args);
      return args;
    };

    const summary = await EquilibriumService.snapshotCell('cell-42', '2024-09');
    assert.equal(summary.length, 2);
    const balanceUser1 = summary.find((entry) => entry.userId === 'user-1');
    const balanceUser2 = summary.find((entry) => entry.userId === 'user-2');
    assert.equal(balanceUser1.balance, -30);
    assert.equal(balanceUser2.balance, 30);
    assert.equal(recorded.length, 1);
    assert.equal(recorded[0].create.summary.length, 2);
  } finally {
    prisma.sharedExpenseParticipant.findMany = originalFindMany;
    prisma.cellEquilibriumSnapshot.upsert = originalUpsert;
  }
});
