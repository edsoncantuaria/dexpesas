// src/components/dashboard/orcamentos/delete-budget-dialog.tsx
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

type DeleteBudgetDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  budgetCategory: string;
};

export function DeleteBudgetDialog({ isOpen, onClose, onConfirm, budgetCategory }: DeleteBudgetDialogProps) {

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir este orçamento?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Isso excluirá permanentemente o orçamento para a categoria{' '}
            <span className="font-semibold text-foreground">{budgetCategory}</span> apenas para este mês.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={onConfirm}>
                Sim, excluir orçamento
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
