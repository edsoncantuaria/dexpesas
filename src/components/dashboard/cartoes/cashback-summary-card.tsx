// src/components/dashboard/cartoes/cashback-summary-card.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, TrendingUp, Calendar, Coins } from 'lucide-react';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface CashbackSummaryProps {
    cardId: string;
    cardName: string;
}

interface CashbackData {
    card: {
        totalCashbackEarned: number;
        defaultCashbackRate: number;
        cashbackRedemptionMinimum?: number;
        rewardsType?: string;
    };
    summary: {
        totalCashback: number;
        transactionCount: number;
        avgPercentage: number;
    };
}

export function CashbackSummaryCard({ cardId, cardName }: CashbackSummaryProps) {
    const [cashbackData, setCashbackData] = useState<CashbackData | null>(null);
    const [loading, setLoading] = useState(true);
    const [monthCashback, setMonthCashback] = useState(0);

    useEffect(() => {
        fetchCashbackData();
    }, [cardId]);

    const fetchCashbackData = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/cards/${cardId}/cashback`);
            setCashbackData(response.data);

            // Buscar cashback do mês atual
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthResponse = await api.get(`/cards/${cardId}/cashback`, {
                params: {
                    startDate: startOfMonth.toISOString(),
                    endDate: now.toISOString()
                }
            });
            setMonthCashback(monthResponse.data.summary.totalCashback || 0);
        } catch (error) {
            console.error('Erro ao buscar cashback:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-16 w-full" />
                </CardContent>
            </Card>
        );
    }

    // Só exibe se o cartão tiver cashback configurado como tipo de benefício
    if (!cashbackData ||
        cashbackData.card.rewardsType !== 'cashback' ||
        cashbackData.card.defaultCashbackRate === 0) {
        return null;
    }

    const totalEarned = Number(cashbackData.card.totalCashbackEarned);
    const canRedeem = cashbackData.card.cashbackRedemptionMinimum
        ? totalEarned >= Number(cashbackData.card.cashbackRedemptionMinimum)
        : totalEarned > 0;

    return (
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardHeader className="space-y-2">
                <div className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <CardTitle className="text-green-900 dark:text-green-100">Cashback</CardTitle>
                </div>
                <CardDescription className="text-green-700/80 dark:text-green-300/80">
                    {cardName} • {cashbackData.card.defaultCashbackRate}% de retorno
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Total Acumulado */}
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-muted-foreground flex items-center gap-1 mb-1">
                                <Coins className="h-4 w-4 flex-shrink-0" />
                                <span>Total Acumulado</span>
                            </p>
                            <p className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                                {formatCurrency(totalEarned)}
                            </p>
                        </div>
                        {canRedeem && (
                            <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 flex-shrink-0"
                                onClick={() => {/* TODO: Abrir dialog de resgate */ }}
                            >
                                Resgatar
                            </Button>
                        )}
                    </div>
                </div>

                {/* Estatísticas */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <Calendar className="h-4 w-4 flex-shrink-0" />
                            <p className="text-xs font-medium truncate">Este Mês</p>
                        </div>
                        <p className="text-base sm:text-lg font-semibold text-green-600 dark:text-green-400 truncate">
                            {formatCurrency(monthCashback)}
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 shadow-sm">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                            <TrendingUp className="h-4 w-4 flex-shrink-0" />
                            <p className="text-xs font-medium truncate">Transações</p>
                        </div>
                        <p className="text-base sm:text-lg font-semibold truncate">
                            {cashbackData.summary.transactionCount}
                        </p>
                    </div>
                </div>

                {cashbackData.card.cashbackRedemptionMinimum && totalEarned < Number(cashbackData.card.cashbackRedemptionMinimum) && (
                    <div className="text-xs text-center text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                        Resgate disponível a partir de {formatCurrency(Number(cashbackData.card.cashbackRedemptionMinimum))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
