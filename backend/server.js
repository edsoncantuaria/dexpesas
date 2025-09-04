// server.js
import app from './src/app.js';
import config from './src/config/config.js';
import { PrismaClient } from '@prisma/client';
import { redisClient } from './src/config/redis.js';

const prisma = new PrismaClient();

const startServer = async () => {
    console.log('🌱 Iniciando servidor...');
    try {
        // 1. Testa a conexão com o banco de dados Prisma
        console.log('Validando conexão com o Banco de Dados (Prisma)...');
        await prisma.$connect();
        console.log('✅ [OK] Conectado ao banco de dados com sucesso.');

        // 2. Testa a conexão com o Redis
        console.log('Validando conexão com o Redis...');
        const redisPing = await redisClient.ping();
        if (redisPing !== 'PONG') {
            throw new Error('Ping para o Redis não retornou "PONG"');
        }
        console.log('✅ [OK] Conectado ao Redis com sucesso.');
        
        // 3. Inicia o servidor Express
        app.listen(config.port, () => {
            console.log('-----------------------------------------');
            console.log(`🚀 Servidor Express rodando na porta ${config.port}`);
            console.log('-----------------------------------------');
        });

    } catch (error) {
        console.error('❌ Falha crítica ao iniciar o servidor:', error);
        process.exit(1); // Encerra o processo se qualquer etapa falhar
    }
};

startServer();

// Garante que a conexão com o Prisma e Redis seja fechada elegantemente
process.on('SIGINT', async () => {
    console.log('\n🔌 Encerrando conexões...');
    await prisma.$disconnect();
    redisClient.quit();
    console.log('✅ Conexões com Prisma e Redis fechadas.');
    process.exit(0);
});
