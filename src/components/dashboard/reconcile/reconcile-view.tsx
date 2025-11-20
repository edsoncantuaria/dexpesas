// src/components/dashboard/reconcile/reconcile-view.tsx
'use client';

import type { Reconciliation, Transaction, ImportedTransaction } from '@/lib/definitions';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, startOfDay } from 'date-fns';
import { ArrowRight, CheckCircle, HelpCircle, X, CircleDashed, Award, PlusCircle, Loader2, SquareCheckBig, Inbox, Ban, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ConfirmActionDialog } from './confirm-action-dialog';

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
    const bankOpening = reconciliation.statementOpeningBalance !== null && reconciliation.statementOpeningBalance !== undefined ? Number(reconciliation.statementOpeningBalance) : null;
    const bankClosing = reconciliation.statementClosingBalance !== null && reconciliation.statementClosingBalance !== undefined ? Number(reconciliation.statementClosingBalance) : null;
    const systemOpening = reconciliation.systemOpeningBalance !== null && reconciliation.systemOpeningBalance !== undefined ? Number(reconciliation.systemOpeningBalance) : null;
    const systemClosing = reconciliation.systemClosingBalance !== null && reconciliation.systemClosingBalance !== undefined ? Number(reconciliation.systemClosingBalance) : null;
    const balanceDifferenceValue = reconciliation.balanceDifference !== null && reconciliation.balanceDifference !== undefined ? Number(reconciliation.balanceDifference) : null;
    const balanceWarning = balanceDifferenceValue !== null && Math.abs(balanceDifferenceValue) > BALANCE_TOLERANCE;
    const isProcessingJobs = reconciliation.status === 'PROCESSING';
    const jobsProgressLabel = isProcessingJobs && reconciliation.totalJobs
        ? `${reconciliation.completedJobs ?? 0}/${reconciliation.totalJobs}`
        : null;
    const finalizeDisabledReason = isProcessingJobs
        ? 'Aguardando a importação em lote finalizar.'
        : balanceWarning
            ? 'A diferença entre o extrato e o sistema precisa ser zerada.'
            : pendingImportedCount > 0
                ? 'Concilie ou descarte todas as transações antes de finalizar.'
                : null;
    const canFinalize = !finalizeDisabledReason;

    const handleSelectImported = (tx: ImportedTransaction) => {
        if (tx.status !== 'PENDING' && tx.status !== 'SUGGESTED') return;
        setSelectedImported(tx.id === selectedImported?.id ? null : tx);
        setSelectedManual(null);
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
             toast({ variant: 'destructive', title: 'Erro ao criar transação.' });
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
            toast({ variant: 'destructive', title: 'Erro na Importação em Lote', description: error.response?.data?.message || 'Tente novamente.' });
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

    const statusLabelMap = {
        PROCESSING: 'Processando',
        PENDING_REVIEW: 'Aguardando revisão',
        COMPLETED: 'Finalizado',
        FAILED: 'Falhou',
    } as const;

    return (
        <>
            <div className="space-y-4 mb-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Status atual</p>
                        <Badge variant="outline">{statusLabelMap[reconciliation.status]}</Badge>
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-3">
                        {reconciliation.statementTimezone && <span>Fuso: {reconciliation.statementTimezone.replace(/_/g, ' ')}</span>}
                        {jobsProgressLabel && (
                            <span className="flex items-center gap-1 text-foreground">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Processando {jobsProgressLabel}
                            </span>
                        )}
                    </div>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                    <Card className="border border-border/50">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Extrato do banco</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Saldo inicial</p>
                                <p className="text-lg font-semibold">{formatMoney(bankOpening, statementCurrency)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Saldo final</p>
                                <p className="text-lg font-semibold">{formatMoney(bankClosing, statementCurrency)}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border border-border/50">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Saldo no Dexpesas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div>
                                <p className="text-xs text-muted-foreground">Saldo inicial</p>
                                <p className="text-lg font-semibold">{formatMoney(systemOpening, statementCurrency)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Saldo final</p>
                                <p className="text-lg font-semibold">{formatMoney(systemClosing, statementCurrency)}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className={cn("border", balanceWarning ? "border-destructive/50 bg-destructive/5" : "border-border/50 bg-muted/20")}>
                        <CardHeader className="pb-1">
                            <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">Diferença</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <p className={cn("text-2xl font-bold", balanceWarning ? "text-destructive" : "text-green-600 dark:text-green-400")}>
                                {balanceDifferenceValue !== null ? formatMoney(balanceDifferenceValue, statementCurrency) : '—'}
                            </p>
                            <p className="text-xs text-muted-foreground">Limite aceitável: {formatMoney(BALANCE_TOLERANCE, statementCurrency)}</p>
                            <p className="text-xs text-muted-foreground">Pendentes: {pendingImportedCount}</p>
                        </CardContent>
                    </Card>
                </div>
                {balanceWarning && (
                    <Alert variant="destructive">
                        <AlertTitle>Diferença encontrada</AlertTitle>
                        <AlertDescription>
                            Ajuste ou crie lançamentos até que o saldo final do Dexpesas seja igual ao saldo final do extrato para finalizar a reconciliação.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
            <div className="flex flex-col lg:flex-row items-start gap-4">
                {/* Coluna de Transações Importadas */}
                <Card className="w-full lg:flex-1">
                    <CardHeader className="p-3 border-b">
                         <CardTitle className="text-base">Transações do Extrato</CardTitle>
                         <div className="flex items-center gap-2 pt-2">
                            <Input 
                                placeholder="Buscar em importados..." 
                                value={importedSearch} 
                                onChange={(e) => setImportedSearch(e.target.value)} 
                                className="h-8 flex-grow"
                            />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                                        <CalendarIcon className="h-4 w-4"/>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={importedDate} onSelect={setImportedDate} /></PopoverContent>
                            </Popover>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[60vh]">
                            <Table>
                                <TableBody>
                                    {filteredImported.map(tx => {
                                        const { text, icon: Icon, color, bgColor } = statusConfig[tx.status];
                                        const isSelected = selectedImported?.id === tx.id;
                                        const isSuggested = tx.status === 'SUGGESTED';
                                        const isReconciled = tx.status === 'RECONCILED';
                                        
                                        return (
                                            <TableRow
                                                key={tx.id}
                                                onClick={() => handleSelectImported(tx)}
                                                className={cn(
                                                    'transition-colors',
                                                    (tx.status === 'PENDING' || tx.status === 'SUGGESTED') && 'cursor-pointer hover:bg-muted/50',
                                                    isSelected && 'bg-primary/10',
                                                    isSuggested && !isSelected && bgColor,
                                                    isReconciled && 'opacity-50'
                                                )}
                                            >
                                                <TableCell>
                                                    <p className="font-medium">{tx.description}</p>
                                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                        <span>{format(parseISO(tx.date), 'dd/MM/yyyy')}</span>
                                                        <Badge variant="outline" className={cn("text-xs border-none font-medium", color, bgColor)}>
                                                            <Icon className="h-3 w-3 mr-1" />{text}
                                                            {isSuggested && tx.similarityScore && (
                                                                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                                                                <span className='ml-1.5 flex items-center gap-1'><Award className='h-3 w-3'/> {tx.similarityScore}%</span>
                                                                </TooltipTrigger><TooltipContent><p>Score de Confiança</p></TooltipContent></Tooltip></TooltipProvider>
                                                            )}
                                                        </Badge>
                                                        {(tx.status === 'PENDING' || tx.status === 'SUGGESTED') && (
                                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); handleCreateFromImported(tx.id) }} disabled={isCreating === tx.id}>
                                                                {isCreating === tx.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <PlusCircle className="h-4 w-4 text-green-500"/>}
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className={cn("text-right font-semibold", tx.type === 'CREDIT' ? 'text-green-500' : 'text-destructive')}>
                                                    {formatCurrency(tx.amount, tx.type)}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>

                {/* Coluna Central de Ações */}
                <div className="flex flex-row lg:flex-col items-center justify-center gap-2 py-4 w-full lg:w-auto">
                    <Button 
                        onClick={() => onMatch(selectedImported!.id, selectedManual!.id)}
                        disabled={!selectedImported || !selectedManual}
                        className="w-full lg:w-auto"
                    >
                        <ArrowRight className="h-4 w-4 mr-2"/>
                        Conciliar
                    </Button>
                    {selectedImported && (
                        <Button 
                            variant="secondary"
                            onClick={() => onDiscard(selectedImported.id)}
                            className="w-full lg:w-auto"
                        >
                            <X className="h-4 w-4 mr-2"/>
                            Descartar
                        </Button>
                    )}
                    {pendingImportedCount > 0 && (
                        <Button 
                            variant="secondary"
                            onClick={() => setDialogState('import')}
                            disabled={isCreatingAll}
                            className="w-full lg:w-auto"
                        >
                        {isCreatingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Inbox className="mr-2 h-4 w-4" />}
                        Importar ({pendingImportedCount})
                        </Button>
                    )}
                </div>

                {/* Coluna de Transações Manuais */}
                <Card className="w-full lg:flex-1">
                     <CardHeader className="p-3 border-b">
                         <CardTitle className="text-base">Seus Lançamentos</CardTitle>
                         <div className="flex items-center gap-2 pt-2">
                            <Input 
                                placeholder="Buscar em seus lançamentos..." 
                                value={manualSearch} 
                                onChange={(e) => setManualSearch(e.target.value)} 
                                className="h-8 flex-grow"
                            />
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" size="icon" className="h-8 w-8 shrink-0">
                                        <CalendarIcon className="h-4 w-4"/>
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={manualDate} onSelect={setManualDate} /></PopoverContent>
                            </Popover>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[60vh]">
                            <Table>
                                <TableBody>
                                    {pendingManualTransactions.length > 0 ? pendingManualTransactions.map(tx => {
                                        const isSelected = selectedManual?.id === tx.id;
                                        const isSuggested = reconciliation.importedTransactions.some(itx => itx.status === 'SUGGESTED' && itx.manualTransactionId === tx.id);

                                        return (
                                            <TableRow
                                                key={tx.id}
                                                onClick={() => handleSelectManual(tx)}
                                                className={cn(
                                                    "cursor-pointer hover:bg-muted/50 transition-colors", 
                                                    isSelected && "bg-primary/10",
                                                    isSuggested && !isSelected && "bg-yellow-500/10",
                                                )}
                                            >
                                                <TableCell>
                                                    <p className="font-medium">{tx.descricao}</p>
                                                    <p className="text-xs text-muted-foreground">{format(parseISO(tx.data), 'dd/MM/yyyy')}</p>
                                                </TableCell>
                                                <TableCell className={cn("text-right font-semibold", tx.tipo === 'receita' ? 'text-green-500' : 'text-red-500')}>
                                                    {formatCurrency(tx.valor, tx.tipo === 'receita' ? 'CREDIT' : 'DEBIT')}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    }) : (
                                        <TableRow><TableCell colSpan={2} className="h-24 text-center">Nenhum lançamento manual pendente.</TableCell></TableRow>
                                    )}
                                    {reconciledManualTransactions.length > 0 && (
                                        <>
                                            <TableRow><TableCell colSpan={2} className="p-2 bg-muted"><p className="text-xs font-semibold text-muted-foreground">Já Conciliados</p></TableCell></TableRow>
                                            {reconciledManualTransactions.map(tx => (
                                                <TableRow key={tx.id} className="opacity-50">
                                                    <TableCell><p className="font-medium">{tx.descricao}</p><p className="text-xs text-muted-foreground">{format(parseISO(tx.data), 'dd/MM/yyyy')}</p></TableCell>
                                                    <TableCell className={cn("text-right font-semibold", tx.tipo === 'receita' ? 'text-green-500' : 'text-destructive')}>
                                                        {formatCurrency(tx.valor, tx.tipo === 'receita' ? 'CREDIT' : 'DEBIT')}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </>
                                    )}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
            <div className="w-full flex justify-end items-center gap-2 mt-4 border-t pt-4">
                <Button onClick={() => setDialogState('cancel')} variant="destructive">
                    <Ban className="h-4 w-4 mr-2"/> Cancelar
                </Button>
                {finalizeDisabledReason ? (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="w-full lg:w-auto">
                                    <Button disabled variant="default" className="bg-green-600 opacity-60 cursor-not-allowed">
                                        <SquareCheckBig className="h-4 w-4 mr-2"/> Finalizar Reconciliação
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">{finalizeDisabledReason}</TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                ) : (
                    <Button onClick={() => setDialogState('finalize')} variant="default" className="bg-green-600 hover:bg-green-700">
                        <SquareCheckBig className="h-4 w-4 mr-2"/> Finalizar Reconciliação
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
