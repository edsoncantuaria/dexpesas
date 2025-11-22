// src/app/dashboard/metas/page.tsx
'use client';

import { Target, PlusCircle, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useState, useEffect, useCallback } from 'react';
import type { Goal, Account, Category, GoalContribution, User } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { handleApiError } from '@/lib/error-handler';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AddGoalForm } from '@/components/dashboard/metas/add-goal-form';
import { GoalList } from '@/components/dashboard/metas/goal-list';
import { AddContributionForm } from '@/components/dashboard/metas/add-contribution-form';
import { FinalizeGoalDialog } from '@/components/dashboard/metas/finalize-goal-dialog';
import { GoalDetailsDialog } from '@/components/dashboard/metas/goal-details-dialog';
import { RescueGoalDialog } from '@/components/dashboard/metas/rescue-goal-dialog';
import { GoalProjection } from '@/components/dashboard/metas/goal-projection';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function MetasPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [contributingGoal, setContributingGoal] = useState<Goal | null>(null);
    const [finalizingGoal, setFinalizingGoal] = useState<Goal | null>(null);
    const [rescuingGoal, setRescuingGoal] = useState<Goal | null>(null);
    const [viewingGoal, setViewingGoal] = useState<Goal | null>(null);
    const [currentContributions, setCurrentContributions] = useState<GoalContribution[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        try {
            const [goalsRes, accountsRes, categoriesRes, userRes] = await Promise.all([
                api.get('/goals'),
                api.get('/accounts'),
                api.get('/categories'),
                api.get('/user'),
            ]);
            setGoals(goalsRes.data);
            setAccounts(accountsRes.data);
            setCategories(categoriesRes.data.filter((c: Category) => c.nome !== 'Investimentos'));
            setUser(userRes.data);
        } catch (error) {
            handleApiError(error, toast, 'Erro ao buscar dados');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        setIsLoading(true);
        fetchData();
    }, [fetchData]);

    const handleOpenForm = (goal?: Goal) => {
        setEditingGoal(goal || null);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingGoal(null);
    };

    const handleOpenContribution = (goal: Goal) => setContributingGoal(goal);
    const handleCloseContribution = () => setContributingGoal(null);

    const handleOpenFinalize = (goal: Goal) => setFinalizingGoal(goal);
    const handleCloseFinalize = () => setFinalizingGoal(null);

    const handleOpenRescue = (goal: Goal) => setRescuingGoal(goal);
    const handleCloseRescue = () => setRescuingGoal(null);

    const handleViewDetails = async (goal: Goal) => {
        try {
            const res = await api.get(`/goals/${goal.id}/contributions`);
            setCurrentContributions(res.data);
            setViewingGoal(goal);
        } catch (error) {
            handleApiError(error, toast, 'Erro ao buscar histórico');
        }
    };
    const handleCloseDetails = () => setViewingGoal(null);

    const handleSaveGoal = async (goalData: Omit<Goal, 'id' | 'userId' | 'currentAmount' | 'status' | 'contributions' | 'projectionDate'> & { id?: string }) => {
        setIsSubmitting(true);
        const isEditing = !!editingGoal;
        const method = isEditing ? 'patch' : 'post';
        const url = isEditing ? `/goals/${editingGoal!.id}` : '/goals';

        try {
            await api[method](url, goalData);
            await fetchData();
            toast({
                title: `Meta ${isEditing ? 'atualizada' : 'criada'}!`,
                description: `Seu objetivo "${goalData.name}" foi salvo com sucesso.`,
            });
            handleCloseForm();
        } catch (error: any) {
            handleApiError(error, toast, 'Erro ao salvar meta');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAddContribution = async (data: { amount: number, fromAccountId: string }) => {
        if (!contributingGoal) return;
        setIsSubmitting(true);
        try {
            await api.post(`/goals/${contributingGoal.id}/contributions`, data);
            await fetchData();
            toast({
                title: 'Contribuição adicionada!',
                description: `Sua contribuição para "${contributingGoal.name}" foi registrada.`,
            });
            handleCloseContribution();
        } catch (error: any) {
            handleApiError(error, toast, 'Erro ao contribuir');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFinalizeGoal = async (data: { amount: number, finalizationType: 'purchase' | 'account', destinationAccountId?: string, categoryId?: string, remainingAmountAction?: 'keep' | 'rescue' }) => {
        if (!finalizingGoal) return;
        setIsSubmitting(true);
        try {
            await api.post(`/goals/${finalizingGoal.id}/finalize`, data);
            await fetchData();
            toast({
                title: 'Meta Concluída!',
                description: `Parabéns por alcançar seu objetivo "${finalizingGoal.name}"!`,
            });
            handleCloseFinalize();
        } catch (error: any) {
            handleApiError(error, toast, 'Erro ao Finalizar');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleRescueGoal = async (data: { destinationAccountId: string }) => {
        if (!rescuingGoal) return;
        setIsSubmitting(true);
        try {
            await api.post(`/goals/${rescuingGoal.id}/rescue`, data);
            await fetchData();
            toast({ title: "Valor Resgatado!", description: "O saldo da meta foi transferido para sua conta." });
            handleCloseRescue();
        } catch (error: any) {
            handleApiError(error, toast, 'Erro ao resgatar');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteGoal = async (goalId: string) => {
        const goalToDelete = goals.find(b => b.id === goalId);
        if (goalToDelete) {
            try {
                await api.delete(`/goals/${goalId}`);
                await fetchData();
                toast({
                    title: 'Meta excluída!',
                    description: `A meta "${goalToDelete.name}" foi removida.`,
                    variant: 'destructive'
                });
            } catch (error) {
                handleApiError(error, toast, 'Erro ao excluir meta');
            }
        }
    };

    if (isLoading || !user) {
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
                            Seus Objetivos
                        </h1>
                        <p className="text-muted-foreground mt-1">Transforme seus sonhos em realidade, um passo de cada vez.</p>
                    </div>
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenForm()} className="shadow-lg shadow-primary/20">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Objetivo
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle className="text-2xl">{editingGoal ? 'Editar Objetivo' : 'Novo Objetivo Financeiro'}</DialogTitle>
                            <DialogDescription>
                                {editingGoal ? 'Atualize os detalhes do seu objetivo.' : 'Defina uma meta clara e comece a poupar para alcançá-la.'}
                            </DialogDescription>
                        </DialogHeader>
                        <AddGoalForm
                            goal={editingGoal}
                            accounts={accounts}
                            onSuccess={handleSaveGoal}
                            onClose={handleCloseForm}
                            isSubmitting={isSubmitting}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <GoalList
                        goals={goals}
                        onEdit={handleOpenForm}
                        onDelete={handleDeleteGoal}
                        onAddContribution={handleOpenContribution}
                        onFinalize={handleOpenFinalize}
                        onViewDetails={handleViewDetails}
                        onRescue={handleOpenRescue}
                    />

                    {goals.length === 0 && !isLoading && (
                        <div className="flex flex-col items-center justify-center gap-6 py-20 text-center rounded-3xl border-2 border-dashed bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm mt-6">
                            <div className="p-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                                <Target className="h-16 w-16 text-primary" />
                            </div>
                            <div className="space-y-2">
                                <h3 className='text-2xl font-bold font-headline'>Qual é a sua próxima grande conquista?</h3>
                                <p className="text-muted-foreground max-w-md">
                                    Definir objetivos é o primeiro passo para transformar sonhos em realidade. Crie sua primeira meta agora mesmo.
                                </p>
                            </div>
                            <Button size="lg" onClick={() => handleOpenForm()} className="shadow-lg shadow-primary/20">
                                <PlusCircle className="mr-2 h-5 w-5" />
                                Criar Primeiro Objetivo
                            </Button>
                        </div>
                    )}
                </div>

                <div className="lg:col-span-1">
                    {user.enableGoalProjection && (
                        <Card>
                            <CardHeader className="flex flex-row items-center gap-3">
                                <BrainCircuit className="h-6 w-6 text-primary" />
                                <div>
                                    <CardTitle>Simulação de Metas</CardTitle>
                                    <CardDescription>Projete cenários e acelere seus sonhos.</CardDescription>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <GoalProjection goals={goals.filter(g => g.status === 'IN_PROGRESS')} />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {contributingGoal && (
                <Dialog open={!!contributingGoal} onOpenChange={(isOpen) => !isOpen && handleCloseContribution()}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Contribuir para "{contributingGoal.name}"</DialogTitle>
                            <DialogDescription>
                                Transfira um valor de uma de suas contas para este objetivo.
                            </DialogDescription>
                        </DialogHeader>
                        <AddContributionForm
                            goal={contributingGoal}
                            accounts={accounts.filter(a => a.tipo === 'corrente' || a.tipo === 'poupanca')}
                            onSuccess={handleAddContribution}
                            onClose={handleCloseContribution}
                            isSubmitting={isSubmitting}
                        />
                    </DialogContent>
                </Dialog>
            )}

            {finalizingGoal && (
                <FinalizeGoalDialog
                    goal={finalizingGoal}
                    accounts={accounts}
                    categories={categories}
                    isOpen={!!finalizingGoal}
                    isSaving={isSubmitting}
                    onClose={handleCloseFinalize}
                    onSave={handleFinalizeGoal}
                />
            )}

            {rescuingGoal && (
                <RescueGoalDialog
                    isOpen={!!rescuingGoal}
                    onClose={handleCloseRescue}
                    onConfirm={handleRescueGoal}
                    goal={rescuingGoal}
                    accounts={accounts}
                    isSaving={isSubmitting}
                />
            )}

            {viewingGoal && (
                <GoalDetailsDialog
                    isOpen={!!viewingGoal}
                    onClose={handleCloseDetails}
                    goal={viewingGoal}
                    contributions={currentContributions}
                />
            )}
        </div>
    );
}
