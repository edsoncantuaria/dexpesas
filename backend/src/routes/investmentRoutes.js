// backend/src/routes/investmentRoutes.js
import express from 'express';
import authMiddleware, { requireVerification } from '../middlewares/authMiddleware.js';
import investmentController from '../controllers/investmentController.js';
import validate from '../middlewares/validate.js';
import { investmentPlanSchema, investmentContributionSchema, investmentHoldingSchema } from '../validators/investmentSchema.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireVerification);

router.get('/plan', investmentController.getPlan);
router.post('/plan', investmentController.upsertPlan);
router.post('/onboarding', investmentController.startOnboarding);
router.post('/contributions', investmentController.createContribution);
router.get('/performance', investmentController.getPerformance);
router.get('/holdings', investmentController.getHoldings);
router.post('/holdings', investmentController.createHolding);
router.patch('/holdings/:id', investmentController.updateHolding);
router.delete('/holdings/:id', investmentController.deleteHolding);
router.get('/metrics', investmentController.getMetrics);

export default router;
