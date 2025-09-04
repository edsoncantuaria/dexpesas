// backend/src/validators/userSchema.js
import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres.').optional(),
  gender: z.enum(['masculino', 'feminino', 'outro', 'naodizer']).optional().nullable(),
  age: z.coerce.number().int().min(10).max(120).optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  professionalSituation: z.string().optional().nullable(),
  monthlyIncomeRange: z.string().optional().nullable(),
  investmentProfile: z.string().optional().nullable(),
  mainFinancialGoal: z.string().optional().nullable(),
});

export const updatePreferencesSchema = z.object({
    futureProjectionCount: z.coerce.number().min(1).max(50).optional(),
    daysUntilDueReminder: z.coerce.number().optional(),
    enableAchievementNotifications: z.boolean().optional(),
    enableBudgetNotifications: z.boolean().optional(),
    enableLimitAlerts: z.boolean().optional(),
    enableUpcomingPaymentNotifications: z.boolean().optional(),
    enableOcr: z.boolean().optional(),
    enableDailySummary: z.boolean().optional(),
    enableBudgetSuggestion: z.boolean().optional(),
    enableReconciliationAi: z.boolean().optional(),
    enableGoalProjection: z.boolean().optional(),
    habilitarDescricaoInteligente: z.boolean().optional(),
    dashboardLayout: z.any().optional(),
});


export const updateAccountInfoSchema = z.object({
  email: z.string().email('Email inválido.'),
  username: z.string().min(3, 'Usuário deve ter pelo menos 3 caracteres.'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória.'),
    newPassword: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres.'),
}).refine(data => data.currentPassword !== data.newPassword, {
    message: 'A nova senha deve ser diferente da atual.',
    path: ['newPassword'],
});
