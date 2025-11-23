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

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function FutureInstallmentsWidget() {
    const [transactions, setTransactions] = useState<FutureTransaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isOpen, setIsOpen] = useState(false);

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
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0 pb-4">
                    <Skeleton className="h-5 w-40" />
                </CardHeader>
                <CardContent className="p-0 space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                            <Skeleton className="h-4 w-20" />
                        </div>
                    ))}
                </CardContent>
            </Card>
        );
    }

    if (transactions.length === 0) {
        return null;
    }

    return (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 pt-0 pb-2">
                    <div className="flex items-center justify-between">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent hover:text-primary flex items-center gap-2 h-auto font-semibold text-base text-foreground">
                                <Calendar className="h-4 w-4 text-primary" />
                                Próximos Lançamentos
                                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen ? "transform rotate-180" : "")} />
                            </Button>
                        </CollapsibleTrigger>

                        {isOpen && (
                            <Link
                                href="/dashboard/servicos/parcelas"
                                className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
                            >
                                Ver todos <ArrowRight className="h-3 w-3" />
                            </Link>
                        )}
                    </div>
                </CardHeader>
                <CollapsibleContent className="animate-collapsible-down">
                    <CardContent className="p-0 pt-2">
                        <div className="space-y-3">
                            {transactions.map((t) => (
                                <div
                                    key={t.id}
                                    className="flex items-center justify-between p-3 rounded-xl bg-card border border-border/50 hover:border-primary/20 hover:bg-accent/50 transition-all group"
                                >
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary">
                                            <CreditCard className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-sm truncate text-foreground" title={t.descricao}>
                                                {t.descricao}
                                            </div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                <span className="font-medium text-foreground/80">
                                                    {format(parseISO(t.data), 'dd MMM', { locale: ptBR })}
                                                </span>
                                                {t.installmentNumber && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                                        <span>{t.installmentNumber}/{t.totalInstallments}</span>
                                                    </>
                                                )}
                                                {t.card && (
                                                    <>
                                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                                        <span className="truncate max-w-[80px]">{t.card.nome}</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="font-bold text-sm text-foreground whitespace-nowrap pl-2">
                                        R$ {Number(t.valor).toFixed(2)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Card>
        </Collapsible>
    );
}
