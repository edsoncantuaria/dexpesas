'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CellBudget } from '@/lib/definitions';
import { parseAmount, toCurrency } from './utils';
import { Pencil, Trash2, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

interface BudgetCardProps {
    budget: CellBudget;
    isLeader: boolean;
    onEdit?: (budget: CellBudget) => void;
    onDelete?: (budget: CellBudget) => void;
}

export function BudgetCard({ budget, isLeader, onEdit, onDelete }: BudgetCardProps) {
    const limit = parseAmount(budget.limit);
    const spent = parseAmount(budget.aggregatedSpent);
    const percentage = limit > 0 ? (spent / limit) * 100 : 0;
    const isOverLimit = percentage > 100;
    const isNearLimit = percentage >= 80 && percentage <= 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="overflow-hidden border-none shadow-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            {budget.label}
                            {budget.type === 'HYBRID' && <Badge variant="secondary" className="text-[10px]">Híbrido</Badge>}
                            {budget.type === 'PERSONAL' && <Badge variant="outline" className="text-[10px]">Ref</Badge>}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">{budget.category?.nome || 'Sem categoria'}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        {isLeader && (
                            <>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onEdit?.(budget)}>
                                    <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => onDelete?.(budget)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-end justify-between">
                            <div className="flex flex-col">
                                <span className="text-2xl font-bold">{toCurrency(spent)}</span>
                                <span className="text-xs text-muted-foreground">de {toCurrency(limit)}</span>
                            </div>
                            {isOverLimit && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <AlertTriangle className="h-5 w-5 text-destructive animate-pulse" />
                                        </TooltipTrigger>
                                        <TooltipContent>Orçamento estourado!</TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        <Progress
                            value={Math.min(percentage, 100)}
                            className={`h-2 ${isOverLimit ? 'bg-destructive/20' : ''}`}
                            indicatorClassName={isOverLimit ? 'bg-destructive' : isNearLimit ? 'bg-yellow-500' : 'bg-primary'}
                        />
                        <p className="text-xs text-muted-foreground text-right">
                            {percentage.toFixed(1)}% utilizado
                        </p>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
