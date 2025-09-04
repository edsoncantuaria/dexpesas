// src/components/dashboard/metas/rescue-goal-dialog.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import type { Goal, Account } from '@/lib/definitions';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RescueGoalDialogProps {
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onConfirm: (data: { destinationAccountId: string }) => void;
  goal: Goal;
  accounts: Account[];
}

export function RescueGoalDialog({ isOpen, isSaving, onClose, onConfirm, goal, accounts }: RescueGoalDialogProps) {
  const [destinationAccountId, setDestinationAccountId] = useState('');
  const { toast } = useToast();

  const handleConfirm = () => {
      if (!destinationAccountId) {
          toast({ variant: 'destructive', title: 'Selecione uma conta de destino.'});
          return;
      }
      onConfirm({ destinationAccountId });
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resgatar Valor da Meta?</AlertDialogTitle>
          <AlertDialogDescription>
            Você está prestes a resgatar{' '}
            <span className="font-semibold text-foreground">
              {Number(goal.currentAmount).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>{' '}
            da meta "{goal.name}". O saldo da meta será zerado e o valor será adicionado como uma receita na conta que você escolher. A meta não será excluída.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-2">
            <Label htmlFor="destination-account">Conta de Destino</Label>
            <Select onValueChange={setDestinationAccountId} value={destinationAccountId}>
                <SelectTrigger id="destination-account">
                    <SelectValue placeholder="Para onde o dinheiro deve ir?"/>
                </SelectTrigger>
                <SelectContent>
                    {accounts.map(acc => (
                        <SelectItem key={acc.id} value={acc.id}>
                            {acc.nome} ({Number(acc.saldo).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isSaving}>Cancelar</AlertDialogCancel>
          <Button
            variant="default"
            onClick={handleConfirm}
            disabled={!destinationAccountId || isSaving}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            Sim, resgatar valor
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
