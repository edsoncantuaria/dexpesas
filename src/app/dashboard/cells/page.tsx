'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import type {
  Clan,
  CellBudget,
  CellFund,
  CellSplitRule,
  CellDecision,
  CellTimelineEvent,
  CellEquilibriumEntry,
} from '@/lib/definitions';
import { CellSummaryCard } from '@/components/dashboard/overview/cell-summary-card';
import {
  Plus,
  RefreshCcw,
  Users,
  Wallet,
  PiggyBank,
  SplitSquareHorizontal,
  ShieldCheck,
} from 'lucide-react';

type WizardInviteForm = {
  email: string;
  permissions: {
    viewPersonalBudget: boolean;
    recordTransactions: boolean;
    moveFunds: boolean;
    vote: boolean;
  };
  sharePersonalData: boolean;
};

type RateioForm = {
  name: string;
  trigger: CellSplitRule['trigger'];
  method: CellSplitRule['method'];
  autoReimburse: boolean;
  description: string;
};

export default function CellsDashboardPage() {
  const { user, isLoading: userLoading, fetchUser } = useUser();
  const { toast } = useToast();
  const [cell, setCell] = useState<Clan | null>(null);
  const [budgets, setBudgets] = useState<CellBudget[]>([]);
  const [funds, setFunds] = useState<CellFund[]>([]);
  const [splitRules, setSplitRules] = useState<CellSplitRule[]>([]);
  const [decisions, setDecisions] = useState<CellDecision[]>([]);
  const [timeline, setTimeline] = useState<CellTimelineEvent[]>([]);
  const [equilibrium, setEquilibrium] = useState<CellEquilibriumEntry[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateCellOpen, setIsCreateCellOpen] = useState(false);

  const cellId = user?.clanId || null;

  const fetchCellData = useCallback(async () => {
    if (!cellId) {
      setCell(null);
      setBudgets([]);
      setFunds([]);
      setSplitRules([]);
      setDecisions([]);
      setTimeline([]);
      setEquilibrium([]);
      setAlerts([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const [
        cellRes,
        budgetsRes,
        fundsRes,
        splitRes,
        decisionsRes,
        timelineRes,
        equilibriumRes,
        alertsRes,
      ] = await Promise.all([
        api.get(`/cells/${cellId}`),
        api.get(`/cells/${cellId}/budgets`),
        api.get(`/cells/${cellId}/funds`),
        api.get(`/cells/${cellId}/split-rules`),
        api.get(`/cells/${cellId}/decisions`),
        api.get(`/cells/${cellId}/timeline`),
        api.get(`/cells/${cellId}/equilibrium`),
        api.get(`/cells/${cellId}/alerts`),
      ]);
      setCell(cellRes.data);
      setBudgets(budgetsRes.data);
      setFunds(fundsRes.data);
      setSplitRules(splitRes.data);
      setDecisions(decisionsRes.data);
      setTimeline(timelineRes.data);
      setEquilibrium(
        Array.isArray(equilibriumRes.data) ? equilibriumRes.data : []
      );
      setAlerts(alertsRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados da célula', error);
      toast({
        variant: 'destructive',
        title: 'Não foi possível carregar a célula',
        description: 'Tente novamente em instantes.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [cellId, toast]);

  useEffect(() => {
    if (!userLoading) {
      fetchCellData();
    }
  }, [fetchCellData, userLoading]);

  const handleCreateCell = async (data: { name: string; description?: string; iconUrl?: string }) => {
    try {
      await api.post('/cells', data);
      await fetchUser();
      await fetchCellData();
      setIsCreateCellOpen(false);
      toast({ title: 'Célula criada com sucesso!' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível criar a célula',
        description: error?.response?.data?.message || 'Revise as informações e tente novamente.',
      });
    }
  };

  if (userLoading) {
    return <LoadingScreen />;
  }

  if (!cellId || !cell) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Você ainda não faz parte de uma Célula Financeira</CardTitle>
            <CardDescription>Crie um workspace colaborativo para compartilhar orçamentos, fundos e decisões com sua família ou grupo.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Dialog open={isCreateCellOpen} onOpenChange={setIsCreateCellOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar minha célula
                </Button>
              </DialogTrigger>
              <CreateCellDialog onSubmit={handleCreateCell} />
            </Dialog>
            <Link href="/dashboard">
              <Button variant="outline">Voltar ao dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold font-headline">Célula Financeira</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie budgets híbridos, rateios e decisões compartilhadas com seu grupo.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap">
          <Button variant="outline" onClick={fetchCellData} className="w-full sm:w-auto">
            <RefreshCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <ShieldCheck className="h-4 w-4 mr-2" />
                Solicitar decisão
              </Button>
            </DialogTrigger>
            <DecisionQuickDialog cellId={cellId} onSuccess={fetchCellData} />
          </Dialog>
        </div>
      </div>

      <CellSummaryCard cell={cell} funds={funds} budgets={budgets} />

      <Tabs defaultValue="home" className="space-y-6">
        <TabsList className="flex w-full flex-wrap gap-2 overflow-x-auto rounded-md bg-muted/40 p-1">
          <TabsTrigger value="home" className="flex-1 min-w-[140px]">
            Home
          </TabsTrigger>
          <TabsTrigger value="rateios" className="flex-1 min-w-[140px]">
            Transações & Rateios
          </TabsTrigger>
          <TabsTrigger value="members" className="flex-1 min-w-[140px]">
            Membros
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex-1 min-w-[140px]">
            Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="home" className="space-y-6">
          <HomeTab budgets={budgets} funds={funds} alerts={alerts} onCreateBudget={fetchCellData} />
          <TimelineFeed events={timeline} />
        </TabsContent>

        <TabsContent value="rateios" className="space-y-6">
          <SplitRulesPanel
            cellId={cellId}
            splitRules={splitRules}
            onUpdated={fetchCellData}
          />
        </TabsContent>

        <TabsContent value="members" id="convites" className="space-y-6">
          <MembersPanel
            cell={cell}
            decisions={decisions}
            onChange={fetchCellData}
          />
          <EquilibriumPanel
            entries={equilibrium}
            currentUserId={user?.id}
            cellId={cellId}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportsPanel budgets={budgets} funds={funds} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CreateCellDialog({ onSubmit }: { onSubmit: (values: { name: string; description?: string; iconUrl?: string }) => Promise<void> }) {
  const [form, setForm] = useState({ name: '', description: '', iconUrl: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setIsSubmitting(true);
    await onSubmit({
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      iconUrl: form.iconUrl.trim() || undefined,
    });
    setIsSubmitting(false);
    setForm({ name: '', description: '', iconUrl: '' });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova Célula Financeira</DialogTitle>
        <DialogDescription>Defina nome e ícone para o seu workspace.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Nome</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Família Costa" />
        </div>
        <div>
          <Label>Descrição</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Contextualize os objetivos desta célula." />
        </div>
        <div>
          <Label>Ícone (opcional)</Label>
          <Input value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} placeholder="https://..." />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting || !form.name.trim()}>
          {isSubmitting ? 'Criando...' : 'Criar célula'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function HomeTab({ budgets, funds, alerts, onCreateBudget }: { budgets: CellBudget[]; funds: CellFund[]; alerts: any[]; onCreateBudget: () => Promise<void> }) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Orçamentos híbridos</CardTitle>
            <CardDescription>Combine metas pessoais e familiares sem perder o controle.</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1" />
                Novo orçamento
              </Button>
            </DialogTrigger>
            <BudgetDialog onSuccess={onCreateBudget} />
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          {budgets.length === 0 && <p className="text-sm text-muted-foreground">Nenhum orçamento criado ainda.</p>}
          {budgets.map((budget) => (
            <div key={budget.id} className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{budget.label || 'Orçamento sem nome'}</p>
                  <p className="text-xs text-muted-foreground">{budget.type === 'CELL' ? 'Compartilhado' : budget.type === 'HYBRID' ? 'Híbrido' : 'Individual reservado à célula'}</p>
                </div>
                <Badge variant="outline">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(budget.limit))}</Badge>
              </div>
              {budget.splitConfig && (
                <pre className="bg-muted rounded p-2 text-xs text-muted-foreground overflow-x-auto">{JSON.stringify(budget.splitConfig, null, 2)}</pre>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Caixinhas coletivas</CardTitle>
            <CardDescription>Crie fundos para viagens, emergências ou projetos.</CardDescription>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="w-full sm:w-auto">
                <PiggyBank className="h-4 w-4 mr-1" />
                Novo fundo
              </Button>
            </DialogTrigger>
            <FundDialog onSuccess={onCreateBudget} />
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-3">
          {funds.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma caixinha criada ainda.</p>}
          {funds.map((fund) => (
            <div key={fund.id} className="rounded-md border p-3 space-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{fund.name}</p>
                  <p className="text-xs text-muted-foreground">{fund.status === 'ACTIVE' ? 'Em construção' : fund.status === 'COMPLETED' ? 'Meta atingida' : 'Pausado'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(fund.currentAmount || 0))}</p>
                  <p className="text-xs text-muted-foreground">Meta {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(fund.targetAmount || 0))}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {fund.contributions.slice(0, 3).map((contribution) => (
                  <Badge key={contribution.id} variant="secondary">
                    {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(contribution.amount))}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Alertas da célula</CardTitle>
          <CardDescription>Monitoramento automático de budgets, fundos e comportamento financeiro.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {alerts.length === 0 && <p className="text-sm text-muted-foreground">Nenhum alerta crítico no momento.</p>}
          {alerts.map((alert) => (
            <div key={alert.id || alert.type} className="rounded-md border p-3 space-y-1">
              <p className="font-semibold">{alert.title || alert.type}</p>
              <p className="text-xs text-muted-foreground">{alert.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function BudgetDialog({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const [form, setForm] = useState({
    label: '',
    limit: 0,
    type: 'CELL' as CellBudget['type'],
    splitConfig: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const cellId = user?.clanId || '';

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await api.post(`/cells/${cellId}/budgets`, {
        label: form.label,
        limit: Number(form.limit),
        type: form.type,
        splitConfig: form.splitConfig ? JSON.parse(form.splitConfig) : null,
      });
      toast({ title: 'Orçamento criado!' });
      await onSuccess();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Não foi possível criar o orçamento.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Novo orçamento híbrido</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Nome</Label>
          <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
        </div>
        <div>
          <Label>Limite</Label>
          <Input type="number" value={form.limit} onChange={(e) => setForm({ ...form, limit: Number(e.target.value) })} />
        </div>
        <div>
          <Label>Tipo</Label>
          <select
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value as CellBudget['type'] })}
          >
            <option value="CELL">Compartilhado</option>
            <option value="HYBRID">Híbrido</option>
            <option value="PERSONAL">Pessoal (com rateio)</option>
          </select>
        </div>
        <div>
          <Label>Configuração de rateio (JSON)</Label>
          <Textarea
            value={form.splitConfig}
            onChange={(e) => setForm({ ...form, splitConfig: e.target.value })}
            placeholder='Ex: {"members":[{"memberId":"123","share":50}]}'
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting || !form.label || !form.limit}>
          {isSubmitting ? 'Salvando...' : 'Salvar orçamento'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function FundDialog({ onSuccess }: { onSuccess: () => Promise<void> }) {
  const { user } = useUser();
  const { toast } = useToast();
  const cellId = user?.clanId || '';
  const [form, setForm] = useState({
    name: '',
    targetAmount: 0,
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/cells/${cellId}/funds`, {
        name: form.name,
        targetAmount: Number(form.targetAmount),
        usagePolicy: form.description ? { notes: form.description } : null,
      });
      toast({ title: 'Fundo criado!' });
      await onSuccess();
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível criar o fundo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova caixinha coletiva</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Nome</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <Label>Meta financeira</Label>
          <Input type="number" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: Number(e.target.value) })} />
        </div>
        <div>
          <Label>Notas / Política de uso</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting || !form.name || !form.targetAmount}>
          {isSubmitting ? 'Salvando...' : 'Criar fundo'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function SplitRulesPanel({
  cellId,
  splitRules,
  onUpdated,
}: {
  cellId: string;
  splitRules: CellSplitRule[];
  onUpdated: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const handleApplyRule = async (ruleId: string) => {
    try {
      await api.post(`/cells/${cellId}/split-engine`, { ruleId, expenseId: ruleId });
      toast({ title: 'Rateio aplicado com sucesso!' });
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível aplicar o rateio.' });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Transações & Rateios</CardTitle>
          <CardDescription>Automatize como cada despesa recorrente é dividida.</CardDescription>
        </div>
        <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
          <DialogTrigger asChild>
            <Button>
              <SplitSquareHorizontal className="h-4 w-4 mr-2" />
              Rateio em 3 cliques
            </Button>
          </DialogTrigger>
          <SplitWizard cellId={cellId} onSuccess={async () => { setIsWizardOpen(false); await onUpdated(); }} />
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {splitRules.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma regra configurada.</p>}
        {splitRules.map((rule) => (
          <div key={rule.id} className="rounded-md border p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{rule.name}</p>
                <p className="text-xs text-muted-foreground">
                  {rule.method} • {rule.trigger}
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={() => handleApplyRule(rule.id)}>
                Rodar agora
              </Button>
            </div>
            {rule.weightsConfig && (
              <pre className="bg-muted rounded p-2 text-xs text-muted-foreground overflow-x-auto">{JSON.stringify(rule.weightsConfig, null, 2)}</pre>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function SplitWizard({ cellId, onSuccess }: { cellId: string; onSuccess: () => Promise<void> }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RateioForm>({
    name: '',
    trigger: 'RECURRING_BILL',
    method: 'EQUAL',
    autoReimburse: false,
    description: '',
  });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/cells/${cellId}/split-rules`, {
        name: form.name,
        trigger: form.trigger,
        method: form.method,
        autoReimburse: form.autoReimburse,
        metadata: form.description ? { description: form.description } : null,
      });
      toast({ title: 'Regra criada com sucesso!' });
      await onSuccess();
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível salvar o rateio.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="space-y-4">
      <DialogHeader>
        <DialogTitle>Rateio em 3 cliques</DialogTitle>
        <DialogDescription>Configure rapidamente como a despesa será dividida.</DialogDescription>
      </DialogHeader>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {[1, 2, 3].map((current) => (
          <div
            key={current}
            className={`h-2 flex-1 rounded ${step >= current ? 'bg-primary' : 'bg-muted'}`}
          />
        ))}
      </div>
      {step === 1 && (
        <div className="space-y-3">
          <Label>Nome da regra</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <div>
            <Label>Gatilho</Label>
            <select
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={form.trigger}
              onChange={(e) => setForm({ ...form, trigger: e.target.value as RateioForm['trigger'] })}
            >
              <option value="RECURRING_BILL">Conta recorrente</option>
              <option value="ADHOC">Despesa pontual</option>
              <option value="USAGE_BASED">Por consumo</option>
            </select>
          </div>
          <div>
            <Label>Método</Label>
            <select
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value as RateioForm['method'] })}
            >
              <option value="EQUAL">Igualitário</option>
              <option value="WEIGHTED">Por peso</option>
              <option value="CONSUMPTION">Por consumo informado</option>
              <option value="PAYER_REIMBURSED">Reembolso para quem paga</option>
            </select>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Resumo</p>
              <p className="text-xs text-muted-foreground">Verifique antes de confirmar.</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.autoReimburse} onCheckedChange={(checked) => setForm({ ...form, autoReimburse: checked })} />
              <span className="text-xs text-muted-foreground">Reembolsar automaticamente</span>
            </div>
          </div>
          <Card className="bg-muted/40">
            <CardContent className="p-4 text-sm text-muted-foreground space-y-2">
              <p><strong>Nome:</strong> {form.name || '—'}</p>
              <p><strong>Trigger:</strong> {form.trigger}</p>
              <p><strong>Método:</strong> {form.method}</p>
              <p><strong>Reembolso automático:</strong> {form.autoReimburse ? 'Sim' : 'Não'}</p>
            </CardContent>
          </Card>
        </div>
      )}
      <DialogFooter className="flex flex-wrap gap-2">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep((current) => current - 1)}>
            Voltar
          </Button>
        )}
        {step < 3 && (
          <Button onClick={() => setStep((current) => current + 1)} disabled={step === 1 && !form.name}>
            Avançar
          </Button>
        )}
        {step === 3 && (
          <Button onClick={handleSubmit} disabled={isSubmitting || !form.name}>
            {isSubmitting ? 'Salvando...' : 'Concluir'}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

function MembersPanel({
  cell,
  decisions,
  onChange,
}: {
  cell: Clan;
  decisions: CellDecision[];
  onChange: () => Promise<void>;
}) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Membros e convites</CardTitle>
          <CardDescription>Configure permissões e visibilidade para cada pessoa.</CardDescription>
        </div>
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Users className="h-4 w-4 mr-2" />
              Convidar membro
            </Button>
          </DialogTrigger>
          <InviteWizard cellId={cell.id} onSuccess={async () => { setIsInviteOpen(false); await onChange(); }} />
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3">
          {cell.members?.map((member) => (
            <div key={member.userId} className="rounded-md border p-3 flex items-center justify-between">
              <div>
                <p className="font-semibold">{member.user?.name || 'Membro'}</p>
                <p className="text-xs text-muted-foreground">Papel: {member.role}</p>
              </div>
              <Badge variant={member.role === 'LEADER' ? 'default' : 'secondary'}>{member.role}</Badge>
            </div>
          ))}
        </div>
        <div className="rounded-md border bg-muted/30 p-3 space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Decisões recentes</p>
          {decisions.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma solicitação recente.</p>}
          {decisions.slice(0, 3).map((decision) => (
            <div key={decision.id} className="text-sm">
              <p className="font-semibold">{decision.title}</p>
              <p className="text-xs text-muted-foreground">{new Date(decision.createdAt).toLocaleString('pt-BR')}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function InviteWizard({ cellId, onSuccess }: { cellId: string; onSuccess: () => Promise<void> }) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const [form, setForm] = useState<WizardInviteForm>({
    email: '',
    permissions: {
      viewPersonalBudget: false,
      recordTransactions: true,
      moveFunds: false,
      vote: true,
    },
    sharePersonalData: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/cells/${cellId}/decisions`, {
        title: `Convite para ${form.email}`,
        description: 'Solicitação para novo membro com permissões personalizadas.',
        options: ['APROVAR', 'RECUSAR'],
        payload: { ...form },
      });
      toast({ title: 'Solicitação registrada. Avise os membros para aprovar.' });
      await onSuccess();
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível registrar a solicitação.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="space-y-4">
      <DialogHeader>
        <DialogTitle>Convidar novo membro</DialogTitle>
        <DialogDescription>Configurações de visibilidade e permissão personalizadas.</DialogDescription>
      </DialogHeader>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {[1, 2, 3].map((current) => (
          <div key={current} className={`h-2 flex-1 rounded ${step >= current ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
      {step === 1 && (
        <div className="space-y-3">
          <Label>Email ou ID do convidado</Label>
          <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="pessoa@exemplo.com" />
        </div>
      )}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Permissões</p>
          {Object.entries(form.permissions).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between text-sm">
              <span>{permissionLabel(key)}</span>
              <Switch checked={value} onCheckedChange={(checked) => setForm({ ...form, permissions: { ...form.permissions, [key]: checked } })} />
            </div>
          ))}
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold">Compartilhamento de dados pessoais</p>
          <div className="flex items-center justify-between">
            <span className="text-sm">Permitir visualizar meu orçamento pessoal</span>
            <Switch checked={form.sharePersonalData} onCheckedChange={(checked) => setForm({ ...form, sharePersonalData: checked })} />
          </div>
          <p className="text-xs text-muted-foreground">
            Essa configuração é armazenada como uma decisão. Após aprovação, o convite é liberado automaticamente.
          </p>
        </div>
      )}
      <DialogFooter className="flex flex-wrap gap-2">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep((current) => current - 1)}>
            Voltar
          </Button>
        )}
        {step < 3 && (
          <Button onClick={() => setStep((current) => current + 1)} disabled={step === 1 && !form.email}>
            Avançar
          </Button>
        )}
        {step === 3 && (
          <Button onClick={handleSubmit} disabled={isSubmitting || !form.email}>
            {isSubmitting ? 'Registrando...' : 'Enviar para aprovação'}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

function permissionLabel(key: string) {
  switch (key) {
    case 'viewPersonalBudget':
      return 'Ver orçamento pessoal';
    case 'recordTransactions':
      return 'Registrar transações';
    case 'moveFunds':
      return 'Mover fundos';
    case 'vote':
      return 'Participar de votações';
    default:
      return key;
  }
}

function TimelineFeed({ events }: { events: CellTimelineEvent[] }) {
  const [filter, setFilter] = useState<string>('all');
  const filtered = filter === 'all' ? events : events.filter((event) => event.type === filter);
  const uniqueTypes = Array.from(new Set(events.map((event) => event.type)));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Timeline compartilhada</CardTitle>
          <CardDescription>Registro de tudo que ocorre na célula.</CardDescription>
        </div>
        <select
          className="rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todos</option>
          {uniqueTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </CardHeader>
      <CardContent className="space-y-3">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground">Nenhum evento recente.</p>}
        {filtered.slice(0, 10).map((event) => (
          <div key={event.id} className="rounded-md border p-3 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <p className="font-semibold">{event.title || event.type}</p>
              <span className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleString('pt-BR')}</span>
            </div>
            {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function EquilibriumPanel({
  entries,
  currentUserId,
  cellId,
}: {
  entries: CellEquilibriumEntry[];
  currentUserId?: string;
  cellId: string;
}) {
  const positives = entries.filter((entry) => entry.balance > 0);
  const negatives = entries.filter((entry) => entry.balance < 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Equilíbrio familiar</CardTitle>
        <CardDescription>Veja quem deve ou tem a receber.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-green-600">
              <Wallet className="h-4 w-4" />
              Você tem a receber
            </h3>
          </div>
          <div className="space-y-2">
            {positives.length === 0 && <p className="text-xs text-muted-foreground">Ninguém te deve por enquanto.</p>}
            {positives.map((entry) => (
              <div key={entry.userId} className="rounded-md border p-2 flex items-center justify-between">
                <span className="text-sm">{entry.userId}</span>
                <span className="text-sm font-semibold text-green-600">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.balance)}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold flex items-center gap-2 text-red-600">
              <Wallet className="h-4 w-4" />
              Você deve
            </h3>
          </div>
          <div className="space-y-2">
            {negatives.length === 0 && <p className="text-xs text-muted-foreground">Sem débitos.</p>}
            {negatives.map((entry) => (
              <div key={entry.userId} className="rounded-md border p-2 flex items-center justify-between">
                <span className="text-sm">{entry.userId}</span>
                <Button variant="ghost" size="sm" className="h-7 px-2 text-red-600">
                  Registrar Pix ({Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(entry.balance))})
                </Button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReportsPanel({ budgets, funds }: { budgets: CellBudget[]; funds: CellFund[] }) {
  const totalCellBudgets = budgets
    .filter((budget) => budget.type !== 'PERSONAL')
    .reduce((acc, budget) => acc + Number(budget.limit), 0);
  const totalHybridPersonal = budgets
    .filter((budget) => budget.type === 'PERSONAL')
    .reduce((acc, budget) => acc + Number(budget.limit), 0);
  const totalFunds = funds.reduce((acc, fund) => acc + Number(fund.currentAmount || 0), 0);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Relatório pessoal vs. família</CardTitle>
          <CardDescription>Comparativo rápido para entender quanto destina à célula.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Orçamentos compartilhados</span>
            <span className="font-semibold">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCellBudgets)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Reservas pessoais destinadas à célula</span>
            <span className="font-semibold">{Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalHybridPersonal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-primary">
            <span>Total combinado</span>
            <span className="font-semibold">
              {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalCellBudgets + totalHybridPersonal)}
            </span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Investimentos coletivos</CardTitle>
          <CardDescription>Caixas e fundos que sustentam a célula.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Caixas em andamento</span>
            <span className="font-semibold">{funds.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Total poupado</span>
            <span className="font-semibold">
              {Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalFunds)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DecisionQuickDialog({ cellId, onSuccess }: { cellId: string; onSuccess: () => Promise<void> }) {
  const [form, setForm] = useState({ title: '', description: '' });
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await api.post(`/cells/${cellId}/decisions`, {
        title: form.title,
        description: form.description,
        options: ['APROVAR', 'RECUSAR'],
      });
      toast({ title: 'Decisão criada!' });
      await onSuccess();
      setForm({ title: '', description: '' });
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível criar a decisão.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nova decisão</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Título</Label>
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div>
          <Label>Descrição</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting || !form.title}>
          {isSubmitting ? 'Salvando...' : 'Enviar para votação'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
