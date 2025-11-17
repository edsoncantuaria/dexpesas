// src/components/dashboard/mission-cards/challenge-tower-card.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Castle } from "lucide-react";
import type { Goal } from "@/lib/definitions";
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useGamificationMode } from "@/hooks/use-gamification-mode";
import { getGamificationCopy } from "@/lib/gamification-copy";

interface ChallengeTowerCardProps {
    goal?: Goal;
}

export function ChallengeTowerCard({ goal }: ChallengeTowerCardProps) {
    const router = useRouter();
    const percentage = goal ? (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100 : 0;
    const { mode } = useGamificationMode();
    const copy = getGamificationCopy('challengeTower', mode);

    return (
         <Link href="/dashboard/metas" className="group">
            <Card className="shadow-md h-full transition-all group-hover:shadow-xl group-hover:border-primary/50">
                 <CardHeader>
                    <div className="flex items-center gap-3">
                       <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                         <Castle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                       </div>
                        <div>
                            <CardTitle className="font-headline text-xl">{copy.title}</CardTitle>
                            <CardDescription>{copy.description}</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-2">
                    {goal ? (
                        <>
                           <div className="flex justify-between items-baseline">
                                <p className="font-semibold truncate pr-4">{goal.name}</p>
                                <p className="text-sm text-muted-foreground font-mono">
                                    {percentage.toFixed(0)}%
                                </p>
                            </div>
                           <Progress value={percentage} indicatorClassName="bg-indigo-500" />
                            <p className="text-xs text-muted-foreground pt-2">
                                <span className="font-bold text-accent">{Number(goal.currentAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span> de <span className="font-semibold">{Number(goal.targetAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                           </p>
                        </>
                    ) : (
                         <div className="text-center text-muted-foreground pt-8">
                            <p>{copy.emptyState}</p>
                        </div>
                    )}
                </CardContent>
                <div className="px-6 pb-6">
                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={(e) => {
                            e.preventDefault();
                            router.push('/dashboard/metas?create=true');
                        }}
                    >
                        {copy.buttonLabel}
                    </Button>
                </div>
            </Card>
        </Link>
    );
}
