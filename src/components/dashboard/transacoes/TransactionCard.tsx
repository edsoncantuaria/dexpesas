// src/components/dashboard/transacoes/TransactionCard.tsx
'use client';

import type { Transaction } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Utensils, ShoppingCart, Droplets, MoreVertical, Pencil, Trash2, CheckCircle, Circle, CreditCard } from 'lucide-react';
import type { Icon as LucideIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handler';

// Mapeia categorias para ícones para uma identificação visual rápida.
const categoryIcons: Record<string, LucideIcon> = {
  Alimentacao: Utensils,
  Compras: ShoppingCart,
  Transporte: Droplets,
  // Adicione outros ícones conforme necessário
};

type TransactionCardProps = {
  transaction: Transaction;
  onEdit: () => void;
  onDeleteSuccess: () => void;
};

/**
 * O Card de Transação individual.
 * - Otimizado para toque, com áreas de clique generosas.
 * - Mostra as informações mais importantes de forma clara (descrição, valor, categoria).
 * - Ações de editar/excluir estão em um DropdownMenu para manter a UI limpa.
 */
export function TransactionCard({ transaction, onEdit, onDeleteSuccess }: TransactionCardProps) {
  const { toast } = useToast();
  const Icon = categoryIcons[transaction.categoria] || Circle;
  const isIncome = transaction.tipo === 'receita';

  const handleDelete = async () => {
    try {
      await api.delete(`/transactions/${transaction.id}`);
      toast({
        title: 'Transação excluída!',
        description: `A transação "${transaction.descricao}" foi removida.`,
      });
      onDeleteSuccess();
    } catch (error) {
      handleApiError(error, toast, 'Erro ao excluir transação');
    }
  };

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="flex cursor-pointer items-center space-x-4 rounded-xl p-3 transition-colors hover:bg-muted/50"
      onClick={onEdit}
    >
      <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="flex-1 overflow-hidden">
        <p className="truncate font-semibold text-foreground">{transaction.descricao}</p>
        <p className="text-sm text-muted-foreground">{transaction.categoria}</p>
      </div>
      <div className="flex items-center space-x-2">
        <div className="text-right">
          <p className={cn('font-bold', isIncome ? 'text-green-500' : 'text-foreground')}>
            {isIncome ? '+' : '-'} {transaction.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </p>
          {transaction.tipo === 'despesa' && transaction.metodoPagamento === 'credito' ? (
            <div className="flex items-center justify-end gap-1">
              <CreditCard className="h-3 w-3 text-primary" />
              <p className="text-xs text-primary">Cartão</p>
            </div>
          ) : (
            <p className={cn("text-xs", transaction.pago ? "text-green-600" : "text-amber-600")}>
              {transaction.pago ? 'Pago' : 'Pendente'}
            </p>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()} // Impede que o clique no menu acione o onEdit do card.
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
              aria-label="Opções da transação"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              <Pencil className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive focus:text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}
