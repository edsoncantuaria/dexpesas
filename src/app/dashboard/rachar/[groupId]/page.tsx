
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, DollarSign, ArrowLeft, Trash2, Edit, Paperclip, Info, Receipt, ArrowRight, UserPlus } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { SplitGroup, SplitGroupMember, SplitExpense, SplitSettlement } from '@/lib/definitions';
import { CreateGroupModal } from '@/components/dashboard/rachar/create-group-modal';
import { AddExpenseModal } from '@/components/dashboard/rachar/add-expense-modal';
import { SettleDebtModal } from '@/components/dashboard/rachar/settle-debt-modal';
import { AddMemberModal } from '@/components/dashboard/rachar/add-member-modal';
import { DeleteSplitItemDialog } from '@/components/dashboard/rachar/delete-item-dialog';
import { AttachmentViewer } from '@/components/dashboard/rachar/attachment-viewer';
import { ActivityFeed } from '@/components/dashboard/rachar/activity-feed';
import { ExportMenu } from '@/components/dashboard/rachar/export-menu';
import { OptimizedPaymentsPlan } from '@/components/dashboard/rachar/optimized-payments-plan';
import { calculateNetBalances, optimizePayments } from '@/lib/payment-optimizer';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { SwipeableItem } from '@/components/ui/swipeable-item';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@/contexts/UserContext';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';


export default function GroupDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.groupId as string;
    const { toast } = useToast();
    const { user } = useUser();

    const [group, setGroup] = useState<SplitGroup | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const [isSettleDebtOpen, setIsSettleDebtOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [expenseToEdit, setExpenseToEdit] = useState<SplitExpense | null>(null);
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);
    const [viewAttachment, setViewAttachment] = useState<{ url: string, type: 'image' | 'pdf', title?: string } | null>(null);
    const [isDebtDetailsOpen, setIsDebtDetailsOpen] = useState(false);
    const [settleData, setSettleData] = useState<{ fromId?: string, toId?: string, amount?: number } | null>(null);

    const fetchGroupDetails = useCallback(async () => {
        try {
            const response = await api.get(`/rachar/groups/${groupId}`);
            setGroup(response.data);
        } catch (error) {
            console.error('Erro ao buscar detalhes do grupo:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao carregar grupo',
                description: 'Não foi possível carregar os detalhes do grupo.'
            });
        } finally {
            setIsLoading(false);
        }
    }, [groupId, toast]);

    useEffect(() => {
        fetchGroupDetails();
    }, [fetchGroupDetails]);

    if (isLoading) {
        return <div className="p-8 text-center">Carregando...</div>;
    }

    if (!group) {
        return <div className="p-8 text-center">Grupo não encontrado.</div>;
    }

    const balances = group ? calculateNetBalances(group.members || [], group.expenses || [], group.settlements || []) : {};

    const getMemberName = (id: string) => group.members?.find(m => m.id === id)?.name || 'Desconhecido';

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold">{group.name}</h1>
                        <p className="text-sm text-muted-foreground">{group.category || 'Geral'}</p>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-2 md:flex md:ml-auto">
                    <Button variant="outline" size="sm" onClick={() => setIsAddMemberOpen(true)} className="w-full md:w-auto px-2">
                        <Users className="mr-2 h-4 w-4" />
                        <span className="truncate">Membros</span>
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setIsSettleDebtOpen(true)} className="w-full md:w-auto px-2">
                        <DollarSign className="mr-2 h-4 w-4" />
                        <span className="truncate">Quitar</span>
                    </Button>
                    <Button size="sm" onClick={() => { setExpenseToEdit(null); setIsAddExpenseOpen(true); }} className="w-full md:w-auto px-2">
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="truncate">Despesa</span>
                    </Button>
                    <Button onClick={() => setIsAddMemberOpen(true)} variant="outline" size="sm">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Convidar
                    </Button>
                    <ExportMenu groupId={groupId} groupName={group.name} />
                </div>
            </div>

            {/* User Balance Summary */}
            {user && (
                <Card className={`${(balances[user.id] || 0) > 0
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : (balances[user.id] || 0) < 0
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : 'bg-muted/50'
                    } `}>
                    <CardContent className="p-6 flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <p className="text-sm font-medium text-muted-foreground">Seu Saldo</p>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5 text-muted-foreground hover:text-foreground"
                                    onClick={() => setIsDebtDetailsOpen(true)}
                                >
                                    <Info className="h-3 w-3" />
                                </Button>
                            </div>
                            <h2 className={`text - 3xl font - bold ${(balances[user.id] || 0) > 0
                                ? 'text-green-600 dark:text-green-400'
                                : (balances[user.id] || 0) < 0
                                    ? 'text-red-600 dark:text-red-400'
                                    : ''
                                } `}>
                                {(balances[user.id] || 0) > 0 ? '+' : ''} R$ {Math.abs(balances[user.id] || 0).toFixed(2)}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                {(balances[user.id] || 0) > 0
                                    ? 'Você deve receber'
                                    : (balances[user.id] || 0) < 0
                                        ? 'Você deve pagar'
                                        : 'Tudo quitado'}
                            </p>
                        </div>
                        <div className={`p - 3 rounded - full ${(balances[user.id] || 0) > 0
                            ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400'
                            : (balances[user.id] || 0) < 0
                                ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'
                                : 'bg-muted text-muted-foreground'
                            } `}>
                            {(balances[user.id] || 0) >= 0 ? <DollarSign className="h-8 w-8" /> : <ArrowRight className="h-8 w-8" />}
                        </div>
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="expenses" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="expenses">Despesas</TabsTrigger>
                    <TabsTrigger value="membros">Membros</TabsTrigger>
                    <TabsTrigger value="balances">Saldos</TabsTrigger>
                    <TabsTrigger value="activity">Atividade</TabsTrigger>
                </TabsList>
                <TabsContent value="expenses" className="space-y-4 mt-4">
                    {group.expenses?.length === 0 && group.settlements?.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                            Nenhuma despesa registrada ainda.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Combine expenses and settlements and sort by date */}
                            {[...(group.expenses || []).map(e => ({ ...e, type: 'expense' })), ...(group.settlements || []).map(s => ({ ...s, type: 'settlement' }))]
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((item: any) => (
                                    <SwipeableItem
                                        key={item.id}
                                        onEdit={item.type === 'expense' ? () => {
                                            setExpenseToEdit(item);
                                            setIsAddExpenseOpen(true);
                                        } : undefined}
                                        onDelete={() => setItemToDelete(item)}
                                    >
                                        <Card className={`border-l-4 ${item.type === 'expense' ? 'border-l-red-500' : 'border-l-green-500'}`}>
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-full ${item.type === 'expense' ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'}`}>
                                                        {item.type === 'expense' ? <Receipt className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{item.type === 'expense' ? item.description : 'Pagamento Realizado'}</p>
                                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                            <span>
                                                                {item.type === 'expense'
                                                                    ? (item.payers && item.payers.length > 0
                                                                        ? `${item.payers.length} pessoas pagaram R$ ${Number(item.amount).toFixed(2)}`
                                                                        : `${getMemberName(item.paidById)} pagou R$ ${Number(item.amount).toFixed(2)}`)
                                                                    : `${getMemberName(item.fromId)} pagou ${getMemberName(item.toId)}`
                                                                }
                                                            </span>
                                                            {item.attachmentUrl && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setViewAttachment({
                                                                            url: item.attachmentUrl,
                                                                            title: item.description,
                                                                            type: 'image' // Default to image for now, logic can be improved
                                                                        });
                                                                    }}
                                                                    className="ml-1 p-1 hover:bg-muted rounded-full transition-colors"
                                                                >
                                                                    <Paperclip className="h-3 w-3 text-blue-500" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-bold ${item.type === 'expense' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                                        {item.type === 'expense' ? '-' : '+'} R$ {Number(item.amount).toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {format(new Date(item.date), "d 'de' MMM", { locale: ptBR })}
                                                    </p>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </SwipeableItem>
                                ))
                            }
                        </div>
                    )}
                </TabsContent>
                <TabsContent value="membros" className="mt-4">
                    <div className="space-y-4">
                        {group.members?.map(member => {
                            const memberBalance = balances[member.id] || 0;
                            const paidExpenses = group.expenses?.filter(e => e.paidById === member.id) || [];
                            const totalPaid = paidExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

                            const involvedExpenses = group.expenses?.filter(e =>
                                e.splits?.some(s => s.memberId === member.id)
                            ) || [];
                            const totalOwed = involvedExpenses.reduce((sum, e) => {
                                const split = e.splits?.find(s => s.memberId === member.id);
                                return sum + (split ? Number(split.amount) : 0);
                            }, 0);

                            const payments = group.settlements?.filter(s => s.fromId === member.id || s.toId === member.id) || [];

                            return (
                                <Card key={member.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarFallback className="text-lg">{member.name[0]}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <CardTitle>{member.name}</CardTitle>
                                                    <p className={`text - sm font - medium ${memberBalance > 0
                                                        ? 'text-green-600 dark:text-green-400'
                                                        : memberBalance < 0
                                                            ? 'text-red-600 dark:text-red-400'
                                                            : 'text-muted-foreground'
                                                        } `}>
                                                        Saldo: {memberBalance > 0 ? '+' : ''}R$ {memberBalance.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                <p className="text-xs text-muted-foreground mb-1">Total Pago</p>
                                                <p className="text-lg font-bold text-green-600 dark:text-green-400">R$ {totalPaid.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">{paidExpenses.length} despesa{paidExpenses.length !== 1 ? 's' : ''}</p>
                                            </div>
                                            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                                <p className="text-xs text-muted-foreground mb-1">Total Devido</p>
                                                <p className="text-lg font-bold text-red-600 dark:text-red-400">R$ {totalOwed.toFixed(2)}</p>
                                                <p className="text-xs text-muted-foreground">{involvedExpenses.length} despesa{involvedExpenses.length !== 1 ? 's' : ''}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            {paidExpenses.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-semibold mb-2 text-green-600 dark:text-green-400">Despesas Pagas</h4>
                                                    <div className="space-y-2">
                                                        {paidExpenses.map(expense => (
                                                            <div key={expense.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                                                                <div>
                                                                    <p className="font-medium">{expense.description}</p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {format(new Date(expense.date), "d 'de' MMM", { locale: ptBR })}
                                                                    </p>
                                                                </div>
                                                                <p className="font-semibold text-green-600 dark:text-green-400">R$ {Number(expense.amount).toFixed(2)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {involvedExpenses.filter(e => e.paidById !== member.id).length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-semibold mb-2 text-red-600 dark:text-red-400">Despesas Compartilhadas</h4>
                                                    <div className="space-y-2">
                                                        {involvedExpenses.filter(e => e.paidById !== member.id).map(expense => {
                                                            const split = expense.splits?.find(s => s.memberId === member.id);
                                                            return (
                                                                <div key={expense.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                                                                    <div>
                                                                        <p className="font-medium">{expense.description}</p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            Pago por {getMemberName(expense.paidById)} • {format(new Date(expense.date), "d 'de' MMM", { locale: ptBR })}
                                                                        </p>
                                                                    </div>
                                                                    <p className="font-semibold text-red-600 dark:text-red-400">R$ {split ? Number(split.amount).toFixed(2) : '0.00'}</p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            {payments.length > 0 && (
                                                <div>
                                                    <h4 className="text-sm font-semibold mb-2">Pagamentos</h4>
                                                    <div className="space-y-2">
                                                        {payments.map(settlement => {
                                                            const isPayer = settlement.fromId === member.id;
                                                            return (
                                                                <div key={settlement.id} className="flex justify-between items-center text-sm p-2 bg-muted/50 rounded">
                                                                    <div>
                                                                        <p className="font-medium">
                                                                            {isPayer ? `Pagou ${getMemberName(settlement.toId)} ` : `Recebeu de ${getMemberName(settlement.fromId)} `}
                                                                        </p>
                                                                        <p className="text-xs text-muted-foreground">
                                                                            {format(new Date(settlement.date), "d 'de' MMM", { locale: ptBR })}
                                                                        </p>
                                                                    </div>
                                                                    <p className={`font - semibold ${isPayer ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'} `}>
                                                                        {isPayer ? '-' : '+'}R$ {Number(settlement.amount).toFixed(2)}
                                                                    </p>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </TabsContent>
                <TabsContent value="balances" className="mt-4 space-y-6">
                    {/* Optimized Plan Section */}
                    <div className="space-y-2">
                        <h3 className="text-lg font-semibold">Plano de Quitação Inteligente</h3>
                        <p className="text-sm text-muted-foreground">
                            Abaixo está a forma mais eficiente de quitar todas as dívidas do grupo com o menor número de transferências.
                        </p>
                        <OptimizedPaymentsPlan
                            plan={optimizePayments(balances)}
                            members={group.members || []}
                            groupId={groupId as string}
                            onSuccess={fetchGroupDetails}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Saldos Líquidos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {Object.entries(balances).map(([memberId, balance]) => (
                                        <div key={memberId} className="flex justify-between items-center">
                                            <span>{getMemberName(memberId)}</span>
                                            <span className={balance > 0 ? 'text-green-600 font-bold' : balance < 0 ? 'text-red-600 font-bold' : 'text-muted-foreground'}>
                                                {balance > 0 ? '+' : ''} R$ {balance.toFixed(2)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="activity">
                    <Card>
                        <CardHeader>
                            <CardTitle>Atividade Recente</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ActivityFeed groupId={groupId} />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <AddExpenseModal
                open={isAddExpenseOpen}
                onOpenChange={setIsAddExpenseOpen}
                groupId={groupId}
                members={group.members || []}
                expenseToEdit={expenseToEdit}
                onSuccess={() => {
                    setIsAddExpenseOpen(false);
                    setExpenseToEdit(null);
                    fetchGroupDetails();
                }}
            />

            <SettleDebtModal
                open={isSettleDebtOpen}
                onOpenChange={(open) => {
                    setIsSettleDebtOpen(open);
                    if (!open) setSettleData(null);
                }}
                groupId={groupId}
                members={group.members || []}
                initialFromId={settleData?.fromId}
                initialToId={settleData?.toId}
                initialAmount={settleData?.amount}
                onSuccess={() => {
                    setIsSettleDebtOpen(false);
                    setSettleData(null);
                    fetchGroupDetails();
                }}
            />

            <AddMemberModal
                open={isAddMemberOpen}
                onOpenChange={setIsAddMemberOpen}
                groupId={groupId}
                onSuccess={() => {
                    setIsAddMemberOpen(false);
                    fetchGroupDetails();
                }}
            />

            <DeleteSplitItemDialog
                isOpen={!!itemToDelete}
                onClose={() => setItemToDelete(null)}
                itemDescription={itemToDelete?.description || 'Pagamento'}
                isExpense={itemToDelete?.type === 'expense'}
                onConfirm={async () => {
                    if (!itemToDelete) return;
                    try {
                        if (itemToDelete.type === 'expense') {
                            await api.delete(`/rachar/groups/${groupId}/expenses/${itemToDelete.id}`);
                        } else {
                            await api.delete(`/rachar/groups/${groupId}/settlements/${itemToDelete.id}`);
                        }
                        toast({ title: 'Item removido com sucesso' });
                        fetchGroupDetails();
                        setItemToDelete(null);
                    } catch (error) {
                        console.error('Erro ao excluir:', error);
                        toast({
                            variant: 'destructive',
                            title: 'Erro ao excluir item',
                            description: 'Tente novamente.'
                        });
                    }
                }}
            />

            {viewAttachment && (
                <AttachmentViewer
                    isOpen={!!viewAttachment}
                    onClose={() => setViewAttachment(null)}
                    url={viewAttachment.url}
                    description={viewAttachment.title || 'Anexo'}
                />
            )}
            {/* Debt Details Dialog */}
            <ResponsiveDialog
                isOpen={isDebtDetailsOpen}
                setIsOpen={setIsDebtDetailsOpen}
                title="Detalhes do Saldo"
                description="Veja exatamente quem você deve e quem deve a você."
            >
                <div className="space-y-6 py-4">
                    {(() => {
                        if (!user || !group) return null;
                        // Use the same optimization logic to determine debts, as it's the correct mathematical way
                        // to resolve net balances. The user just didn't want the "Execute Plan" button.
                        const plan = optimizePayments(balances);
                        const myDebts = plan.filter(p => p.fromId === user.id);
                        const owedToMe = plan.filter(p => p.toId === user.id);

                        if (myDebts.length === 0 && owedToMe.length === 0) {
                            return (
                                <div className="text-center text-muted-foreground py-8">
                                    Você não tem pendências neste grupo.
                                </div>
                            );
                        }

                        return (
                            <div className="space-y-6">
                                {myDebts.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-red-600 dark:text-red-400 flex items-center gap-2">
                                            <ArrowLeft className="h-4 w-4 rotate-45" />
                                            Você deve
                                        </h4>
                                        <div className="space-y-2">
                                            {myDebts.map((debt, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/20">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{getMemberName(debt.toId)}</span>
                                                        <span className="font-bold text-red-700 dark:text-red-300">
                                                            R$ {debt.amount.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => {
                                                            setSettleData({
                                                                fromId: debt.fromId,
                                                                toId: debt.toId,
                                                                amount: debt.amount
                                                            });
                                                            setIsDebtDetailsOpen(false);
                                                            setIsSettleDebtOpen(true);
                                                        }}
                                                    >
                                                        Pagar
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {owedToMe.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                                            <ArrowLeft className="h-4 w-4 rotate-[225deg]" />
                                            Devem a você
                                        </h4>
                                        <div className="space-y-2">
                                            {owedToMe.map((debt, idx) => (
                                                <div key={idx} className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/20">
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{getMemberName(debt.fromId)}</span>
                                                        <span className="font-bold text-green-700 dark:text-green-300">
                                                            R$ {debt.amount.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                        onClick={() => {
                                                            setSettleData({
                                                                fromId: debt.fromId,
                                                                toId: debt.toId,
                                                                amount: debt.amount
                                                            });
                                                            setIsDebtDetailsOpen(false);
                                                            setIsSettleDebtOpen(true);
                                                        }}
                                                    >
                                                        Receber
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}
                </div>
            </ResponsiveDialog>
        </div>
    );
}

