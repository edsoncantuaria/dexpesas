// src/components/dashboard/relatorios/detailed-summary.tsx
'use client';

import type { Transaction } from '@/lib/definitions';
import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Banknote, CreditCard, DollarSign, Scale } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface DetailedSummaryProps {
  transactions: Transaction[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const SummaryRow = ({ label, value, icon: Icon, colorClass }: { label: string; value: number; icon: LucideIcon; colorClass: string }) => (
    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
        <div className="flex items-center gap-3">
            <Icon className={cn("h-5 w-5", colorClass)} />
            <span className="font-medium">{label}</span>
        </div>
        <span className={cn("font-bold text-lg", colorClass)}>{formatCurrency(value)}</span>
    </div>
);

export function DetailedSummary({ transactions }: DetailedSummaryProps) {
  const summary = useMemo(() => {
    const paidTransactions = transactions.filter(t => t.pago);

    const receitas = paidTransactions
      .filter(t => t.tipo === 'receita' && t.metodoPagamento !== 'credito')
      .reduce((sum, t) => sum + Number(t.valor), 0);
    
    const pagamentosCartao = paidTransactions
      .filter(t => t.tipo === 'receita' && t.metodoPagamento === 'credito')
      .reduce((sum, t) => sum + Number(t.valor), 0);

    const gastos = paidTransactions
      .filter(t => t.tipo === 'despesa' && t.metodoPagamento !== 'credito')
      .reduce((sum, t) => sum + Number(t.valor), 0);
      
    const gastosCartao = paidTransactions
        .filter(t => t.tipo === 'despesa' && t.metodoPagamento === 'credito')
        .reduce((sum, t) => sum + Number(t.valor), 0);

    const totalEntradas = receitas + pagamentosCartao;
    const totalSaidas = gastos + gastosCartao;
    const balanco = totalEntradas - totalSaidas;

    return {
      receitas,
      pagamentosCartao,
      gastos,
      gastosCartao,
      totalEntradas,
      totalSaidas,
      balanco,
    };
  }, [transactions]);

  return (
    <Card className="w-full shadow-lg">
        <CardContent className="p-4 space-y-4">
            {/* Main Summary Card */}
            <div className="rounded-xl border bg-card/80 p-4 shadow-sm backdrop-blur-sm">
                <div className="flex justify-around text-center gap-6">
                    <div>
                        <p className="text-sm text-muted-foreground">Entradas</p>
                        <p className="text-2xl font-bold text-emerald-500">{formatCurrency(summary.totalEntradas)}</p>
                    </div>
                     <div>
                        <p className="text-sm text-muted-foreground">Saídas</p>
                        <p className="text-2xl font-bold text-red-500">{formatCurrency(summary.totalSaidas)}</p>
                    </div>
                </div>
                 <div className="flex items-center justify-center gap-2 text-center border-t border-border pt-3 mt-3">
                    <Scale className="h-5 w-5 text-primary" />
                    <div>
                        <p className="text-sm text-muted-foreground">Balanço</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(summary.balanco)}</p>
                    </div>
                </div>
            </div>

            {/* Detail Sections */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Entradas */}
                <div className="space-y-2">
                    <h3 className="font-semibold flex items-center gap-2">
                        <div className="p-1.5 bg-green-500/10 rounded-full"><ArrowUp className="h-4 w-4 text-green-500"/></div>
                        Detalhe das Entradas
                    </h3>
                    <div className="space-y-2">
                        <SummaryRow label="Receitas" value={summary.receitas} icon={DollarSign} colorClass="text-green-500" />
                        <SummaryRow label="Pagamentos Cartão" value={summary.pagamentosCartao} icon={CreditCard} colorClass="text-green-500" />
                    </div>
                </div>
                {/* Saídas */}
                <div className="space-y-2">
                     <h3 className="font-semibold flex items-center gap-2">
                        <div className="p-1.5 bg-red-500/10 rounded-full"><ArrowDown className="h-4 w-4 text-red-500"/></div>
                        Detalhe das Saídas
                    </h3>
                    <div className="space-y-2">
                        <SummaryRow label="Gastos" value={summary.gastos} icon={Banknote} colorClass="text-red-500" />
                        <SummaryRow label="Gastos Cartão" value={summary.gastosCartao} icon={CreditCard} colorClass="text-red-500" />
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
  );
}
