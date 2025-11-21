import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownIcon, ArrowUpIcon, Wallet, CreditCard, PiggyBank, TrendingUp, Eye, EyeOff } from "lucide-react";
import { Account, Transaction, Budget, Card as CardType } from "@/lib/definitions";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { usePrivacy } from '@/contexts/PrivacyContext';

interface SmartSummaryProps {
    accounts: Account[];
    transactions: Transaction[];
    budgets: Budget[];
    cards: CardType[];
}

export function SmartSummary({ accounts, transactions, budgets, cards }: SmartSummaryProps) {
    const { showBalance, togglePrivacy } = usePrivacy();
    const summary = useMemo(() => {
        const totalBalance = accounts.reduce((acc, curr) => acc + Number(curr.saldo || 0), 0);

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const monthlyTransactions = transactions.filter(t => {
            const tDate = new Date(t.data);
            return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
        });

        const income = monthlyTransactions
            .filter(t => t.tipo === 'receita' && t.status !== 'CANCELLED')
            .reduce((acc, curr) => acc + Number(curr.valor), 0);

        const expenses = monthlyTransactions
            .filter(t => t.tipo === 'despesa' && t.status !== 'CANCELLED')
            .reduce((acc, curr) => acc + Number(curr.valor), 0);

        const totalBudget = budgets.reduce((acc, curr) => acc + Number(curr.limit), 0);
        const totalSpentBudget = budgets.reduce((acc, curr) => acc + Number(curr.spent), 0);
        const budgetPercentage = totalBudget > 0 ? (totalSpentBudget / totalBudget) * 100 : 0;

        return {
            totalBalance,
            income,
            expenses,
            budgetPercentage,
            totalBudget
        };
    }, [accounts, transactions, budgets]);

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Resumo Financeiro</h2>
                <button
                    type="button"
                    onClick={() => togglePrivacy()}
                    className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-background/50"
                >
                    {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Saldo Total</p>
                                <h3 className="text-2xl font-bold mt-2">{showBalance ? formatCurrency(summary.totalBalance) : 'R$ ••••••'}</h3>
                            </div>
                            <div className="p-2 bg-blue-400/30 rounded-lg">
                                <Wallet className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-blue-100">
                            <ArrowUpIcon className="h-4 w-4 mr-1" />
                            <span>{showBalance ? formatCurrency(summary.income) : 'R$ ••••'} este mês</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-red-500 to-pink-600 text-white border-none shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-red-100 text-sm font-medium">Gastos do Mês</p>
                                <h3 className="text-2xl font-bold mt-2">{showBalance ? formatCurrency(summary.expenses) : 'R$ ••••••'}</h3>
                            </div>
                            <div className="p-2 bg-red-400/30 rounded-lg">
                                <TrendingUp className="h-5 w-5 text-white" />
                            </div>
                        </div>
                        <div className="mt-4 text-sm text-red-100">
                            {summary.totalBudget > 0 ? (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span>Orçamento</span>
                                        <span>{Math.round(summary.budgetPercentage)}%</span>
                                    </div>
                                    <Progress value={summary.budgetPercentage} className="h-1.5 bg-red-900/30 [&>div]:bg-white" />
                                </div>
                            ) : (
                                <span>Sem orçamento definido</span>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Cartões de Crédito</p>
                                <h3 className="text-2xl font-bold mt-2 text-foreground">
                                    {showBalance ? formatCurrency(cards.reduce((acc, card) => acc + Number(card.currentInvoiceAmount || 0), 0)) : 'R$ ••••••'}
                                </h3>
                            </div>
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <CreditCard className="h-5 w-5 text-primary" />
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            Fatura atual acumulada
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-card border shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-muted-foreground text-sm font-medium">Economia Mensal</p>
                                <h3 className="text-2xl font-bold mt-2 text-foreground">
                                    {showBalance ? formatCurrency(summary.income - summary.expenses) : 'R$ ••••••'}
                                </h3>
                            </div>
                            <div className="p-2 bg-green-500/10 rounded-lg">
                                <PiggyBank className="h-5 w-5 text-green-600" />
                            </div>
                        </div>
                        <p className="mt-4 text-sm text-muted-foreground">
                            {summary.income > summary.expenses ? 'Você está no azul!' : 'Atenção aos gastos!'}
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
