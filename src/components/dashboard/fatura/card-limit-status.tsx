// src/components/dashboard/fatura/card-limit-status.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar, TrendingUp } from "lucide-react";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

interface CardLimitStatusProps {
    totalLimit: number;
    availableLimit: number;
    bestDayToBuy?: string | null;
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function CardLimitStatus({ totalLimit, availableLimit, bestDayToBuy }: CardLimitStatusProps) {

    const usedAmount = totalLimit - availableLimit;
    const usedPercentage = totalLimit > 0 ? (usedAmount / totalLimit) * 100 : 0;
    
    const getProgressColor = (percentage: number) => {
        if (percentage > 90) return "bg-red-500";
        if (percentage > 70) return "bg-yellow-500";
        return "bg-primary";
    };

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Status do Limite</CardTitle>
                <CardDescription>Visão geral do seu limite de crédito.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col flex-grow justify-between space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between items-baseline text-sm">
                        <span className="text-muted-foreground">Utilizado</span>
                        <span className="font-semibold">{formatCurrency(usedAmount)}</span>
                    </div>
                    <Progress value={usedPercentage} indicatorClassName={getProgressColor(usedPercentage)} />
                    <div className="flex justify-between items-baseline text-sm">
                        <span className="text-muted-foreground">Disponível</span>
                        <span className="font-semibold text-green-500">{formatCurrency(availableLimit)}</span>
                    </div>
                </div>

                 <div className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground"/>
                        <p className="text-sm text-muted-foreground">Melhor dia de compra</p>
                    </div>
                    <p className="text-base font-semibold">{bestDayToBuy ? format(new Date(bestDayToBuy), 'dd \'de\' MMMM', { locale: ptBR }) : 'N/A'}</p>
                </div>

            </CardContent>
        </Card>
    )
}
