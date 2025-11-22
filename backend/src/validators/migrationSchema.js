// backend/src/validators/migrationSchema.js
import { z } from 'zod';

/**
 * Schema para criação de contas em lote durante a migração
 */
export const migrationAccountsSchema = z.object({
    accounts: z.array(
        z.object({
            nome: z.string().min(2, 'O nome da conta deve ter pelo menos 2 caracteres.'),
            instituicao: z.string().min(2, 'O nome da instituição deve ter pelo menos 2 caracteres.'),
            tipo: z.enum(['corrente', 'poupanca', 'investimento']),
            saldoInicial: z.coerce.number(),
            currency: z.enum(['BRL', 'USD']).default('BRL'),
            color: z.string().optional().nullable(),
            icone: z.string().optional().nullable(),
        })
    ).min(1, 'Deve fornecer pelo menos uma conta.'),
});

/**
 * Schema para criação de cartões em lote durante a migração
 */
export const migrationCardsSchema = z.object({
    cards: z.array(
        z.object({
            nome: z.string().min(3, 'O nome do cartão deve ter pelo menos 3 caracteres.'),
            limite: z.coerce.number().positive('O limite deve ser um número positivo.'),
            diaFechamento: z.coerce.number().int().min(1).max(31),
            diaVencimento: z.coerce.number().int().min(1).max(31),
            bandeira: z.enum(['visa', 'mastercard', 'elo', 'amex']).default('visa'),
            billingCurrency: z.enum(['BRL', 'USD']).default('BRL'),
            paymentAccountId: z.string().optional().nullable(),
        })
    ).min(1, 'Deve fornecer pelo menos um cartão.'),
});

/**
 * Schema para histórico de faturas de um cartão
 */
export const cardHistorySchema = z.object({
    cardId: z.string().cuid('ID de cartão inválido.'),
    history: z.array(
        z.object({
            month: z.string().regex(/^\d{4}-\d{2}$/, 'Formato de mês inválido. Use YYYY-MM.'),
            totalAmount: z.coerce.number().min(0, 'O valor total não pode ser negativo.'),
            isClosed: z.boolean().default(false),
            isPaid: z.boolean().default(false),
        })
    ).min(1, 'Deve fornecer pelo menos um mês de histórico.'),
});

/**
 * Schema para marcar migração como completa
 */
export const completeMigrationSchema = z.object({
    completed: z.boolean(),
});
