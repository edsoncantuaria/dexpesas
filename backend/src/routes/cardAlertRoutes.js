// backend/src/routes/cardAlertRoutes.js
import express from 'express';
import cardAlertController from '../controllers/cardAlertController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// Gerenciamento de alerts
router.get('/', cardAlertController.getAllAlerts);
router.post('/check', cardAlertController.triggerManualCheck);
router.patch('/:alertId/read', cardAlertController.markAsRead);
router.delete('/:alertId', cardAlertController.dismissAlert);

export default router;
