// backend/src/validators/missionSchema.js
import { z } from 'zod';

export const missionSchema = z.object({
  title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres.').max(100),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.').max(255),
  scope: z.enum(['USER', 'GUILD']).default('USER'),
  xpReward: z.coerce.number().int().positive('A recompensa de XP deve ser um número positivo.'),
  itemRewardId: z.string().optional().nullable(),
  minLevel: z.coerce.number().int().min(1).default(1),
  requiredClass: z.string().optional().nullable(),
  triggerSpec: z.object({
      type: z.string(),
      count: z.number().optional(),
  }).passthrough(), // Permite outros campos no trigger
  isRepeatable: z.boolean().default(false),
  isActive: z.boolean().default(true),
});
