'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { EmblaCarouselType } from 'embla-carousel-react';
import useEmblaCarousel from 'embla-carousel-react';
import { format, getMonth, getYear, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownLeft, ArrowUpRight, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import type { Transaction } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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
    align: 'center', // Center alignment looks better for premium feel
    containScroll: 'trimSnaps',
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
    // Fallback loading state or empty state
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-row items-center justify-between px-1">
        <h3 className="text-lg font-semibold tracking-tight flex items-center gap-2">
          <Wallet className="h-5 w-5 text-primary" />
          Balanço Mensal
        </h3>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10" onClick={() => emblaApi?.scrollPrev()} disabled={!canScrollPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10" onClick={() => emblaApi?.scrollNext()} disabled={!canScrollNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden -mx-4 px-4 pb-4" ref={emblaRef}>
        <div className="flex gap-4 touch-pan-y">
          {monthlySummaries.map((summary, idx) => {
            const isActive = getYear(summary.date) === getYear(selectedDate) && getMonth(summary.date) === getMonth(selectedDate);
            const balance = summary.income - summary.expense;
            const balanceForecast = summary.incomeForecast - summary.expenseForecast;

            return (
              <motion.div
                key={summary.key}
                className="flex-[0_0_85%] sm:flex-[0_0_45%] min-w-0"
                animate={{
                  scale: isActive ? 1 : 0.95,
                  opacity: isActive ? 1 : 0.7
                }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className={cn(
                    'rounded-3xl border-0 h-full transition-all duration-300',
                    isActive
                      ? 'bg-gradient-to-br from-background via-background to-muted/50 shadow-xl ring-1 ring-primary/20'
                      : 'bg-muted/30 shadow-none hover:bg-muted/50'
                  )}
                  onClick={() => handleMonthSelect(summary, idx)}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
                    <span className={cn("text-sm font-bold uppercase tracking-wider", isActive ? "text-primary" : "text-muted-foreground")}>
                      {format(summary.date, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    {isActive && (
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </CardHeader>
                  <CardContent className="space-y-5 px-5 pb-6">
                    <div className="text-center py-1">
                      <div className={cn(
                        "text-3xl font-bold tracking-tight",
                        balance >= 0 ? "text-foreground" : "text-destructive"
                      )}>
                        {Number(balance).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </div>
                      <p className="text-xs font-medium text-muted-foreground mt-1">
                        Previsto: <span className="text-foreground/80">{Number(balanceForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1 p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                        <div className="flex items-center gap-1.5 text-emerald-600 mb-1">
                          <div className="p-1 bg-emerald-500/20 rounded-full">
                            <TrendingUp className="h-3 w-3" />
                          </div>
                          <span className="text-xs font-bold uppercase">Receitas</span>
                        </div>
                        <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400">
                          {Number(summary.income).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Prev: {Number(summary.incomeForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>

                      <div className="space-y-1 p-3 rounded-2xl bg-rose-500/5 border border-rose-500/10">
                        <div className="flex items-center gap-1.5 text-rose-600 mb-1">
                          <div className="p-1 bg-rose-500/20 rounded-full">
                            <TrendingDown className="h-3 w-3" />
                          </div>
                          <span className="text-xs font-bold uppercase">Despesas</span>
                        </div>
                        <p className="font-bold text-sm text-rose-700 dark:text-rose-400">
                          {Number(summary.expense).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Prev: {Number(summary.expenseForecast).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
