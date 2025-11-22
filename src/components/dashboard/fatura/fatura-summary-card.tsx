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
import { motion, AnimatePresence } from 'framer-motion';

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

  const [direction, setDirection] = useState(0);

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setDirection(newDirection);
    onMonthChange(newDirection > 0 ? addMonths(selectedMonth, 1) : subMonths(selectedMonth, 1));
  };

  return (
    <Card className="shadow-xl bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-white/10 h-full flex flex-col overflow-hidden relative">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg sm:text-xl bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            Resumo da Fatura
          </CardTitle>
          <div className="flex items-center gap-1 sm:gap-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors"
              onClick={() => paginate(-1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <p className="text-sm font-semibold capitalize w-28 sm:w-32 text-center select-none">
              {format(dueDate, 'MMMM yyyy', { locale: ptBR })}
            </p>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full hover:bg-primary/10 transition-colors"
              onClick={() => paginate(1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs sm:text-sm mt-2">
          <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> Fecha: {format(period.end, 'dd/MM')}</span>
          <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3" /> Vence: {format(dueDate, 'dd/MM')}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pb-4 sm:pb-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={selectedMonth.toISOString()}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e, { offset, velocity }) => {
              const swipe = swipePower(offset.x, velocity.x);
              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="flex-1 flex flex-col"
          >
            <div className="bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl p-4 sm:p-6 mb-3 sm:mb-4 border border-primary/20 shadow-inner">
              <p className="text-xs sm:text-sm text-muted-foreground mb-1 sm:mb-2 uppercase tracking-wide">Saldo Devedor</p>
              <p className={cn(
                "text-2xl sm:text-3xl md:text-4xl font-bold truncate",
                saldoDevedor > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
              )}>
                {formatCurrency(saldoDevedor)}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 uppercase">Total da Fatura</p>
                <p className="text-base sm:text-xl font-bold truncate">{formatCurrency(faturaTotal)}</p>
              </div>
              <div className="p-3 sm:p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/20">
                <p className="text-[10px] sm:text-xs text-muted-foreground mb-1 uppercase">Valor Pago</p>
                <p className="text-base sm:text-xl font-bold text-emerald-600 dark:text-emerald-400 truncate">{formatCurrency(valorPago)}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="flex flex-col gap-2 pt-4 sm:pt-6 z-10 mt-auto">
          <Button
            className="w-full shadow-lg shadow-primary/20 h-12 text-base font-medium"
            disabled={saldoDevedor <= 0}
            onClick={onPayBill}
          >
            <DollarSign className="mr-2 h-5 w-5" />
            Pagar ou Amortizar
          </Button>
          <Button
            variant="outline"
            className="w-full h-10 text-sm font-medium"
            onClick={onDownloadPDF}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
          <Button
            variant="outline"
            className={cn(
              "w-full h-10 text-sm font-medium",
              isReconciled
                ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
                : "border-primary/50 hover:bg-primary/10"
            )}
            onClick={onReconcile}
            disabled={isReconciled}
          >
            {isReconciled ? (
              <>
                <FileCheck className="mr-2 h-4 w-4" />
                Fatura Reconciliada ✓
              </>
            ) : (
              <>
                <FileCheck className="mr-2 h-4 w-4" />
                Reconciliar com OFX
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
