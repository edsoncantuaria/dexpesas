// backend/tests/category-maintenance.test.js
import test from 'node:test';
import assert from 'node:assert/strict';

import { resetCategoriesData } from '../src/services/categoryMaintenanceService.js';
import { defaultCategories } from '../src/config/seedData.js';

const cloneDefaultCategories = () =>
  defaultCategories.map((cat) => ({
    ...cat,
    userId: null,
  }));

const allowedNames = new Set(defaultCategories.map((cat) => cat.nome));

const projectFields = (record, select) => {
  if (!select) return { ...record };
  const projected = {};
  Object.keys(select).forEach((key) => {
    if (select[key]) projected[key] = record[key];
  });
  return projected;
};

function buildMockPrisma(initialCategories) {
  const state = {
    categories: initialCategories.map((cat) => ({ ...cat })),
    deleted: [],
    created: [],
    updated: [],
    reassignCalls: [],
  };

  const tx = {
    transaction: {
      updateMany: async ({ where, data }) => {
        state.reassignCalls.push({
          entity: 'transaction',
          from: where.categoryId,
          to: data.categoryId,
        });
        return { count: 1 };
      },
    },
    budget: {
      updateMany: async ({ where, data }) => {
        state.reassignCalls.push({
          entity: 'budget',
          from: where.categoryId,
          to: data.categoryId,
        });
        return { count: 1 };
      },
    },
    categorizationRule: {
      updateMany: async ({ where, data }) => {
        state.reassignCalls.push({
          entity: 'rule',
          from: where.categoryId,
          to: data.categoryId,
        });
        return { count: 1 };
      },
    },
    category: {
      findMany: async (params = {}) => {
        const { where } = params;
        let filtered = state.categories;

        if (where?.userId === null) {
          filtered = filtered.filter((cat) => cat.userId === null);
        }
        if (where?.id?.notIn) {
          const blocked = new Set(where.id.notIn);
          filtered = filtered.filter((cat) => !blocked.has(cat.id));
        }
        if (where?.NOT?.nome?.in) {
          const blockedNames = new Set(where.NOT.nome.in);
          filtered = filtered.filter((cat) => !blockedNames.has(cat.nome));
        }

        return filtered.map((cat) => projectFields(cat, params.select));
      },
      update: async ({ where, data }) => {
        const category = state.categories.find((cat) => cat.id === where.id);
        Object.assign(category, data);
        state.updated.push(where.id);
        return category;
      },
      create: async ({ data }) => {
        const newCategory = {
          id: data.id || `created-${state.created.length + 1}`,
          ...data,
        };
        state.categories.push(newCategory);
        state.created.push(newCategory.id);
        return newCategory;
      },
      delete: async ({ where }) => {
        const index = state.categories.findIndex((cat) => cat.id === where.id);
        if (index >= 0) {
          const [removed] = state.categories.splice(index, 1);
          state.deleted.push(removed.id);
        }
      },
    },
  };

  return {
    state,
    client: {
      $transaction: async (callback) => callback(tx),
    },
  };
}

test('resetCategoriesData merges duplicates, updates defaults and removes extras', async () => {
  const initial = cloneDefaultCategories();
  const duplicate = { ...initial[0], id: 'dup-1' };
  const extra = { id: 'extra-1', nome: 'CustomCategoria', type: 'despesa', label: 'Custom', icon: 'Star', userId: null };
  const { state, client } = buildMockPrisma([...initial, duplicate, extra]);

  const summary = await resetCategoriesData(client);

  assert.equal(summary.updated, defaultCategories.length);
  assert.equal(summary.created, 0);
  assert.equal(summary.duplicatesRemoved, 1);
  assert.equal(summary.deleted, 1);
  assert.equal(summary.reassigned, 6);

  assert.ok(state.deleted.includes('dup-1'));
  assert.ok(state.deleted.includes('extra-1'));
  assert.equal(state.categories.length, defaultCategories.length);
  assert.equal(state.reassignCalls.length, 6);
});

test('resetCategoriesData reassigns receita extras to OutrasReceitas fallback', async () => {
  const initial = cloneDefaultCategories();
  const receitaFallback = initial.find((cat) => cat.nome === 'OutrasReceitas').id;
  const extraReceita = {
    id: 'extra-receita',
    nome: 'BonusEspecial',
    type: 'receita',
    label: 'Bônus',
    icon: 'Star',
    userId: null,
  };
  const { state, client } = buildMockPrisma([...initial, extraReceita]);

  await resetCategoriesData(client);

  const reassigned = state.reassignCalls.filter((entry) => entry.from === 'extra-receita');
  assert.equal(reassigned.length, 3);
  reassigned.forEach((entry) => {
    assert.equal(entry.to, receitaFallback);
  });
  assert.ok(state.deleted.includes('extra-receita'));
});
