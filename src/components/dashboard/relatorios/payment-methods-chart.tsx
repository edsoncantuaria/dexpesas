// src/components/dashboard/relatorios/payment-methods-chart.tsx
'use client';

import { useMemo } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Transaction } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const COLORS = {
  credito: 'hsl(var(--chart-1))',
  debito: 'hsl(var(--chart-2))',
  pix: 'hsl(var(--chart-3))',
  dinheiro: 'hsl(var(--chart-4))',
};

const METHOD_NAMES = {
  credito: 'Crédito',
  debito: 'Débito',
  pix: 'PIX',
  dinheiro: 'Dinheiro',
};

type PaymentMethodsChartProps = {
  transactions: Transaction[];
};

export function PaymentMethodsChart({ transactions }: PaymentMethodsChartProps) {
  const isMobile = useIsMobile();
  const paymentMethodData = useMemo(() => {
    const methodTotals: { [key: string]: number } = {
        credito: 0, debito: 0, pix: 0, dinheiro: 0
    };
    
    transactions
      .filter(t => t.tipo === 'despesa')
      .forEach(t => {
        methodTotals[t.metodoPagamento] += Number(t.valor);
      });
      
    return Object.entries(methodTotals)
      .map(([name, value]) => ({ 
          name: METHOD_NAMES[name as keyof typeof METHOD_NAMES], 
          value,
          fill: COLORS[name as keyof typeof COLORS] 
        }))
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Método de Pagamento</CardTitle>
        <CardDescription>Distribuição de gastos no período.</CardDescription>
      </CardHeader>
      <CardContent>
        {paymentMethodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
                <PieChart>
                    <Pie
                        data={paymentMethodData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        dataKey="value"
                        nameKey="name"
                    >
                        {paymentMethodData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                        ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: number, name: string, props) => {
                            const total = props.payload.value;
                            const allTotal = paymentMethodData.reduce((acc, curr) => acc + curr.value, 0);
                            const percentage = allTotal > 0 ? (total / allTotal) * 100 : 0;
                            return `${formatCurrency(total)} (${percentage.toFixed(1)}%)`
                        }}
                        contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                            color: 'hsl(var(--foreground))',
                        }}
                    />
                    <Legend wrapperStyle={{ fontSize: '0.875rem' }}/>
                </PieChart>
            </ResponsiveContainer>
        ) : (
             <div className="h-[250px] flex items-center justify-center text-muted-foreground md:h-[300px]">
                <p>Nenhuma despesa para exibir.</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
