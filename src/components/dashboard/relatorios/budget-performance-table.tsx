// src/components/dashboard/relatorios/budget-performance-table.tsx
'use client';

import { useMemo } from 'react';
import type { Budget } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';

type BudgetPerformanceTableProps = {
  budgets: Budget[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function BudgetPerformanceTable({ budgets }: BudgetPerformanceTableProps) {
  const topBudgets = useMemo(() => {
    return budgets
      .filter((budget) => Number(budget.limit) > 0)
      .map((budget) => {
        const limit = Number(budget.limit);
        const spent = Number(budget.spent ?? 0);
        const percent = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
        return {
          id: budget.id,
          name: budget.category?.label || budget.category?.nome || 'Sem categoria',
          spent,
          limit,
          remaining: limit - spent,
          percent,
          type: budget.cellBudgetId ? 'Família' : 'Pessoal',
        };
      })
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 6);
  }, [budgets]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Performance dos Orçamentos</CardTitle>
        <CardDescription>Top categorias com maior consumo no mês.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topBudgets.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead className="hidden sm:table-cell">Tipo</TableHead>
                <TableHead>Gasto</TableHead>
                <TableHead>Restante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topBudgets.map((budget) => (
                <TableRow key={budget.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{budget.name}</div>
                      <Progress value={budget.percent} className="h-2" />
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">{budget.type}</TableCell>
                  <TableCell>{formatCurrency(budget.spent)}</TableCell>
                  <TableCell className={budget.remaining < 0 ? 'text-destructive font-semibold' : ''}>
                    {formatCurrency(budget.remaining)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
            Cadastre orçamentos para acompanhar o desempenho.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
