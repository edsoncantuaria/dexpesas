
// backend/src/routes/itemRoutes.js
import express from 'express';
import itemController from '../controllers/itemController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';
import validate from '../middlewares/validate.js';
import { itemSchema } from '../validators/itemSchema.js';

const router = express.Router();

// Rota pública para o frontend listar itens disponíveis como recompensa, etc.
router.get('/', itemController.getAllItems);

// Rota para o usuário equipar um item - requer apenas autenticação
router.post('/equip/:userItemId', authMiddleware, itemController.equipItem);

// Rotas de administração protegidas
const adminRouter = express.Router();
adminRouter.use(authMiddleware, adminMiddleware);

adminRouter.post('/', validate(itemSchema), itemController.createItem);
adminRouter.patch('/:id', validate(itemSchema), itemController.updateItem);
adminRouter.delete('/:id', itemController.deleteItem);

router.use('/admin', adminRouter);

export default router;

