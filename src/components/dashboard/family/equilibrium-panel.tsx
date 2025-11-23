'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { CellEquilibriumEntry, Clan } from '@/lib/definitions';
import { parseAmount, toCurrency } from './utils';
import { MemberAvatar } from '@/components/dashboard/clans/member-avatar';
import { Scale, ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface EquilibriumPanelProps {
    entries: CellEquilibriumEntry[];
    currentUserId?: string;
    cellId: string;
    members: Clan['members'];
    onRefresh: () => Promise<void>;
}

export function EquilibriumPanel({
    entries,
    currentUserId,
    cellId,
    members,
    onRefresh,
}: EquilibriumPanelProps) {
    const { toast } = useToast();

    const memberLookup = useMemo(() => {
        const pairs = (members || []).map((member) => [
            member.userId,
            {
                name: member.user?.name || 'Integrante',
                avatarUrl: member.user?.avatarUrl || null,
            },
        ]);
        return Object.fromEntries(pairs);
    }, [members]);

    const positives = entries.filter((entry) => entry.balance > 0);
    const negatives = entries.filter((entry) => entry.balance < 0);
    const totalReceive = positives.reduce((acc, entry) => acc + entry.balance, 0);
    const totalPay = negatives.reduce((acc, entry) => acc + Math.abs(entry.balance), 0);

    const [settlementContext, setSettlementContext] = useState<{
        mode: 'PAY' | 'RECEIVE';
        amount: string;
        counterpartId: string;
        options: Array<{ id: string; name: string; balance: number }>;
    } | null>(null);
    const [settlementNotes, setSettlementNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const closeDialog = () => {
        setSettlementContext(null);
        setSettlementNotes('');
    };

    const openSettlementDialog = (
        mode: 'PAY' | 'RECEIVE',
        counterpartPool: CellEquilibriumEntry[],
        suggestedAmount: number,
    ) => {
        if (!counterpartPool.length) {
            toast({
                variant: 'destructive',
                title: 'Nenhum membro encontrado para compensar.',
                description: 'Convide mais pessoas ou aguarde outros registros.',
            });
            return;
        }
        setSettlementContext({
            mode,
            amount: Math.abs(suggestedAmount).toFixed(2),
            counterpartId: counterpartPool[0].userId,
            options: counterpartPool.map((entry) => ({
                id: entry.userId,
                name: memberLookup[entry.userId]?.name || 'Integrante',
                balance: entry.balance,
            })),
        });
        setSettlementNotes('');
    };

    const handleRegisterSettlement = async () => {
        if (!settlementContext) return;
        const parsed = parseAmount(settlementContext.amount);
        if (!Number.isFinite(parsed) || parsed <= 0 || !settlementContext.counterpartId) {
            toast({ variant: 'destructive', title: 'Informe um valor válido.' });
            return;
        }
        try {
            setIsSubmitting(true);
            await api.post(`/cells/${cellId}/equilibrium/settlements`, {
                counterpartId: settlementContext.counterpartId,
                amount: parsed,
                direction: settlementContext.mode,
                notes: settlementNotes || undefined,
            });
            toast({ title: 'Registro adicionado ao Equilíbrio.' });
            closeDialog();
            await onRefresh();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Não foi possível registrar o acerto.',
                description: error?.response?.data?.message || 'Tente novamente em instantes.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <Card className="border-none shadow-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Scale className="h-5 w-5 text-primary" />
                        Equilíbrio de Contribuição
                    </CardTitle>
                    <CardDescription>
                        Visualize quem pagou a mais e quem deve a quem. O sistema sugere acertos para zerar as diferenças.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Quem deve receber */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-green-600 flex items-center gap-2">
                                <ArrowUpRight className="h-4 w-4" />
                                A receber (Credores)
                            </h3>
                            {positives.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">Ninguém tem saldo a receber.</p>
                            ) : (
                                <div className="space-y-3">
                                    {positives.map((entry) => {
                                        const isMe = entry.userId === currentUserId;
                                        return (
                                            <motion.div
                                                key={entry.userId}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`flex items-center justify-between rounded-lg border p-3 ${isMe ? 'bg-green-50 border-green-200 dark:bg-green-900/20' : 'bg-card'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <MemberAvatar
                                                        avatarUrl={memberLookup[entry.userId]?.avatarUrl}
                                                        name={memberLookup[entry.userId]?.name || 'Integrante'}
                                                        className="h-8 w-8 ring-2 ring-green-200"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-sm">{isMe ? 'Você' : memberLookup[entry.userId]?.name}</p>
                                                        <p className="text-xs text-muted-foreground">Pagou a mais</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-green-600">{toCurrency(entry.balance)}</p>
                                                    {isMe && negatives.length > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 text-[10px] text-green-700 hover:text-green-800 hover:bg-green-100 mt-1"
                                                            onClick={() => openSettlementDialog('RECEIVE', negatives, entry.balance)}
                                                        >
                                                            Registrar recebimento
                                                        </Button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Quem deve pagar */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-medium text-red-600 flex items-center gap-2">
                                <ArrowDownLeft className="h-4 w-4" />
                                A pagar (Devedores)
                            </h3>
                            {negatives.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic">Ninguém tem saldo a pagar.</p>
                            ) : (
                                <div className="space-y-3">
                                    {negatives.map((entry) => {
                                        const isMe = entry.userId === currentUserId;
                                        return (
                                            <motion.div
                                                key={entry.userId}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className={`flex items-center justify-between rounded-lg border p-3 ${isMe ? 'bg-red-50 border-red-200 dark:bg-red-900/20' : 'bg-card'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <MemberAvatar
                                                        avatarUrl={memberLookup[entry.userId]?.avatarUrl}
                                                        name={memberLookup[entry.userId]?.name || 'Integrante'}
                                                        className="h-8 w-8 ring-2 ring-red-200"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-sm">{isMe ? 'Você' : memberLookup[entry.userId]?.name}</p>
                                                        <p className="text-xs text-muted-foreground">Pagou a menos</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-red-600">{toCurrency(Math.abs(entry.balance))}</p>
                                                    {isMe && positives.length > 0 && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="h-6 text-[10px] text-red-700 hover:text-red-800 hover:bg-red-100 mt-1"
                                                            onClick={() => openSettlementDialog('PAY', positives, Math.abs(entry.balance))}
                                                        >
                                                            Registrar pagamento
                                                        </Button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {entries.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <CheckCircle2 className="h-12 w-12 mb-2 opacity-20" />
                            <p>Tudo equilibrado! Ninguém deve nada a ninguém.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {settlementContext && (
                { settlementContext && (
                    <ResponsiveDialog
                        isOpen={Boolean(settlementContext)}
                        setIsOpen={(open) => (!open ? closeDialog() : null)}
                        title={settlementContext.mode === 'PAY' ? 'Registrar pagamento' : 'Registrar recebimento'}
                        description="Informe o valor e a pessoa envolvida para abater a dívida no sistema."
                    >
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Pessoa {settlementContext.mode === 'PAY' ? 'que recebeu' : 'que pagou'}</Label>
                                <Select
                                    value={settlementContext.counterpartId}
                                    onValueChange={(val) => setSettlementContext({ ...settlementContext, counterpartId: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {settlementContext.options.map((opt) => (
                                            <SelectItem key={opt.id} value={opt.id}>
                                                {opt.name} ({toCurrency(Math.abs(opt.balance))})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Valor (R$)</Label>
                                <Input
                                    type="number"
                                    value={settlementContext.amount}
                                    onChange={(e) => setSettlementContext({ ...settlementContext, amount: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Observações (opcional)</Label>
                                <Textarea
                                    value={settlementNotes}
                                    onChange={(e) => setSettlementNotes(e.target.value)}
                                    placeholder="Ex.: Pix enviado dia 15..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end pt-4">
                            <Button onClick={handleRegisterSettlement} disabled={isSubmitting}>
                                {isSubmitting ? 'Salvando...' : 'Confirmar'}
                            </Button>
                        </div>
                    </ResponsiveDialog>
                )}
            )}
        </>
    );
}
