// backend/src/routes/cellRoutes.js
import express from 'express';
import authMiddleware, { requireVerification } from '../middlewares/authMiddleware.js';
import cellController from '../controllers/cellController.js';
import validate from '../middlewares/validate.js';
import {
  cellSchema,
  cellBudgetSchema,
  cellFundSchema,
  cellFundContributionSchema,
  cellSharedAccountSchema,
  cellSplitRuleSchema,
  cellDecisionSchema,
  cellVoteSchema,
  splitEngineSchema,
  cellInviteSchema,
  cellAcceptInviteSchema,
  cellEquilibriumSettlementSchema,
  cellSharedExpenseSchema,
  cellSharedExpenseSettleSchema,
} from '../validators/cellSchema.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireVerification);

router.get('/', cellController.listCells);
router.post('/', validate(cellSchema), cellController.createCell);
router.get('/my-cell', cellController.getMyCell);
router.get('/:cellId', cellController.getCellDetails);
router.patch('/:cellId', validate(cellSchema.partial()), cellController.updateCell);

router.get('/:cellId/budgets', cellController.listBudgets);
router.post('/:cellId/budgets', validate(cellBudgetSchema), cellController.createBudget);
router.patch('/budgets/:budgetId', validate(cellBudgetSchema.partial()), cellController.updateBudget);
router.delete('/budgets/:budgetId', cellController.deleteBudget);

router.get('/:cellId/funds', cellController.listFunds);
router.post('/:cellId/funds', validate(cellFundSchema), cellController.createFund);
router.post('/funds/:fundId/contributions', validate(cellFundContributionSchema), cellController.contributeToFund);
router.delete('/funds/:fundId', cellController.deleteFund);

router.get('/:cellId/shared-accounts', cellController.listSharedAccounts);
router.post('/:cellId/shared-accounts', validate(cellSharedAccountSchema), cellController.linkSharedAccount);
router.delete('/:cellId/shared-accounts/:sharedAccountId', cellController.unlinkSharedAccount);

router.get('/:cellId/split-rules', cellController.listSplitRules);
router.post('/:cellId/split-rules', validate(cellSplitRuleSchema), cellController.createSplitRule);
router.post('/:cellId/split-engine', validate(splitEngineSchema), cellController.runSplitEngine);

router.get('/:cellId/expenses', cellController.listSharedExpenses);
router.post('/:cellId/expenses', validate(cellSharedExpenseSchema), cellController.createSharedExpense);
router.post(
  '/:cellId/expenses/:expenseId/settle',
  validate(cellSharedExpenseSettleSchema),
  cellController.settleSharedExpense,
);
router.delete('/:cellId/expenses/:expenseId', cellController.deleteSharedExpense);

router.get('/:cellId/decisions', cellController.listDecisions);
router.post('/:cellId/decisions', validate(cellDecisionSchema), cellController.createDecision);
router.post('/:cellId/decisions/:decisionId/vote', validate(cellVoteSchema), cellController.voteDecision);

router.get('/:cellId/timeline', cellController.listTimeline);

router.get('/:cellId/equilibrium', cellController.getEquilibrium);
router.post('/:cellId/equilibrium/settlements', validate(cellEquilibriumSettlementSchema), cellController.recordEquilibriumSettlement);

router.get('/:cellId/alerts', cellController.listAlerts);

router.post('/:cellId/invite', validate(cellInviteSchema), cellController.inviteMember);
router.get('/invites/pending', cellController.listPendingInvites);
router.post('/invites/:inviteId/accept', validate(cellAcceptInviteSchema), cellController.acceptInvite);
router.post('/invites/:inviteId/decline', cellController.declineInvite);
router.post('/:cellId/leave', cellController.leaveCell);
router.delete('/:cellId', cellController.deleteCell);

export default router;
