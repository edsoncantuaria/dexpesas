import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SpendingPieChart } from './spending-pie-chart';
import { MonthlyHistoryChart } from './monthly-history-chart';
import { FutureInvoiceProjection } from './future-invoice-projection';
import { CreditCardSimulators } from '../simulators/credit-card-simulators';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

interface CardAnalyticsTabProps {
    cardId: string;
    limit: number;
}

export function CardAnalyticsTab({ cardId, limit }: CardAnalyticsTabProps) {
    const [spendingData, setSpendingData] = useState<any>(null);
    const [historyData, setHistoryData] = useState<any>(null);
    const [projectionData, setProjectionData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [spendingRes, historyRes, projectionRes] = await Promise.all([
                    api.get(`/cards/${cardId}/analytics/spending`),
                    api.get(`/cards/${cardId}/analytics/history`),
                    api.get(`/cards/${cardId}/analytics/projection`)
                ]);

                setSpendingData(spendingRes.data);
                setHistoryData(historyRes.data);
                setProjectionData(projectionRes.data);
            } catch (error: any) {
                console.error('Analytics fetch error:', error);
                console.error('Error response:', error.response?.data);
                console.error('Error status:', error.response?.status);
                toast({
                    variant: "destructive",
                    title: "Erro",
                    description: error.response?.data?.message || "Não foi possível carregar as análises."
                });
            } finally {
                setLoading(false);
            }
        };

        if (cardId) {
            fetchData();
        }
    }, [cardId, toast]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Análise de Gastos e Projeções</h3>
                <CreditCardSimulators />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Gastos por Categoria */}
                <SpendingPieChart
                    data={spendingData?.categories || []}
                    total={spendingData?.total || 0}
                />

                {/* Projeção Futura */}
                <div className="space-y-6">
                    <FutureInvoiceProjection
                        data={projectionData || []}
                        limit={limit}
                    />

                    {/* Top Gasto (Simplified) */}
                    {spendingData?.categories?.[0] && (
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium">Maior Gasto do Mês</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{spendingData.categories[0].name}</div>
                                <p className="text-xs text-muted-foreground">
                                    R$ {spendingData.categories[0].value.toFixed(2)} ({spendingData.categories[0].percentage.toFixed(1)}%)
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Histórico Mensal */}
            <MonthlyHistoryChart data={historyData || []} />
        </div>
    );
}
