'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CellBudget, CellFund } from '@/lib/definitions';
import { parseAmount, toCurrency } from './utils';
import { PieChart, TrendingUp, Wallet, PiggyBank } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReportsTabProps {
    budgets: CellBudget[];
    funds: CellFund[];
}

export function ReportsTab({ budgets, funds }: ReportsTabProps) {
    const totalCellBudgets = budgets
        .filter((budget) => budget.type !== 'PERSONAL')
        .reduce((acc, budget) => acc + parseAmount(budget.limit), 0);
    const totalHybridPersonal = budgets
        .filter((budget) => budget.type === 'PERSONAL')
        .reduce((acc, budget) => acc + parseAmount(budget.limit), 0);
    const totalFunds = funds.reduce((acc, fund) => acc + parseAmount(fund.currentAmount), 0);
    const totalCombined = totalCellBudgets + totalHybridPersonal;

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="border-none shadow-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PieChart className="h-5 w-5 text-primary" />
                            Orçamento Familiar
                        </CardTitle>
                        <CardDescription>Comparativo de recursos destinados à família.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Wallet className="h-4 w-4" /> Compartilhado
                                </span>
                                <span className="font-semibold">{toCurrency(totalCellBudgets)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-primary"
                                    style={{ width: `${totalCombined > 0 ? (totalCellBudgets / totalCombined) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="flex items-center gap-2 text-muted-foreground">
                                    <Wallet className="h-4 w-4" /> Pessoal (Híbrido)
                                </span>
                                <span className="font-semibold">{toCurrency(totalHybridPersonal)}</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                                <div
                                    className="h-full bg-blue-500"
                                    style={{ width: `${totalCombined > 0 ? (totalHybridPersonal / totalCombined) * 100 : 0}%` }}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t flex items-center justify-between">
                            <span className="font-medium">Total Combinado</span>
                            <span className="text-xl font-bold text-primary">{toCurrency(totalCombined)}</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <Card className="border-none shadow-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm h-full">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            Patrimônio Coletivo
                        </CardTitle>
                        <CardDescription>Reservas acumuladas em caixinhas e fundos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-center py-4">
                            <div className="h-32 w-32 rounded-full border-8 border-green-500/20 flex flex-col items-center justify-center">
                                <PiggyBank className="h-8 w-8 text-green-600 mb-1" />
                                <span className="text-xs text-muted-foreground">Total</span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm p-3 bg-accent/10 rounded-lg">
                                <span>Caixinhas Ativas</span>
                                <span className="font-bold">{funds.length}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <span>Valor Acumulado</span>
                                <span className="font-bold text-green-700 dark:text-green-400">{toCurrency(totalFunds)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
