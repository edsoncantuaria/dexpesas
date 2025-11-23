// src/components/dashboard/clans/contribution-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Loader2 } from 'lucide-react';
import type { Account } from '@/lib/definitions';
import { cn } from '@/lib/utils';

interface ContributionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clanId: string;
  userAccounts: Account[];
  onSuccess: () => void;
}

const formSchema = z.object({
  amount: z.coerce.number().positive('O valor deve ser positivo.'),
  fromAccountId: z.string().min(1, 'Selecione uma conta de origem.'),
});

export function ContributionDialog({ isOpen, onClose, clanId, userAccounts, onSuccess }: ContributionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 0, fromAccountId: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await api.post(`/familia/${clanId}/contribute`, values);
      toast({ title: 'Contribuição realizada!', description: 'O valor foi adicionado ao caixa da família.' });
      onSuccess();
      onClose();
      form.reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao contribuir', description: error.response?.data?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      setIsOpen={(open) => !open && onClose()}
      title="Contribuir para o Caixa da Família"
      description="Transfira um valor de sua conta pessoal para o fundo compartilhado."
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                <FormLabel>Origem</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione sua conta de origem" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {userAccounts.map(acc => {
                      const available = Number(acc.saldoPago ?? acc.saldo ?? 0);
                      return (
                        <SelectItem key={acc.id} value={acc.id}>
                          <span className="font-medium">{acc.nome}</span>
                          <span className={cn("ml-2 text-sm", available >= 0 ? "text-green-500" : "text-destructive")}>
                            (Saldo disponível: {available.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-end pt-4 gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Contribuição
            </Button>
          </div>
        </form>
      </Form>
    </ResponsiveDialog>
  );
}
