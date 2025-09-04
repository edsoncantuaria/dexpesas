
// src/routes/dataRoutes.js
import express from 'express';
import dataController from '../controllers/dataController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/categories', dataController.getAllCategories);
router.get('/achievements/all', dataController.getAllAchievements);

// Rotas que precisam de autenticação
router.use(authMiddleware);

router.get('/gamification/profile', dataController.getGamificationProfile);
// Nova rota para buscar o perfil de um membro específico
router.get('/gamification/profile/:userId', dataController.getGamificationProfile);
router.get('/achievements/unlocked', dataController.getUnlockedAchievements);
router.get('/data/inventory', dataController.getInventory);


export default router;

    