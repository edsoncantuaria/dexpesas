// src/components/dashboard/relatorios/goals-funds-overview.tsx
'use client';

import { useMemo } from 'react';
import type { Goal } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Trophy, Target, Flag } from 'lucide-react';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

type GoalsFundsOverviewProps = {
  goals: Goal[];
};

export function GoalsFundsOverview({ goals }: GoalsFundsOverviewProps) {
  const { summary, highlightedGoals } = useMemo(() => {
    const totalTarget = goals.reduce((acc, goal) => acc + Number(goal.targetAmount), 0);
    const totalCurrent = goals.reduce((acc, goal) => acc + Number(goal.currentAmount), 0);
    const completedCount = goals.filter((goal) => goal.status === 'COMPLETED').length;
    const linkedFunds = goals.filter((goal) => goal.cellFundId).length;

    const highlightedGoals = goals
      .map((goal) => {
        const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
        return {
          id: goal.id,
          name: goal.name,
          progress,
          currentAmount: goal.currentAmount,
          targetAmount: goal.targetAmount,
          isFamily: Boolean(goal.cellFundId),
        };
      })
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);

    return {
      summary: {
        totalTarget,
        totalCurrent,
        completionRate: totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0,
        completedCount,
        linkedFunds,
      },
      highlightedGoals,
    };
  }, [goals]);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Metas e Fundos</CardTitle>
        <CardDescription>Visão geral das metas pessoais e caixinhas da família.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4" />
              Progresso total
            </div>
            <p className="text-2xl font-bold">{summary.completionRate.toFixed(0)}%</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(summary.totalCurrent)} de {formatCurrency(summary.totalTarget)}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4" />
              Metas concluídas
            </div>
            <p className="text-2xl font-bold">{summary.completedCount}</p>
            <p className="text-xs text-muted-foreground">do total de {goals.length}</p>
          </div>
          <div className="rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Flag className="h-4 w-4" />
              Fundos ligados
            </div>
            <p className="text-2xl font-bold">{summary.linkedFunds}</p>
            <p className="text-xs text-muted-foreground">metas conectadas à família</p>
          </div>
        </div>

        {highlightedGoals.length > 0 ? (
          <div className="space-y-3">
            {highlightedGoals.map((goal) => (
              <div key={goal.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {goal.name} {goal.isFamily && <span className="text-xs text-primary ml-1">Familiar</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(goal.currentAmount)} de {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                  <span className="text-sm font-medium">{goal.progress.toFixed(0)}%</span>
                </div>
                <Progress value={goal.progress} className="mt-2" />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma meta cadastrada ainda.</p>
        )}
      </CardContent>
    </Card>
  );
}
