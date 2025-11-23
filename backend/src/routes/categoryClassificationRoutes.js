// backend/src/routes/categoryClassificationRoutes.js
import { Router } from 'express';
import CategoryClassificationController from '../controllers/categoryClassificationController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import {
    categoryClassificationSchema,
    bulkCategoryClassificationSchema,
} from '../validators/categoryClassificationSchema.js';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// GET /api/category-classifications - Listar todas
router.get('/', CategoryClassificationController.getAll);

// GET /api/category-classifications/statistics - Estatísticas
router.get('/statistics', CategoryClassificationController.getStatistics);

// POST /api/category-classifications/initialize - Inicializar padrões
router.post('/initialize', CategoryClassificationController.initialize);

// POST /api/category-classifications/reset - Resetar para padrões
router.post('/reset', CategoryClassificationController.reset);

// POST /api/category-classifications/bulk - Atualizar múltiplas
router.post('/bulk', validate(bulkCategoryClassificationSchema), CategoryClassificationController.bulkUpdate);

// GET /api/category-classifications/:categoryId - Obter uma
router.get('/:categoryId', CategoryClassificationController.getOne);

// PUT /api/category-classifications/:categoryId - Atualizar uma
router.put('/:categoryId', validate(categoryClassificationSchema), CategoryClassificationController.update);

// DELETE /api/category-classifications/:categoryId - Remover uma
router.delete('/:categoryId', CategoryClassificationController.delete);

export default router;
