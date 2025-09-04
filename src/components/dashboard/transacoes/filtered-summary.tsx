// src/components/dashboard/transacoes/filtered-summary.tsx
'use client';

import { useMemo } from 'react';
import type { Transaction } from '@/lib/definitions';
import type { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type FilteredSummaryProps = {
  transactions: Transaction[];
  dateRange: DateRange;
};

export function FilteredSummary({ transactions, dateRange }: FilteredSummaryProps) {
    
  const { income, incomeForecast, expense, expenseForecast, balance, balanceForecast } = useMemo(() => {
    const income = transactions.filter(t => t.tipo === 'receita' && t.pago).reduce((acc, t) => acc + Number(t.valor), 0);
    const incomeForecast = transactions.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + Number(t.valor), 0);

    const expense = transactions.filter(t => t.tipo === 'despesa' && t.pago).reduce((acc, t) => acc + Number(t.valor), 0);
    const expenseForecast = transactions.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + Number(t.valor), 0);
    
    const balance = income - expense;
    const balanceForecast = incomeForecast - expenseForecast;
    
    return { income, incomeForecast, expense, expenseForecast, balance, balanceForecast };
  }, [transactions]);
  
  const formattedDateRange = () => {
    if (!dateRange.from) return '';
    const from = format(dateRange.from, "dd/MM/yy", { locale: ptBR });
    if (!dateRange.to) return from;
    const to = format(dateRange.to, "dd/MM/yy", { locale: ptBR });
    return `${from} - ${to}`;
  }

  return (
    <Card className="rounded-2xl shadow-lg bg-card border-primary/50">
        <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Balanço do Filtro</CardTitle>
            <CardDescription>{formattedDateRange()}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="text-center py-2">
                <div className="text-4xl font-bold">
                    {Number(balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-sm text-muted-foreground">
                    Previsto: {Number(balanceForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
            </div>
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center text-green-500 gap-2">
                    <ArrowUpRight className="h-5 w-5 flex-shrink-0"/>
                    <div>
                        <p className="text-xs text-muted-foreground font-semibold">Receitas</p>
                        <p className="font-bold text-lg">{Number(income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p className="text-xs text-muted-foreground">Previsto: {Number(incomeForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                </div>
                    <div className="flex items-center text-red-500 gap-2">
                    <ArrowDownLeft className="h-5 w-5 flex-shrink-0"/>
                    <div className='text-right'>
                        <p className="text-xs text-muted-foreground font-semibold">Despesas</p>
                        <p className="font-bold text-lg">{Number(expense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p className="text-xs text-muted-foreground">Previsto: {Number(expenseForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
  );
}
