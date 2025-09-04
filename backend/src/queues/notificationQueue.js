// backend/src/queues/notificationQueue.js
import { Queue } from 'bullmq';
import { redisClient } from '../config/redis.js';

const QUEUE_NAME = 'notifications';

// Cria uma instância de conexão para o BullMQ que pode ser diferente do cliente Redis geral
const queueConnection = redisClient.duplicate();

export const notificationQueue = new Queue(QUEUE_NAME, {
    connection: queueConnection,
    defaultJobOptions: {
        attempts: 3, // Tenta o job 3 vezes em caso de falha
        backoff: {
            type: 'exponential',
            delay: 1000, // Atraso de 1s para a primeira tentativa
        },
        removeOnComplete: true, // Remove o job da fila após completar com sucesso
        removeOnFail: 1000, // Mantém jobs que falharam por 1000s
    },
});
