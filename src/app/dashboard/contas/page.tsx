// src/app/dashboard/contas/page.tsx
'use client';

import { Landmark, ArrowRightLeft, PlusCircle } from "lucide-react";
import { AccountList } from "@/components/dashboard/contas/account-list";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState, useEffect, useCallback } from "react";
import type { Account } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';
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
            toast({
                variant: 'destructive',
                title: 'Erro ao buscar contas',
                description: 'Não foi possível carregar a lista de contas.'
            });
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
            toast({ variant: 'destructive', title: 'Erro ao salvar conta', description: error.response?.data?.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTransfer = async (transferData: { fromAccountId: string, toAccountId: string, amount: number, description: string }) => {
        setIsSubmitting(true);
        try {
            await api.post('/accounts/transfer', transferData);
            await fetchAccounts(); // Atualiza os saldos
            toast({ title: 'Transferência realizada com sucesso!' });
            setIsTransferFormOpen(false);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Não foi possível realizar a transferência.';
            toast({ variant: 'destructive', title: 'Erro na Transferência', description: message });
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
                toast({
                    variant: 'destructive',
                    title: 'Erro ao excluir conta',
                    description: 'Não foi possível remover a conta.'
                });
            }
        }
    };

    if (isLoading) {
        return <LoadingScreen />
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Contas</h1>
                    <p className="text-muted-foreground">Adicione, edite e transfira valores entre suas contas.</p>
                </div>
                <div className="flex w-full sm:w-auto items-center gap-2">
                    {accounts.length > 1 && (
                         <Dialog open={isTransferFormOpen} onOpenChange={setIsTransferFormOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="w-full sm:w-auto">
                                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                                    Transferir
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Transferir entre Contas</DialogTitle>
                                    <DialogDescription>Mova dinheiro de uma conta para outra.</DialogDescription>
                                </DialogHeader>
                                <TransferForm
                                    accounts={accounts}
                                    onSave={handleTransfer}
                                    isSaving={isSubmitting}
                                    onClose={() => setIsTransferFormOpen(false)}
                                />
                            </DialogContent>
                        </Dialog>
                    )}
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild>
                            <Button className="w-full sm:w-auto" onClick={() => handleOpenForm()}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Nova Conta
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingAccount ? 'Editar Conta' : 'Adicionar Nova Conta'}</DialogTitle>
                                <DialogDescription>
                                    {editingAccount ? 'Atualize as informações da sua conta.' : 'Preencha as informações para adicionar uma nova conta.'}
                                </DialogDescription>
                            </DialogHeader>
                            <AddAccountForm 
                                account={editingAccount} 
                                onSuccess={handleSaveAccount}
                                onClose={handleCloseForm}
                                isSubmitting={isSubmitting}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <AccountList 
                accounts={accounts}
                onEdit={handleOpenForm}
                onDelete={handleDeleteAccount}
                isLoading={isLoading}
            />
        </div>
    );
}
