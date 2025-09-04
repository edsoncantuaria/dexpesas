
// src/components/dashboard/cartoes/add-card-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Account, Card } from '@/lib/definitions';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Separator } from '@/components/ui/separator';
import api from '@/lib/api';

const formSchema = z.object({
  nome: z.string().min(3, { message: 'O nome do cartão deve ter pelo menos 3 caracteres.' }),
  limite: z.coerce.number().positive({ message: 'O limite deve ser um número positivo.' }),
  diaFechamento: z.coerce.number().min(1).max(31, { message: 'Dia inválido.' }),
  diaVencimento: z.coerce.number().min(1).max(31, { message: 'Dia inválido.' }),
  bandeira: z.enum(['visa', 'mastercard', 'elo', 'amex'], { required_error: 'Selecione a bandeira.' }),
  rewardsType: z.string().optional(),
  rewardsProgram: z.string().optional(),
  rewardsConversionRate: z.coerce.number().min(0, "A taxa de conversão não pode ser negativa.").optional().nullable(),
  currencyForConversion: z.enum(['BRL', 'USD']).optional().nullable(),
  jurosRotativo: z.coerce.number().min(0, "A taxa de juros não pode ser negativa.").optional().nullable(),
  paymentAccountId: z.string().optional(),
});

type AddCardFormProps = {
    card?: Card | null;
    onSuccess: (card: Omit<Card, 'id' | 'userId' | 'saldoFatura' | 'bestDayToBuy'> & { id?: string }) => void;
    onClose: () => void;
    isSubmitting: boolean;
};

export function AddCardForm({ card, onSuccess, onClose, isSubmitting }: AddCardFormProps) {
  const isEditing = !!card;
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    // Busca as contas correntes para o select
    const fetchAccounts = async () => {
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data.filter((acc: Account) => acc.tipo === 'corrente'));
        } catch (error) {
            console.error("Erro ao buscar contas", error);
        }
    }
    fetchAccounts();
  }, []);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      limite: 0,
      diaFechamento: 1,
      diaVencimento: 10,
      rewardsType: 'nenhum',
      rewardsProgram: '',
      rewardsConversionRate: 1.0,
      currencyForConversion: 'BRL',
      jurosRotativo: 14.9,
      paymentAccountId: 'none',
    },
  });

  useEffect(() => {
    if (card) {
        form.reset({
            ...card,
            jurosRotativo: card.jurosRotativo ?? 14.9,
            rewardsType: card.rewardsType ?? 'nenhum',
            rewardsConversionRate: card.rewardsConversionRate ?? 1.0,
            currencyForConversion: card.currencyForConversion ?? 'BRL',
            paymentAccountId: card.paymentAccountId || 'none',
        });
    }
  }, [card, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    const cardData = isEditing ? { ...values, id: card.id } : values;
    onSuccess(cardData);
  }
  
  const watchRewardsType = form.watch('rewardsType');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="nome" render={({ field }) => ( <FormItem><FormLabel>Nome do Cartão</FormLabel><FormControl><Input placeholder="Ex: Cartão Platinum" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="bandeira" render={({ field }) => ( <FormItem><FormLabel>Bandeira</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione a bandeira" /></SelectTrigger></FormControl><SelectContent><SelectItem value="visa">Visa</SelectItem><SelectItem value="mastercard">Mastercard</SelectItem><SelectItem value="elo">Elo</SelectItem><SelectItem value="amex">American Express</SelectItem></SelectContent></Select><FormMessage /></FormItem> )}/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField control={form.control} name="limite" render={({ field }) => ( <FormItem><FormLabel>Limite do Cartão</FormLabel><FormControl><CurrencyInput value={field.value} onValueChange={field.onChange} /></FormControl><FormMessage /></FormItem> )}/>
          <FormField control={form.control} name="jurosRotativo" render={({ field }) => ( <FormItem><FormLabel>Juros do Rotativo (%)</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )}/>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField control={form.control} name="diaFechamento" render={({ field }) => ( <FormItem><FormLabel>Dia do Fechamento</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <FormField control={form.control} name="diaVencimento" render={({ field }) => ( <FormItem><FormLabel>Dia do Vencimento</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )}/>
        </div>
        
         <FormField
            control={form.control}
            name="paymentAccountId"
            render={({ field }) => (
                <FormItem>
                    <FormLabel>Conta Padrão para Pagamento (Opcional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione a conta para pagar a fatura" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="none">Nenhuma</SelectItem>
                            {accounts.map(acc => (
                                <SelectItem key={acc.id} value={acc.id}>{acc.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
            )}
        />

        <div className="space-y-4 rounded-lg border p-4">
            <h4 className="text-sm font-medium">Programa de Benefícios (Opcional)</h4>
            <Separator/>
             <FormField control={form.control} name="rewardsType" render={({ field }) => (
                <FormItem>
                <FormLabel>Tipo de Benefício</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="nenhum">Nenhum</SelectItem>
                        <SelectItem value="cashback">Cashback (%)</SelectItem>
                        <SelectItem value="milhas">Milhas</SelectItem>
                        <SelectItem value="pontos">Pontos</SelectItem>
                    </SelectContent>
                </Select><FormMessage />
                </FormItem>
            )}/>

            {watchRewardsType !== 'nenhum' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <FormField control={form.control} name="rewardsProgram" render={({ field }) => ( <FormItem><FormLabel>Nome do Programa</FormLabel><FormControl><Input placeholder="Ex: Livelo, Smiles, etc." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )}/>
                    <FormField control={form.control} name="rewardsConversionRate" render={({ field }) => ( <FormItem><FormLabel>Taxa de Conversão</FormLabel><FormControl><Input type="number" step="0.1" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem> )}/>
                    <FormField control={form.control} name="currencyForConversion" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Moeda de Conversão</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? 'BRL'} disabled={watchRewardsType === 'cashback'}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="BRL">Real (BRL)</SelectItem>
                                <SelectItem value="USD">Dólar (USD)</SelectItem>
                            </SelectContent>
                        </Select><FormMessage />
                        </FormItem>
                    )}/>
                </div>
            )}
        </div>
        
        <div className="flex justify-end pt-4 gap-2">
             <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
             <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Adicionar Cartão'}
            </Button>
        </div>
      </form>
    </Form>
  );
}
