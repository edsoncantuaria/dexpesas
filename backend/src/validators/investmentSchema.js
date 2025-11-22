import { z } from 'zod';

export const investmentPlanSchema = z.object({
    priority: z.enum(['investir', 'lazer', 'balanceado']).optional(),
    targetPercent: z.number().min(0).max(1).optional(),
    targetAmountMin: z.number().min(0).optional(),
    targetAmount: z.number().min(0).optional().nullable(),
    leisureFloor: z.number().min(0).optional(),
    leisurePercentMin: z.number().min(0).max(1).optional(),
    emergencyFundTarget: z.number().min(0).optional().nullable(),
    notes: z.string().max(500).optional().nullable(),
    status: z.enum(['ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
});

export const investmentHoldingSchema = z.object({
    accountId: z.string().min(1),
    goalId: z.string().optional().nullable(),
    assetClass: z.string().min(1),
    ticker: z.string().optional().nullable(),
    currentAmount: z.number().min(0),
    expectedReturn: z.number().optional().nullable(),
    metadata: z.any().optional(),
});

export const investmentContributionSchema = z.object({
    accountId: z.string().min(1),
    fromAccountId: z.string().min(1),
    holdingId: z.string().optional().nullable(),
    amount: z.number().positive(),
    leisureImpact: z.number().optional().nullable(),
    status: z.enum(['PENDING', 'EXECUTED', 'FAILED']).optional(),
    source: z.enum(['MANUAL', 'AUTOMATION', 'WINDFALL', 'AI_SUGGESTION']).optional(),
    notes: z.string().max(500).optional().nullable(),
    month: z.string().regex(/^\d{4}-\d{2}$/, 'Formato inválido (YYYY-MM)').optional(),
});
