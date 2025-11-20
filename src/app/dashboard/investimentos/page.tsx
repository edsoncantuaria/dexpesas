// src/app/dashboard/investimentos/page.tsx
'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { addMonths, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2, PlusCircle, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { LoadingScreen } from '@/components/ui/loading-screen';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Account,
  InvestmentAnalysis,
  InvestmentContribution,
  InvestmentPerformance,
  InvestmentPlan,
  InvestmentPlanPayload,
  InvestmentMetricSnapshot,
  InvestmentHolding,
  Goal,
  User,
} from '@/lib/definitions';
import InvestmentPlannerCard from '@/components/dashboard/investments/investment-planner-card';
import InvestmentHoldingList from '@/components/dashboard/investments/investment-holding-list';
import LeisureVsInvestmentGauge from '@/components/dashboard/investments/leisure-vs-investment-gauge';
import InvestmentPerformanceChart from '@/components/dashboard/investments/investment-performance-chart';
import InvestmentOnboardingDialog, {
  OnboardingPayload,
} from '@/components/dashboard/investments/investment-onboarding-dialog';
import InvestmentProjectionCard from '@/components/dashboard/investments/investment-projection-card';
import InvestmentEducationCard from '@/components/dashboard/investments/investment-education-card';
import InvestmentMetricsCard from '@/components/dashboard/investments/investment-metrics-card';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const percentFormatter = new Intl.NumberFormat('pt-BR', { style: 'percent', maximumFractionDigits: 2 });
const contributionSourceLabel: Record<string, string> = {
  MANUAL: 'Manual',
  AUTOMATION: 'Automação',
  WINDFALL: 'Extra',
  AI_SUGGESTION: 'Sugestão IA',
};

const getContributionSourceLabel = (source: string) => contributionSourceLabel[source] ?? source;

type ContributionFormState = {
  amount: string;
  sourceAccountId: string;
  destinationAccountId: string;
  description: string;
  notes: string;
};

function formatMonthLabel(month: string) {
  try {
    return format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: ptBR });
  } catch {
    return month;
  }
}

export default function InvestimentosPage() {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [plan, setPlan] = useState<InvestmentPlan | null>(null);
  const [planDefaults, setPlanDefaults] = useState<Partial<InvestmentPlan> | null>(null);
  const [analysis, setAnalysis] = useState<InvestmentAnalysis | null>(null);
  const [performance, setPerformance] = useState<InvestmentPerformance | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [holdings, setHoldings] = useState<InvestmentHolding[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [metrics, setMetrics] = useState<InvestmentMetricSnapshot | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPlanSaving, setIsPlanSaving] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [hasDismissedOnboarding, setHasDismissedOnboarding] = useState(false);
  const [isSubmittingOnboarding, setIsSubmittingOnboarding] = useState(false);
  const [isContributionDialogOpen, setIsContributionDialogOpen] = useState(false);
  const [isSubmittingContribution, setIsSubmittingContribution] = useState(false);
  const [contributionForm, setContributionForm] = useState<ContributionFormState>({
    amount: '',
    sourceAccountId: '',
    destinationAccountId: '',
    description: '',
    notes: '',
  });

  const investmentAccounts = useMemo(
    () => accounts.filter((account) => account.tipo === 'investimento' && !account.isArchived),
    [accounts],
  );
  const cashAccounts = useMemo(
    () => accounts.filter((account) => account.tipo !== 'investimento' && !account.isArchived),
    [accounts],
  );

  const fetchAll = useCallback(
    async (options?: { showLoader?: boolean }) => {
      const showLoader = options?.showLoader ?? false;
      showLoader ? setIsPageLoading(true) : setIsRefreshing(true);
      try {
        const [
          planResponse,
          performanceResponse,
          accountsResponse,
          holdingsResponse,
          goalsResponse,
          userResponse,
          metricsResponse,
        ] = await Promise.all([
          api.get(`/investments/plan?month=${selectedMonth}`),
          api.get(`/investments/performance?month=${selectedMonth}`),
          api.get('/accounts'),
          api.get('/investments/holdings'),
          api.get('/goals'),
          api.get('/user'),
          api.get(`/investments/metrics?month=${selectedMonth}`),
        ]);
        setPlan(planResponse.data?.plan ?? null);
        setPlanDefaults(planResponse.data?.defaults ?? null);
        setAnalysis(planResponse.data?.analysis ?? null);
        setPerformance(performanceResponse.data ?? null);
        setAccounts(accountsResponse.data ?? []);
        setHoldings(holdingsResponse.data ?? []);
        setGoals(goalsResponse.data ?? []);
        setUser(userResponse.data ?? null);
        const metricsData =
          metricsResponse.data && Object.keys(metricsResponse.data).length ? metricsResponse.data : null;
        setMetrics(metricsData);
      } catch (error) {
        console.error(error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar investimentos',
          description: 'Não foi possível carregar os dados. Tente novamente em instantes.',
        });
      } finally {
        showLoader ? setIsPageLoading(false) : setIsRefreshing(false);
      }
    },
    [selectedMonth, toast],
  );

  useEffect(() => {
    fetchAll({ showLoader: true });
  }, [fetchAll]);

  useEffect(() => {
    if ((!plan || !plan.id) && !hasDismissedOnboarding) {
      setIsOnboardingOpen(true);
    }
  }, [plan, hasDismissedOnboarding]);

  useEffect(() => {
    if (isContributionDialogOpen) {
      setContributionForm({
        amount: '',
        sourceAccountId: cashAccounts[0]?.id ?? '',
        destinationAccountId: investmentAccounts[0]?.id ?? '',
        description: '',
        notes: '',
      });
    }
  }, [isContributionDialogOpen, cashAccounts, investmentAccounts]);

  const changeMonth = (delta: number) => {
    try {
      const currentDate = parseISO(`${selectedMonth}-01`);
      const newMonth = format(addMonths(currentDate, delta), 'yyyy-MM');
      setSelectedMonth(newMonth);
    } catch {
      setSelectedMonth(format(new Date(), 'yyyy-MM'));
    }
  };

  const handlePlanSave = async (payload: InvestmentPlanPayload) => {
    setIsPlanSaving(true);
    try {
      await api.post('/investments/plan', payload);
      toast({ title: 'Plano atualizado!', description: 'O planejamento foi salvo com sucesso.' });
      await fetchAll();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar plano',
        description: 'Verifique os dados e tente novamente.',
      });
    } finally {
      setIsPlanSaving(false);
    }
  };

  const handleOnboardingSubmit = async (payload: OnboardingPayload) => {
    setIsSubmittingOnboarding(true);
    try {
      const response = await api.post('/investments/onboarding', {
        ...payload,
        month: selectedMonth,
      });
      setPlan(response.data.plan ?? null);
      setAnalysis(response.data.analysis ?? null);
      toast({
        title: 'Plano personalizado!',
        description: 'Agora conseguimos recomendar aportes e lazer de forma mais inteligente.',
      });
      setHasDismissedOnboarding(true);
      setIsOnboardingOpen(false);
      await fetchAll();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao configurar plano',
        description: 'Não foi possível concluir o onboarding. Confira os valores e tente novamente.',
      });
    } finally {
      setIsSubmittingOnboarding(false);
    }
  };

  const handleCreateHolding = async (payload: {
    accountId: string;
    assetClass: string;
    ticker?: string;
    expectedReturn?: number | string;
    goalId?: string | null;
  }) => {
    try {
      await api.post('/investments/holdings', payload);
      toast({ title: 'Holding criado!', description: 'Agora você pode acompanhar esse investimento.' });
      await fetchAll();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao criar holding',
        description: 'Revise os dados e tente novamente.',
      });
    }
  };

  const handleUpdateHolding = async (
    holdingId: string,
    payload: { assetClass?: string; ticker?: string; expectedReturn?: number | string; goalId?: string | null },
  ) => {
    try {
      await api.patch(`/investments/holdings/${holdingId}`, payload);
      toast({ title: 'Holding atualizado!', description: 'As informações foram salvas.' });
      await fetchAll();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar holding',
        description: 'Não foi possível salvar as alterações.',
      });
    }
  };

  const handleDeleteHolding = async (holdingId: string) => {
    try {
      await api.delete(`/investments/holdings/${holdingId}`);
      toast({ title: 'Holding removido', description: 'Removemos a carteira da sua visão.' });
      await fetchAll();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao remover holding',
        description: 'Tente novamente em instantes.',
      });
    }
  };

  const handleContributionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingContribution(true);
    try {
      await api.post('/investments/contributions', {
        amount: Number(contributionForm.amount),
        sourceAccountId: contributionForm.sourceAccountId,
        destinationAccountId: contributionForm.destinationAccountId,
        description: contributionForm.description || undefined,
        notes: contributionForm.notes || undefined,
        month: selectedMonth,
        sourceType: 'MANUAL',
      });
      toast({ title: 'Aporte registrado!', description: 'Atualizamos suas carteiras e o planner.' });
      setIsContributionDialogOpen(false);
      await fetchAll();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar aporte',
        description: 'Não foi possível registrar o aporte. Tente novamente.',
      });
    } finally {
      setIsSubmittingContribution(false);
    }
  };

  const contributions = performance?.contributions ?? [];
  const contributionsForSelectedMonth = useMemo(
    () => contributions.filter((contribution) => contribution.month === selectedMonth),
    [contributions, selectedMonth],
  );
  const contributionsSum = useMemo(
    () => contributionsForSelectedMonth.reduce((acc, contribution) => acc + (contribution.amount || 0), 0),
    [contributionsForSelectedMonth],
  );
  const isPlanOnTrack =
    Boolean(analysis?.suggestedInvestment) && contributionsSum >= 0.8 * (analysis?.suggestedInvestment || 0);
  const planBadgeLabel = isPlanOnTrack ? 'Plano em dia' : 'Precisa de atenção';
  const planBadgeVariant = isPlanOnTrack ? 'secondary' : 'destructive';
  const latestSnapshot = performance?.snapshots?.[0];
  const latestCdiBenchmark = Number(latestSnapshot?.commentaryJson?.benchmarkMonthlyReturn ?? 0);
  const latestTotalReturns = Number(latestSnapshot?.totalReturns ?? 0);
  const showCdiAlert = latestCdiBenchmark > 0 && latestTotalReturns < latestCdiBenchmark;
  const cdiMonthlyRate = Number(latestSnapshot?.commentaryJson?.cdiMonthlyRate ?? 0);
  const cdiPercentLabel = percentFormatter.format(cdiMonthlyRate || 0);
  const monthLabel = formatMonthLabel(selectedMonth);
  const canCreateContribution = cashAccounts.length > 0 && investmentAccounts.length > 0;

  if (isPageLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold">Investimentos Inteligentes</h1>
          <p className="text-muted-foreground">
            Analise o excedente, acompanhe lazer x investimentos e mantenha as contas essenciais de Casa e Mercado sob
            controle. Não movimentamos dinheiro real: você decide e nós guiamos.
          </p>
          <button
            type="button"
            className="text-xs font-medium text-primary underline-offset-4 hover:underline"
            onClick={() => {
              setHasDismissedOnboarding(false);
              setIsOnboardingOpen(true);
            }}
          >
            Repersonalizar meu plano
          </button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => changeMonth(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[140px] text-center text-sm font-semibold uppercase text-muted-foreground">
            {monthLabel}
          </div>
          <Button variant="outline" size="icon" onClick={() => changeMonth(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => fetchAll()} disabled={isRefreshing}>
            {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Accordion type="multiple" defaultValue={['planner', 'holdings', 'insights']}>
        <AccordionItem value="planner">
          <AccordionTrigger>1. Analisador Inteligente</AccordionTrigger>
          <AccordionContent className="space-y-4 p-1">
            <InvestmentPlannerCard
              plan={plan}
              defaults={planDefaults}
              analysis={analysis}
              isSaving={isPlanSaving}
              onSave={handlePlanSave}
            />
            <div className="grid gap-4 lg:grid-cols-2">
              <InvestmentProjectionCard analysis={analysis} />
              <InvestmentEducationCard />
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="holdings">
          <AccordionTrigger>2. Carteiras & Aportes</AccordionTrigger>
          <AccordionContent className="space-y-4 p-1">
            <div className="grid gap-4 lg:grid-cols-2">
              <InvestmentHoldingList
                holdings={holdings}
                accounts={investmentAccounts}
                goals={goals}
                onLinkGoal={handleLinkGoal}
                onCreateHolding={handleCreateHolding}
                onUpdateHolding={handleUpdateHolding}
                onDeleteHolding={handleDeleteHolding}
              />
              <Card className="h-full">
                <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CardTitle>Aportes recentes</CardTitle>
                      <Badge variant={planBadgeVariant}>{planBadgeLabel}</Badge>
                    </div>
                    <CardDescription>Os últimos movimentos registrados em suas carteiras.</CardDescription>
                    {analysis && (
                      <p className="text-xs text-muted-foreground">
                        Acumulado do mês: <strong>{currencyFormatter.format(contributionsSum)}</strong> de{' '}
                        {currencyFormatter.format(analysis.suggestedInvestment)} sugeridos.
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => setIsContributionDialogOpen(true)}
                    disabled={!canCreateContribution}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Registrar aporte
                  </Button>
                </CardHeader>
                <CardContent>
                  {contributions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Nenhum aporte encontrado para este mês. Use o botão acima para registrar o primeiro.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Contas</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Fonte</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {contributions.map((contribution) => {
                          const executedAt = contribution.executedAt
                            ? format(new Date(contribution.executedAt), 'dd/MM HH:mm', { locale: ptBR })
                            : '—';
                          return (
                            <TableRow key={contribution.id}>
                              <TableCell className="text-sm text-muted-foreground">{executedAt}</TableCell>
                              <TableCell>
                                <div className="font-medium">{contribution.sourceAccount?.nome || 'Origem'}</div>
                                <div className="text-xs text-muted-foreground">
                                  {contribution.destinationAccount?.nome || 'Destino'}
                                </div>
                              </TableCell>
                              <TableCell className="font-semibold">
                                {currencyFormatter.format(contribution.amount)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{getContributionSourceLabel(contribution.source)}</Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                  {!canCreateContribution && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      Cadastre ao menos uma conta de origem (corrente/poupança) e uma de destino (investimento) para
                      registrar aportes.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="insights">
          <AccordionTrigger>3. Rentabilidade & Métricas</AccordionTrigger>
          <AccordionContent className="space-y-4 p-1">
            {showCdiAlert && (
              <Alert variant="destructive">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-4 w-4 mt-1" />
                  <div>
                    <AlertTitle>Rentabilidade abaixo do CDI</AlertTitle>
                    <AlertDescription>
                      Seus investimentos renderam {currencyFormatter.format(latestTotalReturns)} no período, enquanto o CDI
                      renderia aproximadamente {currencyFormatter.format(latestCdiBenchmark)} ({cdiPercentLabel} ao mês).
                      Considere migrar parte para Tesouro Direto ou CDBs com rendimento acima do CDI para melhorar o
                      desempenho.
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
            <div className="grid gap-4 lg:grid-cols-2">
              <LeisureVsInvestmentGauge
                analysis={analysis}
                contributions={contributions}
                month={selectedMonth}
                basicNeeds={analysis?.basicNeeds}
              />
              <InvestmentPerformanceChart
                snapshots={performance?.snapshots ?? []}
                monthlyTotals={performance?.monthlyTotals ?? []}
              />
            </div>
            <InvestmentMetricsCard metrics={metrics} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <InvestmentOnboardingDialog
        open={isOnboardingOpen}
        onOpenChange={(open) => {
          setIsOnboardingOpen(open);
          if (!open && (!plan || !plan.id)) {
            setHasDismissedOnboarding(true);
          }
        }}
        isSubmitting={isSubmittingOnboarding}
        initialMonthlyIncome={user?.fixedMonthlyIncome ?? null}
        onSubmit={handleOnboardingSubmit}
      />

      <Dialog open={isContributionDialogOpen} onOpenChange={setIsContributionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar aporte</DialogTitle>
            <DialogDescription>
              Movimente valores entre uma conta de origem e uma conta de investimento para manter o histórico em dia.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleContributionSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                min="0"
                step="50"
                required
                value={contributionForm.amount}
                onChange={(event) =>
                  setContributionForm((prev) => ({ ...prev, amount: event.target.value }))
                }
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Conta de origem</Label>
                <Select
                  value={contributionForm.sourceAccountId}
                  onValueChange={(value) =>
                    setContributionForm((prev) => ({ ...prev, sourceAccountId: value }))
                  }
                  disabled={cashAccounts.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {cashAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.nome} — {account.instituicao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Conta de investimento</Label>
                <Select
                  value={contributionForm.destinationAccountId}
                  onValueChange={(value) =>
                    setContributionForm((prev) => ({ ...prev, destinationAccountId: value }))
                  }
                  disabled={investmentAccounts.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {investmentAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.nome} — {account.instituicao}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Aporte mensal automático"
                value={contributionForm.description}
                onChange={(event) =>
                  setContributionForm((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Detalhes adicionais ou contexto para o aporte."
                value={contributionForm.notes}
                onChange={(event) =>
                  setContributionForm((prev) => ({ ...prev, notes: event.target.value }))
                }
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsContributionDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmittingContribution || !contributionForm.amount}>
                {isSubmittingContribution ? 'Registrando...' : 'Registrar aporte'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
  const handleLinkGoal = async (holdingId: string, goalId: string | null) => {
    try {
      await api.patch(`/investments/holdings/${holdingId}`, { goalId });
      toast({ title: 'Holding atualizado!', description: 'Meta vinculada com sucesso.' });
      await fetchAll();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Erro ao vincular meta',
        description: 'Não foi possível atualizar o holding. Tente novamente.',
      });
    }
  };
