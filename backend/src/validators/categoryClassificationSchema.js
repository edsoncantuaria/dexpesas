// backend/src/validators/categoryClassificationSchema.js
import { z } from 'zod';

export const categoryClassificationSchema = z.object({
    body: z.object({
        classification: z.enum(['ESSENTIAL', 'LEISURE', 'INVESTMENT', 'OTHER']),
    }),
});

export const bulkCategoryClassificationSchema = z.object({
    body: z.object({
        classifications: z.array(
            z.object({
                categoryId: z.string(),
                classification: z.enum(['ESSENTIAL', 'LEISURE', 'INVESTMENT', 'OTHER']),
            })
        ),
    }),
});
