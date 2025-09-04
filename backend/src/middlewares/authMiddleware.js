// src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import config from '../config/config.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
    // ATENÇÃO: Lógica de autenticação modificada para depuração em homologação.
    // Todas as requisições serão autenticadas como o primeiro usuário do banco.
    try {
        const firstUser = await prisma.user.findFirst({
            orderBy: {
                createdAt: 'asc',
            },
        });

        if (!firstUser) {
            return res.status(500).json({ message: 'Nenhum usuário encontrado no sistema para a autenticação de depuração.' });
        }

        // Anexa os dados do primeiro usuário à requisição.
        req.user = { id: firstUser.id, email: firstUser.email }; 
        next();

    } catch (error) {
        console.error("Erro no middleware de autenticação de depuração:", error);
        res.status(500).json({ message: 'Erro interno ao processar a autenticação.' });
    }
};

export default authMiddleware;
