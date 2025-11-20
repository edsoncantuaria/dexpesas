'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CellFund } from '@/lib/definitions';
import { parseAmount, toCurrency } from './utils';
import { PiggyBank, Plus, Minus, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface FundCardProps {
    fund: CellFund;
    isLeader: boolean;
    onDeposit: (fund: CellFund) => void;
    onWithdraw: (fund: CellFund) => void;
}

export function FundCard({ fund, isLeader, onDeposit, onWithdraw }: FundCardProps) {
    const current = parseAmount(fund.currentAmount);
    const target = parseAmount(fund.targetAmount);
    const percentage = target > 0 ? (current / target) * 100 : 0;
    const isCompleted = percentage >= 100;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Card className="overflow-hidden border-none shadow-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <div className="p-1.5 rounded-full bg-primary/10 text-primary">
                            <PiggyBank className="h-4 w-4" />
                        </div>
                        {fund.name}
                    </CardTitle>
                    {isCompleted && <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" /> Concluído</Badge>}
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold">{toCurrency(current)}</span>
                            <span className="text-xs text-muted-foreground">meta de {toCurrency(target)}</span>
                        </div>

                        <Progress value={Math.min(percentage, 100)} className="h-2" indicatorClassName="bg-green-500" />

                        <div className="flex items-center gap-2 pt-2">
                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onDeposit(fund)}>
                                <Plus className="h-3 w-3 mr-1" /> Aportar
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 h-8 text-xs" onClick={() => onWithdraw(fund)}>
                                <Minus className="h-3 w-3 mr-1" /> Resgatar
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
