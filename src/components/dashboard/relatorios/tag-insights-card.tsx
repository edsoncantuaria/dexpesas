// src/components/dashboard/relatorios/tag-insights-card.tsx
'use client';

import { useMemo } from 'react';
import type { Transaction } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

type TagInsightsCardProps = {
  transactions: Transaction[];
};

export function TagInsightsCard({ transactions }: TagInsightsCardProps) {
  const topTags = useMemo(() => {
    const totals = new Map<
      string,
      {
        id: string;
        name: string;
        total: number;
        count: number;
      }
    >();

    transactions
      .filter((transaction) => transaction.tipo === 'despesa')
      .forEach((transaction) => {
        transaction.tags?.forEach((tag) => {
          const current = totals.get(tag.id) || { id: tag.id, name: tag.name, total: 0, count: 0 };
          totals.set(tag.id, {
            id: tag.id,
            name: tag.name,
            total: current.total + Number(transaction.valor),
            count: current.count + 1,
          });
        });
      });

    return Array.from(totals.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);
  }, [transactions]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tags e Projetos</CardTitle>
        <CardDescription>Despesas agrupadas pelas tags mais usadas.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {topTags.length > 0 ? (
          topTags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-1">
                <Badge variant="secondary">{tag.name}</Badge>
                <p className="text-xs text-muted-foreground">{tag.count} lançamentos</p>
              </div>
              <p className="font-semibold">{formatCurrency(tag.total)}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center">Use tags nas transações para gerar este relatório.</p>
        )}
      </CardContent>
    </Card>
  );
}
