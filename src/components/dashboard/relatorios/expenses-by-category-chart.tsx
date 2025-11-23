// src/components/dashboard/relatorios/expenses-by-category-chart.tsx
'use client';

import { useMemo } from 'react';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { Transaction } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

type ExpensesByCategoryChartProps = {
  transactions: Transaction[];
};

import { useCategories } from '@/hooks/use-categories';

export function ExpensesByCategoryChart({ transactions }: ExpensesByCategoryChartProps) {
  const isMobile = useIsMobile();
  const { data: categories } = useCategories();

  const expensesByCategory = useMemo(() => {
    if (!categories) return [];

    const categoryTotals: { [key: string]: number } = {};
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const getCategoryName = (id?: string | null, fallback?: string) => {
      if (!id) return fallback || 'Sem Categoria';
      const cat = categoryMap.get(id);
      if (!cat) return fallback || 'Sem Categoria';

      if (cat.parentCategoryId) {
        const parent = categoryMap.get(cat.parentCategoryId);
        if (parent) {
          return `${parent.label} > ${cat.label}`;
        }
      }
      return cat.label;
    };

    transactions
      .filter(t => t.tipo === 'despesa')
      .forEach(t => {
        // Prefer categoryId resolution, fallback to stored name
        const categoryName = getCategoryName(t.categoryId, t.categoria);

        if (categoryTotals[categoryName]) {
          categoryTotals[categoryName] += Number(t.valor);
        } else {
          categoryTotals[categoryName] = Number(t.valor);
        }
      });

    return Object.entries(categoryTotals)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, categories]);

  const totalExpenses = useMemo(() => expensesByCategory.reduce((sum, item) => sum + item.total, 0), [expensesByCategory]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Despesas por Categoria</CardTitle>
        <CardDescription>Principais categorias de gastos no período filtrado.</CardDescription>
      </CardHeader>
      <CardContent>
        {expensesByCategory.length > 0 ? (
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <RechartsBarChart data={expensesByCategory} layout="vertical" margin={{ left: 20, right: isMobile ? 5 : 20 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={100}
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                formatter={(value: number) => {
                  const percentage = totalExpenses > 0 ? (value / totalExpenses) * 100 : 0;
                  return `${formatCurrency(value)} (${percentage.toFixed(1)}%)`;
                }}
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  color: 'hsl(var(--foreground))',
                }}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[250px] flex items-center justify-center text-muted-foreground md:h-[300px]">
            <p>Nenhuma despesa para exibir no período selecionado.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
