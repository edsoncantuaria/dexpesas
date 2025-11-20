// backend/src/workers/investmentWorker.js
import cron from 'node-cron';
import InvestmentSnapshotService from '../services/investmentSnapshotService.js';

class InvestmentWorker {
    constructor() {
        cron.schedule(
            '30 2 1 * *',
            async () => {
                console.log('⏰ [InvestmentWorker] Executando rollup mensal de investimentos...');
                await InvestmentSnapshotService.generateMonthlyRollup();
            },
            { scheduled: true, timezone: 'America/Sao_Paulo' },
        );

        cron.schedule(
            '0 8 * * *',
            async () => {
                console.log('⏰ [InvestmentWorker] Executando verificação diária para smart nudges...');
                await InvestmentSnapshotService.runSmartNudges();
            },
            { scheduled: true, timezone: 'America/Sao_Paulo' },
        );
    }

    run() {
        console.log('🧠 Worker de investimentos iniciado.');
    }

    async close() {
        // Nada assíncrono para encerrar no momento
    }
}

export default new InvestmentWorker();
