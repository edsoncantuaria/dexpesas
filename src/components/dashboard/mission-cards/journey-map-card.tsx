// src/components/dashboard/mission-cards/journey-map-card.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "lucide-react";
import type { Budget } from "@/lib/definitions";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface JourneyMapCardProps {
    budgets: Budget[];
}

const getProgressColor = (percentage: number) => {
    if (percentage > 90) return "bg-destructive";
    if (percentage > 70) return "bg-yellow-500";
    return "bg-primary";
};

export function JourneyMapCard({ budgets }: JourneyMapCardProps) {
    const router = useRouter();
    const foodBudget = budgets.find(b => b.category?.nome === 'Alimentacao');
    const leisureBudget = budgets.find(b => b.category?.nome === 'Lazer');

    const budgetsToShow = [foodBudget, leisureBudget].filter(Boolean) as Budget[];

    return (
         <Link href="/dashboard/orcamentos" className="group">
        <Card className="shadow-md h-full transition-all group-hover:shadow-xl group-hover:border-primary/50">
                 <CardHeader>
                    <div className="flex items-center gap-3">
                       <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                         <Map className="h-6 w-6 text-green-600 dark:text-green-400" />
                       </div>
                        <div>
                            <CardTitle className="font-headline text-xl">O Mapa da Jornada</CardTitle>
                            <CardDescription>Gerencie suas provisões e recursos.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {budgetsToShow.length > 0 ? (
                        budgetsToShow.map(budget => {
                            const spent = Number(budget.spent);
                            const limit = Number(budget.limit);
                            const percentage = limit > 0 ? (spent / limit) * 100 : 0;
                            return (
                                <div key={budget.id} className="space-y-2">
                                    <div className="flex justify-between items-baseline">
                                        <p className="font-semibold">{budget.category?.nome}</p>
                                        <p className="text-sm text-muted-foreground">
                                           {spent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} / {limit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </p>
                                    </div>
                                    <Progress value={percentage} indicatorClassName={getProgressColor(percentage)} />
                                </div>
                            )
                        })
                    ) : (
                         <div className="text-center text-muted-foreground pt-8">
                            <p>Nenhum orçamento de Alimentação ou Lazer definido para este mês.</p>
                        </div>
                    )}
                </CardContent>
                <div className="px-6 pb-6">
                    <Button
                        variant="secondary"
                        className="w-full"
                        onClick={(e) => {
                            e.preventDefault();
                            router.push('/dashboard/orcamentos?create=true');
                        }}
                    >
                        Criar orçamento agora
                    </Button>
                </div>
            </Card>
        </Link>
    );
}
