// backend/src/validators/clanSchema.js
import { z } from 'zod';

export const clanSchema = z.object({
  name: z.string().min(3, 'O nome do clã deve ter pelo menos 3 caracteres.').max(50),
  description: z.string().max(200, 'A descrição não pode exceder 200 caracteres.').optional(),
  iconUrl: z.string().optional().nullable(),
});

export const clanInviteSchema = z.object({
    invitedUserId: z.string().cuid('O ID do jogador convidado é inválido.'),
});

export const clanPolicySchema = z.object({
    approvalRequiredForAmount: z.number().positive().optional(),
    canMembersUseClanBank: z.boolean().default(false),
});

export const clanContributionSchema = z.object({
    amount: z.number().positive('O valor da contribuição deve ser positivo.'),
    fromAccountId: z.string().min(1, 'A conta de origem é obrigatória.'),
});

export const clanExpenseSchema = z.object({
    amount: z.number().positive('O valor da despesa deve ser positivo.'),
    description: z.string().min(3, 'A descrição é obrigatória.'),
    categoryId: z.string().min(1, 'A categoria é obrigatória.'),
});

export const clanGoalSchema = z.object({
    name: z.string().min(3, 'O nome da meta é obrigatório.'),
    targetAmount: z.number().positive('O valor alvo deve ser positivo.'),
    deadline: z.string().datetime().optional().nullable(),
});

// Novo schema para o rateio
export const splitExpenseSchema = z.object({
  totalAmount: z.coerce.number().positive('O valor total deve ser positivo.'),
  description: z.string().min(3, 'A descrição é obrigatória.'),
  categoryId: z.string().min(1, 'A categoria da despesa é obrigatória.'),
  splitMethod: z.enum(['EQUAL']), // Por enquanto, apenas divisão igual
});