// backend/src/validators/achievementSchema.js
import { z } from 'zod';

export const achievementSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.').max(50),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.').max(200),
  icon: z.string().min(2, 'O nome do ícone é obrigatório.'),
  xp: z.coerce.number().int().positive('A recompensa de XP deve ser um número inteiro positivo.'),
});
