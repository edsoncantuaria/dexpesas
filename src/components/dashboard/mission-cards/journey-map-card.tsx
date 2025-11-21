// src/components/dashboard/mission-cards/journey-map-card.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map, TrendingUp, AlertTriangle, ArrowRight, Eye, EyeOff } from "lucide-react";
import type { Budget } from "@/lib/definitions";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useGamificationMode } from "@/hooks/use-gamification-mode";
import { getGamificationCopy } from "@/lib/gamification-copy";
import { motion } from "framer-motion";
import { usePrivacy } from '@/contexts/PrivacyContext';

interface JourneyMapCardProps {
    budgets: Budget[];
}

const getProgressColor = (percentage: number) => {
    if (percentage > 100) return "bg-destructive";
    if (percentage > 90) return "bg-orange-500";
    if (percentage > 70) return "bg-yellow-500";
    return "bg-primary";
};

export function JourneyMapCard({ budgets }: JourneyMapCardProps) {
    const router = useRouter();
    const { mode, isClassic } = useGamificationMode();
    const copy = getGamificationCopy('journeyMap', mode);
    const { showBalance, togglePrivacy } = usePrivacy();

    // Ordena orçamentos por percentual de uso (decrescente) e pega os top 3
    const criticalBudgets = [...budgets]
        .map(b => ({
            ...b,
            percentage: Number(b.limit) > 0 ? (Number(b.spent) / Number(b.limit)) * 100 : 0
        }))
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 3);

    return (
        <Link href="/dashboard/orcamentos" className="group block h-full">
            <Card className={cn(
                "h-full transition-all duration-300 flex flex-col overflow-hidden border-0 ring-1 ring-border/50",
                "hover:shadow-xl hover:ring-primary/20 hover:scale-[1.01]",
                !isClassic ? "bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/30 dark:to-teal-900/10" : "bg-card"
            )}>
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-3.5 rounded-xl shadow-sm transition-colors",
                            isClassic
                                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                                : "bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-emerald-500/20"
                        )}>
                            <Map className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="font-headline text-lg tracking-tight">{copy.title}</CardTitle>
                            <CardDescription className="text-xs font-medium opacity-80">{copy.description}</CardDescription>
                        </div>
                        {criticalBudgets.length > 0 && (
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
                <CardContent className="space-y-6 flex-grow pt-4">
                    {criticalBudgets.length > 0 ? (
                        <div className="space-y-5">
                            {criticalBudgets.map((budget, index) => {
                                const spent = Number(budget.spent);
                                const limit = Number(budget.limit);
                                const isOverLimit = spent > limit;

                                return (
                                    <motion.div
                                        key={budget.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="space-y-2 group/item"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                {isOverLimit && (
                                                    <motion.div
                                                        animate={{ scale: [1, 1.2, 1] }}
                                                        transition={{ repeat: Infinity, duration: 2 }}
                                                    >
                                                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                                    </motion.div>
                                                )}
                                                <p className="font-semibold text-sm text-foreground/90 group-hover/item:text-primary transition-colors">
                                                    {budget.category?.label || budget.category?.nome}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className={cn(
                                                    "text-xs font-bold px-2 py-0.5 rounded-full",
                                                    isOverLimit ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"
                                                )}>
                                                    {showBalance ? percentageFormat(budget.percentage) : '••%'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="relative h-2.5 bg-muted/50 rounded-full overflow-hidden">
                                            <motion.div
                                                className={cn("h-full rounded-full", getProgressColor(budget.percentage))}
                                                initial={{ width: 0 }}
                                                animate={{ width: showBalance ? `${Math.min(budget.percentage, 100)}%` : '50%' }}
                                                transition={{ duration: 1, ease: "easeOut" }}
                                            />
                                        </div>

                                        <div className="flex justify-between text-[10px] font-medium text-muted-foreground/80">
                                            <span>{showBalance ? formatMoney(spent) : 'R$ ••••'}</span>
                                            <span>de {showBalance ? formatMoney(limit) : 'R$ ••••'}</span>
                                        </div>
                                    </motion.div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground pt-8 flex flex-col items-center gap-3">
                            <div className="p-4 rounded-full bg-muted/50">
                                <TrendingUp className="h-6 w-6 opacity-40" />
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
                            router.push('/dashboard/orcamentos?create=true');
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

const formatMoney = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const percentageFormat = (value: number) => `${value.toFixed(0)}%`;
