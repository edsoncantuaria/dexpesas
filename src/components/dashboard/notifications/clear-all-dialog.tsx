// src/components/dashboard/notifications/clear-all-dialog.tsx
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
import { Loader2 } from 'lucide-react';

type ClearAllDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isClearing: boolean;
};

export function ClearAllDialog({ isOpen, onClose, onConfirm, isClearing }: ClearAllDialogProps) {

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limpar todas as notificações?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. Todas as suas notificações serão removidas.
            <br/><br/>
            <span className="font-bold">Importante:</span> Notificações sobre pagamentos vencidos que forem limpas terão sua recorrência futura (se houver) cancelada para evitar novos alertas. A dívida atual permanecerá como "não paga".
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isClearing}>Cancelar</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={onConfirm} disabled={isClearing}>
                {isClearing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sim, limpar tudo
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
