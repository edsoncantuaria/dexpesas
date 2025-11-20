// src/routes/accountRoutes.js
import express from 'express';
import accountController from '../controllers/accountController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', accountController.getAllAccounts);
router.post('/', accountController.createAccount);
router.post('/transfer', accountController.transferFunds); // Nova rota de transferência
router.put('/:id', accountController.updateAccount);
router.patch('/:id', accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

export default router;
