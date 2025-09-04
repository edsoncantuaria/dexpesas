// src/components/dashboard/notifications/notification-item.tsx
'use client';

import { 
    AlertCircle, 
    Bell, 
    CalendarClock,
    CheckCircle2, 
    CreditCard, 
    DollarSign, 
    ShieldAlert, 
    Trophy, 
    type LucideIcon
} from 'lucide-react';
import type { Notification } from '@/lib/definitions';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const notificationIcons: Record<string, LucideIcon> = {
    TRANSACTION_CREATED: DollarSign,
    PAYMENT_DUE: AlertCircle,
    LIMIT_ALERT: CreditCard,
    ACHIEVEMENT_UNLOCKED: Trophy,
    BUDGET_ALERT: ShieldAlert,
    UPCOMING_PAYMENT: CalendarClock,
    DEFAULT: Bell,
};

const notificationColors: Record<string, string> = {
    TRANSACTION_CREATED: 'text-green-500',
    PAYMENT_DUE: 'text-destructive',
    LIMIT_ALERT: 'text-amber-500',
    BUDGET_ALERT: 'text-orange-500',
    ACHIEVEMENT_UNLOCKED: 'text-yellow-500',
    UPCOMING_PAYMENT: 'text-blue-500',
    DEFAULT: 'text-muted-foreground',
}

type NotificationItemProps = {
    notification: Notification;
    onAction: (notificationId: string, action: string) => void;
    onMarkAsRead: (notificationId: string) => void;
};

export function NotificationItem({ notification, onAction, onMarkAsRead }: NotificationItemProps) {
    const Icon = notificationIcons[notification.type] || notificationIcons.DEFAULT;
    const iconColor = notificationColors[notification.type] || notificationColors.DEFAULT;
    const timeAgo = formatDistanceToNow(new Date(notification.createdAt), {
        addSuffix: true,
        locale: ptBR
    });

    const handleItemClick = () => {
        if (!notification.read) {
            onMarkAsRead(notification.id);
        }
    };

    return (
        <div 
            className={cn(
                "p-3 rounded-lg transition-colors hover:bg-muted/50 cursor-pointer",
                !notification.read && 'bg-primary/5'
            )}
            onClick={handleItemClick}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleItemClick()}
            role="button"
            tabIndex={0}
        >
            <div className="flex items-start gap-3">
                <div className={cn("mt-1", iconColor)}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-start">
                        <p className="font-semibold text-sm">{notification.title}</p>
                        {!notification.read && <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 ml-2 mt-1.5" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>
                    {notification.actions && notification.actions.length > 0 && (
                        <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                            {notification.actions.map((action) => (
                                <Button
                                    key={action.action}
                                    size="sm"
                                    variant={action.variant || 'secondary'}
                                    onClick={() => onAction(notification.id, action.action)}
                                    className="h-8 transition-all"
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </div>
                    )}
                    <p className="text-xs text-muted-foreground pt-1">{timeAgo}</p>
                </div>
            </div>
        </div>
    )
}
