// src/components/dashboard/metas/delete-goal-dialog.tsx
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

type DeleteGoalDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  goalName: string;
};

export function DeleteGoalDialog({ isOpen, onClose, onConfirm, goalName }: DeleteGoalDialogProps) {

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir esta meta?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Isso excluirá permanentemente a meta{' '}
            <span className="font-semibold text-foreground">"{goalName}"</span> e todas as transações de contribuição associadas a ela.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={onConfirm}>
                Sim, excluir meta
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
