'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
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
  CellSharedExpense,
  CellSplitRule,
  CellTimelineEvent,
  CellEquilibriumEntry,
  Category,
  Account,
  ClanRole,
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
  ReceiptText,
  CircleCheck,
  Clock4,
  Filter,
} from 'lucide-react';
import { withdrawalRoleOptions } from './withdrawal-options';
import { ClanIcon } from '@/components/dashboard/clans/clan-icon';
import { ClanInvitesList } from '@/components/dashboard/clans/clan-invites-list';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

type WizardInviteForm = {
  identifier: string;
  visibility: {
    viewPersonalBudget: boolean;
    viewAccounts: boolean;
    shareDebtSummary: boolean;
  };
};

type FundDepositChannel = 'CELL_ACCOUNT' | 'CUSTODIAN' | 'MANUAL';

const depositChannelCopy: Record<FundDepositChannel, { label: string; helper: string }> = {
  CELL_ACCOUNT: {
    label: 'Conta compartilhada',
    helper: 'Sai de uma conta vinculada ao workspace ou rateio interno.',
  },
  CUSTODIAN: {
    label: 'Pago direto ao responsável',
    helper: 'Membros transferem para quem guarda a caixinha e registram o aporte.',
  },
  MANUAL: {
    label: 'Outro fluxo combinado',
    helper: 'Use para acordos livres: PIX fixo, envelope etc.',
  },
};

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const parseDecimalDigits = (payload: any): number => {
  const digitsSource = payload?.d || payload?.c;
  if (!Array.isArray(digitsSource) || digitsSource.length === 0) {
    return 0;
  }
  const digits = digitsSource.join('');
  const exponent = typeof payload?.e === 'number' ? payload.e : Number(payload?.e ?? 0);
  const sign = payload?.s === -1 ? '-' : '';
  const intLength = exponent + 1;
  if (intLength <= 0) {
    const zeros = '0'.repeat(Math.abs(intLength));
    return Number(`${sign}0.${zeros}${digits}`);
  }
  if (intLength >= digits.length) {
    const zeros = '0'.repeat(intLength - digits.length);
    return Number(`${sign}${digits}${zeros}`);
  }
  const intPart = digits.slice(0, intLength) || '0';
  const fracPart = digits.slice(intLength) || '0';
  return Number(`${sign}${intPart}.${fracPart}`);
};
const parseAmount = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  if (value && typeof value === 'object') {
    if ('value' in (value as Record<string, unknown>)) {
      return parseAmount((value as Record<string, unknown>).value);
    }
    if ('amount' in (value as Record<string, unknown>)) {
      return parseAmount((value as Record<string, unknown>).amount);
    }
    if ('d' in (value as Record<string, unknown>) || 'c' in (value as Record<string, unknown>)) {
      const parsed = parseDecimalDigits(value);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    const stringified = (value as Record<string, unknown>).toString?.();
    if (stringified && stringified !== '[object Object]') {
      return parseAmount(stringified);
    }
    return 0;
  }
  if (typeof value !== 'string') {
    return 0;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }
  const sanitized = trimmed.replace(/[^\d.,-]/g, '');
  if (!sanitized) {
    return 0;
  }
  const commaIndex = sanitized.lastIndexOf(',');
  const dotIndex = sanitized.lastIndexOf('.');
  const dotCount = (sanitized.match(/\./g) || []).length;

  if (commaIndex > dotIndex) {
    const normalized =
      dotIndex >= 0 ? sanitized.replace(/\./g, '').replace(',', '.') : sanitized.replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (dotIndex > commaIndex && dotIndex !== -1) {
    if (dotCount > 1 || sanitized.length - dotIndex - 1 === 3) {
      const normalized = sanitized.replace(/\./g, '');
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : 0;
    }
    const normalized = sanitized.replace(/,/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const normalized = sanitized.replace(/,/g, '');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};
const toCurrency = (value: unknown) => currencyFormatter.format(parseAmount(value));

export default function CellsDashboardPage() {
  const { user, isLoading: userLoading, fetchUser } = useUser();
  const { toast } = useToast();
  const [cell, setCell] = useState<Clan | null>(null);
  const [budgets, setBudgets] = useState<CellBudget[]>([]);
  const [funds, setFunds] = useState<CellFund[]>([]);
  const [sharedAccounts, setSharedAccounts] = useState<CellSharedAccount[]>([]);
  const [sharedExpenses, setSharedExpenses] = useState<CellSharedExpense[]>([]);
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
      setSharedExpenses([]);
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
        expensesRes,
      ] = await Promise.all([
        api.get(`/cells/${cellId}`),
        api.get(`/cells/${cellId}/budgets?month=${currentMonth}`),
        api.get(`/cells/${cellId}/funds`),
        api.get(`/cells/${cellId}/shared-accounts`),
        api.get(`/cells/${cellId}/split-rules`),
        api.get(`/cells/${cellId}/timeline`),
        api.get(`/cells/${cellId}/equilibrium`),
        api.get(`/cells/${cellId}/alerts`),
        api.get(`/cells/${cellId}/expenses`),
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
      setSharedExpenses(expensesRes.data || []);
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

  const refreshEquilibriumSummary = useCallback(async () => {
    if (!cellId) {
      setEquilibrium([]);
      return;
    }
    try {
      const response = await api.get(`/cells/${cellId}/equilibrium`);
      setEquilibrium(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Erro ao atualizar equilíbrio', error);
    }
  }, [cellId]);

  const refreshSharedExpenses = useCallback(async () => {
    if (!cellId) {
      setSharedExpenses([]);
      return;
    }
    try {
      const response = await api.get(`/cells/${cellId}/expenses`);
      setSharedExpenses(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar despesas compartilhadas', error);
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
      <>
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
          <ClanInvitesList onActionSuccess={handleMembershipChange} />
        </div>
      </>
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

      <ClanInvitesList onActionSuccess={handleMembershipChange} />

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
            onRefreshSharedExpenses={refreshSharedExpenses}
            currentUserId={user?.id}
            isLeader={isLeader}
          />
          <TimelineFeed events={timeline} />
        </TabsContent>

        <TabsContent value="rateios" className="space-y-6">
          <SharedExpensesPanel
            cellId={cellId}
            expenses={sharedExpenses}
            members={cell.members || []}
            sharedAccounts={sharedAccounts}
            currentUserId={user?.id}
            isLeader={isLeader}
            onRefresh={refreshSharedExpenses}
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
            members={cell.members || []}
            onRefresh={refreshEquilibriumSummary}
          />
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <ReportsPanel budgets={budgets} funds={funds} />
        </TabsContent>
      </Tabs>
      </div>
      <Dialog open={isHelpOpen} onOpenChange={setIsHelpOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader className="space-y-2">
            <DialogTitle>Guia rápido do Modo Família</DialogTitle>
            <DialogDescription>
              Sincronize orçamentos, metas e rateios entre todos os membros preservando permissões individuais. Use este resumo para tirar dúvidas rápidas.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-3 text-sm text-muted-foreground">
            <section className="space-y-2">
              <h4 className="text-base font-semibold text-foreground">Fluxo em três passos</h4>
              <ol className="list-decimal space-y-2 pl-5">
                <li>Convide os membros e defina quem é líder/admin. As permissões determinam quem pode criar budgets, fundos e rateios.</li>
                <li>Configure orçamentos compartilhados ou híbridos. Eles aparecem como “espelhos” no orçamento pessoal de cada membro.</li>
                <li>Registre caixinhas e despesas compartilhadas. Cada parte gera uma transação pendente na conta pessoal escolhida.</li>
              </ol>
            </section>
            <section className="space-y-2">
              <h4 className="text-base font-semibold text-foreground">Orçamentos e metas</h4>
              <ul className="list-disc space-y-1 pl-5">
                <li><span className="font-medium text-foreground">Categoria:</span> usa as mesmas categorias do módulo pessoal. Assim o espelho cai no lugar certo.</li>
                <li><span className="font-medium text-foreground">Limite:</span> valor máximo mensal. Escolha divisão igualitária ou porcentagens customizadas.</li>
                <li><span className="font-medium text-foreground">Tipo:</span> CELL (todos), HYBRID (parte pessoal + parte coletiva) ou PERSONAL (apenas referência vinculada).</li>
                <li><span className="font-medium text-foreground">Caixinhas:</span> sempre vinculam uma meta espelho ao responsável. Investir/Resgatar pede conta de origem/destino.</li>
              </ul>
            </section>
            <section className="space-y-2">
              <h4 className="text-base font-semibold text-foreground">Rateios e transações</h4>
              <ul className="list-disc space-y-1 pl-5">
                <li>“Nova despesa” cria uma transação pendente para cada participante. É preciso selecionar a conta pessoal de cada um.</li>
                <li>Ao registrar pagamento, a transação é quitada e o histórico fica disponível para todos.</li>
                <li>O filtro lateral ajuda a encontrar despesas por descrição, status ou mês.</li>
              </ul>
            </section>
            <section className="space-y-2">
              <h4 className="text-base font-semibold text-foreground">Permissões e rastreio</h4>
              <p>Timeline e alertas registram toda alteração (limites, fundos, decisões). Use-os para auditar quem editou o quê e quando.</p>
              <p className="text-xs">Dica: se um membro não vê saldos, verifique se ele possui permissão e se a conta foi compartilhada na aba “Contas”.</p>
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
  const totalBudgetLimit = budgets.reduce((sum, budget) => sum + parseAmount(budget.limit), 0);
  const sharedBudgets = budgets.filter((budget) => budget.type === 'CELL');
  const hybridOrPersonal = budgets.filter((budget) => budget.type !== 'CELL');
  const totalFundsAmount = funds.reduce((sum, fund) => sum + parseAmount(fund.currentAmount), 0);
  const totalFundsTargets = funds.reduce((sum, fund) => sum + parseAmount(fund.targetAmount), 0);
  const activeFunds = funds.filter((fund) => fund.status === 'ACTIVE').length;
  const [historyFundId, setHistoryFundId] = useState<string | null>(null);
  const [activeFundAction, setActiveFundAction] = useState<{ fund: CellFund | null; mode: 'DEPOSIT' | 'WITHDRAW' | null }>({
    fund: null,
    mode: null,
  });

  const budgetsOverLimit = budgets.filter((budget) => parseAmount(budget.aggregatedSpent) > parseAmount(budget.limit)).length;
  const budgetsNearLimit = budgets.filter((budget) => {
    const limit = parseAmount(budget.limit);
    if (limit <= 0) return false;
    const spent = parseAmount(budget.aggregatedSpent);
    const percent = (spent / limit) * 100;
    return percent >= 80 && percent < 100;
  }).length;
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
    <>
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground uppercase">Orçamentos</p>
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
            <div className="rounded-md border bg-muted/40 p-3">
              <p className="text-xs text-muted-foreground uppercase">Caixas ativos</p>
              <p className="text-2xl font-semibold">{activeFunds}</p>
            </div>
          </div>
          {(budgetsOverLimit > 0 || budgetsNearLimit > 0) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {budgetsOverLimit > 0 && (
                <Badge variant="destructive" className="rounded-full">
                  {budgetsOverLimit} estourado{budgetsOverLimit > 1 ? 's' : ''}
                </Badge>
              )}
              {budgetsNearLimit > 0 && (
                <Badge variant="secondary" className="rounded-full text-amber-900 bg-amber-100 border-amber-200">
                  {budgetsNearLimit} perto do limite
                </Badge>
              )}
            </div>
          )}
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
            const spent = parseAmount(budget.aggregatedSpent);
            const limit = parseAmount(budget.limit);
            const rawPercent = limit > 0 ? (spent / limit) * 100 : 0;
            const percent = limit > 0 ? Math.min(100, Math.max(rawPercent, 0)) : 0;
            const healthStatus = rawPercent >= 100
              ? {
                  label: 'Estourou',
                  description: 'Reforce o limite ou trave gastos.',
                  indicatorClass: 'bg-destructive',
                  textClass: 'text-destructive',
                }
              : rawPercent >= 80
              ? {
                  label: 'Atenção',
                  description: 'Ajuste rateios ou combine reforços.',
                  indicatorClass: 'bg-amber-500',
                  textClass: 'text-amber-600',
                }
              : {
                  label: 'Saudável',
                  description: 'Consumo dentro do previsto.',
                  indicatorClass: 'bg-emerald-500',
                  textClass: 'text-emerald-600',
                };
            const recurrenceDescription =
              budget.recurrenceType && budget.recurrenceType !== 'MONTHLY'
                ? `Recorrência ${budget.recurrenceType === 'WEEKLY'
                    ? 'semanal'
                    : budget.recurrenceType === 'BIWEEKLY'
                    ? 'quinzenal'
                    : `custom (${budget.recurrenceDays || '?'} dias)`}`
                : null;
            return (
              <div key={budget.id} className="relative rounded-xl border bg-card p-4 space-y-3">
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
                <div className="flex flex-wrap items-start justify-between gap-4 text-sm">
                  <div className="space-y-1">
                    <p className="font-semibold leading-tight">{budget.label || 'Orçamento sem nome'}</p>
                    <p className="text-xs text-muted-foreground">{categoryLabel}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant={typeVariant as 'default' | 'secondary' | 'outline'} className="text-[10px] uppercase">
                      {budget.type === 'CELL' ? 'Compartilhado' : budget.type === 'HYBRID' ? 'Híbrido' : 'Pessoal'}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      {toCurrency(spent)} / {toCurrency(limit)}
                    </p>
                  </div>
                </div>
                <Progress value={percent} className="h-2" indicatorClassName={healthStatus.indicatorClass} />
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className={`font-medium ${healthStatus.textClass}`}>{healthStatus.label}</span>
                  <span>• {splitCopy}</span>
                  {recurrenceDescription && <span>• {recurrenceDescription}</span>}
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
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
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
            const currentAmount = parseAmount(fund.currentAmount);
            const targetAmount = parseAmount(fund.targetAmount);
            const hasTarget = targetAmount > 0;
            const progress = hasTarget ? Math.min(100, (currentAmount / targetAmount) * 100) : 0;
            const statusCopy =
              fund.status === 'ACTIVE'
                ? 'Em construção'
                : fund.status === 'COMPLETED'
                ? 'Meta atingida'
                : 'Pausado';
            const statusVariant =
              fund.status === 'ACTIVE' ? 'secondary' : fund.status === 'COMPLETED' ? 'default' : 'outline';
            const withdrawalRoles = (fund.withdrawalRoles?.length ? fund.withdrawalRoles : ['LEADER']) as ClanRole[];
            const withdrawalText = withdrawalRoles.map((role) => withdrawalRoleOptions[role].label).join(', ');
            const depositChannel = (fund.depositInstructions?.channel || 'CELL_ACCOUNT') as FundDepositChannel;
            const depositChannelLabel = depositChannelCopy[depositChannel]?.label || depositChannelCopy.CELL_ACCOUNT.label;
            const custodianName = fund.custodian?.name || 'Sem responsável vinculado';
            const usageNotes =
              fund.usagePolicy && typeof fund.usagePolicy === 'object'
                ? (fund.usagePolicy as { notes?: string }).notes
                : null;

            return (
              <div key={fund.id} className="relative rounded-xl border bg-card p-4 space-y-3">
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
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-1">
                    <p className="font-semibold leading-tight">{fund.name}</p>
                    <p className="text-xs text-muted-foreground">{custodianName}</p>
                  </div>
                  <Badge variant={statusVariant as 'secondary' | 'default' | 'outline'} className="text-[10px] uppercase">
                    {statusCopy}
                  </Badge>
                </div>
                <div className="flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                  <span>{toCurrency(fund.currentAmount)}</span>
                  <span>Meta {toCurrency(fund.targetAmount)}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                  <Badge variant="outline" className="rounded-full border-dashed">
                    {depositChannelLabel}
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-dashed">
                    Saque: {withdrawalText}
                  </Badge>
                  {fund.mirrorToCustodian && <Badge variant="outline" className="rounded-full">Espelhado</Badge>}
                  {fund.goal && <Badge variant="secondary" className="rounded-full border-dashed">Meta pessoal</Badge>}
                </div>
                {usageNotes && <p className="text-xs text-muted-foreground">{usageNotes}</p>}
                <div className="flex flex-wrap gap-2 text-xs">
                  <Button size="sm" variant="outline" onClick={() => setActiveFundAction({ fund, mode: 'DEPOSIT' })}>
                    Investir
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setActiveFundAction({ fund, mode: 'WITHDRAW' })}>
                    Resgatar
                  </Button>
                  <Button
                    size="sm"
                    variant={historyFundId === fund.id ? 'secondary' : 'ghost'}
                    onClick={() => setHistoryFundId((current) => (current === fund.id ? null : fund.id))}
                  >
                    Histórico
                  </Button>
                </div>
                {historyFundId === fund.id && (
                  <div className="rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground space-y-1 max-h-48 overflow-y-auto">
                    {fund.contributions.length === 0 && <p>Sem movimentos registrados.</p>}
                    {fund.contributions.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between gap-2">
                        <span>{new Date(entry.createdAt).toLocaleDateString('pt-BR')}</span>
                        <span className="font-semibold text-foreground">{toCurrency(entry.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
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
    <FundContributionDialog
      fund={activeFundAction.fund}
      mode={activeFundAction.mode}
      onClose={() => setActiveFundAction({ fund: null, mode: null })}
      onSuccess={async () => {
        await onCreateBudget();
        setActiveFundAction({ fund: null, mode: null });
      }}
    />
    </>
  );
}

type SettlementTarget = {
  expenseId: string;
  participant: CellSharedExpenseParticipant;
  description: string;
};

function SharedExpensesPanel({
  cellId,
  expenses,
  members,
  sharedAccounts,
  onRefresh,
  currentUserId,
  isLeader,
}: {
  cellId: string;
  expenses: CellSharedExpense[];
  members: Clan['members'];
  sharedAccounts: CellSharedAccount[];
  onRefresh: () => Promise<void>;
  currentUserId?: string;
  isLeader: boolean;
}) {
  const { toast } = useToast();
  const memberLookup = useMemo(() => {
    const entries = members.map((member) => [member.userId, member.user?.name || 'Membro']);
    return Object.fromEntries(entries);
  }, [members]);
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [settlementTarget, setSettlementTarget] = useState<SettlementTarget | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [isFilterSheetOpen, setFilterSheetOpen] = useState(false);
  const activeFilterCount = [Boolean(searchTerm.trim()), statusFilter !== 'ALL', Boolean(monthFilter)].filter(Boolean).length;
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setMonthFilter('');
  };

  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((expense) => {
        if (searchTerm.trim() && !expense.description.toLowerCase().includes(searchTerm.trim().toLowerCase())) {
          return false;
        }
        if (monthFilter) {
          const expenseDate = new Date(expense.expenseDate || expense.createdAt);
          const yearMonth = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
          if (yearMonth !== monthFilter) {
            return false;
          }
        }
        if (statusFilter === 'PENDING') {
          return expense.participants.some((participant) => !participant.transaction?.pago);
        }
        if (statusFilter === 'PAID') {
          return expense.participants.length > 0 && expense.participants.every((participant) => participant.transaction?.pago);
        }
        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.expenseDate || a.createdAt).getTime();
        const dateB = new Date(b.expenseDate || b.createdAt).getTime();
        return dateB - dateA;
      });
  }, [expenses, searchTerm, monthFilter, statusFilter]);

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await api.delete(`/cells/${cellId}/expenses/${expenseId}`);
      toast({ title: 'Despesa removida.' });
      await onRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível excluir a despesa.',
        description: error?.response?.data?.message || 'Tente novamente.',
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Despesas compartilhadas</CardTitle>
            <CardDescription>Registre contas da casa e acompanhe quem já pagou.</CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <Sheet open={isFilterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <Filter className="mr-2 h-4 w-4" />
                    Filtros
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex h-full w-full flex-col p-0 sm:max-w-sm">
                  <SheetHeader className="border-b p-4 text-left">
                    <SheetTitle>Filtrar rateios</SheetTitle>
                    <SheetDescription>Busque por descrição, status ou mês de referência.</SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 space-y-4 overflow-y-auto p-4">
                    <div className="space-y-2">
                      <Label>Descrição</Label>
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Ex.: Conta de luz"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select value={statusFilter} onValueChange={(value: 'ALL' | 'PENDING' | 'PAID') => setStatusFilter(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">Todas</SelectItem>
                          <SelectItem value="PENDING">Pendentes</SelectItem>
                          <SelectItem value="PAID">Quitadas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Mês</Label>
                      <Input type="month" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} />
                    </div>
                  </div>
                  <SheetFooter className="flex items-center justify-between border-t p-4">
                    <Button variant="ghost" onClick={resetFilters} disabled={!activeFilterCount}>
                      Limpar filtros
                    </Button>
                    <SheetClose asChild>
                      <Button>Fechar</Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium">
                  {activeFilterCount} ativo{activeFilterCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <Button size="sm" className="w-full sm:w-auto" onClick={() => setDialogOpen(true)}>
              <ReceiptText className="mr-2 h-4 w-4" />
              Nova despesa
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredExpenses.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma despesa corresponde aos filtros selecionados. Ajuste os filtros ou cadastre uma nova conta.
            </p>
          )}
          {filteredExpenses.map((expense) => {
            const expenseDate = new Date(expense.expenseDate || expense.createdAt);
            return (
              <div key={expense.id} className="rounded-xl border bg-card p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold leading-tight">{expense.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {toCurrency(expense.totalAmount)} • {expense.category?.nome || 'Sem categoria'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {expenseDate.toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {isLeader && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-destructive" aria-label="Excluir despesa">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Excluir despesa?</AlertDialogTitle>
                        <AlertDialogDescription>Os lançamentos pendentes também serão removidos.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
              <div className="space-y-2">
                {expense.participants.map((participant) => {
                  const isPaid = Boolean(participant.transaction?.pago);
                  const canSettle = !isPaid && participant.userId === currentUserId;
                  return (
                    <div
                      key={participant.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-md border bg-muted/40 p-2 text-sm"
                    >
                      <div>
                        <p className="font-semibold">{memberLookup[participant.userId] || 'Membro'}</p>
                        <p className="text-xs text-muted-foreground">{toCurrency(participant.amountOwed)}</p>
                      </div>
                      {isPaid ? (
                        <Badge variant="outline" className="flex items-center gap-1 border-emerald-200 text-emerald-700">
                          <CircleCheck className="h-3.5 w-3.5" />
                          Pago
                        </Badge>
                      ) : canSettle ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setSettlementTarget({
                              expenseId: expense.id,
                              participant,
                              description: expense.description,
                            })
                          }
                        >
                          Registrar pagamento
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1 text-amber-700 bg-amber-100">
                          <Clock4 className="h-3.5 w-3.5" />
                          Aguardando
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
          })}
        </CardContent>
      </Card>
      <NewSharedExpenseDialog
        open={isDialogOpen}
        onOpenChange={setDialogOpen}
        cellId={cellId}
        members={members}
        sharedAccounts={sharedAccounts}
        onSuccess={async () => {
          setDialogOpen(false);
          await onRefresh();
        }}
      />
      <SettleSharedExpenseDialog
        target={settlementTarget}
        cellId={cellId}
        onClose={() => setSettlementTarget(null)}
        onSuccess={async () => {
          setSettlementTarget(null);
          await onRefresh();
        }}
      />
    </>
  );
}

function NewSharedExpenseDialog({
  open,
  onOpenChange,
  cellId,
  members,
  sharedAccounts,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cellId: string;
  members: Clan['members'];
  sharedAccounts: CellSharedAccount[];
  onSuccess: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mode, setMode] = useState<'EQUAL' | 'CUSTOM'>('EQUAL');
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    description: '',
    categoryId: '',
    totalAmount: '',
    expenseDate: today,
  });
  const [splits, setSplits] = useState<Record<string, string>>({});
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({});
  const [selectedAccounts, setSelectedAccounts] = useState<Record<string, string>>({});

  const accountsByMember = useMemo(() => {
    const map: Record<string, Account[]> = {};
    sharedAccounts.forEach((record) => {
      if (!record.account || !record.account.userId) {
        return;
      }
      const ownerId = record.account.userId;
      if (!map[ownerId]) {
        map[ownerId] = [];
      }
      map[ownerId].push(record.account);
    });
    return map;
  }, [sharedAccounts]);

  const memberHasAccount = (memberId: string) => (accountsByMember[memberId]?.length || 0) > 0;

  useEffect(() => {
    let active = true;
    if (!open) return;
    setIsLoadingCategories(true);
    api
      .get('/categories')
      .then((response) => {
        if (!active) return;
        setCategories(response.data || []);
      })
      .catch(() => {
        if (!active) return;
        setCategories([]);
      })
      .finally(() => {
        if (active) {
          setIsLoadingCategories(false);
        }
      });
    const initialSplits: Record<string, string> = {};
    const initialSelection: Record<string, boolean> = {};
    const initialAccounts: Record<string, string> = {};
    (members || []).forEach((member) => {
      const availableAccounts = accountsByMember[member.userId] || [];
      initialSplits[member.userId] = '';
      initialSelection[member.userId] = availableAccounts.length > 0;
      initialAccounts[member.userId] = availableAccounts[0]?.id || '';
    });
    setSplits(initialSplits);
    setSelectedMembers(initialSelection);
    setSelectedAccounts(initialAccounts);
    setForm({ description: '', categoryId: '', totalAmount: '', expenseDate: today });
    setMode('EQUAL');
    return () => {
      active = false;
    };
  }, [open, members, accountsByMember, today]);

  useEffect(() => {
    if (mode !== 'EQUAL') return;
    const total = parseAmount(form.totalAmount);
    const activeEligible = members.filter(
      (member) => selectedMembers[member.userId] && memberHasAccount(member.userId),
    );
    const perMember = activeEligible.length ? total / activeEligible.length : 0;
    setSplits((prev) => {
      const next: Record<string, string> = {};
      members.forEach((member) => {
        if (selectedMembers[member.userId] && memberHasAccount(member.userId)) {
          next[member.userId] = perMember ? perMember.toFixed(2) : prev[member.userId] || '';
        } else {
          next[member.userId] = '';
        }
      });
      return next;
    });
  }, [mode, form.totalAmount, members, selectedMembers, accountsByMember]);

  const totalAmount = parseAmount(form.totalAmount);
  const eligibleMembers = members.filter(
    (member) => selectedMembers[member.userId] && memberHasAccount(member.userId),
  );
  const hasSelection = eligibleMembers.length > 0;
  const splitEntries = eligibleMembers
    .map((member) => ({
      memberId: member.userId,
      amount: parseAmount(splits[member.userId]),
      accountId: selectedAccounts[member.userId],
    }))
    .filter((entry) => entry.amount > 0);
  const splitSum = splitEntries.reduce((acc, entry) => acc + entry.amount, 0);
  const totalsMatch = Math.round(splitSum * 100) === Math.round(totalAmount * 100);
  const missingAccount = splitEntries.some((entry) => !entry.accountId);

  const handleSubmit = async () => {
    if (
      !form.description.trim() ||
      !form.categoryId ||
      !totalAmount ||
      !splitEntries.length ||
      !totalsMatch ||
      !hasSelection ||
      missingAccount
    ) {
      toast({ variant: 'destructive', title: 'Revise os campos da despesa antes de salvar.' });
      return;
    }
    try {
      setIsSubmitting(true);
      await api.post(`/cells/${cellId}/expenses`, {
        description: form.description,
        categoryId: form.categoryId,
        totalAmount,
        splitMethod: mode === 'EQUAL' ? 'EQUAL' : 'AMOUNT',
        splits: splitEntries,
        expenseDate: form.expenseDate,
      });
      toast({ title: 'Despesa compartilhada cadastrada!' });
      await onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar a despesa.',
        description: error?.response?.data?.message || 'Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Nova despesa compartilhada</DialogTitle>
          <DialogDescription>Divida contas da casa e acompanhe quem já quitou cada parte.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[68vh] space-y-4 overflow-y-auto pr-1">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Descrição</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ex.: Conta de luz" />
            </div>
            <div>
              <Label>Categoria</Label>
              {isLoadingCategories ? (
                <p className="text-xs text-muted-foreground">Carregando categorias...</p>
              ) : (
                <Select value={form.categoryId} onValueChange={(value) => setForm({ ...form, categoryId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
              <Label>Data da despesa</Label>
              <Input
                type="date"
                value={form.expenseDate}
                onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Total</Label>
              <Input
                type="number"
                min={0}
                value={form.totalAmount}
                onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label>Divisão</Label>
              <Select value={mode} onValueChange={(value: 'EQUAL' | 'CUSTOM') => setMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EQUAL">Igualitária</SelectItem>
                  <SelectItem value="CUSTOM">Personalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Participantes</span>
              <span>
                Soma: {toCurrency(splitSum)} {totalsMatch ? '' : '(ajuste necessário)'}
              </span>
            </div>
            <div className="space-y-3">
              {members.map((member) => {
                const memberAccounts = accountsByMember[member.userId] || [];
                const hasAccount = memberAccounts.length > 0;
                const isChecked = Boolean(selectedMembers[member.userId] && hasAccount);
                return (
                  <div key={member.userId} className="rounded-lg border p-3 space-y-2 text-sm">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isChecked}
                          disabled={!hasAccount}
                          onCheckedChange={(checked) => {
                            if (!hasAccount) {
                              toast({
                                variant: 'destructive',
                                title: 'Vincule uma conta para incluir este membro.',
                              });
                              return;
                            }
                            setSelectedMembers((prev) => ({
                              ...prev,
                              [member.userId]: Boolean(checked),
                            }));
                            if (checked && !selectedAccounts[member.userId]) {
                              setSelectedAccounts((prev) => ({
                                ...prev,
                                [member.userId]: memberAccounts[0]?.id || '',
                              }));
                            }
                          }}
                        />
                        <span>{member.user?.name || 'Membro'}</span>
                      </div>
                      {hasAccount ? (
                        <Select
                          value={selectedAccounts[member.userId] || memberAccounts[0]?.id || ''}
                          onValueChange={(value) =>
                            setSelectedAccounts((prev) => ({
                              ...prev,
                              [member.userId]: value,
                            }))
                          }
                        >
                          <SelectTrigger className="w-full sm:w-48">
                            <SelectValue placeholder="Conta de origem" />
                          </SelectTrigger>
                          <SelectContent>
                            {memberAccounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Sem conta compartilhada — mantenha o valor em 0,00.
                        </p>
                      )}
                    </div>
                    <Input
                      className="sm:w-40"
                      type="number"
                      min={0}
                      value={splits[member.userId] ?? ''}
                      onChange={(e) =>
                        setSplits((prev) => ({
                          ...prev,
                          [member.userId]: e.target.value,
                        }))
                      }
                      disabled={mode === 'EQUAL' || !isChecked}
                    />
                  </div>
                );
              })}
            </div>
            {!hasSelection && (
              <p className="text-xs text-destructive">Inclua ao menos um membro com conta vinculada ao rateio.</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Salvando...' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SettleSharedExpenseDialog({
  target,
  cellId,
  onClose,
  onSuccess,
}: {
  target: SettlementTarget | null;
  cellId: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!target) {
      setAccounts([]);
      setSelectedAccountId('');
      return;
    }
    let active = true;
    setIsLoadingAccounts(true);
    api
      .get('/accounts')
      .then((response) => {
        if (!active) return;
        const list = response.data || [];
        setAccounts(list);
        const defaultAccountId = target.participant.defaultAccountId;
        if (defaultAccountId && list.some((account) => account.id === defaultAccountId)) {
          setSelectedAccountId(defaultAccountId);
        } else {
          setSelectedAccountId(list[0]?.id || '');
        }
      })
      .catch(() => {
        if (!active) return;
        setAccounts([]);
        setSelectedAccountId('');
      })
      .finally(() => {
        if (active) {
          setIsLoadingAccounts(false);
        }
      });
    return () => {
      active = false;
    };
  }, [target]);

  if (!target) {
    return null;
  }

  const handleSubmit = async () => {
    if (!selectedAccountId) {
      toast({ variant: 'destructive', title: 'Selecione a conta utilizada.' });
      return;
    }
    try {
      setIsSubmitting(true);
      await api.post(`/cells/${cellId}/expenses/${target.expenseId}/settle`, {
        participantId: target.participant.id,
        accountId: selectedAccountId,
      });
      toast({ title: 'Pagamento registrado!' });
      await onSuccess();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível registrar o pagamento.',
        description: error?.response?.data?.message || 'Tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const amount = toCurrency(target.participant.amountOwed);

  return (
    <Dialog open={Boolean(target)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>{target.description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Valor</Label>
            <Input value={amount} disabled />
          </div>
          <div>
            <Label>Conta utilizada</Label>
            {isLoadingAccounts ? (
              <p className="text-sm text-muted-foreground">Carregando contas...</p>
            ) : accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Você ainda não cadastrou contas. Cadastre pelo menos uma conta pessoal para registrar o pagamento.
              </p>
            ) : (
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting || accounts.length === 0}>
            {isSubmitting ? 'Salvando...' : 'Confirmar pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
    <>
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
    </>
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
  const [showErrors, setShowErrors] = useState(false);
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
  const parsedLimit = parseAmount(form.limit);
  const labelIsValid = Boolean(form.label.trim());
  const categoryIsValid = Boolean(form.categoryId);
  const limitIsValid = Number.isFinite(parsedLimit) && parsedLimit > 0;
  const customRecurrenceValue = Number(form.recurrenceDays);
  const customRecurrenceValid =
    form.recurrenceType !== 'CUSTOM' || (Number.isFinite(customRecurrenceValue) && customRecurrenceValue >= 1 && customRecurrenceValue <= 90);

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
      } catch {
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
  const distributionValid = !splitModeEnabled || form.splitMode !== 'PERCENTAGE' || totalDistribution === 100;

  const errors = useMemo(() => ({
    label: labelIsValid ? null : 'Dê um nome para o envelope.',
    category: categoryIsValid ? null : 'Selecione a categoria que receberá o espelho.',
    limit: limitIsValid ? null : 'Informe um limite maior que zero.',
    recurrence: customRecurrenceValid ? null : 'Recorrência personalizada deve ficar entre 1 e 90 dias.',
    distribution: distributionValid ? null : 'A soma das porcentagens precisa fechar 100%.',
  }), [labelIsValid, categoryIsValid, limitIsValid, customRecurrenceValid, distributionValid]);

  const formIsValid = Object.values(errors).every((value) => !value);

  const handleSubmit = async () => {
    if (!formIsValid) {
      setShowErrors(true);
      toast({ variant: 'destructive', title: 'Revise os campos destacados antes de salvar.' });
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
      setShowErrors(false);
      setDistribution(buildDefaultDistribution());
      await onSuccess();
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível criar o orçamento.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const showError = (key: keyof typeof errors) => showErrors && errors[key];

  return (
    <DialogContent className="max-w-xl sm:max-w-3xl overflow-y-auto max-h-[90vh]">
      <DialogHeader>
        <DialogTitle>Novo orçamento</DialogTitle>
        <DialogDescription>Preencha apenas o essencial e deixe o Dexpesas sincronizar com todos.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-1 sm:pr-0">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Nome</Label>
            <Input
              value={form.label}
              onChange={(e) => setForm({ ...form, label: e.target.value })}
              placeholder="Ex.: Mercado do mês"
              aria-invalid={Boolean(showError('label'))}
            />
            {showError('label') && <p className="text-xs text-destructive">{errors.label}</p>}
          </div>
          <div>
            <Label>Categoria vinculada</Label>
            {isLoadingCategories ? (
              <p className="text-xs text-muted-foreground">Carregando categorias...</p>
            ) : (
              <Select value={form.categoryId} onValueChange={(value) => setForm({ ...form, categoryId: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione" />
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
            {showError('category') && <p className="text-xs text-destructive">{errors.category}</p>}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Limite planejado</Label>
            <Input
              inputMode="decimal"
              type="number"
              min={0}
              value={form.limit}
              onChange={(e) => setForm({ ...form, limit: e.target.value })}
              placeholder="0,00"
              aria-invalid={Boolean(showError('limit'))}
            />
            {showError('limit') && <p className="text-xs text-destructive">{errors.limit}</p>}
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value as CellBudget['type'] })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CELL">Compartilhado</SelectItem>
                <SelectItem value="HYBRID">Híbrido</SelectItem>
                <SelectItem value="PERSONAL">Pessoal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Recorrência</Label>
            <Select value={form.recurrenceType} onValueChange={(value) => setForm({ ...form, recurrenceType: value as CellBudget['recurrenceType'] })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MONTHLY">Mensal</SelectItem>
                <SelectItem value="WEEKLY">Semanal</SelectItem>
                <SelectItem value="BIWEEKLY">Quinzenal</SelectItem>
                <SelectItem value="CUSTOM">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.recurrenceType === 'CUSTOM' && (
            <div>
              <Label>Intervalo (dias)</Label>
              <Input
                inputMode="numeric"
                value={form.recurrenceDays}
                onChange={(e) => setForm({ ...form, recurrenceDays: e.target.value })}
                placeholder="Ex.: 15"
                aria-invalid={Boolean(showError('recurrence'))}
              />
              {showError('recurrence') && <p className="text-xs text-destructive">{errors.recurrence}</p>}
            </div>
          )}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Início</Label>
            <Input type="date" value={form.effectiveFrom} onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
          </div>
          <div>
            <Label>Término</Label>
            <Input type="date" value={form.effectiveTo} onChange={(e) => setForm({ ...form, effectiveTo: e.target.value })} />
          </div>
        </div>
        {splitModeEnabled && (
          <div className="space-y-3 rounded-md border p-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <Label>Divisão</Label>
                <p className="text-xs text-muted-foreground">Escolha como o limite aparece para os membros.</p>
              </div>
              <Select value={form.splitMode} onValueChange={(value) => setForm({ ...form, splitMode: value as 'EQUAL' | 'PERCENTAGE' })}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EQUAL">Igualitário</SelectItem>
                  <SelectItem value="PERCENTAGE" disabled={!hasMembers}>
                    Percentual
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.splitMode === 'PERCENTAGE' && (
              <div className="space-y-2">
                {members?.length === 0 && <p className="text-xs text-muted-foreground">Convide membros para dividir o valor.</p>}
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
                {showError('distribution') && <p className="text-xs text-destructive">{errors.distribution}</p>}
              </div>
            )}
          </div>
        )}
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
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
    targetAmount: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const targetValue = parseAmount(form.targetAmount);
  const isValid = Boolean(form.name.trim()) && targetValue > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setIsSubmitting(true);
    try {
      await api.post(`/cells/${cellId}/funds`, {
        name: form.name.trim(),
        targetAmount: targetValue,
        usagePolicy: form.description ? { notes: form.description } : null,
      });
      toast({ title: 'Fundo criado!' });
      await onSuccess();
      setForm({ name: '', targetAmount: '', description: '' });
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível criar o fundo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Nova caixinha coletiva</DialogTitle>
        <DialogDescription>Cadastre apenas o essencial para começar a guardar juntos.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Nome</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Viagem" />
          </div>
          <div>
            <Label>Meta</Label>
            <Input
              type="number"
              min={0}
              value={form.targetAmount}
              onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
              placeholder="0,00"
            />
          </div>
        </div>
        <div>
          <Label>Notas / regras rápidas</Label>
          <Textarea
            rows={3}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Quem usa? Quando sacar?"
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting || !isValid}>
          {isSubmitting ? 'Salvando...' : 'Criar fundo'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function FundContributionDialog({
  fund,
  mode,
  onClose,
  onSuccess,
}: {
  fund: CellFund | null;
  mode: 'DEPOSIT' | 'WITHDRAW' | null;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [destination, setDestination] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setAmount('');
    setNotes('');
    setDestination('');
    setSelectedAccountId('');
    setAccounts([]);
  }, [fund, mode]);

  useEffect(() => {
    if (!fund || !mode) {
      return;
    }
    let active = true;
    setIsLoadingAccounts(true);
    api
      .get('/accounts')
      .then((response) => {
        if (!active) return;
        const list = Array.isArray(response.data) ? response.data : [];
        setAccounts(list);
        setSelectedAccountId(list[0]?.id || '');
      })
      .catch(() => {
        if (!active) return;
        setAccounts([]);
        setSelectedAccountId('');
      })
      .finally(() => {
        if (active) {
          setIsLoadingAccounts(false);
        }
      });
    return () => {
      active = false;
    };
  }, [fund, mode]);

  if (!fund || !mode) {
    return null;
  }

  const handleSubmit = async () => {
    const parsed = parseAmount(amount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast({ variant: 'destructive', title: 'Informe um valor válido.' });
      return;
    }
    if (!selectedAccountId) {
      toast({ variant: 'destructive', title: 'Selecione a conta utilizada.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/cells/funds/${fund.id}/contributions`, {
        amount: mode === 'WITHDRAW' ? parsed * -1 : parsed,
        accountId: selectedAccountId,
        source: mode === 'WITHDRAW' ? 'WITHDRAW' : 'MANUAL_DEPOSIT',
        metadata: {
          notes: notes || undefined,
          destination: mode === 'WITHDRAW' ? destination || undefined : undefined,
        },
      });
      toast({ title: mode === 'WITHDRAW' ? 'Resgate registrado!' : 'Aplicação registrada!' });
      await onSuccess();
    } catch {
      toast({
        variant: 'destructive',
        title: mode === 'WITHDRAW' ? 'Não foi possível registrar o resgate.' : 'Não foi possível registrar o aporte.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={Boolean(fund && mode)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'WITHDRAW' ? 'Resgatar da caixinha' : 'Investir na caixinha'}</DialogTitle>
          <DialogDescription>{fund.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Valor</Label>
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div>
            <Label>{mode === 'WITHDRAW' ? 'Conta que recebe' : 'Conta de origem'}</Label>
            {isLoadingAccounts ? (
              <p className="text-sm text-muted-foreground">Carregando contas...</p>
            ) : accounts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Você ainda não cadastrou contas pessoais. Cadastre uma para registrar o movimento.
              </p>
            ) : (
              <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          {mode === 'WITHDRAW' && (
            <div>
              <Label>Para onde vai o resgate?</Label>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Conta ou objetivo"
              />
            </div>
          )}
          <div>
            <Label>Notas</Label>
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo, comprovante, quem autorizou..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isSubmitting || accounts.length === 0}>
            {isSubmitting ? 'Salvando...' : mode === 'WITHDRAW' ? 'Resgatar' : 'Investir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SplitRulesPanel({
  cellId,
  splitRules,
  onUpdated,
  members,
}: {
  cellId: string;
  splitRules: CellSplitRule[];
  onUpdated: () => Promise<void>;
  members: Clan['members'];
}) {
  const { toast } = useToast();
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);

  useEffect(() => {
    let active = true;
    api
      .get('/accounts')
      .then((response) => {
        if (!active) return;
        setAccounts(response.data || []);
      })
      .catch(() => {
        if (!active) return;
        toast({
          variant: 'destructive',
          title: 'Não foi possível carregar contas.',
          description: 'Verifique a conexão e tente novamente.',
        });
      });
    return () => {
      active = false;
    };
  }, [toast]);

  const memberMap = useMemo(() => {
    const entries = (members || []).map((member) => [member.userId, member.user?.name || 'Integrante']);
    return Object.fromEntries(entries);
  }, [members]);

  const accountMap = useMemo(() => {
    const entries = accounts.map((account) => [account.id, account.nome]);
    return Object.fromEntries(entries);
  }, [accounts]);

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
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>Rateios por conta</CardTitle>
          <CardDescription>Defina de onde sai a despesa e quanto cada um recebe.</CardDescription>
        </div>
        <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
          <DialogTrigger asChild>
            <Button>
              <SplitSquareHorizontal className="h-4 w-4 mr-2" />
              Novo rateio
            </Button>
          </DialogTrigger>
          <FamilySplitWizard
            cellId={cellId}
            members={members}
            accounts={accounts}
            onSuccess={async () => {
              setIsWizardOpen(false);
              await onUpdated();
            }}
          />
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4">
        {splitRules.length === 0 && <p className="text-sm text-muted-foreground">Nenhum rateio configurado.</p>}
        {splitRules.map((rule) => {
          const metadata = (rule.metadata || {}) as any;
          const distribution = Array.isArray(metadata?.distribution) ? metadata.distribution : [];
          const sourceAccountName = metadata?.sourceAccountId
            ? accountMap[metadata.sourceAccountId] || 'Conta vinculada'
            : 'Conta não definida';

          return (
            <div key={rule.id} className="rounded-xl border bg-card p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <div>
                  <p className="font-semibold leading-tight">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">Origem: {sourceAccountName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {rule.method}
                  </Badge>
                  <Button size="sm" variant="secondary" onClick={() => handleApplyRule(rule.id)}>
                    Rodar
                  </Button>
                </div>
              </div>
              {distribution.length > 0 ? (
                <div className="space-y-2">
                  {distribution.map((entry: any) => (
                    <details key={`${rule.id}-${entry.memberId}`} className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
                      <summary className="flex items-center justify-between gap-2">
                        <span>{memberMap[entry.memberId] || 'Integrante'}</span>
                        <span className="font-medium text-foreground">{entry.percentage || 0}%</span>
                      </summary>
                      <div className="mt-2 flex flex-col gap-1">
                        <span>Conta destino: {entry.accountId ? accountMap[entry.accountId] || 'Conta pessoal' : 'Não informado'}</span>
                        {entry.status && <span>Status: {entry.status}</span>}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Sem detalhes de distribuição.</p>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function FamilySplitWizard({
  cellId,
  members,
  accounts,
  onSuccess,
}: {
  cellId: string;
  members: Clan['members'];
  accounts: Account[];
  onSuccess: () => Promise<void>;
}) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    sourceAccountId: '',
    autoReimburse: true,
  });
  const [distribution, setDistribution] = useState<Record<string, { percentage: string; accountId: string }>>(() => {
    const totalMembers = members?.length || 0;
    const defaultShare = totalMembers ? Math.round(100 / totalMembers) : 100;
    const initial: Record<string, { percentage: string; accountId: string }> = {};
    members?.forEach((member) => {
      initial[member.userId] = { percentage: String(defaultShare), accountId: '' };
    });
    return initial;
  });

  useEffect(() => {
    const totalMembers = members?.length || 0;
    const defaultShare = totalMembers ? Math.round(100 / totalMembers) : 100;
    setDistribution((prev) => {
      const next: Record<string, { percentage: string; accountId: string }> = {};
      members?.forEach((member) => {
        next[member.userId] = prev[member.userId] || { percentage: String(defaultShare), accountId: '' };
      });
      return next;
    });
  }, [members]);

  useEffect(() => {
    if (accounts.length && !form.sourceAccountId) {
      setForm((prev) => ({ ...prev, sourceAccountId: prev.sourceAccountId || accounts[0].id }));
    }
  }, [accounts, form.sourceAccountId]);

  const totalPercentage = Object.values(distribution).reduce((sum, item) => sum + Number(item.percentage || 0), 0);
  const canSubmit = Boolean(form.name.trim()) && Boolean(form.sourceAccountId) && totalPercentage === 100;

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast({ variant: 'destructive', title: 'Distribua 100% da despesa antes de salvar.' });
      return;
    }
    setIsSubmitting(true);
    try {
      const payloadDistribution = Object.entries(distribution).map(([memberId, payload]) => ({
        memberId,
        percentage: Number(payload.percentage) || 0,
        accountId: payload.accountId || null,
      }));

      await api.post(`/cells/${cellId}/split-rules`, {
        name: form.name.trim(),
        trigger: 'RECURRING_BILL',
        method: 'WEIGHTED',
        autoReimburse: form.autoReimburse,
        metadata: {
          description: form.description || null,
          sourceAccountId: form.sourceAccountId,
          distribution: payloadDistribution,
        },
      });
      toast({ title: 'Rateio configurado!' });
      await onSuccess();
      setForm({ name: '', description: '', sourceAccountId: accounts[0]?.id || '', autoReimburse: true });
    } catch {
      toast({ variant: 'destructive', title: 'Não foi possível salvar o rateio.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DialogContent className="space-y-4">
      <DialogHeader>
        <DialogTitle>Novo rateio</DialogTitle>
        <DialogDescription>Escolha a conta de origem e como o valor será dividido.</DialogDescription>
      </DialogHeader>
      <div className="space-y-3">
        <div>
          <Label>Nome</Label>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Luz compartilhada" />
        </div>
        <div>
          <Label>Conta de origem</Label>
          <Select value={form.sourceAccountId} onValueChange={(value) => setForm({ ...form, sourceAccountId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  {account.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Notas rápidas</Label>
          <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Quando rodar? Quem paga primeiro?" />
        </div>
        <div className="rounded-md border p-3 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Distribuição ({totalPercentage}%)</span>
            <span>{totalPercentage === 100 ? 'Ok' : 'Ajuste para fechar 100%'}</span>
          </div>
          <div className="space-y-2">
            {members?.map((member) => (
              <div key={member.userId} className="rounded-md bg-muted/30 p-2 space-y-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span>{member.user?.name || 'Integrante'}</span>
                  <div className="flex items-center gap-2">
                    <Input
                      className="w-20"
                      type="number"
                      min={0}
                      max={100}
                      value={distribution[member.userId]?.percentage || ''}
                      onChange={(e) =>
                        setDistribution((prev) => ({
                          ...prev,
                          [member.userId]: {
                            ...(prev[member.userId] || { accountId: '' }),
                            percentage: e.target.value,
                          },
                        }))
                      }
                    />
                    <span className="text-xs">%</span>
                  </div>
                </div>
                <Select
                  value={distribution[member.userId]?.accountId || ''}
                  onValueChange={(value) =>
                    setDistribution((prev) => ({
                      ...prev,
                      [member.userId]: {
                        ...(prev[member.userId] || { percentage: '0' }),
                        accountId: value,
                      },
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Conta destino (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={`${member.userId}-${account.id}`} value={account.id}>
                        {account.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between rounded-md border px-3 py-2 text-xs text-muted-foreground">
          <span>Marcar como reembolsado automaticamente</span>
          <Switch
            checked={form.autoReimburse}
            onCheckedChange={(checked) => setForm((prev) => ({ ...prev, autoReimburse: checked }))}
          />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={handleSubmit} disabled={isSubmitting || !canSubmit}>
          {isSubmitting ? 'Salvando...' : 'Salvar rateio'}
        </Button>
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
              <InviteWizard
                cellId={cell.id}
                open={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                onSuccess={onChange}
              />
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

function InviteWizard({
  cellId,
  open,
  onClose,
  onSuccess,
}: {
  cellId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}) {
  type LookupUser = { id: string; name?: string; email?: string; username?: string; avatarUrl?: string | null };
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const [form, setForm] = useState<WizardInviteForm>({
    identifier: '',
    visibility: {
      viewPersonalBudget: false,
      viewAccounts: false,
      shareDebtSummary: false,
    },
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lookupResult, setLookupResult] = useState<LookupUser | null>(null);
  const [validatedIdentifier, setValidatedIdentifier] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const resetWizard = useCallback(() => {
    setStep(1);
    setForm({
      identifier: '',
      visibility: {
        viewPersonalBudget: false,
        viewAccounts: false,
        shareDebtSummary: false,
      },
    });
    setLookupResult(null);
    setValidatedIdentifier('');
    setLookupError(null);
  }, []);

  useEffect(() => {
    if (!open) {
      resetWizard();
    }
  }, [open, resetWizard]);

  const ensureLookup = useCallback(async () => {
    const trimmed = form.identifier.trim();
    if (!trimmed) {
      setLookupError('Informe o email ou ID do convidado.');
      return false;
    }
    if (lookupResult && validatedIdentifier === trimmed) {
      return true;
    }
    setIsSearching(true);
    try {
      const response = await api.get('/user/lookup', { params: { identifier: trimmed } });
      setLookupResult(response.data);
      setValidatedIdentifier(trimmed);
      setLookupError(null);
      return true;
    } catch (error: any) {
      setLookupResult(null);
      setLookupError(error?.response?.data?.message || 'Usuário não encontrado.');
      return false;
    } finally {
      setIsSearching(false);
    }
  }, [form.identifier, lookupResult, validatedIdentifier]);

  const handleNext = async () => {
    if (step === 1) {
      const ok = await ensureLookup();
      if (!ok) return;
    }
    setStep((current) => Math.min(3, current + 1));
  };

  const handleSubmit = async () => {
    if (!lookupResult) {
      toast({ variant: 'destructive', title: 'Valide o convidado antes de enviar.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await api.post(`/cells/${cellId}/invite`, {
        invitedUserId: lookupResult.id,
        requestedVisibility: form.visibility,
      });
      toast({ title: 'Convite enviado!' });
      await onSuccess();
      onClose();
      resetWizard();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível enviar o convite.',
        description: error?.response?.data?.message || 'Revise os dados e tente novamente.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const visibilityOptions: Array<{ key: keyof WizardInviteForm['visibility']; label: string }> = [
    { key: 'viewPersonalBudget', label: 'Ver orçamento coletivo no pessoal' },
    { key: 'viewAccounts', label: 'Ver contas compartilhadas' },
    { key: 'shareDebtSummary', label: 'Acessar resumo de dívidas' },
  ];

  return (
    <DialogContent className="max-w-lg max-h-[85vh] space-y-4 overflow-hidden">
      <DialogHeader>
        <DialogTitle>Convidar novo membro</DialogTitle>
        <DialogDescription>Localize a pessoa pelo ID ou email e ajuste o que ela poderá ver.</DialogDescription>
      </DialogHeader>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {[1, 2, 3].map((current) => (
          <div key={current} className={`h-2 flex-1 rounded ${step >= current ? 'bg-primary' : 'bg-muted'}`} />
        ))}
      </div>
      <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
        {step === 1 && (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Email ou ID do convidado</Label>
              <Input
                value={form.identifier}
                onChange={(e) => {
                  setForm({ ...form, identifier: e.target.value });
                  setLookupError(null);
                }}
                placeholder="pessoa@exemplo.com ou usr_123"
              />
            </div>
            <Button
              variant="outline"
              onClick={ensureLookup}
              disabled={!form.identifier.trim() || isSearching}
            >
              {isSearching ? 'Buscando...' : 'Validar pessoa'}
            </Button>
            {lookupResult && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="font-semibold">{lookupResult.name || lookupResult.username || lookupResult.email}</p>
                <p className="text-xs text-muted-foreground">
                  {lookupResult.email || lookupResult.username || `ID: ${lookupResult.id}`}
                </p>
              </div>
            )}
            {lookupError && <p className="text-xs text-destructive">{lookupError}</p>}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Escolha o que essa pessoa poderá enxergar</p>
            {visibilityOptions.map((option) => (
              <div key={option.key} className="flex items-center justify-between text-sm">
                <span>{option.label}</span>
                <Switch
                  checked={form.visibility[option.key]}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      visibility: { ...prev.visibility, [option.key]: checked },
                    }))
                  }
                />
              </div>
            ))}
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Revise antes de enviar</p>
            {lookupResult ? (
              <div className="rounded-md border bg-muted/30 p-3 text-sm space-y-1">
                <p className="font-semibold">{lookupResult.name || lookupResult.username || lookupResult.email}</p>
                <p className="text-xs text-muted-foreground">
                  {lookupResult.email || lookupResult.username || `ID: ${lookupResult.id}`}
                </p>
              </div>
            ) : (
              <p className="text-xs text-destructive">Valide o convidado antes de continuar.</p>
            )}
            <div className="rounded-md border p-3 text-xs space-y-1">
              <p className="font-semibold text-foreground">Permissões solicitadas</p>
              {visibilityOptions
                .filter((option) => form.visibility[option.key])
                .map((option) => (
                  <p key={option.key}>• {option.label}</p>
                ))}
              {Object.values(form.visibility).every((value) => !value) && (
                <p>Nenhuma permissão especial selecionada.</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              O convidado receberá um alerta para aceitar ou recusar. Você pode ajustar permissões depois em “Membros”.
            </p>
          </div>
        )}
      </div>
      <DialogFooter className="flex flex-wrap gap-2">
        {step > 1 && (
          <Button variant="outline" onClick={() => setStep((current) => current - 1)}>
            Voltar
          </Button>
        )}
        {step < 3 && (
          <Button
            onClick={handleNext}
            disabled={step === 1 && (!form.identifier.trim() || !lookupResult)}
          >
            Avançar
          </Button>
        )}
        {step === 3 && (
          <Button onClick={handleSubmit} disabled={isSubmitting || !lookupResult}>
            {isSubmitting ? 'Enviando...' : 'Enviar convite'}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}

function TimelineFeed({ events }: { events: CellTimelineEvent[] }) {
  const [filter, setFilter] = useState<string>('all');
  const filtered = filter === 'all' ? events : events.filter((event) => event.type === filter);
  const uniqueTypes = Array.from(new Set(events.map((event) => event.type)));
  const formatTimestamp = (value: string | null | undefined) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return format(date, 'dd MMM · HH:mm', { locale: ptBR });
  };

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
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum evento recente.</p>
        ) : (
          <div className="max-h-96 space-y-3 overflow-y-auto pr-2">
            {filtered.map((event) => (
              <div key={event.id} className="rounded-md border p-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <p className="font-semibold">{event.title || event.type}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(event.createdAt)}
                  </span>
                </div>
                {event.description && <p className="text-sm text-muted-foreground">{event.description}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EquilibriumPanel({
  entries,
  currentUserId,
  cellId,
  members,
  onRefresh,
}: {
  entries: CellEquilibriumEntry[];
  currentUserId?: string;
  cellId: string;
  members: Clan['members'];
  onRefresh: () => Promise<void>;
}) {
  const { toast } = useToast();
  const memberLookup = useMemo(() => {
    const pairs = (members || []).map((member) => [
      member.userId,
      {
        name: member.user?.name || 'Integrante',
        avatarUrl: member.user?.avatarUrl || null,
      },
    ]);
    return Object.fromEntries(pairs);
  }, [members]);
  const positives = entries.filter((entry) => entry.balance > 0);
  const negatives = entries.filter((entry) => entry.balance < 0);
  const totalReceive = positives.reduce((acc, entry) => acc + entry.balance, 0);
  const totalPay = negatives.reduce((acc, entry) => acc + Math.abs(entry.balance), 0);
  const [settlementContext, setSettlementContext] = useState<{
    mode: 'PAY' | 'RECEIVE';
    amount: string;
    counterpartId: string;
    options: Array<{ id: string; name: string; balance: number }>;
  } | null>(null);
  const [settlementNotes, setSettlementNotes] = useState('');

  const closeDialog = () => {
    setSettlementContext(null);
    setSettlementNotes('');
  };

  const openSettlementDialog = (
    mode: 'PAY' | 'RECEIVE',
    counterpartPool: CellEquilibriumEntry[],
    suggestedAmount: number,
  ) => {
    if (!counterpartPool.length) {
      toast({
        variant: 'destructive',
        title: 'Nenhum membro encontrado para compensar.',
        description: 'Convide mais pessoas ou aguarde outros registros.',
      });
      return;
    }
    setSettlementContext({
      mode,
      amount: Math.abs(suggestedAmount).toFixed(2),
      counterpartId: counterpartPool[0].userId,
      options: counterpartPool.map((entry) => ({
        id: entry.userId,
        name: memberLookup[entry.userId]?.name || 'Integrante',
        balance: entry.balance,
      })),
    });
    setSettlementNotes('');
  };

  const handleRegisterSettlement = async () => {
    if (!settlementContext) return;
    const parsed = parseAmount(settlementContext.amount);
    if (!Number.isFinite(parsed) || parsed <= 0 || !settlementContext.counterpartId) {
      toast({ variant: 'destructive', title: 'Informe um valor válido.' });
      return;
    }
    try {
      await api.post(`/cells/${cellId}/equilibrium/settlements`, {
        counterpartId: settlementContext.counterpartId,
        amount: parsed,
        direction: settlementContext.mode,
        notes: settlementNotes || undefined,
      });
      toast({ title: 'Registro adicionado ao Equilíbrio.' });
      closeDialog();
      await onRefresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível registrar o acerto.',
        description: error?.response?.data?.message || 'Tente novamente em instantes.',
      });
    }
  };

  const renderMemberName = (userId: string) => memberLookup[userId]?.name || userId;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Equilíbrio familiar</CardTitle>
            <CardDescription>Controle quem pagou a mais e registre os ressarcimentos.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <Badge variant="secondary">
              Receber: <span className="ml-1 font-semibold text-green-700">{toCurrency(totalReceive)}</span>
            </Badge>
            <Badge variant="outline">
              Pagar: <span className="ml-1 font-semibold text-red-600">{toCurrency(totalPay)}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-green-600">
                <Wallet className="h-4 w-4" />
                A receber
              </h3>
            </div>
            <div className="space-y-2">
              {positives.length === 0 && <p className="text-xs text-muted-foreground">Ninguém te deve por enquanto.</p>}
              {positives.map((entry) => {
                const isCurrent = entry.userId === currentUserId;
                const debtorOptions = negatives.filter((candidate) => candidate.userId !== entry.userId);
                return (
                  <div
                    key={entry.userId}
                    className="rounded-md border p-3 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">{renderMemberName(entry.userId)}</p>
                      <p className="text-xs text-muted-foreground">Saldo: {toCurrency(entry.balance)}</p>
                    </div>
                    {isCurrent && debtorOptions.length > 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSettlementDialog('RECEIVE', debtorOptions, entry.balance)}
                      >
                        Registrar recebimento
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Aguardando</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-red-600">
                <Wallet className="h-4 w-4" />
                Você deve
              </h3>
            </div>
            <div className="space-y-2">
              {negatives.length === 0 && <p className="text-xs text-muted-foreground">Nenhum débito pendente.</p>}
              {negatives.map((entry) => {
                const isCurrent = entry.userId === currentUserId;
                const creditorOptions = positives.filter((candidate) => candidate.userId !== entry.userId);
                return (
                  <div
                    key={entry.userId}
                    className="rounded-md border p-3 flex items-center justify-between gap-3 text-sm"
                  >
                    <div className="space-y-0.5">
                      <p className="font-semibold text-foreground">{renderMemberName(entry.userId)}</p>
                      <p className="text-xs text-muted-foreground">
                        Saldo: {toCurrency(Math.abs(entry.balance))} a pagar
                      </p>
                    </div>
                    {isCurrent && creditorOptions.length > 0 ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => openSettlementDialog('PAY', creditorOptions, Math.abs(entry.balance))}
                      >
                        Registrar Pix
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sem ações</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={Boolean(settlementContext)} onOpenChange={(open) => (!open ? closeDialog() : null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {settlementContext?.mode === 'PAY' ? 'Registrar pagamento' : 'Registrar recebimento'}
            </DialogTitle>
            <DialogDescription>
              Atualize o Equilíbrio anotando quanto foi transferido e para quem.
            </DialogDescription>
          </DialogHeader>
          {settlementContext && (
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Com quem você acertou?</Label>
                <Select
                  value={settlementContext.counterpartId}
                  onValueChange={(value) =>
                    setSettlementContext((prev) => (prev ? { ...prev, counterpartId: value } : prev))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {settlementContext.options.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Valor</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={settlementContext.amount}
                  onChange={(e) =>
                    setSettlementContext((prev) => (prev ? { ...prev, amount: e.target.value } : prev))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>Notas</Label>
                <Textarea
                  rows={3}
                  value={settlementNotes}
                  onChange={(e) => setSettlementNotes(e.target.value)}
                  placeholder="PIX enviado? Jogo de quem pagou e referência."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={handleRegisterSettlement}
              disabled={!settlementContext || !settlementContext.counterpartId}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReportsPanel({ budgets, funds }: { budgets: CellBudget[]; funds: CellFund[] }) {
  const totalCellBudgets = budgets
    .filter((budget) => budget.type !== 'PERSONAL')
    .reduce((acc, budget) => acc + parseAmount(budget.limit), 0);
  const totalHybridPersonal = budgets
    .filter((budget) => budget.type === 'PERSONAL')
    .reduce((acc, budget) => acc + parseAmount(budget.limit), 0);
  const totalFunds = funds.reduce((acc, fund) => acc + parseAmount(fund.currentAmount), 0);

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
