'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { ArrowDown, ArrowUp, Calendar, CreditCard, DollarSign, TrendingDown } from 'lucide-react';

interface Debt {
    id: string;
    currentBalance: number;
    originalAmount: number;
    minimumPayment: number;
    interestRate: number;
}

interface OverviewProps {
    debts: Debt[];
}

export function DebtDashboardOverview({ debts }: OverviewProps) {
    const totalDebt = debts.reduce((sum, d) => sum + Number(d.currentBalance), 0);
    const totalOriginal = debts.reduce((sum, d) => sum + Number(d.originalAmount), 0);
    const totalMonthlyMin = debts.reduce((sum, d) => sum + Number(d.minimumPayment), 0);

    // Calculate progress
    const totalPaid = totalOriginal - totalDebt;
    const progressPercentage = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0;

    // Estimate payoff (very rough approximation: total / min payment)
    // Real calculation is complex, this is just a quick metric
    const estimatedMonths = totalMonthlyMin > 0 ? Math.ceil(totalDebt / totalMonthlyMin) : 0;
    const payoffDate = new Date();
    payoffDate.setMonth(payoffDate.getMonth() + estimatedMonths);

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Dívida Total
                    </CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalDebt)}</div>
                    <p className="text-xs text-muted-foreground">
                        {debts.length} dívidas ativas
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Pagamento Mensal Mín.
                    </CardTitle>
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalMonthlyMin)}</div>
                    <p className="text-xs text-muted-foreground">
                        Comprometimento mensal
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Progresso de Quitação
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{progressPercentage.toFixed(1)}%</div>
                    <Progress value={progressPercentage} className="mt-2 h-2" />
                    <p className="text-xs text-muted-foreground mt-1">
                        {formatCurrency(totalPaid)} pagos do total
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                        Previsão de Quitação
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">
                        {totalMonthlyMin > 0 ? payoffDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '-'}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Pagando apenas o mínimo
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
