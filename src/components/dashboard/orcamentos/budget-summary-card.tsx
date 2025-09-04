// src/components/dashboard/orcamentos/budget-summary-card.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useMemo } from "react";
import { cn } from "@/lib/utils";

type BudgetSummaryCardProps = {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  totalBudgeted: number;
  totalSpent: number;
};

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function BudgetSummaryCard({
  selectedMonth,
  onMonthChange,
  totalBudgeted,
  totalSpent,
}: BudgetSummaryCardProps) {
  
  const remaining = totalBudgeted - totalSpent;
  const percentageSpent = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;
  
  const chartData = useMemo(() => {
    const spentValue = Math.min(totalSpent, totalBudgeted);
    const overspentValue = totalSpent > totalBudgeted ? totalSpent - totalBudgeted : 0;
    const remainingValue = totalBudgeted - spentValue;

    const data = [
      { name: 'Gasto', value: spentValue, fill: 'hsl(var(--primary))' },
      { name: 'Disponível', value: remainingValue, fill: 'hsl(var(--muted))' },
    ];
    
    if (overspentValue > 0) {
        data.push({ name: 'Excedente', value: overspentValue, fill: 'hsl(var(--destructive))'})
    }

    return data.filter(d => d.value > 0);
  }, [totalSpent, totalBudgeted]);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle>Resumo do Mês</CardTitle>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onMonthChange(subMonths(selectedMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <p className="text-sm font-semibold capitalize w-32 text-center">{format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}</p>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => onMonthChange(addMonths(selectedMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="relative h-48 w-48 mx-auto">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Tooltip
                        formatter={(value: number, name: string) => [formatCurrency(value), name]}
                         contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: 'var(--radius)',
                        }}
                    />
                    <Pie
                        data={chartData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={2}
                        strokeWidth={0}
                    >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                    </Pie>
                </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <p className="text-2xl font-bold">{Math.min(percentageSpent, 100).toFixed(0)}%</p>
                 <p className="text-xs text-muted-foreground">Gasto</p>
            </div>
        </div>
        <div className="space-y-4">
            <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Total Orçado</p>
                <p className="text-lg font-bold">{formatCurrency(totalBudgeted)}</p>
            </div>
             <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Total Gasto</p>
                <p className="text-lg font-bold">{formatCurrency(totalSpent)}</p>
            </div>
             <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-xs text-muted-foreground">Saldo Disponível</p>
                <p className={cn("text-lg font-bold", remaining < 0 ? 'text-destructive' : 'text-primary')}>
                    {formatCurrency(remaining)}
                </p>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
