// src/app/dashboard/contas/page.tsx
'use client';

import { Landmark, ArrowRightLeft, PlusCircle } from "lucide-react";
import { AccountList } from "@/components/dashboard/contas/account-list";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { useState, useEffect, useCallback } from "react";
import type { Account } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';
import { handleApiError } from '@/lib/error-handler';
import { LoadingScreen } from "@/components/ui/loading-screen";
import { TransferForm } from "@/components/dashboard/contas/transfer-form";
import { AddAccountForm } from "@/components/dashboard/contas/add-account-form";

export default function ContasPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isTransferFormOpen, setIsTransferFormOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const fetchAccounts = useCallback(async () => {
        // Não reseta o loading para evitar piscar na tela ao atualizar
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data);
        } catch (error) {
            handleApiError(error, toast, 'Erro ao buscar contas');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        setIsLoading(true);
        fetchAccounts();
    }, [fetchAccounts]);

    const handleOpenForm = (account?: Account) => {
        setEditingAccount(account || null);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingAccount(null);
    };

    const handleSaveAccount = async (accountData: Omit<Account, 'id' | 'userId'> & { id?: string }) => {
        setIsSubmitting(true);
        const isEditing = !!editingAccount;
        const method = isEditing ? 'patch' : 'post';
        const url = isEditing ? `/accounts/${editingAccount!.id}` : '/accounts';
        try {
            await api[method](url, accountData);
            await fetchAccounts();
            toast({ title: `Conta ${isEditing ? 'atualizada' : 'criada'}!` });
            handleCloseForm();
        } catch (error: any) {
            handleApiError(error, toast, 'Erro ao salvar conta');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTransfer = async (transferData: { fromAccountId: string, toAccountId: string, amount: number, description?: string }) => {
        setIsSubmitting(true);
        try {
            await api.post('/accounts/transfer', transferData);
            await fetchAccounts(); // Atualiza os saldos
            toast({ title: 'Transferência realizada com sucesso!' });
            setIsTransferFormOpen(false);
        } catch (error: any) {
            handleApiError(error, toast, 'Erro na Transferência');
        } finally {
            setIsSubmitting(false);
        }
    };


    const handleDeleteAccount = async (accountId: string) => {
        const accountToDelete = accounts.find(acc => acc.id === accountId);
        if (accountToDelete) {
            try {
                await api.delete(`/accounts/${accountId}`);
                await fetchAccounts();
                toast({
                    title: 'Conta excluída!',
                    description: `A conta "${accountToDelete.nome}" foi removida com sucesso.`,
                    variant: 'destructive'
                });
            } catch (error) {
                handleApiError(error, toast, 'Erro ao excluir conta');
            }
        }
    };

    if (isLoading) {
        return <LoadingScreen />
    }

    const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.saldoPago ?? acc.saldo ?? 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                        <Landmark className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold font-headline bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                            Contas
                        </h1>
                        <p className="text-muted-foreground mt-1">Gerencie suas contas e transfira valores.</p>
                    </div>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2">
                    {accounts.length > 1 && (
                        <>
                            <Button variant="outline" className="w-full sm:w-auto" onClick={() => setIsTransferFormOpen(true)}>
                                <ArrowRightLeft className="mr-2 h-4 w-4" />
                                Transferir
                            </Button>
                            <ResponsiveDialog
                                isOpen={isTransferFormOpen}
                                setIsOpen={setIsTransferFormOpen}
                                title="Transferir entre Contas"
                                description="Mova dinheiro de uma conta para outra."
                            >
                                <div className="py-4">
                                    <TransferForm
                                        accounts={accounts}
                                        onSave={handleTransfer}
                                        isSaving={isSubmitting}
                                        onClose={() => setIsTransferFormOpen(false)}
                                    />
                                </div>
                            </ResponsiveDialog>
                        </>
                    )}
                    <Button className="w-full sm:w-auto shadow-lg shadow-primary/20" onClick={() => handleOpenForm()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Nova Conta
                    </Button>
                    <ResponsiveDialog
                        isOpen={isFormOpen}
                        setIsOpen={setIsFormOpen}
                        title={editingAccount ? 'Editar Conta' : 'Adicionar Nova Conta'}
                        description={editingAccount ? 'Atualize as informações da sua conta.' : 'Preencha as informações para adicionar uma nova conta.'}
                    >
                        <div className="py-4">
                            <AddAccountForm
                                account={editingAccount}
                                onSuccess={handleSaveAccount}
                                onClose={handleCloseForm}
                                isSubmitting={isSubmitting}
                            />
                        </div>
                    </ResponsiveDialog>
                </div>
            </div>

            {accounts.length > 0 && (
                <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20 shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground mb-1">Saldo Total Disponível</p>
                            <p className="text-4xl font-bold bg-gradient-to-br from-emerald-600 to-green-600 bg-clip-text text-transparent">
                                {totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                        <div className="p-4 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/10">
                            <Landmark className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                </div>
            )}

            <AccountList
                accounts={accounts}
                onEdit={handleOpenForm}
                onDelete={handleDeleteAccount}
                isLoading={isLoading}
            />
        </div>
    );
}
