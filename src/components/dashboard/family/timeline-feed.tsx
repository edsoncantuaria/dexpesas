'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CellTimelineEvent } from '@/lib/definitions';
import { Clock, Activity } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

export function TimelineFeed({ events }: { events: CellTimelineEvent[] }) {
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
        <Card className="border-none shadow-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" />
                        Timeline da Família
                    </CardTitle>
                    <CardDescription>Registro de atividades recentes.</CardDescription>
                </div>
                <Select value={filter} onValueChange={(value) => setFilter(value)}>
                    <SelectTrigger className="h-8 w-32 text-xs bg-white/50 dark:bg-black/20 border-none">
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
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                        <Clock className="h-8 w-8 mb-2 opacity-20" />
                        <p className="text-sm">Nenhum evento recente.</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[300px] pr-4">
                        <div className="space-y-4">
                            {filtered.map((event, index) => (
                                <div key={event.id} className="relative pl-4 border-l-2 border-muted pb-4 last:pb-0">
                                    <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium leading-none">{event.title || event.type}</p>
                                            <span className="text-[10px] text-muted-foreground tabular-nums">
                                                {formatTimestamp(event.createdAt)}
                                            </span>
                                        </div>
                                        {event.description && (
                                            <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-md mt-1">
                                                {event.description}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
