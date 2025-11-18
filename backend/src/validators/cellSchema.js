// backend/src/validators/cellSchema.js
import { z } from 'zod';

export const cellSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(255).optional(),
  iconUrl: z.string().url().optional(),
});

export const cellBudgetSchema = z.object({
  categoryId: z.string().optional().nullable(),
  label: z.string().max(100).optional().nullable(),
  type: z.enum(['CELL', 'HYBRID', 'PERSONAL']).optional(),
  splitConfig: z.any().optional(),
  fundId: z.string().optional().nullable(),
  limit: z.number().positive(),
  effectiveFrom: z.string().optional().nullable(),
  effectiveTo: z.string().optional().nullable(),
});

export const cellFundSchema = z.object({
  name: z.string().min(2),
  targetAmount: z.number().positive(),
  usagePolicy: z.any().optional(),
  status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED']).optional(),
  goalDeadline: z.string().optional(),
});

export const cellFundContributionSchema = z.object({
  amount: z.number().positive(),
  source: z.string().optional().nullable(),
  fromBudgetId: z.string().optional().nullable(),
  metadata: z.any().optional(),
});

export const cellSplitRuleSchema = z.object({
  name: z.string().min(2),
  trigger: z.enum(['RECURRING_BILL', 'ADHOC', 'USAGE_BASED']),
  method: z.enum(['EQUAL', 'WEIGHTED', 'CONSUMPTION', 'PAYER_REIMBURSED']),
  weightsConfig: z.any().optional(),
  consumptionMetric: z.string().optional().nullable(),
  autoReimburse: z.boolean().optional(),
  metadata: z.any().optional(),
});

export const cellDecisionSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().nullable(),
  options: z.array(z.string()).optional(),
  threshold: z.any().optional(),
  expiresAt: z.string().optional(),
});

export const cellVoteSchema = z.object({
  vote: z.string().min(1),
});

export const splitEngineSchema = z.object({
  expenseId: z.string(),
  ruleId: z.string().optional().nullable(),
});

export const cellInviteSchema = z.object({
  invitedUserId: z.string().min(1),
  requestedVisibility: z
    .object({
      viewPersonalBudget: z.boolean().optional(),
      viewAccounts: z.boolean().optional(),
      shareDebtSummary: z.boolean().optional(),
    })
    .optional(),
});

export const cellAcceptInviteSchema = z.object({
  sharePersonalBudget: z.boolean().optional(),
  shareAccounts: z.boolean().optional(),
  shareDebtSummary: z.boolean().optional(),
});
