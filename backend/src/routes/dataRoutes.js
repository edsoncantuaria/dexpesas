// src/routes/dataRoutes.js
import express from 'express';
import dataController from '../controllers/dataController.js';
import categoryController from '../controllers/categoryController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rotas que precisam de autenticação
router.use(authMiddleware);

// Categorias
import subcategoryController from '../controllers/subcategoryController.js';

// Category Routes
router.get('/categories', categoryController.getAllCategories);
router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

// Subcategory Routes
router.get('/categories/:parentId/subcategories', subcategoryController.getSubcategories);
router.post('/categories/:parentId/subcategories', subcategoryController.createSubcategory);
router.put('/subcategories/:id', subcategoryController.updateSubcategory);
router.delete('/subcategories/:id', subcategoryController.deleteSubcategory);

router.get('/achievements/all', dataController.getAllAchievements);

router.get('/gamification/profile', dataController.getGamificationProfile);
// Nova rota para buscar o perfil de um membro específico
router.get('/gamification/profile/:userId', dataController.getGamificationProfile);
router.get('/achievements/unlocked', dataController.getUnlockedAchievements);
router.get('/data/inventory', dataController.getInventory);
router.get('/dashboard/overview', dataController.getFinancialOverview);


export default router;
