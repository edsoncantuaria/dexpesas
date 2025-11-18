// src/app/dashboard/orcamentos/page.tsx
'use client';

import Link from "next/link";
import { PiggyBank, PlusCircle, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Budget, Category, User } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';
import { LoadingScreen } from "@/components/ui/loading-screen";
import { AddBudgetForm } from "@/components/dashboard/orcamentos/add-budget-form";
import { BudgetList } from "@/components/dashboard/orcamentos/budget-list";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { BudgetSummaryCard } from "@/components/dashboard/orcamentos/budget-summary-card";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function OrcamentosPage() {
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isUnbudgetedDialogOpen, setIsUnbudgetedDialogOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewFilter, setViewFilter] = useState<'all' | 'personal' | 'family'>('all');
    const { toast } = useToast();

    const fetchBudgets = useCallback(async () => {
        setIsLoading(true);
        const month = format(selectedDate, 'yyyy-MM');
        try {
            const [budgetRes, catRes, userRes] = await Promise.all([
                api.get(`/budgets?month=${month}`),
                api.get('/categories'),
                api.get('/user'),
            ]);
            setBudgets(budgetRes.data);
            setCategories(catRes.data.filter((c: Category) => c.nome !== 'Salario' && c.nome !== 'Investimentos'));
            setUser(userRes.data);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Erro ao buscar orçamentos',
                description: 'Não foi possível carregar a lista de orçamentos para este mês.'
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast, selectedDate]);

    useEffect(() => {
        fetchBudgets();
        const handleTransactionUpdate = () => fetchBudgets();
        window.addEventListener('transaction-updated', handleTransactionUpdate);
        return () => window.removeEventListener('transaction-updated', handleTransactionUpdate);
    }, [fetchBudgets]);

    const handleOpenForm = (budget?: Budget, categoryId?: string) => {
        setEditingBudget(budget || null);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingBudget(null);
    };

    const handleSaveBudget = async (budgetData: Omit<Budget, 'id' | 'userId' | 'spent' | 'month' | 'category' | 'originalLimit' | 'rolloverAmount'> & { id?: string }) => {
        setIsSubmitting(true);
        const isEditing = !!editingBudget;
        const method = isEditing ? 'patch' : 'post';
        const url = isEditing ? `/budgets/${editingBudget.id}` : '/budgets';
        
        const dataToSend = isEditing 
            ? { limit: budgetData.limit, rollover: budgetData.rollover } 
            : {
                 ...budgetData, 
                 month: format(selectedDate, 'yyyy-MM') 
            };

        try {
            await api[method](url, dataToSend);
            await fetchBudgets();
            toast({
                title: `Orçamento ${isEditing ? 'atualizado' : 'criado'}!`,
                description: `Seu orçamento foi salvo com sucesso.`,
            });
            handleCloseForm();
            setIsUnbudgetedDialogOpen(false); // Fecha o dialog de não orçados se aberto
        } catch (error: any) {
            const message = error.response?.data?.message || 'Não foi possível salvar o orçamento.';
            toast({
                variant: 'destructive',
                title: `Erro ao salvar orçamento`,
                description: message
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteBudget = async (budgetId: string) => {
        const budgetToDelete = budgets.find(b => b.id === budgetId);
        if (budgetToDelete) {
            try {
                await api.delete(`/budgets/${budgetId}`);
                await fetchBudgets();
                toast({
                    title: 'Orçamento excluído!',
                    description: `O orçamento para "${budgetToDelete.category?.label || budgetToDelete.category?.nome}" foi removido.`,
                    variant: 'destructive'
                });
            } catch (error) {
                toast({
                    variant: 'destructive',
                    title: 'Erro ao excluir orçamento',
                });
            }
        }
    };

    const unbudgetedCategories = useMemo(() => {
        const budgetedIds = new Set(budgets.map(b => b.categoryId));
        return categories.filter(c => !budgetedIds.has(c.id));
    }, [categories, budgets]);
    
    const personalBudgets = useMemo(() => budgets.filter((budget) => !budget.cellBudgetId), [budgets]);
    const familyBudgets = useMemo(() => budgets.filter((budget) => Boolean(budget.cellBudgetId)), [budgets]);

    const summary = useMemo(() => {
        const totalBudgeted = personalBudgets.reduce((acc, b) => acc + Number(b.limit), 0);
        const totalSpent = personalBudgets.reduce((acc, b) => acc + Number(b.spent), 0);
        return { totalBudgeted, totalSpent };
    }, [personalBudgets]);

    const familyTotals = useMemo(() => {
        const totalBudgeted = familyBudgets.reduce((acc, b) => acc + Number(b.limit), 0);
        const totalSpent = familyBudgets.reduce((acc, b) => acc + Number(b.spent || 0), 0);
        return { totalBudgeted, totalSpent };
    }, [familyBudgets]);

    const filteredBudgets = useMemo(() => {
        if (viewFilter === 'personal') return personalBudgets;
        if (viewFilter === 'family') return familyBudgets;
        return budgets;
    }, [viewFilter, budgets, personalBudgets, familyBudgets]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Target className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Meus Orçamentos</h1>
                        <p className="text-muted-foreground">Defina limites de gastos e acompanhe seu progresso.</p>
                    </div>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" onClick={() => handleOpenForm()} className="w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Orçamento
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
                            <DialogDescription>
                                {editingBudget ? 'Atualize o limite para esta categoria.' : 'Defina um limite de gastos para uma categoria neste mês.'}
                            </DialogDescription>
                        </DialogHeader>
                        <AddBudgetForm
                            budget={editingBudget}
                            categories={categories} // Passa a lista completa de categorias
                            budgetsForMonth={budgets} // Passa os orçamentos do mês para lógica de desabilitar
                            onSuccess={handleSaveBudget}
                            onClose={handleCloseForm}
                            isSubmitting={isSubmitting}
                            user={user}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="flex flex-wrap gap-2">
                {[
                    { key: 'all', label: 'Todos' },
                    { key: 'personal', label: 'Pessoais' },
                    { key: 'family', label: 'Modo Família' },
                ].map((option) => (
                    <Button
                        key={option.key}
                        variant={viewFilter === option.key ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setViewFilter(option.key as typeof viewFilter)}
                    >
                        {option.label}
                    </Button>
                ))}
            </div>
            
            <BudgetSummaryCard 
                selectedMonth={selectedDate}
                onMonthChange={setSelectedDate}
                totalBudgeted={summary.totalBudgeted}
                totalSpent={summary.totalSpent}
            />

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Orçamentos pessoais</CardTitle>
                        <CardDescription>Valores sob seu controle direto.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span>Total de categorias</span>
                            <span className="font-semibold">{personalBudgets.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Limite combinado</span>
                            <span className="font-semibold">{summary.totalBudgeted.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle>Modo Família</CardTitle>
                            <CardDescription>Reflete o que foi configurado na família.</CardDescription>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/cells">
                                <Users className="h-4 w-4 mr-2" />
                                Abrir painel
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span>Orçamentos sincronizados</span>
                            <span className="font-semibold">{familyBudgets.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Limite combinado</span>
                            <span className="font-semibold">{familyTotals.totalBudgeted.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span>Gasto compartilhado</span>
                            <span className="font-semibold">{familyTotals.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <BudgetList
                budgets={filteredBudgets}
                onEdit={handleOpenForm}
                onDelete={handleDeleteBudget}
            />
            
             {budgets.length === 0 && !isLoading && (
                 <div className="flex flex-col items-center justify-center gap-4 py-16 text-center rounded-2xl border-2 border-dashed mt-6 bg-card">
                    <PiggyBank className="h-16 w-16 text-muted-foreground" />
                    <h3 className='text-lg font-semibold'>Nenhum Orçamento Definido</h3>
                    <p className="text-muted-foreground">Você ainda não criou nenhum orçamento para {format(selectedDate, 'MMMM', { locale: ptBR })}. <br/> Comece a planejar seus gastos agora mesmo.</p>
                    <Button variant="outline" size="sm" onClick={() => handleOpenForm()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Primeiro Orçamento
                    </Button>
                </div>
            )}

            {unbudgetedCategories.length > 0 && (
                <div className="text-center mt-6">
                    <Dialog open={isUnbudgetedDialogOpen} onOpenChange={setIsUnbudgetedDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Adicionar Orçamento para outras categorias
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Categorias Não Orçadas</DialogTitle>
                                <DialogDescription>Adicione orçamentos para estas categorias para um controle mais preciso.</DialogDescription>
                            </DialogHeader>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 py-4">
                                {unbudgetedCategories.map(cat => (
                                    <Button key={cat.id} variant="outline" className="justify-start gap-2" onClick={() => { setIsUnbudgetedDialogOpen(false); handleOpenForm(undefined, cat.id); }}>
                                        <PlusCircle className="h-4 w-4 text-muted-foreground" />
                                        <span>{cat.nome}</span>
                                    </Button>
                                ))}
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            )}

        </div>
    );
}
