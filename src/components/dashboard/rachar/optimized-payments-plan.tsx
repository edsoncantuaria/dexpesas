'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { PaymentPlan } from '@/lib/payment-optimizer';
import { SplitGroupMember } from '@/lib/definitions';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface OptimizedPaymentsPlanProps {
    plan: PaymentPlan[];
    members: SplitGroupMember[];
    groupId: string;
    onSuccess: () => void;
}

export function OptimizedPaymentsPlan({ plan, members, groupId, onSuccess }: OptimizedPaymentsPlanProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const getMemberName = (id: string) => members.find(m => m.id === id)?.name || 'Desconhecido';

    const handleExecutePlan = async () => {
        setIsLoading(true);
        try {
            // Execute all payments in parallel
            await Promise.all(plan.map(payment =>
                api.post(`/rachar/groups/${groupId}/settlements`, {
                    fromId: payment.fromId,
                    toId: payment.toId,
                    amount: payment.amount,
                    date: new Date().toISOString()
                })
            ));

            toast({
                title: 'Plano executado com sucesso!',
                description: 'Todas as quitações foram registradas.',
            });
            onSuccess();
        } catch (error) {
            console.error('Erro ao executar plano:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao executar plano',
                description: 'Algumas quitações podem não ter sido registradas.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (plan.length === 0) {
        return (
            <Card className="bg-muted/50">
                <CardContent className="p-6 text-center text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>Tudo quitado! Ninguém deve nada para ninguém.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center justify-between">
                    <span>Plano Otimizado</span>
                    <span className="text-xs font-normal px-2 py-1 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-700 dark:text-blue-300">
                        {plan.length} transferência{plan.length !== 1 ? 's' : ''}
                    </span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    {plan.map((payment, index) => (
                        <div key={index} className="flex items-center justify-between bg-white dark:bg-card p-3 rounded-lg border shadow-sm">
                            <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium text-red-600 dark:text-red-400">
                                    {getMemberName(payment.fromId)}
                                </span>
                                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-green-600 dark:text-green-400">
                                    {getMemberName(payment.toId)}
                                </span>
                            </div>
                            <span className="font-bold">
                                R$ {payment.amount.toFixed(2)}
                            </span>
                        </div>
                    ))}
                </div>

                <Button
                    className="w-full"
                    onClick={handleExecutePlan}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Executando...
                        </>
                    ) : (
                        'Executar Plano (Quitar Tudo)'
                    )}
                </Button>
                <p className="text-xs text-center text-muted-foreground">
                    Isso criará automaticamente os registros de pagamento para zerar todas as dívidas.
                </p>
            </CardContent>
        </Card>
    );
}
