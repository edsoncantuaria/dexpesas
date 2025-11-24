'use client';

import { useEffect, useState } from 'react';
import { DebtCalculator } from '@/components/dashboard/dividas/debt-calculator';
import { DebtTimeline } from '@/components/dashboard/dividas/debt-timeline';
import { DebtDashboardOverview } from '@/components/dashboard/dividas/debt-dashboard-overview';
import { ActiveDebtsList } from '@/components/dashboard/dividas/active-debts-list';
import { DebtInsightsWidget } from '@/components/dashboard/dividas/debt-insights-widget';
import { DebtTrendsCard } from '@/components/dashboard/dividas/debt-trends-card';
import { DebtRecommendationsPanel } from '@/components/dashboard/dividas/debt-recommendations-panel';
import { DebtSimulatorCard } from '@/components/dashboard/dividas/debt-simulator-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingDown, LayoutDashboard, List, BarChart3, Lightbulb } from 'lucide-react';
import { useDebts } from '@/hooks/use-debts';

export default function DebtManagementPage() {
    const { debts, fetchDebts, deleteDebt, isLoading } = useDebts();
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchDebts();
    }, [fetchDebts]);

    // Transform API debts for Timeline component
    const timelineDebts = debts.map(d => ({
        id: d.id,
        name: d.name,
        balance: Number(d.currentBalance),
        interestRate: Number(d.interestRate),
        minimumPayment: Number(d.minimumPayment)
    }));

    return (
        <div className="container max-w-7xl py-8 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <TrendingDown className="h-8 w-8" />
                    Gestão de Dívidas
                </h1>
                <p className="text-muted-foreground mt-2">
                    Acompanhe, planeje e elimine suas dívidas de forma estratégica.
                </p>
            </div>

            {/* Overview Cards */}
            <DebtDashboardOverview debts={debts} />

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="w-full justify-start overflow-x-auto">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        Visão Geral
                    </TabsTrigger>
                    <TabsTrigger value="recommendations" className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4" />
                        Recomendações
                    </TabsTrigger>
                    <TabsTrigger value="calculator" className="flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Simulador & Cadastro
                    </TabsTrigger>
                    <TabsTrigger value="timeline" className="flex items-center gap-2">
                        <TrendingDown className="h-4 w-4" />
                        Linha do Tempo
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Análises
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                        <div className="lg:col-span-2">
                            <ActiveDebtsList debts={debts} onDelete={deleteDebt} />
                        </div>
                        <div className="lg:col-span-1">
                            {/* Mini Timeline Preview */}
                            <DebtTimeline debts={timelineDebts} strategy="snowball" extraPayment={0} />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="recommendations" className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                        <DebtTrendsCard />
                        <DebtRecommendationsPanel />
                    </div>
                    <DebtSimulatorCard />
                </TabsContent>

                <TabsContent value="calculator">
                    <DebtCalculator />
                </TabsContent>

                <TabsContent value="timeline">
                    <div className="space-y-4">
                        <DebtTimeline debts={timelineDebts} strategy="snowball" extraPayment={0} />
                        <DebtTimeline debts={timelineDebts} strategy="avalanche" extraPayment={0} />
                    </div>
                </TabsContent>

                <TabsContent value="analytics">
                    <DebtInsightsWidget />
                </TabsContent>
            </Tabs>
        </div>
    );
}
