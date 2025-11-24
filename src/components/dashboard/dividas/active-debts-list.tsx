'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { DollarSign, Edit, Trash2, AlertTriangle } from 'lucide-react';
import { Debt, useDebts } from '@/hooks/use-debts';
import { DebtPaymentModal } from './debt-payment-modal';
import { DebtAdjustmentModal } from './debt-adjustment-modal';

interface ActiveDebtsListProps {
    debts: Debt[];
    onDelete: (id: string) => void;
}

export function ActiveDebtsList({ debts, onDelete }: ActiveDebtsListProps) {
    const { recordPayment, recordAdjustment } = useDebts();
    const [paymentModalDebt, setPaymentModalDebt] = useState<Debt | null>(null);
    const [adjustmentModalDebt, setAdjustmentModalDebt] = useState<Debt | null>(null);

    if (debts.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Dívidas Ativas</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-center py-8">
                        Nenhuma dívida cadastrada. Use a aba "Simulador & Cadastro" para adicionar.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                {debts.map((debt) => {
                    const progress = debt.originalAmount > 0
                        ? ((Number(debt.originalAmount) - Number(debt.currentBalance)) / Number(debt.originalAmount)) * 100
                        : 0;

                    // Check for high interest or potential snowballing
                    const isHighInterest = Number(debt.interestRate) > 5;
                    const isSnowballing = debt.status === 'ACTIVE' && !debt.lastPaymentAt;

                    return (
                        <Card key={debt.id} className="overflow-hidden">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <CardTitle className="text-lg">{debt.name}</CardTitle>
                                        <div className="flex gap-2 mt-1 flex-wrap">
                                            <Badge variant="secondary">{debt.debtType.replace('_', ' ')}</Badge>
                                            {debt.status === 'PAID_OFF' && <Badge variant="default" className="bg-green-500">Quitada</Badge>}
                                            {isHighInterest && <Badge variant="destructive">Juros Alto</Badge>}
                                            {isSnowballing && (
                                                <Badge variant="destructive" className="flex items-center gap-1">
                                                    <AlertTriangle className="h-3 w-3" />
                                                    Sem Pagamentos
                                                </Badge>
                                            )}
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

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-2">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => setPaymentModalDebt(debt)}
                                        >
                                            <DollarSign className="h-4 w-4 mr-1" />
                                            Pagar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => setAdjustmentModalDebt(debt)}
                                        >
                                            <Edit className="h-4 w-4 mr-1" />
                                            Ajustar
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Payment Modal */}
            {paymentModalDebt && (
                <DebtPaymentModal
                    debt={paymentModalDebt}
                    isOpen={!!paymentModalDebt}
                    setIsOpen={(open: boolean) => !open && setPaymentModalDebt(null)}
                    onSubmit={async (data) => {
                        await recordPayment(paymentModalDebt.id, data);
                    }}
                />
            )}

            {/* Adjustment Modal */}
            {adjustmentModalDebt && (
                <DebtAdjustmentModal
                    debt={adjustmentModalDebt}
                    isOpen={!!adjustmentModalDebt}
                    setIsOpen={(open: boolean) => !open && setAdjustmentModalDebt(null)}
                    onSubmit={async (data) => {
                        await recordAdjustment(adjustmentModalDebt.id, data);
                    }}
                />
            )}
        </>
    );
}
