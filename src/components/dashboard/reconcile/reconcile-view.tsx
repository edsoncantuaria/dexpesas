// src/components/dashboard/reconcile/reconcile-view.tsx
'use client';

import type { Reconciliation, Transaction, ImportedTransaction } from '@/lib/definitions';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, startOfDay } from 'date-fns';
import { ArrowRight, CheckCircle, HelpCircle, X, CircleDashed, Award, PlusCircle, Loader2, SquareCheckBig, Inbox, Ban, CalendarIcon, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/error-handler';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ConfirmActionDialog } from './confirm-action-dialog';
import { motion, AnimatePresence } from 'framer-motion';

interface ReconcileViewProps {
    reconciliation: Reconciliation;
    manualTransactions: Transaction[];
    onMatch: (importedTransactionId: string, manualTransactionId: string) => void;
    onDiscard: (importedTransactionId: string) => void;
    onTransactionCreated: () => void;
    onFinalize: () => void;
    onCancel: () => void;
    onBulkImportStart: () => void;
}

const formatCurrency = (value: number, type: 'CREDIT' | 'DEBIT') => {
    const signal = type === 'CREDIT' ? '+' : '-';
    const formattedValue = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
    return `${signal} ${formattedValue}`;
};

const statusConfig = {
    PENDING: { text: 'Pendente', icon: HelpCircle, color: 'text-muted-foreground', bgColor: 'bg-muted-foreground/10' },
    SUGGESTED: { text: 'Sugerido', icon: CircleDashed, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-500/10' },
    RECONCILED: { text: 'Conciliado', icon: CheckCircle, color: 'text-green-600 dark:text-green-500', bgColor: 'bg-green-500/10' },
    DISCARDED: { text: 'Descartado', icon: X, color: 'text-destructive', bgColor: 'bg-destructive/10' },
}

const BALANCE_TOLERANCE = 0.05;

const formatMoney = (value?: number | null, currency = 'BRL') => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(Number(value));
};

export function ReconcileView({ reconciliation, manualTransactions, onMatch, onDiscard, onTransactionCreated, onFinalize, onCancel, onBulkImportStart }: ReconcileViewProps) {
    const [selectedImported, setSelectedImported] = useState<ImportedTransaction | null>(null);
    const [selectedManual, setSelectedManual] = useState<Transaction | null>(null);
    const [isCreating, setIsCreating] = useState<string | null>(null);
    const [isCreatingAll, setIsCreatingAll] = useState(false);
    const [importedSearch, setImportedSearch] = useState('');
    const [manualSearch, setManualSearch] = useState('');
    const [importedDate, setImportedDate] = useState<Date | undefined>();
    const [manualDate, setManualDate] = useState<Date | undefined>();
    const [dialogState, setDialogState] = useState<'import' | 'finalize' | 'cancel' | null>(null);
    const { toast } = useToast();
    const pendingImportedCount = reconciliation.importedTransactions.filter(t => ['PENDING', 'SUGGESTED'].includes(t.status)).length;
    const statementCurrency = reconciliation.statementCurrency || 'BRL';
    const balanceDifferenceValue = reconciliation.balanceDifference !== null && reconciliation.balanceDifference !== undefined ? Number(reconciliation.balanceDifference) : null;
    const balanceWarning = balanceDifferenceValue !== null && Math.abs(balanceDifferenceValue) > BALANCE_TOLERANCE;
    const isProcessingJobs = reconciliation.status === 'PROCESSING';

    const finalizeDisabledReason = isProcessingJobs
        ? 'Aguardando a importação em lote finalizar.'
        : balanceWarning
            ? 'A diferença entre o extrato e o sistema precisa ser zerada.'
            : pendingImportedCount > 0
                ? 'Concilie ou descarte todas as transações antes de finalizar.'
                : null;

    const handleSelectImported = (tx: ImportedTransaction) => {
        if (tx.status !== 'PENDING' && tx.status !== 'SUGGESTED') return;
        setSelectedImported(tx.id === selectedImported?.id ? null : tx);
        // If we select an imported transaction that has a suggested match, try to select it automatically
        if (tx.status === 'SUGGESTED' && tx.manualTransactionId) {
            const suggestedManual = manualTransactions.find(t => t.id === tx.manualTransactionId);
            if (suggestedManual && !suggestedManual.isReconciled) {
                setSelectedManual(suggestedManual);
            }
        } else {
            setSelectedManual(null);
        }
    };

    const handleSelectManual = (tx: Transaction) => {
        if (tx.isReconciled) return;
        setSelectedManual(tx.id === selectedManual?.id ? null : tx);
    }

    const handleCreateFromImported = async (importedTxId: string) => {
        setIsCreating(importedTxId);
        try {
            await api.post('/transactions/create-from-import', { importedTransactionId: importedTxId });
            toast({ title: 'Transação criada!', description: 'A transação do extrato foi adicionada aos seus lançamentos e conciliada.', className: 'bg-green-100 dark:bg-green-800' });
            onTransactionCreated();
        } catch (error) {
            handleApiError(error, toast, 'Erro ao criar transação');
        } finally {
            setIsCreating(null);
        }
    };

    const handleCreateAll = async () => {
        setDialogState(null);
        setIsCreatingAll(true);
        try {
            const response = await api.post(`/reconcile/${reconciliation.id}/create-all`);
            toast({ title: 'Importação em Lote Iniciada', description: response.data.message });
            onBulkImportStart();
        } catch (error: any) {
            handleApiError(error, toast, 'Erro na Importação em Lote');
        } finally {
            setIsCreatingAll(false);
        }
    };

    const filteredImported = useMemo(() => {
        return reconciliation.importedTransactions.filter(tx => {
            const searchMatch = importedSearch ? tx.description.toLowerCase().includes(importedSearch.toLowerCase()) : true;
            const dateMatch = importedDate ? startOfDay(parseISO(tx.date)).getTime() === startOfDay(importedDate).getTime() : true;
            return searchMatch && dateMatch;
        });
    }, [reconciliation.importedTransactions, importedSearch, importedDate]);

    const filteredManual = useMemo(() => {
        return manualTransactions.filter(tx => {
            const searchMatch = manualSearch ? tx.descricao.toLowerCase().includes(manualSearch.toLowerCase()) : true;
            const dateMatch = manualDate ? startOfDay(parseISO(tx.data)).getTime() === startOfDay(manualDate).getTime() : true;
            return searchMatch && dateMatch;
        });
    }, [manualTransactions, manualSearch, manualDate]);

    const reconciledManualTransactions = filteredManual.filter(t => t.isReconciled);
    const pendingManualTransactions = filteredManual.filter(t => !t.isReconciled);

    if (!reconciliation.importedTransactions || reconciliation.importedTransactions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-40 text-center bg-muted/50 rounded-lg">
                <p className="font-semibold">Tudo conciliado!</p>
                <p className="text-sm text-muted-foreground">Nenhuma transação pendente encontrada no extrato.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid gap-6 lg:grid-cols-[1fr_auto_1fr]">
                {/* Coluna de Transações Importadas */}
                <Card className="flex h-[70vh] flex-col overflow-hidden border-none shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                    <CardHeader className="border-b bg-muted/30 p-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium">Extrato Bancário</CardTitle>
                            <Badge variant="secondary" className="text-xs">{filteredImported.length} itens</Badge>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <div className="relative flex-grow">
                                <Input
                                    placeholder="Buscar..."
                                    value={importedSearch}
                                    onChange={(e) => setImportedSearch(e.target.value)}
                                    className="h-8 pl-8 bg-white dark:bg-black/20"
                                />
                                <Inbox className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                                        <CalendarIcon className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={importedDate} onSelect={setImportedDate} /></PopoverContent>
                            </Popover>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full">
                            <div className="divide-y divide-border/50">
                                {filteredImported.map(tx => {
                                    const { text, icon: Icon, color, bgColor } = statusConfig[tx.status];
                                    const isSelected = selectedImported?.id === tx.id;
                                    const isSuggested = tx.status === 'SUGGESTED';
                                    const isReconciled = tx.status === 'RECONCILED';

                                    return (
                                        <div
                                            key={tx.id}
                                            onClick={() => handleSelectImported(tx)}
                                            className={cn(
                                                'group flex items-center justify-between p-3 transition-all',
                                                (tx.status === 'PENDING' || tx.status === 'SUGGESTED') && 'cursor-pointer hover:bg-muted/50',
                                                isSelected && 'bg-primary/5 border-l-4 border-primary pl-2',
                                                isSuggested && !isSelected && 'bg-yellow-500/5',
                                                isReconciled && 'opacity-50 bg-muted/20'
                                            )}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <p className="font-medium text-sm line-clamp-1">{tx.description}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{format(parseISO(tx.date), 'dd/MM')}</span>
                                                    <Badge variant="outline" className={cn("text-[10px] h-5 px-1.5 border-none font-medium", color, bgColor)}>
                                                        <Icon className="h-3 w-3 mr-1" />{text}
                                                        {isSuggested && tx.similarityScore && (
                                                            <span className='ml-1'>({tx.similarityScore}%)</span>
                                                        )}
                                                    </Badge>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className={cn("font-semibold text-sm", tx.type === 'CREDIT' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                                                    {formatCurrency(tx.amount, tx.type)}
                                                </span>
                                                {(tx.status === 'PENDING' || tx.status === 'SUGGESTED') && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => { e.stopPropagation(); handleCreateFromImported(tx.id) }}
                                                        disabled={isCreating === tx.id}
                                                        title="Criar lançamento"
                                                    >
                                                        {isCreating === tx.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4 text-primary" />}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Coluna Central de Ações */}
                <div className="flex flex-col items-center justify-center gap-4 py-4">
                    <div className="flex flex-col gap-2 w-full sm:w-auto">
                        <Button
                            onClick={() => onMatch(selectedImported!.id, selectedManual!.id)}
                            disabled={!selectedImported || !selectedManual}
                            className="w-full min-w-[140px] shadow-md transition-all hover:scale-105"
                            size="lg"
                        >
                            <ArrowLeftRight className="h-4 w-4 mr-2" />
                            Conciliar
                        </Button>

                        <AnimatePresence>
                            {selectedImported && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <Button
                                        variant="secondary"
                                        onClick={() => onDiscard(selectedImported.id)}
                                        className="w-full min-w-[140px]"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Descartar
                                    </Button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="h-px w-full bg-border/50 lg:w-12 lg:h-px my-2"></div>

                    {pendingImportedCount > 0 && (
                        <Button
                            variant="outline"
                            onClick={() => setDialogState('import')}
                            disabled={isCreatingAll}
                            className="w-full min-w-[140px]"
                        >
                            {isCreatingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Inbox className="mr-2 h-4 w-4" />}
                            Importar ({pendingImportedCount})
                        </Button>
                    )}
                </div>

                {/* Coluna de Transações Manuais */}
                <Card className="flex h-[70vh] flex-col overflow-hidden border-none shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                    <CardHeader className="border-b bg-muted/30 p-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium">Seus Lançamentos</CardTitle>
                            <Badge variant="secondary" className="text-xs">{filteredManual.length} itens</Badge>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <div className="relative flex-grow">
                                <Input
                                    placeholder="Buscar..."
                                    value={manualSearch}
                                    onChange={(e) => setManualSearch(e.target.value)}
                                    className="h-8 pl-8 bg-white dark:bg-black/20"
                                />
                                <Inbox className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                                        <CalendarIcon className="h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={manualDate} onSelect={setManualDate} /></PopoverContent>
                            </Popover>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full">
                            <div className="divide-y divide-border/50">
                                {pendingManualTransactions.length > 0 ? pendingManualTransactions.map(tx => {
                                    const isSelected = selectedManual?.id === tx.id;
                                    const isSuggested = reconciliation.importedTransactions.some(itx => itx.status === 'SUGGESTED' && itx.manualTransactionId === tx.id);

                                    return (
                                        <div
                                            key={tx.id}
                                            onClick={() => handleSelectManual(tx)}
                                            className={cn(
                                                "group flex items-center justify-between p-3 transition-all cursor-pointer hover:bg-muted/50",
                                                isSelected && "bg-primary/5 border-l-4 border-primary pl-2",
                                                isSuggested && !isSelected && "bg-yellow-500/5 border-l-4 border-yellow-500 pl-2",
                                            )}
                                        >
                                            <div className="flex flex-col gap-1">
                                                <p className="font-medium text-sm line-clamp-1">{tx.descricao}</p>
                                                <p className="text-xs text-muted-foreground">{format(parseISO(tx.data), 'dd/MM')}</p>
                                            </div>
                                            <span className={cn("font-semibold text-sm", tx.tipo === 'receita' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
                                                {formatCurrency(tx.valor, tx.tipo === 'receita' ? 'CREDIT' : 'DEBIT')}
                                            </span>
                                        </div>
                                    );
                                }) : (
                                    <div className="flex flex-col items-center justify-center h-24 text-center text-muted-foreground p-4">
                                        <p className="text-sm">Nenhum lançamento manual pendente.</p>
                                    </div>
                                )}
                                {reconciledManualTransactions.length > 0 && (
                                    <>
                                        <div className="p-2 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center sticky top-0">
                                            Já Conciliados
                                        </div>
                                        {reconciledManualTransactions.map(tx => (
                                            <div key={tx.id} className="flex items-center justify-between p-3 opacity-50 bg-muted/10">
                                                <div className="flex flex-col gap-1">
                                                    <p className="font-medium text-sm line-clamp-1">{tx.descricao}</p>
                                                    <p className="text-xs text-muted-foreground">{format(parseISO(tx.data), 'dd/MM')}</p>
                                                </div>
                                                <span className={cn("font-semibold text-sm", tx.tipo === 'receita' ? 'text-green-600 dark:text-green-400' : 'text-destructive')}>
                                                    {formatCurrency(tx.valor, tx.tipo === 'receita' ? 'CREDIT' : 'DEBIT')}
                                                </span>
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>

            <div className="w-full flex justify-end items-center gap-2 mt-6 border-t pt-6">
                <Button onClick={() => setDialogState('cancel')} variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Ban className="h-4 w-4 mr-2" /> Cancelar Reconciliação
                </Button>
                {finalizeDisabledReason ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="w-full lg:w-auto">
                                    <Button disabled variant="default" className="bg-green-600 opacity-60 cursor-not-allowed">
                                        <SquareCheckBig className="h-4 w-4 mr-2" /> Finalizar Reconciliação
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">{finalizeDisabledReason}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <Button onClick={() => setDialogState('finalize')} variant="default" className="bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl transition-all">
                        <SquareCheckBig className="h-4 w-4 mr-2" /> Finalizar Reconciliação
                    </Button>
                )}
            </div>

            <ConfirmActionDialog
                isOpen={dialogState === 'import'}
                onClose={() => setDialogState(null)}
                onConfirm={handleCreateAll}
                title="Importar Todas as Transações?"
                description={`Você tem certeza que deseja criar ${pendingImportedCount} novas transações em seus lançamentos com base no extrato? Esta ação é recomendada apenas quando você tem certeza que nenhuma dessas transações já foi registrada manualmente.`}
                confirmText="Sim, Importar Todas"
            />
            <ConfirmActionDialog
                isOpen={dialogState === 'finalize'}
                onClose={() => setDialogState(null)}
                onConfirm={onFinalize}
                title="Finalizar Reconciliação?"
                description="Todas as transações importadas que não foram conciliadas serão marcadas como descartadas. Esta ação não pode ser desfeita."
                confirmText="Sim, Finalizar"
            />
            <ConfirmActionDialog
                isOpen={dialogState === 'cancel'}
                onClose={() => setDialogState(null)}
                onConfirm={onCancel}
                title="Cancelar e Excluir Reconciliação?"
                description="Você perderá o progresso desta sessão de reconciliação e todos os dados importados serão excluídos permanentemente. Esta ação não pode ser desfeita."
                confirmText="Sim, Excluir e Cancelar"
                isDestructive={true}
            />
        </>
    );
}
