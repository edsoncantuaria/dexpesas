import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface HistoryData {
    month: string;
    fullDate: string;
    amount: number;
    variation: number;
}

interface MonthlyHistoryChartProps {
    data: HistoryData[];
}

export function MonthlyHistoryChart({ data }: MonthlyHistoryChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Evolução de Gastos</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Nenhum dado disponível.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Evolução de Gastos (6 meses)</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={data}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="month" tickLine={false} axisLine={false} />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `R$${value}`}
                            />
                            <Tooltip
                                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Total']}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#3b82f6' : '#94a3b8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 text-sm text-muted-foreground text-center">
                    Comparativo com mês anterior:
                    <span className={data[data.length - 1].variation > 0 ? "text-red-500 ml-1" : "text-green-500 ml-1"}>
                        {data[data.length - 1].variation > 0 ? '+' : ''}{data[data.length - 1].variation.toFixed(1)}%
                    </span>
                </div>
            </CardContent>
        </Card>
    );
}
