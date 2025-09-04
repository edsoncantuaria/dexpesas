// src/components/dashboard/relatorios/daily-flow-chart.tsx
'use client';

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Transaction } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, parseISO } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

type DailyFlowChartProps = {
  transactions: Transaction[];
};

export function DailyFlowChart({ transactions }: DailyFlowChartProps) {
  const isMobile = useIsMobile();
  const dailyFlow = useMemo(() => {
    if (transactions.length === 0) return [];
    
    const dates = transactions.map(t => parseISO(t.data));
    const firstDate = new Date(Math.min.apply(null, dates.map(d => d.getTime())));
    const lastDate = new Date(Math.max.apply(null, dates.map(d => d.getTime())));

    const interval = eachDayOfInterval({
      start: startOfMonth(firstDate),
      end: endOfMonth(lastDate),
    });

    const flowData = interval.map(day => ({
      date: format(day, 'dd/MM'),
      receitas: 0,
      despesas: 0,
    }));

    transactions.forEach(t => {
      const dayIndex = interval.findIndex(d => format(d, 'yyyy-MM-dd') === format(parseISO(t.data), 'yyyy-MM-dd'));
      if (dayIndex === -1) return;

      if (t.tipo === 'receita') {
        flowData[dayIndex].receitas += Number(t.valor);
      } else {
        flowData[dayIndex].despesas += Number(t.valor);
      }
    });

    return flowData;
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fluxo Diário de Caixa</CardTitle>
        <CardDescription>Receitas vs. Despesas ao longo do período filtrado.</CardDescription>
      </CardHeader>
      <CardContent>
        {dailyFlow.length > 0 ? (
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <AreaChart data={dailyFlow} margin={{ top: 10, right: isMobile ? 5 : 30, left: isMobile ? -20 : 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis 
                      tickFormatter={(value) => formatCurrency(Number(value))} 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      />
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <Tooltip 
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            color: 'hsl(var(--foreground))',
                        }}
                        formatter={(value: number) => formatCurrency(value)}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.875rem' }}/>
                    <Area type="monotone" dataKey="despesas" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorDespesas)" name="Despesas" strokeWidth={2}/>
                    <Area type="monotone" dataKey="receitas" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorReceitas)" name="Receitas" strokeWidth={2}/>
                </AreaChart>
            </ResponsiveContainer>
        ) : (
             <div className="h-[250px] flex items-center justify-center text-muted-foreground md:h-[300px]">
                <p>Nenhum dado para exibir no período selecionado.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
