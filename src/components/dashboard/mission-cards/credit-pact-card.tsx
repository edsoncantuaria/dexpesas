// src/components/dashboard/mission-cards/credit-pact-card.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldHalf } from "lucide-react";
import type { Card as CardType } from "@/lib/definitions";
import { useMemo } from 'react';
import Link from 'next/link';
import { setDate, isBefore, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { useGamificationMode } from "@/hooks/use-gamification-mode";
import { getGamificationCopy } from "@/lib/gamification-copy";

interface CreditPactCardProps {
    cards: CardType[];
}

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function CreditPactCard({ cards }: CreditPactCardProps) {
    
    const cardToDisplay = useMemo(() => {
        if (cards.length === 0) return null;

        // Encontra o cartão com a data de vencimento mais próxima no futuro
        const now = new Date();
        return cards.map(card => {
            let dueDate = setDate(now, card.diaVencimento);
            // Se a data de vencimento deste mês já passou, pegue a do próximo mês
            if (isBefore(dueDate, now)) {
                dueDate = setDate(new Date(now.getFullYear(), now.getMonth() + 1, 1), card.diaVencimento);
            }
            const daysUntilDue = differenceInDays(dueDate, now);
            return { ...card, dueDate, daysUntilDue };
        }).sort((a, b) => a.daysUntilDue - b.daysUntilDue)[0];

    }, [cards]);

    const availableLimit = cardToDisplay
        ? Number(cardToDisplay.availableLimit ?? (Number(cardToDisplay.limite) - Number(cardToDisplay.currentInvoiceAmount ?? 0)))
        : 0;
    const usagePercentage = cardToDisplay
        ? (Number(cardToDisplay.currentInvoiceAmount ?? 0) / Number(cardToDisplay.limite || 1)) * 100
        : 0;

    const { mode } = useGamificationMode();
    const copy = getGamificationCopy('creditPact', mode);

    return (
        <Link href="/dashboard/cartoes" className="group">
            <Card className="shadow-md h-full transition-all group-hover:shadow-xl group-hover:border-primary/50">
                 <CardHeader>
                    <div className="flex items-center gap-3">
                       <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-lg">
                         <ShieldHalf className="h-6 w-6 text-red-600 dark:text-red-400" />
                       </div>
                        <div>
                            <CardTitle className="font-headline text-xl">{copy.title}</CardTitle>
                            <CardDescription>{copy.description}</CardDescription>
                            {usagePercentage > 85 && (
                                <Badge variant="destructive" className="mt-1">
                                    Limite crítico
                                </Badge>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {cardToDisplay ? (
                        <>
                            <div className="flex justify-between items-baseline border-b pb-3">
                                <h4 className="font-semibold">{cardToDisplay.nome}</h4>
                                {cardToDisplay.dueDate && (
                                    <p className="text-sm text-muted-foreground">Vence em {cardToDisplay.daysUntilDue} dias</p>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div>
                                    <p className="text-muted-foreground">Fatura Atual</p>
                                    <p className="font-bold text-destructive text-lg">{formatCurrency(cardToDisplay.currentInvoiceAmount ?? 0)}</p>
                                    {usagePercentage > 85 && (
                                        <p className="text-xs text-destructive">Você já usou {usagePercentage.toFixed(0)}% do limite.</p>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-muted-foreground">Limite Disponível</p>
                                    <p className="font-bold text-green-500 text-lg">{formatCurrency(availableLimit)}</p>
                                </div>
                            </div>
                        </>
                    ) : (
                         <div className="text-center text-muted-foreground pt-8">
                            <p>{copy.emptyState}</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
