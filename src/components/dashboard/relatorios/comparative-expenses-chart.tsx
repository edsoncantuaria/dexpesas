// src/components/dashboard/relatorios/comparative-expenses-chart.tsx
'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Transaction } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { differenceInDays, sub } from 'date-fns';
import type { DateRange } from 'react-day-picker';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

type ComparativeExpensesChartProps = {
  transactions: Transaction[];
  currentDateRange?: DateRange;
};

export function ComparativeExpensesChart({ transactions, currentDateRange }: ComparativeExpensesChartProps) {
    const data = useMemo(() => {
        if (!currentDateRange || !currentDateRange.from) return [];

        const to = currentDateRange.to || new Date();
        const duration = differenceInDays(to, currentDateRange.from);

        const previousPeriod = {
            from: sub(currentDateRange.from, { days: duration + 1 }),
            to: sub(to, { days: duration + 1 }),
        };

        const currentExpenses = transactions
            .filter(t => t.tipo === 'despesa' && new Date(t.data) >= currentDateRange.from! && new Date(t.data) <= to)
            .reduce((sum, t) => sum + Number(t.valor), 0);

        const previousExpenses = transactions
            .filter(t => t.tipo === 'despesa' && new Date(t.data) >= previousPeriod.from && new Date(t.data) <= previousPeriod.to)
            .reduce((sum, t) => sum + Number(t.valor), 0);
        
        return [
            { name: 'Período Anterior', despesas: previousExpenses },
            { name: 'Período Atual', despesas: currentExpenses },
        ];

    }, [transactions, currentDateRange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas: Período Atual vs. Anterior</CardTitle>
        <CardDescription>Comparativo dos seus gastos com o período equivalente anterior.</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(value) => formatCurrency(Number(value))} tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                cursor={{ fill: 'hsl(var(--muted))' }}
              />
              <Legend />
              <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground">
            <p>Selecione um período para ver a comparação.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
