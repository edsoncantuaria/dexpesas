// backend/src/services/metricsService.js
import os from 'os';

class MetricsService {
    constructor() {
        this.metrics = {
            totalRequests: 0,
            totalErrors: 0,
            activeRequests: 0,
        };
        this.routeStats = new Map();
        this.slowRequests = [];
        this.lastSnapshotAt = null;
    }

    recordRequestStart() {
        this.metrics.totalRequests += 1;
        this.metrics.activeRequests += 1;
    }

    recordRequestEnd(method, path, statusCode, durationMs) {
        this.metrics.activeRequests = Math.max(0, this.metrics.activeRequests - 1);
        if (statusCode >= 500) {
            this.metrics.totalErrors += 1;
        }

        const routeKey = `${method.toUpperCase()} ${path}`;
        const existing = this.routeStats.get(routeKey) || {
            count: 0,
            totalDuration: 0,
            maxDuration: 0,
            lastStatus: null,
        };

        existing.count += 1;
        existing.totalDuration += durationMs;
        existing.maxDuration = Math.max(existing.maxDuration, durationMs);
        existing.lastStatus = statusCode;
        existing.avgDuration = Number((existing.totalDuration / existing.count).toFixed(2));

        this.routeStats.set(routeKey, existing);

        if (durationMs > 1200) {
            this.slowRequests.unshift({
                method,
                path,
                durationMs: Number(durationMs.toFixed(2)),
                statusCode,
                timestamp: new Date().toISOString(),
            });
            this.slowRequests = this.slowRequests.slice(0, 10);
        }

        this.lastSnapshotAt = new Date().toISOString();
    }

    recordError() {
        this.metrics.totalErrors += 1;
    }

    snapshot() {
        const routes = Array.from(this.routeStats.entries()).map(([route, stats]) => ({
            route,
            ...stats,
        }));

        return {
            ...this.metrics,
            routes,
            slowRequests: this.slowRequests,
            lastSnapshotAt: this.lastSnapshotAt,
            process: {
                uptimeSeconds: process.uptime(),
                memoryUsage: process.memoryUsage(),
                platform: os.platform(),
                loadavg: os.loadavg(),
            },
        };
    }
}

export default new MetricsService();
