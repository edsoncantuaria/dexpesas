// backend/tests/date-helpers.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { getInvoicePeriod } from '../src/utils/date-helpers.js';

test('getInvoicePeriod when reference is after closing day', () => {
  const card = { diaFechamento: 5 };
  const reference = new Date('2024-07-10T12:00:00Z');
  const { start, end } = getInvoicePeriod(card, reference);

  assert.equal(start.getDate(), 6);
  assert.equal(start.getMonth(), 6);
  assert.equal(end.getDate(), 5);
  assert.equal(end.getMonth(), 7);
});

test('getInvoicePeriod when reference is before closing day', () => {
  const card = { diaFechamento: 20 };
  const reference = new Date('2024-07-10T12:00:00Z');
  const { start, end } = getInvoicePeriod(card, reference);

  assert.equal(start.getMonth(), 5);
  assert.equal(start.getDate(), 21);
  assert.equal(end.getMonth(), 6);
  assert.equal(end.getDate(), 20);
});
