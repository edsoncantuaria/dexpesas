// src/components/dashboard/relatorios/budget-distribution-chart.tsx
'use client';

import { useMemo } from 'react';
import { BarChart, Bar, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import type { Transaction } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const COLORS = {
  essenciais: 'hsl(var(--primary))',
  pessoais: 'hsl(122, 39%, 65%)', 
  investimentos: 'hsl(122, 39%, 35%)',
};

// Mapa atualizado com os novos nomes de categoria do banco (camelCase)
const CATEGORY_MAP: { [key: string]: 'essenciais' | 'pessoais' | 'investimentos' } = {
  'Alimentação': 'essenciais',
  'Casa': 'essenciais',
  'Saúde': 'essenciais',
  'Transporte': 'essenciais',
  'Educação': 'essenciais',
  'Impostos e Taxas': 'essenciais',
  'Mercado': 'essenciais',
  'Assinaturas e Serviços': 'pessoais',
  'Bares e Restaurantes': 'pessoais',
  'Cuidados Pessoais': 'pessoais',
  'Lazer e Hobbies': 'pessoais',
  'Pets': 'pessoais',
  'Presentes e Doações': 'pessoais',
  'Roupas': 'pessoais',
  'Trabalho': 'pessoais',
  'Viagem': 'pessoais',
  'Compras': 'pessoais',
  'Outros': 'pessoais',
  'Vícios': 'pessoais',
  'Dívidas e Empréstimos': 'pessoais',
  'Investimentos': 'investimentos', 
  'Salário': 'investimentos', // Treat salary as part of the total income for savings calculation
  'Outras Receitas': 'investimentos'
};

type BudgetDistributionChartProps = {
  transactions: Transaction[];
};

export function BudgetDistributionChart({ transactions }: BudgetDistributionChartProps) {
  const budgetData = useMemo(() => {
    const totals = {
      essenciais: 0,
      pessoais: 0,
      investimentos: 0,
    };

    const totalIncome = transactions
      .filter(t => t.tipo === 'receita' && t.pago)
      .reduce((sum, t) => sum + Number(t.valor), 0);

    if (totalIncome === 0) return [];
      
    transactions.forEach(t => {
      if (t.tipo === 'despesa' && t.pago) {
          const type = CATEGORY_MAP[t.categoria];
          if (type) {
              totals[type] += Number(t.valor);
          }
      }
    });

    const totalExpenses = totals.essenciais + totals.pessoais;
    const savings = totalIncome - totalExpenses;
    
    // Aportes diretos em 'Investimentos'
    const directInvestments = transactions
        .filter(t => t.categoria === 'Investimentos' && t.tipo === 'despesa' && t.pago)
        .reduce((sum, t) => sum + Number(t.valor), 0);

    totals.investimentos = directInvestments + Math.max(0, savings);

    return [
      { name: 'Essenciais (50%)', value: totals.essenciais, fill: COLORS.essenciais },
      { name: 'Pessoais (30%)', value: totals.pessoais, fill: COLORS.pessoais },
      { name: 'Poupança (20%)', value: totals.investimentos, fill: COLORS.investimentos },
    ].filter(item => item.value > 0);

  }, [transactions]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição de Orçamento (50/30/20)</CardTitle>
        <CardDescription>Como seus gastos se alinham à regra de orçamento.</CardDescription>
      </CardHeader>
      <CardContent>
        {budgetData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={budgetData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                tickLine={false} 
                axisLine={false} 
                width={110} 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                cursor={{ fill: 'hsl(var(--muted))' }}
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--foreground))',
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {budgetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <p>Não há dados suficientes de receitas e despesas para exibir o gráfico.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
