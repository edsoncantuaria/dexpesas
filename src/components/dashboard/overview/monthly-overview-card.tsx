// src/components/dashboard/overview/monthly-overview-card.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ArrowDownRight, ArrowUpRight, Download, Wallet } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { FinancialOverview } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';

type MonthlyOverviewCardProps = {
  overview: FinancialOverview | null;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function MonthlyOverviewCard({ overview }: MonthlyOverviewCardProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      const response = await api.post(
        '/transactions/export',
        {
          includePending: true,
          dateRange: {
            from: start.toISOString(),
            to: end.toISOString(),
          },
        },
        { responseType: 'blob' }
      );

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resumo-mensal-${start.getFullYear()}-${start.getMonth() + 1}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Exportação iniciada!' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao exportar',
        description: 'Tente novamente em instantes.',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!overview) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Resumo do mês</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { monthSummary, accounts, budgets, categoryHighlights, alerts } = overview;
  const badgeCount = alerts.length;

  return (
    <Card className="shadow-md border-primary/10">
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Resumo financeiro do mês</CardTitle>
            <p className="text-sm text-muted-foreground">
              Saldo consolidado, contas e categorias mais ativas.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {badgeCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              +{badgeCount} alertas
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
            <Download className="h-4 w-4 mr-2" />
            {isExporting ? 'Exportando...' : 'Exportar mês atual'}
          </Button>
          <Link href="/dashboard/reconcile" className="text-sm text-primary underline-offset-2 hover:underline">
            Reconciliar extratos
          </Link>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Resultado do mês</p>
            <p className="text-3xl font-bold">{formatCurrency(monthSummary.balance)}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              Projeção{' '}
              {monthSummary.projectedBalance >= monthSummary.balance ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-destructive" />
              )}
              {formatCurrency(monthSummary.projectedBalance)}
            </p>
            {monthSummary.variationPercentage !== null && (
              <p
                className={cn(
                  'text-xs font-semibold mt-1 flex items-center gap-1',
                  monthSummary.variationPercentage >= 0 ? 'text-green-600' : 'text-destructive'
                )}
              >
                {monthSummary.variationPercentage >= 0 ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(monthSummary.variationPercentage).toFixed(1)}% vs. mês anterior
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground text-xs">Recebido</p>
              <p className="font-semibold">{formatCurrency(monthSummary.received)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground text-xs">Pago</p>
              <p className="font-semibold">{formatCurrency(monthSummary.spent)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground text-xs">A receber</p>
              <p className="font-semibold">{formatCurrency(monthSummary.toReceive)}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-muted-foreground text-xs">A pagar</p>
              <p className="font-semibold">{formatCurrency(monthSummary.toPay)}</p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Saldo por conta</p>
            <Link href="/dashboard/contas" className="text-xs text-primary underline-offset-2 hover:underline">
              ver contas
            </Link>
          </div>
          <div className="space-y-2">
            {accounts.slice(0, 4).map((account) => (
              <div key={account.id} className="flex items-center justify-between rounded-md border p-2">
                <div>
                  <p className="text-sm font-medium">{account.nome}</p>
                  <p className="text-xs text-muted-foreground">{account.instituicao || account.tipo}</p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(account.saldo)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Categorias do mês</p>
            <Link href="/dashboard/relatorios" className="text-xs text-primary underline-offset-2 hover:underline">
              ver relatórios
            </Link>
          </div>
          {categoryHighlights.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={categoryHighlights} margin={{ left: 0, right: 0 }}>
                <XAxis dataKey="label" hide />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  cursor={{ fill: 'hsl(var(--muted))' }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-sm text-muted-foreground">Sem categorias registradas neste mês.</div>
          )}
          <div className="space-y-2">
            {budgets.slice(0, 3).map((budget) => {
              const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
              return (
                <div key={budget.id}>
                  <div className="flex items-center justify-between text-xs">
                    <p>{budget.label}</p>
                    <p>
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                    </p>
                  </div>
                  <Progress value={Math.min(percentage, 120)} />
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/orcamentos" className="flex-1">
              <Button variant="secondary" className="w-full">
                Criar orçamento
              </Button>
            </Link>
            <Link href="/dashboard/metas" className="flex-1">
              <Button variant="outline" className="w-full">
                Nova meta
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
