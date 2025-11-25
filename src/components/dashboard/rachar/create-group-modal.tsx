'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CreateGroupModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateGroupModal({ open, onOpenChange, onSuccess }: CreateGroupModalProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('OTHER');
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            await api.post('/rachar/groups', {
                name,
                category,
                description: ''
            });

            toast({
                title: 'Grupo criado!',
                description: 'Agora você pode adicionar membros e despesas.',
            });

            setName('');
            setCategory('OTHER');
            onSuccess();
        } catch (error) {
            console.error('Erro ao criar grupo:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao criar grupo',
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
            title="Novo Grupo de Divisão"
            description="Crie um grupo para viagens, casa ou eventos."
        >
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nome do Grupo</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Viagem Carnaval, Casa de Praia..."
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="category">Categoria</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione uma categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TRIP">Viagem</SelectItem>
                                <SelectItem value="HOUSE">Casa</SelectItem>
                                <SelectItem value="COUPLE">Casal</SelectItem>
                                <SelectItem value="OTHER">Outro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? 'Criando...' : 'Criar Grupo'}
                    </Button>
                </DialogFooter>
            </form>
        </ResponsiveDialog>
    );
}
