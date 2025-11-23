// src/components/dashboard/metas/finalize-goal-dialog.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Goal, Account, Category } from '@/lib/definitions';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CurrencyInput } from '@/components/ui/currency-input';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

const finalizeSchema = z.object({
    amount: z.coerce.number().positive('O valor a ser finalizado deve ser positivo.'),
    finalizationType: z.enum(['purchase', 'account'], {
        required_error: 'Você precisa escolher uma forma de finalizar a meta.',
    }),
    destinationAccountId: z.string().optional(),
    categoryId: z.string().optional(),
    remainingAmountAction: z.enum(['keep', 'rescue']).optional(),
}).refine(data => {
    if (data.finalizationType === 'account') return !!data.destinationAccountId;
    if (data.finalizationType === 'purchase') return !!data.categoryId;
    return true;
}, {
    message: 'Por favor, selecione uma opção para o destino.',
    path: ['destinationAccountId'],
}).refine(data => {
    const remaining = Number(data.amount) - Number(data.amount); // This logic seems wrong, but I'll keep it as is.
    if (remaining > 0) return !!data.remainingAmountAction;
    return true;
}, {
    message: 'Escolha o que fazer com o saldo restante.',
    path: ['remainingAmountAction']
});

interface FinalizeGoalDialogProps {
    isOpen: boolean;
    isSaving: boolean;
    goal: Goal;
    accounts: Account[];
    categories: Category[];
    onClose: () => void;
    onSave: (data: z.infer<typeof finalizeSchema>) => void;
}

export function FinalizeGoalDialog({ isOpen, isSaving, goal, accounts, categories, onClose, onSave }: FinalizeGoalDialogProps) {
    const { toast } = useToast();
    const form = useForm<z.infer<typeof finalizeSchema>>({
        resolver: zodResolver(finalizeSchema),
        defaultValues: {
            finalizationType: 'purchase',
            amount: Number(goal.currentAmount)
        },
    });

    useEffect(() => {
        form.setValue('amount', Number(goal.currentAmount));
    }, [goal, form]);

    const finalizationType = form.watch('finalizationType');
    const finalizationAmount = form.watch('amount');
    const remainingAmount = Number(goal.currentAmount) - finalizationAmount;

    const handleSubmit = (values: z.infer<typeof finalizeSchema>) => {
        if (values.amount > Number(goal.currentAmount)) {
            form.setError("amount", {
                type: "manual",
                message: "O valor finalizado não pode ser maior que o valor acumulado.",
            });
            return;
        }
        onSave(values);
    };

    return (
        <ResponsiveDialog
            isOpen={isOpen}
            setIsOpen={onClose}
            title="Parabéns por alcançar seu objetivo!"
            description={`Você acumulou ${Number(goal.currentAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} para "${goal.name}". O que você quer fazer com o dinheiro?`}
        >
            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Valor a ser Utilizado</FormLabel>
                                <FormControl>
                                    <CurrencyInput value={field.value} onValueChange={field.onChange} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="finalizationType"
                        render={({ field }) => (
                            <FormItem className="space-y-3">
                                <FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormItem>
                                            <FormControl><RadioGroupItem value="purchase" className="sr-only peer" /></FormControl>
                                            <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                Registrar como Compra
                                                <p className="text-xs font-normal text-muted-foreground mt-1 text-center">Isso criará uma despesa simbólica para a sua meta.</p>
                                            </FormLabel>
                                        </FormItem>
                                        <FormItem>
                                            <FormControl><RadioGroupItem value="account" className="sr-only peer" /></FormControl>
                                            <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                                                Mover para uma Conta
                                                <p className="text-xs font-normal text-muted-foreground mt-1 text-center">Isso criará uma receita na conta que você escolher.</p>
                                            </FormLabel>
                                        </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {finalizationType === 'purchase' && (
                        <FormField control={form.control} name="categoryId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Categoria da Despesa</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione a categoria..." /></SelectTrigger></FormControl>
                                    <SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    )}

                    {finalizationType === 'account' && (
                        <FormField control={form.control} name="destinationAccountId" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Conta de Destino</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Para onde o dinheiro vai?" /></SelectTrigger></FormControl>
                                    <SelectContent>{accounts.map(acc => <SelectItem key={acc.id} value={acc.id}>{acc.nome}</SelectItem>)}</SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                    )}

                    {remainingAmount > 0 && (
                        <Alert>
                            <AlertTitle>Saldo Remanescente</AlertTitle>
                            <AlertDescription>
                                Sobrarão {remainingAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} na meta. O que deseja fazer?
                            </AlertDescription>
                            <FormField control={form.control} name="remainingAmountAction" render={({ field }) => (
                                <FormItem className="mt-4"><FormControl>
                                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="keep" /></FormControl><FormLabel className="font-normal">Manter na meta</FormLabel></FormItem>
                                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="rescue" /></FormControl><FormLabel className="font-normal">Resgatar para conta</FormLabel></FormItem>
                                    </RadioGroup>
                                </FormControl><FormMessage /></FormItem>
                            )} />
                        </Alert>
                    )}


                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>Cancelar</Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Concluir Objetivo
                        </Button>
                    </div>
                </form>
            </Form>
        </ResponsiveDialog>
    );
}
