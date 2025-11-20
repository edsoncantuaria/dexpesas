// src/components/dashboard/reconcile/reconcile-page-client.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { GitCompareArrows, Loader2, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/ui/loading-screen';
import api from '@/lib/api';
import type { Account, Transaction, Reconciliation, ImportTemplate, Card as CardType } from '@/lib/definitions';
import { ReconcileUploader } from '@/components/dashboard/reconcile/reconcile-uploader';
import { ReconcileView } from '@/components/dashboard/reconcile/reconcile-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReconciliationHistoryList } from '@/components/dashboard/reconcile/history-list';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Target = (Account | CardType) & { type: 'account' | 'card' };

export function ReconcilePageClient() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [cards, setCards] = useState<CardType[]>([]);
    const [templates, setTemplates] = useState<ImportTemplate[]>([]);
    const [selectedTarget, setSelectedTarget] = useState<Target | null>(null);
    const [manualTransactions, setManualTransactions] = useState<Transaction[]>([]);
    const [reconciliation, setReconciliation] = useState<Reconciliation | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isPolling, setIsPolling] = useState(false);
    const [activeTab, setActiveTab] = useState('reconcile');
    const [historyKey, setHistoryKey] = useState(Date.now()); // Para forçar o refresh do histórico
    const [finalizeHelpOpen, setFinalizeHelpOpen] = useState(false);
    const [finalizeErrorMessage, setFinalizeErrorMessage] = useState<string | null>(null);
    const [guideDialogOpen, setGuideDialogOpen] = useState(false);
    const { toast } = useToast();

    const fetchInitialData = useCallback(async () => {
        try {
            const [accRes, cardRes, tempRes] = await Promise.all([
                api.get('/accounts'),
                api.get('/cards'),
                api.get('/reconcile/templates')
            ]);
            setAccounts(accRes.data);
            setCards(cardRes.data);
            setTemplates(tempRes.data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar dados iniciais' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const fetchManualTransactions = useCallback(async (targetId: string, targetType: 'account' | 'card', startDate: Date, endDate: Date) => {
        if (!targetId) return;
        const bufferedStartDate = new Date(startDate);
        bufferedStartDate.setDate(startDate.getDate() - 7);
        const bufferedEndDate = new Date(endDate);
        bufferedEndDate.setDate(endDate.getDate() + 7);
        
        try {
            const queryParams = new URLSearchParams({
                [targetType === 'account' ? 'accountId' : 'cardId']: targetId,
                startDate: bufferedStartDate.toISOString(),
                endDate: bufferedEndDate.toISOString(),
                includePending: 'true'
            }).toString();
            const res = await api.get(`/transactions?${queryParams}`);
            setManualTransactions(res.data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar transações manuais' });
        }
    }, [toast]);
    
    const fetchReconciliationData = useCallback(async (params: { reconciliationId?: string; accountId?: string; cardId?: string }) => {
        try {
            const res = await api.get('/reconcile/status', { params });
            if (res.data) {
                setReconciliation(res.data);
                const targetType = res.data.accountId ? 'account' : 'card';
                const targetId = res.data.accountId || res.data.cardId;
                const targetList = targetType === 'account' ? accounts : cards;
                const target = targetList.find(t => t.id === targetId);

                if (target && res.data.startDate && res.data.endDate) {
                    setSelectedTarget({ ...target, type: targetType });
                    await fetchManualTransactions(targetId, targetType, new Date(res.data.startDate), new Date(res.data.endDate));
                }
                setActiveTab('reconcile');
            }
        } catch (error) {
             setReconciliation(null);
        }
    }, [accounts, cards, fetchManualTransactions]);

    const pollReconciliationStatus = useCallback(async (reconciliationId: string) => {
        if (isPolling) return;
        setIsPolling(true);
        
        const poll = async (): Promise<boolean> => {
            try {
                const res = await api.get(`/reconcile/status?reconciliationId=${reconciliationId}`);
                if (res.data && res.data.id === reconciliationId && res.data.status !== 'PROCESSING') {
                    return true;
                }
            } catch (error) { /* Continua tentando */ }
            return false;
        }

        const intervalId = setInterval(async () => {
            if (await poll()) {
                setIsPolling(false);
                clearInterval(intervalId);
                toast({ title: 'Processamento concluído!', description: 'Seu extrato está pronto para conciliação.' });
                await fetchReconciliationData({ reconciliationId });
            }
        }, 3000);

        setTimeout(() => {
            if (isPolling) {
                clearInterval(intervalId);
                setIsPolling(false);
                toast({ variant: 'destructive', title: 'Tempo de processamento excedido.' });
            }
        }, 60000); 
    }, [toast, isPolling, fetchReconciliationData]);

    const handleUploadSuccess = async (reconciliationId: string, targetId: string, targetType: 'account' | 'card') => {
        const targetList = targetType === 'account' ? accounts : cards;
        const target = targetList.find(t => t.id === targetId);
        if (target) {
            setSelectedTarget({ ...target, type: targetType });
        }
        setReconciliation(null);
        setManualTransactions([]);
        await pollReconciliationStatus(reconciliationId);
        setHistoryKey(Date.now()); // Atualiza o histórico
    };

    const handleBulkImportStart = () => {
        setReconciliation(null);
        setManualTransactions([]);
        setSelectedTarget(null);
        setHistoryKey(Date.now());
        setActiveTab('history');
        toast({ title: "Processamento em Lote Iniciado", description: "O status será atualizado no histórico quando concluído." });
    };

    const handleMatch = async (importedTransactionId: string, manualTransactionId: string) => {
        try {
            await api.post('/reconcile/match', { importedTransactionId, manualTransactionId });
            if (reconciliation) {
                 await fetchReconciliationData({ reconciliationId: reconciliation.id });
            }
            toast({ title: 'Conciliado!', description: 'A transação foi conciliada com sucesso.', className: 'bg-green-100 dark:bg-green-800' });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Erro ao conciliar transação.' });
        }
    };
    
    const handleDiscard = async (importedTransactionId: string) => {
         try {
            await api.post('/reconcile/discard', { importedTransactionId });
            if (reconciliation) {
                 await fetchReconciliationData({ reconciliationId: reconciliation.id });
            }
             toast({ title: 'Transação Descartada.', variant: 'destructive' });
        } catch (error) {
             toast({ variant: 'destructive', title: 'Erro ao descartar transação.' });
        }
    };

    const handleTransactionCreated = () => {
        if (reconciliation) {
            fetchReconciliationData({ reconciliationId: reconciliation.id });
        }
    };
    
    const handleFinalize = async (reconciliationId: string) => {
        try {
            await api.post(`/reconcile/${reconciliationId}/finalize`);
            toast({ title: "Reconciliação Finalizada!", description: "As pendências foram descartadas."});
            setReconciliation(null);
            setHistoryKey(Date.now());
        } catch (error: any) {
            const serverMessage = typeof error?.response?.data?.message === 'string'
                ? error.response.data.message
                : null;
            const shouldShowModal = error?.response?.status === 409 || (serverMessage && serverMessage.toLowerCase().includes('saldo'));

            if (shouldShowModal) {
                setFinalizeErrorMessage(serverMessage || 'O saldo do sistema está diferente do extrato.');
                setFinalizeHelpOpen(true);
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Erro ao finalizar reconciliação.',
                    description: serverMessage || 'Tente novamente em instantes.',
                });
            }
        }
    };

    const handleCancel = async () => {
        if (!reconciliation) return;
        try {
            await api.delete(`/reconcile/${reconciliation.id}`);
            toast({ title: 'Reconciliação Cancelada', variant: 'destructive' });
            setReconciliation(null);
            setSelectedTarget(null);
            setManualTransactions([]);
            setHistoryKey(Date.now());
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao cancelar.' });
        }
    };

    if (isLoading) return <LoadingScreen />;

    const differenceValue = reconciliation?.balanceDifference !== undefined && reconciliation?.balanceDifference !== null
        ? Number(reconciliation.balanceDifference)
        : null;

    const formatCurrency = (value: number | null) => {
        if (value === null || Number.isNaN(value)) return '—';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                    <GitCompareArrows className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Reconciliação Bancária</h1>
                        <p className="text-muted-foreground">Importe seus extratos e mantenha tudo em perfeita sincronia.</p>
                    </div>
                </div>
                <Button variant="outline" className="self-start lg:self-auto" onClick={() => setGuideDialogOpen(true)}>
                    <HelpCircle className="h-4 w-4 mr-2" />
                    Como usar
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="reconcile">Conciliar Agora</TabsTrigger>
                    <TabsTrigger value="history">Histórico</TabsTrigger>
                </TabsList>
                <TabsContent value="reconcile" className="mt-6 space-y-6">
                    {isPolling ? (
                        <Card className="flex flex-col items-center justify-center h-64 gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="text-lg font-medium">Processando seu extrato...</p>
                            <p className="text-sm text-muted-foreground">Aguarde um momento, isso pode levar alguns segundos.</p>
                        </Card>
                    ) : !reconciliation ? (
                         <Card>
                            <CardHeader>
                                <CardTitle>Iniciar Nova Reconciliação</CardTitle>
                                <CardDescription>
                                    Selecione a conta ou cartão e envie o arquivo de extrato (OFX ou CSV).
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ReconcileUploader 
                                    accounts={accounts} 
                                    cards={cards}
                                    templates={templates}
                                    onSuccess={handleUploadSuccess} 
                                    isProcessing={isPolling}
                                    onTargetChange={(id, type) => {
                                        const targetList = type === 'account' ? accounts : cards;
                                        const target = targetList.find(t => t.id === id);
                                        if (target) setSelectedTarget({ ...target, type });
                                    }}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <ReconcileView
                            reconciliation={reconciliation}
                            manualTransactions={manualTransactions}
                            onMatch={handleMatch}
                            onDiscard={handleDiscard}
                            onTransactionCreated={handleTransactionCreated}
                            onFinalize={() => handleFinalize(reconciliation.id)}
                            onCancel={handleCancel}
                            onBulkImportStart={handleBulkImportStart}
                        />
                    )}
                </TabsContent>
                <TabsContent value="history" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Histórico de Reconciliações</CardTitle>
                            <CardDescription>
                                Veja e retome reconciliações anteriores.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                           <ReconciliationHistoryList 
                             key={historyKey}
                             onResume={fetchReconciliationData}
                             onFinalize={handleFinalize}
                           />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <Dialog open={finalizeHelpOpen} onOpenChange={setFinalizeHelpOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Saldo diferente do extrato</DialogTitle>
                        <DialogDescription>
                            {finalizeErrorMessage || 'Não é possível finalizar enquanto houver diferença entre o saldo do extrato e da conta no Dexpesas.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 text-sm">
                        <div className="rounded-md border border-dashed p-3">
                            <p className="text-xs uppercase text-muted-foreground">Diferença atual</p>
                            <p className="text-xl font-semibold">{formatCurrency(differenceValue ?? null)}</p>
                        </div>
                        {reconciliation && (
                            <div className="rounded-md border border-muted/50 p-3 space-y-1 text-muted-foreground">
                                <p className="font-semibold text-foreground">Comparativo de saldos</p>
                                <p>Saldo inicial no Dexpesas: {formatCurrency(reconciliation.systemOpeningBalance ?? null)}</p>
                                <p>Saldo inicial do extrato: {formatCurrency(reconciliation.statementOpeningBalance ? Number(reconciliation.statementOpeningBalance) : null)}</p>
                                <p>Saldo final no Dexpesas: {formatCurrency(reconciliation.systemClosingBalance ?? null)}</p>
                                <p>Saldo final do extrato: {formatCurrency(reconciliation.statementClosingBalance ? Number(reconciliation.statementClosingBalance) : null)}</p>
                            </div>
                        )}
                        <p className="text-muted-foreground">
                            Para finalizar é necessário que o saldo final do Dexpesas seja igual ao saldo final do extrato importado.
                            Isso evita fechar o período com lançamentos faltando ou duplicados.
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                            <li>Garanta que todas as transações importadas foram conciliadas, descartadas ou criadas no sistema.</li>
                            <li>Verifique o saldo inicial configurado na conta (menu Contas). Ele deve ser igual ao saldo do extrato no início do período.</li>
                            <li>Se não houver mais pendências, clique em “Atualizar” e tente finalizar novamente.</li>
                        </ul>
                    </div>
                    <DialogFooter>
                        <Button onClick={() => setFinalizeHelpOpen(false)}>Entendi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={guideDialogOpen} onOpenChange={setGuideDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Guia de Reconciliação</DialogTitle>
                        <DialogDescription>Entenda por que e como usar o módulo.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                        <div>
                            <p className="font-semibold">Por que usar?</p>
                            <p className="text-muted-foreground">Reconciliações garantem que o saldo no Dexpesas seja igual ao saldo do banco, o que evita lançamentos duplicados e dá segurança para tomar decisões.</p>
                        </div>
                        <div>
                            <p className="font-semibold">Como preparar</p>
                            <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                                <li>Abra o extrato e anote o saldo inicial e final exibidos pelo banco.</li>
                                <li>Edite a conta no Dexpesas (menu Finanças &gt; Contas) e coloque o saldo inicial igual ao do extrato mais antigo que você vai importar.</li>
                                <li>Faça o upload do extrato e concilie cada lançamento ou crie os que faltarem.</li>
                            </ol>
                        </div>
                        <div>
                            <p className="font-semibold">Com qual frequência?</p>
                            <p className="text-muted-foreground">Recomenda-se conciliar semanalmente ou logo após fechar uma fatura. Quanto menor o intervalo, menos pendências para revisar.</p>
                        </div>
                        <div className="rounded-md border border-dashed p-3 text-muted-foreground">
                            <p className="font-semibold text-foreground mb-1">Precisa ajustar o saldo inicial?</p>
                            <p>
                                Use o botão abaixo para acessar a tela de contas e editar o saldo diretamente. Não é necessário criar transações fictícias para corrigir o valor inicial.
                            </p>
                        </div>
                    </div>
                    <DialogFooter className="flex-col sm:flex-row sm:items-center sm:justify-between">
                        <Button variant="secondary" asChild>
                            <Link href="/dashboard/contas">Abrir página de Contas</Link>
                        </Button>
                        <Button onClick={() => setGuideDialogOpen(false)}>Entendi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
