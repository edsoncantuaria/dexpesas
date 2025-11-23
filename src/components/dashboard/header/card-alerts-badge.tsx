// src/components/dashboard/header/card-alerts-badge.tsx
'use client';

import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import api from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CardAlert {
    id: string;
    type: 'DUE_DATE' | 'LIMIT_WARNING';
    severity: 'INFO' | 'WARNING' | 'CRITICAL';
    title: string;
    message: string;
    triggeredAt: string;
    read: boolean;
    dismissed: boolean;
    card: {
        id: string;
        nome: string;
        bandeira: string;
    };
}

export function CardAlertsBadge() {
    const [alerts, setAlerts] = useState<CardAlert[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        fetchAlerts();
        // Poll a cada 5 minutos
        const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchAlerts = async () => {
        try {
            const response = await api.get('/card-alerts', {
                params: { dismissed: false }
            });
            const alertsData = response.data;
            setAlerts(alertsData);
            setUnreadCount(alertsData.filter((a: CardAlert) => !a.read).length);
        } catch (error) {
            console.error('Erro ao buscar alertas:', error);
        }
    };

    const markAsRead = async (alertId: string) => {
        try {
            await api.patch(`/card-alerts/${alertId}/read`);
            setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, read: true } : a));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Erro ao marcar como lido:', error);
        }
    };

    const dismissAlert = async (alertId: string) => {
        try {
            await api.delete(`/card-alerts/${alertId}`);
            setAlerts(prev => prev.filter(a => a.id !== alertId));
            const alert = alerts.find(a => a.id === alertId);
            if (alert && !alert.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Erro ao descartar alerta:', error);
        }
    };

    const getSeverityIcon = (severity: string) => {
        switch (severity) {
            case 'CRITICAL':
                return <AlertCircle className="h-5 w-5 text-red-500" />;
            case 'WARNING':
                return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
            case 'INFO':
            default:
                return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    const getSeverityBg = (severity: string, read: boolean) => {
        const opacity = read ? '50' : '100';
        switch (severity) {
            case 'CRITICAL':
                return `bg-red-${opacity} dark:bg-red-900/${opacity}`;
            case 'WARNING':
                return `bg-yellow-${opacity} dark:bg-yellow-900/${opacity}`;
            case 'INFO':
            default:
                return `bg-blue-${opacity} dark:bg-blue-900/${opacity}`;
        }
    };

    if (unreadCount === 0 && alerts.length === 0) {
        return null; // Não exibe se não há alertas
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                    <SheetTitle>Alertas de Cartões</SheetTitle>
                    <SheetDescription>
                        {alerts.length} alerta(s) {unreadCount > 0 && `· ${unreadCount} não lido(s)`}
                    </SheetDescription>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                    <div className="space-y-3 pr-4">
                        {alerts.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                <p>Nenhum alerta no momento</p>
                            </div>
                        ) : (
                            alerts.map(alert => (
                                <div
                                    key={alert.id}
                                    className={cn(
                                        "p-4 rounded-lg border shadow-sm transition-all",
                                        alert.read ? 'opacity-60 bg-muted/30' : 'bg-card',
                                        !alert.read && 'border-primary/50'
                                    )}
                                    onClick={() => !alert.read && markAsRead(alert.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5">
                                            {getSeverityIcon(alert.severity)}
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-sm">{alert.title}</p>
                                                {!alert.read && (
                                                    <div className="h-2 w-2 bg-primary rounded-full" />
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{alert.message}</p>
                                            <div className="flex items-center justify-between pt-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {alert.card.nome} · {formatDistanceToNow(new Date(alert.triggeredAt), {
                                                        addSuffix: true,
                                                        locale: ptBR
                                                    })}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        dismissAlert(alert.id);
                                                    }}
                                                >
                                                    Descartar
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
