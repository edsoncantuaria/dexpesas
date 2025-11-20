// src/components/dashboard/orcamentos/budget-list.tsx
'use client';

import Link from 'next/link';
import type { Budget } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoreVertical, Pencil, Trash2, Repeat, Info } from 'lucide-react';
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
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';

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
    if (percentage > 90) return "from-red-500 to-red-600";
    if (percentage > 70) return "from-yellow-500 to-amber-500";
    return "from-emerald-500 to-green-600";
  };

  return (
    <>
      <div className="space-y-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <Button
              key={option.value}
              size="sm"
              variant={filterMode === option.value ? 'default' : 'outline'}
              onClick={() => setFilterMode(option.value)}
              className="transition-all"
            >
              {option.label} ({stats[option.value].count})
            </Button>
          ))}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-xl border bg-gradient-to-br from-primary/10 to-primary/5 p-4 shadow-sm"
          >
            <p className="text-xs uppercase text-muted-foreground font-medium mb-1">Limite total</p>
            <p className="text-3xl font-bold">{formatCurrency(totals.limit)}</p>
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl border bg-gradient-to-br from-muted/50 to-muted/30 p-4 shadow-sm"
          >
            <p className="text-xs uppercase text-muted-foreground font-medium mb-1">
              {filterMode === 'family' ? 'Gasto compartilhado' : 'Gasto total'}
            </p>
            <p className="text-3xl font-bold">{formatCurrency(totals.spent)}</p>
          </motion.div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBudgets.map((budget, index) => {
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
            <BudgetCard
              key={budget.id}
              budget={budget}
              spent={spent}
              limit={limit}
              percentage={percentage}
              remaining={remaining}
              lastSyncedText={lastSyncedText}
              onEdit={onEdit}
              onDelete={() => setDeletingBudget(budget)}
              getProgressColor={getProgressColor}
              index={index}
            />
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

function BudgetCard({
  budget,
  spent,
  limit,
  percentage,
  remaining,
  lastSyncedText,
  onEdit,
  onDelete,
  getProgressColor,
  index,
}: {
  budget: Budget;
  spent: number;
  limit: number;
  percentage: number;
  remaining: number;
  lastSyncedText: string | null;
  onEdit: (budget: Budget) => void;
  onDelete: () => void;
  getProgressColor: (percentage: number) => string;
  index: number;
}) {
  const x = useMotionValue(0);
  const background = useTransform(
    x,
    [-100, 0, 100],
    ['rgb(239 68 68 / 0.2)', 'transparent', 'rgb(59 130 246 / 0.2)']
  );

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (budget.cellBudgetId) return; // Não permite swipe em orçamentos da família

    const threshold = 80;
    if (info.offset.x < -threshold) {
      onDelete();
    } else if (info.offset.x > threshold) {
      onEdit(budget);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      style={{ background }}
      className="relative rounded-2xl"
    >
      <motion.div
        drag={!budget.cellBudgetId ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={cn(!budget.cellBudgetId && "cursor-grab active:cursor-grabbing")}
      >
        <Card className="shadow-lg hover:shadow-xl transition-all h-full flex flex-col bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-white/10">
          <CardHeader className="flex flex-row items-start justify-between pb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-lg">{budget.category?.label || budget.category?.nome || budget.categoryId}</CardTitle>
                {budget.cellBudgetId && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="text-xs">Modo Família</Badge>
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
              <CardDescription className="flex items-center gap-1.5 flex-wrap mt-1">
                Limite: <span className="font-semibold">{formatCurrency(limit)}</span>
                {budget.rollover && budget.rolloverAmount !== 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3 w-3 cursor-help text-muted-foreground" />
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
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
                    onClick={onDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardHeader>
          <CardContent className="flex-grow flex flex-col justify-end space-y-3">
            <div className="space-y-2">
              <div className="relative h-3 rounded-full overflow-hidden bg-muted/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(percentage, 100)}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className={cn("h-full bg-gradient-to-r", getProgressColor(percentage))}
                />
              </div>
              <div className="flex justify-between text-sm">
                <p className="text-muted-foreground">
                  {budget.cellBudgetId ? 'Compartilhado:' : 'Gasto:'}{' '}
                  <span className="font-semibold text-foreground">{formatCurrency(spent)}</span>
                </p>
                <p className={cn("font-semibold", remaining < 0 ? "text-destructive" : "text-emerald-600 dark:text-emerald-400")}>
                  {remaining >= 0 ? 'Restante:' : 'Excedido:'} {formatCurrency(Math.abs(remaining))}
                </p>
              </div>
            </div>
            {budget.rollover && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Repeat className="h-3 w-3" />
                <span>Rollover ativo</span>
              </div>
            )}
            {budget.cellBudgetId && (
              <div className="text-xs">
                <Link href={`/dashboard/cells`} className="text-primary hover:underline font-medium">
                  Gerenciar no Modo Família →
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
