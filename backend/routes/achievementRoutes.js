// backend/src/routes/achievementRoutes.js
import express from 'express';
import achievementController from '../controllers/achievementController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';
import validate from '../middlewares/validate.js';
import { achievementSchema } from '../validators/achievementSchema.js';

const router = express.Router();

// Rota pública para listar todas as conquistas
router.get('/', achievementController.getAllAchievements);

// Rotas de administração protegidas
router.post('/', authMiddleware, adminMiddleware, validate(achievementSchema), achievementController.createAchievement);
router.patch('/:id', authMiddleware, adminMiddleware, validate(achievementSchema), achievementController.updateAchievement);
router.delete('/:id', authMiddleware, adminMiddleware, achievementController.deleteAchievement);

export default router;
