// backend/src/controllers/bossController.js
import prisma from '../config/prismaClient.js';
import AuditService from '../services/auditService.js';

class BossController {
    /**
     * Lista todos os bosses ativos. (Público para jogadores)
     */
    async getActiveBosses(req, res, next) {
        try {
            const activeBosses = await prisma.boss.findMany({
                where: {
                    isActive: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            res.json(activeBosses);
        } catch (error) {
            next(error);
        }
    }
    
    // --- ROTAS DE ADMIN ---

    /**
     * [ADMIN] Lista TODOS os bosses, ativos e inativos.
     */
    async getAllBosses(req, res, next) {
        try {
            const bosses = await prisma.boss.findMany({
                orderBy: { createdAt: 'desc' }
            });
            res.json(bosses);
        } catch (error) {
            next(error);
        }
    }

    /**
     * [ADMIN] Cria um novo chefe.
     */
    async createBoss(req, res, next) {
        const { name, hp, rewardJson, isActive, startAt, endAt } = req.body;
        try {
            const newBoss = await prisma.boss.create({
                data: {
                    name,
                    hp,
                    currentHp: hp, // Vida atual começa cheia
                    rewardJson,
                    isActive,
                    startAt: startAt ? new Date(startAt) : null,
                    endAt: endAt ? new Date(endAt) : null,
                }
            });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_CREATE_BOSS', entity: 'BOSS', entityId: newBoss.id, details: { after: newBoss }, ipAddress: req.ip });
            res.status(201).json(newBoss);
        } catch (error) {
            next(error);
        }
    }

    /**
     * [ADMIN] Atualiza um chefe existente.
     */
    async updateBoss(req, res, next) {
        const { id } = req.params;
        const { name, hp, currentHp, rewardJson, isActive, startAt, endAt } = req.body;
        try {
            const originalBoss = await prisma.boss.findUnique({ where: { id } });
            if (!originalBoss) {
                return res.status(404).json({ message: 'Chefe não encontrado.' });
            }
            const updatedBoss = await prisma.boss.update({
                where: { id },
                data: {
                    name,
                    hp,
                    currentHp,
                    rewardJson,
                    isActive,
                    startAt: startAt ? new Date(startAt) : null,
                    endAt: endAt ? new Date(endAt) : null,
                }
            });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_UPDATE_BOSS', entity: 'BOSS', entityId: id, details: { before: originalBoss, after: updatedBoss }, ipAddress: req.ip });
            res.json(updatedBoss);
        } catch (error) {
            next(error);
        }
    }

    /**
     * [ADMIN] Deleta um chefe.
     */
    async deleteBoss(req, res, next) {
        const { id } = req.params;
        try {
            const originalBoss = await prisma.boss.findUnique({ where: { id } });
            if (!originalBoss) {
                return res.status(404).json({ message: 'Chefe não encontrado.' });
            }
            
            // Regra de negócio: não deletar se já houve dano. Apenas desativar.
            const damageLogs = await prisma.auditLog.count({ where: { entity: 'BOSS', entityId: id, action: 'BOSS_DAMAGE' }});
            if (damageLogs > 0) {
                return res.status(400).json({ message: 'Não é possível deletar um chefe que já recebeu dano. Apenas desative-o.' });
            }

            await prisma.boss.delete({ where: { id } });
            await AuditService.log({ userId: req.user.id, action: 'ADMIN_DELETE_BOSS', entity: 'BOSS', entityId: id, details: { before: originalBoss }, ipAddress: req.ip });
            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }
}

export default new BossController();