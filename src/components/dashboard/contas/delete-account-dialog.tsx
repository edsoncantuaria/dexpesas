// src/components/dashboard/contas/delete-account-dialog.tsx
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

type DeleteAccountDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  accountName: string;
};

const CONFIRMATION_TEXT = 'deletar';

export function DeleteAccountDialog({ isOpen, onClose, onConfirm, accountName }: DeleteAccountDialogProps) {
  const [inputValue, setInputValue] = useState('');
  const isConfirmationMatch = inputValue === CONFIRMATION_TEXT;

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
          <AlertDialogDescription>
            Essa ação não pode ser desfeita. Isso excluirá permanentemente a conta{' '}
            <span className="font-semibold text-foreground">{accountName}</span> e todos os seus dados associados.
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
                Eu entendo, deletar a conta
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
