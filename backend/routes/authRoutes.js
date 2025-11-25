
import express from 'express';
import authController from '../controllers/authController.js';
import validate from '../middlewares/validate.js';
import { registerSchema, loginSchema } from '../validators/authSchema.js';
import authMiddleware from '../middlewares/authMiddleware.js';


const router = express.Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.delete('/account', authMiddleware, authController.deleteAccount);

export default router;
