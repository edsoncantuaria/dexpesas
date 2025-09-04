// backend/src/routes/sugestoesRoutes.js
import express from 'express';
import sugestoesController from '../controllers/sugestoesController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// GET /api/sugestoes/transacoes?termo=...&tipo=...
router.get('/transacoes', sugestoesController.getSugestoes);

export default router;
