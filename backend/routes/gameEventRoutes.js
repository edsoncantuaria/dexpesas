
// backend/src/routes/gameEventRoutes.js
import express from 'express';
import gameEventController from '../controllers/gameEventController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();

// Rota pública para jogadores verem eventos ativos
router.get('/active', authMiddleware, gameEventController.getActiveEvents);

// Rotas de Admin
const adminRouter = express.Router();
adminRouter.use(authMiddleware, adminMiddleware);

adminRouter.get('/', gameEventController.getAllEvents);
adminRouter.post('/', gameEventController.createEvent);
adminRouter.patch('/:id', gameEventController.updateEvent);
adminRouter.delete('/:id', gameEventController.deleteEvent);

router.use('/admin', adminRouter);

export default router;

