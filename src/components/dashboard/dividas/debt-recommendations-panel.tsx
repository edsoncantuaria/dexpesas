'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Lightbulb, AlertCircle, DollarSign, Target, TrendingUp, Info } from 'lucide-react';
import { useDebts, type DebtRecommendations } from '@/hooks/use-debts';
import { formatCurrency } from '@/lib/utils';

export function DebtRecommendationsPanel() {
    const { getRecommendations, debts } = useDebts();
    const [recommendations, setRecommendations] = useState<DebtRecommendations | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadRecommendations = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const data = await getRecommendations();
                setRecommendations(data);
            } catch (err) {
                console.error('Error loading recommendations:', err);
                setError('Não foi possível carregar as recomendações');
            } finally {
                setIsLoading(false);
            }
        };

        loadRecommendations();
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
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                        <AlertCircle className="h-5 w-5" />
                        Erro ao Carregar Recomendações
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">{error}</p>
                </CardContent>
            </Card>
        );
    }

    if (!recommendations || recommendations.suggestedStrategy === 'NONE') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-600">
                        <Target className="h-5 w-5" />
                        Parabéns! Sem Dívidas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Você não possui dívidas ativas no momento. Continue mantendo suas finanças saudáveis!
                    </p>
                </CardContent>
            </Card>
        );
    }

    const {
        suggestedStrategy,
        priorityDebts,
        suggestedExtraPayment,
        avgMonthlyIncome,
        currentDTI,
        reasoning,
        warnings
    } = recommendations;

    const strategyInfo = {
        SNOWBALL: {
            name: 'Bola de Neve (Snowball)',
            description: 'Pague as menores dívidas primeiro para ganhar motivação com vitórias rápidas',
            icon: '❄️'
        },
        AVALANCHE: {
            name: 'Avalanche',
            description: 'Pague as dívidas com maiores juros primeiro para economizar mais dinheiro',
            icon: '🏔️'
        },
        HYBRID: {
            name: 'Híbrida',
            description: 'Combine as duas estratégias para melhor resultado',
            icon: '⚖️'
        },
        NONE: {
            name: 'Nenhuma',
            description: '',
            icon: ''
        }
    };

    const strategy = strategyInfo[suggestedStrategy];
    const dtiColor = currentDTI > 40 ? 'text-red-600' : currentDTI > 30 ? 'text-yellow-600' : 'text-green-600';
    const dtiBgColor = currentDTI > 40 ? 'bg-red-50 dark:bg-red-950/30' : currentDTI > 30 ? 'bg-yellow-50 dark:bg-yellow-950/30' : 'bg-green-50 dark:bg-green-950/30';

    // Get priority debt details
    const priorityDebtDetails = debts.filter(d => priorityDebts.includes(d.id)).slice(0, 3);

    return (
        <div className="space-y-4">
            {/* Main Recommendation Card */}
            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Lightbulb className="h-5 w-5 text-amber-500" />
                                Recomendações Personalizadas
                            </CardTitle>
                            <CardDescription className="mt-1">
                                Baseado na sua renda e histórico dos últimos 3 meses
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="text-xs">
                            DTI: <span className={`ml-1 font-bold ${dtiColor}`}>{currentDTI}%</span>
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Strategy Recommendation */}
                    <div className="rounded-lg border-2 border-primary/20 bg-primary/5 p-4">
                        <div className="flex items-start gap-3">
                            <div className="text-3xl">{strategy.icon}</div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-1">Estratégia Recomendada</h3>
                                <p className="text-primary font-medium">{strategy.name}</p>
                                <p className="text-sm text-muted-foreground mt-1">{strategy.description}</p>
                            </div>
                        </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`rounded-lg p-4 ${dtiBgColor}`}>
                            <div className="flex items-center gap-2 mb-1">
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Renda Média Mensal</span>
                            </div>
                            <div className="text-2xl font-bold">{formatCurrency(avgMonthlyIncome)}</div>
                        </div>
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4">
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Pagamento Extra Sugerido</span>
                            </div>
                            <div className="text-2xl font-bold text-blue-600">{formatCurrency(suggestedExtraPayment)}</div>
                        </div>
                    </div>

                    {/* Priority Debts */}
                    {priorityDebtDetails.length > 0 && (
                        <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Dívidas Prioritárias
                            </h4>
                            <div className="space-y-2">
                                {priorityDebtDetails.map((debt, index) => (
                                    <div key={debt.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{debt.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatCurrency(Number(debt.currentBalance))} • {Number(debt.interestRate)}% a.m.
                                            </p>
                                        </div>
                                        <Badge variant="secondary" className="text-xs">
                                            Prioridade {index + 1}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Reasoning */}
                    {reasoning.length > 0 && (
                        <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 p-4">
                            <div className="flex items-start gap-2 mb-2">
                                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100">Por Que Essa Estratégia?</h4>
                            </div>
                            <ul className="space-y-1 ml-6">
                                {reasoning.map((reason, idx) => (
                                    <li key={idx} className="text-sm text-blue-800 dark:text-blue-200">
                                        {reason}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Warnings */}
                    {warnings.length > 0 && (
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 p-4">
                            <div className="flex items-start gap-2 mb-2">
                                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-100">Atenção!</h4>
                            </div>
                            <ul className="space-y-1 ml-6">
                                {warnings.map((warning, idx) => (
                                    <li key={idx} className="text-sm text-amber-800 dark:text-amber-200">
                                        {warning}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-2">
                        <p className="text-xs text-muted-foreground text-center mb-3">
                            Use os botões "Pagar" nas suas dívidas prioritárias para começar a implementar essa estratégia
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
