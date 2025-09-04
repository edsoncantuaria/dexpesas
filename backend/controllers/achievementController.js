// backend/src/controllers/achievementController.js
import prisma from '../config/prismaClient.js';
import AuditService from '../services/auditService.js';

class AchievementController {
    /**
     * Lista todas as conquistas cadastradas. Rota pública.
     */
    async getAllAchievements(req, res, next) {
        try {
            const achievements = await prisma.achievement.findMany({
                orderBy: { name: 'asc' }
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
        const { name, description, icon, xp } = req.body;
        try {
            const newAchievement = await prisma.achievement.create({
                data: { name, description, icon, xp }
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
        const { name, description, icon, xp } = req.body;
        try {
            const originalAchievement = await prisma.achievement.findUnique({ where: { id } });
            if (!originalAchievement) {
                return res.status(404).json({ message: 'Conquista não encontrada.' });
            }
            const updatedAchievement = await prisma.achievement.update({
                where: { id },
                data: { name, description, icon, xp }
            });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_UPDATE_ACHIEVEMENT', entity: 'ACHIEVEMENT', entityId: id, details: { before: originalAchievement, after: updatedAchievement }, ipAddress: req.ip });
            res.json(updatedAchievement);
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
            const originalAchievement = await prisma.achievement.findUnique({ where: { id } });
            if (!originalAchievement) {
                return res.status(404).json({ message: 'Conquista não encontrada.' });
            }

            const unlockedCount = await prisma.unlockedAchievement.count({ where: { achievementId: id } });
            if (unlockedCount > 0) {
                return res.status(400).json({ message: `Não é possível deletar. ${unlockedCount} usuários já desbloquearam esta conquista.` });
            }

            await prisma.achievement.delete({ where: { id } });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_DELETE_ACHIEVEMENT', entity: 'ACHIEVEMENT', entityId: id, details: { before: originalAchievement }, ipAddress: req.ip });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new AchievementController();
