import prisma from '../config/prismaClient.js';
import AuditService from '../services/auditService.js';

class AchievementController {
    /**
     * [PUBLIC] Lista todas as conquistas disponíveis.
     */
    async getAllAchievements(req, res, next) {
        try {
            const achievements = await prisma.achievement.findMany({
                orderBy: { xp: 'asc' }
            });
            res.json(achievements);
        } catch (error) {
            next(error);
        }
    }

    /**
     * [ADMIN] Cria uma nova conquista.
     */
    async createAchievement(req, res, next) {
        const { name, description, icon, xp, trigger, criteria } = req.body;
        try {
            const newAchievement = await prisma.achievement.create({
                data: {
                    name, description, icon, xp, trigger, criteria
                }
            });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_CREATE_ACHIEVEMENT', entity: 'ACHIEVEMENT', entityId: newAchievement.id, details: { after: newAchievement }, ipAddress: req.ip });
            res.status(201).json(newAchievement);
        } catch (error) {
            next(error);
        }
    }

    /**
     * [ADMIN] Atualiza uma conquista existente.
     */
    async updateAchievement(req, res, next) {
        const { id } = req.params;
        const { name, description, icon, xp, trigger, criteria } = req.body;
        try {
            const original = await prisma.achievement.findUnique({ where: { id } });
            if (!original) return res.status(404).json({ message: 'Conquista não encontrada.' });

            const updated = await prisma.achievement.update({
                where: { id },
                data: { name, description, icon, xp, trigger, criteria }
            });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_UPDATE_ACHIEVEMENT', entity: 'ACHIEVEMENT', entityId: id, details: { before: original, after: updated }, ipAddress: req.ip });
            res.json(updated);
        } catch (error) {
            next(error);
        }
    }

    /**
     * [ADMIN] Deleta uma conquista.
     */
    async deleteAchievement(req, res, next) {
        const { id } = req.params;
        try {
            const original = await prisma.achievement.findUnique({ where: { id } });
            if (!original) return res.status(404).json({ message: 'Conquista não encontrada.' });

            await prisma.achievement.delete({ where: { id } });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_DELETE_ACHIEVEMENT', entity: 'ACHIEVEMENT', entityId: id, details: { before: original }, ipAddress: req.ip });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new AchievementController();
