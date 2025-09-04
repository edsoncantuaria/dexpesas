// backend/src/routes/missionRoutes.js
import express from 'express';
import missionController from '../controllers/missionController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js'; // Novo
import validate from '../middlewares/validate.js'; // Novo
import { missionSchema } from '../validators/missionSchema.js'; // Novo

const router = express.Router();

// --- Rotas de Usuário ---
router.use(authMiddleware);

router.get('/available', missionController.getAvailableMissions);
router.get('/my-missions', missionController.getMyMissions);
router.get('/guild', missionController.getGuildMissions); // Rota para missões da guilda
router.post('/accept', missionController.acceptMission);

// --- Rotas de Admin ---
const adminRouter = express.Router();
adminRouter.use(authMiddleware, adminMiddleware); // Protege todas as rotas de admin

adminRouter.post('/', validate(missionSchema), missionController.createMission);
adminRouter.patch('/:id', validate(missionSchema), missionController.updateMission);
adminRouter.delete('/:id', missionController.deleteMission);

// Monta o sub-roteador de admin sob /admin
router.use('/admin', adminRouter);


export default router;
