// backend/src/validators/cardSchema.js
import { z } from 'zod';

// Schema para criar ou atualizar um cartão
export const cardSchema = z.object({
  nome: z.string().min(3, 'O nome do cartão deve ter pelo menos 3 caracteres.').max(50),
  limite: z.coerce.number().positive('O limite deve ser um número positivo.'),
  diaFechamento: z.coerce.number().int().min(1, 'O dia deve ser no mínimo 1.').max(31, 'O dia deve ser no máximo 31.'),
  diaVencimento: z.coerce.number().int().min(1, 'O dia deve ser no mínimo 1.').max(31, 'O dia deve ser no máximo 31.'),
  bandeira: z.enum(['visa', 'mastercard', 'elo', 'amex']),
  status: z.enum(['ACTIVE', 'BLOCKED', 'CANCELLED']).optional(),
  rewardsType: z.string().optional().nullable(),
  rewardsProgram: z.string().optional().nullable(),
  rewardsConversionRate: z.coerce.number().optional().nullable(),
  currencyForConversion: z.enum(['BRL', 'USD']).optional().nullable(),
  jurosRotativo: z.coerce.number().optional().nullable(),
  lastFourDigits: z.string().trim().length(4, 'Informe os 4 últimos dígitos.').optional().nullable(),
  issuer: z.string().optional().nullable(),
  billingCurrency: z.enum(['BRL', 'USD']).optional(),
  currentInvoiceAmount: z.coerce.number().nonnegative('O valor da fatura não pode ser negativo.').optional(),
  availableLimit: z.coerce.number().optional().nullable(),
  paymentAccountId: z.string().optional().nullable(),
});


// Schema para validar o pagamento da fatura
export const cardPaymentSchema = z.object({
    amount: z.coerce.number().positive('O valor do pagamento deve ser positivo.'),
    accountId: z.string().min(1, 'A conta de origem é obrigatória.'),
    paymentDate: z.string().datetime({ message: "Data de pagamento inválida." }).optional(),
});
