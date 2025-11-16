// backend/tests/securityService.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildDeviceId } from '../src/services/securityUtils.js';

test('buildDeviceId returns provided fingerprint when available', () => {
  const id = buildDeviceId({
    fingerprint: 'abc123',
    userAgent: 'Custom-UA',
  });
  assert.equal(id, 'abc123');
});

test('buildDeviceId falls back to composed key when empty', () => {
  const id = buildDeviceId({}, 'user-xyz');
  assert.ok(id.startsWith('user-xyz-'));
});

test('buildDeviceId normalizes casing and length', () => {
  const id = buildDeviceId({ deviceId: 'SOME-UPPER-CASE-ID-1234567890' });
  assert.equal(id, 'some-upper-case-id-1234567890');
});
