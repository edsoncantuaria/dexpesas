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
import clanRoutes from './routes/clanRoutes.js';
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

const app = express();

// Middlewares
app.use(cors({
    origin: true,
    credentials: true
}));
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
app.use('/api/familia', clanRoutes);
app.use('/api/missions', missionRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/bosses', bossRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/events', gameEventRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/audit', auditRoutes); 
app.use('/api/tags', tagRoutes);
app.use('/api/sugestoes', sugestoesRoutes);
app.use('/api', dataRoutes);
app.use('/api/health', healthRoutes);

// Middleware de tratamento de erros
app.use(errorHandler);

export default app;
