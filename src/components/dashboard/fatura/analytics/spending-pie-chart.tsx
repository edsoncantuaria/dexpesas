import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CategoryData {
    id: string;
    name: string;
    color: string;
    value: number;
    percentage: number;
}

interface SpendingPieChartProps {
    data: CategoryData[];
    total: number;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return percent > 0.05 ? (
        <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    ) : null;
};

export function SpendingPieChart({ data, total }: SpendingPieChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Gastos por Categoria</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
                    Nenhum dado disponível para este período.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Gastos por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={renderCustomizedLabel}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Valor']}
                            />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                    {data.slice(0, 5).map((cat) => (
                        <div key={cat.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                <span>{cat.name}</span>
                            </div>
                            <div className="font-medium">
                                {cat.percentage.toFixed(1)}% (R$ {cat.value.toFixed(2)})
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
