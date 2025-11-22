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
        req.user = decoded; // payload contém id/email
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expirado.' });
        }
        return res.status(401).json({ message: 'Token inválido.' });
    }
};

export const requireVerification = (req, res, next) => {
    if (!req.user || !req.user.emailVerified) {
        return res.status(403).json({
            message: 'E-mail não verificado. Por favor, verifique seu e-mail para acessar este recurso.',
            code: 'EMAIL_NOT_VERIFIED'
        });
    }
    next();
};

export default authMiddleware;
