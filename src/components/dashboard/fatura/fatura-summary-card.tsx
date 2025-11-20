// src/components/dashboard/fatura/fatura-summary-card.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Card as CardType } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, addMonths, subMonths, setDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';

type FaturaSummaryCardProps = {
  card: CardType;
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
  faturaTotal: number;
  valorPago: number;
  saldoDevedor: number;
  onPayBill: () => void;
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
}: FaturaSummaryCardProps) {
  const closeDate = setDate(selectedMonth, card.diaFechamento);
  const dueDate = addMonths(closeDate, 1);

  return (
    <Card className="shadow-xl bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-white/10 h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Resumo da Fatura
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
            <p className="text-sm font-semibold capitalize w-32 text-center">{format(selectedMonth, 'MMMM yyyy', { locale: ptBR })}</p>
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
        <CardDescription className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> Fecha em: {format(closeDate, 'dd/MM')}</span>
          <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> Vence em: {format(dueDate, 'dd/MM')}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-between">
        <div className="space-y-6">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="text-center space-y-2 p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20"
          >
            <p className="text-sm text-muted-foreground font-medium">Saldo Devedor</p>
            <p className={cn(
              "text-5xl font-bold tracking-tighter",
              saldoDevedor > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
            )}>
              {formatCurrency(saldoDevedor)}
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border">
              <p className="text-xs text-muted-foreground mb-1">Total da Fatura</p>
              <p className="text-xl font-bold">{formatCurrency(faturaTotal)}</p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20">
              <p className="text-xs text-muted-foreground mb-1">Valor Pago</p>
              <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(valorPago)}</p>
            </div>
          </div>
        </div>
        <div className="text-center pt-6">
          <Button
            className="w-full shadow-lg shadow-primary/20"
            disabled={saldoDevedor <= 0}
            onClick={onPayBill}
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Pagar ou Amortizar Fatura
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
