// backend/src/routes/budgetRoutes.js
import express from 'express';
import budgetController from '../controllers/budgetController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// Rota para buscar os orçamentos de um mês (ex: /api/budgets?month=2024-08)
router.get('/', budgetController.getBudgets);
// Rota para criar um novo orçamento
router.post('/', budgetController.createBudget);
// Rota para atualizar um orçamento existente
router.patch('/:id', budgetController.updateBudget);
// Rota para deletar um orçamento
router.delete('/:id', budgetController.deleteBudget);

export default router;
