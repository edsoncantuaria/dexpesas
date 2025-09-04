// src/routes/userRoutes.js
import express from 'express';
import userController from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', userController.getUser);
router.put('/profile', userController.updateProfile);
router.put('/preferences', userController.updatePreferences);
router.put('/account-info', userController.updateAccountInfo);
router.post('/change-password', userController.changePassword);
router.patch('/achievements/:achievementId', userController.toggleAchievementHighlight); // Nova rota

// Rota para marcar o onboarding como concluído
router.post('/complete-onboarding', userController.completeOnboarding);


export default router;
