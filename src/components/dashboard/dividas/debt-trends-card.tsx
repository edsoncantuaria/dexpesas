'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, TrendingDown, TrendingUp, CheckCircle2, Info } from 'lucide-react';
import { useDebts, type DebtTrends } from '@/hooks/use-debts';
import { formatCurrency } from '@/lib/utils';

export function DebtTrendsCard() {
    const { getTrends } = useDebts();
    const [trends, setTrends] = useState<DebtTrends | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadTrends = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getTrends();
                setTrends(data);
            } catch (err) {
                console.error('Error loading trends:', err);
                setError('Não foi possível carregar as tendências');
            } finally {
                setIsLoading(false);
            }
        };

        loadTrends();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-5 w-5" />
                        Erro ao Carregar Tendências
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </CardContent>
            </Card>
        );
    }

    if (!trends || trends.debts.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                        Sem Dívidas para Analisar
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Você não possui dívidas ativas no momento.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const { summary, debts } = trends;
    const hasCriticalIssues = summary.snowballingDebts > 0 || summary.highRiskDebts > 0;

    return (
        <Card className={hasCriticalIssues ? 'border-red-500/50' : ''}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {hasCriticalIssues ? (
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                            ) : (
                                <TrendingDown className="h-5 w-5 text-green-600" />
                            )}
                            Análise de Tendências
                        </CardTitle>
                        <CardDescription className="mt-1">
                            Baseado nos últimos 3 meses
                        </CardDescription>
                    </div>
                    {hasCriticalIssues && (
                        <Badge variant="destructive" className="text-xs">
                            {summary.snowballingDebts} em Crescimento
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-muted p-3 text-center">
                        <div className="text-2xl font-bold">{summary.totalDebts}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                    </div>
                    <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-center">
                        <div className="text-2xl font-bold text-red-600">{summary.snowballingDebts}</div>
                        <div className="text-xs text-muted-foreground">Crescendo</div>
                    </div>
                    <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 text-center">
                        <div className="text-2xl font-bold text-amber-600">{summary.highRiskDebts}</div>
                        <div className="text-xs text-muted-foreground">Alto Risco</div>
                    </div>
                </div>

                {/* Debt Details */}
                <div className="space-y-3">
                    {debts.map((debt) => {
                        const riskColor = {
                            LOW: 'text-green-600',
                            MEDIUM: 'text-yellow-600',
                            HIGH: 'text-red-600',
                            CRITICAL: 'text-red-700'
                        }[debt.riskLevel];

                        const riskBg = {
                            LOW: 'bg-green-50 dark:bg-green-950/30 border-green-200',
                            MEDIUM: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200',
                            HIGH: 'bg-red-50 dark:bg-red-950/30 border-red-200',
                            CRITICAL: 'bg-red-100 dark:bg-red-950/50 border-red-300'
                        }[debt.riskLevel];

                        return (
                            <div key={debt.debtId} className={`rounded-lg border p-3 ${riskBg}`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium text-sm">{debt.debtName}</h4>
                                            <Badge variant={debt.isSnowballing ? 'destructive' : 'secondary'} className="text-xs">
                                                {debt.riskLevel}
                                            </Badge>
                                        </div>
                                        {debt.avgMonthlyPayment !== undefined && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Média mensal: {formatCurrency(debt.avgMonthlyPayment)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-medium ${riskColor}`}>
                                            {debt.monthlyChangeRate > 0 ? (
                                                <div className="flex items-center gap-1">
                                                    <TrendingUp className="h-4 w-4" />
                                                    +{debt.monthlyChangeRate.toFixed(1)}%
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <TrendingDown className="h-4 w-4" />
                                                    {debt.monthlyChangeRate.toFixed(1)}%
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Próximo: {formatCurrency(debt.projectedNextMonth)}
                                        </div>
                                    </div>
                                </div>

                                {/* Alerts */}
                                {debt.alerts.length > 0 && (
                                    <div className="space-y-1 mt-2 pt-2 border-t">
                                        {debt.alerts.map((alert, idx) => (
                                            <div key={idx} className="flex items-start gap-2 text-xs">
                                                <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                                                <span className="text-muted-foreground">{alert}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Global Warning */}
                {hasCriticalIssues && (
                    <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 p-4 flex gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-medium text-red-700 dark:text-red-400">Ação Urgente Necessária!</p>
                            <p className="text-red-600 dark:text-red-500 mt-1">
                                Você possui dívidas em crescimento. Considere aumentar os pagamentos mensais ou buscar renegociação.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
