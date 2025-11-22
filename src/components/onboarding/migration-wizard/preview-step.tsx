'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Building2,
    CreditCard,
    TrendingUp,
    Edit,
    ChevronRight,
    AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PreviewStepProps {
    migrationData: any;
    onEdit: (step: string) => void;
    onConfirm: () => void;
    onBack: () => void;
}

export function PreviewStep({ migrationData, onEdit, onConfirm, onBack }: PreviewStepProps) {
    const totalAccounts = migrationData.accounts.length;
    const totalCards = migrationData.cards.length;
    const hasHistory = migrationData.cardHistory && Object.keys(migrationData.cardHistory).length > 0;

    const totalInvestedValue = migrationData.accounts
        .filter((acc: any) => acc.tipo === 'investimento')
        .reduce((sum: number, acc: any) => sum + acc.saldoInicial, 0);

    const totalAccountBalance = migrationData.accounts
        .filter((acc: any) => acc.tipo !== 'investimento')
        .reduce((sum: number, acc: any) => sum + acc.saldoInicial, 0);

    const totalCreditLimit = migrationData.cards
        .reduce((sum: number, card: any) => sum + card.limite, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            <div>
                <h2 className="text-3xl font-bold">Revisão Final</h2>
                <p className="text-muted-foreground mt-2">
                    Confira seus dados antes de importar
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total em Contas</p>
                                <p className="text-2xl font-bold">
                                    {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }).format(totalAccountBalance)}
                                </p>
                            </div>
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Investimentos</p>
                                <p className="text-2xl font-bold">
                                    {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }).format(totalInvestedValue)}
                                </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Limite Total</p>
                                <p className="text-2xl font-bold">
                                    {new Intl.NumberFormat('pt-BR', {
                                        style: 'currency',
                                        currency: 'BRL'
                                    }).format(totalCreditLimit)}
                                </p>
                            </div>
                            <CreditCard className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Accounts Section */}
            {totalAccounts > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Contas ({totalAccounts})
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit('accounts')}
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {migrationData.accounts.map((account: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">{account.nome}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {account.instituicao} • {account.tipo}
                                        </p>
                                    </div>
                                    <Badge variant="secondary">
                                        {new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        }).format(account.saldoInicial)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Cards Section */}
            {totalCards > 0 && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            Cartões ({totalCards})
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit('cards')}
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {migrationData.cards.map((card: any, index: number) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-medium">{card.nome}</p>
                                        <p className="text-sm text-muted-foreground capitalize">
                                            {card.bandeira} • Fecha dia {card.diaFechamento} • Vence dia {card.diaVencimento}
                                        </p>
                                    </div>
                                    <Badge variant="secondary">
                                        Limite: {new Intl.NumberFormat('pt-BR', {
                                            style: 'currency',
                                            currency: 'BRL'
                                        }).format(card.limite)}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* History Alert */}
            {hasHistory && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Histórico de faturas será importado para {Object.keys(migrationData.cardHistory).length} cartão(ões)
                    </AlertDescription>
                </Alert>
            )}

            <Separator />

            <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={onBack}>
                    Voltar
                </Button>
                <Button onClick={onConfirm} size="lg">
                    Confirmar e Importar
                    <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
        </motion.div>
    );
}
