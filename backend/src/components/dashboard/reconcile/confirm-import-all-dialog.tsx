// src/components/dashboard/reconcile/confirm-import-all-dialog.tsx
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

interface ConfirmImportAllDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
}

export function ConfirmImportAllDialog({ isOpen, onClose, onConfirm, count }: ConfirmImportAllDialogProps) {

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Importar Todas as Transações?</AlertDialogTitle>
          <AlertDialogDescription>
            Você tem certeza que deseja criar <span className="font-bold text-foreground">{count}</span> novas transações em seus lançamentos com base no extrato?
            <br /><br />
            Esta ação é recomendada apenas quando você tem certeza que nenhuma dessas transações já foi registrada manualmente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button onClick={onConfirm}>Sim, importar todas</Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
