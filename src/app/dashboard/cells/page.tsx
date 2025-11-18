'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { format } from 'date-fns';
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
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import type {
  Clan,
  CellBudget,
  CellFund,
  CellSharedAccount,
  CellSplitRule,
  CellTimelineEvent,
  CellEquilibriumEntry,
  Category,
  Account,
} from '@/lib/definitions';
import {
  Plus,
  RefreshCcw,
  Users,
  Wallet,
  PiggyBank,
  SplitSquareHorizontal,
  Pencil,
  ImagePlus,
  LogOut,
  Trash2,
  Info,
} from 'lucide-react';
import { ClanIcon } from '@/components/dashboard/clans/clan-icon';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const toCurrency = (value: unknown) => {
  const parsed = Number(value);
  return currencyFormatter.format(Number.isFinite(parsed) ? parsed : 0);
};

export default function CellsDashboardPage() {
  const { user, isLoading: userLoading, fetchUser } = useUser();
  const { toast } = useToast();
  const [cell, setCell] = useState<Clan | null>(null);
  const [budgets, setBudgets] = useState<CellBudget[]>([]);
  const [funds, setFunds] = useState<CellFund[]>([]);
  const [sharedAccounts, setSharedAccounts] = useState<CellSharedAccount[]>([]);
  const [splitRules, setSplitRules] = useState<CellSplitRule[]>([]);
  const [timeline, setTimeline] = useState<CellTimelineEvent[]>([]);
  const [equilibrium, setEquilibrium] = useState<CellEquilibriumEntry[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateCellOpen, setIsCreateCellOpen] = useState(false);
  const [isEditCellOpen, setIsEditCellOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const cellId =
    user?.clanId ||
    user?.clanMembership?.clanId ||
    user?.clanMemberships?.[0]?.clanId ||
    null;

  const fetchCellData = useCallback(async () => {
    if (!cellId) {
      setCell(null);
      setBudgets([]);
      setFunds([]);
      setSharedAccounts([]);
      setSplitRules([]);
      setTimeline([]);
      setEquilibrium([]);
      setAlerts([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const currentMonth = format(new Date(), 'yyyy-MM');
      const [
        cellRes,
        budgetsRes,
        fundsRes,
        sharedAccountsRes,
        splitRes,
        timelineRes,
        equilibriumRes,
        alertsRes,
      ] = await Promise.all([
        api.get(`/cells/${cellId}`),
        api.get(`/cells/${cellId}/budgets?month=${currentMonth}`),
        api.get(`/cells/${cellId}/funds`),
        api.get(`/cells/${cellId}/shared-accounts`),
        api.get(`/cells/${cellId}/split-rules`),
        api.get(`/cells/${cellId}/timeline`),
        api.get(`/cells/${cellId}/equilibrium`),
        api.get(`/cells/${cellId}/alerts`),
      ]);
      setCell(cellRes.data);
      setBudgets(budgetsRes.data);
      setFunds(fundsRes.data);
      setSharedAccounts(sharedAccountsRes.data);
      setSplitRules(splitRes.data);
      setTimeline(timelineRes.data);
      setEquilibrium(
        Array.isArray(equilibriumRes.data) ? equilibriumRes.data : []
      );
      setAlerts(alertsRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados da família', error);
      toast({
        variant: 'destructive',
        title: 'Não foi possível carregar a família',
        description: 'Tente novamente em instantes.',
      });
    } finally {
      setIsLoading(false);
    }
  }, [cellId, toast]);

  const refreshSharedAccounts = useCallback(async () => {
    if (!cellId) {
      setSharedAccounts([]);
      return;
    }
    try {
      const response = await api.get(`/cells/${cellId}/shared-accounts`);
      setSharedAccounts(response.data || []);
    } catch (error) {
      console.error('Erro ao recarregar contas compartilhadas', error);
    }
  }, [cellId]);

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
      toast({ title: 'Família criada com sucesso!' });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível criar a família',
        description: error?.response?.data?.message || 'Revise as informações e tente novamente.',
      });
    }
  };

  const handleMembershipChange = useCallback(async () => {
    await fetchUser();
    await fetchCellData();
  }, [fetchCellData, fetchUser]);

  if (userLoading) {
    return <LoadingScreen />;
  }

  if (!cellId || !cell) {
    return (
      <div className="space-y-6">
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Você ainda não faz parte de uma Família Financeira</CardTitle>
            <CardDescription>Crie um workspace colaborativo para compartilhar orçamentos, fundos e decisões com sua família ou grupo.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-4">
            <Dialog open={isCreateCellOpen} onOpenChange={setIsCreateCellOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Criar minha família
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

  const currentMembership = cell.members?.find((member) => member.userId === user?.id) || null;
  const isLeader = currentMembership?.role === 'LEADER';
  const canManageSharedAccounts =
    Boolean(currentMembership?.permissions?.manageSharedAccounts) ||
    currentMembership?.role === 'LEADER' ||
    currentMembership?.role === 'ADMIN';

  return (
    <>
      <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold font-headline">Modo Família</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie budgets híbridos, rateios e decisões compartilhadas com seu grupo.
          </p>
          <p className="text-xs text-muted-foreground">
            Tudo o que você atualizar aqui aparece para os demais membros com base nas permissões configuradas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full" onClick={fetchCellData} aria-label="Atualizar dados">
                  <RefreshCcw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Atualizar dados</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={() => setIsHelpOpen(true)}
                  aria-label="Ajuda do Modo Família"
                >
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Como funciona?</TooltipContent>
            </Tooltip>
            {isLeader && cell && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                    onClick={() => setIsEditCellOpen(true)}
                    aria-label="Editar identidade"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Editar identidade</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </div>
      </div>

      {cell && isLeader && (
        <EditCellDialog
          cell={cell}
          open={isEditCellOpen}
          onOpenChange={setIsEditCellOpen}
          onSuccess={handleMembershipChange}
        />
      )}

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
          <HomeTab
            budgets={budgets}
            funds={funds}
            sharedAccounts={sharedAccounts}
            alerts={alerts}
            members={cell.members || []}
            canManageSharedAccounts={canManageSharedAccounts}
            cellId={cellId}
            onCreateBudget={fetchCellData}
            onRefreshSharedAccounts={refreshSharedAccounts}
          />
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
            currentUserId={user?.id}
            onChange={handleMembershipChange}
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
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Como funciona o Modo Família</DialogTitle>
            <DialogDescription>Resumo rápido para entender o módulo e preencher cada campo com segurança.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5 text-sm text-muted-foreground">
            <section className="space-y-2">
              <h4 className="text-base font-semibold text-foreground">Por que usar?</h4>
              <p>
                A família é um cofre compartilhado onde cada membro enxerga budgets sincronizados no orçamento pessoal, controla fundos
                dedicados e registra decisões em grupo. Tudo respeita permissões: quem não tem acesso não vê valores sensíveis.
              </p>
            </section>
            <section className="space-y-2">
              <h4 className="text-base font-semibold text-foreground">Campos dos budgets</h4>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <span className="font-medium text-foreground">Categoria:</span> escolha uma das categorias globais (as mesmas usadas ao
                  lançar transações). É ela que define onde o espelho aparecerá no orçamento pessoal.
                </li>
                <li>
                  <span className="font-medium text-foreground">Limite:</span> valor máximo que o grupo pretende gastar naquele período.
                  Esse limite é dividido entre os membros conforme a estratégia escolhida (igualitária ou porcentagens).
                </li>
                <li>
                  <span className="font-medium text-foreground">Tipo:</span> define se o budget é totalmente compartilhado (CELL),
                  híbrido (parte vai para cada membro) ou apenas pessoal atrelado ao grupo.
                </li>
                <li>
                  <span className="font-medium text-foreground">Divisão:</span> no modo porcentagem, distribua 100% entre os membros
                  ativos. Se não houver membros, convide-os antes de habilitar essa opção.
                </li>
              </ul>
            </section>
            <section className="space-y-2">
              <h4 className="text-base font-semibold text-foreground">Outros blocos</h4>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  <span className="font-medium text-foreground">Fundos e caixinhas:</span> reservam metas coletivas (ex.: viagem, reserva
                  de emergência).
                </li>
                <li>
                  <span className="font-medium text-foreground">Timeline e alertas:</span> mostram tudo que foi editado/aprovado e te
                  avisam quando um budget está estourando.
                </li>
                <li>
                  <span className="font-medium text-foreground">Decisões e rateios:</span> permitem criar votações e regras automáticas
                  para dividir despesas recorrentes.
                </li>
              </ul>
              <p className="text-xs">
                Dica: qualquer alteração relevante gera log na timeline. Use-a para auditar quem mudou limites, fundos ou permissões.
              </p>
            </section>
          </div>
        </DialogContent>
      </Dialog>
    </>
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
        <DialogTitle>Nova Família Financeira</DialogTitle>
        <DialogDescription>Defina nome e ícone para o seu workspace.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Nome</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Família Costa" />
        </div>
        <div>
          <Label>Descrição</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Contextualize os objetivos desta família." />
        </div>
        <div>
          <Label>Ícone (opcional)</Label>
          <Input value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} placeholder="https://..." />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting || !form.name.trim()}>
          {isSubmitting ? 'Criando...' : 'Criar família'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function EditCellDialog({
  cell,
  open,
  onOpenChange,
  onSuccess,
}: {
  cell: Clan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => Promise<void>;
}) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    name: cell.name,
    description: cell.description || '',
  });
  const [iconObjectName, setIconObjectName] = useState<string | null>(cell.iconUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: cell.name,
        description: cell.description || '',
      });
      setIconObjectName(cell.iconUrl || null);
    }
  }, [cell, open]);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/storage/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setIconObjectName(response.data.objectName);
      toast({ title: 'Imagem enviada com sucesso.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível enviar a imagem.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload: Record<string, any> = {
        name: form.name.trim(),
        description: form.description?.trim() || null,
        iconUrl: iconObjectName,
      };
      await api.patch(`/cells/${cell.id}`, payload);
      toast({ title: 'Informações atualizadas!' });
      await onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar.',
        description: error?.response?.data?.message || 'Tente novamente em instantes.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar identidade da família</DialogTitle>
          <DialogDescription>Atualize nome, descrição e imagem exibida no Modo Família.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <ClanIcon iconUrl={iconObjectName || cell.iconUrl || undefined} clanName={form.name || cell.name} size="lg" />
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <ImagePlus className="h-4 w-4 mr-2" />
                {isUploading ? 'Enviando...' : 'Trocar imagem'}
              </Button>
              {iconObjectName && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIconObjectName(null)}
                >
                  Remover imagem
                </Button>
              )}
            </div>
          </div>
          <div>
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={!form.name.trim() || isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HomeTab({
  budgets,
  funds,
  sharedAccounts,
  alerts,
  members,
  canManageSharedAccounts,
  cellId,
  onCreateBudget,
  onRefreshSharedAccounts,
}: {
  budgets: CellBudget[];
  funds: CellFund[];
  sharedAccounts: CellSharedAccount[];
  alerts: any[];
  members: Clan['members'];
  canManageSharedAccounts: boolean;
  cellId: string;
  onCreateBudget: () => Promise<void>;
  onRefreshSharedAccounts: () => Promise<void>;
}) {
  const { toast } = useToast();
  const totalBudgetLimit = budgets.reduce((sum, budget) => sum + Number(budget.limit || 0), 0);
  const sharedBudgets = budgets.filter((budget) => budget.type === 'CELL');
  const hybridOrPersonal = budgets.filter((budget) => budget.type !== 'CELL');
  const totalFundsAmount = funds.reduce((sum, fund) => sum + Number(fund.currentAmount || 0), 0);
  const totalFundsTargets = funds.reduce((sum, fund) => sum + Number(fund.targetAmount || 0), 0);
  const activeFunds = funds.filter((fund) => fund.status === 'ACTIVE').length;
  const [isBudgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [isFundDialogOpen, setFundDialogOpen] = useState(false);

  const handleDeleteBudget = async (budgetId: string) => {
    try {
      await api.delete(`/cells/budgets/${budgetId}`);
      toast({ title: 'Orçamento removido.' });
      await onCreateBudget();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível remover o orçamento.',
        description: error?.response?.data?.message || 'Tente novamente em instantes.',
      });
    }
  };

  const handleDeleteFund = async (fundId: string) => {
    try {
      await api.delete(`/cells/funds/${fundId}`);
      toast({ title: 'Caixinha excluída.' });
      await onCreateBudget();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível excluir a caixinha.',
        description: error?.response?.data?.message || 'Verifique se o saldo está zerado.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Orçamentos híbridos</CardTitle>
            <CardDescription>Combine metas pessoais e familiares sem perder o controle.</CardDescription>
          </div>
          <Dialog open={isBudgetDialogOpen} onOpenChange={setBudgetDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-1" />
                Novo orçamento
              </Button>
            </DialogTrigger>
            <BudgetDialog
              members={members}
              onSuccess={async () => {
                await onCreateBudget();
                setBudgetDialogOpen(false);
              }}
            />
          </Dialog>
          </CardHeader>
          <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground uppercase">Orçamentos ativos</p>
              <p className="text-2xl font-semibold">{budgets.length}</p>
            </div>
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground uppercase">Compartilhados / híbridos</p>
              <p className="text-2xl font-semibold">
                {sharedBudgets.length} / {hybridOrPersonal.length}
              </p>
            </div>
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground uppercase">Limite combinado</p>
              <p className="text-2xl font-semibold">{toCurrency(totalBudgetLimit)}</p>
            </div>
          </div>
          {budgets.length === 0 && <p className="text-sm text-muted-foreground">Nenhum orçamento criado ainda.</p>}
          {budgets.map((budget) => {
            const typeCopy =
              budget.type === 'CELL'
                ? 'Compartilhado com toda a família'
                : budget.type === 'HYBRID'
                ? 'Híbrido (parte da meta é pessoal)'
                : 'Individual vinculado ao grupo';
            const typeVariant = budget.type === 'CELL' ? 'default' : budget.type === 'HYBRID' ? 'secondary' : 'outline';
            let splitCopy = 'Divisão igualitária entre os membros';
            const config = budget.splitConfig as { mode?: string; weights?: { memberId: string; weight: number }[] } | null;
            if (config?.mode === 'PERCENTAGE' && Array.isArray(config.weights) && config.weights.length) {
              splitCopy = `Percentuais definidos: ${config.weights
                .map((entry) => `${entry.weight}%`)
                .join(' • ')}`;
            }
            const categoryLabel = budget.category?.label || budget.category?.nome || 'Categoria não definida';
            const spent = Number(budget.aggregatedSpent || 0);
            const limit = Number(budget.limit || 0);
            const percent = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
            const recurrenceDescription =
              budget.recurrenceType && budget.recurrenceType !== 'MONTHLY'
                ? `Recorrência ${budget.recurrenceType === 'WEEKLY'
                    ? 'semanal'
                    : budget.recurrenceType === 'BIWEEKLY'
                    ? 'quinzenal'
                    : `custom (${budget.recurrenceDays || '?'} dias)`}`
                : null;
            return (
              <div key={budget.id} className="relative rounded-md border p-3 space-y-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-destructive"
                      aria-label="Excluir orçamento"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Essa ação remove o orçamento compartilhado para todos os membros.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteBudget(budget.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{budget.label || 'Orçamento sem nome'}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                        {categoryLabel}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{typeCopy}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right">
                    <Badge variant={typeVariant as 'default' | 'secondary' | 'outline'} className="text-xs uppercase tracking-wide">
                      {budget.type === 'CELL' ? 'Visível para todos' : budget.type === 'HYBRID' ? 'Híbrido' : 'Pessoal'}
                    </Badge>
                    <span className="text-sm font-semibold">{toCurrency(Number(budget.limit))}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{splitCopy}</p>
                  {recurrenceDescription && (
                    <p className="text-xs text-muted-foreground">{recurrenceDescription}</p>
                  )}
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Gasto compartilhado</span>
                      <span className={percent > 100 ? 'text-destructive' : 'text-muted-foreground'}>
                        {toCurrency(spent)} / {toCurrency(limit)}
                      </span>
                    </div>
                    <Progress value={percent} className="h-2 mt-1" />
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Caixinhas coletivas</CardTitle>
            <CardDescription>Crie fundos para viagens, emergências ou projetos.</CardDescription>
          </div>
          <Dialog open={isFundDialogOpen} onOpenChange={setFundDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="w-full sm:w-auto">
                <PiggyBank className="h-4 w-4 mr-1" />
                Novo fundo
              </Button>
            </DialogTrigger>
            <FundDialog
              onSuccess={async () => {
                await onCreateBudget();
                setFundDialogOpen(false);
              }}
            />
          </Dialog>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground uppercase">Fundos ativos</p>
              <p className="text-2xl font-semibold">{activeFunds}</p>
            </div>
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground uppercase">Total acumulado</p>
              <p className="text-2xl font-semibold">{toCurrency(totalFundsAmount)}</p>
            </div>
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground uppercase">Meta combinada</p>
              <p className="text-2xl font-semibold">{toCurrency(totalFundsTargets)}</p>
            </div>
          </div>
          {funds.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma caixinha criada ainda.</p>}
          {funds.map((fund) => {
            const hasTarget = Number(fund.targetAmount || 0) > 0;
            const progress = hasTarget
              ? Math.min(100, (Number(fund.currentAmount || 0) / Number(fund.targetAmount || 1)) * 100)
              : 0;
            const statusCopy =
              fund.status === 'ACTIVE'
                ? 'Em construção'
                : fund.status === 'COMPLETED'
                ? 'Meta atingida'
                : 'Pausado';
            const statusVariant =
              fund.status === 'ACTIVE' ? 'secondary' : fund.status === 'COMPLETED' ? 'default' : 'outline';

            return (
              <div key={fund.id} className="relative rounded-md border p-3 space-y-3">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 text-destructive"
                      aria-label="Excluir fundo"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir caixinha?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Apenas caixinhas com saldo zerado podem ser removidas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteFund(fund.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="font-semibold">{fund.name}</p>
                    <Badge variant={statusVariant as 'secondary' | 'default' | 'outline'} className="text-xs">
                      {statusCopy}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{toCurrency(Number(fund.currentAmount || 0))}</p>
                    <p className="text-xs text-muted-foreground">Meta {toCurrency(Number(fund.targetAmount || 0))}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Progress
                    value={progress}
                    indicatorClassName={progress >= 80 ? 'bg-green-500' : undefined}
                    className={!hasTarget ? 'opacity-50' : undefined}
                  />
                  <p className="text-xs text-muted-foreground">
                    {hasTarget ? `${progress.toFixed(0)}% concluído` : 'Defina uma meta para acompanhar o progresso'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {fund.contributions.slice(0, 3).map((contribution) => (
                    <Badge key={contribution.id} variant="secondary">
                      {toCurrency(Number(contribution.amount))}
                    </Badge>
                  ))}
                  {fund.contributions.length === 0 && (
                    <span className="text-xs text-muted-foreground">Sem contribuições registradas</span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
        <SharedAccountsCard
          sharedAccounts={sharedAccounts}
          members={members}
          canManageSharedAccounts={canManageSharedAccounts}
          cellId={cellId}
          onRefreshSharedAccounts={onRefreshSharedAccounts}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Alertas da família</CardTitle>
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

function SharedAccountsCard({
  sharedAccounts,
  members,
  canManageSharedAccounts,
  cellId,
  onRefreshSharedAccounts,
}: {
  sharedAccounts: CellSharedAccount[];
  members: Clan['members'];
  canManageSharedAccounts: boolean;
  cellId: string;
  onRefreshSharedAccounts: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [visibility, setVisibility] = useState<'MEMBERS' | 'ADMINS' | 'CUSTOM'>('MEMBERS');
  const [allowedRoles, setAllowedRoles] = useState<Array<'LEADER' | 'ADMIN' | 'MEMBER'>>(['LEADER', 'ADMIN']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isDialogOpen) return;
    let active = true;
    setIsLoadingAccounts(true);
    api
      .get('/accounts')
      .then((response) => {
        if (!active) return;
        setAvailableAccounts(response.data || []);
      })
      .catch(() => {
        if (!active) return;
        toast({
          variant: 'destructive',
          title: 'Não foi possível carregar suas contas.',
          description: 'Tente novamente em instantes.',
        });
        setAvailableAccounts([]);
      })
      .finally(() => {
        if (active) {
          setIsLoadingAccounts(false);
        }
      });
    return () => {
      active = false;
    };
  }, [isDialogOpen, toast]);

  const shareableAccounts = availableAccounts.filter(
    (account) => !sharedAccounts.some((shared) => shared.accountId === account.id),
  );

  useEffect(() => {
    if (!isDialogOpen) return;
    if (!shareableAccounts.length) {
      setSelectedAccountId('');
      return;
    }
    if (!selectedAccountId || !shareableAccounts.some((account) => account.id === selectedAccountId)) {
      setSelectedAccountId(shareableAccounts[0]?.id || '');
    }
  }, [isDialogOpen, shareableAccounts, selectedAccountId]);

  const resetForm = () => {
    setSelectedAccountId('');
    setVisibility('MEMBERS');
    setAllowedRoles(['LEADER', 'ADMIN']);
  };

  const handleLinkAccount = async () => {
    if (!cellId || !selectedAccountId) {
      toast({
        variant: 'destructive',
        title: 'Selecione uma conta para vincular.',
      });
      return;
    }
    if (visibility === 'CUSTOM' && allowedRoles.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Escolha pelo menos um perfil autorizado.',
      });
      return;
    }
    try {
      setIsSubmitting(true);
      await api.post(`/cells/${cellId}/shared-accounts`, {
        accountId: selectedAccountId,
        visibility,
        allowedRoles: visibility === 'CUSTOM' ? allowedRoles : undefined,
      });
      toast({ title: 'Conta vinculada à família.' });
      await onRefreshSharedAccounts();
      setDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível compartilhar a conta.',
        description: error?.response?.data?.message || 'Revise os dados e tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnlink = async (sharedAccountId: string) => {
    try {
      setRemovingId(sharedAccountId);
      await api.delete(`/cells/${cellId}/shared-accounts/${sharedAccountId}`);
      toast({ title: 'Conta removida da família.' });
      await onRefreshSharedAccounts();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível remover a conta.',
        description: error?.response?.data?.message || 'Tente novamente em instantes.',
      });
    } finally {
      setRemovingId(null);
    }
  };

  const renderOwnerName = (userId?: string | null) => {
    if (!userId) return 'Membro da família';
    const owner = members?.find((member) => member.userId === userId);
    return owner?.user?.name || 'Membro da família';
  };

  const visibilityLabel = (value: 'MEMBERS' | 'ADMINS' | 'CUSTOM') => {
    if (value === 'MEMBERS') return 'Visível para todos';
    if (value === 'ADMINS') return 'Só líderes/admins';
    return 'Permissões customizadas';
  };

  const roleLabels: Record<'LEADER' | 'ADMIN' | 'MEMBER', string> = {
    LEADER: 'Líder',
    ADMIN: 'Admin',
    MEMBER: 'Membro',
  };

  const isFormValid =
    Boolean(selectedAccountId) && (visibility !== 'CUSTOM' || (visibility === 'CUSTOM' && allowedRoles.length > 0));

  return (
    <Card className="md:col-span-2">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Contas compartilhadas</CardTitle>
          <CardDescription>Mostre saldos relevantes para toda a família e controle quem pode vê-los.</CardDescription>
        </div>
        {canManageSharedAccounts && (
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="w-full sm:w-auto">
                <Wallet className="h-4 w-4 mr-1" />
                Vincular conta
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Compartilhar conta com a família</DialogTitle>
                <DialogDescription>Selecione uma das suas contas e escolha quem poderá enxergar os detalhes.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Conta</Label>
                  {isLoadingAccounts ? (
                    <p className="text-sm text-muted-foreground">Carregando contas...</p>
                  ) : shareableAccounts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Você já compartilhou todas as contas disponíveis. Cadastre uma nova conta pessoal para vinculá-la aqui.
                    </p>
                  ) : (
                    <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma conta" />
                      </SelectTrigger>
                      <SelectContent>
                        {shareableAccounts.map((account) => (
                          <SelectItem key={account.id} value={account.id}>
                            {account.nome} • {account.instituicao || 'Instituição'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Visibilidade</Label>
                  <Select value={visibility} onValueChange={(value) => setVisibility(value as 'MEMBERS' | 'ADMINS' | 'CUSTOM')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MEMBERS">Todos os membros</SelectItem>
                      <SelectItem value="ADMINS">Apenas líderes/admins</SelectItem>
                      <SelectItem value="CUSTOM">Permissões customizadas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {visibility === 'CUSTOM' && (
                  <div className="rounded-md border p-3 space-y-3">
                    <p className="text-xs text-muted-foreground">Escolha quais perfis podem visualizar a conta.</p>
                    {(['LEADER', 'ADMIN', 'MEMBER'] as Array<'LEADER' | 'ADMIN' | 'MEMBER'>).map((role) => (
                      <label key={role} className="flex items-center justify-between text-sm">
                        <span>{roleLabels[role]}</span>
                        <Switch
                          checked={allowedRoles.includes(role)}
                          onCheckedChange={(checked) => {
                            setAllowedRoles((prev) =>
                              checked ? [...prev, role] : prev.filter((item) => item !== role),
                            );
                          }}
                        />
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button
                  onClick={handleLinkAccount}
                  disabled={!isFormValid || isSubmitting || shareableAccounts.length === 0}
                >
                  {isSubmitting ? 'Compartilhando...' : 'Compartilhar conta'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {sharedAccounts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nenhuma conta compartilhada ainda. Vincule uma conta bancária ou carteira para que os demais acompanhem o saldo coletivo.
          </p>
        )}
        <div className="space-y-3">
          {sharedAccounts.map((item) => {
            const visibilityText = visibilityLabel(item.visibility);
            const allowed = Array.isArray(item.allowedRoles) ? item.allowedRoles : [];
            return (
              <div key={item.id} className="rounded-md border p-3 space-y-2">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold">{item.account?.nome || 'Conta compartilhada'}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.account?.instituicao ? `${item.account?.instituicao} • ` : ''}
                      Titular: {renderOwnerName(item.account?.userId)}
                    </p>
                  </div>
                  {canManageSharedAccounts && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          aria-label="Remover conta compartilhada"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remover conta da família?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Os demais membros deixarão de visualizar esta conta compartilhada.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleUnlink(item.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={removingId === item.id}
                          >
                            {removingId === item.id ? 'Removendo...' : 'Remover'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{visibilityText}</Badge>
                  {item.visibility === 'CUSTOM' && allowed.length > 0 && (
                    <>
                      <span>Perfis autorizados:</span>
                      {allowed.map((role) => (
                        <Badge key={`${item.id}-${role}`} variant="secondary">
                          {roleLabels[role as 'LEADER' | 'ADMIN' | 'MEMBER'] || role}
                        </Badge>
                      ))}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function BudgetDialog({ onSuccess, members }: { onSuccess: () => Promise<void>; members: Clan['members'] }) {
  const initialFormState = {
    label: '',
    limit: '',
    type: 'CELL' as CellBudget['type'],
    splitMode: 'EQUAL' as 'EQUAL' | 'PERCENTAGE',
    categoryId: '',
    recurrenceType: 'MONTHLY' as CellBudget['recurrenceType'],
    recurrenceDays: '',
    effectiveFrom: '',
    effectiveTo: '',
  };
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const { toast } = useToast();
  const cellId =
    user?.clanId ||
    user?.clanMembership?.clanId ||
    user?.clanMemberships?.[0]?.clanId ||
    '';
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const buildDefaultDistribution = () => {
    const initial: Record<string, number> = {};
    const totalMembers = members?.length || 0;
    const defaultShare = totalMembers ? Math.round(100 / totalMembers) : 100;
    members?.forEach((member) => {
      initial[member.userId] = defaultShare;
    });
    return initial;
  };
  const [distribution, setDistribution] = useState<Record<string, number>>(buildDefaultDistribution);
  const hasMembers = Boolean(members?.length);

  useEffect(() => {
    setDistribution((prev) => {
      const updated: Record<string, number> = {};
      const totalMembers = members?.length || 0;
      const defaultShare = totalMembers ? Math.round(100 / totalMembers) : 100;
      members?.forEach((member) => {
        updated[member.userId] = prev[member.userId] ?? defaultShare;
      });
      return updated;
    });
  }, [members]);

  useEffect(() => {
    let isMounted = true;
    const loadCategories = async () => {
      setIsLoadingCategories(true);
      try {
        const response = await api.get('/categories');
        if (isMounted) {
          setCategories(response.data || []);
        }
      } catch (error) {
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: 'Não foi possível carregar categorias',
            description: 'Tente novamente em instantes.',
          });
          setCategories([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, [toast]);

  const splitModeEnabled = form.type !== 'PERSONAL';
  const totalDistribution = Object.values(distribution).reduce((acc, value) => acc + Number(value || 0), 0);

  const handleSubmit = async () => {
    const parsedLimit = Number(form.limit);
    if (!form.categoryId) {
      toast({ variant: 'destructive', title: 'Selecione uma categoria para este orçamento.' });
      return;
    }
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      toast({ variant: 'destructive', title: 'Informe um limite válido.' });
      return;
    }
    if (form.recurrenceType === 'CUSTOM') {
      const recurrenceValue = Number(form.recurrenceDays);
      if (!Number.isFinite(recurrenceValue) || recurrenceValue < 1 || recurrenceValue > 90) {
        toast({ variant: 'destructive', title: 'Informe um intervalo válido (1 a 90 dias) para a recorrência personalizada.' });
        return;
      }
    }
    if (splitModeEnabled && form.splitMode === 'PERCENTAGE' && totalDistribution !== 100) {
      toast({ variant: 'destructive', title: 'A soma das porcentagens precisa fechar 100%.' });
      return;
    }
    try {
      setIsSubmitting(true);
      let splitConfig: Record<string, unknown> | null = null;
      if (splitModeEnabled) {
        if (form.splitMode === 'EQUAL') {
          splitConfig = { mode: 'EQUAL' };
        } else {
          splitConfig = {
            mode: 'PERCENTAGE',
            weights: Object.entries(distribution).map(([memberId, percentage]) => ({
              memberId,
              weight: Number(percentage),
            })),
          };
        }
      }
      await api.post(`/cells/${cellId}/budgets`, {
        label: form.label,
        limit: parsedLimit,
        type: form.type,
        categoryId: form.categoryId,
        splitConfig,
        recurrenceType: form.recurrenceType,
        recurrenceDays:
          form.recurrenceType === 'CUSTOM' ? Number(form.recurrenceDays) || null : form.recurrenceType === 'BIWEEKLY' ? 14 : undefined,
        effectiveFrom: form.effectiveFrom || undefined,
        effectiveTo: form.effectiveTo || undefined,
      });
      toast({ title: 'Orçamento criado!' });
      setForm(initialFormState);
      setDistribution(buildDefaultDistribution());
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
        <DialogTitle>Novo orçamento</DialogTitle>
        <DialogDescription>
          Orçamentos do tipo <strong>Compartilhado</strong> ficam visíveis para todos os membros com permissão.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <Label>Nome</Label>
          <Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ex: Mercado do mês" />
        </div>
        <div>
          <Label>Categoria vinculada</Label>
          {isLoadingCategories ? (
            <p className="text-xs text-muted-foreground">Carregando categorias...</p>
          ) : (
            <Select
              value={form.categoryId}
              onValueChange={(value) => setForm({ ...form, categoryId: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label || category.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <Label>Limite</Label>
          <Input inputMode="decimal" value={form.limit} onChange={(e) => setForm({ ...form, limit: e.target.value })} placeholder="0,00" />
        </div>
        <div>
          <Label>Tipo</Label>
          <Select
            value={form.type}
            onValueChange={(value) => setForm({ ...form, type: value as CellBudget['type'] })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CELL">Compartilhado</SelectItem>
              <SelectItem value="HYBRID">Híbrido (parte pessoal)</SelectItem>
              <SelectItem value="PERSONAL">Pessoal vinculado ao grupo</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Recorrência</Label>
            <Select
              value={form.recurrenceType}
              onValueChange={(value) => setForm({ ...form, recurrenceType: value as CellBudget['recurrenceType'] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Mensal (1º ao último dia)</SelectItem>
                <SelectItem value="WEEKLY">Semanal</SelectItem>
                <SelectItem value="BIWEEKLY">Quinzenal</SelectItem>
                <SelectItem value="CUSTOM">Personalizado</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs mt-1 text-muted-foreground">
              Controla quando os espelhos serão replicados.
            </p>
          </div>
          {form.recurrenceType === 'CUSTOM' && (
            <div>
              <Label>Dias por ciclo</Label>
              <Input
                inputMode="numeric"
                value={form.recurrenceDays}
                onChange={(e) => setForm({ ...form, recurrenceDays: e.target.value })}
                placeholder="Ex: 15"
              />
              <p className="text-xs text-muted-foreground">Intervalo entre uma sincronização e outra.</p>
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Início planejado</Label>
            <Input
              type="date"
              value={form.effectiveFrom}
              onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">Opcional. Deixe vazio para iniciar imediatamente.</p>
          </div>
          <div>
            <Label>Término (opcional)</Label>
            <Input
              type="date"
              value={form.effectiveTo}
              onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })}
            />
          </div>
        </div>
        {splitModeEnabled && (
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label>Forma de divisão</Label>
                <p className="text-xs text-muted-foreground">Defina como o valor será distribuído entre os membros.</p>
              </div>
              <Select
                value={form.splitMode}
                onValueChange={(value) => setForm({ ...form, splitMode: value as 'EQUAL' | 'PERCENTAGE' })}
              >
                <SelectTrigger className="h-8 w-48 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EQUAL">Igualitário</SelectItem>
                  <SelectItem value="PERCENTAGE" disabled={!hasMembers}>
                    Por porcentagem {hasMembers ? '' : '(convide membros)'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.splitMode === 'PERCENTAGE' && (
              <div className="space-y-2">
                {members?.length === 0 && (
                  <p className="text-xs text-muted-foreground">Convide membros para distribuir o orçamento.</p>
                )}
                {members?.map((member) => (
                  <div key={member.userId} className="flex items-center justify-between gap-2 text-sm">
                    <span>{member.user?.name || 'Membro'}</span>
                    <div className="flex items-center gap-2">
                      <Input
                        className="w-20"
                        type="number"
                        min={0}
                        max={100}
                        value={distribution[member.userId] ?? 0}
                        onChange={(e) =>
                          setDistribution((prev) => ({
                            ...prev,
                            [member.userId]: Number(e.target.value),
                          }))
                        }
                      />
                      <span className="text-xs text-muted-foreground">%</span>
                    </div>
                  </div>
                ))}
                <p className={`text-xs ${totalDistribution === 100 ? 'text-muted-foreground' : 'text-destructive'}`}>
                  Soma atual: {totalDistribution}%
                </p>
              </div>
            )}
          </div>
        )}
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
  const cellId =
    user?.clanId ||
    user?.clanMembership?.clanId ||
    user?.clanMemberships?.[0]?.clanId ||
    '';
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
            <Select
              value={form.trigger}
              onValueChange={(value) => setForm({ ...form, trigger: value as RateioForm['trigger'] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RECURRING_BILL">Conta recorrente</SelectItem>
                <SelectItem value="ADHOC">Despesa pontual</SelectItem>
                <SelectItem value="USAGE_BASED">Por consumo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Método</Label>
            <Select
              value={form.method}
              onValueChange={(value) => setForm({ ...form, method: value as RateioForm['method'] })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EQUAL">Igualitário</SelectItem>
                <SelectItem value="WEIGHTED">Por peso</SelectItem>
                <SelectItem value="CONSUMPTION">Por consumo informado</SelectItem>
                <SelectItem value="PAYER_REIMBURSED">Reembolso para quem paga</SelectItem>
              </SelectContent>
            </Select>
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
  onChange,
  currentUserId,
}: {
  cell: Clan;
  onChange: () => Promise<void>;
  currentUserId?: string | null;
}) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const currentMembership = cell.members?.find((member) => member.userId === currentUserId) || null;
  const otherMembersCount = currentMembership ? Math.max(0, (cell.members?.length || 0) - 1) : cell.members?.length || 0;
  const canDelete = currentMembership?.role === 'LEADER';
  const canDeleteNow = canDelete && otherMembersCount === 0;

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await api.post(`/cells/${cell.id}/leave`);
      toast({ title: 'Você saiu do Modo Família.' });
      await onChange();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível sair.',
        description: error?.response?.data?.message || 'Tente novamente em instantes.',
      });
    } finally {
      setIsLeaving(false);
      setIsLeaveDialogOpen(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/cells/${cell.id}`);
      toast({ title: 'Modo Família excluído com sucesso.' });
      await onChange();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível excluir a família.',
        description: error?.response?.data?.message || 'Revise os requisitos e tente novamente.',
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <CardTitle>Membros e convites</CardTitle>
          <CardDescription>Configure permissões e visibilidade para cada pessoa.</CardDescription>
        </div>
        <TooltipProvider>
          <div className="flex items-center gap-2">
            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DialogTrigger asChild>
                    <Button size="icon" className="rounded-full" aria-label="Convidar membro">
                      <Users className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Convidar membro</TooltipContent>
              </Tooltip>
              <InviteWizard cellId={cell.id} onSuccess={async () => { setIsInviteOpen(false); await onChange(); }} />
            </Dialog>
            <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full text-primary"
                      disabled={!currentMembership}
                      aria-label="Sair do Modo Família"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                </TooltipTrigger>
                <TooltipContent>Sair do Modo Família</TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Deseja sair do Modo Família?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Você perderá acesso aos orçamentos, fundos e decisões deste grupo. Essa ação não remove os demais membros.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleLeave}
                    disabled={isLeaving}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isLeaving ? 'Saindo...' : 'Confirmar saída'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {canDelete && (
              <div className="flex flex-col gap-1">
                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="destructive"
                          size="icon"
                          className="rounded-full"
                          disabled={!canDeleteNow}
                          aria-label="Excluir Modo Família"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Excluir Modo Família</TooltipContent>
                  </Tooltip>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir família definitivamente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Essa ação remove todos os dados compartilhados (orçamentos, fundos e histórico). Não é possível desfazer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {isDeleting ? 'Excluindo...' : 'Excluir família'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                {!canDeleteNow && (
                  <p className="text-xs text-muted-foreground">
                    Remova {otherMembersCount === 1 ? 'o outro membro' : `${otherMembersCount} membros`} antes de excluir.
                  </p>
                )}
              </div>
            )}
          </div>
        </TooltipProvider>
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
          <CardDescription>Registro de tudo que ocorre na família.</CardDescription>
        </div>
        <Select value={filter} onValueChange={(value) => setFilter(value)}>
          <SelectTrigger className="h-8 w-40 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {uniqueTypes.map((type) => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                <span className="text-sm font-semibold text-green-600">{toCurrency(entry.balance)}</span>
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
                  Registrar Pix ({toCurrency(Math.abs(entry.balance))})
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
          <CardDescription>Comparativo rápido para entender quanto destina à família.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Orçamentos compartilhados</span>
            <span className="font-semibold">{toCurrency(totalCellBudgets)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Reservas pessoais destinadas à família</span>
            <span className="font-semibold">{toCurrency(totalHybridPersonal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-primary">
            <span>Total combinado</span>
            <span className="font-semibold">
              {toCurrency(totalCellBudgets + totalHybridPersonal)}
            </span>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Investimentos coletivos</CardTitle>
          <CardDescription>Caixas e fundos que sustentam a família.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Caixas em andamento</span>
            <span className="font-semibold">{funds.length}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span>Total poupado</span>
            <span className="font-semibold">
              {toCurrency(totalFunds)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
