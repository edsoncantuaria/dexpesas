// src/components/dashboard/reconcile/history-list.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Reconciliation } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertCircle, CheckCircle2, CreditCard, GitCompareArrows, Landmark, Loader2, Play, SquareCheckBig } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';

type ReconciliationHistory = Reconciliation & {
    account?: { nome: string };
    card?: { nome: string };
    reconciledCount: number;
    _count: { importedTransactions: number };
    targetName: string; // Adicionado para simplificar
}

const statusConfig: Record<string, { text: string; icon: any; color: string; isSpinning?: boolean }> = {
    PROCESSING: { text: 'Processando', icon: Loader2, color: 'text-blue-500', isSpinning: true },
    PENDING_REVIEW: { text: 'Pendente', icon: AlertCircle, color: 'text-yellow-500' },
    COMPLETED: { text: 'Concluída', icon: CheckCircle2, color: 'text-green-500' },
    FAILED: { text: 'Falhou', icon: AlertCircle, color: 'text-destructive' },
};

interface HistoryListProps {
    onResume: (params: { reconciliationId: string }) => void;
    onFinalize: (reconciliationId: string) => void;
}

export function ReconciliationHistoryList({ onResume, onFinalize }: HistoryListProps) {
    const [history, setHistory] = useState<ReconciliationHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const fetchHistory = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/reconcile/history');
            setHistory(response.data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar histórico' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    if (isLoading) {
        return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                ))}
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 py-16 text-center text-muted-foreground">
                <GitCompareArrows className="h-12 w-12" />
                <p className="font-medium">Nenhum histórico encontrado.</p>
                <p className="text-sm">Você ainda não realizou nenhuma reconciliação.</p>
            </div>
        )
    }

    // Renderização para Mobile
    if (isMobile) {
        return (
            <div className="space-y-3">
                {history.map(rec => {
                    const config = statusConfig[rec.status as keyof typeof statusConfig] || statusConfig.FAILED;
                    const Icon = config.icon;
                    const TargetIcon = rec.accountId ? Landmark : CreditCard;
                    const isPending = rec.status === 'PENDING_REVIEW';
                    return (
                        <Card key={rec.id} className={cn("transition-colors", !isPending && "bg-muted/30")}>
                            <CardContent className="p-3 space-y-2">
                                <div className="flex justify-between items-start">
                                    <div className='flex items-center gap-2'>
                                        <TargetIcon className='h-4 w-4 text-muted-foreground' />
                                        <span className="font-semibold">{rec.targetName}</span>
                                    </div>
                                    <Badge variant={isPending ? 'default' : 'secondary'} className={cn(config.color, !isPending && 'border-transparent')}>
                                        <Icon className={cn("h-3 w-3 mr-1.5", config.isSpinning && 'animate-spin')} />
                                        {config.text}
                                    </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p>Data: {format(new Date(rec.createdAt), "dd/MM/yy HH:mm", { locale: ptBR })}</p>
                                    <p>Transações: {rec.reconciledCount} / {rec._count.importedTransactions}</p>
                                </div>
                                {isPending && (
                                    <div className="flex gap-2 pt-2">
                                        <Button size="sm" className="flex-1" onClick={() => onResume({ reconciliationId: rec.id })}>
                                            <Play className="mr-2 h-4 w-4" /> Retomar
                                        </Button>
                                        <Button size="sm" variant="secondary" className="flex-1" onClick={() => onFinalize(rec.id)}>
                                            <SquareCheckBig className="mr-2 h-4 w-4" /> Finalizar
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        )
    }

    // Renderização para Desktop
    return (
        <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Conta/Cartão</TableHead>
                        <TableHead>Transações</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {history.map(rec => {
                        const config = statusConfig[rec.status as keyof typeof statusConfig] || statusConfig.FAILED;
                        const Icon = config.icon;
                        const TargetIcon = rec.accountId ? Landmark : CreditCard;
                        const isPending = rec.status === 'PENDING_REVIEW';

                        return (
                            <TableRow key={rec.id} className={cn("transition-colors", !isPending && 'opacity-70')}>
                                <TableCell>{format(new Date(rec.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</TableCell>
                                <TableCell>
                                    <div className='flex items-center gap-2'>
                                        <TargetIcon className='h-4 w-4 text-muted-foreground' />
                                        <span>{rec.targetName}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant="outline">{rec.reconciledCount} / {rec._count.importedTransactions}</Badge>
                                </TableCell>
                                <TableCell>
                                    <div className={cn("flex items-center gap-2 font-medium", config.color)}>
                                        <Icon className={cn("h-4 w-4", config.isSpinning && 'animate-spin')} />
                                        <span>{config.text}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    {isPending && (
                                        <div className="flex gap-2 justify-end">
                                            <Button size="sm" variant="outline" onClick={() => onResume({ reconciliationId: rec.id })}>
                                                Retomar
                                            </Button>
                                            <Button size="sm" onClick={() => onFinalize(rec.id)}>
                                                Finalizar
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
