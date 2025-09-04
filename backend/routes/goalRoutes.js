
// backend/src/routes/goalRoutes.js
import express from 'express';
import goalController from '../controllers/goalController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import { goalSchema, contributionSchema, finalizeGoalSchema, rescueGoalSchema } from '../validators/goalSchema.js';


const router = express.Router();

router.use(authMiddleware);

router.get('/', goalController.getGoals);
router.post('/', validate(goalSchema), goalController.createGoal);
router.patch('/:id', validate(goalSchema), goalController.updateGoal);
router.delete('/:id', goalController.deleteGoal);

router.get('/:goalId/contributions', goalController.getGoalContributions);
router.post('/:goalId/contributions', validate(contributionSchema), goalController.addContribution);
router.post('/:goalId/finalize', validate(finalizeGoalSchema), goalController.finalizeGoal);
router.post('/:goalId/rescue', validate(rescueGoalSchema), goalController.rescueGoal);

export default router;
