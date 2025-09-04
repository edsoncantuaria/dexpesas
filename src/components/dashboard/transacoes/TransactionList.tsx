// src/components/dashboard/transacoes/TransactionList.tsx
'use client';

import type { Transaction } from '@/lib/definitions';
import { TransactionCard } from './TransactionCard';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AnimatePresence, motion } from 'framer-motion';

type TransactionListProps = {
  transactions: Transaction[];
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteSuccess: () => void;
};

/**
 * Componente que agrupa e renderiza a lista de transações.
 * - Agrupa as transações por data para contextualizar a visualização.
 * - Utiliza framer-motion para animações sutis na entrada dos itens.
 */
export function TransactionList({ transactions, onEditTransaction, onDeleteSuccess }: TransactionListProps) {
  
  // Função para formatar a data de forma amigável (ex: "Hoje", "Ontem").
  const formatTransactionDate = (date: Date) => {
    if (isToday(date)) return 'Hoje';
    if (isYesterday(date)) return 'Ontem';
    return format(date, "dd 'de' MMMM", { locale: ptBR });
  };
  
  // Agrupa as transações por dia.
  const groupedTransactions = transactions.reduce((acc, transaction) => {
    const dateKey = format(parseISO(transaction.data), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(transaction);
    return acc;
  }, {} as Record<string, Transaction[]>);

  // Ordena as datas do mais recente para o mais antigo.
  const sortedDates = Object.keys(groupedTransactions).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center mt-16 text-muted-foreground">
        <p className="text-lg font-medium">Nenhuma transação encontrada.</p>
        <p className="text-sm">Parece que você ainda não adicionou nenhuma movimentação.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {sortedDates.map((date, index) => (
          <motion.div
            key={date}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="space-y-3"
          >
            <h3 className="text-sm font-semibold capitalize text-muted-foreground">
              {formatTransactionDate(parseISO(date))}
            </h3>
            <div className="space-y-2 rounded-xl bg-card">
              {groupedTransactions[date].map((transaction) => (
                <TransactionCard
                  key={transaction.id}
                  transaction={transaction}
                  onEdit={() => onEditTransaction(transaction)}
                  onDeleteSuccess={onDeleteSuccess}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
