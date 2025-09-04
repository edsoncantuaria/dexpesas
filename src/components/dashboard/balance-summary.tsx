// src/components/dashboard/balance-summary.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Transaction } from '@/lib/definitions';
import { ArrowDownLeft, ArrowUpRight, Scale } from 'lucide-react';
import Link from 'next/link';
import { useMemo } from 'react';

type BalanceSummaryProps = {
  transactions: Transaction[];
};

export function BalanceSummary({ transactions }: BalanceSummaryProps) {
  const { income, expense, balance } = useMemo(() => {
    const income = transactions
      .filter((t) => t.tipo === 'receita')
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const expense = transactions
      .filter((t) => t.tipo === 'despesa')
      .reduce((acc, t) => acc + Number(t.valor), 0);

    const balance = income - expense;
    return { income, expense, balance };
  }, [transactions]);


  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      <Link href="/dashboard/transacoes?tipo=receita" className="group">
        <Card className="transition-all group-hover:shadow-lg group-hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Total de receitas no período</p>
          </CardContent>
        </Card>
      </Link>
      <Link href="/dashboard/transacoes?tipo=despesa" className="group">
        <Card className="transition-all group-hover:shadow-lg group-hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <ArrowDownLeft className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Total de despesas no período</p>
          </CardContent>
        </Card>
      </Link>
      <Link href="/dashboard/transacoes" className="group">
        <Card className="transition-all group-hover:shadow-lg group-hover:border-primary/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balanço</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${balance >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">Balanço final do período</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}
