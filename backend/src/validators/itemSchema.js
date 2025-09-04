// backend/src/validators/itemSchema.js
import { z } from 'zod';

export const itemSchema = z.object({
  key: z.string().min(3, 'A chave deve ter pelo menos 3 caracteres.').regex(/^[a-z0-9_]+$/, 'Use apenas letras minúsculas, números e underlines.'),
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.').max(50),
  type: z.enum(['consumable', 'cosmetic', 'bonus']),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']).optional(),
  bonusJson: z.record(z.any()).optional().refine(val => {
    try {
        if (val) JSON.stringify(val);
        return true;
    } catch {
        return false;
    }
  }, { message: "O JSON de bônus é inválido."}),
});
