'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus, PiggyBank, Target, CheckCircle2, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { handleApiError } from '@/lib/error-handler';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';

interface Insights {
    spendingTrend: {
        current: number;
        last: number;
        changePercent: number;
        direction: 'up' | 'down' | 'stable';
    };
    income: {
        current: number;
        last: number;
    };
    savingsRate: number;
    topCategory: {
        name: string;
        amount: number;
        percentage: number;
    } | null;
    budgetAdherence: {
        score: number;
        totalBudgets: number;
        budgetsOverLimit: number;
    };
    monthRange: {
        current: string;
        last: string;
    };
}

export function InsightsPanel() {
    const [insights, setInsights] = useState<Insights | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const response = await api.get('/analytics/insights');
                setInsights(response.data);
            } catch (error) {
                handleApiError(error, toast, 'Erro ao carregar insights');
            } finally {
                setIsLoading(false);
            }
        };

        fetchInsights();
    }, [toast]);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-24" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!insights) return null;

    const getTrendIcon = () => {
        switch (insights.spendingTrend.direction) {
            case 'up':
                return <TrendingUp className="h-4 w-4 text-red-500" />;
            case 'down':
                return <TrendingDown className="h-4 w-4 text-green-500" />;
            default:
                return <Minus className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getTrendColor = () => {
        switch (insights.spendingTrend.direction) {
            case 'up':
                return 'text-red-600';
            case 'down':
                return 'text-green-600';
            default:
                return 'text-muted-foreground';
        }
    };

    const getBudgetScoreColor = () => {
        if (insights.budgetAdherence.score >= 80) return 'text-green-600';
        if (insights.budgetAdherence.score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card>
                <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-lg">📊 Insights Financeiros</CardTitle>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                            </Button>
                        </div>
                    </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                    <CardContent className="pt-0">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {/* Spending Trend */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Tendência de Gastos</CardTitle>
                                    {getTrendIcon()}
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        R$ {insights.spendingTrend.current.toFixed(2)}
                                    </div>
                                    <p className={`text-xs ${getTrendColor()}`}>
                                        {insights.spendingTrend.direction === 'up' ? '+' : ''}
                                        {insights.spendingTrend.changePercent.toFixed(1)}% vs mês anterior
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Anterior: R$ {insights.spendingTrend.last.toFixed(2)}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Savings Rate */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Taxa de Poupança</CardTitle>
                                    <PiggyBank className="h-4 w-4 text-blue-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {insights.savingsRate.toFixed(1)}%
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {insights.savingsRate >= 20
                                            ? '🎉 Excelente poupança!'
                                            : insights.savingsRate >= 10
                                                ? '👍 Bom ritmo'
                                                : '⚠️ Pode melhorar'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Renda: R$ {insights.income.current.toFixed(2)}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Top Category */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Maior Categoria</CardTitle>
                                    <Target className="h-4 w-4 text-orange-500" />
                                </CardHeader>
                                <CardContent>
                                    {insights.topCategory ? (
                                        <>
                                            <div className="text-2xl font-bold">
                                                R$ {insights.topCategory.amount.toFixed(2)}
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {insights.topCategory.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {insights.topCategory.percentage.toFixed(1)}% do total
                                            </p>
                                        </>
                                    ) : (
                                        <p className="text-sm text-muted-foreground">Sem dados</p>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Budget Adherence */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Score de Orçamentos</CardTitle>
                                    <CheckCircle2 className="h-4 w-4 text-purple-500" />
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${getBudgetScoreColor()}`}>
                                        {insights.budgetAdherence.score.toFixed(0)}/100
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {insights.budgetAdherence.budgetsOverLimit > 0
                                            ? `${insights.budgetAdherence.budgetsOverLimit} orçamento(s) excedido(s)`
                                            : '✅ Todos dentro do limite'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {insights.budgetAdherence.totalBudgets} orçamento(s) ativos
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
