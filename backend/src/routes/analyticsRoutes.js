// backend/src/routes/analyticsRoutes.js
import express from 'express';
import analyticsController from '../controllers/analyticsController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/net-worth-history', analyticsController.getNetWorthHistory);
router.get('/insights', analyticsController.getInsights);
router.post('/generate-pdf', analyticsController.generatePDF);

export default router;
