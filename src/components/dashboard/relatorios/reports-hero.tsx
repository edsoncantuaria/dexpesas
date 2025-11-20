'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, TrendingUp, Wallet, PiggyBank, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { Transaction } from '@/lib/definitions';

interface ReportsHeroProps {
    transactions: Transaction[];
}

export function ReportsHero({ transactions }: ReportsHeroProps) {
    const metrics = useMemo(() => {
        const paidTransactions = transactions.filter(t => t.pago);

        const income = paidTransactions
            .filter(t => t.tipo === 'receita')
            .reduce((sum, t) => sum + Number(t.valor), 0);

        const expenses = paidTransactions
            .filter(t => t.tipo === 'despesa')
            .reduce((sum, t) => sum + Number(t.valor), 0);

        const balance = income - expenses;
        const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

        // Calculate trend (simplified: compare first half of month vs second half or just use a mock trend for visual)
        // For now, we'll just show the raw numbers.

        return {
            income,
            expenses,
            balance,
            savingsRate: Math.max(0, savingsRate)
        };
    }, [transactions]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Total Balance Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <Card className="h-full border-none shadow-lg bg-gradient-to-br from-primary/90 to-primary/70 text-primary-foreground overflow-hidden relative">
                    <div className="absolute right-0 top-0 h-32 w-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
                    <CardContent className="p-6 flex flex-col justify-between h-full relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-primary-foreground/80 font-medium text-sm">Balanço do Período</p>
                                <h2 className="text-3xl font-bold mt-1">{formatCurrency(metrics.balance)}</h2>
                            </div>
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Wallet className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="flex justify-between text-xs mb-1 text-primary-foreground/80">
                                <span>Taxa de Economia</span>
                                <span>{metrics.savingsRate.toFixed(1)}%</span>
                            </div>
                            <Progress value={metrics.savingsRate} className="h-2 bg-black/20" indicatorClassName="bg-white/90" />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Income Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
            >
                <Card className="h-full border shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground font-medium text-sm">Receitas Totais</p>
                                <h2 className="text-2xl font-bold mt-1 text-emerald-600 dark:text-emerald-400">{formatCurrency(metrics.income)}</h2>
                            </div>
                            <div className="p-2 bg-emerald-500/10 rounded-lg">
                                <ArrowUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4 text-emerald-500" />
                            <span>Entradas confirmadas</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Expenses Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
            >
                <Card className="h-full border shadow-sm hover:shadow-md transition-all bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground font-medium text-sm">Despesas Totais</p>
                                <h2 className="text-2xl font-bold mt-1 text-red-600 dark:text-red-400">{formatCurrency(metrics.expenses)}</h2>
                            </div>
                            <div className="p-2 bg-red-500/10 rounded-lg">
                                <ArrowDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                            <CreditCard className="h-4 w-4 text-red-500" />
                            <span>Saídas contabilizadas</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
