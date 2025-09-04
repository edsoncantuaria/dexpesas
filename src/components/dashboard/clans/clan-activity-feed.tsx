// src/components/dashboard/clans/clan-activity-feed.tsx
'use client';

import { useState } from 'react';
import type { AuditLog } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookMarked, ArrowUp, ArrowDown, DollarSign, Undo2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


interface ClanActivityFeedProps {
    logs: AuditLog[];
    clanId: string;
    onActivityUpdate: () => void;
}

const actionTranslations: Record<string, { text: string; icon: React.ElementType, isCredit?: boolean }> = {
  CLAN_CONTRIBUTION: { text: 'contribuiu para o caixa', icon: ArrowUp, isCredit: true },
  CLAN_EXPENSE: { text: 'registrou a despesa', icon: ArrowDown, isCredit: false },
  REVERSE_CLAN_EXPENSE: { text: 'reverteu a despesa', icon: Undo2, isCredit: true },
  CLAN_GOAL_CONTRIBUTION: { text: 'contribuiu para a meta', icon: ArrowUp, isCredit: true },
};

const getLogMessage = (log: AuditLog): { message: string, amount?: number, isCredit?: boolean } | null => {
    const actionInfo = actionTranslations[log.action];
    if (!actionInfo) return null;

    const details = log.details as any;
    let message = `${details.memberName || 'Membro'} ${actionInfo.text}`;
    if (details.expenseDescription) {
        message += `: "${details.expenseDescription}"`;
    }
     if (details.goalName) {
        message += `: "${details.goalName}"`;
    }

    return { message, amount: details.amount, isCredit: actionInfo.isCredit };
};


export function ClanActivityFeed({ logs, clanId, onActivityUpdate }: ClanActivityFeedProps) {
    const { user } = useUser();
    const { toast } = useToast();
    const [revertingLogId, setRevertingLogId] = useState<string | null>(null);

    const handleRevert = async (logId: string) => {
        setRevertingLogId(logId);
        try {
            await api.post(`/familia/${clanId}/expense/${logId}/reverse`);
            toast({ title: 'Despesa revertida com sucesso!' });
            onActivityUpdate();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao reverter', description: error.response?.data?.message });
        } finally {
            setRevertingLogId(null);
        }
    };
    
    const isAdmin = user?.clanMembership?.role === 'LEADER' || user?.clanMembership?.role === 'ADMIN';

    return (
         <Card className="shadow-md transition-all group-hover:shadow-xl group-hover:border-primary/50 flex flex-col flex-grow">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <BookMarked className="h-6 w-6 text-primary"/>
                    <div>
                        <CardTitle className="font-headline text-xl">Atividade da Família</CardTitle>
                        <CardDescription>As últimas movimentações financeiras do grupo.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                {logs.length > 0 ? (
                    <ScrollArea className="max-h-96 pr-4">
                        <ul className="space-y-4">
                            {logs.map((log) => {
                                const logData = getLogMessage(log);
                                if (!logData) return null;

                                const { message, amount, isCredit } = logData;
                                const Icon = actionTranslations[log.action]?.icon || DollarSign;
                                const details = log.details as any;
                                const canRevert = isAdmin && log.action === 'CLAN_EXPENSE' && !details.reversed;

                                return (
                                    <li key={log.id} className="flex items-start gap-4">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted mt-1">
                                            <Icon className={`h-4 w-4 ${isCredit ? 'text-green-500' : 'text-red-500'}`} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <p className="font-medium text-sm">{message}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ptBR })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {amount !== undefined && (
                                                <div className={`font-semibold text-sm ${isCredit ? 'text-green-500' : 'text-red-500'}`}>
                                                    {isCredit ? '+' : '-'} {Number(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </div>
                                            )}
                                            {canRevert && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6" disabled={revertingLogId === log.id}>
                                                            <Undo2 className="h-3 w-3 text-muted-foreground" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader><AlertDialogTitle>Reverter Despesa?</AlertDialogTitle><AlertDialogDescription>Esta ação irá estornar o valor de {Number(amount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} de volta para o caixa da família. Deseja continuar?</AlertDialogDescription></AlertDialogHeader>
                                                        <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleRevert(log.id)}>Sim, Reverter</AlertDialogAction></AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                             {revertingLogId === log.id && <Loader2 className="h-4 w-4 animate-spin"/>}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </ScrollArea>
                ) : (
                     <div className="text-center text-muted-foreground py-8 flex items-center justify-center">
                        <p>Nenhuma atividade financeira registrada ainda.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
