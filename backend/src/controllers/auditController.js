// backend/src/controllers/auditController.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

class AuditController {
    /**
     * Busca os logs de auditoria para o usuário logado, com paginação.
     */
    async getLogs(req, res, next) {
        const userId = req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;

        try {
            const [logs, total] = await prisma.$transaction([
                prisma.auditLog.findMany({
                    where: { userId },
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.auditLog.count({ where: { userId } }),
            ]);

            res.json({
                data: logs,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * Busca uma lista filtrada de logs para a timeline de gamificação.
     */
    async getTimelineLogs(req, res, next) {
        const userId = req.user.id;
        const limit = parseInt(req.query.limit, 10) || 10;
        
        const relevantActions = [
            'ACCEPT_MISSION',
            'COMPLETE_MISSION',
            'BOSS_DAMAGE',
            'LEVEL_UP', 
        ];

        try {
            const logs = await prisma.auditLog.findMany({
                where: { 
                    userId,
                    action: { in: relevantActions },
                },
                take: limit,
                orderBy: { createdAt: 'desc' },
            });
            res.json(logs);
        } catch (error) {
            next(error);
        }
    }
}

export default new AuditController();
