// src/components/dashboard/clans/create-clan-dialog.tsx
'use client';

import { useState } from 'react';

import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
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

        <ResponsiveDialog
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            trigger={
                isEditing ? (
                    <Button variant="outline" size="sm">
                        <Pencil className="mr-2 h-4 w-4" /> Editar
                    </Button>
                ) : (
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Criar Nova Família
                    </Button>
                )
            }
            title={isEditing ? `Editar Família: ${clanToEdit.name}` : 'Fundar uma Nova Família'}
            description={isEditing ? 'Atualize as informações da sua família.' : 'Escolha um nome e uma descrição para sua nova família e comece a convidar membros.'}
        >
            <CreateClanForm
                clan={clanToEdit}
                onSuccess={handleSuccess}
            />
            {isEditing && onDelete && (
                <div className="border-t pt-4 mt-4">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full sm:w-auto">
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
                </div>
            )}
        </ResponsiveDialog>
    );
}

