// src/components/dashboard/mission-cards/account-book-card.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Eye, EyeOff, ChevronDown, ChevronUp, TrendingDown, TrendingUp, CircleHelp, ChevronLeft, ChevronRight } from "lucide-react";
import type { Account, Transaction } from "@/lib/definitions";
import { useMemo, useState, useCallback, useEffect } from 'react';
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import api from "@/lib/api";
import { useGamificationMode } from "@/hooks/use-gamification-mode";
import { getGamificationCopy } from "@/lib/gamification-copy";

interface AccountBookCardProps {
    accounts: Account[];
    transactions: Transaction[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);


const MetricCard = ({
    title,
    value,
    icon: Icon,
    colorClass,
    hideValue,
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    colorClass: string;
    hideValue?: boolean;
}) => (
    <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-2">
            <Icon className={cn("h-5 w-5", colorClass)} />
            <span className="text-sm font-semibold">{title}</span>
        </div>
        <span className={cn("text-base font-bold", colorClass)}>
            {hideValue ? 'R$ ••••••' : formatCurrency(value)}
        </span>
    </div>
);


export function AccountBookCard({ accounts, transactions }: AccountBookCardProps) {
    const [showBalance, setShowBalance] = useState(true);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [monthlyTransactions, setMonthlyTransactions] = useState<Transaction[]>(transactions);

    const fetchTransactionsForMonth = useCallback(async (date: Date) => {
        setIsLoading(true);
        try {
            const month = format(date, 'yyyy-MM');
            const response = await api.get(`/transactions?month=${month}&includePending=true`);
            setMonthlyTransactions(response.data);
        } catch (error) {
            console.error("Erro ao buscar transações:", error);
            setMonthlyTransactions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // A prop `transactions` inicial é para o mês atual, então não precisamos buscar na montagem inicial.
        // A busca só é necessária quando `selectedDate` muda.
        if (format(selectedDate, 'yyyy-MM') !== format(new Date(), 'yyyy-MM')) {
            fetchTransactionsForMonth(selectedDate);
        } else {
            setMonthlyTransactions(transactions);
        }
    }, [selectedDate, transactions, fetchTransactionsForMonth]);


    const { totalBalance, received, paid, toReceive, toPay, monthBalance, projectedBalance } = useMemo(() => {
         if (!monthlyTransactions) { // Adiciona a guarda para evitar erro de 'filter' em undefined
            return { totalBalance: 0, received: 0, paid: 0, toReceive: 0, toPay: 0, monthBalance: 0, projectedBalance: 0 };
        }
        
        const totalBalance = accounts.reduce((acc, account) => acc + Number(account.saldo), 0);
        
        const received = monthlyTransactions.filter(t => t.tipo === 'receita' && t.pago).reduce((sum, t) => sum + Number(t.valor), 0);
        const paid = monthlyTransactions.filter(t => t.tipo === 'despesa' && t.pago).reduce((sum, t) => sum + Number(t.valor), 0);
        const toReceive = monthlyTransactions.filter(t => t.tipo === 'receita' && !t.pago).reduce((sum, t) => sum + Number(t.valor), 0);
        const toPay = monthlyTransactions.filter(t => t.tipo === 'despesa' && !t.pago).reduce((sum, t) => sum + Number(t.valor), 0);
        
        const monthBalance = received - paid;
        const projectedBalance = (received + toReceive) - (paid + toPay);

        return { totalBalance, received, paid, toReceive, toPay, monthBalance, projectedBalance };
    }, [accounts, monthlyTransactions]);

    const { mode } = useGamificationMode();
    const cardCopy = getGamificationCopy('accountBook', mode);

    return (
        <Card className="shadow-md h-full transition-all group-hover:shadow-xl group-hover:border-primary/50 flex flex-col">
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg">
                            <BookOpen className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <CardTitle className="font-headline text-xl">{cardCopy.title}</CardTitle>
                             <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDate(prev => subMonths(prev, 1))}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <CardDescription className="w-28 text-center capitalize">{format(selectedDate, 'MMMM yyyy', { locale: ptBR })}</CardDescription>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedDate(prev => addMonths(prev, 1))}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow flex flex-col">
                <div className="flex-grow space-y-4">
                    <div className="text-center">
                        <p className="text-xs text-muted-foreground font-semibold">{cardCopy.highlightLabel}</p>
                        <div className="flex items-center justify-center gap-1">
                            <p className="text-3xl font-bold">{showBalance ? formatCurrency(totalBalance) : 'R$ ••••••'}</p>
                            <button type="button" onClick={(e) => {e.preventDefault(); setShowBalance(!showBalance);}}>
                                {showBalance ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex justify-between items-center text-center border-t pt-4">
                        <div>
                            <p className="text-xs text-muted-foreground font-semibold">Resultado do Mês</p>
                            <p className={cn("text-lg font-bold", monthBalance >= 0 ? 'text-green-500' : 'text-red-500')}>
                                {showBalance ? formatCurrency(monthBalance) : 'R$ ••••••'}
                            </p>
                        </div>
                        <div>
                            <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1">
                                {cardCopy.projectedLabel}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <CircleHelp className="h-3 w-3 cursor-help"/>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <div>Considera contas pendentes.</div>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                            <p className={cn("text-lg font-bold", projectedBalance >= 0 ? 'text-primary' : 'text-destructive')}>
                                {showBalance ? formatCurrency(projectedBalance) : 'R$ ••••••'}
                            </p>
                        </div>
                    </div>
                </div>

                <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                    <CollapsibleContent className="space-y-2 pt-4">
                        <MetricCard title="Recebido" value={received} icon={TrendingUp} colorClass="text-green-500" hideValue={!showBalance} />
                        <MetricCard title="Pago" value={paid} icon={TrendingDown} colorClass="text-red-500" hideValue={!showBalance} />
                        <MetricCard title="A Receber" value={toReceive} icon={TrendingUp} colorClass="text-yellow-500" hideValue={!showBalance} />
                        <MetricCard title="A Pagar" value={toPay} icon={TrendingDown} colorClass="text-orange-500" hideValue={!showBalance} />
                    </CollapsibleContent>
                    <div className="flex justify-center mt-2">
                        <CollapsibleTrigger asChild>
                           <Button variant="ghost" size="sm">
                              {isExpanded ? 'Ver Menos' : 'Ver Detalhes'}
                              {isExpanded ? <ChevronUp className="h-4 w-4 ml-2"/> : <ChevronDown className="h-4 w-4 ml-2"/>}
                           </Button>
                        </CollapsibleTrigger>
                    </div>
                </Collapsible>
            </CardContent>
        </Card>
    );
}
