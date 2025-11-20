// src/components/dashboard/relatorios/cashflow-forecast-chart.tsx
'use client';

import { useMemo } from 'react';
import type { Account, Transaction } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { addDays, eachDayOfInterval, format, parseISO, subDays } from 'date-fns';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

type CashflowForecastChartProps = {
  transactions: Transaction[];
  accounts: Account[];
};

type ChartPoint = {
  date: string;
  realBalance: number | null;
  projectedBalance: number | null;
};

export function CashflowForecastChart({ transactions, accounts }: CashflowForecastChartProps) {
  const { chartData, avgNet } = useMemo(() => {
    const today = new Date();
    const historyStart = subDays(today, 30);
    const historyDays = eachDayOfInterval({ start: historyStart, end: today });

    const netByDay = new Map<string, number>();
    transactions.forEach((transaction) => {
      const transactionDate = parseISO(transaction.data);
      if (transactionDate < historyStart || transactionDate > today) return;
      const key = format(transactionDate, 'yyyy-MM-dd');
      const amount = Number(transaction.valor) * (transaction.tipo === 'receita' ? 1 : -1);
      netByDay.set(key, (netByDay.get(key) || 0) + amount);
    });

    const totalHistoryNet = Array.from(netByDay.values()).reduce((acc, value) => acc + value, 0);
    const totalBalance = accounts.reduce((acc, account) => acc + Number(account.saldo ?? account.saldoInicial ?? 0), 0);
    const baseBalance = totalBalance - totalHistoryNet;

    let runningBalance = baseBalance;
    const historicalPoints = historyDays.map((day) => {
      const key = format(day, 'yyyy-MM-dd');
      runningBalance += netByDay.get(key) || 0;
      return { date: format(day, 'dd/MM'), realBalance: runningBalance };
    });

    const avgNetPerDay = historyDays.length > 0 ? totalHistoryNet / historyDays.length : 0;
    const lastRealBalance = historicalPoints.at(-1)?.realBalance ?? totalBalance;

    const forecastPoints = Array.from({ length: 14 }, (_, index) => {
      const date = addDays(today, index + 1);
      const projectedBalance = lastRealBalance + avgNetPerDay * (index + 1);
      return {
        date: format(date, 'dd/MM'),
        projectedBalance,
      };
    });

    const chartData: ChartPoint[] = [
      ...historicalPoints.map((point, index, array) => ({
        date: point.date,
        realBalance: point.realBalance,
        projectedBalance: index === array.length - 1 ? point.realBalance : null,
      })),
      ...forecastPoints.map((point) => ({
        date: point.date,
        realBalance: null,
        projectedBalance: point.projectedBalance,
      })),
    ];

    return { chartData, avgNet: avgNetPerDay };
  }, [transactions, accounts]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Projeção de Fluxo de Caixa</CardTitle>
        <CardDescription>
          Usa a média líquida dos últimos 30 dias para estimar os próximos 14 dias.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <>
            <p className="mb-3 text-sm text-muted-foreground">
              Média diária: <span className={avgNet >= 0 ? 'text-emerald-500' : 'text-destructive'}>{formatCurrency(avgNet)}</span>
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(value) => formatCurrency(Number(value))} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="realBalance" name="Saldo real" stroke="hsl(var(--primary))" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="projectedBalance" name="Projeção" stroke="hsl(var(--chart-2))" strokeDasharray="5 5" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </>
        ) : (
          <div className="h-[260px] flex items-center justify-center text-muted-foreground">
            <p>Adicione transações recentes para gerar a projeção.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
