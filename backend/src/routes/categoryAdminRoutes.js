// backend/src/routes/categoryAdminRoutes.js
import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';
import categoryMaintenanceController from '../controllers/categoryMaintenanceController.js';

const router = Router();

router.post(
  '/reset',
  authMiddleware,
  adminMiddleware,
  categoryMaintenanceController.resetCategories
);

export default router;
