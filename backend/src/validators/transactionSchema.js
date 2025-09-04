// backend/src/validators/transactionSchema.js
import { z } from 'zod';

export const transactionSchema = z.object({
  tipo: z.enum(['despesa', 'receita', 'transferencia']),
  descricao: z.string().optional(), 
  valor: z.coerce.number().positive({ message: 'O valor deve ser positivo.' }),
  data: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Data inválida." }),
  pago: z.boolean().optional(),
  categoryId: z.string().optional(),
  attachmentUrl: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(1000, "As observações não podem exceder 1000 caracteres.").optional(),
  metodoPagamento: z.enum(['debito', 'credito', 'pix', 'dinheiro']).optional(),
  contaCartaoId: z.string().optional(),
  installment: z.boolean().optional(),
  totalInstallments: z.coerce.number().optional(),
  withInterest: z.boolean().optional(),
  interestRate: z.coerce.number().optional(),
  recurrenceType: z.string().optional(),
  fromAccountId: z.string().optional(),
  toAccountId: z.string().optional(),
})
.refine(data => {
    if (data.tipo === 'transferencia') {
        if (!data.fromAccountId || data.fromAccountId.length < 1) return false;
        if (!data.toAccountId || data.toAccountId.length < 1) return false;
    }
    return true;
}, {
    message: "Contas de origem e destino são obrigatórias para transferência.",
    path: ['toAccountId'],
})
.refine(data => {
    if (data.tipo === 'transferencia' && data.fromAccountId === data.toAccountId) {
        return false;
    }
    return true;
}, {
    message: "A conta de origem e destino não podem ser a mesma.",
    path: ['toAccountId'],
})
.refine(data => {
    if (data.tipo === 'despesa' || data.tipo === 'receita') {
        return !!data.descricao && data.descricao.length >= 2;
    }
    return true;
}, {
    message: "A descrição é obrigatória.",
    path: ['descricao'],
})
.refine(data => {
    if ((data.tipo === 'despesa' || data.tipo === 'receita') && data.metodoPagamento !== 'dinheiro') {
        return !!data.contaCartaoId && data.contaCartaoId.length > 0;
    }
    return true;
}, {
    message: "Selecione uma conta ou cartão para este método de pagamento.",
    path: ['contaCartaoId'],
})
.refine(data => {
    if (data.installment) {
        return !!data.totalInstallments && data.totalInstallments >= 2;
    }
    return true;
}, {
    message: "O número de parcelas deve ser no mínimo 2.",
    path: ['totalInstallments']
});
