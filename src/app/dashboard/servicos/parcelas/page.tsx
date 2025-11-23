'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useToast } from '@/hooks/use-toast';
import { Calendar, CreditCard, TrendingUp, Package, ArrowRight, Filter, X, MoreVertical, Ban, FastForward, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import api from '@/lib/api';
import { handleApiError } from '@/lib/error-handler';

interface FutureTransaction {
  id: string;
  descricao: string;
  valor: number;
  data: string;
  cardId?: string;
  categoryId?: string;
  installmentNumber?: number;
  totalInstallments?: number;
  isRecurring: boolean;
  card?: {
    id: string;
    nome: string;
    bandeira: string;
  };
  categoria?: {
    id: string;
    nome: string;
    icone?: string;
    cor?: string;
  };
}

interface CardSummary {
  card: {
    id: string;
    nome: string;
    bandeira: string;
  };
  total: number;
  count: number;
}

interface MonthSummary {
  month: string;
  date: string;
  total: number;
  transactions: FutureTransaction[];
  byCard: CardSummary[];
}

interface SummaryData {
  summary: MonthSummary[];
  totalTransactions: number;
  monthsAhead: number;
}

export default function ParcelasPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [data, setData] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [monthsAhead, setMonthsAhead] = useState('6');
  const [selectedCard, setSelectedCard] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cards, setCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  // Action states
  const [transactionToCancel, setTransactionToCancel] = useState<FutureTransaction | null>(null);
  const [transactionToAnticipate, setTransactionToAnticipate] = useState<FutureTransaction | null>(null);

  useEffect(() => {
    fetchData();
    fetchCards();
    fetchCategories();
  }, [monthsAhead]);

  const fetchCards = async () => {
    try {
      const response = await api.get('/cards');
      setCards(response.data);
    } catch (error) {
      console.error('Erro ao buscar cartões', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get('/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Erro ao buscar categorias', error);
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/transactions/future-installments/summary?months=${monthsAhead}`);
      setData(response.data);
    } catch (error) {
      handleApiError(error, toast, 'Erro ao carregar parcelas futuras');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSeries = async () => {
    if (!transactionToCancel) return;
    try {
      await api.post(`/transactions/installments/${transactionToCancel.id}/cancel-series`);
      toast({ title: 'Série cancelada', description: 'As parcelas futuras foram removidas.' });
      fetchData();
    } catch (error) {
      handleApiError(error, toast, 'Erro ao cancelar série');
    } finally {
      setTransactionToCancel(null);
    }
  };

  const handleAnticipate = async () => {
    if (!transactionToAnticipate) return;
    try {
      await api.post(`/transactions/installments/${transactionToAnticipate.id}/pay-early`);
      toast({ title: 'Parcela antecipada', description: 'A parcela foi movida para a data de hoje.' });
      fetchData();
    } catch (error) {
      handleApiError(error, toast, 'Erro ao antecipar parcela');
    } finally {
      setTransactionToAnticipate(null);
    }
  };

  const filteredData = data ? {
    ...data,
    summary: data.summary.map(month => {
      const filteredTransactions = month.transactions.filter(t => {
        const matchesCard = selectedCard === 'all' || t.cardId === selectedCard;
        const matchesCategory = selectedCategory === 'all' || t.categoryId === selectedCategory;
        return matchesCard && matchesCategory;
      });

      return {
        ...month,
        transactions: filteredTransactions,
        // Recalculate totals based on filtered transactions
        total: filteredTransactions.reduce((sum, t) => sum + Number(t.valor), 0),
        byCard: month.byCard // Keep original byCard summary or filter it too? Let's keep it simple for now or filter if needed.
          .filter(c => selectedCard === 'all' || c.card.id === selectedCard)
      };
    }).filter(month => month.transactions.length > 0)
  } : null;

  if (isLoading) {
    return <LoadingScreen />;
  }

  const totalTransactions = filteredData?.summary.reduce((sum, m) => sum + m.transactions.length, 0) || 0;
  const totalAmount = filteredData?.summary.reduce((sum, m) => sum + m.total, 0) || 0;
  const totalMonths = filteredData?.summary.length || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Parcelas Futuras
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão completa dos seus compromissos futuros
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Parcelas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Valor Total Projetado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              R$ {totalAmount.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Meses com Parcelas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMonths}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Período de Visão</label>
              <Select value={monthsAhead} onValueChange={setMonthsAhead}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Próximos 3 meses</SelectItem>
                  <SelectItem value="6">Próximos 6 meses</SelectItem>
                  <SelectItem value="12">Próximos 12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Cartão</label>
              <Select value={selectedCard} onValueChange={setSelectedCard}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cartões</SelectItem>
                  {cards.map(card => (
                    <SelectItem key={card.id} value={card.id}>{card.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Categoria</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Groups */}
      {filteredData && filteredData.summary.length > 0 ? (
        <div className="space-y-6">
          {filteredData.summary.map((month) => (
            <Collapsible key={month.month} defaultOpen={true}>
              <Card className="overflow-hidden">
                <CollapsibleTrigger asChild>
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 cursor-pointer hover:bg-primary/10 transition-colors group">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          {format(parseISO(month.date), 'MMMM yyyy', { locale: ptBR })}
                          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                        </CardTitle>
                        <CardDescription className="mt-1">
                          {month.transactions.length} {month.transactions.length === 1 ? 'parcela' : 'parcelas'}
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Total do mês</div>
                        <div className="text-2xl font-bold text-red-600">R$ {month.total.toFixed(2)}</div>
                      </div>
                    </div>

                    {/* Cards breakdown */}
                    {month.byCard.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {month.byCard.map(cardSum => (
                          <Badge key={cardSum.card.id} variant="outline" className="px-3 py-1 bg-background/50">
                            <CreditCard className="h-3 w-3 mr-1" />
                            {cardSum.card.nome}: R$ {cardSum.total.toFixed(2)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {month.transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 cursor-pointer" onClick={() => {
                              if (!transaction.isRecurring && transaction.cardId) {
                                router.push(`/dashboard/fatura/${transaction.cardId}`);
                              }
                            }}>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{transaction.descricao}</span>
                                {transaction.isRecurring && (
                                  <Badge variant="secondary" className="text-xs">Recorrente</Badge>
                                )}
                                {transaction.totalInstallments && (
                                  <Badge variant="outline" className="text-xs">
                                    {transaction.installmentNumber}/{transaction.totalInstallments}
                                  </Badge>
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2 mt-2 text-sm text-muted-foreground">
                                {transaction.card && (
                                  <span className="flex items-center gap-1">
                                    <CreditCard className="h-3 w-3" />
                                    {transaction.card.nome}
                                  </span>
                                )}
                                {transaction.categoria && (
                                  <span className="flex items-center gap-1">
                                    <Package className="h-3 w-3" />
                                    {transaction.categoria.nome}
                                  </span>
                                )}
                                <span>{format(parseISO(transaction.data), 'dd/MM/yyyy')}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-lg font-bold text-red-600">
                                  R$ {Number(transaction.valor).toFixed(2)}
                                </div>
                              </div>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {transaction.isRecurring && (
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600 cursor-pointer"
                                      onClick={() => setTransactionToCancel(transaction)}
                                    >
                                      <Ban className="mr-2 h-4 w-4" />
                                      Cancelar Série
                                    </DropdownMenuItem>
                                  )}
                                  {transaction.installmentNumber && (
                                    <DropdownMenuItem
                                      className="cursor-pointer"
                                      onClick={() => setTransactionToAnticipate(transaction)}
                                    >
                                      <FastForward className="mr-2 h-4 w-4" />
                                      Antecipar Parcela
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      ) : (
        <Card className="p-12">
          <div className="text-center">
            <Package className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma parcela futura encontrada</h3>
            <p className="text-muted-foreground">
              Você não possui parcelas ou recorrências programadas para os próximos meses.
            </p>
          </div>
        </Card>
      )}

      <AlertDialog open={!!transactionToCancel} onOpenChange={(open) => !open && setTransactionToCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar Série Recorrente?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá remover todas as transações futuras desta série ({transactionToCancel?.descricao}). As transações passadas não serão afetadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancelSeries} className="bg-red-600 hover:bg-red-700">
              Confirmar Cancelamento
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!transactionToAnticipate} onOpenChange={(open) => !open && setTransactionToAnticipate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Antecipar Parcela?</AlertDialogTitle>
            <AlertDialogDescription>
              A parcela {transactionToAnticipate?.installmentNumber}/{transactionToAnticipate?.totalInstallments} de {transactionToAnticipate?.descricao} será movida para a data de hoje e entrará na sua fatura atual.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={handleAnticipate}>
              Confirmar Antecipação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
