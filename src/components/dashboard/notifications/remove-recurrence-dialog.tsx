// src/components/dashboard/notifications/remove-recurrence-dialog.tsx
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type RemoveRecurrenceDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactionDescription: string;
};

export function RemoveRecurrenceDialog({ 
    isOpen, 
    onClose, 
    onConfirm, 
    transactionDescription 
}: RemoveRecurrenceDialogProps) {

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remover Recorrência?</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem certeza que deseja remover permanentemente a recorrência para a despesa{' '}
            <span className="font-semibold text-foreground">"{transactionDescription}"</span>?
            <br/><br/>
            Esta ação não pode ser desfeita e irá excluir esta e todas as futuras ocorrências não pagas desta transação.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={onConfirm}>
                Sim, Remover Recorrência
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
