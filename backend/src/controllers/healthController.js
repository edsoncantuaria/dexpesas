// backend/src/controllers/healthController.js
import prisma from '../config/prismaClient.js';
import { redisClient } from '../config/redis.js';

class HealthController {
    /**
     * Verifica a saúde dos serviços vitais da aplicação (Banco de Dados e Redis).
     * Retorna 200 OK se tudo estiver funcionando.
     * O errorHandler pegará qualquer erro de conexão e retornará um erro 5xx.
     */
    async check(req, res, next) {
        try {
            // 1. Verifica a conexão com o banco de dados
            await prisma.$queryRaw`SELECT 1`;
            
            // 2. Verifica a conexão com o Redis
            const redisPing = await redisClient.ping();
            if (redisPing !== 'PONG') {
                throw new Error('Falha na conexão com o Redis.');
            }

            // 3. Se tudo estiver OK, retorna sucesso.
            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                services: {
                    database: 'connected',
                    redis: 'connected',
                }
            });

        } catch (error) {
            // Passa o erro para o middleware de tratamento de erros
            next(error);
        }
    }
}

export default new HealthController();
