// src/components/dashboard/investments/investment-projection-card.tsx
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import type { InvestmentAnalysis } from '@/lib/definitions';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type InvestmentProjectionCardProps = {
  analysis: InvestmentAnalysis | null;
};

export function InvestmentProjectionCard({ analysis }: InvestmentProjectionCardProps) {
  const [hypothetical, setHypothetical] = useState(0);
  const maxAdjustment = useMemo(() => {
    if (!analysis) return 500;
    return Math.max(500, Math.round(analysis.leisureSuggested || 0));
  }, [analysis]);

  if (!analysis) {
    return null;
  }

  const suggestedInvestment = analysis.suggestedInvestment || 0;
  const suggestedLeisure = analysis.leisureSuggested || 0;

  const projectedInvestment = Math.max(0, suggestedInvestment + hypothetical);
  const projectedLeisure = Math.max(0, suggestedLeisure - hypothetical);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Modo Projeção</CardTitle>
        <CardDescription>Responda rapidamente "E se eu ajustar o lazer este mês?"</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Simule reduzir ou aumentar o lazer em até {currencyFormatter.format(maxAdjustment)} para observar o impacto
            nos investimentos sugeridos.
          </p>
          <p className="text-sm font-semibold">
            Ajustando: <span className="text-primary">{currencyFormatter.format(hypothetical)}</span>
          </p>
        </div>
        <Slider
          min={-maxAdjustment}
          max={maxAdjustment}
          step={50}
          value={[hypothetical]}
          onValueChange={(value) => setHypothetical(value[0] ?? 0)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border-blue-500/20 p-4">
            <p className="text-xs uppercase font-semibold text-muted-foreground">Investimento projetado</p>
            <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{currencyFormatter.format(projectedInvestment)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Base atual: {currencyFormatter.format(suggestedInvestment)}
            </p>
          </div>
          <div className="rounded-xl border bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border-amber-500/20 p-4">
            <p className="text-xs uppercase font-semibold text-muted-foreground">Lazer restante</p>
            <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-amber-600 to-yellow-600 bg-clip-text text-transparent">{currencyFormatter.format(projectedLeisure)}</p>
            <p className="text-xs text-muted-foreground mt-1">Base atual: {currencyFormatter.format(suggestedLeisure)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default InvestmentProjectionCard;
