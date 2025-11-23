// src/components/dashboard/clans/split-expense-dialog.tsx
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

interface SplitExpenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clanId: string;
  clanBalance: number;
  onSuccess: () => void;
}

export function SplitExpenseDialog({ isOpen, onClose, clanId, clanBalance, onSuccess }: SplitExpenseDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();

  const formSchema = z.object({
    totalAmount: z.coerce.number().positive('O valor deve ser positivo.').max(clanBalance, 'Saldo da família insuficiente para este rateio.'),
    description: z.string().min(3, 'A descrição é obrigatória.'),
    categoryId: z.string().min(1, 'Selecione uma categoria.'),
    splitMethod: z.enum(['EQUAL']),
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
    defaultValues: { totalAmount: 0, description: '', categoryId: '', splitMethod: 'EQUAL' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await api.post(`/familia/${clanId}/split-expense`, values);
      toast({ title: 'Despesa rateada com sucesso!', description: 'As transações foram geradas para cada membro.' });
      onSuccess();
      onClose();
      form.reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao ratear despesa', description: error.response?.data?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      setIsOpen={(open) => !open && onClose()}
      title="Ratear Nova Despesa Coletiva"
      description="A despesa será paga com o caixa da família e uma transação será criada no perfil de cada membro."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <FormField control={form.control} name="description" render={({ field }) => (<FormItem><FormLabel>Descrição da Despesa</FormLabel><FormControl><Input placeholder="Ex: Assinatura de streaming familiar" {...field} /></FormControl><FormMessage /></FormItem>)} />
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="totalAmount" render={({ field }) => (<FormItem><FormLabel>Valor Total</FormLabel><FormControl><CurrencyInput value={field.value} onValueChange={field.onChange} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="categoryId" render={({ field }) => (<FormItem><FormLabel>Categoria</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl><SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
          </div>
          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Registrar e Ratear
            </Button>
          </div>
        </form>
      </Form>
    </ResponsiveDialog>
  );
}
