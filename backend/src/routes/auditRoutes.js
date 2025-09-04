// backend/src/routes/auditRoutes.js
import express from 'express';
import auditController from '../controllers/auditController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// Rota para buscar os logs de auditoria do usuário com paginação
router.get('/', auditController.getLogs);

// Nova rota para a timeline de gamificação
router.get('/timeline', auditController.getTimelineLogs);


export default router;
