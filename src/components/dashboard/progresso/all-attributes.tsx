'use client';

import type { GamificationProfile as GamificationProfileType } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dumbbell, BookOpen, Shield, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGamificationMode } from '@/hooks/use-gamification-mode';
import { useState } from 'react';
import { AttributeExplainer } from './attribute-explainer';

type AllAttributesProps = {
  profile: GamificationProfileType & { updatedAt: string };
};

const xpNeeded = (level: number) => Math.floor(100 * Math.pow(level, 1.15));

const primaryAttributes = [
  {
    key: 'Forca' as const,
    label: 'Força',
    icon: Dumbbell,
    gradient: 'from-red-500 to-orange-500',
    bgGradient: 'from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20',
    color: 'text-red-500',
    description: 'Renda & Saúde'
  },
  {
    key: 'Sabedoria' as const,
    label: 'Sabedoria',
    icon: BookOpen,
    gradient: 'from-blue-500 to-cyan-500',
    bgGradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20',
    color: 'text-blue-500',
    description: 'Educação & Cursos'
  },
  {
    key: 'Resistencia' as const,
    label: 'Resistência',
    icon: Shield,
    gradient: 'from-green-500 to-emerald-500',
    bgGradient: 'from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20',
    color: 'text-green-500',
    description: 'Investimentos & Poupança'
  },
  {
    key: 'Sorte' as const,
    label: 'Sorte',
    icon: Sparkles,
    gradient: 'from-amber-500 to-yellow-500',
    bgGradient: 'from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20',
    color: 'text-amber-500',
    description: 'Caridade & Dívidas'
  }
];

export function AllAttributes({ profile }: AllAttributesProps) {
  const { mode } = useGamificationMode();
  const [showExplainer, setShowExplainer] = useState(false);
  const { level, xp } = profile;

  const xpForNextLevel = xpNeeded(level);
  const xpPercentage = (xp / xpForNextLevel) * 100;

  const isLite = mode === 'LITE';

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-violet-50 to-indigo-50 dark:from-violet-950/20 dark:to-indigo-950/20 border-violet-200 dark:border-violet-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Seus Atributos</CardTitle>
            <button
              onClick={() => setShowExplainer(!showExplainer)}
              className="flex items-center gap-2 text-sm text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors"
            >
              {showExplainer ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Ocultar Guia
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Como Funciona?
                </>
              )}
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {isLite
              ? 'Resumo dos seus principais indicadores financeiros'
              : 'Atributos calculados com base nos últimos 3 meses de transações'}
          </p>
        </CardHeader>
      </Card>

      {/* Explainer */}
      {showExplainer && <AttributeExplainer />}

      {/* Primary Attributes Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {primaryAttributes.map((attr) => {
          const value = profile[attr.key] || 0;
          const Icon = attr.icon;

          return (
            <Card
              key={attr.key}
              className={cn(
                "relative overflow-hidden transition-all hover:shadow-lg",
                "bg-gradient-to-br border-2",
                attr.bgGradient
              )}
            >
              {/* Background decoration */}
              <div className={cn(
                "absolute top-0 right-0 w-24 h-24 opacity-10 -mr-8 -mt-8",
                "bg-gradient-to-br rounded-full blur-2xl",
                attr.gradient
              )} />

              <CardContent className="pt-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2.5 rounded-xl bg-white dark:bg-slate-900 shadow-sm",
                      attr.color
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{attr.label}</h3>
                      {!isLite && (
                        <p className="text-xs text-muted-foreground">{attr.description}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <span className={cn("text-4xl font-bold", attr.color)}>
                      {Math.round(value)}
                    </span>
                    <span className="text-sm text-muted-foreground">/100</span>
                  </div>

                  <div className="space-y-1">
                    <Progress
                      value={value}
                      className="h-2 bg-white/50 dark:bg-slate-900/50"
                      indicatorClassName={cn("bg-gradient-to-r", attr.gradient)}
                    />
                    {!isLite && (
                      <p className="text-[10px] text-muted-foreground text-right">
                        {value >= 90 ? '🔥 Excelente!' :
                          value >= 60 ? '✨ Muito bom!' :
                            value >= 30 ? '💪 Progredindo' :
                              '🌱 Começando'}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary XP Progress (Lite mode only shows this) */}
      {isLite && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progresso de XP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Nível {level}</span>
                <span className="font-medium">{xp} / {xpForNextLevel} XP</span>
              </div>
              <Progress value={xpPercentage} className="h-3" />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
