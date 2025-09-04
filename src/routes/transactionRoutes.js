// src/routes/transactionRoutes.js
import express from 'express';
import transactionController from '../controllers/transactionController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', transactionController.getTransactions);
router.post('/export', transactionController.exportTransactions); // Novo
router.post('/', transactionController.createTransaction);
router.post('/create-from-import', transactionController.createFromImported); 
router.put('/:id', transactionController.updateTransaction);
router.delete('/:id', transactionController.deleteTransaction);
router.patch('/:id/toggle-paid', transactionController.togglePaidStatus);

export default router;
