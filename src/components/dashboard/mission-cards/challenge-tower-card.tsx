// src/components/dashboard/mission-cards/challenge-tower-card.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Castle, Target, Trophy, ArrowRight, Star, Eye, EyeOff } from "lucide-react";
import type { Goal } from "@/lib/definitions";
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useGamificationMode } from "@/hooks/use-gamification-mode";
import { getGamificationCopy } from "@/lib/gamification-copy";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { usePrivacy } from '@/contexts/PrivacyContext';

interface ChallengeTowerCardProps {
    goals?: Goal[];
}

export function ChallengeTowerCard({ goals = [] }: ChallengeTowerCardProps) {
    const router = useRouter();
    const { mode, isClassic } = useGamificationMode();
    const copy = getGamificationCopy('challengeTower', mode);
    const { showBalance, togglePrivacy } = usePrivacy();

    // Pega as 3 metas mais próximas de serem concluídas (maior %)
    const activeGoals = [...goals]
        .map(g => ({
            ...g,
            percentage: Number(g.targetAmount) > 0 ? (Number(g.currentAmount) / Number(g.targetAmount)) * 100 : 0
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 3);

    return (
        <Link href="/dashboard/metas" className="group block h-full">
            <Card className={cn(
                "h-full transition-all duration-300 flex flex-col overflow-hidden border-0 ring-1 ring-border/50",
                "hover:shadow-xl hover:ring-primary/20 hover:scale-[1.01]",
                !isClassic ? "bg-gradient-to-br from-indigo-50/50 to-violet-50/30 dark:from-indigo-950/30 dark:to-violet-900/10" : "bg-card"
            )}>
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-3.5 rounded-xl shadow-sm transition-colors",
                            isClassic
                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                : "bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-indigo-500/20"
                        )}>
                            {isClassic ? <Target className="h-6 w-6" /> : <Castle className="h-6 w-6" />}
                        </div>
                        <div className="flex-1">
                            <CardTitle className="font-headline text-lg tracking-tight">{copy.title}</CardTitle>
                            <CardDescription className="text-xs font-medium opacity-80">{copy.description}</CardDescription>
                        </div>
                        {activeGoals.length > 0 && (
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); togglePrivacy(); }}
                                className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-background/50"
                            >
                                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-5 flex-grow pt-4">
                    {activeGoals.length > 0 ? (
                        activeGoals.map((goal, index) => (
                            <motion.div
                                key={goal.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className={cn(
                                    "space-y-2 group/item",
                                    index !== activeGoals.length - 1 && "border-b border-border/50 pb-4"
                                )}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                        <p className="font-semibold text-sm truncate text-foreground/90 group-hover/item:text-primary transition-colors">
                                            {goal.name}
                                        </p>
                                    </div>
                                    <span className={cn(
                                        "text-xs font-bold px-2 py-0.5 rounded-full",
                                        goal.percentage >= 100 ? "bg-green-100 text-green-700" : "bg-indigo-100 text-indigo-700"
                                    )}>
                                        {showBalance ? `${goal.percentage.toFixed(0)}%` : '••%'}
                                    </span>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="relative h-2 bg-muted/50 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: showBalance ? `${Math.min(goal.percentage, 100)}%` : '50%' }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-medium text-muted-foreground/80">
                                        <span>{showBalance ? Number(goal.currentAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ ••••'}</span>
                                        <span>{showBalance ? Number(goal.targetAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'R$ ••••'}</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground pt-8 flex flex-col items-center gap-3">
                            <div className="p-4 rounded-full bg-muted/50">
                                <Trophy className="h-6 w-6 opacity-40" />
                            </div>
                            <p className="text-sm">{copy.emptyState}</p>
                        </div>
                    )}
                </CardContent>
                <div className="p-5 pt-0 mt-auto">
                    <Button
                        variant="ghost"
                        className="w-full justify-between group/btn hover:bg-primary/5 hover:text-primary"
                        onClick={(e) => {
                            e.preventDefault();
                            router.push('/dashboard/metas?create=true');
                        }}
                    >
                        <span className="font-semibold">{copy.buttonLabel}</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                </div>
            </Card>
        </Link>
    );
}
