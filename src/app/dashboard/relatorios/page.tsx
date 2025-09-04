// src/app/dashboard/relatorios/page.tsx
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { BarChart3, Download, Filter, Loader2, Sparkles, X } from 'lucide-react';
import type { Transaction, Category, Account, Card as CardType, Tag, Goal } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import type { FilterState } from '@/components/dashboard/transacoes/transaction-filters';
import { ExpensesByCategoryChart } from '@/components/dashboard/relatorios/expenses-by-category-chart';
import { DailyFlowChart } from '@/components/dashboard/relatorios/daily-flow-chart';
import { PaymentMethodsChart } from '@/components/dashboard/relatorios/payment-methods-chart';
import { TopExpensesTable } from '@/components/dashboard/relatorios/top-expenses-table';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, subDays, subMonths, parseISO, startOfMonth, endOfMonth, subYears } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { NetWorthCard } from '@/components/dashboard/relatorios/net-worth-card';
import { GoalSummaryCard } from '@/components/dashboard/relatorios/goal-summary-card';
import { ComparativeExpensesChart } from '@/components/dashboard/relatorios/comparative-expenses-chart';
import { DetailedSummary } from '@/components/dashboard/relatorios/detailed-summary';

export default function RelatoriosPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [includePending, setIncludePending] = useState(false);
  
  const [aiQuery, setAiQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
  });

  const { toast } = useToast();
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [transRes, goalsRes, accRes] = await Promise.all([
        api.get('/transactions/all?includeShared=true'), // Modificação para buscar transações do clã
        api.get('/goals'),
        api.get('/accounts'),
      ]);
      setAllTransactions(transRes.data);
      setGoals(goalsRes.data);
      setAccounts(accRes.data);
    } catch(error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar dados para relatórios' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  const filteredTransactions = useMemo(() => {
    let results = allTransactions;

    if (!includePending) {
        results = results.filter(t => t.pago === true);
    }

    if(dateRange?.from) {
        results = results.filter(t => {
            const transactionDate = parseISO(t.data);
            return transactionDate >= dateRange.from! && transactionDate <= (dateRange.to || new Date());
        });
    }

    return results;
  }, [allTransactions, dateRange, includePending]);
  
  const handleExport = async () => {
    setIsExporting(true);
    try {
        const response = await api.post('/transactions/export', { dateRange, includePending }, {
            responseType: 'blob',
        });
        
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', 'jornada_financeira_export.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({ title: "Exportação Concluída" });
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro na Exportação' });
    } finally {
        setIsExporting(false);
    }
  };
  
  const handleAiSearch = async () => {
    if (!aiQuery) return;
    setIsAiSearching(true);
    try {
      const response = await api.post('/ai/search-transactions', { query: aiQuery });
      const filtersFromAI = response.data;
      if (filtersFromAI.start_date || filtersFromAI.end_date) {
        setDateRange({
            from: filtersFromAI.start_date ? parseISO(filtersFromAI.start_date) : undefined,
            to: filtersFromAI.end_date ? parseISO(filtersFromAI.end_date) : undefined
        });
      }
      toast({ title: "Filtros aplicados pela IA." });
    } catch (e) {
       toast({ variant: 'destructive', title: "Erro na busca com IA." });
    } finally {
      setIsAiSearching(false);
    }
  };


  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className='flex items-center gap-3'>
                <BarChart3 className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Relatórios</h1>
                    <p className="text-muted-foreground">Analise sua jornada financeira.</p>
                </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Download className="mr-2 h-4 w-4" />}
                Exportar
            </Button>
        </div>

        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="filters">
                <AccordionTrigger>
                    <div className='flex items-center gap-2'>
                        <Filter className="h-4 w-4" />
                        <span className='font-semibold'>Filtros e Período</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent className='space-y-4 pt-4'>
                     <div className="space-y-2">
                        <Label htmlFor="ai-search">Busca Inteligente com IA</Label>
                        <div className="flex gap-2">
                        <Input id="ai-search" placeholder="Ex: gastos com iFood no mês passado" value={aiQuery} onChange={(e) => setAiQuery(e.target.value)}/>
                        <Button onClick={handleAiSearch} disabled={isAiSearching || !aiQuery} className="px-3">
                            {isAiSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                        </Button>
                        </div>
                    </div>
                    <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                        <div className="space-y-2">
                            <Label>Período</Label>
                            <Popover><PopoverTrigger asChild>
                                <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? ( dateRange.to ? `${format(dateRange.from, "LLL dd, y")} - ${format(dateRange.to, "LLL dd, y")}` : format(dateRange.from, "LLL dd, y")) : <span>Escolha um período</span>}
                                </Button>
                            </PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                                <Calendar 
                                    initialFocus 
                                    mode="range" 
                                    defaultMonth={dateRange?.from} 
                                    selected={dateRange} 
                                    onSelect={setDateRange} 
                                    numberOfMonths={2} 
                                    locale={ptBR}
                                />
                            </PopoverContent></Popover>
                        </div>
                         <div className="space-y-2">
                             <Label>Períodos Rápidos</Label>
                             <div className="flex flex-wrap gap-2">
                                <Button variant="outline" size="sm" onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>Este Mês</Button>
                                <Button variant="outline" size="sm" onClick={() => setDateRange({ from: subDays(new Date(), 90), to: new Date() })}>90 dias</Button>
                                <Button variant="outline" size="sm" onClick={() => setDateRange({ from: subYears(new Date(), 1), to: new Date() })}>1 Ano</Button>
                             </div>
                        </div>
                    </div>
                     <div className="flex items-center space-x-2 pt-2">
                        <Switch id="include-pending" checked={includePending} onCheckedChange={setIncludePending}/>
                        <Label htmlFor="include-pending" className="text-sm font-medium">Incluir transações pendentes</Label>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
        
        <DetailedSummary transactions={filteredTransactions} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <GoalSummaryCard goals={goals} />
            <NetWorthCard transactions={allTransactions} accounts={accounts} />
        </div>

        <Accordion type="multiple" defaultValue={['expenses']} className="w-full space-y-4">
            <AccordionItem value="expenses" className='border rounded-lg overflow-hidden'>
                <AccordionTrigger className='p-4 hover:no-underline bg-muted/30'>
                    <h3 className="text-lg font-semibold">Análise de Despesas</h3>
                </AccordionTrigger>
                <AccordionContent className='p-4 space-y-6'>
                    <ExpensesByCategoryChart transactions={filteredTransactions} />
                    <TopExpensesTable transactions={filteredTransactions} />
                    <ComparativeExpensesChart transactions={allTransactions} currentDateRange={dateRange} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="flow" className='border rounded-lg overflow-hidden'>
                <AccordionTrigger className='p-4 hover:no-underline bg-muted/30'>
                    <h3 className="text-lg font-semibold">Fluxo de Caixa</h3>
                </AccordionTrigger>
                <AccordionContent className='p-4 space-y-6'>
                    <DailyFlowChart transactions={filteredTransactions} />
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="distribution" className='border rounded-lg overflow-hidden'>
                <AccordionTrigger className='p-4 hover:no-underline bg-muted/30'>
                    <h3 className="text-lg font-semibold">Distribuição</h3>
                </AccordionTrigger>
                <AccordionContent className='p-4 space-y-6'>
                    <PaymentMethodsChart transactions={filteredTransactions} />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </div>
  );
}
