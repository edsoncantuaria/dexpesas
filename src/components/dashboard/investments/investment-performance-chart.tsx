// src/components/dashboard/investments/investment-performance-chart.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { InvestmentMonthlyTotal, InvestmentSnapshot } from '@/lib/definitions';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type InvestmentPerformanceChartProps = {
  snapshots: InvestmentSnapshot[];
  monthlyTotals: InvestmentMonthlyTotal[];
};

function buildChartData(
  snapshots: InvestmentSnapshot[],
  monthlyTotals: InvestmentMonthlyTotal[],
): { month: string; label: string; totalInvested?: number; totalReturns?: number; contributions?: number }[] {
  const map = new Map<string, { month: string; label: string; totalInvested?: number; totalReturns?: number; contributions?: number }>();

  monthlyTotals.forEach((entry) => {
    const label = format(parseISO(`${entry.month}-01`), 'MMM yy', { locale: ptBR });
    map.set(entry.month, {
      month: entry.month,
      label,
      contributions: entry.amount,
      totalInvested: undefined,
      totalReturns: undefined,
    });
  });

  snapshots.forEach((snapshot) => {
    const label = format(parseISO(`${snapshot.month}-01`), 'MMM yy', { locale: ptBR });
    const existing = map.get(snapshot.month) ?? { month: snapshot.month, label };
    map.set(snapshot.month, {
      ...existing,
      totalInvested: snapshot.totalInvested,
      totalReturns: snapshot.totalReturns,
    });
  });

  return Array.from(map.values()).sort((a, b) => (a.month > b.month ? 1 : -1));
}

export function InvestmentPerformanceChart({ snapshots, monthlyTotals }: InvestmentPerformanceChartProps) {
  const chartData = buildChartData(snapshots, monthlyTotals);

  return (
    <Card className="h-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Rentabilidade</CardTitle>
        <CardDescription>Evolução dos aportes e do total investido por mês.</CardDescription>
      </CardHeader>
      <CardContent className="h-[360px]">
        {chartData.length === 0 ? (
          <div className="text-sm text-muted-foreground">Ainda não há dados suficientes para montar o gráfico.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis tickFormatter={(value) => currencyFormatter.format(value as number)} />
              <Tooltip formatter={(value) => currencyFormatter.format(value as number)} />
              <Legend />
              <Bar dataKey="contributions" name="Aportes" barSize={24} fill="#22c55e" />
              <Line type="monotone" dataKey="totalInvested" name="Total investido" stroke="#2563eb" strokeWidth={2} />
              <Line
                type="monotone"
                dataKey="totalReturns"
                name="Rentabilidade acumulada"
                stroke="#f97316"
                strokeWidth={2}
                strokeDasharray="6 4"
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}

export default InvestmentPerformanceChart;
