// src/components/dashboard/contas/transfer-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Account } from '@/lib/definitions';
import { Loader2, ArrowRightLeft } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { cn } from '@/lib/utils';

const transferSchema = z.object({
  fromAccountId: z.string().min(1, 'Selecione a conta de origem.'),
  toAccountId: z.string().min(1, 'Selecione a conta de destino.'),
  amount: z.coerce.number().positive('O valor deve ser maior que zero.'),
  description: z.string().optional(),
}).refine(data => data.fromAccountId !== data.toAccountId, {
  message: 'As contas de origem e destino não podem ser as mesmas.',
  path: ['toAccountId'], // O erro será exibido no campo da conta de destino
});

type TransferFormProps = {
    accounts: Account[];
    onSave: (data: z.infer<typeof transferSchema>) => void;
    isSaving: boolean;
    onClose: () => void;
};

export function TransferForm({ accounts, onSave, isSaving, onClose }: TransferFormProps) {
  const form = useForm<z.infer<typeof transferSchema>>({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      fromAccountId: '',
      toAccountId: '',
      amount: 0,
      description: '',
    },
  });

  const fromAccountId = form.watch('fromAccountId');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <FormField
                control={form.control}
                name="fromAccountId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>De</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Conta de Origem" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        <span className="font-medium">{acc.nome}</span>
                                        <span className={cn("ml-2 text-sm", Number(acc.saldo) >= 0 ? "text-green-500" : "text-destructive")}>
                                            ({Number(acc.saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                                        </span>
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
                name="toAccountId"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Para</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Conta de Destino" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {accounts.filter(acc => acc.id !== fromAccountId).map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                         <span className="font-medium">{acc.nome}</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Valor a Transferir</FormLabel>
                    <FormControl>
                        <CurrencyInput value={field.value} onValueChange={field.onChange} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Descrição (Opcional)</FormLabel>
                    <FormControl>
                        <Input placeholder="Ex: Pagamento, Reserva de emergência" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
        />
        <div className="flex justify-end pt-4 gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
            Confirmar Transferência
          </Button>
        </div>
      </form>
    </Form>
  );
}
