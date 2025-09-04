
// src/components/dashboard/perfil/legacy-ruin-card.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { LegacyRuin } from '@/lib/definitions';
import { format, formatDistance, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Swords, Calendar, Coins } from 'lucide-react';

interface LegacyRuinCardProps {
  ruin: LegacyRuin;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function LegacyRuinCard({ ruin }: LegacyRuinCardProps) {
  const startDate = parseISO(ruin.startDate);
  const endDate = parseISO(ruin.endDate);
  const duration = formatDistance(endDate, startDate, { locale: ptBR });
  const totalAmount = Number(ruin.totalAmountPaid);
  const totalInterest = Number(ruin.totalInterestPaid);

  return (
    <Card className="bg-muted/30 border-dashed border-2 hover:border-solid hover:border-primary/50 transition-all">
      <CardHeader>
        <CardTitle className="font-headline text-lg">{ruin.name}</CardTitle>
        <CardDescription>
          Derrotada em {format(endDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Coins className="h-4 w-4" />
            Total Pago
          </span>
          <span className="font-semibold">{formatCurrency(totalAmount)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Duração da Batalha
          </span>
          <span className="font-semibold">{duration}</span>
        </div>
        {totalInterest > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <Swords className="h-4 w-4 text-destructive" />
              Tributo aos Juros
            </span>
            <span className="font-semibold text-destructive">{formatCurrency(totalInterest)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

    