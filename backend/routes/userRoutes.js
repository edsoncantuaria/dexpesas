
// src/routes/userRoutes.js
import express from 'express';
import userController from '../controllers/userController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import { updateProfileSchema, updatePreferencesSchema, updateAccountInfoSchema, changePasswordSchema } from '../validators/userSchema.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', userController.getUser);
router.put('/profile', validate(updateProfileSchema), userController.updateProfile);
router.put('/preferences', validate(updatePreferencesSchema), userController.updatePreferences);
router.put('/account-info', validate(updateAccountInfoSchema), userController.updateAccountInfo);
router.post('/change-password', validate(changePasswordSchema), userController.changePassword);

// Rota para marcar o onboarding como concluído
router.post('/complete-onboarding', userController.completeOnboarding);


export default router;
