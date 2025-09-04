// src/components/dashboard/clans/create-clan-dialog.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { PlusCircle, Pencil, Trash2 } from 'lucide-react';
import { CreateClanForm } from './create-clan-form';
import type { Clan } from '@/lib/definitions';

interface CreateClanDialogProps {
    onCreateSuccess: (clanId: string) => void;
    onDelete?: () => void;
    clanToEdit?: Clan | null;
}

export function CreateClanDialog({ onCreateSuccess, onDelete, clanToEdit }: CreateClanDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const isEditing = !!clanToEdit;

    const handleSuccess = (clanId: string) => {
        onCreateSuccess(clanId);
        setIsOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {isEditing ? (
                    <Button variant="outline" size="sm">
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
                ) : (
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Nova Família
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{isEditing ? `Editar Família: ${clanToEdit.name}` : 'Fundar uma Nova Família'}</DialogTitle>
                    <DialogDescription>
                         {isEditing ? 'Atualize as informações da sua família.' : 'Escolha um nome e uma descrição para sua nova família e comece a convidar membros.'}
                    </DialogDescription>
                </DialogHeader>
                <CreateClanForm 
                    clan={clanToEdit}
                    onSuccess={handleSuccess} 
                />
                 {isEditing && onDelete && (
                    <DialogFooter className="border-t pt-4 mt-4">
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="destructive">
                                   <Trash2 className="mr-2 h-4 w-4" /> Dissolver Família
                               </Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Dissolver a Família "{clanToEdit.name}"?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação é irreversível. A família será permanentemente excluída e todos os membros serão removidos.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={onDelete} asChild>
                                        <Button variant="destructive">Sim, Dissolver</Button>
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DialogFooter>
                 )}
            </DialogContent>
        </Dialog>
    );
}
