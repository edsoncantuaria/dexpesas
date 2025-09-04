// backend/src/config/redis.js
import Redis from 'ioredis';
import config from './config.js';

export const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  maxRetriesPerRequest: null // Permite que o BullMQ gerencie as tentativas de reconexão
});

redisClient.on('connect', () => {
  console.log('🔌 Cliente Redis conectado.');
});

redisClient.on('error', (err) => {
  console.error('❌ Erro no cliente Redis:', err);
});
