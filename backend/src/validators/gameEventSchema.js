// backend/src/validators/gameEventSchema.js
import { z } from 'zod';

export const gameEventSchema = z.object({
  type: z.enum(['XP_MULTIPLIER', 'ITEM_DROP']),
  description: z.string().min(10, "A descrição deve ter pelo menos 10 caracteres.").max(200),
  multiplier: z.coerce.number().optional(),
  itemId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  startAt: z.string().datetime({ message: "Data de início inválida." }),
  endAt: z.string().datetime({ message: "Data de fim inválida." }),
}).refine(data => new Date(data.endAt) > new Date(data.startAt), {
    message: "A data final deve ser posterior à data de início.",
    path: ['endAt'],
});
