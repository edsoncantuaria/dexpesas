// src/middlewares/authMiddleware.js
import jwt from 'jsonwebtoken';
import config from '../config/config.js';

const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded; // Adiciona o payload do token (ex: { id, email }) à requisição
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado.' });
        }
        return res.status(401).json({ message: 'Token inválido.' });
    }
};

export default authMiddleware;
