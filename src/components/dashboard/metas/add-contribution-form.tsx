// src/components/dashboard/metas/add-contribution-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Account, Goal } from '@/lib/definitions';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CurrencyInput } from '@/components/ui/currency-input';


const formSchema = z.object({
  amount: z.coerce.number().positive({ message: 'O valor da contribuição deve ser positivo.' }),
  fromAccountId: z.string({ required_error: 'Selecione uma conta de origem.' }).min(1, 'Selecione uma conta de origem.'),
});

type AddContributionFormProps = {
    goal: Goal;
    accounts: Account[];
    onSuccess: (data: { amount: number, fromAccountId: string }) => void;
    onClose: () => void;
    isSubmitting: boolean;
};

export function AddContributionForm({ goal, accounts, onSuccess, onClose, isSubmitting }: AddContributionFormProps) {

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: 0,
      fromAccountId: '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSuccess)} className="space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor da Contribuição</FormLabel>
              <FormControl>
                <CurrencyInput value={field.value} onValueChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="fromAccountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Conta de Origem</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="De onde sairá o dinheiro?" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      <span className="font-medium">{acc.nome}</span>
                      <span className={cn("ml-2 text-sm", Number(acc.saldo) >= 0 ? "text-green-500" : "text-destructive")}>
                        (Saldo: {Number(acc.saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        

        <div className="flex justify-end pt-4 gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Contribuindo...' : 'Adicionar Contribuição'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
