'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import api from '@/lib/api';
import { format } from 'date-fns';

const formSchema = z.object({
    categoryId: z.string({ required_error: 'Selecione uma categoria.' }),
    limit: z.coerce.number().positive({ message: 'O limite deve ser um número positivo.' }),
    rollover: z.boolean().default(false),
    month: z.string(), // YYYY-MM
});

type BudgetFormProps = {
    budget?: any;
    onSuccess: (budget: any) => void;
    onClose: () => void;
    month: string; // Current view month
};

export function BudgetForm({ budget, onSuccess, onClose, month }: BudgetFormProps) {
    const isEditing = !!budget;
    const [categories, setCategories] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/categories');
                // Filter out categories that are 'receita' type, usually budgets are for expenses
                setCategories(response.data.filter((cat: any) => cat.type === 'despesa'));
            } catch (error) {
                console.error("Erro ao buscar categorias", error);
            }
        }
        fetchCategories();
    }, []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            categoryId: '',
            limit: 0,
            rollover: false,
            month: month,
        },
    });

    useEffect(() => {
        if (budget) {
            form.reset({
                categoryId: budget.categoryId,
                limit: budget.originalLimit || budget.limit,
                rollover: budget.rollover,
                month: budget.month,
            });
        } else {
            form.setValue('month', month);
        }
    }, [budget, month, form]);

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsSubmitting(true);
        try {
            let response;
            if (isEditing) {
                response = await api.patch(`/budgets/${budget.id}`, values);
            } else {
                response = await api.post('/budgets', values);
            }
            onSuccess(response.data);
            onClose();
        } catch (error) {
            console.error("Erro ao salvar orçamento", error);
            // Handle error (e.g. show toast)
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value} disabled={isEditing}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a categoria" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            <span className="mr-2">{cat.icon || '💰'}</span>
                                            {cat.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="limit"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Limite Mensal</FormLabel>
                            <FormControl>
                                <CurrencyInput value={field.value} onValueChange={field.onChange} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="rollover"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <FormLabel className="text-base">Acumular Sobra (Rollover)</FormLabel>
                                <FormDescription>
                                    Se sobrar dinheiro neste mês, adicionar ao limite do próximo mês?
                                </FormDescription>
                            </div>
                            <FormControl>
                                <Switch
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                />
                            </FormControl>
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? 'Salvar Alterações' : 'Criar Orçamento'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
