// src/components/dashboard/fatura/pay-bill-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CurrencyInput } from '@/components/ui/currency-input';
import type { Account, Card } from '@/lib/definitions';
import { Loader2, Calendar as CalendarIcon, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PayBillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, accountId: string, paymentDate: Date) => Promise<void>;
  accounts: Account[];
  card: Card;
  faturaTotal: number;
}

export function PayBillDialog({
  isOpen,
  onClose,
  onConfirm,
  accounts,
  card,
  faturaTotal,
}: PayBillDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const payBillSchema = z.object({
    amount: z.coerce.number()
        .positive('O valor deve ser positivo.')
        .max(faturaTotal, `O valor não pode ser maior que o total da fatura (${faturaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}).`),
    accountId: z.string().min(1, 'Selecione uma conta para o pagamento.'),
    paymentDate: z.date({ required_error: 'A data do pagamento é obrigatória.'}),
  });

  const form = useForm<z.infer<typeof payBillSchema>>({
    resolver: zodResolver(payBillSchema),
    defaultValues: {
      amount: faturaTotal > 0 ? faturaTotal : 0,
      accountId: card.paymentAccountId || '',
      paymentDate: new Date(),
    },
  });
  
  useEffect(() => {
    if (isOpen) {
        form.reset({
            amount: faturaTotal > 0 ? faturaTotal : 0,
            accountId: card.paymentAccountId || '',
            paymentDate: new Date(),
        })
    }
  }, [isOpen, faturaTotal, card, form]);


  const onSubmit = async (values: z.infer<typeof payBillSchema>) => {
    setIsSubmitting(true);
    await onConfirm(values.amount, values.accountId, values.paymentDate);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pagar Fatura do Cartão {card.nome}</DialogTitle>
          <DialogDescription>
            Insira o valor que deseja pagar e selecione a conta para o débito.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Alert variant="default">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Total da Fatura</AlertTitle>
                    <AlertDescription>
                        O valor pendente é de {faturaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.
                    </AlertDescription>
                </Alert>
                 <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Valor a Pagar</FormLabel>
                        <FormControl>
                            <CurrencyInput value={field.value} onValueChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                 />
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="accountId"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Pagar com a conta</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione a conta" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {accounts.map((acc) => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        {acc.nome} (Saldo: {Number(acc.saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
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
                        name="paymentDate"
                        render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Data do Pagamento</FormLabel>
                            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                            <PopoverTrigger asChild>
                                <FormControl>
                                <Button
                                    variant={'outline'}
                                    className={cn(
                                    'w-full pl-3 text-left font-normal h-10',
                                    !field.value && 'text-muted-foreground'
                                    )}
                                >
                                    {field.value ? (
                                    format(field.value, 'PPP', { locale: ptBR })
                                    ) : (
                                    <span>Escolha uma data</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                                </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={(date) => {
                                        if(date) field.onChange(date);
                                        setIsCalendarOpen(false);
                                    }}
                                    initialFocus
                                />
                            </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                </div>
                 <DialogFooter className="pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Confirmar Pagamento
                    </Button>
                 </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
