// src/components/dashboard/investments/investment-holding-list.tsx
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
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
    <Card className="h-full">
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Carteiras de Investimento</CardTitle>
          <CardDescription>Contas de investimento e seus objetivos vinculados.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {holdings.length} holdings
          </Badge>
          <Button size="sm" onClick={() => openFormDialog()}>
            Adicionar holding
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {holdings.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Ainda não identificamos holdings vinculadas ao seu plano. Crie uma conta do tipo investimento para começar.
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Conta</TableHead>
                  <TableHead>Classe</TableHead>
                  <TableHead>Meta vinculada</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdings.map((holding) => (
                  <TableRow key={holding.id}>
                    <TableCell>
                      <div className="font-semibold">{holding.account.nome}</div>
                      <div className="text-xs text-muted-foreground">{holding.account.instituicao}</div>
                    </TableCell>
                    <TableCell className="text-sm">{holding.assetClass}</TableCell>
                    <TableCell className="text-sm">
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
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedGoalId(holding.goalId || '');
                            setSelectedHoldingId(holding.id);
                            setIsGoalDialogOpen(true);
                          }}
                        >
                          Meta
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openFormDialog(holding)}>
                          Editar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(holding.id)} disabled={isSubmitting}>
                          Remover
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4 flex items-center justify-between rounded-lg border bg-muted/30 p-3 text-sm">
              <span className="font-medium">Total mapeado</span>
              <span className="text-lg font-semibold">{currencyFormatter.format(total)}</span>
            </div>
          </>
        )}
      </CardContent>

      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vincular meta</DialogTitle>
            <DialogDescription>
              Escolha uma meta financeira para acompanhar os aportes desse holding. Ganhe visibilidade sem duplicar dados.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGoalSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Holding</Label>
              <p className="text-sm font-medium">
                {currentHolding?.account.nome} — {currentHolding?.assetClass}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="goalSelect">Meta</Label>
              <Select value={selectedGoalId || ''} onValueChange={(value) => setSelectedGoalId(value || null)}>
                <SelectTrigger id="goalSelect">
                  <SelectValue placeholder="Selecione uma meta (ou deixe vazio para remover)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem meta</SelectItem>
                  {goals.map((goal) => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.name} — {currencyFormatter.format(goal.currentAmount)} /{' '}
                      {currencyFormatter.format(goal.targetAmount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={!selectedHoldingId || isSubmitting}>
                {isSubmitting ? 'Salvando...' : 'Salvar vínculo'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingHoldingId ? 'Editar holding' : 'Adicionar holding'}</DialogTitle>
            <DialogDescription>Defina a conta de investimento e os parâmetros da aplicação.</DialogDescription>
          </DialogHeader>
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
                  value={formState.goalId}
                  onValueChange={(value) => setFormState((prev) => ({ ...prev, goalId: value }))}
                >
                  <SelectTrigger id="goalLink">
                    <SelectValue placeholder="Sem meta" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sem meta</SelectItem>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting || !formState.accountId}>
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default InvestmentHoldingList;
