// backend/src/routes/rankingRoutes.js
import express from 'express';
import rankingController from '../controllers/rankingController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// Rota para buscar o ranking principal
router.get('/', rankingController.getMainRanking);

export default router;
