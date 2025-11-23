// src/app/dashboard/relatorios/page.tsx
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { BarChart3, Download, Filter, Loader2, PieChart, TrendingUp, Target, Wallet } from 'lucide-react';
import type { Transaction, Category, Account, Card as CardType, Tag, Goal, Budget } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { TransactionFilters, type FilterState } from '@/components/dashboard/transacoes/transaction-filters';
import { ExpensesByCategoryChart } from '@/components/dashboard/relatorios/expenses-by-category-chart';
import { DailyFlowChart } from '@/components/dashboard/relatorios/daily-flow-chart';
import { PaymentMethodsChart } from '@/components/dashboard/relatorios/payment-methods-chart';
import { TopExpensesTable } from '@/components/dashboard/relatorios/top-expenses-table';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { endOfMonth, format, parseISO, startOfMonth } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NetWorthCard } from '@/components/dashboard/relatorios/net-worth-card';
import { GoalSummaryCard } from '@/components/dashboard/relatorios/goal-summary-card';
import { ComparativeExpensesChart } from '@/components/dashboard/relatorios/comparative-expenses-chart';
import { CashflowForecastChart } from '@/components/dashboard/relatorios/cashflow-forecast-chart';
import { BudgetPerformanceTable } from '@/components/dashboard/relatorios/budget-performance-table';
import { GoalsFundsOverview } from '@/components/dashboard/relatorios/goals-funds-overview';
import { CardInsightsCard } from '@/components/dashboard/relatorios/card-insights-card';
import { TagInsightsCard } from '@/components/dashboard/relatorios/tag-insights-card';
import { ReportsHero } from '@/components/dashboard/relatorios/reports-hero';
import { SankeyCashFlowChart } from '@/components/dashboard/relatorios/sankey-cash-flow-chart';
import { PatrimonyEvolutionChart } from '@/components/dashboard/relatorios/patrimony-evolution-chart';
import { ExportMenu } from '@/components/dashboard/relatorios/export-menu';
import { motion } from 'framer-motion';
import { handleApiError } from '@/lib/error-handler';

type FilterChip =
  | { key: string; label: string; type: 'dateRange' | 'type' | 'text' }
  | { key: string; label: string; type: 'account' | 'card' | 'category' | 'method' | 'tag'; value: string };

const createDefaultFilters = (): FilterState => ({
  text: null,
  accounts: [],
  cards: [],
  categories: [],
  methods: [],
  tags: [],
  type: null,
  dateRange: undefined,
});

const getCurrentMonthRange = () => {
  const now = new Date();
  return {
    from: startOfMonth(now),
    to: endOfMonth(now),
  };
};

const METHOD_LABELS: Record<string, string> = {
  credito: 'Cartão de Crédito',
  debito: 'Débito',
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  transferencia: 'Transferência',
};

export default function RelatoriosPage() {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [includePending, setIncludePending] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...createDefaultFilters(),
    dateRange: getCurrentMonthRange(),
  }));

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('month', 'all');
      params.set('includePending', 'true');
      params.set('includeShared', 'true');
      const currentMonth = format(new Date(), 'yyyy-MM');
      const [transRes, goalsRes, accRes, cardsRes, catRes, tagsRes, budgetsRes] = await Promise.all([
        api.get(`/transactions?${params.toString()}`),
        api.get('/goals'),
        api.get('/accounts'),
        api.get('/cards'),
        api.get('/categories'),
        api.get('/tags'),
        api.get(`/budgets?month=${currentMonth}`),
      ]);
      setAllTransactions(transRes.data);
      setGoals(goalsRes.data);
      setAccounts(accRes.data);
      setCards(cardsRes.data);
      setCategories(catRes.data);
      setTags(tagsRes.data);
      setBudgets(budgetsRes.data);
    } catch (error) {
      handleApiError(error, toast, 'Erro ao buscar dados para relatórios');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const handleTransactionUpdate = () => {
      fetchData().catch(() => { });
    };
    window.addEventListener('transaction-updated', handleTransactionUpdate);
    return () => window.removeEventListener('transaction-updated', handleTransactionUpdate);
  }, [fetchData]);

  const filteredTransactions = useMemo(() => {
    let results = includePending ? allTransactions : allTransactions.filter(t => t.pago === true);

    if (filters.dateRange?.from) {
      const fromDate = filters.dateRange.from;
      const toDate = filters.dateRange.to || new Date();
      results = results.filter(t => {
        const transactionDate = parseISO(t.data);
        return transactionDate >= fromDate! && transactionDate <= toDate;
      });
    }
    if (filters.text) {
      results = results.filter(t => t.descricao.toLowerCase().includes(filters.text!.toLowerCase()));
    }
    if (filters.accounts.length > 0) {
      results = results.filter(t => t.accountId && filters.accounts.includes(t.accountId));
    }
    if (filters.cards.length > 0) {
      results = results.filter(t => t.cardId && filters.cards.includes(t.cardId));
    }
    if (filters.categories.length > 0) {
      results = results.filter(t => filters.categories.includes(t.categoria || ''));
    }
    if (filters.methods.length > 0) {
      results = results.filter(t => filters.methods.includes(t.metodoPagamento));
    }
    if (filters.type) {
      results = results.filter(t => t.tipo === filters.type);
    }
    if (filters.tags.length > 0) {
      results = results.filter(t => {
        const transactionTagIds = t.tags.map(tag => tag.id);
        return filters.tags.every(filterTagId => transactionTagIds.includes(filterTagId));
      });
    }

    return results;
  }, [allTransactions, includePending, filters]);

  const isDefaultDateRange = (() => {
    if (!filters.dateRange?.from || !filters.dateRange?.to) return false;
    const currentRange = getCurrentMonthRange();
    return (
      filters.dateRange.from.getTime() === currentRange.from.getTime() &&
      filters.dateRange.to.getTime() === currentRange.to.getTime()
    );
  })();

  const hasCustomDateRange = Boolean(filters.dateRange?.from && !isDefaultDateRange);

  const isFilterActive = useMemo(() => {
    return Boolean(
      filters.text ||
      filters.accounts.length ||
      filters.cards.length ||
      filters.categories.length ||
      filters.methods.length ||
      filters.tags.length ||
      filters.type ||
      hasCustomDateRange
    );
  }, [filters, hasCustomDateRange]);

  const filterChips = useMemo<FilterChip[]>(() => {
    const chips: FilterChip[] = [];
    if (hasCustomDateRange && filters.dateRange?.from) {
      const from = format(filters.dateRange.from, 'dd/MM/yy');
      const to = filters.dateRange.to ? format(filters.dateRange.to, 'dd/MM/yy') : from;
      chips.push({ key: 'dateRange', type: 'dateRange', label: `Período: ${from} - ${to}` });
    }
    if (filters.type) {
      chips.push({ key: 'type', type: 'type', label: filters.type === 'receita' ? 'Somente receitas' : 'Somente despesas' });
    }
    if (filters.text) {
      chips.push({ key: 'text', type: 'text', label: `Busca: ${filters.text}` });
    }
    filters.accounts.forEach((accountId) => {
      const account = accounts.find(acc => acc.id === accountId);
      chips.push({
        key: `account-${accountId}`,
        type: 'account',
        value: accountId,
        label: `Conta: ${account?.nome || 'Desconhecida'}`,
      });
    });
    filters.cards.forEach((cardId) => {
      const card = cards.find(card => card.id === cardId);
      chips.push({
        key: `card-${cardId}`,
        type: 'card',
        value: cardId,
        label: `Cartão: ${card?.nome || 'Cartão'}`,
      });
    });
    filters.categories.forEach((categoryName) => {
      const category = categories.find(cat => cat.nome === categoryName || cat.label === categoryName);
      chips.push({
        key: `category-${categoryName}`,
        type: 'category',
        value: categoryName,
        label: `Categoria: ${category?.label || categoryName}`,
      });
    });
    filters.methods.forEach((method) => {
      const methodLabel = METHOD_LABELS[method] || method;
      chips.push({
        key: `method-${method}`,
        type: 'method',
        value: method,
        label: `Método: ${methodLabel}`,
      });
    });
    filters.tags.forEach((tagId) => {
      const tag = tags.find(t => t.id === tagId);
      chips.push({
        key: `tag-${tagId}`,
        type: 'tag',
        value: tagId,
        label: `Tag: ${tag?.name || 'Tag'}`,
      });
    });
    return chips;
  }, [filters, accounts, cards, categories, tags, hasCustomDateRange]);

  const handleRemoveChip = (chip: FilterChip) => {
    setFilters(prev => {
      switch (chip.type) {
        case 'dateRange':
          return { ...prev, dateRange: undefined };
        case 'type':
          return { ...prev, type: null };
        case 'text':
          return { ...prev, text: null };
        case 'account':
          return { ...prev, accounts: prev.accounts.filter(id => id !== chip.value) };
        case 'card':
          return { ...prev, cards: prev.cards.filter(id => id !== chip.value) };
        case 'category':
          return { ...prev, categories: prev.categories.filter(cat => cat !== chip.value) };
        case 'method':
          return { ...prev, methods: prev.methods.filter(method => method !== chip.value) };
        case 'tag':
          return { ...prev, tags: prev.tags.filter(tag => tag !== chip.value) };
        default:
          return prev;
      }
    });
  };

  const handleClearFilters = () => {
    setFilters({
      ...createDefaultFilters(),
      dateRange: getCurrentMonthRange(),
    });
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setIsFilterSheetOpen(false);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await api.post('/transactions/export', {
        includePending,
        text: filters.text,
        categories: filters.categories,
        accounts: filters.accounts,
        cards: filters.cards,
        methods: filters.methods,
        type: filters.type,
        dateRange: filters.dateRange?.from
          ? {
            from: filters.dateRange.from?.toISOString(),
            to: filters.dateRange.to?.toISOString(),
          }
          : undefined,
      }, {
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
      handleApiError(error, toast, 'Erro na Exportação');
    } finally {
      setIsExporting(false);
    }
  };


  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className='flex items-center gap-3'>
          <div className="p-2 bg-primary/10 rounded-lg">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Relatórios</h1>
            <p className="text-muted-foreground">Análise detalhada da sua jornada financeira.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={isExporting} className="hover:bg-primary/5">
          {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
          Exportar CSV
        </Button>
      </div>

      {/* Filters Section */}
      <div className="rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm">
        <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 border-dashed">
                  <Filter className="h-4 w-4" />
                  Filtros avançados
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full max-w-md p-0">
                <TransactionFilters
                  accounts={accounts}
                  cards={cards}
                  categories={categories}
                  tags={tags}
                  currentFilters={filters}
                  onFilterChange={handleFilterChange}
                />
              </SheetContent>
            </Sheet>
            <div className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm bg-background/50">
              <Switch id="include-pending" checked={includePending} onCheckedChange={setIncludePending} />
              <Label htmlFor="include-pending" className="cursor-pointer font-medium">Mostrar pendentes</Label>
            </div>
          </div>
          {isFilterActive && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-destructive hover:text-destructive hover:bg-destructive/10">
              Limpar filtros
            </Button>
          )}
        </div>
        {isFilterActive && (
          <div className="border-t px-4 py-3 bg-muted/20">
            <div className="flex flex-wrap gap-2">
              {filterChips.map(chip => (
                <Badge key={chip.key} variant="secondary" className="flex items-center gap-1 pl-2 pr-1 py-1">
                  {chip.label}
                  <button
                    type="button"
                    onClick={() => handleRemoveChip(chip)}
                    className="rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors ml-1"
                    aria-label={`Remover filtro ${chip.label}`}
                  >
                    &times;
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Hero Section */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <ReportsHero transactions={filteredTransactions} />
        </div>
        <ExportMenu filters={filters} />
      </div>

      {/* Main Content - Tabs */}
      <Tabs defaultValue="expenses" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 p-1 h-auto bg-muted/50 rounded-xl">
          <TabsTrigger value="expenses" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 rounded-lg transition-all">
            <PieChart className="h-4 w-4 mr-2" />
            Despesas
          </TabsTrigger>
          <TabsTrigger value="flow" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 rounded-lg transition-all">
            <TrendingUp className="h-4 w-4 mr-2" />
            Fluxo de Caixa
          </TabsTrigger>
          <TabsTrigger value="assets" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 rounded-lg transition-all">
            <Target className="h-4 w-4 mr-2" />
            Metas & Ativos
          </TabsTrigger>
          <TabsTrigger value="budgets" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-2.5 rounded-lg transition-all">
            <Wallet className="h-4 w-4 mr-2" />
            Orçamentos
          </TabsTrigger>
        </TabsList>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TabsContent value="expenses" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <ExpensesByCategoryChart transactions={filteredTransactions} />
              <TopExpensesTable transactions={filteredTransactions} />
            </div>
            <ComparativeExpensesChart transactions={allTransactions} currentDateRange={filters.dateRange} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PaymentMethodsChart transactions={filteredTransactions} />
              <TagInsightsCard transactions={filteredTransactions} />
            </div>
          </TabsContent>

          <TabsContent value="flow" className="space-y-6 mt-0">
            <SankeyCashFlowChart startDate={filters.dateRange?.from} endDate={filters.dateRange?.to} />
            <DailyFlowChart transactions={filteredTransactions} />
            <CashflowForecastChart transactions={allTransactions} accounts={accounts} />
          </TabsContent>

          <TabsContent value="assets" className="space-y-6 mt-0">
            <PatrimonyEvolutionChart />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <NetWorthCard transactions={allTransactions} accounts={accounts} />
              <GoalSummaryCard goals={goals} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GoalsFundsOverview goals={goals} />
              <CardInsightsCard cards={cards} transactions={filteredTransactions} />
            </div>
          </TabsContent>

          <TabsContent value="budgets" className="space-y-6 mt-0">
            <BudgetPerformanceTable budgets={budgets} />
          </TabsContent>
        </motion.div>
      </Tabs>
    </div>
  );
}
