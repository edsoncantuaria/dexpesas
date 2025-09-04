
// src/routes/cardRoutes.js
import express from 'express';
import cardController from '../controllers/cardController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import { cardSchema, cardPaymentSchema } from '../validators/cardSchema.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', cardController.getAllCards);
router.get('/:cardId', cardController.getCardById);
router.get('/:cardId/future-installments', cardController.getFutureInstallments);
router.post('/', validate(cardSchema), cardController.createCard);
router.put('/:id', validate(cardSchema), cardController.updateCard);
router.delete('/:id', cardController.deleteCard);
router.post('/:cardId/pay', validate(cardPaymentSchema), cardController.payCardBill);

export default router;
