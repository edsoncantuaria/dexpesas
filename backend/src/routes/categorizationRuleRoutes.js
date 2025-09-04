// backend/src/routes/categorizationRuleRoutes.js
import express from 'express';
import categorizationRuleController from '../controllers/categorizationRuleController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', categorizationRuleController.getRules);
router.post('/', categorizationRuleController.createRule);

// Nova rota para deletar todas as regras
router.delete('/', categorizationRuleController.deleteAllRules);

router.delete('/:id', categorizationRuleController.deleteRule);

export default router;
