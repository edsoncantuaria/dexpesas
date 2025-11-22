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
import { Calendar, CreditCard, TrendingUp, Package, ArrowRight, Filter, X } from 'lucide-react';
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
  const [cards, setCards] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
    fetchCards();
  }, [monthsAhead]);

  const fetchCards = async () => {
    try {
      const response = await api.get('/cards');
      setCards(response.data);
    } catch (error) {
      console.error('Erro ao buscar cartões', error);
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

  const filteredData = data ? {
    ...data,
    summary: data.summary.map(month => ({
      ...month,
      transactions: selectedCard === 'all'
        ? month.transactions
        : month.transactions.filter(t => t.cardId === selectedCard),
      byCard: selectedCard === 'all'
        ? month.byCard
        : month.byCard.filter(c => c.card.id === selectedCard),
      total: selectedCard === 'all'
        ? month.total
        : month.transactions.filter(t => t.cardId === selectedCard).reduce((sum, t) => sum + Number(t.valor), 0)
    })).filter(month => month.transactions.length > 0)
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
          </div>
        </CardContent>
      </Card>

      {/* Monthly Groups */}
      {filteredData && filteredData.summary.length > 0 ? (
        <div className="space-y-6">
          {filteredData.summary.map((month) => (
            <Card key={month.month} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      {format(parseISO(month.date), 'MMMM yyyy', { locale: ptBR })}
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
                      <Badge key={cardSum.card.id} variant="outline" className="px-3 py-1">
                        <CreditCard className="h-3 w-3 mr-1" />
                        {cardSum.card.nome}: R$ {cardSum.total.toFixed(2)}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardHeader>

              <CardContent className="p-0">
                <div className="divide-y">
                  {month.transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => {
                        if (!transaction.isRecurring && transaction.cardId) {
                          router.push(`/dashboard/fatura/${transaction.cardId}`);
                        }
                      }}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
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

                        <div className="text-right">
                          <div className="text-lg font-bold text-red-600">
                            R$ {Number(transaction.valor).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
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
    </div>
  );
}
