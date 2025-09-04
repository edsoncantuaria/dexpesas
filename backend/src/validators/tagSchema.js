
// backend/src/validators/tagSchema.js
import { z } from 'zod';

export const tagSchema = z.object({
  name: z.string().min(3, 'O nome da tag deve ter pelo menos 3 caracteres.').max(50),
});
