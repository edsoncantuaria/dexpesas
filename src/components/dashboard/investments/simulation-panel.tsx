'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInvestments } from '@/hooks/use-investments';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function SimulationPanel() {
    const { simulateScenarios } = useInvestments();
    const [monthlyContribution, setMonthlyContribution] = useState('500');
    const [years, setYears] = useState('10');
    const [rate, setRate] = useState('10');
    const [results, setResults] = useState<any[]>([]);

    const handleSimulate = async () => {
        const scenario = {
            name: `Aporte R$ ${monthlyContribution} (${rate}% a.a)`,
            monthlyContribution: Number(monthlyContribution),
            expectedReturnYearly: Number(rate),
            years: Number(years),
        };

        const data = await simulateScenarios([scenario]);
        setResults(data);
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Parâmetros da Simulação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Aporte Mensal (R$)</Label>
                        <Input
                            type="number"
                            value={monthlyContribution}
                            onChange={(e) => setMonthlyContribution(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Taxa Anual Esperada (%)</Label>
                        <Input
                            type="number"
                            value={rate}
                            onChange={(e) => setRate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Período (Anos)</Label>
                        <Input
                            type="number"
                            value={years}
                            onChange={(e) => setYears(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleSimulate} className="w-full">Simular</Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Projeção de Patrimônio</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    {results.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={results[0].evolution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="year" label={{ value: 'Anos', position: 'insideBottomRight', offset: -5 }} />
                                <YAxis tickFormatter={(val) => `R$ ${(val / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)} />
                                <Legend />
                                <Line type="monotone" dataKey="amount" name="Total Acumulado" stroke="#8884d8" strokeWidth={2} />
                                <Line type="monotone" dataKey="invested" name="Total Investido" stroke="#82ca9d" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground">
                            Execute uma simulação para ver o gráfico.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
