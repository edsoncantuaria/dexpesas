'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Calculator } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import { useDebts } from '@/hooks/use-debts';
import { useEffect } from 'react';

interface Debt {
    id: string;
    name: string;
    balance: number;
    interestRate: number;
    minimumPayment: number;
    debtType?: string;
}

interface PayoffResult {
    totalMonths: number;
    totalInterest: number;
    totalPaid: number;
    monthlySchedule: {
        month: number;
        payments: { debtName: string; payment: number }[];
        remainingBalances: { debtName: string; balance: number }[];
    }[];
}

export function DebtCalculator() {
    const { debts: apiDebts, fetchDebts, createDebt, deleteDebt } = useDebts();
    const [extraPayment, setExtraPayment] = useState(0);
    const [newDebt, setNewDebt] = useState({
        name: '',
        balance: 0,
        interestRate: 0,
        minimumPayment: 0,
        debtType: 'CREDIT_CARD'
    });

    useEffect(() => {
        fetchDebts();
    }, [fetchDebts]);

    // Map API debts to local interface for calculation
    const debts: Debt[] = apiDebts.map(d => ({
        id: d.id,
        name: d.name,
        balance: Number(d.currentBalance),
        interestRate: Number(d.interestRate),
        minimumPayment: Number(d.minimumPayment),
        debtType: d.debtType
    }));

    const handleAddDebt = async () => {
        if (!newDebt.name || newDebt.balance <= 0) return;

        try {
            await createDebt({
                name: newDebt.name,
                currentBalance: newDebt.balance,
                interestRate: newDebt.interestRate,
                minimumPayment: newDebt.minimumPayment,
                originalAmount: newDebt.balance, // Assuming starting with current balance
                debtType: newDebt.debtType
            });
            setNewDebt({ name: '', balance: 0, interestRate: 0, minimumPayment: 0, debtType: 'CREDIT_CARD' });
        } catch (error) {
            // Error handling is done in the hook
        }
    };

    const handleRemoveDebt = async (id: string) => {
        await deleteDebt(id);
    };

    const calculateSnowball = (): PayoffResult => {
        // Sort by balance (smallest first)
        const sortedDebts = [...debts].sort((a, b) => a.balance - b.balance);
        return calculatePayoff(sortedDebts);
    };

    const calculateAvalanche = (): PayoffResult => {
        // Sort by interest rate (highest first)
        const sortedDebts = [...debts].sort((a, b) => b.interestRate - a.interestRate);
        return calculatePayoff(sortedDebts);
    };

    const calculatePayoff = (sortedDebts: Debt[]): PayoffResult => {
        let month = 0;
        let totalInterest = 0;
        const monthlySchedule: PayoffResult['monthlySchedule'] = [];

        // Create working copy with remaining balances
        const workingDebts = sortedDebts.map(d => ({
            ...d,
            remainingBalance: d.balance
        }));

        const totalMinimumPayment = debts.reduce((sum, d) => sum + d.minimumPayment, 0);
        const totalAvailable = totalMinimumPayment + extraPayment;

        while (workingDebts.some(d => d.remainingBalance > 0.01)) {
            month++;
            if (month > 600) break; // Safety limit (50 years)

            const payments: { debtName: string; payment: number }[] = [];
            let remainingFunds = totalAvailable;

            // Step 1: Pay minimum on ALL debts that have balance
            for (const debt of workingDebts) {
                if (debt.remainingBalance > 0.01) {
                    const minimumPayment = Math.min(debt.minimumPayment, debt.remainingBalance);
                    payments.push({ debtName: debt.name, payment: minimumPayment });
                    remainingFunds -= minimumPayment;
                } else {
                    payments.push({ debtName: debt.name, payment: 0 });
                }
            }

            // Step 2: Apply extra payment to FIRST debt with balance (based on strategy sort)
            if (remainingFunds > 0) {
                const targetDebt = workingDebts.find(d => d.remainingBalance > 0.01);
                if (targetDebt) {
                    const extraPaymentAmount = Math.min(remainingFunds, targetDebt.remainingBalance);
                    const paymentIndex = payments.findIndex(p => p.debtName === targetDebt.name);
                    if (paymentIndex !== -1) {
                        payments[paymentIndex].payment += extraPaymentAmount;
                    }
                }
            }

            // Step 3: Apply interest and subtract payments
            for (let i = 0; i < workingDebts.length; i++) {
                const debt = workingDebts[i];
                if (debt.remainingBalance > 0.01) {
                    // Calculate monthly interest
                    const monthlyInterestRate = (debt.interestRate / 100) / 12;
                    const interest = debt.remainingBalance * monthlyInterestRate;
                    totalInterest += interest;

                    // Apply payment
                    const payment = payments[i].payment;
                    debt.remainingBalance = Math.max(0, debt.remainingBalance + interest - payment);
                }
            }

            // Record this month's state
            monthlySchedule.push({
                month,
                payments,
                remainingBalances: workingDebts.map(d => ({
                    debtName: d.name,
                    balance: Math.max(0, d.remainingBalance)
                }))
            });
        }

        const totalPaid = debts.reduce((sum, d) => sum + d.balance, 0) + totalInterest;

        return {
            totalMonths: month,
            totalInterest,
            totalPaid,
            monthlySchedule
        };
    };

    const snowballResult = debts.length > 0 ? calculateSnowball() : null;
    const avalancheResult = debts.length > 0 ? calculateAvalanche() : null;

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    const formatMonths = (months: number) => {
        const years = Math.floor(months / 12);
        const remainingMonths = months % 12;
        if (years === 0) return `${months} meses`;
        if (remainingMonths === 0) return `${years} ${years === 1 ? 'ano' : 'anos'}`;
        return `${years} ${years === 1 ? 'ano' : 'anos'} e ${remainingMonths} ${remainingMonths === 1 ? 'mês' : 'meses'}`;
    };

    return (
        <div className="space-y-6">
            {/* Add Debt Form */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Plus className="h-5 w-5" />
                        Adicionar Dívida
                    </CardTitle>
                    <CardDescription>
                        Informe os detalhes de cada dívida que deseja quitar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Nome da Dívida</Label>
                                <Input
                                    placeholder="Ex: Cartão Nubank"
                                    value={newDebt.name}
                                    onChange={(e) => setNewDebt({ ...newDebt, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select
                                    value={newDebt.debtType}
                                    onValueChange={(value) => setNewDebt({ ...newDebt, debtType: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="CREDIT_CARD">Cartão de Crédito</SelectItem>
                                        <SelectItem value="PERSONAL_LOAN">Empréstimo Pessoal</SelectItem>
                                        <SelectItem value="MORTGAGE">Financiamento Imobiliário</SelectItem>
                                        <SelectItem value="AUTO_LOAN">Financiamento Veículo</SelectItem>
                                        <SelectItem value="STUDENT_LOAN">Empréstimo Estudantil</SelectItem>
                                        <SelectItem value="OTHER">Outro</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Saldo Devedor</Label>
                                <Input
                                    type="number"
                                    placeholder="0,00"
                                    value={newDebt.balance || ''}
                                    onChange={(e) => setNewDebt({ ...newDebt, balance: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Taxa de Juros (% a.m.)</Label>
                                <Input
                                    type="number"
                                    placeholder="0,00"
                                    value={newDebt.interestRate || ''}
                                    onChange={(e) => setNewDebt({ ...newDebt, interestRate: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Pagamento Mínimo</Label>
                                <Input
                                    type="number"
                                    placeholder="0,00"
                                    value={newDebt.minimumPayment || ''}
                                    onChange={(e) => setNewDebt({ ...newDebt, minimumPayment: Number(e.target.value) })}
                                />
                            </div>
                        </div>
                        <Button className="w-full" onClick={handleAddDebt}>
                            <Plus className="mr-2 h-4 w-4" /> Adicionar Dívida
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Debt List */}
            {debts.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Suas Dívidas</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {debts.map(debt => (
                                <div key={debt.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium">{debt.name}</p>
                                        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                            <span>Saldo: {formatCurrency(debt.balance)}</span>
                                            <span>Juros: {debt.interestRate}% a.a.</span>
                                            <span>Mínimo: {formatCurrency(debt.minimumPayment)}</span>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveDebt(debt.id)}>
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        {/* Extra Payment */}
                        <div className="mt-4 space-y-2">
                            <Label htmlFor="extraPayment">Pagamento Extra Mensal (opcional)</Label>
                            <Input
                                id="extraPayment"
                                type="number"
                                placeholder="0.00"
                                value={extraPayment || ''}
                                onChange={(e) => setExtraPayment(parseFloat(e.target.value) || 0)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Valor adicional que você pode pagar por mês além dos mínimos
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Results Comparison */}
            {debts.length > 0 && snowballResult && avalancheResult && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Calculator className="h-5 w-5" />
                            Comparação de Estratégias
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="snowball" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="snowball">
                                    Snowball (Menor Saldo)
                                </TabsTrigger>
                                <TabsTrigger value="avalanche">
                                    Avalanche (Maior Juros)
                                </TabsTrigger>
                            </TabsList>

                            {/* Snowball Tab */}
                            <TabsContent value="snowball" className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardDescription>Tempo para Quitar</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-bold">{formatMonths(snowballResult.totalMonths)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardDescription>Total de Juros</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-bold text-red-600">{formatCurrency(snowballResult.totalInterest)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardDescription>Total Pago</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-bold">{formatCurrency(snowballResult.totalPaid)}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
                                    <p className="text-sm text-blue-900 dark:text-blue-100">
                                        <strong>Snowball:</strong> Foca em pagar primeiro as dívidas com menor saldo,
                                        criando vitórias rápidas e motivação psicológica.
                                    </p>
                                </div>
                            </TabsContent>

                            {/* Avalanche Tab */}
                            <TabsContent value="avalanche" className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-3">
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardDescription>Tempo para Quitar</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-bold">{formatMonths(avalancheResult.totalMonths)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardDescription>Total de Juros</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-bold text-red-600">{formatCurrency(avalancheResult.totalInterest)}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-3">
                                            <CardDescription>Total Pago</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-bold">{formatCurrency(avalancheResult.totalPaid)}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
                                    <p className="text-sm text-green-900 dark:text-green-100">
                                        <strong>Avalanche:</strong> Foca em pagar primeiro as dívidas com maior taxa de juros,
                                        economizando mais dinheiro no total.
                                    </p>
                                </div>

                                {/* Savings Comparison */}
                                {avalancheResult.totalInterest < snowballResult.totalInterest && (
                                    <div className="bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-lg border border-yellow-200">
                                        <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                                            💰 Economia com Avalanche: {formatCurrency(snowballResult.totalInterest - avalancheResult.totalInterest)}
                                        </p>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            )}

            {debts.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Calculator className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground text-center">
                            Adicione suas dívidas acima para comparar as estratégias de pagamento
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
