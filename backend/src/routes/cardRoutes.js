// src/routes/cardRoutes.js
import express from 'express';
import multer from 'multer';
import cardController from '../controllers/cardController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import { cardSchema, cardPaymentSchema } from '../validators/cardSchema.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);

// Invoice Reconciliation Routes
router.post('/:cardId/invoice/reconcile', upload.single('file'), cardController.uploadInvoiceStatement);
router.get('/:cardId/invoice/reconciliation-status', cardController.getInvoiceReconciliationStatus);
router.post('/:cardId/invoice/finalize-reconciliation', cardController.finalizeInvoiceReconciliation);
router.delete('/:cardId/invoice/cancel-reconciliation/:reconciliationId', cardController.cancelInvoiceReconciliation);

// Analytics Routes
router.get('/:cardId/analytics/spending', cardController.getSpendingAnalysis);
router.get('/:cardId/analytics/history', cardController.getMonthlyHistory);
router.get('/:cardId/analytics/projection', cardController.getInvoiceProjection);

// Cashback Routes
router.get('/:cardId/cashback', cardController.getCashbackSummary);
router.get('/:cardId/cashback/analytics', cardController.getCashbackAnalytics);
router.post('/:cardId/cashback/redeem', cardController.redeemCashback);

// Card Alerts Routes (specific card)
router.get('/:cardId/alerts', cardController.getAlertsByCard);

// Card Routes
router.get('/', cardController.getAllCards);
router.get('/:cardId', cardController.getCardById);
router.get('/:cardId/invoices/history', cardController.getInvoiceHistory);
router.get('/:cardId/invoice/pdf', cardController.generateInvoicePDF);
router.get('/:cardId/future-installments', cardController.getFutureInstallments);
router.post('/', validate(cardSchema), cardController.createCard);
router.put('/:id', validate(cardSchema), cardController.updateCard);
router.delete('/:id', cardController.deleteCard);
router.post('/:cardId/pay', validate(cardPaymentSchema), cardController.payCardBill);

export default router;

