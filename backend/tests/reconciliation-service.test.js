// backend/tests/reconciliation-service.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { parse } from 'date-fns';

import ReconciliationService from '../src/services/reconciliationService.js';

test('mapCsvTransaction parses amounts and dates with different formats', () => {
  const record = {
    Data: '15/07/2024',
    Valor: 'R$ 1.234,56',
    Descricao: 'Pagamento',
  };
  const mapping = {
    date: 'Data',
    amount: 'Valor',
    description: 'Descricao',
    date_format: 'dd/MM/yyyy',
  };

  const result = ReconciliationService.mapCsvTransaction(
    record,
    'rec-1',
    mapping,
    0
  );

  assert.ok(result);
  assert.equal(result.type, 'CREDIT');
  assert.equal(result.amount, 1234.56);
  assert.equal(result.description, 'Pagamento');
  assert.equal(result.fitId, 'csv-rec-1-0');
  assert.equal(result.date.getUTCDate(), 15);
});

test('mapCsvTransaction handles negative values and fallback formats', () => {
  const record = {
    Data: '2024-07-01',
    Valor: '-500,10',
    Descricao: 'Aluguel',
  };
  const mapping = {
    date: 'Data',
    amount: 'Valor',
    description: 'Descricao',
    date_format: 'dd/MM/yyyy', // intentionally wrong to force fallback
  };

  const result = ReconciliationService.mapCsvTransaction(
    record,
    'rec-2',
    mapping,
    5
  );

  assert.ok(result);
  assert.equal(result.type, 'DEBIT');
  assert.equal(result.amount, 500.1);
  assert.equal(result.description, 'Aluguel');
  assert.equal(result.fitId, 'csv-rec-2-5');
});

test('mapCsvTransaction returns null for invalid entries', () => {
  const mapping = { date: 'Data', amount: 'Valor', description: 'Descricao' };
  const invalidDate = ReconciliationService.mapCsvTransaction(
    { Data: '32/13/2023', Valor: '50', Descricao: 'X' },
    'rec-3',
    mapping,
    1
  );
  const invalidAmount = ReconciliationService.mapCsvTransaction(
    { Data: '01/01/2024', Valor: 'abc', Descricao: 'Y' },
    'rec-3',
    mapping,
    2
  );

  assert.equal(invalidDate, null);
  assert.equal(invalidAmount, null);
});

test('mapOfxTransaction converts OFX row to internal format', () => {
  const ofxTx = {
    TRNAMT: '-120.50',
    DTPOSTED: '20240630120000',
    MEMO: 'Compra Mercado',
    FITID: '12345',
  };

  const result = ReconciliationService.mapOfxTransaction(ofxTx, 'rec-4');
  assert.equal(result.amount, 120.5);
  assert.equal(result.type, 'DEBIT');
  assert.equal(result.description, 'Compra Mercado');
  assert.equal(result.fitId, '12345');
  assert.equal(result.date.getUTCFullYear(), 2024);
  assert.equal(result.date.getUTCMonth(), 5);
  assert.equal(result.date.getUTCDate(), 30);
});

test('findBestMatch scores candidates by amount/date/description', () => {
  const imported = {
    amount: 250,
    type: 'CREDIT',
    date: new Date('2024-07-05'),
    description: 'Transferência recebida João',
  };
  const manualTransactions = [
    {
      id: 'tx-1',
      valor: 250,
      tipo: 'receita',
      date: new Date('2024-07-04'),
      descricao: 'Transferencia recebida Joao',
    },
    {
      id: 'tx-2',
      valor: 250,
      tipo: 'despesa',
      date: new Date('2024-07-04'),
      descricao: 'Transferencia recebida Joao',
    },
  ];

  const best = ReconciliationService.findBestMatch(imported, manualTransactions);

  assert.ok(best);
  assert.equal(best.match.id, 'tx-1');
  assert.ok(best.score > 60);
});
