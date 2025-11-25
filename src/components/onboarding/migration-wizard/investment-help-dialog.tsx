'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldCheck, TrendingUp, Building2 } from 'lucide-react';

interface InvestmentHelpDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InvestmentHelpDialog({ isOpen, onClose }: InvestmentHelpDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>O que conta como Investimento?</DialogTitle>
                    <DialogDescription>
                        Diferencie o dinheiro do dia-a-dia do dinheiro que está rendendo para o futuro.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <Card className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800">
                        <CardContent className="p-4 flex gap-4">
                            <div className="bg-green-100 dark:bg-green-900 p-2 rounded-full h-fit">
                                <ShieldCheck className="h-6 w-6 text-green-700 dark:text-green-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-green-800 dark:text-green-300">Caixinha Nubank / Reserva</h4>
                                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                    Se você tem dinheiro guardado em "Caixinhas", "Porquinhos" ou CDBs de liquidez diária que não usa para pagar contas do mês, <strong>isso é um investimento</strong>.
                                </p>
                                <p className="text-xs text-green-600 dark:text-green-500 mt-2 font-medium">
                                    Exemplo: R$ 5.000 na Caixinha "Reserva de Emergência".
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-4 flex gap-4">
                            <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded-full h-fit">
                                <TrendingUp className="h-6 w-6 text-blue-700 dark:text-blue-400" />
                            </div>
                            <div>
                                <h4 className="font-bold">Ações, FIIs e Tesouro</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Ativos comprados na bolsa ou títulos públicos. Importe direto da B3 para facilitar.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-muted/50">
                        <CardContent className="p-4 flex gap-4 opacity-70">
                            <div className="bg-gray-200 dark:bg-gray-800 p-2 rounded-full h-fit">
                                <Building2 className="h-6 w-6 text-gray-500" />
                            </div>
                            <div>
                                <h4 className="font-bold text-muted-foreground">O que NÃO colocar aqui?</h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                    O saldo da sua conta corrente que você vai usar para pagar o aluguel ou fatura do cartão semana que vem. Isso fica na etapa de <strong>Contas</strong>.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DialogContent>
        </Dialog>
    );
}
