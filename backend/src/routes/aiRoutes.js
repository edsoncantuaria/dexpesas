// backend/src/routes/aiRoutes.js
import express from 'express';
import aiController from '../controllers/aiController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rota para a cotação não precisa de autenticação se for genérica
router.get('/inspirational-quote', aiController.getInspirationalQuote);

// As outras rotas de IA exigem autenticação para ter o contexto do usuário
router.use(authMiddleware);

// Rota para sugerir categoria para uma transação
router.post('/suggest-category', aiController.suggestCategory);
router.post('/suggest-budget', aiController.suggestBudget); 

router.post('/search-transactions', aiController.searchTransactions);
router.post('/analyze-habits', aiController.analyzeHabits);
router.post('/analyze-opportunities', aiController.analyzeOpportunities);
router.post('/scan-receipt', aiController.scanReceipt); 
router.post('/daily-summary', aiController.getDailySummary); 

// Rota para projeção de metas
router.post('/project-goal', aiController.getGoalProjection);

export default router;

    