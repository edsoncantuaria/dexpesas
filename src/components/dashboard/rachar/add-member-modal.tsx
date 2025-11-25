'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AddMemberModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    groupId: string;
    onSuccess: () => void;
}

export function AddMemberModal({ open, onOpenChange, groupId, onSuccess }: AddMemberModalProps) {
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.post(`/rachar/groups/${groupId}/members`, {
                name
            });

            toast({
                title: 'Membro adicionado!',
            });

            setName('');
            onSuccess();
        } catch (error) {
            console.error('Erro ao adicionar membro:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao adicionar membro',
                description: 'Tente novamente mais tarde.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <ResponsiveDialog
            isOpen={open}
            setIsOpen={onOpenChange}
            title="Adicionar Membro"
            description="Adicione alguém ao grupo para dividir despesas."
        >
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome da pessoa"
                            required
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Adicionando...' : 'Adicionar'}
                    </Button>
                </DialogFooter>
            </form>
        </ResponsiveDialog>
    );
}
