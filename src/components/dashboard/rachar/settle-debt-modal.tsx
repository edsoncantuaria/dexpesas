'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { SplitGroupMember, Account } from '@/lib/definitions';
import { useEffect } from 'react';

interface SettleDebtModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    members: SplitGroupMember[];
    initialFromId?: string;
    initialToId?: string;
    initialAmount?: number;
    onSuccess: () => void;
}

export function SettleDebtModal({ open, onOpenChange, groupId, members, onSuccess, initialFromId, initialToId, initialAmount }: SettleDebtModalProps) {
    const [fromId, setFromId] = useState(initialFromId || '');
    const [toId, setToId] = useState(initialToId || '');
    const [amount, setAmount] = useState(initialAmount?.toString() || '');
    const [accountId, setAccountId] = useState<string>('none');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            api.get('/accounts').then(res => setAccounts(res.data)).catch(console.error);
            if (initialFromId) setFromId(initialFromId);
            if (initialToId) setToId(initialToId);
            if (initialAmount) setAmount(initialAmount.toString());
        }
    }, [open, initialFromId, initialToId, initialAmount]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (fromId === toId) {
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Pagador e recebedor não podem ser a mesma pessoa.',
            });
            return;
        }

        setIsLoading(true);

        try {
            await api.post(`/rachar/groups/${groupId}/settlements`, {
                fromId,
                toId,
                amount: parseFloat(amount),
                accountId: accountId !== 'none' ? accountId : undefined
            });

            toast({
                title: 'Pagamento registrado!',
                description: 'A dívida foi quitada.',
            });

            setAmount('');
            onSuccess();
        } catch (error) {
            console.error('Erro ao registrar pagamento:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao registrar',
                description: 'Tente novamente mais tarde.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ResponsiveDialog
            isOpen={open}
            setIsOpen={onOpenChange}
            title="Registrar Pagamento"
            description="Registre quando alguém pagar uma dívida diretamente a outro membro."
        >
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="fromId">Pagador (Quem pagou)</Label>
                        <Select value={fromId} onValueChange={setFromId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione quem pagou" />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map(member => (
                                    <SelectItem key={member.id} value={member.id}>
                                        {member.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="toId">Recebedor (Quem recebeu)</Label>
                        <Select value={toId} onValueChange={setToId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione quem recebeu" />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map(member => (
                                    <SelectItem key={member.id} value={member.id}>
                                        {member.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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
                        <Label htmlFor="account">Conta para Debitar (Opcional)</Label>
                        <Select value={accountId} onValueChange={setAccountId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma conta (Opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">Não vincular a transação</SelectItem>
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>
                                        {acc.nome}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Se selecionado, uma despesa será criada automaticamente na sua conta.
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Registrando...' : 'Registrar Pagamento'}
                    </Button>
                </DialogFooter>
            </form>
        </ResponsiveDialog>
    );
}
