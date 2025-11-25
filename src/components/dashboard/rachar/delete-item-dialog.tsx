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

type DeleteSplitItemDialogProps = {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    itemDescription: string;
    isExpense: boolean;
};

export function DeleteSplitItemDialog({ isOpen, onClose, onConfirm, itemDescription, isExpense }: DeleteSplitItemDialogProps) {

    return (
        <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Essa ação não pode ser desfeita. Isso excluirá permanentemente {isExpense ? 'a despesa' : 'o pagamento'} de{' '}
                        <span className="font-semibold text-foreground">"{itemDescription}"</span>.
                        Os saldos do grupo serão recalculados automaticamente.
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
