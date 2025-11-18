// backend/src/queues/cellJobsQueue.js
import { Queue } from 'bullmq';
import { redisClient } from '../config/redis.js';

const QUEUE_NAME = 'cell-jobs';
const queueConnection = redisClient.duplicate();

export const cellJobsQueue = new Queue(QUEUE_NAME, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: true,
    removeOnFail: 1000,
    backoff: {
      type: 'exponential',
      delay: 3000,
    },
  },
});

const DEFAULT_TIMEZONE = process.env.TZ || 'America/Sao_Paulo';

export async function scheduleDefaultCellJobs() {
  const repeatableJobs = [
    {
      name: 'split-engine',
      data: { trigger: 'SCHEDULED' },
      options: {
        jobId: 'cell_split_engine_daily',
        repeat: { pattern: '0 4 * * *', tz: DEFAULT_TIMEZONE },
      },
    },
    {
      name: 'equilibrium-snapshot',
      data: { trigger: 'SCHEDULED' },
      options: {
        jobId: 'cell_equilibrium_snapshot_weekly',
        repeat: { pattern: '0 6 * * 1', tz: DEFAULT_TIMEZONE },
      },
    },
    {
      name: 'cell-alerts',
      data: { trigger: 'SCHEDULED' },
      options: {
        jobId: 'cell_alerts_interval',
        repeat: { every: 15 * 60 * 1000 }, // a cada 15 minutos
      },
    },
  ];

  await Promise.all(
    repeatableJobs.map((item) =>
      cellJobsQueue.add(item.name, item.data, item.options),
    ),
  );
}

export const enqueueSplitEngineJob = (data = {}) =>
  cellJobsQueue.add('split-engine', data);

export const enqueueEquilibriumSnapshotJob = (data = {}) =>
  cellJobsQueue.add('equilibrium-snapshot', data);

export const enqueueCellAlertJob = (data = {}) =>
  cellJobsQueue.add('cell-alerts', data);
