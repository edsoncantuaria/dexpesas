'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { SplitGroupMember, SplitExpense } from '@/lib/definitions';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUpload } from '@/components/ui/file-upload';

interface AddExpenseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    members: SplitGroupMember[];
    onSuccess: () => void;
    expenseToEdit?: SplitExpense | null;
}

export function AddExpenseModal({ open, onOpenChange, groupId, members, onSuccess, expenseToEdit }: AddExpenseModalProps) {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [paidById, setPaidById] = useState('');
    const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
    const [splitType, setSplitType] = useState<'EQUAL' | 'PERCENTAGE' | 'EXACT'>('EQUAL');
    const [percentages, setPercentages] = useState<Record<string, number>>({});
    const [exactAmounts, setExactAmounts] = useState<Record<string, number>>({});
    const [payerType, setPayerType] = useState<'SINGLE' | 'MULTIPLE'>('SINGLE');
    const [multiplePayers, setMultiplePayers] = useState<Record<string, number>>({});
    const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            if (expenseToEdit) {
                setDescription(expenseToEdit.description);
                setAmount(expenseToEdit.amount.toString());
                setPaidById(expenseToEdit.paidById);
                setAttachmentUrl(expenseToEdit.attachmentUrl || null);
                setSplitType((expenseToEdit.splitType as any) || 'EQUAL');

                if (expenseToEdit.payers && expenseToEdit.payers.length > 1) {
                    setPayerType('MULTIPLE');
                    const payersMap: Record<string, number> = {};
                    expenseToEdit.payers.forEach(p => {
                        payersMap[p.memberId] = Number(p.amount);
                    });
                    setMultiplePayers(payersMap);
                } else {
                    setPayerType('SINGLE');
                    setMultiplePayers({});
                }

                if (expenseToEdit.splits) {
                    setSelectedMembers(expenseToEdit.splits.map(s => s.memberId));
                    // ... existing logic for splits ...
                    const pcts: Record<string, number> = {};
                    const amts: Record<string, number> = {};
                    expenseToEdit.splits.forEach(s => {
                        if (s.percentage) pcts[s.memberId] = Number(s.percentage);
                        if (s.amount) amts[s.memberId] = Number(s.amount);
                    });
                    setPercentages(pcts);
                    setExactAmounts(amts);
                } else {
                    setSelectedMembers(members.map(m => m.id));
                }
            } else {
                setDescription('');
                setAmount('');
                setAttachmentUrl(null);
                setSplitType('EQUAL');
                setPercentages({});
                setExactAmounts({});
                setSelectedMembers(members.map(m => m.id));
                if (members.length > 0) {
                    setPaidById(members[0].id);
                }
                setPayerType('SINGLE');
                setMultiplePayers({});
            }
        }
    }, [open, members, expenseToEdit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedMembers.length === 0) {
            toast({
                variant: 'destructive',
                title: 'Selecione pelo menos um membro',
                description: 'A despesa deve ser dividida com alguém.',
            });
            return;
        }

        setIsLoading(true);
        const totalAmount = parseFloat(amount);

        let splits: any[] = [];

        if (splitType === 'EQUAL') {
            const splitAmount = totalAmount / selectedMembers.length;
            splits = selectedMembers.map(memberId => ({
                memberId,
                amount: splitAmount,
                percentage: (100 / selectedMembers.length)
            }));
        } else if (splitType === 'PERCENTAGE') {
            splits = selectedMembers.map(memberId => {
                const pct = percentages[memberId] || 0;
                return {
                    memberId,
                    amount: (totalAmount * pct) / 100,
                    percentage: pct
                };
            });

            // Validate percentages sum to 100
            const totalPct = splits.reduce((sum, s) => sum + s.percentage, 0);
            if (Math.abs(totalPct - 100) > 0.01) {
                toast({
                    variant: 'destructive',
                    title: 'Erro na divisão',
                    description: `As porcentagens devem somar 100%. Total atual: ${totalPct.toFixed(2)}%`,
                });
                setIsLoading(false);
                return;
            }
        } else if (splitType === 'EXACT') {
            splits = selectedMembers.map(memberId => ({
                memberId,
                amount: exactAmounts[memberId] || 0,
                percentage: (((exactAmounts[memberId] || 0) / totalAmount) * 100)
            }));

            // Validate amounts sum to total
            const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0);
            if (Math.abs(totalSplit - totalAmount) > 0.01) {
                toast({
                    variant: 'destructive',
                    title: 'Erro na divisão',
                    description: `Os valores devem somar R$ ${totalAmount.toFixed(2)}. Total atual: R$ ${totalSplit.toFixed(2)}`,
                });
                setIsLoading(false);
                return;
            }
        }

        let payersList: { memberId: string, amount: number }[] = [];
        if (payerType === 'SINGLE') {
            payersList = [{ memberId: paidById, amount: totalAmount }];
        } else {
            payersList = Object.entries(multiplePayers)
                .filter(([_, amt]) => amt > 0)
                .map(([memberId, amt]) => ({ memberId, amount: amt }));

            const totalPaid = payersList.reduce((sum, p) => sum + p.amount, 0);
            if (Math.abs(totalPaid - totalAmount) > 0.01) {
                toast({
                    variant: 'destructive',
                    title: 'Erro nos pagamentos',
                    description: `A soma dos pagamentos (R$ ${totalPaid.toFixed(2)}) deve ser igual ao total (R$ ${totalAmount.toFixed(2)}).`,
                });
                setIsLoading(false);
                return;
            }
        }
        try {
            if (expenseToEdit) {
                await api.put(`/rachar/groups/${groupId}/expenses/${expenseToEdit.id}`, {
                    description,
                    amount: totalAmount,
                    paidById,
                    splits,
                    splitType,
                    attachmentUrl
                });
                toast({ title: 'Despesa atualizada!' });
            } else {
                await api.post(`/rachar/groups/${groupId}/expenses`, {
                    description,
                    amount: totalAmount,
                    paidById,
                    splits,
                    splitType,
                    attachmentUrl
                });
                toast({ title: 'Despesa adicionada!' });
            }

            setDescription('');
            setAmount('');
            setAttachmentUrl(null);
            onSuccess();
        } catch (error) {
            console.error('Erro ao adicionar despesa:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao adicionar despesa',
                description: 'Tente novamente mais tarde.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleMember = (memberId: string) => {
        setSelectedMembers(prev =>
            prev.includes(memberId)
                ? prev.filter(id => id !== memberId)
                : [...prev, memberId]
        );
    };

    const toggleAllMembers = () => {
        if (selectedMembers.length === members.length) {
            setSelectedMembers([]);
        } else {
            setSelectedMembers(members.map(m => m.id));
        }
    };

    return (
        <ResponsiveDialog
            isOpen={open}
            setIsOpen={onOpenChange}
            title={expenseToEdit ? "Editar Despesa" : "Adicionar Despesa"}
            description={expenseToEdit ? "Atualize os detalhes da despesa." : "Registre um gasto para dividir com o grupo."}
        >
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Ex: Jantar, Uber, Mercado..."
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Valor (R$)</Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0,00"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Pago por</Label>
                        <Tabs value={payerType} onValueChange={(v) => setPayerType(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-2 mb-2">
                                <TabsTrigger value="SINGLE">Único Pagador</TabsTrigger>
                                <TabsTrigger value="MULTIPLE">Múltiplos Pagadores</TabsTrigger>
                            </TabsList>

                            {payerType === 'SINGLE' ? (
                                <Select value={paidById} onValueChange={setPaidById}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Quem pagou?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {members.map(member => (
                                            <SelectItem key={member.id} value={member.id}>
                                                {member.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : (
                                <div className="space-y-2 border rounded-md p-2 max-h-40 overflow-y-auto">
                                    {members.map(member => (
                                        <div key={member.id} className="flex items-center justify-between gap-2">
                                            <Label className="text-sm font-normal min-w-[100px] truncate">{member.name}</Label>
                                            <div className="relative w-32">
                                                <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">R$</span>
                                                <Input
                                                    type="number"
                                                    className="h-8 pl-6 text-right"
                                                    value={multiplePayers[member.id] || ''}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        setMultiplePayers({ ...multiplePayers, [member.id]: isNaN(val) ? 0 : val });
                                                    }}
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-between items-center pt-2 border-t mt-2">
                                        <span className="text-xs font-medium">Total Pago:</span>
                                        <span className={`text-sm font-bold ${Math.abs(Object.values(multiplePayers).reduce((a, b) => a + b, 0) - Number(amount || 0)) < 0.01
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                            }`}>
                                            R$ {Object.values(multiplePayers).reduce((a, b) => a + b, 0).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </Tabs>
                    </div>
                    <div className="grid gap-2">
                        <Label>Divisão</Label>
                        <Tabs value={splitType} onValueChange={(v) => setSplitType(v as any)} className="w-full">
                            <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="EQUAL">Igual</TabsTrigger>
                                <TabsTrigger value="PERCENTAGE">%</TabsTrigger>
                                <TabsTrigger value="EXACT">R$</TabsTrigger>
                            </TabsList>

                            <div className="mt-2 border rounded-md p-2 max-h-60 overflow-y-auto">
                                {/* EQUAL SPLIT */}
                                {splitType === 'EQUAL' && (
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between mb-2 pb-2 border-b">
                                            <Label className="text-xs text-muted-foreground">Selecionar membros</Label>
                                            <div className="flex items-center space-x-2">
                                                <Checkbox
                                                    id="select-all"
                                                    checked={selectedMembers.length === members.length}
                                                    onCheckedChange={toggleAllMembers}
                                                />
                                                <Label htmlFor="select-all" className="text-xs text-muted-foreground cursor-pointer">
                                                    Todos
                                                </Label>
                                            </div>
                                        </div>
                                        {members.map(member => (
                                            <div key={member.id} className="flex items-center justify-between py-1">
                                                <div className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`split-${member.id}`}
                                                        checked={selectedMembers.includes(member.id)}
                                                        onCheckedChange={() => toggleMember(member.id)}
                                                    />
                                                    <Label htmlFor={`split-${member.id}`} className="text-sm font-normal cursor-pointer">
                                                        {member.name}
                                                    </Label>
                                                </div>
                                                {selectedMembers.includes(member.id) && (
                                                    <span className="text-xs text-muted-foreground">
                                                        R$ {(Number(amount || 0) / selectedMembers.length).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* PERCENTAGE SPLIT */}
                                {splitType === 'PERCENTAGE' && (
                                    <div className="space-y-2">
                                        {members.map(member => {
                                            const isSelected = selectedMembers.includes(member.id);
                                            const pct = percentages[member.id] || 0;
                                            const val = (Number(amount || 0) * pct) / 100;

                                            return (
                                                <div key={member.id} className="flex items-center justify-between py-1 gap-2">
                                                    <div className="flex items-center space-x-2 min-w-[100px]">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedMembers([...selectedMembers, member.id]);
                                                                    setPercentages({ ...percentages, [member.id]: 0 });
                                                                } else {
                                                                    setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                                                                    const newPcts = { ...percentages };
                                                                    delete newPcts[member.id];
                                                                    setPercentages(newPcts);
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-sm truncate">{member.name}</span>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative w-20">
                                                                <Input
                                                                    type="number"
                                                                    className="h-8 pr-6 text-right"
                                                                    value={pct || ''}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value);
                                                                        setPercentages({ ...percentages, [member.id]: isNaN(val) ? 0 : val });
                                                                    }}
                                                                />
                                                                <span className="absolute right-2 top-1.5 text-xs text-muted-foreground">%</span>
                                                            </div>
                                                            <span className="text-xs text-muted-foreground w-20 text-right">
                                                                R$ {val.toFixed(2)}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        <div className="flex justify-between items-center pt-2 border-t mt-2">
                                            <span className="text-xs font-medium">Total:</span>
                                            <span className={`text-sm font-bold ${Math.abs(Object.values(percentages).reduce((a, b) => a + b, 0) - 100) < 0.01
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                                }`}>
                                                {Object.values(percentages).reduce((a, b) => a + b, 0).toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* EXACT AMOUNT SPLIT */}
                                {splitType === 'EXACT' && (
                                    <div className="space-y-2">
                                        {members.map(member => {
                                            const isSelected = selectedMembers.includes(member.id);
                                            const val = exactAmounts[member.id] || 0;
                                            const pct = (val / Number(amount || 0)) * 100;

                                            return (
                                                <div key={member.id} className="flex items-center justify-between py-1 gap-2">
                                                    <div className="flex items-center space-x-2 min-w-[100px]">
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onCheckedChange={(checked) => {
                                                                if (checked) {
                                                                    setSelectedMembers([...selectedMembers, member.id]);
                                                                    setExactAmounts({ ...exactAmounts, [member.id]: 0 });
                                                                } else {
                                                                    setSelectedMembers(selectedMembers.filter(id => id !== member.id));
                                                                    const newAmts = { ...exactAmounts };
                                                                    delete newAmts[member.id];
                                                                    setExactAmounts(newAmts);
                                                                }
                                                            }}
                                                        />
                                                        <span className="text-sm truncate">{member.name}</span>
                                                    </div>
                                                    {isSelected && (
                                                        <div className="flex items-center gap-2">
                                                            <div className="relative w-24">
                                                                <span className="absolute left-2 top-1.5 text-xs text-muted-foreground">R$</span>
                                                                <Input
                                                                    type="number"
                                                                    className="h-8 pl-6 text-right"
                                                                    value={val || ''}
                                                                    onChange={(e) => {
                                                                        const val = parseFloat(e.target.value);
                                                                        setExactAmounts({ ...exactAmounts, [member.id]: isNaN(val) ? 0 : val });
                                                                    }}
                                                                />
                                                            </div>
                                                            <span className="text-xs text-muted-foreground w-12 text-right">
                                                                {isFinite(pct) ? pct.toFixed(0) : 0}%
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        <div className="flex justify-between items-center pt-2 border-t mt-2">
                                            <span className="text-xs font-medium">Total:</span>
                                            <span className={`text-sm font-bold ${Math.abs(Object.values(exactAmounts).reduce((a, b) => a + b, 0) - Number(amount || 0)) < 0.01
                                                ? 'text-green-600'
                                                : 'text-red-600'
                                                }`}>
                                                R$ {Object.values(exactAmounts).reduce((a, b) => a + b, 0).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </Tabs>
                    </div>

                    <div className="grid gap-2">
                        <Label>Comprovante (Opcional)</Label>
                        {attachmentUrl ? (
                            <div className="flex items-center justify-between p-2 border rounded-md bg-muted/50">
                                <span className="text-sm truncate max-w-[200px]">Comprovante anexado</span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 h-8"
                                    onClick={() => setAttachmentUrl(null)}
                                >
                                    Remover
                                </Button>
                            </div>
                        ) : (
                            <FileUpload
                                onValueChange={(url) => setAttachmentUrl(url)}
                                className="h-32"
                            />
                        )}
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Salvando...' : (expenseToEdit ? 'Atualizar' : 'Salvar Despesa')}
                    </Button>
                </DialogFooter>
            </form>
        </ResponsiveDialog>
    );
}
