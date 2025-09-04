// src/components/dashboard/fatura/fatura-summary-card.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Card as CardType } from "@/lib/definitions";
import { Button } from "@/components/ui/button";
import { CalendarDays, ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
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
    <Card className="shadow-lg h-full flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-center">
            <CardTitle>Resumo da Fatura</CardTitle>
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
         <CardDescription className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3"/> Fecha em: {format(closeDate, 'dd/MM')}</span>
            <span className="flex items-center gap-1.5"><CalendarDays className="h-3 w-3"/> Vence em: {format(dueDate, 'dd/MM')}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow justify-between">
        <div className="space-y-4">
            <div className="text-center space-y-1">
                <p className="text-sm text-muted-foreground">Saldo Devedor</p>
                <p className={cn("text-4xl font-bold tracking-tighter", saldoDevedor > 0 ? "text-destructive" : "text-primary")}>
                    {formatCurrency(saldoDevedor)}
                </p>
            </div>
            <div className="flex justify-around text-center text-sm">
                 <div>
                    <p className="text-muted-foreground">Total da Fatura</p>
                    <p className="font-semibold">{formatCurrency(faturaTotal)}</p>
                </div>
                 <div>
                    <p className="text-muted-foreground">Valor Pago</p>
                    <p className="font-semibold text-green-500">{formatCurrency(valorPago)}</p>
                </div>
            </div>
        </div>
         <div className="text-center pt-4">
            <Button className="w-full" disabled={saldoDevedor <= 0} onClick={onPayBill}>
                <DollarSign className="mr-2 h-4 w-4" />
                Pagar ou Amortizar Fatura
            </Button>
        </div>
      </CardContent>
    </Card>
  );
}
