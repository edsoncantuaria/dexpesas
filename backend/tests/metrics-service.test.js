// backend/tests/metrics-service.test.js
import test from 'node:test';
import assert from 'node:assert/strict';
import metricsService from '../src/services/metricsService.js';

const resetMetrics = () => {
  metricsService.metrics = {
    totalRequests: 0,
    totalErrors: 0,
    activeRequests: 0,
  };
  metricsService.routeStats = new Map();
  metricsService.slowRequests = [];
  metricsService.lastSnapshotAt = null;
};

test('recordRequestStart increments counters', () => {
  resetMetrics();
  metricsService.recordRequestStart();
  metricsService.recordRequestStart();

  assert.equal(metricsService.metrics.totalRequests, 2);
  assert.equal(metricsService.metrics.activeRequests, 2);
  assert.equal(metricsService.metrics.totalErrors, 0);
});

test('recordRequestEnd updates route stats and slow requests', () => {
  resetMetrics();
  metricsService.recordRequestStart();
  metricsService.recordRequestStart();

  metricsService.recordRequestEnd('get', '/health', 200, 450);
  metricsService.recordRequestEnd('GET', '/health', 503, 1500);

  assert.equal(metricsService.metrics.activeRequests, 0);
  assert.equal(metricsService.metrics.totalErrors, 1);

  const routeStats = metricsService.routeStats.get('GET /health');
  assert.ok(routeStats);
  assert.equal(routeStats.count, 2);
  assert.equal(routeStats.maxDuration, 1500);
  assert.equal(routeStats.lastStatus, 503);
  assert.equal(routeStats.avgDuration, (450 + 1500) / 2);
  assert.ok(metricsService.lastSnapshotAt);

  assert.equal(metricsService.slowRequests.length, 1);
  assert.equal(metricsService.slowRequests[0].path, '/health');
  assert.equal(metricsService.slowRequests[0].statusCode, 503);
});

test('snapshot exposes metrics summary with capped slow request history', () => {
  resetMetrics();
  metricsService.recordRequestStart();
  metricsService.recordRequestEnd('POST', '/sync', 200, 400);

  for (let i = 0; i < 15; i++) {
    metricsService.recordRequestStart();
    metricsService.recordRequestEnd(
      'POST',
      `/slow-${i}`,
      200,
      2000 + i * 10
    );
  }

  assert.equal(metricsService.slowRequests.length, 10);
  const snapshot = metricsService.snapshot();

  assert.equal(snapshot.totalRequests, 16);
  assert.ok(Array.isArray(snapshot.routes));
  assert.ok(snapshot.routes.find((route) => route.route === 'POST /sync'));
  assert.ok(snapshot.process);
  assert.ok(snapshot.process.memoryUsage);
  assert.ok(Array.isArray(snapshot.process.loadavg));
});
