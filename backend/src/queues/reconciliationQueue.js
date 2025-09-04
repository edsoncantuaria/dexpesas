// backend/src/queues/reconciliationQueue.js
import { Queue } from 'bullmq';
import { redisClient } from '../config/redis.js';

const QUEUE_NAME = 'reconciliation';

const queueConnection = redisClient.duplicate();

export const reconciliationQueue = new Queue(QUEUE_NAME, {
    connection: queueConnection,
    defaultJobOptions: {
        attempts: 2, // Tenta reprocessar o arquivo 2 vezes em caso de falha
        backoff: {
            type: 'exponential',
            delay: 5000, // Atraso maior pois o parsing pode ser pesado
        },
        removeOnComplete: true,
        removeOnFail: 5000,
    },
});
