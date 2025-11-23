// backend/src/controllers/auditController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
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

        // Filtros
        const { entity, action, startDate, endDate, search } = req.query;

        const where = { userId };

        if (entity) {
            where.entity = entity;
        }

        if (action) {
            where.action = action;
        }

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        if (search) {
            where.OR = [
                { entityId: { contains: search, mode: 'insensitive' } },
                { details: { path: ['description'], string_contains: search } } // Exemplo hipotético se details for JSONB
                // Nota: Busca em JSONB pode variar dependendo do banco. 
                // Vamos simplificar buscando apenas por ID ou Action se search for fornecido
            ];
            // Se o banco não suportar busca profunda em JSON facilmente via Prisma sem raw query,
            // podemos focar em campos de texto plano ou assumir que 'search' é para IDs/Tipos por enquanto.
            // Ajuste: Vamos buscar no entityId e action por enquanto.
            delete where.OR; // Resetando para evitar erro se details não for buscável assim
            where.AND = [
                {
                    OR: [
                        { entityId: { contains: search, mode: 'insensitive' } },
                        { action: { contains: search, mode: 'insensitive' } },
                        { entity: { contains: search, mode: 'insensitive' } }
                    ]
                }
            ];
        }

        try {
            const [logs, total] = await prisma.$transaction([
                prisma.auditLog.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.auditLog.count({ where }),
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
