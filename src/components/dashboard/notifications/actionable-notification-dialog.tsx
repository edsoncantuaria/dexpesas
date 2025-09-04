// src/components/dashboard/notifications/actionable-notification-dialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{notification.title}</DialogTitle>
          <DialogDescription>
            {notification.message}
            <br /><br />
            Escolha uma das ações abaixo para resolver esta pendência.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-col sm:space-x-0 gap-2">
            {notification.actions?.map(action => (
                <Button
                    key={action.action}
                    variant={action.variant || 'secondary'}
                    onClick={() => onAction(notification.id, action.action)}
                >
                    {action.label}
                </Button>
            ))}
             <Button variant="ghost" onClick={onClose}>
                Fechar
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
