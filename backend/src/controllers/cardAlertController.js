// backend/src/controllers/cardAlertController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import CardAlertService from '../services/cardAlertService.js';
import { cardAlertQueue } from '../queues/cardAlertQueue.js';

const prisma = new PrismaClient();

class CardAlertController {
    /**
     * GET /api/card-alerts
     * Lista todos os alertas do usuário
     */
    async getAllAlerts(req, res, next) {
        const userId = req.user.id;
        const { cardId, type, severity, read, dismissed } = req.query;

        try {
            const filters = {};
            if (cardId) filters.cardId = cardId;
            if (type) filters.type = type;
            if (severity) filters.severity = severity;
            if (read !== undefined) filters.read = read === 'true';
            if (dismissed !== undefined) filters.dismissed = dismissed === 'true';

            const alerts = await CardAlertService.getUserAlerts(userId, filters);
            res.json(alerts);
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /api/cards/:cardId/alerts
     * Lista alertas de um cartão específico
     */
    async getAlertsByCard(req, res, next) {
        const { cardId } = req.params;
        const userId = req.user.id;

        try {
            const alerts = await CardAlertService.getUserAlerts(userId, { cardId });
            res.json(alerts);
        } catch (error) {
            next(error);
        }
    }

    /**
     * PATCH /api/card-alerts/:alertId/read
     * Marca alerta como lido
     */
    async markAsRead(req, res, next) {
        const { alertId } = req.params;
        const userId = req.user.id;

        try {
            await CardAlertService.markAsRead(alertId, userId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    /**
     * DELETE /api/card-alerts/:alertId
     * Descarta alerta
     */
    async dismissAlert(req, res, next) {
        const { alertId } = req.params;
        const userId = req.user.id;

        try {
            await CardAlertService.dismissAlert(alertId, userId);
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /api/card-alerts/check
     * Força verificação manual de alertas
     */
    async triggerManualCheck(req, res, next) {
        const userId = req.user.id;

        try {
            // Adiciona job na fila para processar em background
            await cardAlertQueue.add('check-card-alerts-user', { userId });
            res.json({ message: 'Verificação de alertas agendada com sucesso.' });
        } catch (error) {
            next(error);
        }
    }
}

export default new CardAlertController();
