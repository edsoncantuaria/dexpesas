// src/components/dashboard/orcamentos/budget-summary-card.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
      data.push({ name: 'Excedente', value: overspentValue, fill: 'hsl(var(--destructive))' })
    }

    return data.filter(d => d.value > 0);
  }, [totalSpent, totalBudgeted]);

  return (
    <Card className="shadow-xl bg-gradient-to-br from-card/80 to-card/60 backdrop-blur-sm border-white/10 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-headline bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Resumo do Mês
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors"
              onClick={() => onMonthChange(subMonths(selectedMonth, 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-semibold capitalize w-32 text-center">
              {format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}
            </p>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors"
              onClick={() => onMonthChange(addMonths(selectedMonth, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative h-48 w-48 mx-auto"
        >
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
            <p className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">
              {Math.min(percentageSpent, 100).toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground font-medium">Gasto</p>
          </div>
        </motion.div>
        <div className="space-y-3">
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
          >
            <p className="text-xs text-muted-foreground font-medium mb-1">Total Orçado</p>
            <p className="text-2xl font-bold">{formatCurrency(totalBudgeted)}</p>
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-muted"
          >
            <p className="text-xs text-muted-foreground font-medium mb-1">Total Gasto</p>
            <p className="text-2xl font-bold">{formatCurrency(totalSpent)}</p>
          </motion.div>
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className={cn(
              "p-4 rounded-xl border",
              remaining < 0
                ? "bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20"
                : "bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20"
            )}
          >
            <p className="text-xs text-muted-foreground font-medium mb-1">Saldo Disponível</p>
            <p className={cn("text-2xl font-bold", remaining < 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400')}>
              {formatCurrency(remaining)}
            </p>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}
