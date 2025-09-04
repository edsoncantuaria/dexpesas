// src/components/dashboard/transacoes/add-transaction-dialog.tsx
'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { AddTransactionForm } from './add-transaction-form';
import { useTransactionForm } from '@/contexts/TransactionFormContext';
import { useEffect, useState, useCallback } from 'react';
import type { Account, Card as CardType } from '@/lib/definitions';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LimitExceededDialog } from '@/components/ui/limit-exceeded-dialog';
import { LoadingScreen } from '@/components/ui/loading-screen';

export function AddTransactionDialog() {
    const { isFormOpen, closeForm, editingTransaction, setEditingTransaction } = useTransactionForm();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [cards, setCards] = useState<CardType[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [limitError, setLimitError] = useState<{ isOpen: boolean; limitAvailable: string; amountExceeded: string; } | null>(null);

    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const [accRes, cardRes] = await Promise.all([
                api.get('/accounts'),
                api.get('/cards'),
            ]);
            setAccounts(accRes.data);
            setCards(cardRes.data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar dados do formulário'});
        } finally {
            setIsLoadingData(false);
        }
    }, [toast]);

    useEffect(() => {
        if (isFormOpen) {
            fetchData();
        }
    }, [isFormOpen, fetchData]);

    const handleClose = () => {
        setEditingTransaction(null);
        closeForm();
    };

    const handleSaveTransaction = async (data: any, shouldClose: boolean) => {
        setIsSubmitting(true);
        const method = editingTransaction ? 'put' : 'post';
        const url = editingTransaction ? `/transactions/${editingTransaction.id}` : '/transactions';

        try {
            await api[method](url, data);
            toast({
                title: `Transação ${editingTransaction ? 'atualizada' : 'criada'}!`,
                description: 'Sua movimentação foi salva com sucesso.',
            });
            
            window.dispatchEvent(new Event('transaction-updated'));
            
            if (shouldClose) {
                handleClose();
            }
        } catch (error: any) {
            if (error.response && error.response.status === 403 && error.response.data.message === 'Limite do cartão de crédito excedido.') {
                setLimitError({
                    isOpen: true,
                    limitAvailable: error.response.data.limiteDisponivel,
                    amountExceeded: error.response.data.valorExcedido
                });
            } else {
                 toast({
                    variant: 'destructive',
                    title: 'Erro ao salvar',
                    description: error.response?.data?.message || 'Não foi possível salvar a operação.',
                });
            }
        } finally {
            setIsSubmitting(false);
        }
      };


    return (
        <>
            <Dialog open={isFormOpen} onOpenChange={(isOpen) => !isOpen && handleClose()}>
                <DialogContent className="sm:max-w-md md:max-w-xl p-0 overflow-hidden">
                     <DialogHeader className="p-6 pb-4 border-b">
                        <DialogTitle>{editingTransaction ? 'Editar Transação' : 'Nova Operação'}</DialogTitle>
                        <DialogDescription>
                            {editingTransaction ? 'Atualize os detalhes da sua movimentação.' : 'Adicione uma nova receita ou despesa.'}
                        </DialogDescription>
                    </DialogHeader>
                    {isLoadingData ? (
                        <div className="h-96 flex items-center justify-center">
                            <LoadingScreen />
                        </div>
                    ) : (
                       <div className="overflow-y-auto max-h-[80vh] p-6 pt-2">
                            <AddTransactionForm
                                key={editingTransaction?.id || 'new'}
                                transaction={editingTransaction}
                                accounts={accounts}
                                cards={cards}
                                onSave={handleSaveTransaction}
                                onClose={handleClose}
                                isSubmitting={isSubmitting}
                            />
                       </div>
                    )}
                </DialogContent>
            </Dialog>
             {limitError && (
                <LimitExceededDialog 
                    isOpen={limitError.isOpen}
                    onClose={() => setLimitError(null)}
                    limitAvailable={limitError.limitAvailable}
                    amountExceeded={limitError.amountExceeded}
                />
            )}
        </>
    );
}
