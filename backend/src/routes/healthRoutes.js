// backend/src/routes/healthRoutes.js
import express from 'express';
import healthController from '../controllers/healthController.js';

const router = express.Router();

// Rota pública, não precisa de authMiddleware
router.get('/', healthController.check);

export default router;
