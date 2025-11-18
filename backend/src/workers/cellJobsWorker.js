// backend/src/workers/cellJobsWorker.js
import { Worker } from 'bullmq';
import { redisClient } from '../config/redis.js';
import CellJobsService from '../services/cellJobsService.js';

const QUEUE_NAME = 'cell-jobs';

class CellJobsWorker {
  constructor() {
    const workerConnection = redisClient.duplicate();
    this.worker = new Worker(
      QUEUE_NAME,
      this.processJob.bind(this),
      {
        connection: workerConnection,
        concurrency: 2,
      },
    );

    this.worker.on('completed', (job, result) => {
      console.log(
        `[CELL_JOB_RUN] ${job.name}#${job.id} concluído.`,
        result || '',
      );
    });

    this.worker.on('failed', (job, err) => {
      console.error(
        `[CELL_JOB_ERROR] ${job?.name || 'unknown'}#${job?.id || '?'} ->`,
        err,
      );
    });
  }

  async processJob(job) {
    const payload = job.data || {};
    switch (job.name) {
      case 'split-engine':
        return CellJobsService.runSplitEngine(payload);
      case 'equilibrium-snapshot':
        return CellJobsService.runEquilibriumSnapshot(payload);
      case 'cell-alerts':
        return CellJobsService.runCellAlerts(payload);
      case 'budget-mirror-rollup':
        return CellJobsService.runBudgetMirrorRollup(payload);
      case 'family-budget-resync':
        return CellJobsService.runFullBudgetResync(payload);
      default:
        throw new Error(`Tipo de job desconhecido: ${job.name}`);
    }
  }

  run() {
    console.log(`🧩 Worker de Famílias (${QUEUE_NAME}) iniciado.`);
  }

  async close() {
    await this.worker.close();
  }
}

export default new CellJobsWorker();
