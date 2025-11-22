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
router.post('/create-from-import', transactionController.createFromImported);

router.put('/:id', validate(transactionSchema), transactionController.updateTransaction);

router.delete('/:id', transactionController.deleteTransaction);
router.patch('/:id/toggle-paid', transactionController.togglePaidStatus);

export default router;
