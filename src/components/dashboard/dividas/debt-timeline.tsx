'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';

interface Debt {
    id: string;
    name: string;
    balance: number;
    interestRate: number;
    minimumPayment: number;
}

interface TimelineProps {
    debts: Debt[];
    strategy: 'snowball' | 'avalanche';
    extraPayment: number;
}

export function DebtTimeline({ debts, strategy, extraPayment }: TimelineProps) {
    const calculateTimeline = () => {
        if (debts.length === 0) return [];

        // Sort debts based on strategy
        const sortedDebts = strategy === 'snowball'
            ? [...debts].sort((a, b) => a.balance - b.balance)
            : [...debts].sort((a, b) => b.interestRate - a.interestRate);

        const timeline: { month: number;[key: string]: number }[] = [];
        const remainingDebts = sortedDebts.map(d => ({ ...d, remainingBalance: d.balance }));
        const totalMinimumPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
        const totalAvailable = totalMinimumPayment + extraPayment;

        let month = 0;

        while (remainingDebts.some(d => d.remainingBalance > 0) && month < 360) {
            month++;
            let availableFunds = totalAvailable;

            // Pay minimum on all debts
            remainingDebts.forEach(debt => {
                if (debt.remainingBalance > 0) {
                    const payment = Math.min(debt.minimumPayment, debt.remainingBalance);
                    availableFunds -= payment;
                }
            });

            // Apply extra to first debt with balance
            const targetDebt = remainingDebts.find(d => d.remainingBalance > 0);
            if (targetDebt && availableFunds > 0) {
                const extraPmt = Math.min(availableFunds, targetDebt.remainingBalance);
                availableFunds -= extraPmt;
            }

            // Calculate interest and apply payments
            remainingDebts.forEach(debt => {
                if (debt.remainingBalance > 0) {
                    const monthlyInterestRate = debt.interestRate / 100 / 12;
                    const interest = debt.remainingBalance * monthlyInterestRate;
                    const payment = Math.min(debt.minimumPayment, debt.remainingBalance);
                    const isTarget = debt === targetDebt;
                    const totalPayment = payment + (isTarget && availableFunds > 0 ? Math.min(availableFunds, debt.remainingBalance - payment) : 0);
                    debt.remainingBalance = Math.max(0, debt.remainingBalance + interest - totalPayment);
                }
            });

            // Store data for chart (every 6 months for readability)
            if (month % 6 === 0 || month === 1) {
                const dataPoint: { month: number;[key: string]: number } = { month };
                remainingDebts.forEach(debt => {
                    dataPoint[debt.name] = Math.round(debt.remainingBalance);
                });
                timeline.push(dataPoint);
            }
        }

        return timeline;
    };

    const timelineData = calculateTimeline();
    const debtKeys = debts.map(d => d.name);
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(value);

    if (debts.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground text-center">
                        Adicione dívidas para visualizar a timeline de quitação
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Timeline de Quitação</CardTitle>
                        <CardDescription>
                            Projeção de como suas dívidas serão quitadas ao longo do tempo
                        </CardDescription>
                    </div>
                    <Badge variant={strategy === 'snowball' ? 'default' : 'secondary'}>
                        {strategy === 'snowball' ? 'Snowball' : 'Avalanche'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={timelineData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis
                            dataKey="month"
                            label={{ value: 'Meses', position: 'insideBottom', offset: -5 }}
                            className="text-xs"
                        />
                        <YAxis
                            tickFormatter={(value) => formatCurrency(value)}
                            className="text-xs"
                        />
                        <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                            contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                            }}
                        />
                        <Legend />
                        {debtKeys.map((key, index) => (
                            <Bar
                                key={key}
                                dataKey={key}
                                stackId="a"
                                fill={colors[index % colors.length]}
                                radius={index === debtKeys.length - 1 ? [4, 4, 0, 0] : 0}
                            />
                        ))}
                    </BarChart>
                </ResponsiveContainer>

                {/* Legend */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                    {debts.map((debt, index) => (
                        <div key={debt.id} className="flex items-center gap-2">
                            <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: colors[index % colors.length] }}
                            />
                            <span className="text-sm text-muted-foreground truncate">{debt.name}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
