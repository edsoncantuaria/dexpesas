
// backend/src/queues/auditQueue.js
import { Queue } from 'bullmq';
import { redisClient } from '../config/redis.js';

const QUEUE_NAME = 'audit';

const queueConnection = redisClient.duplicate();

export const auditQueue = new Queue(QUEUE_NAME, {
    connection: queueConnection,
    defaultJobOptions: {
        attempts: 5, // Alta prioridade, tenta mais vezes
        backoff: {
            type: 'exponential',
            delay: 1000,
        },
        removeOnComplete: true,
        removeOnFail: false, // Mantém logs que falharam para análise
    },
});
    
    