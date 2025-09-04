// backend/src/controllers/rankingController.js
import prisma from '../config/prismaClient.js';

class RankingController {

    /**
     * Busca os jogadores com maior nível de XP para o ranking principal.
     */
    async getMainRanking(req, res, next) {
        try {
            const topPlayers = await prisma.user.findMany({
                orderBy: [
                    { level: 'desc' },
                    { xp: 'desc' },
                ],
                take: 100, // Limita aos 100 melhores
                select: {
                    id: true,
                    name: true,
                    avatarUrl: true,
                    level: true,
                    xp: true,
                    heroClass: true,
                },
            });
            res.json(topPlayers);
        } catch (error) {
            next(error);
        }
    }
}

export default new RankingController();
