// src/components/dashboard/transacoes/add-transaction-dialog.tsx
'use client';

import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { AddTransactionForm } from './add-transaction-form';
import { useTransactionForm } from '@/contexts/TransactionFormContext';
import { useEffect, useState, useCallback } from 'react';
import type { Account, Card as CardType } from '@/lib/definitions';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handler';
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
            handleApiError(error, toast, 'Erro ao buscar dados do formulário');
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
                handleApiError(error, toast, 'Erro ao salvar transação');
            }
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <>
            <ResponsiveDialog
                isOpen={isFormOpen}
                setIsOpen={(isOpen) => !isOpen && handleClose()}
                title={editingTransaction ? 'Editar Transação' : 'Nova Operação'}
                description={editingTransaction ? 'Atualize os detalhes da sua movimentação.' : 'Adicione uma nova receita ou despesa.'}
            >
                {isLoadingData ? (
                    <div className="h-96 flex items-center justify-center">
                        <LoadingScreen />
                    </div>
                ) : (
                    <div className="overflow-y-auto max-h-[80vh] p-1">
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
            </ResponsiveDialog>

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
