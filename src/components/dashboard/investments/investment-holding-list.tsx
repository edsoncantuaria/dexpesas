// src/components/dashboard/investments/investment-holding-list.tsx
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { MoreHorizontal, TrendingUp } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Account, Goal, InvestmentHolding } from '@/lib/definitions';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

type InvestmentHoldingListProps = {
  holdings: InvestmentHolding[];
  accounts: Account[];
  goals: Goal[];
  onLinkGoal: (holdingId: string, goalId: string | null) => Promise<void>;
  onCreateHolding: (payload: {
    accountId: string;
    assetClass: string;
    ticker?: string;
    expectedReturn?: number | string;
    goalId?: string | null;
  }) => Promise<void>;
  onUpdateHolding: (holdingId: string, payload: { assetClass?: string; ticker?: string; expectedReturn?: number | string; goalId?: string | null }) => Promise<void>;
  onDeleteHolding: (holdingId: string) => Promise<void>;
};

export function InvestmentHoldingList({
  holdings,
  accounts,
  goals,
  onLinkGoal,
  onCreateHolding,
  onUpdateHolding,
  onDeleteHolding,
}: InvestmentHoldingListProps) {
  const [selectedHoldingId, setSelectedHoldingId] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    accountId: '',
    assetClass: 'Renda Fixa',
    ticker: '',
    expectedReturn: '',
    goalId: '',
  });
  const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);

  const total = useMemo(
    () => holdings.reduce((acc, holding) => acc + Number(holding.currentAmount || 0), 0),
    [holdings],
  );

  const currentHolding = holdings.find((holding) => holding.id === selectedHoldingId);

  async function handleGoalSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedHoldingId) return;
    setIsSubmitting(true);
    try {
      await onLinkGoal(selectedHoldingId, selectedGoalId || null);
      setIsGoalDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  function openFormDialog(holding?: InvestmentHolding) {
    if (holding) {
      setFormState({
        accountId: holding.accountId,
        assetClass: holding.assetClass || 'Personalizado',
        ticker: holding.ticker || '',
        expectedReturn: holding.expectedReturn ? String(holding.expectedReturn) : '',
        goalId: holding.goalId || '',
      });
      setEditingHoldingId(holding.id);
    } else {
      setFormState({
        accountId: accounts.find((acc) => acc.tipo === 'investimento')?.id || '',
        assetClass: 'Renda Fixa',
        ticker: '',
        expectedReturn: '',
        goalId: '',
      });
      setEditingHoldingId(null);
    }
    setIsFormDialogOpen(true);
  }

  async function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formState.accountId) return;
    setIsSubmitting(true);
    try {
      if (editingHoldingId) {
        await onUpdateHolding(editingHoldingId, {
          assetClass: formState.assetClass,
          ticker: formState.ticker || undefined,
          expectedReturn: formState.expectedReturn || undefined,
          goalId: formState.goalId || null,
        });
      } else {
        await onCreateHolding({
          accountId: formState.accountId,
          assetClass: formState.assetClass,
          ticker: formState.ticker || undefined,
          expectedReturn: formState.expectedReturn || undefined,
          goalId: formState.goalId || undefined,
        });
      }
      setIsFormDialogOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(holdingId: string) {
    setIsSubmitting(true);
    try {
      await onDeleteHolding(holdingId);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="h-full shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-2xl">Carteiras de Investimento</CardTitle>
          <CardDescription>Contas de investimento e seus objetivos vinculados.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs bg-gradient-to-r from-primary/20 to-primary/10">
            {holdings.length} holdings
          </Badge>
          <Button size="sm" onClick={() => openFormDialog()} className="shadow-md shadow-primary/20">
            Adicionar holding
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {holdings.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center rounded-2xl border-2 border-dashed bg-gradient-to-br from-card/50 to-card/30">
            <div className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
              <TrendingUp className="h-12 w-12 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold">Nenhuma carteira cadastrada</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Crie uma conta do tipo investimento para começar a mapear seus holdings.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Conta</TableHead>
                    <TableHead className="hidden md:table-cell">Classe</TableHead>
                    <TableHead className="hidden md:table-cell">Meta vinculada</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holdings.map((holding) => (
                    <TableRow key={holding.id}>
                      <TableCell>
                        <div className="font-semibold">{holding.account.nome}</div>
                        <div className="text-xs text-muted-foreground">{holding.account.instituicao}</div>
                      </TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{holding.assetClass}</TableCell>
                      <TableCell className="text-sm hidden md:table-cell">
                        {holding.goal ? (
                          <span className="font-medium">{holding.goal.name}</span>
                        ) : (
                          <span className="text-muted-foreground">Sem meta</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {currencyFormatter.format(Number(holding.currentAmount || 0))}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedGoalId(holding.goalId || '');
                                setSelectedHoldingId(holding.id);
                                setIsGoalDialogOpen(true);
                              }}
                            >
                              Vincular Meta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openFormDialog(holding)}>
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(holding.id)}
                              disabled={isSubmitting}
                              className="text-destructive focus:text-destructive"
                            >
                              Remover
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border bg-gradient-to-r from-emerald-500/10 to-green-500/5 border-emerald-500/20 p-4 text-sm">
              <span className="font-semibold">Total mapeado</span>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{currencyFormatter.format(total)}</span>
            </div>
          </>
        )}
      </CardContent>

      <ResponsiveDialog
        isOpen={isGoalDialogOpen}
        setIsOpen={setIsGoalDialogOpen}
        title="Vincular meta"
        description="Escolha uma meta financeira para acompanhar os aportes desse holding. Ganhe visibilidade sem duplicar dados."
      >
        <form onSubmit={handleGoalSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Holding</Label>
            <p className="text-sm font-medium">
              {currentHolding?.account.nome} — {currentHolding?.assetClass}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="goalSelect">Meta</Label>
            <Select value={selectedGoalId || 'none'} onValueChange={(value) => setSelectedGoalId(value === 'none' ? null : value)}>
              <SelectTrigger id="goalSelect">
                <SelectValue placeholder="Selecione uma meta (ou deixe vazio para remover)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem meta</SelectItem>
                {goals.map((goal) => (
                  <SelectItem key={goal.id} value={goal.id}>
                    {goal.name} — {currencyFormatter.format(goal.currentAmount)} /{' '}
                    {currencyFormatter.format(goal.targetAmount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsGoalDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!selectedHoldingId || isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar vínculo'}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>

      <ResponsiveDialog
        isOpen={isFormDialogOpen}
        setIsOpen={setIsFormDialogOpen}
        title={editingHoldingId ? 'Editar holding' : 'Adicionar holding'}
        description="Defina a conta de investimento e os parâmetros da aplicação."
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Conta de investimento</Label>
            <Select
              value={formState.accountId}
              onValueChange={(value) => setFormState((prev) => ({ ...prev, accountId: value }))}
              disabled={Boolean(editingHoldingId)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {accounts
                  .filter((account) => account.tipo === 'investimento')
                  .map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.nome} — {account.instituicao}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="assetClass">Classe do ativo</Label>
              <Input
                id="assetClass"
                value={formState.assetClass}
                onChange={(event) => setFormState((prev) => ({ ...prev, assetClass: event.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticker">Ticker / Identificador</Label>
              <Input
                id="ticker"
                value={formState.ticker}
                onChange={(event) => setFormState((prev) => ({ ...prev, ticker: event.target.value }))}
                placeholder="Ex: TESOURO, ETF11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedReturn">Taxa esperada (% ano)</Label>
              <Input
                id="expectedReturn"
                type="number"
                step="0.01"
                value={formState.expectedReturn}
                onChange={(event) => setFormState((prev) => ({ ...prev, expectedReturn: event.target.value }))}
                placeholder="Ex: 0.12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="goalLink">Meta vinculada</Label>
              <Select
                value={formState.goalId || 'none'}
                onValueChange={(value) => setFormState((prev) => ({ ...prev, goalId: value === 'none' ? '' : value }))}
              >
                <SelectTrigger id="goalLink">
                  <SelectValue placeholder="Sem meta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem meta</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting || !formState.accountId}>
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </ResponsiveDialog>
    </Card>
  );
}

export default InvestmentHoldingList;
