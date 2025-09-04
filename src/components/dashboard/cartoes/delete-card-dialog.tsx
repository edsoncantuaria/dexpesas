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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

type DeleteCardDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cardName: string;
};

const CONFIRMATION_TEXT = 'deletar';

export function DeleteCardDialog({ isOpen, onClose, onConfirm, cardName }: DeleteCardDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const isConfirmationMatch = inputValue === CONFIRMATION_TEXT;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Isso excluirá permanentemente o cartão{' '}
            <span className="font-semibold text-foreground">{cardName}</span> e todos os seus dados associados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-2">
            <Label htmlFor="delete-confirm">Para confirmar, digite "<span className="font-bold text-destructive">{CONFIRMATION_TEXT}</span>" abaixo:</Label>
            <Input 
                id="delete-confirm"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoComplete="off"
            />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            asChild
            disabled={!isConfirmationMatch}
          >
            <Button variant="destructive" onClick={onConfirm} disabled={!isConfirmationMatch}>
                Eu entendo, deletar o cartão
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
