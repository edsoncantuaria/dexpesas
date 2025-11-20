'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Filter, ReceiptText, Trash2, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { CellSharedExpense, Clan, CellSharedAccount } from '@/lib/definitions';
import { toCurrency } from './utils';
import { NewSharedExpenseDialog, SettleSharedExpenseDialog, SettlementTarget } from './expenses-dialogs';
import { motion, AnimatePresence } from 'framer-motion';

interface ExpensesTabProps {
    cellId: string;
    expenses: CellSharedExpense[];
    members: Clan['members'];
    sharedAccounts: CellSharedAccount[];
    onRefresh: () => Promise<void>;
    currentUserId?: string;
    isLeader: boolean;
}

export function ExpensesTab({
    cellId,
    expenses,
    members,
    sharedAccounts,
    onRefresh,
    currentUserId,
    isLeader,
}: ExpensesTabProps) {
    const { toast } = useToast();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [settlementTarget, setSettlementTarget] = useState<SettlementTarget | null>(null);
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
    const [searchTerm, setSearchTerm] = useState('');
    const [monthFilter, setMonthFilter] = useState('');
    const [isFilterSheetOpen, setFilterSheetOpen] = useState(false);

    const activeFilterCount = [Boolean(searchTerm.trim()), statusFilter !== 'ALL', Boolean(monthFilter)].filter(Boolean).length;

    const resetFilters = () => {
        setSearchTerm('');
        setStatusFilter('ALL');
        setMonthFilter('');
    };

    const filteredExpenses = useMemo(() => {
        return expenses
            .filter((expense) => {
                if (searchTerm.trim() && !expense.description.toLowerCase().includes(searchTerm.trim().toLowerCase())) {
                    return false;
                }
                if (monthFilter) {
                    const expenseDate = new Date(expense.expenseDate || expense.createdAt);
                    const yearMonth = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
                    if (yearMonth !== monthFilter) {
                        return false;
                    }
                }
                if (statusFilter === 'PENDING') {
                    return expense.participants.some((participant) => !participant.transaction?.pago);
                }
                if (statusFilter === 'PAID') {
                    return expense.participants.length > 0 && expense.participants.every((participant) => participant.transaction?.pago);
                }
                return true;
            })
            .sort((a, b) => {
                const dateA = new Date(a.expenseDate || a.createdAt).getTime();
                const dateB = new Date(b.expenseDate || b.createdAt).getTime();
                return dateB - dateA;
            });
    }, [expenses, searchTerm, monthFilter, statusFilter]);

    const handleDeleteExpense = async (expenseId: string) => {
        try {
            await api.delete(`/cells/${cellId}/expenses/${expenseId}`);
            toast({ title: 'Despesa removida.' });
            await onRefresh();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao excluir despesa', description: error?.response?.data?.message });
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <CardTitle>Despesas Compartilhadas</CardTitle>
                        <CardDescription>Registre contas da casa e acompanhe quem já pagou.</CardDescription>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
                        <div className="flex items-center gap-2">
                            <Sheet open={isFilterSheetOpen} onOpenChange={setFilterSheetOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="outline" size="sm" className="w-full sm:w-auto relative">
                                        <Filter className="mr-2 h-4 w-4" />
                                        Filtros
                                        {activeFilterCount > 0 && (
                                            <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-primary text-[8px] text-primary-foreground">
                                                {activeFilterCount}
                                            </span>
                                        )}
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left">
                                    <SheetHeader>
                                        <SheetTitle>Filtrar rateios</SheetTitle>
                                        <SheetDescription>Busque por descrição, status ou mês.</SheetDescription>
                                    </SheetHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="space-y-2">
                                            <Label>Descrição</Label>
                                            <Input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Ex.: Conta de luz" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Todas</SelectItem>
                                                    <SelectItem value="PENDING">Pendentes</SelectItem>
                                                    <SelectItem value="PAID">Quitadas</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Mês</Label>
                                            <Input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
                                        </div>
                                    </div>
                                    <SheetFooter>
                                        <Button variant="ghost" onClick={resetFilters} disabled={!activeFilterCount}>Limpar</Button>
                                        <SheetClose asChild><Button>Aplicar</Button></SheetClose>
                                    </SheetFooter>
                                </SheetContent>
                            </Sheet>
                        </div>
                        <Button size="sm" className="w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
                            <ReceiptText className="mr-2 h-4 w-4" />
                            Nova despesa
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {filteredExpenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <ReceiptText className="h-12 w-12 mb-4 opacity-20" />
                            <p>Nenhuma despesa encontrada.</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            <AnimatePresence>
                                {filteredExpenses.map((expense) => {
                                    const expenseDate = new Date(expense.expenseDate || expense.createdAt);
                                    return (
                                        <motion.div
                                            key={expense.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="rounded-xl border bg-card p-4 space-y-4 shadow-sm hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex flex-wrap items-start justify-between gap-3">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-semibold text-lg leading-none">{expense.description}</p>
                                                        {expense.category && <Badge variant="outline" className="text-[10px]">{expense.category.nome}</Badge>}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {toCurrency(expense.totalAmount)} • {expenseDate.toLocaleDateString('pt-BR')}
                                                    </p>
                                                </div>
                                                {isLeader && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
                                                                <AlertDialogDescription>Isso removerá o registro para todos os membros.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)} className="bg-destructive text-destructive-foreground">
                                                                    Excluir
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Participantes</p>
                                                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                                    {expense.participants.map((p) => {
                                                        const isMe = p.userId === currentUserId;
                                                        const isPaid = Boolean(p.transaction?.pago);
                                                        const memberName = members.find(m => m.userId === p.userId)?.user?.name || 'Membro';

                                                        return (
                                                            <div key={p.id} className={`flex items-center justify-between rounded-md border p-2 text-sm ${isMe ? 'bg-primary/5 border-primary/20' : 'bg-muted/20'}`}>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{isMe ? 'Você' : memberName}</span>
                                                                    <span className="text-xs text-muted-foreground">{toCurrency(p.amount)}</span>
                                                                </div>
                                                                {isPaid ? (
                                                                    <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-200 flex items-center gap-1">
                                                                        <CheckCircle2 className="h-3 w-3" /> Pago
                                                                    </Badge>
                                                                ) : isMe ? (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="default"
                                                                        className="h-7 text-xs"
                                                                        onClick={() => setSettlementTarget({
                                                                            expenseId: expense.id,
                                                                            description: expense.description,
                                                                            participant: {
                                                                                id: p.id,
                                                                                amountOwed: p.amount,
                                                                                defaultAccountId: p.transaction?.accountId
                                                                            }
                                                                        })}
                                                                    >
                                                                        Pagar
                                                                    </Button>
                                                                ) : (
                                                                    <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 flex items-center gap-1">
                                                                        <Clock className="h-3 w-3" /> Pendente
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    )}
                </CardContent>
            </Card>

            <NewSharedExpenseDialog
                open={isDialogOpen}
                onOpenChange={setDialogOpen}
                cellId={cellId}
                members={members}
                sharedAccounts={sharedAccounts}
                onSuccess={async () => {
                    setDialogOpen(false);
                    await onRefresh();
                }}
            />

            <SettleSharedExpenseDialog
                target={settlementTarget}
                cellId={cellId}
                onClose={() => setSettlementTarget(null)}
                onSuccess={async () => {
                    setSettlementTarget(null);
                    await onRefresh();
                }}
            />
        </div>
    );
}
