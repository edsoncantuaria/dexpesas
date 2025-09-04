// src/components/dashboard/transacoes/monthly-summary.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EmblaCarouselType } from 'embla-carousel-react';
import useEmblaCarousel from 'embla-carousel-react';
import { format, getMonth, getYear, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Transaction } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import api from '@/lib/api';

type MonthlySummaryProps = {
  transactionsForMonth: Transaction[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
};

export function MonthlySummary({ transactionsForMonth, selectedDate, onDateChange }: MonthlySummaryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'center',
  });
  const isMobile = useIsMobile();
  const [allMonths, setAllMonths] = useState<Date[]>([]);

  useEffect(() => {
      const fetchMonths = async () => {
          try {
              const response = await api.get('/transactions?month=all');
              const transactions: Transaction[] = response.data;
              const months = new Set<string>();
              transactions.forEach(t => {
                const month = format(new Date(t.data), 'yyyy-MM');
                months.add(month);
              });
              let lastDate = new Date();
                if (transactions.length > 0) {
                    const lastTransactionDate = new Date(Math.max.apply(null, transactions.map(t => new Date(t.data).getTime())));
                    if (lastTransactionDate > lastDate) {
                        lastDate = lastTransactionDate;
                    }
                }
                
                months.add(format(lastDate, 'yyyy-MM'));
                months.add(format(addMonths(lastDate, 1), 'yyyy-MM'));
                months.add(format(addMonths(lastDate, 2), 'yyyy-MM'));

                const sortedMonths = Array.from(months)
                    .map(m => new Date(m + '-02T00:00:00'))
                    .sort((a, b) => a.getTime() - b.getTime());
                
                setAllMonths(sortedMonths);
          } catch (error) {
              console.error("Erro ao buscar meses:", error);
          }
      };
      fetchMonths();
  }, []);

  useEffect(() => {
    if (!emblaApi || allMonths.length === 0) return;

    const onSelect = (api: EmblaCarouselType) => {
        onDateChange(allMonths[api.selectedScrollSnap()]);
    };
    
    emblaApi.on('select', onSelect);

    const targetIndex = allMonths.findIndex(d => getYear(d) === getYear(selectedDate) && getMonth(d) === getMonth(selectedDate));
    if (targetIndex !== -1 && targetIndex !== emblaApi.selectedScrollSnap()) {
        emblaApi.scrollTo(targetIndex, true); 
    }
    
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi, allMonths, onDateChange, selectedDate]);
  
  const { income, incomeForecast, expense, expenseForecast, balance, balanceForecast } = useMemo(() => {
    const income = transactionsForMonth.filter(t => t.tipo === 'receita' && t.pago).reduce((acc, t) => acc + Number(t.valor), 0);
    const incomeForecast = transactionsForMonth.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + Number(t.valor), 0);

    const expense = transactionsForMonth.filter(t => t.tipo === 'despesa' && t.pago).reduce((acc, t) => acc + Number(t.valor), 0);
    const expenseForecast = transactionsForMonth.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + Number(t.valor), 0);
    
    const balance = income - expense;
    const balanceForecast = incomeForecast - expenseForecast;
    
    return { income, incomeForecast, expense, expenseForecast, balance, balanceForecast };
  }, [transactionsForMonth]);


  const handleNavClick = (direction: 'prev' | 'next') => {
    if (emblaApi) {
        if (direction === 'prev') emblaApi.scrollPrev();
        else emblaApi.scrollNext();
    }
  }

  const renderSummaryCard = () => (
    <Card className="rounded-2xl shadow-lg bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Balanço do Mês</CardTitle>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDateChange(subMonths(selectedDate, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <p className="text-sm font-semibold capitalize w-32 text-center">{format(selectedDate, 'MMMM yyyy', { locale: ptBR })}</p>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDateChange(addMonths(selectedDate, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="text-center py-2">
                <div className="text-4xl font-bold">
                    {Number(balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-sm text-muted-foreground">
                    Previsto: {Number(balanceForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
            </div>
            <div className="flex justify-between items-center text-sm">
                <div className="flex items-center text-green-500 gap-2">
                    <ArrowUpRight className="h-5 w-5 flex-shrink-0"/>
                    <div>
                        <p className="text-xs text-muted-foreground font-semibold">Receitas</p>
                        <p className="font-bold text-lg">{Number(income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p className="text-xs text-muted-foreground">Previsto: {Number(incomeForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                </div>
                    <div className="flex items-center text-red-500 gap-2">
                    <ArrowDownLeft className="h-5 w-5 flex-shrink-0"/>
                    <div className='text-right'>
                        <p className="text-xs text-muted-foreground font-semibold">Despesas</p>
                        <p className="font-bold text-lg">{Number(expense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                        <p className="text-xs text-muted-foreground">Previsto: {Number(expenseForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
  )

  return (
    <div>{renderSummaryCard()}</div>
  );
}
