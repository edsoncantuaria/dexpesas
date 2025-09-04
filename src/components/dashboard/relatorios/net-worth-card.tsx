// src/components/dashboard/relatorios/net-worth-card.tsx
'use client';

import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Transaction, Account } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, startOfDay, subMonths, isAfter, eachDayOfInterval } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { Wallet } from 'lucide-react';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

type NetWorthCardProps = {
  transactions: Transaction[];
  accounts: Account[];
};

export function NetWorthCard({ transactions, accounts }: NetWorthCardProps) {
  const isMobile = useIsMobile();
  const netWorthData = useMemo(() => {
    const sortedTransactions = [...transactions].sort((a, b) => parseISO(a.data).getTime() - parseISO(b.data).getTime());
    const initialBalance = accounts.reduce((sum, acc) => sum + Number(acc.saldoInicial), 0);
    
    if (sortedTransactions.length === 0) {
        return [{ date: format(new Date(), 'dd/MM'), patrimonio: initialBalance }];
    }

    const firstTransactionDate = parseISO(sortedTransactions[0].data);
    const datePoints = eachDayOfInterval({ start: firstTransactionDate, end: new Date() });
    
    let currentBalance = initialBalance;
    let transactionIndex = 0;
    
    const data = datePoints.map(point => {
        while (transactionIndex < sortedTransactions.length && startOfDay(parseISO(sortedTransactions[transactionIndex].data)) <= startOfDay(point)) {
            const t = sortedTransactions[transactionIndex];
            if(t.pago && t.accountId) {
                currentBalance += t.tipo === 'receita' ? Number(t.valor) : -Number(t.valor);
            }
            transactionIndex++;
        }
        return {
            date: format(point, 'dd/MM'),
            patrimonio: currentBalance,
        };
    });

    return data;
  }, [transactions, accounts]);

  const latestNetWorth = netWorthData.length > 0 ? netWorthData[netWorthData.length - 1].patrimonio : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-primary" />
          <div>
            <CardTitle>Patrimônio Líquido</CardTitle>
            <CardDescription>Evolução do saldo total de suas contas.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-4">{formatCurrency(latestNetWorth)}</div>
        {netWorthData.length > 1 ? (
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={netWorthData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                  <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
              </defs>
              <YAxis 
                  tickFormatter={(value) => formatCurrency(Number(value))} 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                  domain={['dataMin - 100', 'dataMax + 100']} 
                  hide={isMobile}
              />
              <Tooltip 
                  contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.75rem',
                  }}
                  formatter={(value: number) => [formatCurrency(value), 'Patrimônio']}
                  labelFormatter={(label) => `Data: ${label}`}
              />
              <Area type="monotone" dataKey="patrimonio" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorPatrimonio)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[150px] flex items-center justify-center text-muted-foreground">
            <p>Dados insuficientes para gerar o gráfico.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
