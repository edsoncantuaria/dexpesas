
// backend/src/validators/guildSchema.js
import { z } from 'zod';

export const guildSchema = z.object({
  name: z.string().min(3, 'O nome da guilda deve ter pelo menos 3 caracteres.').max(50, 'O nome da guilda não pode exceder 50 caracteres.'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.').max(200, 'A descrição não pode exceder 200 caracteres.'),
  iconUrl: z.string().optional().nullable(),
});
