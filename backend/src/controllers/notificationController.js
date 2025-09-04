// src/controllers/notificationController.js
import { PrismaClient } from '@prisma/client';
import NotificationService from '../services/notificationService.js';
import { notificationQueue } from '../queues/notificationQueue.js';
import webpush from 'web-push';
import config from '../config/config.js';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Chave de criptografia deve ter 32 bytes para aes-256-cbc.
// Usamos uma chave de 16 bytes (128 bits) em hexadecimal (32 caracteres) e a convertemos para um buffer de 16 bytes.
const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY || '', 'hex');
const IV_LENGTH = 16; // Para AES, o IV é sempre 16 bytes

// Função para criptografar dados
function encrypt(text) {
    if (!text || !ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 16) {
        console.error("Chave de criptografia inválida ou ausente.");
        return null;
    }
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(JSON.stringify(text), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
}


// Configura o web-push com as chaves VAPID
if (config.vapid.publicKey && config.vapid.privateKey && config.vapid.subject) {
    webpush.setVapidDetails(
        config.vapid.subject,
        config.vapid.publicKey,
        config.vapid.privateKey
    );
}

class NotificationController {
    /**
     * Retorna a chave pública VAPID para o frontend.
     */
    getVapidPublicKey(req, res) {
        if (!config.vapid.publicKey) {
            return res.status(500).json({ message: 'A chave pública VAPID não está configurada no servidor.' });
        }
        res.json({ publicKey: config.vapid.publicKey });
    }

    /**
     * Inscreve um usuário para receber notificações push.
     */
    async subscribe(req, res, next) {
        const { subscription } = req.body;
        const userId = req.user.id;

        if (!subscription) {
            return res.status(400).json({ message: 'O objeto de inscrição é obrigatório.' });
        }

        try {
            // Criptografa o objeto de inscrição antes de salvar
            const encryptedSubscription = encrypt(subscription);
            if (!encryptedSubscription) {
                return res.status(500).json({ message: "Falha ao criptografar dados de inscrição."});
            }

            await prisma.user.update({
                where: { id: userId },
                data: { pushSubscription: encryptedSubscription },
            });
            res.status(201).json({ message: 'Inscrição realizada com sucesso.' });
        } catch (error) {
            next(error);
        }
    }


    /**
     * Busca todas as notificações não lidas de um usuário.
     * AGORA, também adiciona um job na fila para verificar novas notificações em background.
     */
    async getNotifications(req, res, next) {
        const userId = req.user.id;
        try {
            // Dispara a verificação em background ADICIONANDO um job à fila
            await notificationQueue.add('check-user-notifications', { userId });

            const notifications = await prisma.notification.findMany({
                where: {
                    userId: userId,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 100,
            });
            res.json(notifications);
        } catch (error) {
            next(error);
        }
    }
    
    async markOneAsRead(req, res, next) {
        const { notificationId } = req.body;
        const userId = req.user.id;
        try {
            await prisma.notification.update({
                where: {
                    id: notificationId,
                    userId: userId,
                },
                data: {
                    read: true,
                },
            });
            res.status(204).send();
        } catch (error) {
            // Ignora erro se a notificação não for encontrada (pode já ter sido deletada)
            if (error.code !== 'P2025') {
                next(error);
            } else {
                res.status(204).send();
            }
        }
    }

    async markAllAsRead(req, res, next) {
        const userId = req.user.id;
        try {
            await prisma.notification.updateMany({
                where: {
                    userId: userId,
                    read: false,
                },
                data: {
                    read: true,
                },
            });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
    
    async clearAll(req, res, next) {
        const userId = req.user.id;
        try {
            await prisma.$transaction(async (tx) => {
                const duePaymentNotifications = await tx.notification.findMany({
                    where: {
                        userId,
                        type: 'PAYMENT_DUE',
                        relatedId: { not: null }
                    }
                });

                const transactionIds = duePaymentNotifications.map(n => n.relatedId).filter(Boolean);

                if (transactionIds.length > 0) {
                     await NotificationService.handleBulkKeepUnpaid(userId, transactionIds, tx);
                }

                await tx.notification.deleteMany({
                    where: { userId }
                });
            });

            res.status(200).json({ message: "Notificações limpas e ações de pendência aplicadas com sucesso."});

        } catch (error) {
            next(error);
        }
    }

    async deleteOne(req, res, next) {
        const { notificationId } = req.params;
        const userId = req.user.id;
        try {
            await prisma.notification.delete({
                where: {
                    id: notificationId,
                    userId: userId,
                },
            });
            res.status(204).send();
        } catch (error) {
             if (error.code !== 'P2025') {
                next(error);
            } else {
                res.status(204).send();
            }
        }
    }
    
    async handleAction(req, res, next) {
        const { notificationId, action } = req.body;
        const userId = req.user.id;

        try {
            const notification = await prisma.notification.findFirst({
                where: { id: notificationId, userId: userId }
            });

            if (!notification) {
                const err = new Error('Notificação não encontrada.');
                err.statusCode = 404;
                throw err;
            }
            
            let result;
            
            switch (action) {
                case 'MARK_AS_PAID':
                    if (!notification.relatedId) throw { statusCode: 400, message: 'ID da transação relacionado ausente.'};
                    result = await NotificationService.handleMarkAsPaid(userId, notification.relatedId);
                    break;
                case 'KEEP_UNPAID':
                    if (!notification.relatedId) throw { statusCode: 400, message: 'ID da transação relacionado ausente.'};
                    result = await NotificationService.handleKeepUnpaid(userId, notification.relatedId);
                    break;
                case 'REMOVE_RECURRENCE':
                    if (!notification.relatedId) throw { statusCode: 400, message: 'ID da transação relacionado ausente.'};
                    result = await NotificationService.handleRemoveRecurrence(userId, notification.relatedId);
                    break;
                default:
                    const err = new Error('Ação desconhecida ou inválida.');
                    err.statusCode = 400;
                    throw err;
            }
            
            await prisma.notification.delete({
                where: { id: notificationId }
            });

            res.json({ message: "Ação executada com sucesso!", ...result });

        } catch (error) {
            if (error.statusCode) {
                return res.status(error.statusCode).json({ message: error.message });
            }
            next(error);
        }
    }
}

export default new NotificationController();
