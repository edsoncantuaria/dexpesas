// src/components/dashboard/contas/add-account-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Account } from '@/lib/definitions';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
    nome: z.string().min(3, { message: 'O nome da conta deve ter pelo menos 3 caracteres.' }),
    instituicao: z.string().min(2, { message: 'O nome da instituição é obrigatório.' }),
    tipo: z.enum(['corrente', 'poupanca', 'investimento'], { required_error: 'Selecione um tipo de conta.' }),
    saldo: z.coerce.number(),
    overdraftLimit: z.coerce.number().optional().default(0),
});

type AddAccountFormProps = {
    account?: Account | null;
    onSuccess: (account: Omit<Account, 'id' | 'userId'> & { id?: string }) => void;
    onClose: () => void;
    isSubmitting: boolean;
    cancelLabel?: string;
};

export function AddAccountForm({ account, onSuccess, onClose, isSubmitting, cancelLabel = 'Cancelar' }: AddAccountFormProps) {
    const isEditing = !!account;

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nome: '',
            instituicao: '',
            saldo: 0,
            overdraftLimit: 0,
            ...account
        },
    });

    useEffect(() => {
        if (account) {
            form.reset({
                nome: account.nome,
                instituicao: account.instituicao,
                tipo: account.tipo,
                saldo: account.saldo,
                overdraftLimit: account.overdraftLimit || 0
            });
        } else {
            form.reset({
                nome: '',
                instituicao: '',
                saldo: 0,
                overdraftLimit: 0,
                tipo: 'corrente',
            })
        }
    }, [account, form]);


    function onSubmit(values: z.infer<typeof formSchema>) {
        const accountData = isEditing ? { ...values, id: account.id } : values;
        onSuccess(accountData);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="nome"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nome da Conta</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Conta Principal" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="instituicao"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Instituição Financeira</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: Banco Digital" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="tipo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Conta</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o tipo" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="corrente">Conta Corrente</SelectItem>
                                        <SelectItem value="poupanca">Poupança</SelectItem>
                                        <SelectItem value="investimento">Investimento</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="saldo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Saldo {isEditing ? 'atual (ajuste conforme extrato)' : 'inicial'}</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="R$ 0,00" {...field} step="0.01" />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                    Use o mesmo valor exibido como saldo inicial no extrato que você vai reconciliar. Pode ser alterado a qualquer momento.
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="overdraftLimit"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Limite de Cheque Especial (Opcional)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="R$ 0,00" {...field} step="0.01" />
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                    Valor do limite disponível além do saldo.
                                </p>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <div className="flex justify-end pt-4 gap-2">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>{cancelLabel}</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Adicionar Conta'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
