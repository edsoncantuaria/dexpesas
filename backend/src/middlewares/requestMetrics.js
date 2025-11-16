// backend/src/middlewares/requestMetrics.js
import MetricsService from '../services/metricsService.js';

const sanitizePath = (url = '') => url.split('?')[0] || '/';

const requestMetrics = (req, res, next) => {
    const start = process.hrtime.bigint();
    MetricsService.recordRequestStart();
    let completed = false;

    const finalize = () => {
        if (completed) return;
        completed = true;
        const durationNs = process.hrtime.bigint() - start;
        const durationMs = Number(durationNs) / 1_000_000;
        MetricsService.recordRequestEnd(req.method, sanitizePath(req.originalUrl), res.statusCode, durationMs);
    };

    res.on('finish', finalize);
    res.on('close', finalize);
    res.on('error', () => {
        MetricsService.recordError();
        finalize();
    });

    next();
};

export default requestMetrics;
