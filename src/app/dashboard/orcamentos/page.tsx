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
import { handleApiError } from "@/lib/error-handler";

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
            handleApiError(error, toast, 'Erro ao buscar orçamentos');
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
            handleApiError(error, toast, `Erro ao salvar orçamento`);
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
                handleApiError(error, toast, 'Erro ao excluir orçamento');
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
                    <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10">
                        <Target className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-bold font-headline bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                            Meus Orçamentos
                        </h1>
                        <p className="text-muted-foreground mt-1">Defina limites de gastos e acompanhe seu progresso.</p>
                    </div>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button
                            variant="default"
                            onClick={() => handleOpenForm()}
                            className="w-full sm:w-auto shadow-lg shadow-primary/20"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Orçamento
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
                            <DialogDescription>
                                {editingBudget ? 'Atualize o limite para esta categoria.' : 'Defina um limite de gastos para uma categoria neste mês.'}
                            </DialogDescription>
                        </DialogHeader>
                        <AddBudgetForm
                            budget={editingBudget}
                            categories={categories}
                            budgetsForMonth={budgets}
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
                <Card className="shadow-lg bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-white/10">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PiggyBank className="h-5 w-5 text-primary" />
                            Orçamentos pessoais
                        </CardTitle>
                        <CardDescription>Valores sob seu controle direto.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <span className="text-muted-foreground">Total de categorias</span>
                            <span className="font-bold text-lg">{personalBudgets.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <span className="text-muted-foreground">Limite combinado</span>
                            <span className="font-bold text-lg">{summary.totalBudgeted.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="shadow-lg bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-white/10">
                    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Modo Família
                            </CardTitle>
                            <CardDescription>Reflete o que foi configurado na família.</CardDescription>
                        </div>
                        <Button variant="outline" size="sm" asChild>
                            <Link href="/dashboard/cells">
                                <Users className="h-4 w-4 mr-2" />
                                Abrir painel
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <span className="text-muted-foreground">Orçamentos sincronizados</span>
                            <span className="font-bold text-lg">{familyBudgets.length}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <span className="text-muted-foreground">Limite combinado</span>
                            <span className="font-bold text-lg">{familyTotals.totalBudgeted.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <span className="text-muted-foreground">Gasto compartilhado</span>
                            <span className="font-bold text-lg">{familyTotals.totalSpent.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
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
                <div className="flex flex-col items-center justify-center gap-6 py-20 text-center rounded-3xl border-2 border-dashed mt-6 bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm">
                    <div className="p-6 rounded-full bg-primary/10">
                        <PiggyBank className="h-16 w-16 text-primary" />
                    </div>
                    <div className="space-y-2">
                        <h3 className='text-2xl font-bold font-headline'>Nenhum Orçamento Definido</h3>
                        <p className="text-muted-foreground max-w-md">
                            Você ainda não criou nenhum orçamento para {format(selectedDate, 'MMMM', { locale: ptBR })}. <br />
                            Comece a planejar seus gastos agora mesmo.
                        </p>
                    </div>
                    <Button size="lg" onClick={() => handleOpenForm()} className="shadow-lg shadow-primary/20">
                        <PlusCircle className="mr-2 h-5 w-5" />
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
