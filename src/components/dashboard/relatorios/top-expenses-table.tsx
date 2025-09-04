// src/components/dashboard/relatorios/top-expenses-table.tsx
'use client';

import type { Transaction } from '@/lib/definitions';
import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown } from 'lucide-react';

type TopExpensesTableProps = {
  transactions: Transaction[];
};

export function TopExpensesTable({ transactions }: TopExpensesTableProps) {
  const topExpenses = useMemo(() => {
    return [...transactions]
      .filter(t => t.tipo === 'despesa')
      .sort((a, b) => Number(b.valor) - Number(a.valor))
      .slice(0, 10);
  }, [transactions]);

  return (
    <div className="space-y-3">
        <h3 className="text-md font-semibold">Maiores Despesas do Período</h3>
        {topExpenses.length > 0 ? (
            topExpenses.map(t => (
                <Card key={t.id} className="bg-muted/30">
                    <CardContent className="p-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="p-2 bg-red-500/10 rounded-full">
                                <TrendingDown className="h-5 w-5 text-red-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">{t.descricao}</p>
                                <div className="flex items-center gap-2 flex-wrap mt-1">
                                    <Badge variant="outline">{t.categoria}</Badge>
                                    <span className="text-xs text-muted-foreground">{format(new Date(t.data), 'dd/MM/yy', { locale: ptBR })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-lg text-destructive">
                                -{Number(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            ))
        ) : (
             <div className="text-center text-muted-foreground py-8">
                <p>Nenhuma despesa encontrada no período.</p>
            </div>
        )}
    </div>
  );
}
