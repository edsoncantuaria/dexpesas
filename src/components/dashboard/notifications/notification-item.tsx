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
import { motion } from 'framer-motion';

const notificationIcons: Record<string, LucideIcon> = {
    TRANSACTION_CREATED: DollarSign,
    PAYMENT_DUE: AlertCircle,
    LIMIT_ALERT: CreditCard,
    ACHIEVEMENT_UNLOCKED: Trophy,
    BUDGET_ALERT: ShieldAlert,
    UPCOMING_PAYMENT: CalendarClock,
    DEFAULT: Bell,
};

const notificationGradients: Record<string, string> = {
    TRANSACTION_CREATED: 'from-emerald-500/20 to-green-500/20',
    PAYMENT_DUE: 'from-red-500/20 to-destructive/20',
    LIMIT_ALERT: 'from-amber-500/20 to-yellow-500/20',
    BUDGET_ALERT: 'from-orange-500/20 to-amber-500/20',
    ACHIEVEMENT_UNLOCKED: 'from-yellow-500/20 to-amber-500/20',
    UPCOMING_PAYMENT: 'from-blue-500/20 to-cyan-500/20',
    DEFAULT: 'from-muted/20 to-muted/10',
}

const notificationIconColors: Record<string, string> = {
    TRANSACTION_CREATED: 'text-emerald-600 dark:text-emerald-400',
    PAYMENT_DUE: 'text-red-600 dark:text-red-400',
    LIMIT_ALERT: 'text-amber-600 dark:text-amber-400',
    BUDGET_ALERT: 'text-orange-600 dark:text-orange-400',
    ACHIEVEMENT_UNLOCKED: 'text-yellow-600 dark:text-yellow-400',
    UPCOMING_PAYMENT: 'text-blue-600 dark:text-blue-400',
    DEFAULT: 'text-muted-foreground',
}

type NotificationItemProps = {
    notification: Notification;
    onAction: (notificationId: string, action: string) => void;
    onMarkAsRead: (notificationId: string) => void;
    onDismiss?: (notificationId: string) => void;
};

export function NotificationItem({ notification, onAction, onMarkAsRead, onDismiss }: NotificationItemProps) {
    const Icon = notificationIcons[notification.type] || notificationIcons.DEFAULT;
    const iconGradient = notificationGradients[notification.type] || notificationGradients.DEFAULT;
    const iconColor = notificationIconColors[notification.type] || notificationIconColors.DEFAULT;
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
        <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
                if (info.offset.x > 100 && onDismiss) {
                    onDismiss(notification.id);
                }
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ cursor: "grabbing" }}
            className="relative touch-pan-y"
        >
            <motion.div
                className={cn(
                    "p-4 rounded-xl transition-all cursor-pointer border relative z-10 bg-background",
                    "bg-gradient-to-br from-card/50 to-card/30 backdrop-blur-sm",
                    !notification.read
                        ? 'border-primary/30 shadow-md shadow-primary/10'
                        : 'border-border/50 opacity-75 hover:opacity-100'
                )}
                onClick={handleItemClick}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleItemClick()}
                role="button"
                tabIndex={0}
            >
                <div className="flex items-start gap-3">
                    <div className={cn(
                        "p-2.5 rounded-xl bg-gradient-to-br shrink-0",
                        iconGradient
                    )}>
                        <Icon className={cn("h-5 w-5", iconColor)} />
                    </div>
                    <div className="flex-1 space-y-2 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                            <p className="font-semibold text-sm leading-tight">{notification.title}</p>
                            {!notification.read && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="h-2 w-2 rounded-full bg-gradient-to-br from-primary to-primary/80 flex-shrink-0 mt-1.5 shadow-sm shadow-primary/50"
                                />
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{notification.message}</p>
                        {notification.actions && notification.actions.length > 0 && (
                            <div className="flex items-center gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                                {notification.actions.map((action) => (
                                    <Button
                                        key={action.action}
                                        size="sm"
                                        variant={action.variant || 'secondary'}
                                        onClick={() => onAction(notification.id, action.action)}
                                        className="h-8 text-xs transition-all hover:scale-105"
                                    >
                                        {action.label}
                                    </Button>
                                ))}
                            </div>
                        )}
                        <p className="text-xs text-muted-foreground/70 pt-1">{timeAgo}</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}
