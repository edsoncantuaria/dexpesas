'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Trash2, Edit, CheckCircle2, XCircle } from 'lucide-react';
import { SplitGroupMember } from '@/lib/definitions';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface RecurringExpense {
    id: string;
    description: string;
    amount: string;
    frequency: 'WEEKLY' | 'MONTHLY' | 'YEARLY';
    startDate: string;
    nextRun: string;
    active: boolean;
    paidById: string | null;
    paidBy?: SplitGroupMember;
}

interface RecurringExpensesListProps {
    groupId: string;
    members: SplitGroupMember[];
}

export function RecurringExpensesList({ groupId, members }: RecurringExpensesListProps) {
    const [expenses, setExpenses] = useState<RecurringExpense[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<RecurringExpense | null>(null);
    const { toast } = useToast();

    // Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [frequency, setFrequency] = useState<'WEEKLY' | 'MONTHLY' | 'YEARLY'>('MONTHLY');
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [paidById, setPaidById] = useState('');

    const fetchExpenses = async () => {
        try {
            const response = await api.get(`/rachar/groups/${groupId}/recurring`);
            setExpenses(response.data);
        } catch (error) {
            console.error('Erro ao buscar despesas recorrentes:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao carregar',
                description: 'Não foi possível carregar as despesas recorrentes.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, [groupId]);

    const handleOpenModal = (expense?: RecurringExpense) => {
        if (expense) {
            setEditingExpense(expense);
            setDescription(expense.description);
            setAmount(expense.amount);
            setFrequency(expense.frequency);
            setStartDate(expense.startDate.split('T')[0]);
            setPaidById(expense.paidById || '');
        } else {
            setEditingExpense(null);
            setDescription('');
            setAmount('');
            setFrequency('MONTHLY');
            setStartDate(format(new Date(), 'yyyy-MM-dd'));
            setPaidById(members[0]?.id || '');
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                description,
                amount: parseFloat(amount),
                frequency,
                startDate: new Date(startDate).toISOString(),
                paidById: paidById || null,
                splitType: 'EQUAL', // Default for now
                // For simplicity, we'll assume EQUAL split among all members for now in this UI
                splits: members.map(m => ({
                    memberId: m.id,
                    percentage: 100 / members.length
                }))
            };

            if (editingExpense) {
                await api.put(`/rachar/groups/${groupId}/recurring/${editingExpense.id}`, payload);
                toast({ title: 'Despesa recorrente atualizada!' });
            } else {
                await api.post(`/rachar/groups/${groupId}/recurring`, payload);
                toast({ title: 'Despesa recorrente criada!' });
            }
            setIsModalOpen(false);
            fetchExpenses();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao salvar',
                description: 'Tente novamente.'
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja remover esta despesa recorrente?')) return;
        try {
            await api.delete(`/rachar/groups/${groupId}/recurring/${id}`);
            toast({ title: 'Removido com sucesso!' });
            fetchExpenses();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao remover' });
        }
    };

    const toggleActive = async (expense: RecurringExpense) => {
        try {
            await api.put(`/rachar/groups/${groupId}/recurring/${expense.id}`, {
                active: !expense.active
            });
            fetchExpenses();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao atualizar status' });
        }
    };

    if (isLoading) return <div>Carregando...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Despesas Recorrentes</h3>
                <Button onClick={() => handleOpenModal()} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Recorrência
                </Button>
            </div>

            <div className="grid gap-4">
                {expenses.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg">
                        Nenhuma despesa recorrente configurada.
                    </div>
                )}
                {expenses.map(expense => (
                    <Card key={expense.id} className={!expense.active ? 'opacity-60' : ''}>
                        <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-full ${expense.active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                                    <Calendar className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-semibold">{expense.description}</h4>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Badge variant="outline">{expense.frequency === 'WEEKLY' ? 'Semanal' : expense.frequency === 'MONTHLY' ? 'Mensal' : 'Anual'}</Badge>
                                        <span>R$ {Number(expense.amount).toFixed(2)}</span>
                                        <span>•</span>
                                        <span>Próx: {format(new Date(expense.nextRun), 'dd/MM/yyyy')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" onClick={() => toggleActive(expense)} title={expense.active ? "Desativar" : "Ativar"}>
                                    {expense.active ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-gray-400" />}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleOpenModal(expense)}>
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)} className="text-red-500 hover:text-red-700">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <ResponsiveDialog
                isOpen={isModalOpen}
                setIsOpen={setIsModalOpen}
                title={editingExpense ? "Editar Recorrência" : "Nova Despesa Recorrente"}
                description="Configure uma despesa que se repete automaticamente."
            >
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid gap-2">
                        <Label>Descrição</Label>
                        <Input value={description} onChange={e => setDescription(e.target.value)} required placeholder="Ex: Aluguel, Netflix..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Valor (R$)</Label>
                            <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label>Frequência</Label>
                            <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                                    <SelectItem value="MONTHLY">Mensal</SelectItem>
                                    <SelectItem value="YEARLY">Anual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Início / Próxima Execução</Label>
                            <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                        </div>
                        <div className="grid gap-2">
                            <Label>Pago por</Label>
                            <Select value={paidById} onValueChange={setPaidById}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {members.map(m => (
                                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button type="submit">Salvar</Button>
                    </div>
                </form>
            </ResponsiveDialog>
        </div>
    );
}
