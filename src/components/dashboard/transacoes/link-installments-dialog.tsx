// src/components/dashboard/transacoes/link-installments-dialog.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Link as LinkIcon, AlertTriangle } from 'lucide-react';
import { format, parseISO, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import api from '@/lib/api';
import { Transaction } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LinkInstallmentsDialogProps {
    transaction: Transaction | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface CandidateGroup {
    month: string; // YYYY-MM
    date: Date;
    transactions: Transaction[];
}

export function LinkInstallmentsDialog({
    transaction,
    open,
    onOpenChange,
    onSuccess
}: LinkInstallmentsDialogProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [candidates, setCandidates] = useState<CandidateGroup[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [totalInstallments, setTotalInstallments] = useState<number>(2);

    useEffect(() => {
        if (open && transaction) {
            fetchCandidates();
            setSelectedIds(new Set([transaction.id]));
            setTotalInstallments(2);
        } else {
            setCandidates([]);
            setSelectedIds(new Set());
        }
    }, [open, transaction]);

    const fetchCandidates = async () => {
        if (!transaction) return;
        setLoading(true);
        try {
            const response = await api.get(`/transactions/${transaction.id}/installment-candidates`);
            const data: Transaction[] = response.data;

            // Agrupar por mês
            const groups: Record<string, CandidateGroup> = {};

            // Adiciona a transação pivô também para visualização
            const allTransactions = [...data, transaction].sort((a, b) =>
                new Date(a.data).getTime() - new Date(b.data).getTime()
            );

            allTransactions.forEach(t => {
                const date = new Date(t.data);
                const monthKey = format(date, 'yyyy-MM');

                if (!groups[monthKey]) {
                    groups[monthKey] = {
                        month: monthKey,
                        date: date,
                        transactions: []
                    };
                }
                groups[monthKey].transactions.push(t);
            });

            setCandidates(Object.values(groups).sort((a, b) => a.date.getTime() - b.date.getTime()));

            // Sugerir total de parcelas baseado no número de meses encontrados
            setTotalInstallments(Math.max(2, Object.keys(groups).length));

        } catch (error) {
            console.error('Erro ao buscar candidatos:', error);
            toast({
                title: 'Erro',
                description: 'Erro ao buscar transações similares.',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            // Não permite desmarcar o pivô (opcional, mas faz sentido manter o foco)
            if (id === transaction?.id) return;
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleSave = async () => {
        if (!transaction) return;
        setSaving(true);

        try {
            // Preparar payload
            // Ordenar selecionados por data para definir número da parcela
            const selectedTransactions = candidates
                .flatMap(g => g.transactions)
                .filter(t => selectedIds.has(t.id))
                .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

            const linkedTransactions = selectedTransactions.map((t, index) => ({
                id: t.id,
                installmentNumber: index + 1
            }));

            if (linkedTransactions.length < 2) {
                toast({
                    title: 'Atenção',
                    description: 'Selecione pelo menos 2 transações para vincular.',
                    variant: 'destructive',
                });
                setSaving(false);
                return;
            }

            if (totalInstallments < linkedTransactions.length) {
                toast({
                    title: 'Atenção',
                    description: `O total de parcelas (${totalInstallments}) é menor que o número de transações selecionadas (${linkedTransactions.length}).`,
                    variant: 'destructive',
                });
                setSaving(false);
                return;
            }

            await api.post(`/transactions/${transaction.id}/link-installments`, {
                linkedTransactions,
                totalInstallments
            });

            toast({
                title: 'Sucesso',
                description: 'Parcelas vinculadas com sucesso!',
            });
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Erro ao vincular:', error);
            toast({
                title: 'Erro',
                description: 'Erro ao vincular parcelas.',
                variant: 'destructive',
            });
        } finally {
            setSaving(false);
        }
    };

    const selectedCount = selectedIds.size;

    return (
        <ResponsiveDialog
            isOpen={open}
            setIsOpen={onOpenChange}
            title="Vincular Parcelas"
            description="Agrupe transações importadas soltas em um único parcelamento."
        >
            <div className="flex items-center gap-4 py-4">
                <div className="grid gap-1.5 flex-1">
                    <Label>Total de Parcelas</Label>
                    <Input
                        type="number"
                        min={selectedCount}
                        max={99}
                        value={totalInstallments}
                        onChange={(e) => setTotalInstallments(Number(e.target.value))}
                    />
                </div>
                <div className="flex-1 flex items-center justify-end text-sm text-muted-foreground">
                    {selectedCount} transações selecionadas
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <ScrollArea className="flex-1 pr-4 -mr-4 max-h-[400px]">
                    <div className="space-y-6">
                        {candidates.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                Nenhuma transação similar encontrada nos meses vizinhos.
                            </div>
                        ) : (
                            candidates.map((group) => (
                                <div key={group.month} className="space-y-2">
                                    <h4 className="text-sm font-medium text-muted-foreground sticky top-0 bg-background py-1 z-10">
                                        {format(group.date, 'MMMM yyyy', { locale: ptBR })}
                                    </h4>
                                    <div className="grid gap-2">
                                        {group.transactions.map((t) => {
                                            const isSelected = selectedIds.has(t.id);
                                            const isPivot = t.id === transaction?.id;

                                            return (
                                                <div
                                                    key={t.id}
                                                    className={cn(
                                                        "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
                                                        isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                                                        isPivot && "ring-1 ring-primary ring-offset-1"
                                                    )}
                                                    onClick={() => toggleSelection(t.id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={() => toggleSelection(t.id)}
                                                            disabled={isPivot}
                                                        />
                                                        <div>
                                                            <p className="font-medium text-sm">{t.descricao}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {format(new Date(t.data), "dd 'de' MMM", { locale: ptBR })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-medium text-sm">
                                                            {Number(t.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                        </p>
                                                        {isPivot && (
                                                            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                                                                Original
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t mt-4">
                <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                    Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving || selectedCount < 2}>
                    {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Vincular {selectedCount} Parcelas
                </Button>
            </div>
        </ResponsiveDialog>
    );
}
