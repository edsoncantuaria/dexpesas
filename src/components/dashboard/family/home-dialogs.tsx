'use client';

import { useState, useEffect, useMemo } from 'react';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { handleApiError } from '@/lib/error-handler';
import { useUser } from '@/contexts/UserContext';
import { Clan, CellBudget, CellFund, Category, Account } from '@/lib/definitions';
import { parseAmount, toCurrency } from './utils';
import { withdrawalRoleOptions } from '@/app/dashboard/cells/withdrawal-options';
import { Loader2 } from 'lucide-react';

export function CreateBudgetDialog({ open, onOpenChange, onSuccess, members }: { open: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => Promise<void>; members: Clan['members'] }) {
    const initialFormState = {
        label: '',
        limit: '',
        type: 'CELL' as CellBudget['type'],
        splitMode: 'EQUAL' as 'EQUAL' | 'PERCENTAGE',
        categoryId: '',
        recurrenceType: 'MONTHLY' as CellBudget['recurrenceType'],
        recurrenceDays: '',
        effectiveFrom: '',
        effectiveTo: '',
    };
    const [form, setForm] = useState(initialFormState);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showErrors, setShowErrors] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();
    const cellId = user?.clanId || user?.clanMembership?.clanId || user?.clanMemberships?.[0]?.clanId || '';
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoadingCategories, setIsLoadingCategories] = useState(true);

    const buildDefaultDistribution = () => {
        const initial: Record<string, number> = {};
        const totalMembers = members?.length || 0;
        const defaultShare = totalMembers ? Math.round(100 / totalMembers) : 100;
        members?.forEach((member) => {
            initial[member.userId] = defaultShare;
        });
        return initial;
    };
    const [distribution, setDistribution] = useState<Record<string, number>>(buildDefaultDistribution);

    useEffect(() => {
        if (open) {
            setForm(initialFormState);
            setDistribution(buildDefaultDistribution());
            setShowErrors(false);
        }
    }, [open, members]);

    useEffect(() => {
        if (!open) return;
        let isMounted = true;
        const loadCategories = async () => {
            setIsLoadingCategories(true);
            try {
                const response = await api.get('/categories');
                if (isMounted) {
                    setCategories(response.data || []);
                }
            } catch (error) {
                if (isMounted) {
                    handleApiError(error, toast, 'Não foi possível carregar categorias');
                    setCategories([]);
                }
            } finally {
                if (isMounted) setIsLoadingCategories(false);
            }
        };
        loadCategories();
        return () => { isMounted = false; };
    }, [open, toast]);

    const parsedLimit = parseAmount(form.limit);
    const labelIsValid = Boolean(form.label.trim());
    const categoryIsValid = Boolean(form.categoryId);
    const limitIsValid = Number.isFinite(parsedLimit) && parsedLimit > 0;
    const customRecurrenceValue = Number(form.recurrenceDays);
    const customRecurrenceValid = form.recurrenceType !== 'CUSTOM' || (Number.isFinite(customRecurrenceValue) && customRecurrenceValue >= 1 && customRecurrenceValue <= 90);
    const splitModeEnabled = form.type !== 'PERSONAL';
    const totalDistribution = Object.values(distribution).reduce((acc, value) => acc + Number(value || 0), 0);
    const distributionValid = !splitModeEnabled || form.splitMode !== 'PERCENTAGE' || totalDistribution === 100;

    const errors = useMemo(() => ({
        label: labelIsValid ? null : 'Dê um nome para o envelope.',
        category: categoryIsValid ? null : 'Selecione a categoria que receberá o espelho.',
        limit: limitIsValid ? null : 'Informe um limite maior que zero.',
        recurrence: customRecurrenceValid ? null : 'Recorrência personalizada deve ficar entre 1 e 90 dias.',
        distribution: distributionValid ? null : 'A soma das porcentagens precisa fechar 100%.',
    }), [labelIsValid, categoryIsValid, limitIsValid, customRecurrenceValid, distributionValid]);

    const formIsValid = Object.values(errors).every((value) => !value);

    const handleSubmit = async () => {
        if (!formIsValid) {
            setShowErrors(true);
            toast({ variant: 'destructive', title: 'Revise os campos destacados antes de salvar.' });
            return;
        }
        try {
            setIsSubmitting(true);
            let splitConfig: Record<string, unknown> | null = null;
            if (splitModeEnabled) {
                if (form.splitMode === 'EQUAL') {
                    splitConfig = { mode: 'EQUAL' };
                } else {
                    splitConfig = {
                        mode: 'PERCENTAGE',
                        weights: Object.entries(distribution).map(([memberId, percentage]) => ({
                            memberId,
                            weight: Number(percentage),
                        })),
                    };
                }
            }
            await api.post(`/cells/${cellId}/budgets`, {
                label: form.label,
                limit: parsedLimit,
                type: form.type,
                categoryId: form.categoryId,
                splitConfig,
                recurrenceType: form.recurrenceType,
                recurrenceDays: form.recurrenceType === 'CUSTOM' ? Number(form.recurrenceDays) || null : form.recurrenceType === 'BIWEEKLY' ? 14 : undefined,
                effectiveFrom: form.effectiveFrom || undefined,
                effectiveTo: form.effectiveTo || undefined,
            });
            toast({ title: 'Orçamento criado!' });
            await onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            handleApiError(error, toast, 'Não foi possível criar o orçamento');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ResponsiveDialog
            isOpen={open}
            setIsOpen={onOpenChange}
            title="Novo Orçamento Compartilhado"
            description="Crie um envelope de gastos visível para a família."
        >
            <div className="grid gap-4 py-4 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Nome do envelope</Label>
                        <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ex: Mercado Semanal" className={showErrors && errors.label ? 'border-destructive' : ''} />
                        {showErrors && errors.label && <p className="text-xs text-destructive">{errors.label}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Categoria (espelho)</Label>
                        <Select value={form.categoryId} onValueChange={(value) => setForm({ ...form, categoryId: value })}>
                            <SelectTrigger className={showErrors && errors.category ? 'border-destructive' : ''}>
                                <SelectValue placeholder={isLoadingCategories ? 'Carregando...' : 'Selecione...'} />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {showErrors && errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Limite do período</Label>
                        <Input type="number" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} placeholder="0,00" className={showErrors && errors.limit ? 'border-destructive' : ''} />
                        {showErrors && errors.limit && <p className="text-xs text-destructive">{errors.limit}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label>Tipo de compartilhamento</Label>
                        <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as CellBudget['type'] })}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CELL">Compartilhado (Todos)</SelectItem>
                                <SelectItem value="HYBRID">Híbrido (Pessoal + Grupo)</SelectItem>
                                <SelectItem value="PERSONAL">Apenas Referência</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                {splitModeEnabled && (
                    <div className="space-y-3 rounded-md border p-3">
                        <div className="flex items-center justify-between">
                            <Label>Divisão do limite</Label>
                            <Select value={form.splitMode} onValueChange={(value) => setForm({ ...form, splitMode: value as 'EQUAL' | 'PERCENTAGE' })}>
                                <SelectTrigger className="w-32 h-8 text-xs">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="EQUAL">Igualitária</SelectItem>
                                    <SelectItem value="PERCENTAGE">Porcentagem</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {form.splitMode === 'PERCENTAGE' && (
                            <div className="space-y-2">
                                {members?.map((member) => (
                                    <div key={member.userId} className="flex items-center justify-between text-sm">
                                        <span>{member.user?.name || 'Membro'}</span>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                className="w-20 h-8 text-right"
                                                value={distribution[member.userId] || 0}
                                                onChange={(e) => setDistribution({ ...distribution, [member.userId]: Number(e.target.value) })}
                                            />
                                            <span className="text-muted-foreground">%</span>
                                        </div>
                                    </div>
                                ))}
                                <div className="flex justify-end pt-1">
                                    <span className={`text-xs font-medium ${totalDistribution !== 100 ? 'text-destructive' : 'text-green-600'}`}>
                                        Total: {totalDistribution}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div className="flex justify-end pt-4">
                <Button onClick={handleSubmit} disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {isSubmitting ? 'Criando...' : 'Criar Orçamento'}
                </Button>
            </div>
        </ResponsiveDialog>
    );
}

export function CreateFundDialog({ open, onOpenChange, onSuccess, members }: { open: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => Promise<void>; members: Clan['members'] }) {
    const [form, setForm] = useState({
        name: '',
        targetAmount: '',
        custodianId: '',
        withdrawalRoles: [] as string[],
        mirrorToCustodian: false,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();
    const cellId = user?.clanId || user?.clanMembership?.clanId || user?.clanMemberships?.[0]?.clanId || '';

    const handleSubmit = async () => {
        if (!form.name || !form.targetAmount) return;
        try {
            setIsSubmitting(true);
            await api.post(`/cells/${cellId}/funds`, {
                name: form.name,
                targetAmount: parseAmount(form.targetAmount),
                custodianId: form.custodianId || undefined,
                withdrawalRoles: form.withdrawalRoles.length > 0 ? form.withdrawalRoles : undefined,
                mirrorToCustodian: form.mirrorToCustodian,
            });
            toast({ title: 'Caixinha criada!' });
            await onSuccess();
            onOpenChange(false);
            setForm({ name: '', targetAmount: '', custodianId: '', withdrawalRoles: [], mirrorToCustodian: false });
        } catch (error: any) {
            handleApiError(error, toast, 'Erro ao criar caixinha');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ResponsiveDialog
            isOpen={open}
            setIsOpen={onOpenChange}
            title="Nova Caixinha"
            description="Reserve dinheiro para objetivos comuns."
        >
            <div className="space-y-4 py-4 overflow-y-auto max-h-[70vh]">
                <div>
                    <Label>Nome do objetivo</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Viagem de Férias" />
                </div>
                <div>
                    <Label>Meta de valor</Label>
                    <Input type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} placeholder="0,00" />
                </div>
                <div>
                    <Label>Responsável (Custodiante)</Label>
                    <Select value={form.custodianId} onValueChange={(value) => setForm({ ...form, custodianId: value })}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione quem guarda o dinheiro..." />
                        </SelectTrigger>
                        <SelectContent>
                            {members?.map((member) => (
                                <SelectItem key={member.userId} value={member.userId}>
                                    {member.user?.name || 'Membro'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-[0.8rem] text-muted-foreground mt-1">
                        O custodiante deve ter a conta bancária onde o dinheiro ficará guardado.
                    </p>
                </div>
                {form.custodianId && (
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="mirror"
                            checked={form.mirrorToCustodian}
                            onCheckedChange={(checked) => setForm({ ...form, mirrorToCustodian: Boolean(checked) })}
                        />
                        <Label htmlFor="mirror">Criar meta espelho no perfil do responsável</Label>
                    </div>
                )}
                <div className="space-y-2">
                    <Label>Quem pode registrar resgates?</Label>
                    <div className="flex flex-wrap gap-2">
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(withdrawalRoleOptions).map(([roleKey, roleData]) => (
                                <div key={roleKey} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`role-${roleKey}`}
                                        checked={form.withdrawalRoles.includes(roleKey)}
                                        onCheckedChange={(checked) => {
                                            setForm(prev => ({
                                                ...prev,
                                                withdrawalRoles: checked
                                                    ? [...prev.withdrawalRoles, roleKey]
                                                    : prev.withdrawalRoles.filter(r => r !== roleKey)
                                            }))
                                        }}
                                    />
                                    <Label htmlFor={`role-${roleKey}`}>{roleData.label}</Label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <Button onClick={handleSubmit} disabled={isSubmitting || !form.name || !form.targetAmount}>
                    {isSubmitting ? 'Criando...' : 'Criar Caixinha'}
                </Button>
            </div>
        </ResponsiveDialog>
    );
}

export function FundActionDialog({
    fund,
    mode,
    onClose,
    onSuccess,
}: {
    fund: CellFund | null;
    mode: 'DEPOSIT' | 'WITHDRAW' | null;
    onClose: () => void;
    onSuccess: () => Promise<void>;
}) {
    const [amount, setAmount] = useState('');
    const [notes, setNotes] = useState('');
    const [sourceAccountId, setSourceAccountId] = useState('');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useUser();
    const cellId = user?.clanId || user?.clanMembership?.clanId || user?.clanMemberships?.[0]?.clanId || '';

    useEffect(() => {
        if (mode && fund) {
            api.get('/accounts').then(res => setAccounts(res.data || [])).catch(() => setAccounts([]));
        }
    }, [mode, fund]);

    const handleSubmit = async () => {
        if (!fund || !mode || !amount) return;
        try {
            setIsSubmitting(true);
            const endpoint = mode === 'DEPOSIT' ? `/cells/${cellId}/funds/${fund.id}/deposit` : `/cells/${cellId}/funds/${fund.id}/withdraw`;
            await api.post(endpoint, {
                amount: parseAmount(amount),
                notes: notes || undefined,
                sourceAccountId: sourceAccountId || undefined,
            });
            toast({ title: mode === 'DEPOSIT' ? 'Aporte registrado!' : 'Resgate registrado!' });
            await onSuccess();
            onClose();
            setAmount('');
            setNotes('');
            setSourceAccountId('');
        } catch (error: any) {
            handleApiError(error, toast, 'Erro na operação');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ResponsiveDialog
            isOpen={Boolean(fund && mode)}
            setIsOpen={(open) => !open && onClose()}
            title={mode === 'DEPOSIT' ? 'Registrar Aporte' : 'Registrar Resgate'}
            description={mode === 'DEPOSIT' ? `Adicionar dinheiro à caixinha "${fund?.name}"` : `Retirar dinheiro da caixinha "${fund?.name}"`}
        >
            <div className="space-y-4 py-4">
                <div>
                    <Label>Valor</Label>
                    <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0,00" />
                </div>
                <div>
                    <Label>Conta de origem/destino (Opcional)</Label>
                    <Select value={sourceAccountId} onValueChange={setSourceAccountId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione a conta..." />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map((acc) => (
                                <SelectItem key={acc.id} value={acc.id}>{acc.nome}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <Label>Observações</Label>
                    <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ex: Economia do mês" />
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <Button onClick={handleSubmit} disabled={isSubmitting || !amount}>
                    {isSubmitting ? 'Salvando...' : 'Confirmar'}
                </Button>
            </div>
        </ResponsiveDialog>
    );
}
