// src/components/dashboard/notifications/notification-panel.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BellRing, Check, Loader2, Trash2, Sparkles } from 'lucide-react';
import { NotificationItem } from './notification-item';
import type { Notification } from '@/lib/definitions';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ClearAllDialog } from './clear-all-dialog';
import { RemoveRecurrenceDialog } from './remove-recurrence-dialog';
import { AnimatePresence, motion } from 'framer-motion';


type NotificationPanelProps = {
    onClose: () => void;
    onCountChange?: (count: number) => void;
};

export function NotificationPanel({ onClose, onCountChange }: NotificationPanelProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isClearing, setIsClearing] = useState(false);
    const [isMarking, setIsMarking] = useState(false);
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [removingRecurrence, setRemovingRecurrence] = useState<Notification | null>(null);

    const { toast } = useToast();

    const fetchNotifications = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/notifications');
            setNotifications(response.data);
            const unreadCount = response.data.filter((n: Notification) => !n.read).length;
            onCountChange?.(unreadCount);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar notificações' });
        } finally {
            setIsLoading(false);
        }
    }, [toast, onCountChange]);

    useEffect(() => {
        fetchNotifications();
        window.addEventListener('notification-received', fetchNotifications);
        return () => {
            window.removeEventListener('notification-received', fetchNotifications);
        };
    }, [fetchNotifications]);

    const handleAction = async (notificationId: string, action: string) => {
        if (action === 'REMOVE_RECURRENCE') {
            const notificationToConfirm = notifications.find(n => n.id === notificationId);
            if (notificationToConfirm) {
                setRemovingRecurrence(notificationToConfirm);
            }
            return;
        }

        try {
            await api.post('/notifications/handle-action', { notificationId, action });
            toast({ title: 'Ação executada com sucesso!' });
            fetchNotifications();
            window.dispatchEvent(new Event('transaction-updated'));
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao executar ação',
                description: error.response?.data?.message || 'Tente novamente mais tarde.'
            });
        }
    };

    const handleConfirmRemoveRecurrence = async () => {
        if (!removingRecurrence) return;

        try {
            await api.post('/notifications/handle-action', { notificationId: removingRecurrence.id, action: 'REMOVE_RECURRENCE' });
            toast({ title: 'Recorrência removida com sucesso!', variant: 'destructive' });
            fetchNotifications();
            window.dispatchEvent(new Event('transaction-updated'));
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao remover recorrência',
                description: error.response?.data?.message || 'Tente novamente.'
            });
        } finally {
            setRemovingRecurrence(null);
        }
    };

    const handleClearAll = async () => {
        setIsClearing(true);
        try {
            await api.post('/notifications/clear-all');
            toast({ title: 'Notificações limpas!', description: 'Ações em lote foram aplicadas às pendências.' });
            fetchNotifications();
            setIsClearDialogOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao limpar notificações' });
        } finally {
            setIsClearing(false);
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        const originalNotifications = [...notifications];
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
        try {
            await api.post('/notifications/read-one', { notificationId });
            window.dispatchEvent(new Event('notification-read'));
        } catch (error) {
            setNotifications(originalNotifications);
            toast({ variant: 'destructive', title: 'Erro ao marcar como lida' });
        }
    };

    const handleMarkAllAsRead = async () => {
        setIsMarking(true);
        try {
            await api.post('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, read: true })));
            window.dispatchEvent(new Event('notification-read'));
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao marcar como lidas' });
        } finally {
            setIsMarking(false);
        }
    };

    const handleDismiss = async (notificationId: string) => {
        const originalNotifications = [...notifications];
        setNotifications(prev => prev.filter(n => n.id !== notificationId));

        try {
            // Tenta deletar, se não existir rota de delete, marca como lida como fallback
            try {
                await api.delete(`/notifications/${notificationId}`);
            } catch (e) {
                // Fallback para marcar como lida se delete não existir
                await api.post('/notifications/read-one', { notificationId });
            }

            toast({
                title: 'Notificação removida',
                className: "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20"
            });
            window.dispatchEvent(new Event('notification-read'));
        } catch (error) {
            setNotifications(originalNotifications);
            toast({ variant: 'destructive', title: 'Erro ao remover notificação' });
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">Notificações</h3>
                    {unreadCount > 0 && (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-xs font-bold text-primary-foreground shadow-sm">
                            {unreadCount}
                        </span>
                    )}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => setIsClearDialogOpen(true)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <Separator />

            <ScrollArea className="h-80">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 h-full space-y-4">
                        <div className="p-4 rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
                            <BellRing className="h-12 w-12 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-bold text-lg">Tudo em dia!</p>
                            <p className="text-sm text-muted-foreground">Você não tem nenhuma notificação.</p>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 space-y-2">
                        <AnimatePresence mode="popLayout">
                            {notifications.map((notification, index) => (
                                <motion.div
                                    key={notification.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: 100, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <NotificationItem
                                        notification={notification}
                                        onAction={handleAction}
                                        onMarkAsRead={handleMarkAsRead}
                                        onDismiss={handleDismiss}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </ScrollArea>

            <Separator />
            <div className="p-3">
                <Button
                    variant="outline"
                    className="w-full hover:bg-primary/10 transition-colors"
                    onClick={handleMarkAllAsRead}
                    disabled={isMarking || unreadCount === 0}
                >
                    {isMarking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Marcar todas como lidas
                </Button>
            </div>

            <ClearAllDialog
                isOpen={isClearDialogOpen}
                onClose={() => setIsClearDialogOpen(false)}
                onConfirm={handleClearAll}
                isClearing={isClearing}
            />

            {removingRecurrence && (
                <RemoveRecurrenceDialog
                    isOpen={!!removingRecurrence}
                    onClose={() => setRemovingRecurrence(null)}
                    onConfirm={handleConfirmRemoveRecurrence}
                    transactionDescription={removingRecurrence.message.split("'")[1] || ''}
                />
            )}
        </>
    );
}
