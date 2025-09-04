// backend/src/routes/gameEventRoutes.js
import express from 'express';
import gameEventController from '../controllers/gameEventController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';
import validate from '../middlewares/validate.js';
import { gameEventSchema } from '../validators/gameEventSchema.js';


const router = express.Router();

// Rota pública para jogadores verem eventos ativos
router.get('/active', authMiddleware, gameEventController.getActiveEvents);

// Rotas de Admin
const adminRouter = express.Router();
adminRouter.use(authMiddleware, adminMiddleware);

adminRouter.get('/', gameEventController.getAllEvents);
adminRouter.post('/', validate(gameEventSchema), gameEventController.createEvent);
adminRouter.patch('/:id', validate(gameEventSchema), gameEventController.updateEvent);
adminRouter.delete('/:id', gameEventController.deleteEvent);

router.use('/admin', adminRouter);

export default router;
