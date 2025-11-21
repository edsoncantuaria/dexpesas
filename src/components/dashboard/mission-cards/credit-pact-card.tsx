// src/components/dashboard/mission-cards/credit-pact-card.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShieldHalf, CreditCard, AlertCircle, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import type { Card as CardType } from "@/lib/definitions";
import { useMemo } from 'react';
import Link from 'next/link';
import { setDate, isBefore, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useGamificationMode } from "@/hooks/use-gamification-mode";
import { getGamificationCopy } from "@/lib/gamification-copy";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { usePrivacy } from '@/contexts/PrivacyContext';

interface CreditPactCardProps {
    cards: CardType[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function CreditPactCard({ cards }: CreditPactCardProps) {
    const { mode, isClassic } = useGamificationMode();
    const copy = getGamificationCopy('creditPact', mode);
    const { showBalance, togglePrivacy } = usePrivacy();

    const processedCards = useMemo(() => {
        if (cards.length === 0) return [];

        const now = new Date();
        return cards.map(card => {
            let dueDate = setDate(now, card.diaVencimento);
            if (isBefore(dueDate, now)) {
                dueDate = setDate(new Date(now.getFullYear(), now.getMonth() + 1, 1), card.diaVencimento);
            }
            const daysUntilDue = differenceInDays(dueDate, now);
            const limit = Number(card.limite || 0);
            const current = Number(card.currentInvoiceAmount || 0);
            const available = limit - current;
            const percentage = limit > 0 ? (current / limit) * 100 : 0;

            return {
                ...card,
                dueDate,
                daysUntilDue,
                availableLimit: available,
                percentage
            };
        }).sort((a, b) => a.daysUntilDue - b.daysUntilDue).slice(0, 3);

    }, [cards]);

    return (
        <Link href="/dashboard/cartoes" className="group block h-full">
            <Card className={cn(
                "h-full transition-all duration-300 flex flex-col overflow-hidden border-0 ring-1 ring-border/50",
                "hover:shadow-xl hover:ring-primary/20 hover:scale-[1.01]",
                !isClassic ? "bg-gradient-to-br from-rose-50/50 to-orange-50/30 dark:from-rose-950/30 dark:to-orange-900/10" : "bg-card"
            )}>
                <CardHeader className="pb-2">
                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "p-3.5 rounded-xl shadow-sm transition-colors",
                            isClassic
                                ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                                : "bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/20"
                        )}>
                            {isClassic ? <CreditCard className="h-6 w-6" /> : <ShieldHalf className="h-6 w-6" />}
                        </div>
                        <div className="flex-1">
                            <CardTitle className="font-headline text-lg tracking-tight">{copy.title}</CardTitle>
                            <CardDescription className="text-xs font-medium opacity-80">{copy.description}</CardDescription>
                        </div>
                        {processedCards.length > 0 && (
                            <button
                                type="button"
                                onClick={(e) => { e.preventDefault(); togglePrivacy(); }}
                                className="text-muted-foreground hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-background/50"
                            >
                                {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-5 flex-grow pt-4">
                    {processedCards.length > 0 ? (
                        processedCards.map((card, index) => (
                            <motion.div
                                key={card.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className={cn(
                                    "space-y-3 group/item",
                                    index !== processedCards.length - 1 && "border-b border-border/50 pb-4"
                                )}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-sm text-foreground/90 group-hover/item:text-primary transition-colors">
                                                {card.nome}
                                            </h4>
                                            {card.daysUntilDue <= 5 && (
                                                <Badge variant="destructive" className="h-4 px-1 text-[9px] uppercase tracking-wider">
                                                    {card.daysUntilDue} dias
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Fatura: <span className="font-medium text-foreground">{showBalance ? formatCurrency(card.currentInvoiceAmount) : 'R$ ••••'}</span>
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Disponível</p>
                                        <p className={cn(
                                            "text-sm font-bold",
                                            card.availableLimit < 0 ? "text-destructive" : "text-emerald-600"
                                        )}>
                                            {showBalance ? formatCurrency(card.availableLimit) : 'R$ ••••'}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <div className="relative h-1.5 bg-muted/50 rounded-full overflow-hidden">
                                        <motion.div
                                            className={cn(
                                                "h-full rounded-full",
                                                card.percentage > 90 ? "bg-destructive" :
                                                    card.percentage > 70 ? "bg-orange-500" : "bg-blue-500"
                                            )}
                                            initial={{ width: 0 }}
                                            animate={{ width: showBalance ? `${Math.min(card.percentage, 100)}%` : '50%' }}
                                            transition={{ duration: 1, ease: "easeOut" }}
                                        />
                                    </div>
                                    {card.percentage > 90 ? (
                                        <p className="text-[10px] text-destructive flex items-center gap-1 font-medium animate-pulse">
                                            <AlertCircle className="h-3 w-3" />
                                            Limite crítico
                                        </p>
                                    ) : (
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                            Situação controlada
                                        </p>
                                    )}
                                </div>
                            </motion.div>
                        ))
                    ) : (
                        <div className="text-center text-muted-foreground pt-8 flex flex-col items-center gap-3">
                            <div className="p-4 rounded-full bg-muted/50">
                                <CreditCard className="h-6 w-6 opacity-40" />
                            </div>
                            <p className="text-sm">{copy.emptyState}</p>
                        </div>
                    )}
                </CardContent>
                <div className="p-5 pt-0 mt-auto">
                    <Button
                        variant="ghost"
                        className="w-full justify-between group/btn hover:bg-primary/5 hover:text-primary"
                        onClick={(e) => {
                            e.preventDefault();
                            // TODO: Implementar navegação para criação de cartão se necessário
                        }}
                    >
                        <span className="font-semibold">{copy.buttonLabel}</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Button>
                </div>
            </Card>
        </Link >
    );
}
