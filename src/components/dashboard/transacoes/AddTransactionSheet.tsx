// src/components/dashboard/transacoes/AddTransactionSheet.tsx
'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import type { Transaction, Account, Card } from '@/lib/definitions';
import { AddTransactionForm } from './add-transaction-form'; // Supondo que o formulário foi refatorado.
import { useState, useEffect } from 'react';
import api from '@/lib/api';

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

    useEffect(() => {
        // Busca contas e cartões apenas quando o modal for aberto para otimizar.
        if (isOpen) {
            const fetchData = async () => {
                try {
                    const [accRes, cardRes] = await Promise.all([
                        api.get('/accounts'),
                        api.get('/cards'),
                    ]);
                    setAccounts(accRes.data);
                    setCards(cardRes.data);
                } catch (error) {
                    console.error("Failed to fetch accounts/cards for form", error);
                }
            };
            fetchData();
        }
    }, [isOpen]);


  const handleSuccess = () => {
    onClose(true); // Fecha e sinaliza para atualizar a lista.
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose(false)}>
      <SheetContent side="bottom" className="rounded-t-2xl h-[90vh] p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>{transaction ? 'Editar Transação' : 'Nova Transação'}</SheetTitle>
          <SheetDescription>
            {transaction ? 'Atualize os detalhes da sua movimentação.' : 'Adicione uma nova receita ou despesa.'}
          </SheetDescription>
        </SheetHeader>
        <div className="p-4 overflow-y-auto h-[calc(100%-73px)]">
             <AddTransactionForm 
                transaction={transaction}
                accounts={accounts}
                cards={cards}
                onSuccess={handleSuccess}
                onClose={() => onClose(false)}
             />
        </div>
      </SheetContent>
    </Sheet>
  );
}
