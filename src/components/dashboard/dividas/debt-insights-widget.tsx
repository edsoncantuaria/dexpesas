'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { DebtAnalytics, useDebts } from '@/hooks/use-debts';
import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp, Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function DebtInsightsWidget() {
    const { getAnalytics } = useDebts();
    const [analytics, setAnalytics] = useState<DebtAnalytics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await getAnalytics();
                setAnalytics(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [getAnalytics]);

    if (loading) {
        return <Skeleton className="w-full h-[300px]" />;
    }

    if (!analytics) return null;

    const { dti, projectedInterest, payoffDates } = analytics;

    // DTI Color
    let dtiColor = 'text-green-500';
    let dtiMessage = 'Saudável (<30%)';
    if (dti > 30) { dtiColor = 'text-yellow-500'; dtiMessage = 'Atenção (30-40%)'; }
    if (dti > 40) { dtiColor = 'text-red-500'; dtiMessage = 'Crítico (>40%)'; }

    // Savings
    const savings = projectedInterest.annualCurrent - projectedInterest.avalanche;
    const hasSavings = savings > 10;

    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Taxa de Comprometimento (DTI)
                    </CardTitle>
                    <CardDescription>
                        Porcentagem da sua renda mensal comprometida com dívidas.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-4">
                        <div className={`text-4xl font-bold ${dtiColor}`}>
                            {dti.toFixed(1)}%
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{dtiMessage}</p>
                        <Progress value={Math.min(dti, 100)} className={`mt-4 h-3 w-full ${dti > 40 ? 'bg-red-100' : ''}`} />
                    </div>
                    <div className="mt-4 text-sm text-muted-foreground bg-muted p-3 rounded-md flex gap-2">
                        <Info className="h-4 w-4 shrink-0 mt-0.5" />
                        <p>Bancos recomendam manter este índice abaixo de 30% para garantir saúde financeira.</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrendingDown className="h-5 w-5" />
                        Economia de Juros
                    </CardTitle>
                    <CardDescription>
                        Comparativo de estratégias de quitação.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <span>Juros Totais (Atual)</span>
                            <span className="font-medium text-red-500">{formatCurrency(projectedInterest.annualCurrent)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>Juros com Avalanche</span>
                            <span className="font-medium text-green-500">{formatCurrency(projectedInterest.avalanche)}</span>
                        </div>

                        {hasSavings && (
                            <div className="mt-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-3">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-green-700">Oportunidade de Economia!</p>
                                    <p className="text-sm text-green-600 mt-1">
                                        Mudar para a estratégia Avalanche pode economizar
                                        <span className="font-bold mx-1">{formatCurrency(savings)}</span>
                                        em juros.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
