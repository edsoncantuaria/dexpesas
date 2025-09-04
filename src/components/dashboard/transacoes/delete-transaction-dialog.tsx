// src/components/dashboard/transacoes/delete-transaction-dialog.tsx
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

type DeleteTransactionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transactionDescription: string;
};

export function DeleteTransactionDialog({ isOpen, onClose, onConfirm, transactionDescription }: DeleteTransactionDialogProps) {

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Isso excluirá permanentemente a transação de{' '}
            <span className="font-semibold text-foreground">"{transactionDescription}"</span>.
             Se for uma transação parcelada ou recorrente, todas as ocorrências futuras também serão removidas.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={onConfirm}>
                Eu entendo, deletar
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
