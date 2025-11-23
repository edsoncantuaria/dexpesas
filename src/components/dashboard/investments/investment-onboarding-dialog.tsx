// src/components/dashboard/investments/investment-onboarding-dialog.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { InvestmentPriority } from '@/lib/definitions';

type OnboardingPayload = {
  fixedMonthlyIncome: number;
  priority: InvestmentPriority;
  targetPercent: number;
  leisureFloor: number;
  leisurePercentMin: number;
  emergencyFundTarget?: number | null;
  notes?: string | null;
};

const percentFormatter = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 0 });
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

const PRESETS: Record<
  'conservador' | 'balanceado' | 'agressivo',
  { label: string; description: string; targetPercent: number; leisurePercentMin: number; leisureFloor: number; emergencyFundTarget: number }
> = {
  conservador: {
    label: 'Conservador',
    description: 'Prioriza segurança: mais lazer e fundo de emergência robusto.',
    targetPercent: 0.15,
    leisurePercentMin: 0.25,
    leisureFloor: 500,
    emergencyFundTarget: 15000,
  },
  balanceado: {
    label: 'Balanceado',
    description: 'Equilíbrio entre investir e aproveitar o presente.',
    targetPercent: 0.2,
    leisurePercentMin: 0.2,
    leisureFloor: 350,
    emergencyFundTarget: 10000,
  },
  agressivo: {
    label: 'Agressivo',
    description: 'Foco em acelerar investimentos sacrificando parte do lazer.',
    targetPercent: 0.3,
    leisurePercentMin: 0.15,
    leisureFloor: 200,
    emergencyFundTarget: 6000,
  },
};

type InvestmentOnboardingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSubmitting: boolean;
  initialMonthlyIncome?: number | null;
  onSubmit: (payload: OnboardingPayload) => Promise<void>;
};

const priorityCopy: Record<InvestmentPriority, { label: string; helper: string }> = {
  investir: {
    label: 'Quero focar nos investimentos',
    helper: 'Prioriza aportes mesmo que o lazer fique menor temporariamente.',
  },
  balanceado: {
    label: 'Quero equilíbrio',
    helper: 'Mantém um equilíbrio entre investir e aproveitar o presente.',
  },
  lazer: {
    label: 'Quero reforçar o lazer',
    helper: 'Garante um piso maior para lazer antes de sugerir aportes.',
  },
};

export function InvestmentOnboardingDialog({
  open,
  onOpenChange,
  isSubmitting,
  initialMonthlyIncome,
  onSubmit,
}: InvestmentOnboardingDialogProps) {
  const [monthlyIncome, setMonthlyIncome] = useState(initialMonthlyIncome ? String(initialMonthlyIncome) : '');
  const [priority, setPriority] = useState<InvestmentPriority>('balanceado');
  const [targetPercent, setTargetPercent] = useState(0.2);
  const [leisurePercent, setLeisurePercent] = useState(0.2);
  const [leisureFloor, setLeisureFloor] = useState('0');
  const [emergencyFund, setEmergencyFund] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<'conservador' | 'balanceado' | 'agressivo' | 'custom'>('balanceado');
  const markCustom = () => {
    if (selectedPreset !== 'custom') {
      setSelectedPreset('custom');
    }
  };

  useEffect(() => {
    setMonthlyIncome(initialMonthlyIncome ? String(initialMonthlyIncome) : '');
  }, [initialMonthlyIncome, open]);

  useEffect(() => {
    if (selectedPreset === 'custom') return;
    const preset = PRESETS[selectedPreset];
    setTargetPercent(preset.targetPercent);
    setLeisurePercent(preset.leisurePercentMin);
    setLeisureFloor(String(preset.leisureFloor));
    setEmergencyFund(String(preset.emergencyFundTarget));
  }, [selectedPreset]);

  const percentValue = useMemo(() => Math.round(targetPercent * 100), [targetPercent]);
  const leisurePercentValue = useMemo(() => Math.round(leisurePercent * 100), [leisurePercent]);

  const monthlyIncomeNumber = Number(monthlyIncome);
  const projectedInvestment = Math.max(0, monthlyIncomeNumber * targetPercent - Number(leisureFloor || 0));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!monthlyIncomeNumber || monthlyIncomeNumber <= 0) return;

    await onSubmit({
      fixedMonthlyIncome: monthlyIncomeNumber,
      priority,
      targetPercent,
      leisureFloor: Number(leisureFloor || 0),
      leisurePercentMin: leisurePercent,
      emergencyFundTarget: emergencyFund ? Number(emergencyFund) : null,
      notes: notes || null,
    });
  }

  return (
    <ResponsiveDialog
      isOpen={open}
      setIsOpen={onOpenChange}
      title="Personalize seu plano"
      description="Usamos esses dados para sugerir quanto investir, quanto reservar para lazer e quais alertas inteligentes enviar. Não movimentamos dinheiro real por você."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="monthlyIncome">Renda fixa mensal (R$)</Label>
          <Input
            id="monthlyIncome"
            type="number"
            min="0"
            step="100"
            required
            value={monthlyIncome}
            onChange={(event) => setMonthlyIncome(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Tolerância de risco</Label>
          <Select value={priority} onValueChange={(value: InvestmentPriority) => setPriority(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(priorityCopy) as InvestmentPriority[]).map((key) => (
                <SelectItem key={key} value={key}>
                  <div>
                    <p className="font-medium">{priorityCopy[key].label}</p>
                    <p className="text-xs text-muted-foreground">{priorityCopy[key].helper}</p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Preset rápido</Label>
          <div className="grid gap-3 sm:grid-cols-4">
            {(Object.keys(PRESETS) as Array<'conservador' | 'balanceado' | 'agressivo'>).map((key) => (
              <Button
                key={key}
                type="button"
                variant={selectedPreset === key ? 'default' : 'outline'}
                className={cn(
                  "flex flex-col items-start gap-1 text-left h-auto py-3",
                  selectedPreset === key && "shadow-lg shadow-primary/20"
                )}
                onClick={() => setSelectedPreset(key)}
              >
                <span className="font-semibold">{PRESETS[key].label}</span>
                <span className="text-xs text-muted-foreground line-clamp-2">{PRESETS[key].description}</span>
              </Button>
            ))}
            <Button
              type="button"
              variant={selectedPreset === 'custom' ? 'default' : 'outline'}
              className={cn(
                "h-auto py-3",
                selectedPreset === 'custom' && "shadow-lg shadow-primary/20"
              )}
              onClick={() => setSelectedPreset('custom')}
            >
              Personalizar
            </Button>
          </div>
        </div>

        <div className="space-y-4 rounded-lg border p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium">
              <Label>Percentual do excedente para investir</Label>
              <span>{percentFormatter.format(targetPercent)}</span>
            </div>
            <Slider
              min={0.05 * 100}
              max={60}
              step={1}
              value={[percentValue]}
              onValueChange={(value) => {
                setTargetPercent((value[0] ?? 0) / 100);
                markCustom();
              }}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-medium">
              <Label>Percentual mínimo para lazer</Label>
              <span>{percentFormatter.format(leisurePercent)}</span>
            </div>
            <Slider
              min={5}
              max={50}
              step={1}
              value={[leisurePercentValue]}
              onValueChange={(value) => {
                setLeisurePercent((value[0] ?? 0) / 100);
                markCustom();
              }}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="leisureFloor">Piso fixo para lazer (R$)</Label>
            <Input
              id="leisureFloor"
              type="number"
              min="0"
              step="50"
              value={leisureFloor}
              onChange={(event) => {
                setLeisureFloor(event.target.value);
                markCustom();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="emergencyFund">Fundo de emergência (R$)</Label>
            <Input
              id="emergencyFund"
              type="number"
              min="0"
              step="100"
              value={emergencyFund}
              onChange={(event) => {
                setEmergencyFund(event.target.value);
                markCustom();
              }}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            placeholder="Ex: renda variável agressiva até janeiro, depois reduzir um pouco os aportes."
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </div>

        <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-4 text-sm">
          {monthlyIncomeNumber > 0 ? (
            <p>
              Com essa configuração, o planner vai buscar <strong>{currencyFormatter.format(projectedInvestment)}</strong> por mês
              em investimentos sempre que houver excedente, garantindo ao menos{' '}
              <strong>{currencyFormatter.format(Number(leisureFloor || 0))}</strong> para lazer.
            </p>
          ) : (
            <p>Informe sua renda fixa para ver as projeções automáticas.</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Mais tarde
          </Button>
          <Button type="submit" disabled={isSubmitting || !monthlyIncomeNumber}>
            {isSubmitting ? 'Personalizando...' : 'Começar plano'}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  );
}

export type { OnboardingPayload };
export default InvestmentOnboardingDialog;
