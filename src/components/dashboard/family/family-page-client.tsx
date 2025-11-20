'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Clan, CellBudget, CellFund, CellSharedAccount, CellSharedExpense, CellTimelineEvent, CellEquilibriumEntry } from '@/lib/definitions';
import { FamilyHero } from './family-hero';
import { HomeTab } from './home-tab';
import { ExpensesTab } from './expenses-tab';
import { MembersTab } from './members-tab';
import { ReportsTab } from './reports-tab';
import { CreateCellDialog, EditCellDialog, FamilyHelpDialog } from './family-dialogs';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Plus, LayoutDashboard, ReceiptText, PieChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FamilyPageClient() {
    const { user, fetchUser } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    const [cell, setCell] = useState<Clan | null>(null);
    const [budgets, setBudgets] = useState<CellBudget[]>([]);
    const [funds, setFunds] = useState<CellFund[]>([]);
    const [sharedAccounts, setSharedAccounts] = useState<CellSharedAccount[]>([]);
    const [expenses, setExpenses] = useState<CellSharedExpense[]>([]);
    const [timelineEvents, setTimelineEvents] = useState<CellTimelineEvent[]>([]);
    const [equilibriumEntries, setEquilibriumEntries] = useState<CellEquilibriumEntry[]>([]);
    const [alerts, setAlerts] = useState<any[]>([]);
    const [invitations, setInvitations] = useState<any[]>([]);

    const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setEditDialogOpen] = useState(false);
    const [isHelpDialogOpen, setHelpDialogOpen] = useState(false);

    const fetchCellData = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/cells/my-cell');
            const data = response.data;

            if (!data || !data.cell) {
                setCell(null);
                // Check for invitations
                const invitesResponse = await api.get('/cells/invitations');
                setInvitations(invitesResponse.data || []);
            } else {
                setCell(data.cell);
                setBudgets(data.budgets || []);
                setFunds(data.funds || []);
                setSharedAccounts(data.sharedAccounts || []);
                setExpenses(data.expenses || []);
                setTimelineEvents(data.timelineEvents || []);
                setEquilibriumEntries(data.equilibriumEntries || []);
                setAlerts(data.alerts || []);
            }
        } catch (error: any) {
            // Se for 404 ou mensagem específica, apenas define como sem família
            if (error?.response?.status === 404 || error?.response?.data?.message === "Família não encontrada.") {
                setCell(null);
                try {
                    const invitesResponse = await api.get('/cells/invitations');
                    setInvitations(invitesResponse.data || []);
                } catch {
                    setInvitations([]);
                }
                return;
            }

            console.error('Failed to fetch cell data:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao carregar dados.',
                description: 'Não foi possível carregar as informações da família.',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchCellData();
    }, [fetchCellData]);

    const handleAcceptInvite = async (inviteId: string) => {
        try {
            await api.post(`/cells/invitations/${inviteId}/accept`);
            toast({ title: 'Convite aceito!', description: 'Bem-vindo à família.' });
            await fetchCellData();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao aceitar convite.',
                description: error?.response?.data?.message,
            });
        }
    };

    const handleRejectInvite = async (inviteId: string) => {
        try {
            await api.post(`/cells/invitations/${inviteId}/reject`);
            toast({ title: 'Convite recusado.' });
            setInvitations((prev) => prev.filter((inv) => inv.id !== inviteId));
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao recusar convite.',
                description: error?.response?.data?.message,
            });
        }
    };

    const handleCreateCell = async (values: { name: string; description?: string; iconUrl?: string }) => {
        try {
            await api.post('/cells', values);
            toast({ title: 'Família criada com sucesso!' });
            await fetchUser(); // Refresh user context to update clanId/memberships
            await fetchCellData();
            setCreateDialogOpen(false);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao criar família.',
                description: error?.response?.data?.message || 'Tente novamente.',
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!cell) {
        return (
            <div className="container mx-auto max-w-4xl p-6 space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4"
                >
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                        Modo Família
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Gerencie finanças em conjunto, divida despesas e alcance objetivos compartilhados.
                    </p>
                </motion.div>

                {invitations.length > 0 && (
                    <Card className="border-primary/20 bg-primary/5">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Convites Pendentes
                            </h3>
                            <div className="space-y-4">
                                {invitations.map((invite) => (
                                    <div key={invite.id} className="flex items-center justify-between rounded-lg border bg-card p-4 shadow-sm">
                                        <div>
                                            <p className="font-medium">Convite para: {invite.cell?.name}</p>
                                            <p className="text-sm text-muted-foreground">Enviado por: {invite.inviter?.name}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" onClick={() => handleRejectInvite(invite.id)}>
                                                Recusar
                                            </Button>
                                            <Button size="sm" onClick={() => handleAcceptInvite(invite.id)}>
                                                Aceitar
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="rounded-xl border bg-card p-8 shadow-lg flex flex-col items-center text-center space-y-4"
                    >
                        <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold">Criar nova família</h3>
                        <p className="text-muted-foreground">
                            Comece um novo grupo para gerenciar orçamentos, despesas e metas em conjunto.
                        </p>
                        <Button size="lg" className="w-full" onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-5 w-5" />
                            Criar Família
                        </Button>
                    </motion.div>

                    <div className="rounded-xl border bg-muted/50 p-8 flex flex-col justify-center space-y-4">
                        <h3 className="text-lg font-semibold">Como funciona?</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                Crie orçamentos compartilhados
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                Divida despesas automaticamente
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                Acompanhe metas e fundos de reserva
                            </li>
                            <li className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                Mantenha o equilíbrio de quem pagou o quê
                            </li>
                        </ul>
                    </div>
                </div>

                <CreateCellDialog
                    open={isCreateDialogOpen}
                    onOpenChange={setCreateDialogOpen}
                    onSubmit={handleCreateCell}
                />
            </div>
        );
    }

    const currentMembership = cell.members?.find((m) => m.userId === user?.id);
    const isLeader = currentMembership?.role === 'LEADER';
    const canManageSharedAccounts = isLeader || currentMembership?.role === 'ADMIN';

    return (
        <div className="space-y-6 pb-20">
            <FamilyHero
                cell={cell}
                isLeader={isLeader}
                onEdit={() => setEditDialogOpen(true)}
                onRefresh={fetchCellData}
                onInfo={() => setHelpDialogOpen(true)}
                totalBalance={funds.reduce((acc, f) => acc + Number(f.currentAmount), 0)} // Example calculation
                membersCount={cell.members?.length || 0}
            />

            <Tabs defaultValue="home" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
                    <TabsTrigger value="home" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="hidden sm:inline">Início</span>
                    </TabsTrigger>
                    <TabsTrigger value="expenses" className="flex items-center gap-2">
                        <ReceiptText className="h-4 w-4" />
                        <span className="hidden sm:inline">Despesas</span>
                    </TabsTrigger>
                    <TabsTrigger value="members" className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">Membros</span>
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex items-center gap-2">
                        <PieChart className="h-4 w-4" />
                        <span className="hidden sm:inline">Relatórios</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="home" className="focus-visible:outline-none">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <HomeTab
                            budgets={budgets}
                            funds={funds}
                            sharedAccounts={sharedAccounts}
                            alerts={alerts}
                            members={cell.members || []}
                            canManageSharedAccounts={canManageSharedAccounts}
                            cellId={cell.id}
                            onCreateBudget={fetchCellData}
                            onRefreshSharedAccounts={fetchCellData}
                            onRefreshSharedExpenses={fetchCellData}
                            currentUserId={user?.id}
                            isLeader={isLeader}
                            timelineEvents={timelineEvents}
                        />
                    </motion.div>
                </TabsContent>

                <TabsContent value="expenses" className="focus-visible:outline-none">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ExpensesTab
                            cellId={cell.id}
                            expenses={expenses}
                            members={cell.members || []}
                            sharedAccounts={sharedAccounts}
                            onRefresh={fetchCellData}
                            currentUserId={user?.id}
                            isLeader={isLeader}
                        />
                    </motion.div>
                </TabsContent>

                <TabsContent value="members" className="focus-visible:outline-none">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <MembersTab
                            cell={cell}
                            currentUserId={user?.id}
                            onChange={fetchCellData}
                            equilibriumEntries={equilibriumEntries}
                        />
                    </motion.div>
                </TabsContent>

                <TabsContent value="reports" className="focus-visible:outline-none">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <ReportsTab budgets={budgets} funds={funds} />
                    </motion.div>
                </TabsContent>
            </Tabs>

            <CreateCellDialog
                open={isCreateDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSubmit={handleCreateCell}
            />

            <EditCellDialog
                open={isEditDialogOpen}
                onOpenChange={setEditDialogOpen}
                cell={cell}
                onSuccess={fetchCellData}
            />

            <FamilyHelpDialog
                open={isHelpDialogOpen}
                onOpenChange={setHelpDialogOpen}
            />
        </div>
    );
}
