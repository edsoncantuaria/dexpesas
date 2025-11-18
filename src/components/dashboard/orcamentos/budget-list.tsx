// src/components/dashboard/orcamentos/budget-list.tsx
'use client';

import Link from 'next/link';
import type { Budget } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoreVertical, Pencil, Trash2, Repeat, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useMemo, useState } from 'react';
import { DeleteBudgetDialog } from './delete-budget-dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNowStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type BudgetListProps = {
  budgets: Budget[];
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
};

type BudgetFilter = 'all' | 'personal' | 'family';

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function BudgetList({ budgets, onEdit, onDelete }: BudgetListProps) {
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);
  const [filterMode, setFilterMode] = useState<BudgetFilter>('all');

  const stats = useMemo(() => {
    const base = {
      all: { count: 0, limit: 0, spent: 0 },
      personal: { count: 0, limit: 0, spent: 0 },
      family: { count: 0, limit: 0, spent: 0 },
    };
    budgets.forEach((budget) => {
      const limit = Number(budget.limit) || 0;
      const spent = Number(budget.spent) || 0;
      const key: BudgetFilter = budget.cellBudgetId ? 'family' : 'personal';
      base.all.count += 1;
      base.all.limit += limit;
      base.all.spent += spent;
      base[key].count += 1;
      base[key].limit += limit;
      base[key].spent += spent;
    });
    return base;
  }, [budgets]);

  const filteredBudgets = useMemo(() => {
    if (filterMode === 'family') {
      return budgets.filter((budget) => Boolean(budget.cellBudgetId));
    }
    if (filterMode === 'personal') {
      return budgets.filter((budget) => !budget.cellBudgetId);
    }
    return budgets;
  }, [budgets, filterMode]);

  const totals = stats[filterMode];

  const filterOptions: { label: string; value: BudgetFilter }[] = [
    { label: 'Todos', value: 'all' },
    { label: 'Pessoais', value: 'personal' },
    { label: 'Modo Família', value: 'family' },
  ];

  const handleConfirmDelete = () => {
    if (!deletingBudget) return;
    onDelete(deletingBudget.id);
    setDeletingBudget(null);
  };
  
  const getProgressColor = (percentage: number) => {
    if (percentage > 100) return "bg-red-500";
    if (percentage > 80) return "bg-yellow-500";
    return "bg-primary";
  };

  return (
    <>
      <div className="space-y-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={filterMode === option.value ? 'default' : 'outline'}
              onClick={() => setFilterMode(option.value)}
            >
              {option.label} ({stats[option.value].count})
            </Button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="text-xs uppercase text-muted-foreground">Limite total</p>
            <p className="text-2xl font-semibold">{formatCurrency(totals.limit)}</p>
          </div>
          <div className="rounded-md border bg-muted/40 p-3">
            <p className="text-xs uppercase text-muted-foreground">
              {filterMode === 'family' ? 'Gasto compartilhado' : 'Gasto total'}
            </p>
            <p className="text-2xl font-semibold">{formatCurrency(totals.spent)}</p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBudgets.map((budget) => {
          const spent = Number(budget.spent) || 0;
          const limit = Number(budget.limit);
          const percentage = limit > 0 ? (spent / limit) * 100 : 0;
          const remaining = limit - spent;
          const lastSyncedText =
            budget.cellBudgetId && budget.cellSyncedAt
              ? formatDistanceToNowStrict(new Date(budget.cellSyncedAt), {
                  addSuffix: true,
                  locale: ptBR,
                })
              : null;

          return (
            <div key={budget.id} className="relative group">
              <Card className="shadow-md transition-all h-full flex flex-col hover:border-primary/50">
                <CardHeader className="flex flex-row items-start justify-between pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>{budget.category?.label || budget.category?.nome || budget.categoryId}</CardTitle>
                      {budget.cellBudgetId && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary">Modo Família</Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Limite sincronizado da família. Edite no painel do Modo Família.</p>
                              {lastSyncedText && (
                                <p className="text-xs text-muted-foreground">Última sincronização {lastSyncedText}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <CardDescription className="flex items-center gap-1.5 flex-wrap">
                        Limite: {formatCurrency(limit)}
                        {budget.rollover && budget.rolloverAmount !== 0 && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 cursor-help text-muted-foreground"/>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Base: {formatCurrency(budget.originalLimit)}</p>
                                        <p className={cn(budget.rolloverAmount > 0 ? "text-green-500" : "text-destructive")}>
                                            Rollover: {formatCurrency(budget.rolloverAmount)}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        )}
                    </CardDescription>
                  </div>
                  {!budget.cellBudgetId && (
                    <div className="absolute top-2 right-2 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(budget)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive focus:bg-destructive/10"
                            onClick={() => setDeletingBudget(budget)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-end">
                    <div className="space-y-2">
                        <Progress value={Math.min(percentage, 100)} className="h-3" indicatorClassName={getProgressColor(percentage)} />
                        <div className="flex justify-between text-sm">
                            <p>
                                {budget.cellBudgetId ? 'Gasto compartilhado:' : 'Gasto:'}{' '}
                                <span className="font-semibold">{formatCurrency(spent)}</span>
                            </p>
                            <p className={cn(remaining < 0 ? "text-destructive" : "text-muted-foreground")}>
                                {remaining >= 0 ? 'Restante:' : 'Excedido:'} <span className="font-semibold">{formatCurrency(Math.abs(remaining))}</span>
                            </p>
                        </div>
                    </div>
                    {budget.rollover && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                            <Repeat className="h-3 w-3" />
                            <span>Rollover ativo</span>
                        </div>
                    )}
                    {budget.cellBudgetId && (
                      <div className="mt-3 text-xs">
                        <Link href={`/dashboard/cells`} className="text-primary underline">
                          Gerenciar no Modo Família
                        </Link>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
      
      <DeleteBudgetDialog 
        isOpen={!!deletingBudget}
        onClose={() => setDeletingBudget(null)}
        onConfirm={handleConfirmDelete}
        budgetCategory={deletingBudget?.category?.label || deletingBudget?.category?.nome || deletingBudget?.categoryId || ''}
      />
    </>
  );
}
