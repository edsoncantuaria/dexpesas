// backend/src/validators/cellSchema.js
import { z } from 'zod';

export const cellSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(255).optional(),
  iconUrl: z.string().max(255).optional().nullable(),
});

export const cellBudgetSchema = z.object({
  categoryId: z.string().optional().nullable(),
  label: z.string().max(100).optional().nullable(),
  type: z.enum(['CELL', 'HYBRID', 'PERSONAL']).optional(),
  recurrenceType: z.enum(['MONTHLY', 'WEEKLY', 'BIWEEKLY', 'CUSTOM']).optional(),
  recurrenceDays: z.number().min(1).max(90).optional().nullable(),
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
  custodianId: z.string().optional().nullable(),
  custodianAccountLabel: z.string().max(120).optional().nullable(),
  depositInstructions: z
    .object({
      channel: z.enum(['CELL_ACCOUNT', 'CUSTODIAN', 'MANUAL']),
      referenceLabel: z.string().max(140).optional().nullable(),
      notes: z.string().max(280).optional().nullable(),
    })
    .optional()
    .nullable(),
  withdrawalRoles: z
    .array(z.enum(['LEADER', 'ADMIN', 'MEMBER']))
    .min(1, 'Selecione pelo menos um papel autorizado')
    .optional(),
  mirrorToCustodian: z.boolean().optional(),
});

export const cellFundContributionSchema = z.object({
  amount: z.number().refine((value) => Number.isFinite(value) && value !== 0, {
    message: 'Informe um valor válido.',
  }),
  accountId: z.string().min(1, 'Selecione a conta utilizada.'),
  source: z.string().optional().nullable(),
  fromBudgetId: z.string().optional().nullable(),
  metadata: z.any().optional(),
});

export const cellEquilibriumSettlementSchema = z.object({
  counterpartId: z.string().min(1),
  amount: z.number().positive(),
  direction: z.enum(['PAY', 'RECEIVE']),
  notes: z.string().max(280).optional().nullable(),
});

export const cellSharedExpenseSchema = z.object({
  description: z.string().min(2),
  categoryId: z.string().min(1),
  totalAmount: z.number().positive(),
  splitMethod: z.enum(['EQUAL', 'PERCENTAGE', 'AMOUNT']).optional(),
  splits: z
    .array(
      z.object({
        memberId: z.string().min(1),
        amount: z.number().positive(),
      }),
    )
    .min(1, 'Informe os participantes do rateio.'),
});

export const cellSharedExpenseSettleSchema = z.object({
  participantId: z.string().min(1),
  accountId: z.string().min(1),
});

export const cellSharedAccountSchema = z
  .object({
    accountId: z.string().min(1),
    visibility: z.enum(['MEMBERS', 'ADMINS', 'CUSTOM']).optional(),
    allowedRoles: z.array(z.enum(['LEADER', 'ADMIN', 'MEMBER'])).optional(),
    metadata: z.any().optional(),
  })
  .refine(
    (data) =>
      data.visibility !== 'CUSTOM' ||
      (Array.isArray(data.allowedRoles) && data.allowedRoles.length > 0),
    {
      message: 'Defina os perfis autorizados ao usar visibilidade customizada.',
      path: ['allowedRoles'],
    },
  );

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
