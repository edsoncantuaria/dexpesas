// backend/src/workers/notificationWorker.js
import { Worker } from 'bullmq';
import { redisClient } from '../config/redis.js';
import NotificationService from '../services/notificationService.js';
import webpush from 'web-push';
import config from '../config/config.js';
import crypto from 'crypto';

const QUEUE_NAME = 'notifications';

// Chave de criptografia deve ter 32 bytes para aes-256-cbc.
// Usamos uma chave de 16 bytes (128 bits) em hexadecimal (32 caracteres) e a convertemos para um buffer de 16 bytes.
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
const IV_LENGTH = 16; // Para AES, o IV é sempre 16 bytes

// Função para descriptografar dados
function decrypt(text) {
  if (!text || !ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 16) {
      console.error("Chave de criptografia inválida ou ausente para descriptografia.");
      return null;
  }
  try {
    const textParts = text.split(':');
    if (textParts.length !== 2) throw new Error("Texto criptografado em formato inválido.");
    
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return JSON.parse(decrypted.toString());
  } catch (error) {
      console.error("Erro ao descriptografar:", error);
      return null;
  }
}

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
                    const decryptedSubscription = decrypt(data.encryptedSubscription);
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
