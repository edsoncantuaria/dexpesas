
// backend/src/queues/streaksQueue.js
import { Queue } from 'bullmq';
import { redisClient } from '../config/redis.js';

const QUEUE_NAME = 'streaks';

const queueConnection = redisClient.duplicate();

export const streaksQueue = new Queue(QUEUE_NAME, {
    connection: queueConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000,
        },
        removeOnComplete: true,
        removeOnFail: 1000,
    },
});
