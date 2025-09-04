// backend/src/middlewares/adminMiddleware.js
import prisma from '../config/prismaClient.js';

/**
 * Middleware para verificar se o usuário autenticado é um administrador.
 * Deve ser usado DEPOIS do authMiddleware.
 */
const adminMiddleware = async (req, res, next) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Autenticação necessária.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { isAdmin: true }
        });

        if (!user || !user.isAdmin) {
            return res.status(403).json({ message: 'Acesso negado. Requer permissão de administrador.' });
        }

        // Se o usuário é admin, prossegue para a próxima função na rota.
        next();

    } catch (error) {
        console.error("Erro no middleware de admin:", error);
        res.status(500).json({ message: 'Erro interno ao verificar permissões de administrador.' });
    }
};

export default adminMiddleware;
