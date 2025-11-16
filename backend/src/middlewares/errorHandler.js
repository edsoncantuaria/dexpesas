// src/middlewares/errorHandler.js
import MetricsService from '../services/metricsService.js';

const errorHandler = (err, req, res, next) => {
    // Log completo do erro no console do servidor para depuração
    console.error('❌ Ocorreu um erro:', err);
    MetricsService.recordError();

    // Identifica erros conhecidos do Prisma
    if (err.name === 'PrismaClientKnownRequestError') {
        if (err.code === 'P2025') {
            // "Record to update/delete does not exist"
            return res.status(404).json({ message: 'O registro solicitado não foi encontrado.' });
        }
    }

    // Se o erro tiver um statusCode definido (erros de negócio tratados nos controllers), use-o
    if (err.statusCode) {
        return res.status(err.statusCode).json({ message: err.message });
    }
    
    // Para todos os outros erros, envia uma resposta genérica para o cliente
    res.status(500).json({
        message: 'Ocorreu um erro interno no servidor.',
        // Em desenvolvimento, podemos enviar mais detalhes do erro
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
};

export default errorHandler;
