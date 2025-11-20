'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Clan, CellSharedAccount, Category, Account, CellSharedExpense } from '@/lib/definitions';
import { parseAmount, toCurrency } from './utils';
import { Loader2 } from 'lucide-react';

export interface SettlementTarget {
    expenseId: string;
    description: string;
    participant: {
        id: string;
        amountOwed: number;
        defaultAccountId?: string;
    };
}

export function NewSharedExpenseDialog({
    open,
    onOpenChange,
    cellId,
    members,
    sharedAccounts,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    cellId: string;
    members: Clan['members'];
    sharedAccounts: CellSharedAccount[];
    onSuccess: () => Promise<void>;
}) {
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [mode, setMode] = useState<'EQUAL' | 'CUSTOM'>('EQUAL');
    const today = new Date().toISOString().slice(0, 10);
    const [form, setForm] = useState({
        description: '',
        categoryId: '',
        totalAmount: '',
        expenseDate: today,
    });
    const [splits, setSplits] = useState<Record<string, string>>({});
    const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({});
    const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({});

    const accountsByMember = useMemo(() => {
        const map: Record<string, Account[]> = {};
        sharedAccounts.forEach((record) => {
            if (!record.account || !record.account.userId) {
                return;
            }
            const ownerId = record.account.userId;
            if (!map[ownerId]) {
                map[ownerId] = [];
            }
            map[ownerId].push(record.account);
        });
        return map;
    }, [sharedAccounts]);

    const memberHasAccount = (memberId: string) => (accountsByMember[memberId]?.length || 0) > 0;

    useEffect(() => {
        let active = true;
        if (!open) return;
        setIsLoadingCategories(true);
        api
            .get('/categories')
            .then((response) => {
                if (!active) return;
                setCategories(response.data || []);
            })
            .catch(() => {
                if (!active) return;
                toast({ variant: 'destructive', title: 'Erro ao carregar categorias.' });
            })
            .finally(() => {
                if (active) setIsLoadingCategories(false);
            });
        return () => { active = false; };
    }, [open, toast]);

    useEffect(() => {
        if (open) {
            setForm({ description: '', categoryId: '', totalAmount: '', expenseDate: today });
            setSplits({});
            setSelectedMembers({});
            setSelectedAccounts({});
            setMode('EQUAL');
        }
    }, [open, today]);

    useEffect(() => {
        if (mode === 'EQUAL') {
            const total = parseAmount(form.totalAmount);
            const participants = Object.keys(selectedMembers).filter((id) => selectedMembers[id]);
            const count = participants.length;
            if (count > 0 && total > 0) {
                const share = total / count;
                const newSplits: Record<string, string> = {};
                participants.forEach((id) => {
                    newSplits[id] = share.toFixed(2);
                });
                setSplits(newSplits);
            } else {
                setSplits({});
            }
        }
    }, [form.totalAmount, selectedMembers, mode]);

    const handleSubmit = async () => {
        const total = parseAmount(form.totalAmount);
        if (!form.description || total <= 0 || !form.categoryId) {
            toast({ variant: 'destructive', title: 'Preencha todos os campos obrigatórios.' });
            return;
        }

        const participants = Object.keys(selectedMembers)
            .filter((id) => selectedMembers[id])
            .map((userId) => {
                const amount = parseAmount(splits[userId]);
                const accountId = selectedAccounts[userId];
                return { userId, amount, accountId };
            });

        if (participants.length === 0) {
            toast({ variant: 'destructive', title: 'Selecione ao menos um participante.' });
            return;
        }

        const invalidParticipant = participants.find((p) => !p.accountId);
        if (invalidParticipant) {
            toast({ variant: 'destructive', title: 'Todos os participantes devem ter uma conta selecionada.' });
            return;
        }

        const sumSplits = participants.reduce((acc, p) => acc + p.amount, 0);
        if (Math.abs(sumSplits - total) > 0.05) {
            toast({ variant: 'destructive', title: `A soma das divisões (${toCurrency(sumSplits)}) não bate com o total (${toCurrency(total)}).` });
            return;
        }

        try {
            setIsSubmitting(true);
            await api.post(`/cells/${cellId}/expenses`, {
                description: form.description,
                totalAmount: total,
                categoryId: form.categoryId,
                expenseDate: new Date(form.expenseDate).toISOString(),
                participants,
            });
            toast({ title: 'Despesa criada com sucesso!' });
            await onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao criar despesa', description: error?.response?.data?.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const splitSum = Object.values(splits).reduce((acc, val) => acc + parseAmount(val), 0);
    const total = parseAmount(form.totalAmount);
    const totalsMatch = Math.abs(splitSum - total) < 0.05;
    const hasSelection = Object.values(selectedMembers).some(Boolean);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nova Despesa Compartilhada</DialogTitle>
                    <DialogDescription>Registre uma conta para dividir com a família.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex: Aluguel" />
                        </div>
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select value={form.categoryId} onValueChange={(value) => setForm({ ...form, categoryId: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingCategories ? 'Carregando...' : 'Selecione...'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Valor Total</Label>
                            <Input type="number" value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} placeholder="0,00" />
                        </div>
                        <div className="space-y-2">
                            <Label>Data</Label>
                            <Input type="date" value={form.expenseDate} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
                        </div>
                    </div>

                    <div className="space-y-3 rounded-md border p-3">
                        <div className="flex items-center justify-between">
                            <Label>Divisão</Label>
                            <div className="flex items-center gap-2">
                                <Select value={mode} onValueChange={(val: 'EQUAL' | 'CUSTOM') => setMode(val)}>
                                    <SelectTrigger className="w-32 h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EQUAL">Igualitária</SelectItem>
                                        <SelectItem value="CUSTOM">Personalizada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span>Participantes</span>
                                <span className={!totalsMatch && total > 0 ? 'text-destructive' : 'text-green-600'}>
                                    Soma: {toCurrency(splitSum)} {totalsMatch ? '' : '(ajuste necessário)'}
                                </span>
                            </div>
                            <div className="space-y-3">
                                {members.map((member) => {
                                    const memberAccounts = accountsByMember[member.userId] || [];
                                    const hasAccount = memberAccounts.length > 0;
                                    const isChecked = Boolean(selectedMembers[member.userId] && hasAccount);
                                    return (
                                        <div key={member.userId} className={`rounded-lg border p-3 space-y-2 text-sm ${isChecked ? 'bg-accent/20' : ''}`}>
                                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Checkbox
                                                        checked={isChecked}
                                                        disabled={!hasAccount}
                                                        onCheckedChange={(checked) => {
                                                            if (!hasAccount) {
                                                                toast({ variant: 'destructive', title: 'Vincule uma conta para incluir este membro.' });
                                                                return;
                                                            }
                                                            setSelectedMembers(prev => ({ ...prev, [member.userId]: Boolean(checked) }));
                                                            if (checked && !selectedAccounts[member.userId]) {
                                                                setSelectedAccounts(prev => ({ ...prev, [member.userId]: memberAccounts[0]?.id || '' }));
                                                            }
                                                        }}
                                                    />
                                                    <span>{member.user?.name || 'Membro'}</span>
                                                </div>
                                                {hasAccount ? (
                                                    <Select
                                                        value={selectedAccounts[member.userId] || memberAccounts[0]?.id || ''}
                                                        onValueChange={(value) => setSelectedAccounts(prev => ({ ...prev, [member.userId]: value }))}
                                                        disabled={!isChecked}
                                                    >
                                                        <SelectTrigger className="w-full sm:w-48 h-8">
                                                            <SelectValue placeholder="Conta de origem" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {memberAccounts.map((acc) => (
                                                                <SelectItem key={acc.id} value={acc.id}>{acc.nome}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ) : (
                                                    <p className="text-xs text-muted-foreground">Sem conta compartilhada</p>
                                                )}
                                            </div>
                                            <Input
                                                className="sm:w-40 ml-auto"
                                                type="number"
                                                min={0}
                                                value={splits[member.userId] ?? ''}
                                                onChange={(e) => setSplits(prev => ({ ...prev, [member.userId]: e.target.value }))}
                                                disabled={mode === 'EQUAL' || !isChecked}
                                                placeholder="0,00"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                            {!hasSelection && <p className="text-xs text-destructive">Inclua ao menos um membro com conta vinculada.</p>}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {isSubmitting ? 'Criando...' : 'Cadastrar Despesa'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function SettleSharedExpenseDialog({
    target,
    cellId,
    onClose,
    onSuccess,
}: {
    target: SettlementTarget | null;
    cellId: string;
    onClose: () => void;
    onSuccess: () => Promise<void>;
}) {
    const { toast } = useToast();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!target) {
            setAccounts([]);
            setSelectedAccountId('');
            return;
        }
        let active = true;
        setIsLoadingAccounts(true);
        api
            .get('/accounts')
            .then((response) => {
                if (!active) return;
                const list = response.data || [];
                setAccounts(list);
                const defaultAccountId = target.participant.defaultAccountId;
                if (defaultAccountId && list.some((account) => account.id === defaultAccountId)) {
                    setSelectedAccountId(defaultAccountId);
                } else {
                    setSelectedAccountId(list[0]?.id || '');
                }
            })
            .catch(() => {
                if (!active) return;
                setAccounts([]);
                setSelectedAccountId('');
            })
            .finally(() => {
                if (active) setIsLoadingAccounts(false);
            });
        return () => { active = false; };
    }, [target]);

    if (!target) return null;

    const handleSubmit = async () => {
        if (!selectedAccountId) {
            toast({ variant: 'destructive', title: 'Selecione a conta utilizada.' });
            return;
        }
        try {
            setIsSubmitting(true);
            await api.post(`/cells/${cellId}/expenses/${target.expenseId}/settle`, {
                participantId: target.participant.id,
                accountId: selectedAccountId,
            });
            toast({ title: 'Pagamento registrado!' });
            await onSuccess();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao registrar pagamento', description: error?.response?.data?.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const amount = toCurrency(target.participant.amountOwed);

    return (
        <Dialog open={Boolean(target)} onOpenChange={(open) => (!open ? onClose() : null)}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Registrar pagamento</DialogTitle>
                    <DialogDescription>{target.description}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                    <div>
                        <Label>Valor a pagar</Label>
                        <Input value={amount} disabled className="font-bold" />
                    </div>
                    <div>
                        <Label>Conta utilizada</Label>
                        {isLoadingAccounts ? (
                            <p className="text-sm text-muted-foreground">Carregando contas...</p>
                        ) : accounts.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Você não possui contas cadastradas.</p>
                        ) : (
                            <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma conta" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((account) => (
                                        <SelectItem key={account.id} value={account.id}>{account.nome}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isSubmitting || accounts.length === 0}>
                        {isSubmitting ? 'Salvando...' : 'Confirmar pagamento'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
