// src/components/dashboard/transacoes/monthly-summary.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EmblaCarouselType } from 'embla-carousel-react';
import useEmblaCarousel from 'embla-carousel-react';
import { format, getMonth, getYear, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Transaction } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { cn } from '@/lib/utils';

type MonthlySummaryProps = {
  transactionsForMonth: Transaction[];
  selectedDate: Date;
  onDateChange: (date: Date) => void;
};

type MonthlySummaryEntry = {
  key: string;
  date: Date;
  income: number;
  incomeForecast: number;
  expense: number;
  expenseForecast: number;
};

export function MonthlySummary({ transactionsForMonth, selectedDate, onDateChange }: MonthlySummaryProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: false,
    align: 'start',
  });
  const [monthlySummaries, setMonthlySummaries] = useState<MonthlySummaryEntry[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const buildEmptySummary = useCallback((date: Date): MonthlySummaryEntry => {
    const key = format(date, 'yyyy-MM');
    return {
      key,
      date: new Date(`${key}-01T00:00:00`),
      income: 0,
      incomeForecast: 0,
      expense: 0,
      expenseForecast: 0,
    };
  }, []);

  const getSummaryFromTransactions = useCallback((transactions: Transaction[]): Omit<MonthlySummaryEntry, 'key' | 'date'> => {
    return transactions.reduce(
      (acc, t) => {
        const amount = Number(t.valor);
        if (t.tipo === 'receita') {
          acc.incomeForecast += amount;
          if (t.pago) {
            acc.income += amount;
          }
        } else if (t.tipo === 'despesa') {
          acc.expenseForecast += amount;
          if (t.pago) {
            acc.expense += amount;
          }
        }
        return acc;
      },
      { income: 0, incomeForecast: 0, expense: 0, expenseForecast: 0 }
    );
  }, []);

  useEffect(() => {
      const fetchMonths = async () => {
          try {
              const response = await api.get('/transactions?month=all');
              const transactions: Transaction[] = response.data;
              const summaryMap = new Map<string, MonthlySummaryEntry>();

              transactions.forEach((t) => {
                const transactionDate = new Date(t.data);
                const key = format(transactionDate, 'yyyy-MM');
                const existing = summaryMap.get(key) ?? buildEmptySummary(transactionDate);
                const updated = { ...existing };
                const amount = Number(t.valor);
                if (t.tipo === 'receita') {
                  updated.incomeForecast += amount;
                  if (t.pago) {
                    updated.income += amount;
                  }
                } else {
                  updated.expenseForecast += amount;
                  if (t.pago) {
                    updated.expense += amount;
                  }
                }
                summaryMap.set(key, updated);
              });

              const ensureMonth = (date: Date) => {
                const key = format(date, 'yyyy-MM');
                if (!summaryMap.has(key)) {
                  summaryMap.set(key, buildEmptySummary(date));
                }
              };

              let lastDate = transactions.length
                ? new Date(Math.max(...transactions.map((t) => new Date(t.data).getTime())))
                : new Date();

              ensureMonth(lastDate);
              ensureMonth(addMonths(lastDate, 1));
              ensureMonth(addMonths(lastDate, 2));
              ensureMonth(selectedDate);

              const sortedSummaries = Array.from(summaryMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
              setMonthlySummaries(sortedSummaries);
          } catch (error) {
              console.error("Erro ao buscar meses:", error);
          }
      };
      fetchMonths();
  }, [buildEmptySummary, selectedDate]);

  useEffect(() => {
    setMonthlySummaries((prev) => {
      if (prev.length === 0) return prev;
      const key = format(selectedDate, 'yyyy-MM');
      const currentIndex = prev.findIndex((entry) => entry.key === key);
      if (currentIndex === -1) return prev;
      const summaryOverride = getSummaryFromTransactions(transactionsForMonth);
      const next = [...prev];
      next[currentIndex] = {
        ...next[currentIndex],
        ...summaryOverride,
      };
      return next;
    });
  }, [transactionsForMonth, selectedDate, getSummaryFromTransactions]);

  const updateCanScroll = useCallback((carousel?: EmblaCarouselType | null) => {
    if (!carousel) return;
    setCanScrollPrev(carousel.canScrollPrev());
    setCanScrollNext(carousel.canScrollNext());
  }, []);

  useEffect(() => {
    if (!emblaApi || monthlySummaries.length === 0) return;

    const onSelect = (api: EmblaCarouselType) => {
        const selectedSummary = monthlySummaries[api.selectedScrollSnap()];
        if (selectedSummary) {
          onDateChange(selectedSummary.date);
        }
        updateCanScroll(api);
    };
    
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', updateCanScroll);

    const targetIndex = monthlySummaries.findIndex(d => getYear(d.date) === getYear(selectedDate) && getMonth(d.date) === getMonth(selectedDate));
    if (targetIndex !== -1 && targetIndex !== emblaApi.selectedScrollSnap()) {
        emblaApi.scrollTo(targetIndex, true); 
    }
    updateCanScroll(emblaApi);
    
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', updateCanScroll);
    };
  }, [emblaApi, monthlySummaries, onDateChange, selectedDate, updateCanScroll]);
  
  const { income, incomeForecast, expense, expenseForecast, balance, balanceForecast } = useMemo(() => {
    const income = transactionsForMonth.filter(t => t.tipo === 'receita' && t.pago).reduce((acc, t) => acc + Number(t.valor), 0);
    const incomeForecast = transactionsForMonth.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + Number(t.valor), 0);

    const expense = transactionsForMonth.filter(t => t.tipo === 'despesa' && t.pago).reduce((acc, t) => acc + Number(t.valor), 0);
    const expenseForecast = transactionsForMonth.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + Number(t.valor), 0);
    
    const balance = income - expense;
    const balanceForecast = incomeForecast - expenseForecast;
    
    return { income, incomeForecast, expense, expenseForecast, balance, balanceForecast };
  }, [transactionsForMonth]);

  const handleMonthSelect = (summary: MonthlySummaryEntry, index: number) => {
    onDateChange(summary.date);
    emblaApi?.scrollTo(index);
  };

  const fallbackSummary = useMemo(() => {
    const overrides = getSummaryFromTransactions(transactionsForMonth);
    const date = selectedDate;
    return {
      date,
      balance: overrides.income - overrides.expense,
      balanceForecast: overrides.incomeForecast - overrides.expenseForecast,
      ...overrides,
    };
  }, [getSummaryFromTransactions, transactionsForMonth, selectedDate]);

  if (!monthlySummaries.length) {
    return (
      <Card className="rounded-2xl shadow-lg bg-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base font-medium">Balanço do Mês</CardTitle>
          <p className="text-sm font-semibold capitalize">{format(fallbackSummary.date, 'MMMM yyyy', { locale: ptBR })}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-2">
            <div className="text-4xl font-bold">
              {Number(fallbackSummary.balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-sm text-muted-foreground">
              Previsto: {Number(fallbackSummary.balanceForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center text-green-500 gap-2">
              <ArrowUpRight className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground font-semibold">Receitas</p>
                <p className="font-bold text-lg">{Number(fallbackSummary.income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p className="text-xs text-muted-foreground">
                  Previsto: {Number(fallbackSummary.incomeForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
            <div className="flex items-center text-red-500 gap-2">
              <ArrowDownLeft className="h-5 w-5 flex-shrink-0" />
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-semibold">Despesas</p>
                <p className="font-bold text-lg">{Number(fallbackSummary.expense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <p className="text-xs text-muted-foreground">
                  Previsto: {Number(fallbackSummary.expenseForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-row items-center justify-between">
        <h3 className="text-base font-medium">Balanço do Mês</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => emblaApi?.scrollPrev()} disabled={!canScrollPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => emblaApi?.scrollNext()} disabled={!canScrollNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {monthlySummaries.map((summary, idx) => {
            const isActive = getYear(summary.date) === getYear(selectedDate) && getMonth(summary.date) === getMonth(selectedDate);
            const balance = summary.income - summary.expense;
            const balanceForecast = summary.incomeForecast - summary.expenseForecast;
            return (
              <div key={summary.key} className="flex-[0_0_100%] min-w-0">
                <Card
                  className={cn(
                    'rounded-2xl shadow-lg bg-card h-full',
                    isActive ? 'border-primary/60 ring-1 ring-primary/10' : ''
                  )}
                  onClick={() => handleMonthSelect(summary, idx)}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-base font-medium">Balanço do Mês</CardTitle>
                    <p className="text-sm font-semibold capitalize">{format(summary.date, 'MMMM yyyy', { locale: ptBR })}</p>
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
                        <ArrowUpRight className="h-5 w-5 flex-shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground font-semibold">Receitas</p>
                          <p className="font-bold text-lg">{Number(summary.income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                          <p className="text-xs text-muted-foreground">
                            Previsto: {Number(summary.incomeForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center text-red-500 gap-2">
                        <ArrowDownLeft className="h-5 w-5 flex-shrink-0" />
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground font-semibold">Despesas</p>
                          <p className="font-bold text-lg">{Number(summary.expense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                          <p className="text-xs text-muted-foreground">
                            Previsto: {Number(summary.expenseForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
