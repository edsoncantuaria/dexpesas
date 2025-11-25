import express from 'express';
import splitBillController from '../controllers/splitBillController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/groups', splitBillController.createGroup);
router.get('/groups', splitBillController.getGroups);
router.get('/groups/:groupId', splitBillController.getGroupDetails);
router.post('/groups/:groupId/members', splitBillController.addMember);
router.post('/groups/:groupId/expenses', splitBillController.createExpense);
router.post('/groups/:groupId/settle', splitBillController.settleDebt);
router.put('/groups/:groupId/expenses/:expenseId', splitBillController.updateExpense);
router.delete('/groups/:groupId/expenses/:expenseId', splitBillController.deleteExpense);
router.delete('/groups/:groupId/settlements/:settlementId', splitBillController.deleteSettlement);
router.get('/groups/:groupId/activity', splitBillController.getGroupActivity);
router.get('/groups/:groupId/export', splitBillController.exportGroupData);

export default router;
