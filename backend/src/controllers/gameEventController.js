// backend/src/controllers/gameEventController.js
import prisma from '../config/prismaClient.js';
import AuditService from '../services/auditService.js';

class GameEventController {
    async getActiveEvents(req, res, next) {
        try {
            const events = await prisma.gameEvent.findMany({
                where: {
                    isActive: true,
                    startAt: { lte: new Date() },
                    endAt: { gte: new Date() },
                },
                orderBy: { startAt: 'desc' }
            });
            res.json(events);
        } catch (error) {
            next(error);
        }
    }

    async getAllEvents(req, res, next) {
        try {
            const events = await prisma.gameEvent.findMany({ orderBy: { startAt: 'desc' } });
            res.json(events);
        } catch (error) {
            next(error);
        }
    }

    async createEvent(req, res, next) {
        const { type, description, multiplier, itemId, isActive, startAt, endAt } = req.body;
        try {
            const newEvent = await prisma.gameEvent.create({
                data: {
                    type,
                    description,
                    multiplier,
                    itemId,
                    isActive,
                    startAt: new Date(startAt),
                    endAt: new Date(endAt),
                }
            });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_CREATE_EVENT', entity: 'GAME_EVENT', entityId: newEvent.id, details: { after: newEvent }, ipAddress: req.ip });
            res.status(201).json(newEvent);
        } catch (error) {
            next(error);
        }
    }

    async updateEvent(req, res, next) {
        const { id } = req.params;
        const { type, description, multiplier, itemId, isActive, startAt, endAt } = req.body;
        try {
            const originalEvent = await prisma.gameEvent.findUnique({ where: { id } });
            const updatedEvent = await prisma.gameEvent.update({
                where: { id },
                data: {
                    type,
                    description,
                    multiplier,
                    itemId,
                    isActive,
                    startAt: new Date(startAt),
                    endAt: new Date(endAt),
                }
            });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_UPDATE_EVENT', entity: 'GAME_EVENT', entityId: id, details: { before: originalEvent, after: updatedEvent }, ipAddress: req.ip });
            res.json(updatedEvent);
        } catch (error) {
            next(error);
        }
    }

    async deleteEvent(req, res, next) {
        const { id } = req.params;
        try {
            const originalEvent = await prisma.gameEvent.findUnique({ where: { id } });
            await prisma.gameEvent.delete({ where: { id } });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_DELETE_EVENT', entity: 'GAME_EVENT', entityId: id, details: { before: originalEvent }, ipAddress: req.ip });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new GameEventController();
