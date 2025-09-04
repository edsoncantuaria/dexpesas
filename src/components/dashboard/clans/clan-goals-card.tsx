// src/components/dashboard/clans/clan-goals-card.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, PlusCircle } from 'lucide-react';
import type { Goal, Account } from '@/lib/definitions';
import { Progress } from '@/components/ui/progress';
import { GoalCreationDialog } from './goal-creation-dialog';
import { GoalContributionDialog } from './goal-contribution-dialog';


interface ClanGoalsCardProps {
    clanId: string;
    goals: Goal[];
    userAccounts: Account[];
    onGoalUpdate: () => void;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);


export function ClanGoalsCard({ clanId, goals, userAccounts, onGoalUpdate }: ClanGoalsCardProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);

    const activeGoals = goals.filter(g => g.status === 'IN_PROGRESS');

    return (
        <>
            <Card className="shadow-lg flex flex-col h-full">
                <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-accent/10 rounded-lg">
                        <Target className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                        <CardTitle className="font-headline text-xl">Metas da Família</CardTitle>
                        <CardDescription>Objetivos financeiros do grupo.</CardDescription>
                        </div>
                    </div>
                     <Button variant="ghost" size="icon" onClick={() => setIsCreateOpen(true)}>
                        <PlusCircle className="h-5 w-5" />
                    </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4 flex-grow flex flex-col">
                {activeGoals.length > 0 ? (
                    activeGoals.map(goal => {
                        const percentage = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;
                        return (
                            <div key={goal.id} className="space-y-2 p-3 rounded-lg border bg-muted/30">
                                <div className="flex justify-between items-center">
                                    <p className="font-semibold">{goal.name}</p>
                                    <Button size="sm" variant="secondary" onClick={() => setContributingGoal(goal)}>Contribuir</Button>
                                </div>
                                <Progress value={percentage} indicatorClassName="bg-accent" />
                                <p className="text-xs text-muted-foreground">
                                    {formatCurrency(Number(goal.currentAmount))} de {formatCurrency(Number(goal.targetAmount))}
                                </p>
                            </div>
                        )
                    })
                ) : (
                    <div className="text-center text-muted-foreground py-8 h-full flex flex-col items-center justify-center">
                        <Target className="h-8 w-8 mb-2" />
                        <p>Nenhuma meta ativa.</p>
                        <p className="text-xs">Crie a primeira meta da família!</p>
                    </div>
                )}
                </CardContent>
            </Card>

            <GoalCreationDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                clanId={clanId}
                onSuccess={onGoalUpdate}
            />

            {contributingGoal && (
                 <GoalContributionDialog
                    isOpen={!!contributingGoal}
                    onClose={() => setContributingGoal(null)}
                    goal={contributingGoal}
                    userAccounts={userAccounts}
                    onSuccess={onGoalUpdate}
                 />
            )}
        </>
    );
}
