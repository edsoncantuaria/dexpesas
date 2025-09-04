// backend/src/routes/clanRoutes.js
import express from 'express';
import clanController from '../controllers/clanController.js';
import authMiddleware from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import { clanSchema, clanInviteSchema, clanPolicySchema, clanContributionSchema, clanExpenseSchema, clanGoalSchema, splitExpenseSchema } from '../validators/clanSchema.js';

const router = express.Router();

router.use(authMiddleware);

// --- Rotas de Clã ---
router.get('/', clanController.listClans);
router.post('/', validate(clanSchema), clanController.createClan);
router.get('/invites/pending', clanController.getPendingInvites);
router.get('/:clanId', clanController.getClanDetails);
router.patch('/:clanId', validate(clanSchema), clanController.updateClan);
router.delete('/:clanId', clanController.deleteClan);

// --- Rotas de Finanças ---
router.post('/:clanId/contribute', validate(clanContributionSchema), clanController.contributeToClanBank);
router.post('/:clanId/expense', validate(clanExpenseSchema), clanController.createClanExpense);
router.post('/:clanId/split-expense', validate(splitExpenseSchema), clanController.splitExpense);
router.get('/:clanId/shared-expenses', clanController.getClanSharedExpenses);
router.get('/:clanId/activity', clanController.getClanActivity);
router.post('/:clanId/expense/:auditLogId/reverse', clanController.reverseClanExpense);

// --- Rotas de Metas ---
router.get('/:clanId/goals', clanController.getClanGoals);
router.post('/:clanId/goals', validate(clanGoalSchema), clanController.createClanGoal);
router.post('/:clanId/goals/:goalId/contribute', validate(clanContributionSchema), clanController.contributeToClanGoal);

// --- Gerenciamento de Membros e Convites ---
router.post('/:clanId/invite', validate(clanInviteSchema), clanController.inviteMember);
router.post('/invites/:inviteId/accept', clanController.acceptInvite);
router.post('/invites/:inviteId/decline', clanController.declineInvite);
router.post('/:clanId/leave', clanController.leaveClan);
router.delete('/:clanId/members/:userId', clanController.removeMember);
router.patch('/:clanId/members/:userId/role', clanController.updateMemberRole);
router.post('/:clanId/transfer-leadership', clanController.transferLeadership);

// --- Políticas (se implementado) ---
router.patch('/:clanId/policies', validate(clanPolicySchema), clanController.updatePolicies);
router.get('/:clanId/export', clanController.exportClanReport);


export default router;
