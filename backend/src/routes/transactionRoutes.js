// src/routes/transactionRoutes.js
import express from 'express';
import transactionController from '../controllers/transactionController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import { transactionSchema } from '../validators/transactionSchema.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/summary', transactionController.getMonthlySummary);
router.get('/future-installments/summary', transactionController.getFutureInstallmentsSummary);
router.get('/', transactionController.getTransactions);
router.post('/export', transactionController.exportTransactions);

// Aplica o middleware de validação antes do controller
router.post('/', validate(transactionSchema), transactionController.createTransaction);
router.put('/:id/toggle-paid', transactionController.togglePaidStatus);
router.post('/installments/:id/cancel-series', transactionController.cancelRecurringSeries);
router.post('/installments/:id/pay-early', transactionController.anticipateInstallment);
router.put('/:id', validate(transactionSchema), transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);
router.get('/:id/installment-candidates', authMiddleware, (req, res) => transactionController.getInstallmentCandidates(req, res));
router.post('/:id/link-installments', authMiddleware, (req, res) => transactionController.linkInstallments(req, res));
router.patch('/:id/toggle-paid-status', authMiddleware, (req, res) => transactionController.togglePaidStatus(req, res));

export default router;
