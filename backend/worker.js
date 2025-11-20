// backend/worker.js
import { redisClient } from './src/config/redis.js';
import NotificationWorker from './src/workers/notificationWorker.js';
import ReconciliationWorker from './src/workers/reconciliationWorker.js';
import StreaksWorker from './src/workers/streaksWorker.js';
import AuditWorker from './src/workers/auditWorker.js';
import SeriesCreationWorker from './src/workers/transactionValidationWorker.js';
import CellJobsWorker from './src/workers/cellJobsWorker.js';
import InvestmentWorker from './src/workers/investmentWorker.js';

console.log('🌱 Iniciando processo de Worker...');

try {
    // Testa a conexão com o Redis
    redisClient.ping().then(() => {
        console.log('🔗 Worker conectado ao Redis: Sim');
        
        // Inicia os workers
        NotificationWorker.run();
        ReconciliationWorker.run();
        StreaksWorker.run();
        AuditWorker.run();
        SeriesCreationWorker.run();
        CellJobsWorker.run();
        InvestmentWorker.run();

        console.log('🚀 Todos os workers estão rodando e aguardando jobs.');

    }).catch(error => {
        console.error('❌ Worker não conseguiu conectar ao Redis:', error);
        process.exit(1);
    });

} catch (error) {
    console.error('❌ Falha ao iniciar o ambiente do worker:', error);
    process.exit(1);
}

process.on('SIGINT', async () => {
    console.log('🔌 Encerrando conexões do worker...');
    await NotificationWorker.close();
    await ReconciliationWorker.close();
    await StreaksWorker.close();
    await AuditWorker.close();
    await SeriesCreationWorker.close();
    await CellJobsWorker.close();
    await InvestmentWorker.close();
    redisClient.quit();
    console.log('✅ Conexões do worker encerradas.');
    process.exit(0);
});
