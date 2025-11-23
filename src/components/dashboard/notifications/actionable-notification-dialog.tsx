// src/components/dashboard/notifications/actionable-notification-dialog.tsx
'use client';

import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import type { Notification } from '@/lib/definitions';

interface ActionableNotificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification;
  onAction: (notificationId: string, action: string) => void;
}

export function ActionableNotificationDialog({
  isOpen,
  onClose,
  notification,
  onAction
}: ActionableNotificationDialogProps) {

  if (!isOpen) return null;

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      setIsOpen={onClose}
      title={notification.title}
      description={notification.message}
    >
      <div className="space-y-4 py-4">
        <p className="text-sm text-muted-foreground">
          Escolha uma das ações abaixo para resolver esta pendência.
        </p>
        <div className="flex flex-col gap-2">
          {notification.actions?.map(action => (
            <Button
              key={action.action}
              variant={action.variant || 'secondary'}
              onClick={() => onAction(notification.id, action.action)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>
      <div className="flex justify-end pt-4">
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </ResponsiveDialog>
  );
}
