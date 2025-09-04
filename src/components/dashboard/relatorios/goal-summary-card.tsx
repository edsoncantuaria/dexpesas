// src/components/dashboard/relatorios/goal-summary-card.tsx
'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target } from 'lucide-react';
import type { Goal } from '@/lib/definitions';
import Link from 'next/link';

type GoalSummaryCardProps = {
  goals: Goal[];
};

export function GoalSummaryCard({ goals }: GoalSummaryCardProps) {
  const closestGoal = useMemo(() => {
    return goals
      .filter(g => g.status === 'IN_PROGRESS')
      .sort((a, b) => {
        const progressA = Number(a.currentAmount) / Number(a.targetAmount);
        const progressB = Number(b.currentAmount) / Number(b.targetAmount);
        return progressB - progressA;
      })[0];
  }, [goals]);

  const percentage = closestGoal ? (Number(closestGoal.currentAmount) / Number(closestGoal.targetAmount)) * 100 : 0;

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Target className="h-6 w-6 text-accent" />
          <div>
            <CardTitle>Resumo de Metas</CardTitle>
            <CardDescription>Seu objetivo mais próximo de ser alcançado.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {closestGoal ? (
          <Link href="/dashboard/metas" className="space-y-2 block">
            <div className="flex justify-between items-baseline">
              <p className="font-semibold truncate pr-4">{closestGoal.name}</p>
              <p className="text-sm text-muted-foreground font-mono">
                {percentage.toFixed(0)}%
              </p>
            </div>
            <Progress value={percentage} indicatorClassName="bg-accent" />
            <p className="text-xs text-muted-foreground pt-2">
              <span className="font-bold text-accent">{Number(closestGoal.currentAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> de <span className="font-semibold">{Number(closestGoal.targetAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </p>
          </Link>
        ) : (
          <div className="h-full flex items-center justify-center text-center text-muted-foreground">
            <p>Nenhuma meta em andamento. <br /> Crie uma para começar!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
