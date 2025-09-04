// src/components/dashboard/progresso/timeline-card.tsx
'use client';

import type { AuditLog } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookMarked, Shield, Sword, ArrowUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TimelineCardProps {
    logs: AuditLog[];
}

const actionTranslations: Record<string, { text: string; icon: React.ElementType }> = {
  ACCEPT_MISSION: { text: 'Você aceitou a missão', icon: BookMarked },
  COMPLETE_MISSION: { text: 'Você completou a missão', icon: Shield },
  BOSS_DAMAGE: { text: 'Você atacou o chefe e causou', icon: Sword },
  LEVEL_UP: { text: 'Você subiu para o nível', icon: ArrowUp },
};

const getLogMessage = (log: AuditLog): string => {
    const actionInfo = actionTranslations[log.action];
    if (!actionInfo) return log.action;

    const details = log.details as any; // Usar 'as any' para acesso dinâmico seguro

    if (log.action === 'BOSS_DAMAGE' && details?.damage) {
        return `${actionInfo.text} ${details.damage} de dano!`;
    }
    if (log.action === 'ACCEPT_MISSION' && details?.missionTitle) {
        return `${actionInfo.text}: "${details.missionTitle}"`;
    }
     if (log.action === 'COMPLETE_MISSION' && details?.missionTitle) {
        return `${actionInfo.text}: "${details.missionTitle}"`;
    }
     if (log.action === 'LEVEL_UP' && details?.newLevel) {
        return `${actionInfo.text} ${details.newLevel}!`;
    }
    
    return actionInfo.text;
}


export function TimelineCard({ logs }: TimelineCardProps) {
    return (
         <Card className="shadow-md transition-all group-hover:shadow-xl group-hover:border-primary/50 flex flex-col h-full">
            <CardHeader>
                <CardTitle className="font-headline text-xl">Mural da Guilda</CardTitle>
                <CardDescription>As últimas aventuras de seus companheiros.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                {logs.length > 0 ? (
                    <ScrollArea className="max-h-96 pr-4">
                        <ul className="space-y-4">
                            {logs.map((log) => {
                                const actionInfo = actionTranslations[log.action];
                                const Icon = actionInfo?.icon || BookMarked;
                                return (
                                    <li key={log.id} className="flex items-start gap-4">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted mt-1">
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{getLogMessage(log)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ptBR })}
                                            </p>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    </ScrollArea>
                ) : (
                     <div className="text-center text-muted-foreground py-8 h-full flex items-center justify-center">
                        <p>Nenhuma atividade recente na guilda.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}