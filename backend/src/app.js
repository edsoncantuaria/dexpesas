// src/app.js
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import cardRoutes from './routes/cardRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import dataRoutes from './routes/dataRoutes.js';
import userRoutes from './routes/userRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import goalRoutes from './routes/goalRoutes.js';
import automationRoutes from './routes/automationRoutes.js';
import categorizationRuleRoutes from './routes/categorizationRuleRoutes.js';
import storageRoutes from './routes/storageRoutes.js';
import reconciliationRoutes from './routes/reconciliationRoutes.js';
import cellRoutes from './routes/cellRoutes.js';
import missionRoutes from './routes/missionRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import bossRoutes from './routes/bossRoutes.js';
import rankingRoutes from './routes/rankingRoutes.js';
import gameEventRoutes from './routes/gameEventRoutes.js';
import auditRoutes from './routes/auditRoutes.js'; 
import tagRoutes from './routes/tagRoutes.js';
import sugestoesRoutes from './routes/sugestoesRoutes.js';
import errorHandler from './middlewares/errorHandler.js';
import achievementRoutes from './routes/achievementRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import requestMetrics from './middlewares/requestMetrics.js';
import categoryAdminRoutes from './routes/categoryAdminRoutes.js';
import investmentRoutes from './routes/investmentRoutes.js';

const app = express();

const defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:9004',
    'https://dexpesas.cloudive.com.br',
    'https://app.dexpesas.cloudive.com.br',
];
const envAllowedOrigins = process.env.CORS_ALLOWED_ORIGINS
    ? process.env.CORS_ALLOWED_ORIGINS.split(',')
        .map((origin) => origin.trim())
        .filter(Boolean)
    : [];
const allowedOrigins = envAllowedOrigins.length ? envAllowedOrigins : defaultAllowedOrigins;
const isOriginAllowed = (origin = '') => {
    if (!origin) return true;
    return allowedOrigins.some((allowed) => {
        if (allowed === '*') return true;
        if (allowed.startsWith('*.')) {
            const domain = allowed.slice(1); // remove leading dot
            return origin.endsWith(domain);
        }
        return allowed === origin;
    });
};
const corsOptions = {
    origin(origin, callback) {
        if (isOriginAllowed(origin)) {
            return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} não permitido pelo CORS`));
    },
    credentials: true,
    optionsSuccessStatus: 204,
};

// Middlewares
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// Aumenta o limite do corpo da requisição para aceitar imagens em Base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(requestMetrics);


// Rotas da API
app.get('/api', (req, res) => {
    res.json({ message: 'Bem-vindo à API do Dexpesas!' });
});

app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/user', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/rules/categorization', categorizationRuleRoutes);
app.use('/api/storage', storageRoutes);
app.use('/api/reconcile', reconciliationRoutes);
app.use('/api/familia', cellRoutes);
app.use('/api/cells', cellRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/bosses', bossRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/events', gameEventRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/audit', auditRoutes); 
app.use('/api/tags', tagRoutes);
app.use('/api/sugestoes', sugestoesRoutes);
app.use('/api/admin/categories', categoryAdminRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api', dataRoutes);
app.use('/api/health', healthRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

export default app;
