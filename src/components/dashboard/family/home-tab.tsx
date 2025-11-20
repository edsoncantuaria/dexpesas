'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Wallet, PiggyBank } from 'lucide-react';
import { CellBudget, CellFund, CellSharedAccount, Clan, CellTimelineEvent } from '@/lib/definitions';
import { BudgetCard } from './budget-card';
import { FundCard } from './fund-card';
import { SharedAccountsCard } from './shared-accounts-card';
import { TimelineFeed } from './timeline-feed';
import { CreateBudgetDialog, CreateFundDialog, FundActionDialog } from './home-dialogs';
import { motion } from 'framer-motion';

interface HomeTabProps {
    budgets: CellBudget[];
    funds: CellFund[];
    sharedAccounts: CellSharedAccount[];
    alerts: any[];
    members: Clan['members'];
    canManageSharedAccounts: boolean;
    cellId: string;
    onCreateBudget: () => Promise<void>;
    onRefreshSharedAccounts: () => Promise<void>;
    onRefreshSharedExpenses: () => Promise<void>;
    currentUserId?: string;
    isLeader: boolean;
    timelineEvents: CellTimelineEvent[];
}

export function HomeTab({
    budgets,
    funds,
    sharedAccounts,
    alerts,
    members,
    canManageSharedAccounts,
    cellId,
    onCreateBudget,
    onRefreshSharedAccounts,
    currentUserId,
    isLeader,
    timelineEvents
}: HomeTabProps) {
    const [isBudgetDialogOpen, setBudgetDialogOpen] = useState(false);
    const [isFundDialogOpen, setFundDialogOpen] = useState(false);
    const [activeFundAction, setActiveFundAction] = useState<{ fund: CellFund | null; mode: 'DEPOSIT' | 'WITHDRAW' | null }>({
        fund: null,
        mode: null,
    });

    const sharedBudgets = budgets.filter((budget) => budget.type === 'CELL');
    const hybridOrPersonal = budgets.filter((budget) => budget.type !== 'CELL');
    const activeFunds = funds.filter((fund) => fund.status === 'ACTIVE');

    return (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
                {/* Shared Accounts Section */}
                <section>
                    <SharedAccountsCard
                        sharedAccounts={sharedAccounts}
                        members={members}
                        canManageSharedAccounts={canManageSharedAccounts}
                        cellId={cellId}
                        onRefreshSharedAccounts={onRefreshSharedAccounts}
                    />
                </section>

                {/* Budgets Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">Orçamentos Compartilhados</h2>
                            <p className="text-sm text-muted-foreground">Envelopes de gastos visíveis para todos.</p>
                        </div>
                        {isLeader && (
                            <Button onClick={() => setBudgetDialogOpen(true)} size="sm" className="gap-1">
                                <Plus className="h-4 w-4" /> Novo Orçamento
                            </Button>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {sharedBudgets.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                    <Wallet className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">Nenhum orçamento criado</h3>
                                <p className="mb-4 mt-2 text-sm text-muted-foreground">
                                    Crie envelopes para controlar os gastos da família em categorias específicas.
                                </p>
                                {isLeader && (
                                    <Button onClick={() => setBudgetDialogOpen(true)} variant="outline">
                                        Criar primeiro orçamento
                                    </Button>
                                )}
                            </div>
                        ) : (
                            sharedBudgets.map((budget) => (
                                <BudgetCard
                                    key={budget.id}
                                    budget={budget}
                                    isLeader={isLeader}
                                // Implement edit/delete handlers if needed, for now just pass props
                                />
                            ))
                        )}
                    </div>

                    {hybridOrPersonal.length > 0 && (
                        <div className="mt-6 space-y-4">
                            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Híbridos & Pessoais</h3>
                            <div className="grid gap-4 sm:grid-cols-2">
                                {hybridOrPersonal.map((budget) => (
                                    <BudgetCard
                                        key={budget.id}
                                        budget={budget}
                                        isLeader={isLeader}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </section>

                {/* Funds Section */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">Caixinhas & Objetivos</h2>
                            <p className="text-sm text-muted-foreground">Poupança para sonhos em comum.</p>
                        </div>
                        {isLeader && (
                            <Button onClick={() => setFundDialogOpen(true)} size="sm" variant="outline" className="gap-1">
                                <Plus className="h-4 w-4" /> Nova Caixinha
                            </Button>
                        )}
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {activeFunds.length === 0 ? (
                            <div className="col-span-full flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                    <PiggyBank className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="mt-4 text-lg font-semibold">Nenhuma caixinha ativa</h3>
                                <p className="mb-4 mt-2 text-sm text-muted-foreground">
                                    Defina metas financeiras para viagens, compras ou reservas de emergência.
                                </p>
                                {isLeader && (
                                    <Button onClick={() => setFundDialogOpen(true)} variant="outline">
                                        Criar primeira caixinha
                                    </Button>
                                )}
                            </div>
                        ) : (
                            activeFunds.map((fund) => (
                                <FundCard
                                    key={fund.id}
                                    fund={fund}
                                    isLeader={isLeader}
                                    onDeposit={(f) => setActiveFundAction({ fund: f, mode: 'DEPOSIT' })}
                                    onWithdraw={(f) => setActiveFundAction({ fund: f, mode: 'WITHDRAW' })}
                                />
                            ))
                        )}
                    </div>
                </section>
            </div>

            <div className="space-y-6">
                <TimelineFeed events={timelineEvents} />
                {/* Add Alerts component here if needed */}
            </div>

            <CreateBudgetDialog
                open={isBudgetDialogOpen}
                onOpenChange={setBudgetDialogOpen}
                onSuccess={onCreateBudget}
                members={members}
            />

            <CreateFundDialog
                open={isFundDialogOpen}
                onOpenChange={setFundDialogOpen}
                onSuccess={onCreateBudget} // Reusing onCreateBudget as it fetches cell data
                members={members}
            />

            <FundActionDialog
                fund={activeFundAction.fund}
                mode={activeFundAction.mode}
                onClose={() => setActiveFundAction({ fund: null, mode: null })}
                onSuccess={onCreateBudget}
            />
        </div>
    );
}
