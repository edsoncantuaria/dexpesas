
// src/routes/accountRoutes.js
import express from 'express';
import accountController from '../controllers/accountController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import { accountSchema, transferSchema } from '../validators/accountSchema.js';


const router = express.Router();

router.use(authMiddleware);

router.get('/', accountController.getAllAccounts);
router.post('/', validate(accountSchema), accountController.createAccount);
router.post('/transfer', validate(transferSchema), accountController.transferFunds); // Nova rota de transferência
router.put('/:id', validate(accountSchema), accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

export default router;
