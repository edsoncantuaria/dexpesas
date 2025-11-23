'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { Edit2, Trash2, ExternalLink } from 'lucide-react';
import { Debt } from '@/hooks/use-debts';

interface ActiveDebtsListProps {
    debts: Debt[];
    onDelete: (id: string) => void;
}

export function ActiveDebtsList({ debts, onDelete }: ActiveDebtsListProps) {
    if (debts.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Dívidas Ativas</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        Nenhuma dívida cadastrada. Use a aba "Simulador" para adicionar.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2">
            {debts.map((debt) => {
                const progress = debt.originalAmount > 0
                    ? ((Number(debt.originalAmount) - Number(debt.currentBalance)) / Number(debt.originalAmount)) * 100
                    : 0;

                return (
                    <Card key={debt.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{debt.name}</CardTitle>
                                    <div className="flex gap-2 mt-1">
                                        <Badge variant="secondary">{debt.debtType.replace('_', ' ')}</Badge>
                                        {debt.status === 'PAID_OFF' && <Badge variant="default" className="bg-green-500">Quitada</Badge>}
                                    </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onDelete(debt.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-muted-foreground">Saldo Devedor</span>
                                        <span className="font-bold text-red-500">{formatCurrency(Number(debt.currentBalance))}</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                        <span>Original: {formatCurrency(Number(debt.originalAmount))}</span>
                                        <span>{progress.toFixed(0)}% pago</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-muted-foreground block">Juros</span>
                                        <span className="font-medium">{Number(debt.interestRate)}% a.m.</span>
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground block">Mínimo</span>
                                        <span className="font-medium">{formatCurrency(Number(debt.minimumPayment))}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}
