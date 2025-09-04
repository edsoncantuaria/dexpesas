// src/components/dashboard/orcamentos/budget-list.tsx
'use client';

import * as React from 'react';
import type { Budget } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MoreVertical, Pencil, Trash2, Repeat, Info, TrendingUp, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { DeleteBudgetDialog } from './delete-budget-dialog';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

type BudgetListProps = {
  budgets: Budget[];
  onEdit: (budget: Budget) => void;
  onDelete: (budgetId: string) => void;
};

const formatCurrency = (value: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function BudgetList({ budgets, onEdit, onDelete }: BudgetListProps) {
  const [deletingBudget, setDeletingBudget] = useState<Budget | null>(null);

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => {
          const spent = Number(budget.spent) || 0;
          const limit = Number(budget.limit);
          const percentage = limit > 0 ? (spent / limit) * 100 : 0;
          const remaining = limit - spent;

          return (
            <div key={budget.id} className="relative group">
              <Card className="shadow-md transition-all h-full flex flex-col hover:border-primary/50">
                <CardHeader className="flex flex-row items-start justify-between pb-4">
                  <div>
                    <CardTitle>{budget.category?.label || budget.category?.nome || budget.categoryId}</CardTitle>
                    <CardDescription className="flex items-center gap-1.5">
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
                </CardHeader>
                <CardContent className="flex-grow flex flex-col justify-end">
                    <div className="space-y-2">
                        <Progress value={Math.min(percentage, 100)} className="h-3" indicatorClassName={getProgressColor(percentage)} />
                        <div className="flex justify-between text-sm">
                            <p>
                                Gasto: <span className="font-semibold">{formatCurrency(spent)}</span>
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
        budgetCategory={deletingBudget?.category?.nome || deletingBudget?.categoryId || ''}
      />
    </>
  );
}
