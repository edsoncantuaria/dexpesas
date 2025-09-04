// src/app/dashboard/reconcile/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { GitCompareArrows, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/ui/loading-screen';
import api from '@/lib/api';
import type { Account, Transaction, Reconciliation, ImportTemplate, Card as CardType } from '@/lib/definitions';
import { ReconcileUploader } from '@/components/dashboard/reconcile/reconcile-uploader';
import { ReconcileView } from '@/components/dashboard/reconcile/reconcile-view';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReconciliationHistoryList } from '@/components/dashboard/reconcile/history-list';

type Target = (Account | CardType) & { type: 'account' | 'card' };

export default function ReconcilePage() {
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
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao finalizar reconciliação.' });
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

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <GitCompareArrows className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Reconciliação Bancária</h1>
                    <p className="text-muted-foreground">Importe seus extratos e mantenha tudo em perfeita sincronia.</p>
                </div>
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
        </div>
    );
}
