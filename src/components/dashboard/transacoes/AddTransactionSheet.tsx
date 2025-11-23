import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { Transaction, Account, Card } from '@/lib/definitions';
import { AddTransactionForm } from './add-transaction-form';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handler';

type AddTransactionSheetProps = {
  isOpen: boolean;
  onClose: (refresh: boolean) => void;
  transaction: Transaction | null;
};

/**
 * Componente "Sheet" (modal mobile) para o formulário.
 * - Em mobile, desliza de baixo para cima, ocupando a tela e facilitando o uso.
 * - Em desktop, pode se comportar como um modal lateral.
 * - É responsável por buscar dados de suporte (contas, cartões) para o formulário.
 */
export function AddTransactionSheet({ isOpen, onClose, transaction }: AddTransactionSheetProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Busca contas e cartões apenas quando o modal for aberto para otimizar.
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [accRes, cardRes, debtRes] = await Promise.all([
            api.get('/accounts'),
            api.get('/cards'),
            api.get('/debts'),
          ]);
          setAccounts(accRes.data);
          setCards(cardRes.data);
          setDebts(debtRes.data);
        } catch (error) {
          console.error("Failed to fetch data for form", error);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  const handleSave = async (data: any, shouldClose: boolean) => {
    setIsSubmitting(true);
    try {
      if (transaction) {
        await api.put(`/transactions/${transaction.id}`, data);
        toast({ title: 'Transação atualizada!' });
      } else {
        await api.post('/transactions', data);
        toast({ title: 'Transação criada!' });
      }

      if (shouldClose) {
        onClose(true);
      } else {
        // Se não fechar, apenas notifica (o form já reseta se for criação)
        // Se for edição e não fechar, mantém os dados (o form controla isso)
        window.dispatchEvent(new CustomEvent('transaction-updated'));
      }
    } catch (error) {
      handleApiError(error, toast, 'Erro ao salvar transação');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <SheetContent side="bottom" className="rounded-t-2xl h-[90vh] p-0 flex flex-col">
        <SheetHeader className="p-4 border-b shrink-0">
          <SheetTitle>{transaction ? 'Editar Transação' : 'Nova Transação'}</SheetTitle>
          <SheetDescription>
            {transaction ? 'Atualize os detalhes da sua movimentação.' : 'Adicione uma nova receita ou despesa.'}
          </SheetDescription>
        </SheetHeader>
        <div className="p-4 overflow-y-auto flex-1">
          <AddTransactionForm
            transaction={transaction}
            accounts={accounts}
            cards={cards}
            onSave={handleSave}
            onClose={() => onClose(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
