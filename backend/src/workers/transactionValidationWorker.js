// backend/src/workers/seriesCreationWorker.js
import { Worker } from 'bullmq';
import { redisClient } from '../config/redis.js';
import prisma from '../config/prismaClient.js';
import { addMonths, addWeeks } from 'date-fns';

const QUEUE_NAME = 'series-creation';

class SeriesCreationWorker {
    constructor() {
        const workerConnection = redisClient.duplicate();
        this.worker = new Worker(QUEUE_NAME, this.processJob.bind(this), {
            connection: workerConnection,
            concurrency: 5, // Pode processar várias séries em paralelo
        });

        this.worker.on('completed', (job) => console.log(`✅ Job de criação de série #${job.id} para transação ${job.data.firstTransactionId} completo.`));
        this.worker.on('failed', (job, err) => console.error(`❌ Job de criação de série #${job.id} falhou:`, err.message, err.stack));
    }

    async processJob(job) {
        const { userId, seriesId, firstTransactionId, transactionData } = job.data;
        console.log(`🤖 Processando série ${seriesId} para usuário ${userId}...`);

        const firstTransaction = await prisma.transaction.findUnique({ where: { id: firstTransactionId } });
        if (!firstTransaction) {
            console.warn(`Transação inicial ${firstTransactionId} não encontrada. Abortando criação da série.`);
            return;
        }

        if (transactionData.entryType === 'recurring') {
            await this.createRecurringTransactions(firstTransaction, userId, seriesId, transactionData);
        } else if (transactionData.entryType === 'installment') {
            await this.createInstallmentTransactions(firstTransaction, userId, seriesId, transactionData);
        }
    }

    async createRecurringTransactions(firstTx, userId, seriesId, data) {
        const { recurrenceType } = data;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const projectionCount = user?.futureProjectionCount || 1;
        const transactionsToCreate = [];

        // Começamos do 1 porque a primeira transação já foi criada
        for (let i = 1; i < projectionCount; i++) {
            let nextDate;
            const baseDate = new Date(firstTx.data);
            switch(recurrenceType) {
                case 'WEEKLY': nextDate = addWeeks(baseDate, i); break;
                case 'BIWEEKLY': nextDate = addWeeks(baseDate, i * 2); break;
                case 'MONTHLY': nextDate = addMonths(baseDate, i); break;
                case 'BIMONTHLY': nextDate = addMonths(baseDate, i * 2); break;
                case 'TRIMONTHLY': nextDate = addMonths(baseDate, i * 3); break;
                case 'SEMIANNUALLY': nextDate = addMonths(baseDate, i * 6); break;
                default: nextDate = addMonths(baseDate, i);
            }

            transactionsToCreate.push({
                ...firstTx, // Usa a primeira como base
                id: undefined, // Deixa o DB gerar o ID
                data: nextDate,
                pago: false, // Futuras são sempre não pagas
                recorrenciaId: seriesId,
                attachmentUrl: null, // Anexos e notas apenas na primeira
                notes: null,
            });
        }

        if (transactionsToCreate.length > 0) {
            await prisma.transaction.createMany({ data: transactionsToCreate });
            console.log(`✅ ${transactionsToCreate.length} transações recorrentes criadas para a série ${seriesId}.`);
        }
    }
    
    async createInstallmentTransactions(firstTx, userId, seriesId, data) {
        const { totalInstallments, valor, withInterest, interestRate } = data;
        const transactionsToCreate = [];
        let installmentValue = parseFloat(valor) / totalInstallments;
        let totalComJuros = parseFloat(valor);

        if (withInterest && interestRate > 0) {
            const monthlyRate = interestRate / 100;
            installmentValue = (parseFloat(valor) * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -totalInstallments));
            totalComJuros = installmentValue * totalInstallments;
        }

        const installmentValueFixed = parseFloat(installmentValue.toFixed(2));
        
        // Começa da segunda parcela, pois a primeira já foi criada
        for (let i = 1; i < totalInstallments; i++) {
             transactionsToCreate.push({
                ...firstTx,
                id: undefined,
                descricao: `${firstTx.descricao.replace(/\s\(1\/\d+\)$/, '')} (${i + 1}/${totalInstallments})`,
                valor: installmentValueFixed,
                valorTotal: parseFloat(valor),
                data: addMonths(new Date(firstTx.data), i),
                pago: true, // Parcelas de cartão são "pagas" no cartão
                installmentId: seriesId,
                installmentNumber: i + 1,
                totalWithInterest: totalComJuros,
                attachmentUrl: null,
                notes: null,
             });
        }
        
         if (transactionsToCreate.length > 0) {
            await prisma.transaction.createMany({ data: transactionsToCreate });
            console.log(`✅ ${transactionsToCreate.length} parcelas criadas para a série ${seriesId}.`);
        }
    }


    run() {
        console.log(`🛠️  Worker de criação de séries (${QUEUE_NAME}) iniciado.`);
    }

    async close() {
        await this.worker.close();
    }
}

export default new SeriesCreationWorker();
