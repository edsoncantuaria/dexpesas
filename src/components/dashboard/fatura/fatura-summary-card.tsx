// src/components/dashboard/fatura/fatura-summary-card.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Card as CardType } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronLeft, ChevronRight, DollarSign, Download, FileCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, setDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';


type FaturaSummaryCardProps = {
  card: CardType;
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  faturaTotal: number;
  valorPago: number;
  saldoDevedor: number;
  onPayBill: () => void;
  onDownloadPDF: () => void;
  onReconcile: () => void;
  isReconciled?: boolean;
  period: { start: Date; end: Date };
  dueDate: Date;
};

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function FaturaSummaryCard({
  card,
  selectedMonth,
  onMonthChange,
  faturaTotal,
  valorPago,
  saldoDevedor,
  onPayBill,
  onDownloadPDF,
  onReconcile,
  isReconciled = false,
  period,
  dueDate,
}: FaturaSummaryCardProps) {

  const paginate = (newDirection: number) => {
    onMonthChange(newDirection > 0 ? addMonths(selectedMonth, 1) : subMonths(selectedMonth, 1));
  };

  return (
    <Card className="shadow-lg bg-card border-border/50 h-full flex flex-col overflow-hidden relative group">
      {/* Header with Month Navigation */}
      <div className="p-4 sm:p-6 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-accent transition-colors"
            onClick={() => paginate(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <p className="text-lg font-semibold capitalize select-none leading-none">
              {format(dueDate, 'MMMM yyyy', { locale: ptBR })}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Vence dia {format(dueDate, 'dd')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-accent transition-colors"
            onClick={() => paginate(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {isReconciled && (
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900">
            <FileCheck className="h-3.5 w-3.5" />
            Reconciliado
          </div>
        )}
      </div>

      <CardContent className="flex-1 flex flex-col p-4 sm:p-6 pt-2">
        {/* Hero Section: Saldo Devedor */}
        <div className="flex flex-col items-center justify-center py-6 sm:py-8">
          <p className="text-sm text-muted-foreground font-medium mb-2 uppercase tracking-wider">
            Fatura Atual
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl text-muted-foreground font-medium">R$</span>
            <span className={cn(
              "text-4xl sm:text-5xl font-bold tracking-tight",
              saldoDevedor > 0 ? "text-foreground" : "text-emerald-600"
            )}>
              {saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Secondary Stats Row */}
          <div className="flex items-center gap-6 mt-6 text-sm">
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground text-xs mb-0.5">Total Fechado</span>
              <span className="font-semibold">{formatCurrency(faturaTotal)}</span>
            </div>
            <div className="w-px h-8 bg-border/60"></div>
            <div className="flex flex-col items-center">
              <span className="text-muted-foreground text-xs mb-0.5">Pago</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(valorPago)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-auto space-y-3">
          <Button
            className="w-full h-12 text-base font-medium shadow-md hover:shadow-lg transition-all bg-primary hover:bg-primary/90"
            disabled={saldoDevedor <= 0}
            onClick={onPayBill}
          >
            <DollarSign className="mr-2 h-5 w-5" />
            Pagar Fatura
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="w-full h-10 text-xs sm:text-sm font-medium border-border/60 hover:bg-accent/50"
              onClick={onDownloadPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              className={cn(
                "w-full h-10 text-xs sm:text-sm font-medium border-border/60 hover:bg-accent/50",
                isReconciled && "text-emerald-600 border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-900"
              )}
              onClick={onReconcile}
              disabled={isReconciled}
            >
              <FileCheck className="mr-2 h-4 w-4" />
              {isReconciled ? 'Reconciliado' : 'Reconciliar'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
