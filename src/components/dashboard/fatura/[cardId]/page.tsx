// src/app/dashboard/fatura/[cardId]/page.tsx
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Transaction, Card as CardType, Account, Category } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { TransactionsTable } from '@/components/dashboard/transacoes/transactions-table';
import { TransactionMobileList } from '@/components/dashboard/transacoes/transaction-mobile-list';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Filter, PlusCircle, Receipt } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import type { FilterState } from '@/components/dashboard/transacoes/transaction-filters';
import { TransactionFilters } from '@/components/dashboard/transacoes/transaction-filters';
import api from '@/lib/api';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useTransactionForm } from '@/contexts/TransactionFormContext';
import { FaturaSummaryCard } from './fatura-summary-card';
import { PayBillDialog } from './pay-bill-dialog';
import { getInvoicePeriod } from '@/lib/date-helpers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function FaturaPage() {
  const router = useRouter();
  const params = useParams();
  const cardId = params.cardId as string;
  
  const { openForm, setEditingTransaction } = useTransactionForm();
  
  const [card, setCard] = useState<CardType | undefined>();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [futureInstallments, setFutureInstallments] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const [isLoading, setIsLoading] = useState(true);
  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    text: '', categories: [], accounts: [], cards: [], methods: [], type: 'despesa',
  });

  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
        const [cardRes, transRes, futureRes, accRes, catRes] = await Promise.all([
            api.get(`/cards/${cardId}`),
            api.get(`/transactions?cardId=${cardId}`),
            api.get(`/cards/${cardId}/future-installments`),
            api.get('/accounts'),
            api.get('/categories'),
        ]);

        if (cardRes.data) {
            setCard(cardRes.data);
            setTransactions(transRes.data);
            setFutureInstallments(futureRes.data);
            setAccounts(accRes.data);
            setCategories(catRes.data);
        } else {
             toast({ variant: 'destructive', title: 'Cartão não encontrado'});
             router.push('/dashboard/cartoes');
        }
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro ao carregar dados da fatura' });
        router.push('/dashboard/cartoes');
    } finally {
        setIsLoading(false);
    }
  }, [cardId, router, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
      const handleTransactionUpdate = () => fetchData();
      window.addEventListener('transaction-updated', handleTransactionUpdate);
      return () => {
          window.removeEventListener('transaction-updated', handleTransactionUpdate);
      };
  }, [fetchData]);

  const { invoiceTransactions } = useMemo(() => {
    if (!card) return { invoiceTransactions: [] };

    const period = getInvoicePeriod(card, selectedMonth);
    const filtered = transactions.filter(t => {
      const tDate = new Date(t.data);
      return tDate >= period.start && tDate <= period.end;
    });

    return { 
        invoiceTransactions: filtered.sort((a,b) => new Date(b.data).getTime() - new Date(a.data).getTime()),
    };
  }, [transactions, card, selectedMonth]);
  
  const { faturaTotal, saldoDevedor } = useMemo(() => {
     const total = invoiceTransactions.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + Number(t.valor), 0);
     const paga = invoiceTransactions.filter(t => t.tipo === 'receita' && t.descricao.includes(`Pagamento Fatura`)).reduce((acc, t) => acc + Number(t.valor), 0);
     return { faturaTotal: total, saldoDevedor: total - paga };
  }, [invoiceTransactions]);

  const handleOpenForm = (transaction?: Transaction) => {
    setEditingTransaction(transaction || null);
    openForm();
  };
  
  const handleDeleteTransaction = async (transactionId: string) => {
    try {
        await api.delete(`/transactions/${transactionId}`);
        await fetchData();
        toast({ title: 'Transação excluída!', variant: 'destructive' });
    } catch(error) {
        toast({ variant: 'destructive', title: 'Erro ao excluir transação' });
    }
  };
  
  const handlePayment = async (amount: number, accountId: string) => {
    if (!card) return;
    try {
      await api.post(`/cards/${cardId}/pay`, { amount, accountId });
      await fetchData();
      toast({ title: 'Pagamento Registrado!', description: `O pagamento da fatura do cartão ${card.nome} foi registrado.` });
      setIsPayDialogOpen(false);
    } catch(error: any) {
       const message = error.response?.data?.message || 'Não foi possível registrar o pagamento.';
       toast({ variant: 'destructive', title: 'Erro ao registrar pagamento', description: message });
    }
  };

  const filteredTransactions = useMemo(() => {
    let results = invoiceTransactions;
    if (filters.text) results = results.filter(t => t.descricao.toLowerCase().includes(filters.text!.toLowerCase()));
    if (filters.categories.length > 0) results = results.filter(t => filters.categories.includes(t.categoria));
    return results;
  }, [invoiceTransactions, filters]);

  if (isLoading || !card) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
               <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold font-headline">{card.nome}</h1>
              <p className="text-muted-foreground">Fatura e transações do cartão.</p>
            </div>
        </div>
        <div className="flex w-full sm:w-auto items-center gap-2">
            <Button onClick={() => openForm()} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Despesa
            </Button>
        </div>
      </div>
      
      <FaturaSummaryCard
        card={card}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        faturaTotal={faturaTotal}
        saldoDevedor={saldoDevedor}
        onPayBill={() => setIsPayDialogOpen(true)}
      />
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold font-headline">Transações da Fatura</h2>
             <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" />
                        Filtrar
                    </Button>
                </SheetTrigger>
                <SheetContent className="w-full sm:max-w-sm">
                    <TransactionFilters 
                        accounts={[]} cards={[]} categories={categories}
                        currentFilters={filters} onFilterChange={setFilters}
                    />
                </SheetContent>
            </Sheet>
        </div>
         {filteredTransactions.filter(t => t.tipo === 'despesa').length === 0 ? (
             <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <Receipt className="h-16 w-16 text-muted-foreground" />
                <h3 className='text-lg font-semibold'>Nenhuma despesa nesta fatura</h3>
                <p className="text-muted-foreground">Não há transações de despesa para este mês. <br/> Que tal adicionar uma agora?</p>
                <Button variant="outline" size="sm" onClick={() => openForm()}>
                    Adicionar Despesa
                </Button>
            </div>
         ) : (
            <>
                <div className="block md:hidden">
                    <TransactionMobileList
                        data={filteredTransactions.filter(t => t.tipo === 'despesa')} 
                        onEdit={handleOpenForm}
                        onDelete={handleDeleteTransaction}
                        onTogglePaidStatus={() => {}}
                        accounts={accounts}
                        cards={[card]}
                    />
                </div>
                <div className="hidden md:block">
                    <TransactionsTable 
                        data={filteredTransactions.filter(t => t.tipo === 'despesa')} 
                        onEdit={handleOpenForm}
                        onDelete={handleDeleteTransaction}
                        onTogglePaidStatus={() => {}}
                        accounts={accounts}
                        cards={[card]}
                    />
                </div>
            </>
         )}
      </div>

        {/* Melhoria: Seção de Lançamentos Futuros */}
        {futureInstallments.length > 0 && (
            <Card>
                <CardHeader>
                    <CardTitle>Lançamentos Futuros</CardTitle>
                    <CardDescription>Estas são as parcelas que entrarão nas próximas faturas.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="block md:hidden">
                        <TransactionMobileList data={futureInstallments} onEdit={handleOpenForm} onDelete={handleDeleteTransaction} onTogglePaidStatus={() => {}} accounts={accounts} cards={[card]} />
                    </div>
                    <div className="hidden md:block">
                        <TransactionsTable data={futureInstallments} onEdit={handleOpenForm} onDelete={handleDeleteTransaction} onTogglePaidStatus={() => {}} accounts={accounts} cards={[card]} />
                    </div>
                </CardContent>
            </Card>
        )}

       <PayBillDialog
        isOpen={isPayDialogOpen}
        onClose={() => setIsPayDialogOpen(false)}
        onConfirm={handlePayment}
        accounts={accounts.filter(a => a.tipo === 'corrente')}
        cardName={card.nome}
        faturaTotal={saldoDevedor}
      />
    </div>
  );
}
