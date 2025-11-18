// src/components/dashboard/overview/cell-summary-card.tsx
'use client';

import Link from 'next/link';
import { Users, Activity, Wallet, ShieldCheck, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Clan, CellFund, CellBudget } from '@/lib/definitions';

type CellSummaryCardProps = {
  cell: Clan | null;
  funds: CellFund[];
  budgets: CellBudget[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function CellSummaryCard({ cell, funds, budgets }: CellSummaryCardProps) {
  if (!cell) return null;
  const totalFunds = funds.reduce((acc, fund) => acc + Number(fund.currentAmount || 0), 0);
  const topBudgets = budgets.slice(0, 3);

  return (
    <Card className="border-primary/40 shadow-sm">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-primary/10 p-2 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-headline">Célula Financeira</CardTitle>
            <p className="text-sm text-muted-foreground">Workspace compartilhado entre os membros</p>
          </div>
        </div>
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
          <Link href="/dashboard/cells" className="w-full">
            <Button className="w-full md:w-auto">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Abrir célula
            </Button>
          </Link>
          <Link href="/dashboard/cells#convites" className="w-full">
            <Button variant="outline" className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-1" />
              Convidar
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-md border bg-muted/30 p-4 flex flex-col gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Saldo compartilhado</span>
          <span className="text-2xl font-bold">{formatCurrency(Number(cell.balance || 0))}</span>
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-primary" />
            {cell._count?.members || cell.members?.length || 0} membros ativos
          </span>
        </div>
        <div className="rounded-md border bg-muted/30 p-4 flex flex-col gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Fundos em andamento</span>
          <div className="text-2xl font-bold">{formatCurrency(totalFunds)}</div>
          <div className="flex flex-wrap gap-2">
            {funds.slice(0, 3).map((fund) => (
              <Badge key={fund.id} variant="secondary" className="text-xs">
                {fund.name}
              </Badge>
            ))}
            {funds.length === 0 && <span className="text-xs text-muted-foreground">Nenhuma caixinha criada</span>}
          </div>
        </div>
        <div className="rounded-md border bg-muted/30 p-4 flex flex-col gap-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Orçamentos em foco</span>
          {topBudgets.length > 0 ? (
            <div className="space-y-1">
              {topBudgets.map((budget) => (
                <div key={budget.id} className="flex items-center justify-between text-sm">
                  <span>{budget.label || 'Orçamento'}</span>
                  <span className="font-semibold">{formatCurrency(Number(budget.limit))}</span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">Nenhum orçamento configurado</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
