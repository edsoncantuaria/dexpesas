'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Transaction, Account, Card as CardType, Category, Tag } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { TransactionMobileList } from '@/components/dashboard/transacoes/transaction-mobile-list';
import { useToast } from '@/hooks/use-toast';
import { Filter, Search, X, Plus } from 'lucide-react';
import { MonthlySummary } from '@/components/dashboard/transacoes/monthly-summary';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { FilterState } from '@/components/dashboard/transacoes/transaction-filters';
import { TransactionFilters } from '@/components/dashboard/transacoes/transaction-filters';
import api from '@/lib/api';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Input } from '@/components/ui/input';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTransactionForm } from '@/contexts/TransactionFormContext';
import { TransactionsTable } from '@/components/dashboard/transacoes/transactions-table';
import { format, parseISO } from 'date-fns';
import { FilteredSummary } from '@/components/dashboard/transacoes/filtered-summary';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';


function TransactionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openForm, setEditingTransaction } = useTransactionForm();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyTransactions, setMonthlyTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [cards, setCards] = useState<CardType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(true);

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    text: '',
    accounts: [],
    cards: [],
    categories: [],
    methods: [],
    tags: [],
    type: null,
    dateRange: undefined,
  });
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const hasCustomRange = Boolean(filters.dateRange?.from);

  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      openForm();
      router.replace('/dashboard/transacoes', { scroll: false });
    }
  }, [searchParams, router, openForm]);

  const fetchInitialData = useCallback(async () => {
    try {
      const [accRes, cardRes, catRes, tagsRes] = await Promise.all([
        api.get('/accounts'),
        api.get('/cards'),
        api.get('/categories'),
        api.get('/tags'),
      ]);
      setAccounts(accRes.data);
      setCards(cardRes.data);
      setCategories(catRes.data);
      setTags(tagsRes.data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar dados de suporte' });
    }
  }, [toast]);

  const fetchTransactionsForMonth = useCallback(async (date: Date, options?: { silent?: boolean; replaceVisible?: boolean }) => {
    const { silent = false, replaceVisible = true } = options || {};
    if (!silent) {
      setIsLoadingTransactions(true);
    }
    try {
      const month = format(date, 'yyyy-MM');
      const response = await api.get(`/transactions?month=${month}&includePending=true`);
      setMonthlyTransactions(response.data);
      if (replaceVisible) {
        setTransactions(response.data);
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar transações' });
    } finally {
      if (!silent) {
        setIsLoadingTransactions(false);
      }
    }
  }, [toast]);

  const fetchTransactionsForRange = useCallback(async (range?: FilterState['dateRange']) => {
    if (!range?.from) {
      setTransactions(monthlyTransactions);
      return;
    }
    setIsLoadingTransactions(true);
    try {
      const params = new URLSearchParams();
      params.set('includePending', 'true');
      params.set('startDate', range.from.toISOString());
      const endDate = range.to ?? range.from;
      params.set('endDate', endDate.toISOString());
      const response = await api.get(`/transactions?${params.toString()}`);
      setTransactions(response.data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar transações' });
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [monthlyTransactions, toast]);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fetchInitialData()
      .catch(() => { })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [fetchInitialData]);

  useEffect(() => {
    fetchTransactionsForMonth(selectedDate, { replaceVisible: !hasCustomRange });
  }, [selectedDate, fetchTransactionsForMonth, hasCustomRange]);

  useEffect(() => {
    const handleTransactionUpdate = () => {
      fetchTransactionsForMonth(selectedDate, { silent: true, replaceVisible: !hasCustomRange });
      if (filters.dateRange?.from) {
        fetchTransactionsForRange(filters.dateRange);
      }
      fetchInitialData();
    };
    window.addEventListener('transaction-updated', handleTransactionUpdate);
    return () => {
      window.removeEventListener('transaction-updated', handleTransactionUpdate);
    };
  }, [selectedDate, fetchTransactionsForMonth, fetchInitialData, fetchTransactionsForRange, filters.dateRange, hasCustomRange]);

  const isFilterActive = useMemo(() => {
    return filters.text || filters.accounts.length > 0 || filters.cards.length > 0 || filters.categories.length > 0 || filters.methods.length > 0 || filters.tags.length > 0 || filters.type || filters.dateRange?.from;
  }, [filters]);

  const filteredTransactions = useMemo(() => {
    let results = transactions;

    if (searchQuery) {
      results = results.filter(t => t.descricao.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    if (filters.dateRange?.from) {
      results = results.filter(t => {
        const transactionDate = parseISO(t.data);
        return transactionDate >= filters.dateRange!.from! && transactionDate <= (filters.dateRange!.to || new Date());
      });
    }

    if (filters.text) results = results.filter(t => t.descricao.toLowerCase().includes(filters.text!.toLowerCase()));
    if (filters.accounts.length > 0) results = results.filter(t => t.accountId && filters.accounts.includes(t.accountId));
    if (filters.cards.length > 0) results = results.filter(t => t.cardId && filters.cards.includes(t.cardId));
    if (filters.categories.length > 0) results = results.filter(t => filters.categories.includes(t.categoria));
    if (filters.methods.length > 0) results = results.filter(t => filters.methods.includes(t.metodoPagamento));
    if (filters.type) results = results.filter(t => t.tipo === filters.type);
    if (filters.value_greater_than) results = results.filter(t => t.valor > filters.value_greater_than!);
    if (filters.value_less_than) results = results.filter(t => t.valor < filters.value_less_than!);
    if (filters.tags.length > 0) {
      results = results.filter(t => {
        const transactionTagIds = t.tags.map(tag => tag.id);
        return filters.tags.every(filterTagId => transactionTagIds.includes(filterTagId));
      });
    }

    return results;
  }, [transactions, searchQuery, filters]);


  const handleOpenForm = (transaction?: Transaction) => {
    setEditingTransaction(transaction || null);
    openForm();
  };

  const handleDeleteTransaction = async (transactionId: string) => {
    try {
      await api.delete(`/transactions/${transactionId}`);
      await fetchTransactionsForMonth(selectedDate, { replaceVisible: !hasCustomRange });
      if (filters.dateRange?.from) {
        await fetchTransactionsForRange(filters.dateRange);
      }
      toast({
        title: 'Transação excluída!',
        variant: 'destructive',
      });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir' });
    }
  };

  const handleTogglePaidStatus = async (transactionId: string) => {
    try {
      await api.patch(`/transactions/${transactionId}/toggle-paid`);
      await fetchTransactionsForMonth(selectedDate, { replaceVisible: !hasCustomRange });
      if (filters.dateRange?.from) {
        await fetchTransactionsForRange(filters.dateRange);
      }
      toast({ title: 'Status da transação atualizado!' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar status' });
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setIsSearchVisible(false);
    }
  };

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setIsFilterSheetOpen(false);
    if (newFilters.dateRange?.from) {
      void fetchTransactionsForRange(newFilters.dateRange);
    } else {
      setTransactions(monthlyTransactions);
    }
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  const renderContent = () => {
    if (isLoadingTransactions) {
      return (
        <div className="flex items-center justify-center py-20">
          <LoadingScreen />
        </div>
      )
    }

    if (filteredTransactions.length === 0) {
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center gap-4 py-20 text-center rounded-3xl border-2 border-dashed border-muted mt-6 bg-muted/10"
        >
          <div className="p-4 bg-muted rounded-full">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className='text-lg font-semibold'>Nenhuma Transação Encontrada</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Não encontramos nada com os filtros atuais. Tente buscar por outra coisa ou adicione uma nova transação.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleOpenForm()} className="mt-2 rounded-full">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Transação
          </Button>
        </motion.div>
      )
    }

    if (isMobile) {
      return (
        <TransactionMobileList
          data={filteredTransactions}
          onEdit={handleOpenForm}
          onDelete={handleDeleteTransaction}
          onTogglePaidStatus={handleTogglePaidStatus}
          accounts={accounts}
          cards={cards}
        />
      );
    }
    return (
      <TransactionsTable
        data={filteredTransactions}
        onEdit={handleOpenForm}
        onDelete={handleDeleteTransaction}
        onTogglePaidStatus={handleTogglePaidStatus}
        accounts={accounts}
        cards={cards}
      />
    )
  }

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      {isFilterActive && filters.dateRange?.from ? (
        <FilteredSummary transactions={filteredTransactions} dateRange={filters.dateRange} />
      ) : (
        <MonthlySummary
          transactionsForMonth={monthlyTransactions}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      )}

      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md py-2 -mx-4 px-4 md:static md:bg-transparent md:p-0 md:mx-0">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <div className={cn(
              "flex items-center h-12 w-full rounded-2xl bg-muted/50 border border-transparent focus-within:border-primary/50 focus-within:bg-background focus-within:shadow-sm transition-all duration-300 px-3 gap-2",
              isSearchVisible ? "ring-2 ring-primary/20" : ""
            )}>
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar transações..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-0 bg-transparent p-0 h-full focus-visible:ring-0 placeholder:text-muted-foreground/70"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full hover:bg-muted-foreground/20"
                  onClick={() => setSearchQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-2xl border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50 transition-all relative",
                  isFilterActive && "border-primary text-primary bg-primary/5"
                )}
              >
                <Filter className="h-5 w-5" />
                {isFilterActive && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary animate-pulse" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-sm p-0 border-r-0">
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
        </div>
      </div>


      {renderContent()}

    </div>
  );
}

export default function TransacoesPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <TransactionsPageContent />
    </Suspense>
  )
}
