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
import { Loader2, Calendar as CalendarIcon, Info, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface PayBillDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, accountId: string, paymentDate: Date, paymentType: string) => Promise<void>;
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
  const [paymentType, setPaymentType] = useState<'total' | 'minimum' | 'custom'>('total');

  const minPayment = faturaTotal * 0.15; // 15% minimum payment rule

  const payBillSchema = z.object({
    amount: z.coerce.number()
      .positive('O valor deve ser positivo.')
      .max(faturaTotal + 0.01, `O valor não pode ser maior que o total da fatura (${faturaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}).`), // +0.01 for float precision
    accountId: z.string().min(1, 'Selecione uma conta para o pagamento.'),
    paymentDate: z.date({ required_error: 'A data do pagamento é obrigatória.' }),
    paymentType: z.string(),
  });

  const form = useForm<z.infer<typeof payBillSchema>>({
    resolver: zodResolver(payBillSchema),
    defaultValues: {
      amount: faturaTotal > 0 ? faturaTotal : 0,
      accountId: card.paymentAccountId || '',
      paymentDate: new Date(),
      paymentType: 'total',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setPaymentType('total');
      form.reset({
        amount: faturaTotal > 0 ? faturaTotal : 0,
        accountId: card.paymentAccountId || '',
        paymentDate: new Date(),
        paymentType: 'total',
      })
    }
  }, [isOpen, faturaTotal, card, form]);

  const handlePaymentTypeChange = (value: 'total' | 'minimum' | 'custom') => {
    setPaymentType(value);
    form.setValue('paymentType', value);

    if (value === 'total') {
      form.setValue('amount', faturaTotal);
    } else if (value === 'minimum') {
      form.setValue('amount', minPayment);
    }
    // custom keeps current value or user types it
  };

  const onSubmit = async (values: z.infer<typeof payBillSchema>) => {
    setIsSubmitting(true);
    await onConfirm(values.amount, values.accountId, values.paymentDate, values.paymentType);
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Pagar Fatura do Cartão {card.nome}</DialogTitle>
          <DialogDescription>
            Escolha como deseja realizar o pagamento da sua fatura.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

            <div className="grid gap-4">
              <RadioGroup defaultValue="total" value={paymentType} onValueChange={(v) => handlePaymentTypeChange(v as any)} className="grid grid-cols-1 gap-4">
                <div>
                  <RadioGroupItem value="total" id="total" className="peer sr-only" />
                  <Label
                    htmlFor="total"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <div className="flex w-full justify-between items-center mb-2">
                      <span className="font-semibold text-lg">Pagamento Total</span>
                      <CheckCircle2 className={cn("h-5 w-5", paymentType === 'total' ? "text-primary" : "text-muted-foreground")} />
                    </div>
                    <div className="flex w-full justify-between items-end">
                      <span className="text-sm text-muted-foreground">Sem juros adicionais</span>
                      <span className="font-bold text-xl text-primary">
                        {faturaTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  </Label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <RadioGroupItem value="minimum" id="minimum" className="peer sr-only" />
                    <Label
                      htmlFor="minimum"
                      className="flex flex-col justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                    >
                      <span className="font-semibold mb-2">Mínimo</span>
                      <span className="text-sm text-muted-foreground mb-2">Entrada no rotativo</span>
                      <span className="font-bold text-lg">
                        {minPayment.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem value="custom" id="custom" className="peer sr-only" />
                    <Label
                      htmlFor="custom"
                      className="flex flex-col justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer h-full"
                    >
                      <span className="font-semibold mb-2">Outro Valor</span>
                      <span className="text-sm text-muted-foreground mb-2">Defina quanto pagar</span>
                      <span className="font-bold text-lg">Personalizar</span>
                    </Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {paymentType !== 'total' && (
              <Alert variant="destructive" className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertTitle className="text-red-600 dark:text-red-400">Atenção aos Juros</AlertTitle>
                <AlertDescription className="text-red-600/90 dark:text-red-400/90 text-xs mt-1">
                  Pagando menos que o total, o saldo restante (R$ {(faturaTotal - form.getValues('amount')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) entrará no crédito rotativo e haverá cobrança de juros na próxima fatura.
                </AlertDescription>
              </Alert>
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Valor a Pagar</FormLabel>
                  <FormControl>
                    <CurrencyInput
                      value={field.value}
                      onValueChange={(val) => {
                        field.onChange(val);
                        if (paymentType !== 'custom' && val !== (paymentType === 'total' ? faturaTotal : minPayment)) {
                          setPaymentType('custom');
                          form.setValue('paymentType', 'custom');
                        }
                      }}
                    />
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
                        {accounts.map((acc) => {
                          const available = Number(acc.saldoPago ?? acc.saldo ?? 0);
                          return (
                            <SelectItem key={acc.id} value={acc.id}>
                              {acc.nome} (Disp: {available.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                            </SelectItem>
                          );
                        })}
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
                            if (date) field.onChange(date);
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
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Pagamento
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
