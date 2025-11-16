// backend/src/routes/healthRoutes.js
import express from 'express';
import healthController from '../controllers/healthController.js';

const router = express.Router();

// Rotas públicas para health e métricas
router.get('/', healthController.check);
router.get('/metrics', healthController.metrics);

export default router;
