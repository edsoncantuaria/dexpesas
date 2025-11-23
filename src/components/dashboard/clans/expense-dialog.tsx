// src/components/dashboard/clans/expense-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Loader2 } from 'lucide-react';
import type { Category } from '@/lib/definitions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clanId: string;
  clanBalance: number;
  onSuccess: () => void;
}

export function ExpenseDialog({ isOpen, onClose, clanId, clanBalance, onSuccess }: ExpenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();

  const formSchema = z.object({
    amount: z.coerce.number().positive('O valor deve ser positivo.').max(clanBalance, 'Saldo da família insuficiente.'),
    description: z.string().min(3, 'A descrição é obrigatória.'),
    categoryId: z.string().min(1, 'Selecione uma categoria.'),
  });

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.filter((c: Category) => c.type === 'despesa'));
      } catch (e) {
        console.error("Failed to fetch categories");
      }
    }
    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 0, description: '', categoryId: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await api.post(`/familia/${clanId}/expense`, values);
      toast({ title: 'Despesa da família registrada!' });
      onSuccess();
      onClose();
      form.reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao registrar despesa', description: error.response?.data?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      setIsOpen={(open) => !open && onClose()}
      title="Registrar Despesa da Família"
      description={`Use o dinheiro do caixa comum para pagar uma despesa coletiva. Saldo disponível: ${clanBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`}
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição da Despesa</FormLabel><FormControl><Input placeholder="Ex: Conta de luz do apartamento" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="amount" render={({ field }) => (<FormItem><FormLabel>Valor</FormLabel><FormControl><CurrencyInput value={field.value} onValueChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Categoria</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
          </div>
          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar Despesa
            </Button>
          </div>
        </form>
      </Form>
    </ResponsiveDialog>
  );
}
