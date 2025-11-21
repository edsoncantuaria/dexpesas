import express from 'express';
import achievementController from '../controllers/achievementController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import adminMiddleware from '../middlewares/adminMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

// Public Routes
router.get('/', achievementController.getAllAchievements);
router.get('/unlocked', achievementController.getUnlockedAchievements);

// Admin Routes
const adminRouter = express.Router();
adminRouter.use(adminMiddleware);

adminRouter.post('/', achievementController.createAchievement);
adminRouter.patch('/:id', achievementController.updateAchievement);
adminRouter.delete('/:id', achievementController.deleteAchievement);

router.use('/admin', adminRouter);

export default router;
