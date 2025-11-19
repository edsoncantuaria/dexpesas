// backend/src/controllers/sugestoesController.js
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import SugestoesService from '../services/sugestoesService.js';

const prisma = new PrismaClient();

class SugestoesController {
    /**
     * Busca sugestões de transações com base em um termo de busca, tipo e valor opcional.
     */
    async getSugestoes(req, res, next) {
        const { termo, tipo, valor, limite = '10' } = req.query;
        const userId = req.user.id;
        const parsedLimite = parseInt(limite, 10);

        if (!termo || !tipo) {
            return res.status(400).json({ message: 'Os parâmetros "termo" e "tipo" são obrigatórios.' });
        }

        if (isNaN(parsedLimite) || parsedLimite < 1 || parsedLimite > 20) {
            return res.status(400).json({ message: 'O parâmetro "limite" deve ser um número entre 1 e 20.' });
        }

        try {
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || !user.habilitarDescricaoInteligente) {
                return res.json({ itens: [], latenciaMs: 0 });
            }

            const startTime = process.hrtime();
            const sugestoes = await SugestoesService.getSugestoesTransacao({
                userId,
                termo,
                tipo,
                valor: valor ? parseFloat(valor) : undefined,
                limite: parsedLimite,
            });
            const endTime = process.hrtime(startTime);
            const latenciaMs = (endTime[0] * 1000 + endTime[1] / 1000000).toFixed(2);

            res.json({ itens: sugestoes, latenciaMs: parseFloat(latenciaMs) });

        } catch (error) {
            next(error);
        }
    }
}

export default new SugestoesController();
