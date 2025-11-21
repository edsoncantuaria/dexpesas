// src/components/dashboard/mission-cards/account-book-card.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Eye, EyeOff, ChevronDown, ChevronUp, TrendingDown, TrendingUp, CircleHelp, ChevronLeft, ChevronRight, Wallet, ArrowRight } from "lucide-react";
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
import { motion, AnimatePresence } from "framer-motion";
import { usePrivacy } from '@/contexts/PrivacyContext';

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
    delay = 0
}: {
    title: string;
    value: number;
    icon: React.ElementType;
    colorClass: string;
    hideValue?: boolean;
    delay?: number;
}) => (
    <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay }}
        className="flex items-center justify-between rounded-xl border bg-card/50 p-3 hover:bg-accent/50 transition-colors"
    >
        <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-lg bg-background shadow-sm", colorClass.replace('text-', 'bg-').replace('500', '100 dark:bg-opacity-20'))}>
                <Icon className={cn("h-4 w-4", colorClass)} />
            </div>
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
        </div>
        <span className={cn("text-base font-bold tracking-tight", colorClass)}>
            {hideValue ? 'R$ ••••••' : formatCurrency(value)}
        </span>
    </motion.div>
);


export function AccountBookCard({ accounts, transactions }: AccountBookCardProps) {
    const { showBalance, togglePrivacy } = usePrivacy();
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
        if (format(selectedDate, 'yyyy-MM') !== format(new Date(), 'yyyy-MM')) {
            fetchTransactionsForMonth(selectedDate);
        } else {
            setMonthlyTransactions(transactions);
        }
    }, [selectedDate, transactions, fetchTransactionsForMonth]);


    const { totalBalance, received, paid, toReceive, toPay, monthBalance, projectedBalance } = useMemo(() => {
        if (!monthlyTransactions) {
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

    const { mode, isClassic } = useGamificationMode();
    const cardCopy = getGamificationCopy('accountBook', mode);

    return (
        <Card className={cn(
            "h-full transition-all duration-300 flex flex-col overflow-hidden border-0 ring-1 ring-border/50",
            "hover:shadow-xl hover:ring-primary/20 hover:scale-[1.01]",
            !isClassic ? "bg-gradient-to-br from-amber-50/50 to-yellow-50/30 dark:from-amber-950/30 dark:to-yellow-900/10" : "bg-card"
        )}>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-3.5 rounded-xl shadow-sm transition-colors",
                            isClassic
                                ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                                : "bg-gradient-to-br from-amber-400 to-yellow-600 text-white shadow-amber-500/20"
                        )}>
                            {isClassic ? <Wallet className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
                        </div>
                        <div>
                            <CardTitle className="font-headline text-lg tracking-tight">{cardCopy.title}</CardTitle>
                            <div className="flex items-center gap-1 mt-1">
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setSelectedDate(prev => subMonths(prev, 1))}>
                                    <ChevronLeft className="h-3 w-3" />
                                </Button>
                                <CardDescription className="w-24 text-center capitalize text-xs font-medium">{format(selectedDate, 'MMM yyyy', { locale: ptBR })}</CardDescription>
                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setSelectedDate(prev => addMonths(prev, 1))}>
                                    <ChevronRight className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 flex-grow flex flex-col pt-4">
                <div className="flex-grow space-y-6">
                    <div className="text-center space-y-1">
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{cardCopy.highlightLabel}</p>
                        <div className="flex items-center justify-center gap-2">
                            <motion.p
                                key={totalBalance}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-3xl font-bold tracking-tighter"
                            >
                                {showBalance ? formatCurrency(totalBalance) : 'R$ ••••••'}
                            </motion.p>
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); togglePrivacy(); }}
                                className="text-muted-foreground hover:text-primary transition-colors"
                            >
                                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-border/50 pt-4">
                        <div className="text-center p-3 rounded-xl bg-background/50 hover:bg-background transition-colors">
                            <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Resultado do Mês</p>
                            <p className={cn("text-lg font-bold", monthBalance >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                                {showBalance ? formatCurrency(monthBalance) : 'R$ ••••••'}
                            </p>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-background/50 hover:bg-background transition-colors">
                            <div className="text-[10px] text-muted-foreground font-semibold uppercase mb-1 flex items-center justify-center gap-1">
                                {cardCopy.projectedLabel}
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <CircleHelp className="h-3 w-3 cursor-help opacity-50 hover:opacity-100" />
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
                    <AnimatePresence>
                        {isExpanded && (
                            <CollapsibleContent forceMount>
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="space-y-2 pt-2 overflow-hidden"
                                >
                                    <MetricCard title="Recebido" value={received} icon={TrendingUp} colorClass="text-emerald-500" hideValue={!showBalance} delay={0.1} />
                                    <MetricCard title="Pago" value={paid} icon={TrendingDown} colorClass="text-red-500" hideValue={!showBalance} delay={0.2} />
                                    <MetricCard title="A Receber" value={toReceive} icon={TrendingUp} colorClass="text-amber-500" hideValue={!showBalance} delay={0.3} />
                                    <MetricCard title="A Pagar" value={toPay} icon={TrendingDown} colorClass="text-orange-500" hideValue={!showBalance} delay={0.4} />
                                </motion.div>
                            </CollapsibleContent>
                        )}
                    </AnimatePresence>
                    <div className="flex justify-center mt-4">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full group hover:bg-primary/5 hover:text-primary">
                                <span className="font-medium">{isExpanded ? 'Ver Menos' : 'Ver Detalhes'}</span>
                                <ChevronDown className={cn("h-4 w-4 ml-2 transition-transform duration-200", isExpanded && "rotate-180")} />
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                </Collapsible>
            </CardContent>
        </Card>
    );
}
