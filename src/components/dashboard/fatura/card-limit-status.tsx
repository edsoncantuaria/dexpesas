// src/components/dashboard/fatura/card-limit-status.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';

interface CardLimitStatusProps {
    totalLimit: number;
    availableLimit: number;
    bestDayToBuy?: string | null;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function CardLimitStatus({ totalLimit, availableLimit, bestDayToBuy }: CardLimitStatusProps) {

    const usedAmount = totalLimit - availableLimit;
    const usedPercentage = totalLimit > 0 ? (usedAmount / totalLimit) * 100 : 0;

    const getProgressGradient = (percentage: number) => {
        if (percentage > 90) return "from-red-500 to-red-600";
        if (percentage > 70) return "from-yellow-500 to-amber-500";
        return "from-emerald-500 to-green-600";
    };

    return (
        <Card className="h-full flex flex-col shadow-xl bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-white/10">
            <CardHeader>
                <CardTitle className="text-xl bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                    Status do Limite
                </CardTitle>
                <CardDescription>Visão geral do seu limite de crédito.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-between space-y-6">
                <div className="space-y-4">
                    <div className="flex justify-between items-baseline text-sm">
                        <span className="text-muted-foreground">Utilizado</span>
                        <span className="font-bold text-lg">{formatCurrency(usedAmount)}</span>
                    </div>

                    <div className="relative h-4 rounded-full overflow-hidden bg-muted/50">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(usedPercentage, 100)}%` }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className={cn("h-full bg-gradient-to-r", getProgressGradient(usedPercentage))}
                        />
                    </div>

                    <div className="flex justify-between items-baseline text-sm">
                        <span className="text-muted-foreground">Disponível</span>
                        <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">{formatCurrency(availableLimit)}</span>
                    </div>

                    <div className="pt-2 text-center">
                        <span className={cn(
                            "text-xs font-semibold px-3 py-1 rounded-full",
                            usedPercentage > 90 ? "bg-red-500/20 text-red-600 dark:text-red-400" :
                                usedPercentage > 70 ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
                                    "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        )}>
                            {usedPercentage.toFixed(1)}% utilizado
                        </span>
                    </div>
                </div>

                <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="p-2 rounded-lg bg-primary/20">
                            <Calendar className="h-4 w-4 text-primary" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">Melhor dia de compra</p>
                    </div>
                    <p className="text-lg font-bold">{bestDayToBuy ? format(new Date(bestDayToBuy), 'dd \'de\' MMMM', { locale: ptBR }) : 'N/A'}</p>
                </div>

            </CardContent>
        </Card>
    )
}
