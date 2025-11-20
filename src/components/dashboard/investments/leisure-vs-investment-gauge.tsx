// src/components/dashboard/investments/leisure-vs-investment-gauge.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { InvestmentAnalysis, InvestmentContribution } from '@/lib/definitions';
import { useMemo } from 'react';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type BasicNeed = {
  key: string;
  label: string;
  limit: number;
  spent: number;
};

type LeisureVsInvestmentGaugeProps = {
  analysis: InvestmentAnalysis | null;
  contributions: InvestmentContribution[];
  month: string;
  basicNeeds?: BasicNeed[];
};

export function LeisureVsInvestmentGauge({
  analysis,
  contributions,
  month,
  basicNeeds = [],
}: LeisureVsInvestmentGaugeProps) {
  const currentMonthInvested = useMemo(
    () =>
      contributions
        .filter((contribution) => contribution.month === month)
        .reduce((acc, contribution) => acc + (contribution.amount || 0), 0),
    [contributions, month],
  );

  const suggestedInvestment = analysis?.suggestedInvestment ?? 0;
  const leisureSuggested = analysis?.leisureSuggested ?? 0;
  const leisureSpent = analysis?.leisureSpent ?? 0;

  const investmentProgress = suggestedInvestment > 0 ? Math.min(100, (currentMonthInvested / suggestedInvestment) * 100) : 0;
  const leisureProgress = leisureSuggested > 0 ? Math.min(100, (leisureSpent / leisureSuggested) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Lazer vs. Investimentos</CardTitle>
        <CardDescription>Compare o que foi investido e gasto em lazer com o plano sugerido.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Investido no mês</span>
            <span>
              {currencyFormatter.format(currentMonthInvested)} / {currencyFormatter.format(suggestedInvestment)}
            </span>
          </div>
          <Progress value={investmentProgress} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium">
            <span>Lazer realizado</span>
            <span>
              {currencyFormatter.format(leisureSpent)} / {currencyFormatter.format(leisureSuggested)}
            </span>
          </div>
          <Progress value={leisureProgress} className="bg-muted">
            {/* no-op, só para manter estilo */}
          </Progress>
        </div>

        <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-3">
          {analysis ? (
            <p>
              Disponível após reservas: <strong>{currencyFormatter.format(analysis.available)}</strong>. A inteligência
              sugere <strong>{currencyFormatter.format(analysis.suggestedInvestment)}</strong> para investimentos e{' '}
              <strong>{currencyFormatter.format(analysis.leisureSuggested)}</strong> para lazer.
            </p>
          ) : (
            <p>Os dados ainda não foram calculados para este mês.</p>
          )}
          {basicNeeds.length > 0 && (
            <div className="space-y-2">
              {basicNeeds.map((need) => {
                const denominator = need.limit || 1;
                const progress = Math.min(100, (need.spent / denominator) * 100);
                return (
                  <div key={need.key}>
                    <div className="flex items-center justify-between text-xs font-medium">
                      <span>{need.label}</span>
                      <span>
                        {currencyFormatter.format(need.spent)} / {currencyFormatter.format(need.limit)}
                      </span>
                    </div>
                    <Progress value={progress} className="mt-1" />
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">
                Mantemos Casa e Mercado sob vigilância para garantir que as contas básicas estejam saudáveis antes de
                sugerir novos cortes em lazer ou investimentos.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default LeisureVsInvestmentGauge;
