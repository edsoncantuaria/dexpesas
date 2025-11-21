
// src/routes/userRoutes.js
import express from 'express';
import userController from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import { updateProfileSchema, updatePreferencesSchema, updateAccountInfoSchema, changePasswordSchema, updateSecuritySchema } from '../validators/userSchema.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', userController.getUser);
router.get('/lookup', userController.lookupUser);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.put('/preferences', validate(updatePreferencesSchema), userController.updatePreferences);
router.put('/account-info', validate(updateAccountInfoSchema), userController.updateAccountInfo);
router.post('/change-password', validate(changePasswordSchema), userController.changePassword);
router.put('/security', validate(updateSecuritySchema), userController.updateSecuritySettings);

// Rota para marcar o onboarding como concluído
router.post('/complete-onboarding', userController.completeOnboarding);

// Nova rota para buscar as "ruínas" de um usuário
router.get('/legacy-ruins', userController.getLegacyRuins);

// Rota para destacar/remover destaque de uma conquista
router.patch('/achievements/:achievementId', userController.toggleAchievementHighlight);

export default router;


