// backend/src/validators/bossSchema.js
import { z } from 'zod';

export const bossSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.').max(50),
  hp: z.coerce.number().int().positive('O HP deve ser um número inteiro positivo.'),
  currentHp: z.coerce.number().int().nonnegative('O HP atual não pode ser negativo.').optional(),
  rewardJson: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "O JSON de recompensa é inválido." }),
  isActive: z.boolean().default(false),
  startAt: z.string().datetime().optional().nullable(),
  endAt: z.string().datetime().optional().nullable(),
}).refine(data => {
    if (data.startAt && data.endAt) {
        return new Date(data.endAt) > new Date(data.startAt);
    }
    return true;
}, {
    message: 'A data final deve ser posterior à data de início.',
    path: ['endAt'],
});
