// backend/src/routes/automationRoutes.js
import express from 'express';
import automationController from '../controllers/automationController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// Rota para buscar automações (Round-up)
router.get('/', automationController.getAutomations);

// Rota para buscar despesas recorrentes para o Bill Pay
router.get('/bill-pay-candidates', automationController.getRecurringExpensesForBillPay);

// Rota para atualizar uma automação (ativar/desativar, configurar)
// O :type aqui é 'ROUND_UP' ou 'GOAL_CONTRIBUTION' ou 'BILL_PAY'
router.patch('/:type', automationController.updateAutomation);

// Rota para rodar uma automação manualmente (para fins de teste/botão na UI)
router.post('/:type/run', automationController.runAutomation);


export default router;
