'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingScreen } from '@/components/ui/loading-screen';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handler';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend
} from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface NetWorthPoint {
    date: Date;
    month: string;
    monthKey: string;
    accounts: number;
    goals: number;
    debts: number;
    netWorth: number;
}

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function PatrimonyEvolutionChart() {
    const [data, setData] = useState<NetWorthPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        async function fetchData() {
            setIsLoading(true);
            try {
                const response = await api.get<NetWorthPoint[]>('/analytics/net-worth-history?months=12');
                setData(response.data);
            } catch (error) {
                handleApiError(error, toast, 'Erro ao carregar evolução patrimonial');
            } finally {
                setIsLoading(false);
            }
        }

        fetchData();
    }, [toast]);

    const customTooltip = ({ active, payload }: any) => {
        if (!active || !payload || !payload.length) return null;

        const point = payload[0].payload;

        return (
            <div className="bg-popover border rounded-lg p-3 shadow-lg">
                <p className="text-sm font-medium mb-2">{point.month}</p>
                <div className="space-y-1 text-xs">
                    <p className="text-green-600">
                        Contas: {formatCurrency(point.accounts)}
                    </p>
                    <p className="text-blue-600">
                        Metas: {formatCurrency(point.goals)}
                    </p>
                    <p className="text-red-600">
                        Dívidas: {formatCurrency(point.debts)}
                    </p>
                    <p className="text-primary font-bold border-t pt-1 mt-1">
                        Patrimônio: {formatCurrency(point.netWorth)}
                    </p>
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Evolução Patrimonial</CardTitle>
                    <CardDescription>Histórico do seu patrimônio líquido</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] flex items-center justify-center">
                    <LoadingScreen />
                </CardContent>
            </Card>
        );
    }

    if (data.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Evolução Patrimonial</CardTitle>
                    <CardDescription>Histórico do seu patrimônio líquido</CardDescription>
                </CardHeader>
                <CardContent className="h-[400px] flex items-center justify-center">
                    <p className="text-muted-foreground">
                        Dados insuficientes para mostrar a evolução.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const firstValue = data[0]?.netWorth || 0;
    const lastValue = data[data.length - 1]?.netWorth || 0;
    const change = lastValue - firstValue;
    const changePercent = firstValue !== 0 ? ((change / firstValue) * 100) : 0;
    const isPositive = change >= 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div>
                        <CardTitle>Evolução Patrimonial</CardTitle>
                        <CardDescription>Últimos 12 meses</CardDescription>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold">{formatCurrency(lastValue)}</div>
                        <div className={`text-sm flex items-center gap-1 justify-end ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            {isPositive ? '+' : ''}{formatCurrency(change)} ({changePercent.toFixed(1)}%)
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={data}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorAccounts" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorGoals" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                            <XAxis
                                dataKey="month"
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => value.split(' ')[0]} // Show only month abbreviation
                            />
                            <YAxis
                                tick={{ fontSize: 12 }}
                                tickFormatter={(value) => {
                                    const formatted = formatCurrency(value);
                                    return formatted.replace('R$', '').trim();
                                }}
                            />
                            <Tooltip content={customTooltip} />
                            <Legend />
                            <Area
                                type="monotone"
                                dataKey="accounts"
                                name="Contas"
                                stroke="#10b981"
                                fillOpacity={1}
                                fill="url(#colorAccounts)"
                                stackId="1"
                            />
                            <Area
                                type="monotone"
                                dataKey="goals"
                                name="Metas"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#colorGoals)"
                                stackId="1"
                            />
                            <Area
                                type="monotone"
                                dataKey="netWorth"
                                name="Patrimônio Líquido"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorNetWorth)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-xs text-muted-foreground text-center">
                    <p>💡 Patrimônio Líquido = (Contas + Metas) - Dívidas de Cartão</p>
                </div>
            </CardContent>
        </Card>
    );
}
