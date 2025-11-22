'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, ArrowRight, CreditCard } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';

interface FutureTransaction {
    id: string;
    descricao: string;
    valor: number;
    data: string;
    cardId?: string;
    installmentNumber?: number;
    totalInstallments?: number;
    isRecurring: boolean;
    card?: {
        nome: string;
    };
}

export function FutureInstallmentsWidget() {
    const [transactions, setTransactions] = useState<FutureTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetching 3 months ahead to ensure we have enough upcoming items
                const response = await api.get('/transactions/future-installments/summary?months=3');
                const summary = response.data.summary || [];

                // Flatten and sort transactions
                const allTransactions = summary.flatMap((month: any) => month.transactions);
                const sorted = allTransactions.sort((a: FutureTransaction, b: FutureTransaction) =>
                    new Date(a.data).getTime() - new Date(b.data).getTime()
                );

                setTransactions(sorted.slice(0, 3));
            } catch (error) {
                console.error('Erro ao carregar parcelas futuras:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Próximos Lançamentos
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="space-y-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                            <Skeleton className="h-4 w-16" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (transactions.length === 0) {
        return null; // Don't show if empty
    }

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Próximos Lançamentos
                    </CardTitle>
                    <Link href="/dashboard/servicos/parcelas" className="text-xs text-primary hover:underline flex items-center">
                        Ver tudo <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                </div>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="space-y-4">
                    {transactions.map((t) => (
                        <div key={t.id} className="flex items-center justify-between group">
                            <div className="space-y-0.5">
                                <div className="font-medium text-sm truncate max-w-[180px]" title={t.descricao}>
                                    {t.descricao}
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1">
                                    {t.card && (
                                        <span className="flex items-center">
                                            <CreditCard className="h-3 w-3 mr-1" />
                                            {t.card.nome}
                                        </span>
                                    )}
                                    <span>• {format(parseISO(t.data), 'dd/MM', { locale: ptBR })}</span>
                                    {t.installmentNumber && (
                                        <span>• {t.installmentNumber}/{t.totalInstallments}</span>
                                    )}
                                </div>
                            </div>
                            <div className="font-bold text-sm text-red-600">
                                R$ {Number(t.valor).toFixed(2)}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-4 pt-3 border-t">
                    <Button variant="ghost" size="sm" className="w-full text-xs h-8" asChild>
                        <Link href="/dashboard/servicos/parcelas">
                            Gerenciar Parcelas Futuras
                        </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
