// src/components/dashboard/investments/investment-planner-card.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import type {
  InvestmentAnalysis,
  InvestmentPlan,
  InvestmentPlanPayload,
  InvestmentPriority,
} from '@/lib/definitions';
import { Textarea } from '@/components/ui/textarea';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percentFormatter = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });

type PlannerFormState = {
  priority: InvestmentPriority;
  targetPercent: number;
  targetAmountMin: string;
  targetAmount: string;
  leisureFloor: string;
  leisurePercentMin: number;
  emergencyFundTarget: string;
  notes: string;
};

type InvestmentPlannerCardProps = {
  plan: InvestmentPlan | null;
  defaults?: Partial<InvestmentPlan> | null;
  analysis: InvestmentAnalysis | null;
  isSaving?: boolean;
  onSave: (payload: InvestmentPlanPayload) => Promise<void>;
};

const priorityOptions: { value: InvestmentPriority; label: string; description: string }[] = [
  { value: 'investir', label: 'Focar em Investimentos', description: 'Privilegia aportes mesmo que lazer fique menor.' },
  { value: 'balanceado', label: 'Equilibrado', description: 'Mantém equilíbrio entre investir e lazer.' },
  { value: 'lazer', label: 'Focar em Lazer', description: 'Garante piso maior de lazer antes de sugerir aportes.' },
];

function buildInitialState(plan: InvestmentPlan | null, defaults?: Partial<InvestmentPlan> | null): PlannerFormState {
  return {
    priority: plan?.priority ?? defaults?.priority ?? 'investir',
    targetPercent: plan?.targetPercent ?? defaults?.targetPercent ?? 0.2,
    targetAmountMin: String(plan?.targetAmountMin ?? defaults?.targetAmountMin ?? 0),
    targetAmount: plan?.targetAmount !== undefined && plan?.targetAmount !== null
      ? String(plan.targetAmount)
      : '',
    leisureFloor: String(plan?.leisureFloor ?? defaults?.leisureFloor ?? 0),
    leisurePercentMin: plan?.leisurePercentMin ?? defaults?.leisurePercentMin ?? 0.15,
    emergencyFundTarget: plan?.emergencyFundTarget
      ? String(plan.emergencyFundTarget)
      : defaults?.emergencyFundTarget
        ? String(defaults.emergencyFundTarget)
        : '',
    notes: plan?.notes ?? defaults?.notes ?? '',
  };
}

export function InvestmentPlannerCard({
  plan,
  defaults,
  analysis,
  isSaving,
  onSave,
}: InvestmentPlannerCardProps) {
  const [formState, setFormState] = useState<PlannerFormState>(() => buildInitialState(plan, defaults));

  useEffect(() => {
    setFormState(buildInitialState(plan, defaults));
  }, [plan, defaults]);

  const percentValue = useMemo(() => Math.round(formState.targetPercent * 100), [formState.targetPercent]);
  const leisurePercentValue = useMemo(
    () => Math.round(formState.leisurePercentMin * 100),
    [formState.leisurePercentMin],
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload: InvestmentPlanPayload = {
      priority: formState.priority,
      targetPercent: formState.targetPercent,
      targetAmountMin: Number(formState.targetAmountMin || 0),
      targetAmount: formState.targetAmount ? Number(formState.targetAmount) : null,
      leisureFloor: Number(formState.leisureFloor || 0),
      leisurePercentMin: formState.leisurePercentMin,
      emergencyFundTarget: formState.emergencyFundTarget ? Number(formState.emergencyFundTarget) : null,
      notes: formState.notes || null,
    };
    await onSave(payload);
  }

  const insights = [
    {
      label: 'Receita confirmada',
      value: analysis ? currencyFormatter.format(analysis.netIncome) : '—',
      description: 'Somente receitas pagas e confirmadas.',
    },
    {
      label: 'Essenciais no mês',
      value: analysis ? currencyFormatter.format(analysis.essentialSpent || 0) : '—',
      description: 'Categorias essenciais consumidas até agora.',
    },
    {
      label: 'Sobra sugerida para investir',
      value: analysis ? currencyFormatter.format(analysis.suggestedInvestment || 0) : '—',
      description: 'Resultado do algoritmo considerando o plano atual.',
    },
    {
      label: 'Lazer recomendado',
      value: analysis ? currencyFormatter.format(analysis.leisureSuggested || 0) : '—',
      description: 'Quanto o planner sugere reservar para lazer.',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Planejamento Pessoal</CardTitle>
        <CardDescription>
          Ajuste percentuais e limites para o planner inteligente distribuir o excedente do mês.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {insights.map((insight) => (
            <div key={insight.label} className="rounded-lg border p-3">
              <p className="text-sm font-medium text-muted-foreground">{insight.label}</p>
              <p className="mt-1 text-2xl font-semibold">{insight.value}</p>
              <p className="text-xs text-muted-foreground">{insight.description}</p>
            </div>
          ))}
        </div>

        {analysis?.warnings && analysis.warnings.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              {analysis.warnings.map((warning) => (
                <div key={warning}>{warning}</div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-4 rounded-lg border p-4">
              <Label className="text-sm font-semibold">Prioridade do plano</Label>
              <Select
                value={formState.priority}
                onValueChange={(value: InvestmentPriority) =>
                  setFormState((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div>
                        <p className="font-medium">{option.label}</p>
                        <p className="text-xs text-muted-foreground">{option.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium">
                  <Label htmlFor="targetPercent" className="text-sm font-semibold">
                    Percentual do excedente para investir
                  </Label>
                  <span>{percentFormatter.format(formState.targetPercent)}</span>
                </div>
                <Slider
                  id="targetPercent"
                  min={0}
                  max={60}
                  step={1}
                  value={[percentValue]}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, targetPercent: (value[0] || 0) / 100 }))
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm font-medium">
                  <Label htmlFor="leisurePercentMin" className="text-sm font-semibold">
                    Percentual mínimo para lazer
                  </Label>
                  <span>{percentFormatter.format(formState.leisurePercentMin)}</span>
                </div>
                <Slider
                  id="leisurePercentMin"
                  min={0}
                  max={50}
                  step={1}
                  value={[leisurePercentValue]}
                  onValueChange={(value) =>
                    setFormState((prev) => ({ ...prev, leisurePercentMin: (value[0] || 0) / 100 }))
                  }
                />
              </div>
            </div>

            <div className="space-y-4 rounded-lg border p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="targetAmountMin">Meta mínima mensal (R$)</Label>
                  <Input
                    id="targetAmountMin"
                    type="number"
                    min="0"
                    step="50"
                    value={formState.targetAmountMin}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, targetAmountMin: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetAmount">Meta fixa (opcional)</Label>
                  <Input
                    id="targetAmount"
                    type="number"
                    min="0"
                    step="50"
                    placeholder="Ex: 1500"
                    value={formState.targetAmount}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, targetAmount: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leisureFloor">Piso de lazer (R$)</Label>
                  <Input
                    id="leisureFloor"
                    type="number"
                    min="0"
                    step="50"
                    value={formState.leisureFloor}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, leisureFloor: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyFundTarget">Fundo de emergência (R$)</Label>
                  <Input
                    id="emergencyFundTarget"
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Ex: 12000"
                    value={formState.emergencyFundTarget}
                    onChange={(event) =>
                      setFormState((prev) => ({ ...prev, emergencyFundTarget: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  placeholder="Registre observações, como composições de renda extra ou ajustes temporários."
                  value={formState.notes}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, notes: event.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Última atualização: {plan?.updatedAt ? new Date(plan.updatedAt).toLocaleString('pt-BR') : '—'}
            </p>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Salvando...' : 'Salvar plano'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default InvestmentPlannerCard;
