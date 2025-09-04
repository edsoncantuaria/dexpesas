// src/components/dashboard/notifications/notification-panel.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BellRing, Check, Loader2, Trash2 } from 'lucide-react';
import { NotificationItem } from './notification-item';
import type { Notification } from '@/lib/definitions';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ClearAllDialog } from './clear-all-dialog';
import { RemoveRecurrenceDialog } from './remove-recurrence-dialog';
import { AnimatePresence, motion } from 'framer-motion';


type NotificationPanelProps = {
    onClose: () => void;
};

export function NotificationPanel({ onClose }: NotificationPanelProps) {
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
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar notificações' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchNotifications();
        // Adiciona um listener para o evento de recebimento de notificação
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
            toast({ title: 'Ação executada com sucesso!'});
            // Refetch para atualizar a lista, pois outras notificações podem ser afetadas.
            fetchNotifications();
            // Dispara evento para outras partes da UI, como a lista de transações
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
        } catch(error: any) {
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
        } catch(error) {
            toast({ variant: 'destructive', title: 'Erro ao limpar notificações' });
        } finally {
            setIsClearing(false);
        }
    };
    
    const handleMarkAsRead = async (notificationId: string) => {
        const originalNotifications = [...notifications];
        // Optimistic update
        setNotifications(prev => prev.map(n => n.id === notificationId ? {...n, read: true} : n));
        try {
            await api.post('/notifications/read-one', { notificationId });
        } catch (error) {
            setNotifications(originalNotifications); // Revert on error
            toast({ variant: 'destructive', title: 'Erro ao marcar como lida' });
        }
    };

    const handleMarkAllAsRead = async () => {
        setIsMarking(true);
        try {
            await api.post('/notifications/read-all');
            // Optimistic update
            setNotifications(notifications.map(n => ({...n, read: true})));
        } catch(error) {
            toast({ variant: 'destructive', title: 'Erro ao marcar como lidas' });
        } finally {
            setIsMarking(false);
        }
    };
    
    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <>
            <div className="flex items-center justify-between p-4">
                <h3 className="font-semibold">Notificações ({unreadCount})</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setIsClearDialogOpen(true)}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>
            <Separator />

            <ScrollArea className="h-80">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8 h-full">
                        <BellRing className="h-10 w-10 mb-4" />
                        <p className="font-semibold">Tudo em dia!</p>
                        <p className="text-sm">Você não tem nenhuma notificação.</p>
                    </div>
                ) : (
                    <div className="p-2">
                         <AnimatePresence>
                            {notifications.map((notification, index) => (
                                <motion.div
                                    key={notification.id}
                                    layout
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                                    transition={{ duration: 0.3, delay: index * 0.05 }}
                                >
                                    <NotificationItem 
                                        notification={notification}
                                        onAction={handleAction}
                                        onMarkAsRead={handleMarkAsRead}
                                    />
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </ScrollArea>

            <Separator />
            <div className="p-2">
                <Button variant="outline" className="w-full" onClick={handleMarkAllAsRead} disabled={isMarking || unreadCount === 0}>
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
