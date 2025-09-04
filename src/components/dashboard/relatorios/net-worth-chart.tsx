// src/components/dashboard/relatorios/net-worth-chart.tsx
'use client';

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Transaction, Account } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, startOfDay, subMonths, isAfter } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

type NetWorthChartProps = {
  transactions: Transaction[];
  accounts: Account[];
};

export function NetWorthChart({ transactions, accounts }: NetWorthChartProps) {
  const isMobile = useIsMobile();
  const netWorthData = useMemo(() => {
    const sortedTransactions = [...transactions].sort((a, b) => parseISO(a.data).getTime() - parseISO(b.data).getTime());
    const initialBalance = accounts.reduce((sum, acc) => sum + Number(acc.saldo), 0);
    
    const data: { date: string; patrimonio: number }[] = [];
    let currentBalance = initialBalance;

    const balanceByDay: { [key: string]: number } = {};

    sortedTransactions.forEach(t => {
      const dateStr = format(startOfDay(parseISO(t.data)), 'yyyy-MM-dd');
      if (t.tipo === 'receita') {
        currentBalance += Number(t.valor);
      } else {
        currentBalance -= Number(t.valor);
      }
      balanceByDay[dateStr] = currentBalance;
    });

    // Create a point for each day from 6 months ago to today
    const sixMonthsAgo = subMonths(new Date(), 6);
    let date = sixMonthsAgo;
    let lastKnownBalance = initialBalance;
    
    // Find first balance before our time window
    const firstTransactionDate = sortedTransactions.length > 0 ? startOfDay(parseISO(sortedTransactions[0].data)) : new Date();
    if(isAfter(sixMonthsAgo, firstTransactionDate)) {
        let tempBalance = initialBalance;
        for (const t of sortedTransactions) {
            const tDate = startOfDay(parseISO(t.data));
            if(isAfter(tDate, sixMonthsAgo)) break;

            if (t.tipo === 'receita') tempBalance += Number(t.valor);
            else tempBalance -= Number(t.valor);
            lastKnownBalance = tempBalance;
        }
    }


    while (date <= new Date()) {
      const dateStr = format(date, 'yyyy-MM-dd');
      if(balanceByDay[dateStr]) {
        lastKnownBalance = balanceByDay[dateStr];
      }
      data.push({
        date: format(date, 'dd/MM'),
        patrimonio: lastKnownBalance,
      });
      date.setDate(date.getDate() + 1);
    }
    
    return data;
  }, [transactions, accounts]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Evolução do Patrimônio</CardTitle>
        <CardDescription>Crescimento do seu saldo total ao longo do tempo.</CardDescription>
      </CardHeader>
      <CardContent>
         {netWorthData.length > 0 ? (
        <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
          <AreaChart data={netWorthData} margin={{ top: 10, right: isMobile ? 5 : 30, left: isMobile ? -20 : 0, bottom: 0 }}>
             <defs>
                <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
            <YAxis 
                tickFormatter={(value) => formatCurrency(Number(value))} 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} 
                domain={['dataMin - 1000', 'dataMax + 1000']} 
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
            <Area type="monotone" dataKey="patrimonio" stroke="hsl(var(--accent))" fillOpacity={1} fill="url(#colorPatrimonio)" name="Patrimônio" strokeWidth={2}/>
          </AreaChart>
        </ResponsiveContainer>
         ) : (
             <div className="h-[250px] flex items-center justify-center text-muted-foreground md:h-[300px]">
                <p>Nenhum dado para exibir.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
