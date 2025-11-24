import express from 'express';
import debtController from '../controllers/debtController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', debtController.create);
router.get('/', debtController.list);
router.get('/summary', debtController.list); // For now, summary just lists debts, can be enhanced
router.get('/analytics', debtController.getAnalytics);
router.get('/:id', debtController.get);
router.put('/:id', debtController.update);
router.delete('/:id', debtController.delete);

router.post('/:id/payments', debtController.recordPayment);
router.post('/:id/adjustments', debtController.recordAdjustment);
router.get('/:id/payment-history', debtController.getPaymentHistory);
router.get('/trends', debtController.getTrends);
router.get('/recommendations', debtController.getRecommendations);
router.post('/simulate', debtController.simulateScenarios);
router.post('/calculate-plan', debtController.calculatePlan);

export default router;
