// backend/src/queues/seriesCreationQueue.js
import { Queue } from 'bullmq';
import { redisClient } from '../config/redis.js';

const QUEUE_NAME = 'series-creation';

const queueConnection = redisClient.duplicate();

export const seriesCreationQueue = new Queue(QUEUE_NAME, {
    connection: queueConnection,
    defaultJobOptions: {
        attempts: 2, // Tenta apenas 2 vezes
        backoff: {
            type: 'fixed',
            delay: 1000 * 30, // Atraso de 30s
        },
        removeOnComplete: true,
        removeOnFail: 5000,
    },
});
