// backend/src/routes/notificationRoutes.js
import express from 'express';
import notificationController from '../controllers/notificationController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota pública para obter a chave VAPID
router.get('/vapid-public-key', notificationController.getVapidPublicKey);

// As outras rotas precisam de autenticação
router.use(authMiddleware);

// Rota para o navegador se inscrever nas notificações push
router.post('/subscribe', notificationController.subscribe);

// Rota para buscar todas as notificações do usuário
router.get('/', notificationController.getNotifications);

// Rota para marcar uma notificação como lida
router.post('/read-one', notificationController.markOneAsRead);

// Rota para marcar todas como lidas
router.post('/read-all', notificationController.markAllAsRead);

// Rota para limpar todas as notificações (com ações em lote)
router.post('/clear-all', notificationController.clearAll);

// Rota para deletar uma notificação específica
router.delete('/:notificationId', notificationController.deleteOne);

// Rota para executar uma ação de uma notificação específica
router.post('/handle-action', notificationController.handleAction);


export default router;
