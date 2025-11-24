'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Calculator, TrendingUp, Award, Calendar, DollarSign, Sparkles } from 'lucide-react';
import { useDebts, type ScenarioSimulation } from '@/hooks/use-debts';

interface Scenario {
    name: string;
    strategy: string;
    extraMonthly: number;
}

export function DebtSimulatorCard() {
    const { simulateScenarios } = useDebts();
    const [scenarios, setScenarios] = useState<Scenario[]>([
        { name: 'Apenas Mínimo', strategy: 'SNOWBALL', extraMonthly: 0 },
        { name: 'Snowball + Extra', strategy: 'SNOWBALL', extraMonthly: 300 },
        { name: 'Avalanche + Extra', strategy: 'AVALANCHE', extraMonthly: 300 }
    ]);
    const [customExtra, setCustomExtra] = useState('500');
    const [simulation, setSimulation] = useState<ScenarioSimulation | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const runSimulation = async () => {
        setIsLoading(true);
        try {
            const result = await simulateScenarios(scenarios);
            setSimulation(result);
        } catch (error) {
            console.error('Error simulating:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        runSimulation();
    }, []);

    const addCustomScenario = () => {
        const extra = parseFloat(customExtra) || 0;
        if (extra > 0) {
            setScenarios([
                ...scenarios,
                { name: `Extra R$ ${extra}`, strategy: 'SNOWBALL', extraMonthly: extra }
            ]);
        }
    };

    const removeScenario = (index: number) => {
        if (scenarios.length > 1) {
            setScenarios(scenarios.filter((_, i) => i !== index));
        }
    };

    if (isLoading && !simulation) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-64 w-full" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Simulador de Cenários
                </CardTitle>
                <CardDescription>
                    Compare diferentes estratégias de pagamento side-by-side
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Add Custom Scenario */}
                <div className="flex gap-2">
                    <div className="flex-1">
                        <Label htmlFor="custom-extra" className="text-xs mb-1 block">
                            Adicionar Cenário Personalizado
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="custom-extra"
                                type="number"
                                placeholder="Ex: 500"
                                value={customExtra}
                                onChange={(e) => setCustomExtra(e.target.value)}
                                className="flex-1"
                            />
                            <Button
                                onClick={() => {
                                    addCustomScenario();
                                    runSimulation();
                                }}
                                size="sm"
                                variant="outline"
                            >
                                Adicionar
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Scenarios Comparison */}
                {simulation && simulation.scenarios.length > 0 ? (
                    <div className="space-y-4">
                        {/* Best Option Highlight */}
                        {simulation.bestOption && (
                            <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border-2 border-green-500/50 p-4">
                                <div className="flex items-start gap-3">
                                    <Award className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                                            🏆 Melhor Opção: {simulation.bestOption.name}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                                            <div>
                                                <span className="text-green-700 dark:text-green-300 block text-xs">Juros Total</span>
                                                <span className="font-bold text-green-900 dark:text-green-100">
                                                    {formatCurrency(simulation.bestOption.totalInterest)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-green-700 dark:text-green-300 block text-xs">Tempo</span>
                                                <span className="font-bold text-green-900 dark:text-green-100">
                                                    {simulation.bestOption.totalMonths} meses
                                                </span>
                                            </div>
                                        </div>
                                        {simulation.savings > 0 && (
                                            <p className="text-xs text-green-700 dark:text-green-300 mt-2 flex items-center gap-1">
                                                <Sparkles className="h-3 w-3" />
                                                Economiza <strong>{formatCurrency(simulation.savings)}</strong> comparado à pior opção!
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Scenarios Grid */}
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                            {simulation.scenarios.map((scenario, index) => {
                                const isBest = simulation.bestOption && scenario.name === simulation.bestOption.name;
                                const isWorst = index === simulation.scenarios.length - 1;

                                return (
                                    <div
                                        key={index}
                                        className={`rounded-lg border p-4 ${isBest
                                                ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20'
                                                : isWorst
                                                    ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20'
                                                    : 'border-border'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h4 className="font-semibold text-sm">{scenario.name}</h4>
                                            {scenarios.length > 1 && index >= 3 && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                                    onClick={() => {
                                                        removeScenario(index);
                                                        runSimulation();
                                                    }}
                                                >
                                                    ×
                                                </Button>
                                            )}
                                        </div>

                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <DollarSign className="h-3 w-3" />
                                                <span className="text-xs">Extra Mensal:</span>
                                                <span className="font-medium ml-auto">
                                                    {formatCurrency(scenario.extraMonthly)}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Calendar className="h-3 w-3" />
                                                <span className="text-xs">Duração:</span>
                                                <span className="font-medium ml-auto">
                                                    {scenario.totalMonths} {scenario.totalMonths === 1 ? 'mês' : 'meses'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <TrendingUp className="h-3 w-3" />
                                                <span className="text-xs">Juros Total:</span>
                                                <span className="font-medium ml-auto text-red-600">
                                                    {formatCurrency(scenario.totalInterest)}
                                                </span>
                                            </div>

                                            <div className="pt-2 border-t">
                                                <div className="text-xs text-muted-foreground">Pagamento Mensal</div>
                                                <div className="font-bold text-lg">
                                                    {formatCurrency(scenario.monthlyPayment)}
                                                </div>
                                            </div>
                                        </div>

                                        {isBest && (
                                            <div className="mt-3 pt-3 border-t">
                                                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                                    <Award className="h-3 w-3" />
                                                    <span className="font-medium">Melhor Custo-Benefício</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Action Button */}
                        <div className="flex justify-center pt-2">
                            <Button
                                onClick={runSimulation}
                                disabled={isLoading}
                                variant="outline"
                                size="sm"
                            >
                                {isLoading ? 'Recalculando...' : 'Atualizar Simulação'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>Adicione dívidas para simular cenários de pagamento</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
