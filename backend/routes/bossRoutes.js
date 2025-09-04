// backend/src/routes/bossRoutes.js
import express from 'express';
import bossController from '../controllers/bossController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';
import validate from '../middlewares/validate.js';
import { bossSchema } from '../validators/bossSchema.js';


const router = express.Router();

// --- Rotas de Usuário (Públicas ou com Auth normal) ---
router.get('/', authMiddleware, bossController.getActiveBosses);


// --- Rotas de Admin ---
const adminRouter = express.Router();
adminRouter.use(authMiddleware, adminMiddleware); // Protege todas as rotas de admin

adminRouter.get('/', bossController.getAllBosses);
adminRouter.post('/', validate(bossSchema), bossController.createBoss);
adminRouter.patch('/:id', validate(bossSchema), bossController.updateBoss);
adminRouter.delete('/:id', bossController.deleteBoss);

// Monta o sub-roteador de admin sob /admin
router.use('/admin', adminRouter);


export default router;