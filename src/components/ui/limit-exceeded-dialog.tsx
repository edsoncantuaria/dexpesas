// src/components/ui/limit-exceeded-dialog.tsx
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

type LimitExceededDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  limitAvailable: string;
  amountExceeded: string;
};

export function LimitExceededDialog({ 
    isOpen, 
    onClose,
    limitAvailable,
    amountExceeded
}: LimitExceededDialogProps) {
    const limitFormatted = parseFloat(limitAvailable).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const exceededFormatted = parseFloat(amountExceeded).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Limite do Cartão Excedido</AlertDialogTitle>
          <AlertDialogDescription>
            A transação não pode ser concluída. Você ultrapassou o limite do cartão em{' '}
            <span className="font-bold text-destructive">{exceededFormatted}</span>.
            <br />
            O limite disponível para compras é de <span className="font-bold text-primary">{limitFormatted}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction asChild>
            <Button onClick={onClose}>
                Entendi
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
