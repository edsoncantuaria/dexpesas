'use client';

import { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ChevronLeft, ChevronRight, Plus, Target } from 'lucide-react';
import api from '@/lib/api';
import { BudgetList } from '@/components/dashboard/orcamentos/budget-list';
import { BudgetForm } from '@/components/dashboard/orcamentos/budget-form';
import { Skeleton } from '@/components/ui/skeleton';
import type { Budget } from '@/lib/definitions';

export default function BudgetsPage() {
    const [currentDate, setCurrentDate] = useState(startOfMonth(new Date()));
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

    const currentMonthStr = format(currentDate, 'yyyy-MM');

    const fetchBudgets = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/budgets?month=${currentMonthStr}`);
            setBudgets(response.data);
        } catch (error) {
            console.error("Erro ao buscar orçamentos", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgets();
    }, [currentMonthStr]);

    const handlePreviousMonth = () => setCurrentDate(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

    const handleEdit = (budget: Budget) => {
        setEditingBudget(budget);
        setIsCreateOpen(true);
    };

    const handleDelete = async (id: string) => {
        // BudgetList handles confirmation dialog, so we just delete here if called directly
        // But BudgetList calls this AFTER confirmation.
        try {
            await api.delete(`/budgets/${id}`);
            fetchBudgets();
        } catch (error) {
            console.error("Erro ao deletar orçamento", error);
        }
    };

    const handleSuccess = () => {
        fetchBudgets();
        setIsCreateOpen(false);
        setEditingBudget(null);
    };

    return (
        <div className="container mx-auto p-4 md:p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Orçamentos</h1>
                    <p className="text-sm md:text-base text-muted-foreground">
                        Gerencie seus limites de gastos mensais por categoria.
                    </p>
                </div>
                <div className="flex items-center gap-2 bg-card p-1 rounded-lg border shadow-sm w-full md:w-auto justify-between md:justify-start">
                    <Button variant="ghost" size="icon" onClick={handlePreviousMonth}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="w-32 text-center font-medium capitalize text-sm md:text-base">
                        {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                    <Button variant="ghost" size="icon" onClick={handleNextMonth}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-6">
                <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
                    <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 md:p-6 gap-4">
                        <div className="space-y-1">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary" />
                                Definir Novo Orçamento
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Crie um limite para uma categoria e acompanhe seus gastos.
                            </p>
                        </div>
                        <Dialog open={isCreateOpen} onOpenChange={(open) => {
                            setIsCreateOpen(open);
                            if (!open) setEditingBudget(null);
                        }}>
                            <DialogTrigger asChild>
                                <Button>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Novo Orçamento
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>{editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}</DialogTitle>
                                </DialogHeader>
                                <BudgetForm
                                    budget={editingBudget}
                                    onSuccess={handleSuccess}
                                    onClose={() => setIsCreateOpen(false)}
                                    month={currentMonthStr}
                                />
                            </DialogContent>
                        </Dialog>
                    </CardContent>
                </Card>

                {loading ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                                <CardHeader className="pb-2">
                                    <Skeleton className="h-5 w-1/2" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-4 w-full mb-2" />
                                    <Skeleton className="h-2 w-full" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : budgets.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        Nenhum orçamento definido para este mês.
                    </div>
                ) : (
                    <BudgetList
                        budgets={budgets}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </div>
        </div>
    );
}
