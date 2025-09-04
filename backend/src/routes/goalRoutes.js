// backend/src/routes/goalRoutes.js
import express from 'express';
import goalController from '../controllers/goalController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', goalController.getGoals);
router.post('/', goalController.createGoal);
router.patch('/:id', goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);

router.get('/:goalId/contributions', goalController.getGoalContributions);
router.post('/:goalId/contributions', goalController.addContribution);
router.post('/:goalId/finalize', goalController.finalizeGoal);
router.post('/:goalId/rescue', goalController.rescueGoal);

export default router;
