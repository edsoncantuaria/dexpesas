// src/components/dashboard/investments/investment-metrics-card.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { InvestmentMetricSnapshot } from '@/lib/definitions';

const percentFormatter = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 1 });
const ratioFormatter = (value?: number | null) =>
  percentFormatter.format(Number.isFinite(value as number) ? Number(value) : 0);

type InvestmentMetricsCardProps = {
  metrics: InvestmentMetricSnapshot | null;
};

const METRIC_ENTRIES: Array<{ key: keyof InvestmentMetricSnapshot; label: string; helper: string }> = [
  { key: 'soloPlanAdoptionPct', label: 'Planos em 30 dias', helper: '% de usuários solo com plano em até 30 dias' },
  {
    key: 'avgContributionIncomeRatio',
    label: 'Aporte / Renda',
    helper: 'Média entre usuários com renda fixa informada',
  },
  { key: 'planAdherenceRate', label: 'Aderência (3m)', helper: 'Planos que bateram 80% da meta por 3 meses' },
  { key: 'nudgeConversionRate', label: 'Nudges convertidos', helper: 'Sugestões de IA que viraram aporte' },
  { key: 'adoptionRate', label: 'Adoção entre ativos', helper: 'Usuários ativos com plano de investimento' },
  { key: 'churnRate', label: 'Churn do módulo', helper: 'Planos ativos no mês anterior sem aporte neste mês' },
];

export function InvestmentMetricsCard({ metrics }: InvestmentMetricsCardProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Métricas de sucesso</CardTitle>
        <CardDescription>
          Indicadores automáticos para acompanhar adoção, aderência e impacto das sugestões inteligentes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {metrics ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {METRIC_ENTRIES.map((entry) => (
              <div key={entry.key} className="rounded-xl border bg-gradient-to-br from-primary/5 to-primary/0 p-4 hover:shadow-md transition-shadow">
                <p className="text-sm font-semibold text-muted-foreground">{entry.label}</p>
                <p className="mt-2 text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">{ratioFormatter(metrics[entry.key])}</p>
                <p className="text-xs text-muted-foreground mt-1">{entry.helper}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Ainda não geramos métricas para este período. Assim que houver dados suficientes, elas aparecerão aqui.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default InvestmentMetricsCard;
