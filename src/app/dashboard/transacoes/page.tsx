// src/app/dashboard/transacoes/page.tsx
'use client';

import { useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Transaction, Account, Card as CardType, Category, Tag } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { TransactionMobileList } from '@/components/dashboard/transacoes/transaction-mobile-list';
import { useToast } from '@/hooks/use-toast';
import { Filter, Search, X } from 'lucide-react';
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
      toast({ variant: 'destructive', title: 'Erro ao buscar dados de suporte'});
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
      toast({ variant: 'destructive', title: 'Erro ao buscar transações'});
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
      .catch(() => {})
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
      return <LoadingScreen />
    }

    if (filteredTransactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center rounded-2xl border-2 border-dashed mt-6">
                <Search className="h-16 w-16 text-muted-foreground" />
                <h3 className='text-lg font-semibold'>Nenhuma Transação Encontrada</h3>
                <p className="text-muted-foreground">Não há transações para este período com os filtros atuais. <br/> Tente limpar os filtros ou adicionar uma nova transação.</p>
                <Button variant="outline" size="sm" onClick={() => handleOpenForm()}>
                    Adicionar Transação
                </Button>
            </div>
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
    <div className="space-y-4">
      {isFilterActive && filters.dateRange?.from ? (
        <FilteredSummary transactions={filteredTransactions} dateRange={filters.dateRange}/>
      ) : (
        <MonthlySummary
            transactionsForMonth={monthlyTransactions}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
        />
      )}

      <div className="px-1 md:px-0 flex items-center gap-2">
        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Filter className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full max-w-sm p-0">
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
        
        <div className="relative flex-1">
          <Button variant="ghost" size="icon" onClick={() => setIsSearchVisible(!isSearchVisible)}>
            <Search className="h-5 w-5" />
          </Button>
          {isSearchVisible && (
            <div className="absolute top-1/2 -translate-y-1/2 left-12 w-[calc(100%-4rem)] md:w-1/2 flex items-center gap-2">
              <Input
                autoFocus
                placeholder="Buscar por descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className="h-9"
              />
               <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => { setIsSearchVisible(false); setSearchQuery(''); }}>
                  <X className="h-5 w-5" />
              </Button>
            </div>
          )}
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
