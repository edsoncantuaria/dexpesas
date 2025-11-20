// src/components/dashboard/relatorios/card-insights-card.tsx
'use client';

import { useMemo } from 'react';
import type { Card as CardType, Transaction } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CreditCard } from 'lucide-react';

type CardInsightsCardProps = {
  cards: CardType[];
  transactions: Transaction[];
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function CardInsightsCard({ cards, transactions }: CardInsightsCardProps) {
  const data = useMemo(() => {
    return cards.map((card) => {
      const cardTransactions = transactions.filter((transaction) => transaction.cardId === card.id && transaction.tipo === 'despesa');
      const totalSpent = cardTransactions.reduce((acc, transaction) => acc + Number(transaction.valor), 0);
      const limit = Number(card.limite ?? 0);
      const availableLimit = typeof card.availableLimit === 'number' ? Number(card.availableLimit) : limit - totalSpent;
      const usage = limit > 0 ? Math.min(100, (totalSpent / limit) * 100) : 0;

      return {
        id: card.id,
        name: card.nome,
        limit,
        totalSpent,
        availableLimit,
        usage,
        status: card.status,
      };
    });
  }, [cards, transactions]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Insights de Cartões</CardTitle>
        <CardDescription>Uso do limite e gastos por cartão.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.length > 0 ? (
          <div className="space-y-3">
            {data.map((card) => (
              <div key={card.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      {card.name}
                    </p>
                    <p className="text-xs uppercase text-muted-foreground">{card.status}</p>
                  </div>
                  <div className="text-right text-sm">
                    <p>{formatCurrency(card.totalSpent)} gastos</p>
                    <p className="text-muted-foreground">
                      Disponível: {formatCurrency(card.availableLimit)}
                    </p>
                  </div>
                </div>
                <Progress value={card.usage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Limite total: {formatCurrency(card.limit)}</span>
                  <span>{card.usage.toFixed(0)}% usado</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center">Cadastre um cartão para ver os insights.</p>
        )}
      </CardContent>
    </Card>
  );
}
