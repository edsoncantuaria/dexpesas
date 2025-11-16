// backend/src/workers/notificationWorker.js
import { Worker } from 'bullmq';
import { redisClient } from '../config/redis.js';
import NotificationService from '../services/notificationService.js';
import webpush from 'web-push';
import config from '../config/config.js';
import { decryptJson } from '../utils/fieldEncryption.js';

const QUEUE_NAME = 'notifications';

class NotificationWorker {
    constructor() {
        // Cria uma nova conexão Redis para o worker, como recomendado pela documentação do BullMQ
        const workerConnection = redisClient.duplicate();

        this.worker = new Worker(QUEUE_NAME, this.processJob.bind(this), {
            connection: workerConnection,
            concurrency: 10, // Processa até 10 jobs de notificação simultaneamente
        });

        this.worker.on('completed', (job) => {
            console.log(`✅ Job #${job.id} (${job.name}) completo.`);
        });

        this.worker.on('failed', (job, err) => {
            console.error(`❌ Job #${job.id} (${job.name}) falhou:`, err.message);
        });

        // Configura o web-push com as chaves VAPID do config
        if (config.vapid.publicKey && config.vapid.privateKey && config.vapid.subject) {
             webpush.setVapidDetails(
                config.vapid.subject,
                config.vapid.publicKey,
                config.vapid.privateKey
            );
            console.log('🔐 Serviço Web Push configurado com chaves VAPID.');
        } else {
            console.warn('⚠️  Chaves VAPID não configuradas. O envio de notificações push está desativado.');
        }
    }

    async processJob(job) {
        const { name, data } = job;
        
        switch (name) {
            case 'check-user-notifications':
                console.log(`🔎 Verificando notificações para o usuário: ${data.userId}`);
                try {
                    await NotificationService.runChecks(data.userId);
                } catch(e) {
                    console.error("Falha ao rodar check de notificação:", e);
                }
                break;
            
            case 'send-push-notification':
                if (!config.vapid.publicKey) {
                    console.log('Pulando envio de push, chaves VAPID não configuradas.');
                    return;
                }
                console.log(`📲 Enviando notificação push...`);
                try {
                    // Descriptografa a subscription antes de usar
                    const decryptedSubscription = decryptJson(data.encryptedSubscription);
                    if (!decryptedSubscription) {
                        throw new Error("Falha ao descriptografar inscrição de push.");
                    }
                    await webpush.sendNotification(decryptedSubscription, data.payload);
                    console.log('✅ Notificação push enviada com sucesso.');
                } catch (error) {
                    // Erros 410 (Gone) ou 404 indicam que a inscrição expirou ou é inválida
                    if (error.statusCode === 410 || error.statusCode === 404) {
                        console.log('Inscrição de push expirada ou inválida. Deveria ser removida do DB.');
                        // TODO: Implementar lógica para remover a 'subscription' do usuário no DB.
                    } else {
                        console.error('❌ Erro no worker ao enviar notificação push:', error.message);
                    }
                }
                break;
            
            default:
                throw new Error(`Tipo de job desconhecido: ${name}`);
        }
    }

    run() {
        console.log(`🛠️  Worker de notificações (${QUEUE_NAME}) iniciado.`);
    }

    async close() {
        await this.worker.close();
    }
}

// Exporta uma instância única do worker
export default new NotificationWorker();
