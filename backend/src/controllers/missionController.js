// backend/src/controllers/missionController.js
import prisma from '../config/prismaClient.js';
import AuditService from '../services/auditService.js';

const ALLOWED_MODES = {
    FULL: 'FULL',
    LITE: 'LITE',
    OFF: 'OFF',
};

async function ensureGamificationAccess(userId, { requireFull = false } = {}) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { gamificationMode: true }
    });
    const mode = user?.gamificationMode || ALLOWED_MODES.FULL;
    if (mode === ALLOWED_MODES.OFF) {
        const error = new Error('Gamificação desativada para este usuário.');
        error.statusCode = 403;
        throw error;
    }
    if (requireFull && mode !== ALLOWED_MODES.FULL) {
        const error = new Error('Este recurso está disponível apenas no modo completo.');
        error.statusCode = 403;
        throw error;
    }
    return mode;
}

class MissionController {
    /**
     * Busca todas as missões ativas que o usuário ainda não aceitou.
     */
    async getAvailableMissions(req, res, next) {
        const userId = req.user.id;
        try {
            const mode = await ensureGamificationAccess(userId);
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ message: 'Usuário não encontrado.' });
            }

            const acceptedMissionIds = await prisma.userMission.findMany({
                where: { userId },
                select: { missionId: true },
            });
            const acceptedIds = acceptedMissionIds.map(um => um.missionId);

            const missionFilters = {
                isActive: true,
                id: { notIn: acceptedIds },
                minLevel: { lte: user.level || 1 },
            };
            if (mode === ALLOWED_MODES.LITE) {
                missionFilters.scope = 'USER';
            }

            const availableMissions = await prisma.mission.findMany({
                where: {
                    ...missionFilters,
                },
                orderBy: { minLevel: 'asc' },
            });
            res.json(availableMissions);
        } catch (error) {
            next(error);
        }
    }

    /**
     * Busca todas as missões que o usuário já aceitou (em andamento ou completas).
     */
    async getMyMissions(req, res, next) {
        const userId = req.user.id;
        try {
            const mode = await ensureGamificationAccess(userId);
            const myMissions = await prisma.userMission.findMany({
                where: { userId },
                include: { mission: true },
                orderBy: { acceptedAt: 'desc' },
            });
            const filtered = mode === ALLOWED_MODES.LITE
                ? myMissions.filter(m => m.mission.scope === 'USER')
                : myMissions;
            res.json(filtered);
        } catch (error) {
            next(error);
        }
    }
    
    /**
     * Busca missões que podem ser consideradas "de guilda".
     * No futuro, isso teria uma lógica própria (ex: `isGuildMission: true`).
     * Por agora, simulamos pegando missões de nível mais alto.
     */
    async getGuildMissions(req, res, next) {
        try {
            await ensureGamificationAccess(req.user.id, { requireFull: true });
            const guildMissions = await prisma.mission.findMany({
                where: {
                    isActive: true,
                    minLevel: { gte: 5 }, // Simulação: missões de guilda são as de nível 5+
                    isRepeatable: true,
                },
                orderBy: { minLevel: 'desc' },
                take: 10,
            });
            res.json(guildMissions);
        } catch (error) {
            next(error);
        }
    }


    /**
     * Permite que um usuário aceite uma nova missão.
     */
    async acceptMission(req, res, next) {
        const { missionId } = req.body;
        const userId = req.user.id;

        try {
            const mode = await ensureGamificationAccess(userId);
            // Verifica se a missão existe e está ativa
            const missionToAccept = await prisma.mission.findFirst({
                where: { id: missionId, isActive: true },
            });
            if (!missionToAccept) {
                return res.status(404).json({ message: 'Missão não encontrada ou inativa.' });
            }

            if (mode === ALLOWED_MODES.LITE && missionToAccept.scope === 'GUILD') {
                return res.status(403).json({ message: 'Missões de guilda requerem o modo completo.' });
            }
            
            // Verifica se o usuário já aceitou esta missão
            const existingUserMission = await prisma.userMission.findUnique({
                where: { userId_missionId: { userId, missionId } },
            });
            if (existingUserMission) {
                return res.status(409).json({ message: 'Você já aceitou esta missão.' });
            }

            const newUserMission = await prisma.userMission.create({
                data: {
                    userId,
                    missionId,
                    progressJson: { count: 0 }, // Progresso inicial padrão
                },
                include: { mission: true },
            });
            
            await AuditService.log({
                userId,
                action: 'ACCEPT_MISSION',
                entity: 'USER_MISSION',
                entityId: newUserMission.id,
                details: { missionId: missionId, missionTitle: newUserMission.mission.title },
                ipAddress: req.ip,
            });

            res.status(201).json(newUserMission);

        } catch (error) {
            next(error);
        }
    }
    
    // --- ROTAS DE ADMIN ---

    /**
     * [ADMIN] Cria uma nova missão no sistema.
     */
    async createMission(req, res, next) {
        const { title, description, xpReward, itemRewardId, minLevel, requiredClass, triggerSpec, isRepeatable, isActive } = req.body;
        try {
            const newMission = await prisma.mission.create({
                data: {
                    title, description, xpReward, itemRewardId, minLevel, 
                    requiredClass, triggerSpec, isRepeatable, isActive
                }
            });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_CREATE_MISSION', entity: 'MISSION', entityId: newMission.id, details: { after: newMission }, ipAddress: req.ip });
            res.status(201).json(newMission);
        } catch (error) {
            next(error);
        }
    }

    /**
     * [ADMIN] Atualiza uma missão existente.
     */
    async updateMission(req, res, next) {
        const { id } = req.params;
        const { title, description, xpReward, itemRewardId, minLevel, requiredClass, triggerSpec, isRepeatable, isActive } = req.body;
        try {
            const originalMission = await prisma.mission.findUnique({ where: { id } });
            if (!originalMission) {
                return res.status(404).json({ message: 'Missão não encontrada.' });
            }
            const updatedMission = await prisma.mission.update({
                where: { id },
                data: {
                    title, description, xpReward, itemRewardId, minLevel, 
                    requiredClass, triggerSpec, isRepeatable, isActive
                }
            });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_UPDATE_MISSION', entity: 'MISSION', entityId: id, details: { before: originalMission, after: updatedMission }, ipAddress: req.ip });
            res.json(updatedMission);
        } catch (error) {
            next(error);
        }
    }

    /**
     * [ADMIN] Deleta uma missão.
     */
    async deleteMission(req, res, next) {
        const { id } = req.params;
        try {
            const originalMission = await prisma.mission.findUnique({ where: { id } });
            if (!originalMission) {
                return res.status(404).json({ message: 'Missão não encontrada.' });
            }

            // Garante que não há progresso de usuários atrelado antes de deletar
            const userMissionsCount = await prisma.userMission.count({ where: { missionId: id } });
            if (userMissionsCount > 0) {
                return res.status(400).json({ message: `Não é possível deletar. ${userMissionsCount} usuários estão com esta missão.` });
            }

            await prisma.mission.delete({ where: { id } });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_DELETE_MISSION', entity: 'MISSION', entityId: id, details: { before: originalMission }, ipAddress: req.ip });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new MissionController();
