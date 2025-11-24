'use client';

import { useEffect, useState } from 'react';
import { useInvestments, PortfolioOverview } from '@/hooks/use-investments';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, TrendingUp, DollarSign, PieChart, Upload, Wand2 } from 'lucide-react';
import PortfolioList from './portfolio-list';
import SimulationPanel from './simulation-panel';
import TradeModal from './trade-modal';
import AllocationPieChart from './allocation-pie-chart';
import InvestmentWizard from './investment-wizard';
import ImportInvestmentsModal from './import-investments-modal';

export default function InvestmentDashboard() {
    const { fetchOverview, loading } = useInvestments();
    const [overview, setOverview] = useState<PortfolioOverview | null>(null);
    const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await fetchOverview();
        setOverview(data);
    };

    if (loading && !overview) {
        return <div className="p-8 text-center">Carregando carteira...</div>;
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Investimentos</h1>
                    <p className="text-muted-foreground">Gerencie seu patrimônio e acompanhe suas metas.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Importar B3
                    </Button>
                    {(!overview?.portfolios || overview.portfolios.length === 0) && (
                        <Button variant="secondary" onClick={() => setIsWizardOpen(true)} className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600 border-0">
                            <Wand2 className="mr-2 h-4 w-4" />
                            Começar a Investir
                        </Button>
                    )}
                    <Button onClick={() => setIsTradeModalOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Aporte
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overview?.totalCurrentValue || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {overview?.totalPnL && overview.totalPnL >= 0 ? '+' : ''}
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overview?.totalPnL || 0)} de lucro
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Rentabilidade</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${overview?.totalReturnPercent && overview.totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {overview?.totalReturnPercent?.toFixed(2)}%
                        </div>
                        <p className="text-xs text-muted-foreground">Retorno sobre o investido</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Renda Fixa</CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overview?.allocation.fixedIncome || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {overview?.totalCurrentValue ? ((overview.allocation.fixedIncome / overview.totalCurrentValue) * 100).toFixed(1) : 0}% da carteira
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Renda Variável</CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overview?.allocation.variableIncome || 0)}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {overview?.totalCurrentValue ? ((overview.allocation.variableIncome / overview.totalCurrentValue) * 100).toFixed(1) : 0}% da carteira
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <div className="md:col-span-2">
                    <Tabs defaultValue="portfolios" className="space-y-4">
                        <TabsList>
                            <TabsTrigger value="portfolios">Minhas Carteiras</TabsTrigger>
                            <TabsTrigger value="simulation">Simulações</TabsTrigger>
                        </TabsList>
                        <TabsContent value="portfolios" className="space-y-4">
                            <PortfolioList portfolios={overview?.portfolios || []} />
                        </TabsContent>
                        <TabsContent value="simulation">
                            <SimulationPanel />
                        </TabsContent>
                    </Tabs>
                </div>
                <div>
                    <AllocationPieChart allocation={overview?.allocation || { fixedIncome: 0, variableIncome: 0, crypto: 0, other: 0 }} />
                </div>
            </div>

            <TradeModal
                isOpen={isTradeModalOpen}
                onClose={() => setIsTradeModalOpen(false)}
                onSuccess={() => {
                    setIsTradeModalOpen(false);
                    loadData();
                }}
            />

            <InvestmentWizard
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSuccess={() => {
                    setIsWizardOpen(false);
                    loadData();
                }}
            />

            <ImportInvestmentsModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onSuccess={() => {
                    // Keep modal open to show results or close? 
                    // The modal handles its own closing on success usually, or we can force reload here
                    loadData();
                }}
            />
        </div>
    );
}
