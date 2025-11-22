// src/app/dashboard/admin/items/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Gem } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Item } from '@/lib/definitions';
import api from '@/lib/api';
import { handleApiError } from '@/lib/error-handler';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ItemsTable } from '@/components/dashboard/admin/items/items-table';
import { EditItemForm } from '@/components/dashboard/admin/items/edit-item-form';


export default function AdminItemsPage() {
    const [items, setItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Item | null>(null);
    const { toast } = useToast();

    const fetchItems = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/items');
            setItems(response.data);
        } catch (error) {
            handleApiError(error, toast, 'Erro ao buscar itens');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    const handleOpenDialog = (item?: Item) => {
        setEditingItem(item || null);
        setIsDialogOpen(true);
    }

    const handleCloseDialog = () => {
        setEditingItem(null);
        setIsDialogOpen(false);
    }

    const handleSave = async (data: Omit<Item, 'id'>) => {
        setIsSubmitting(true);
        const isEditing = !!editingItem;
        const method = isEditing ? 'patch' : 'post';
        const url = isEditing ? `/items/admin/${editingItem.id}` : '/items/admin';

        try {
            await api[method](url, data);
            toast({ title: `Item ${isEditing ? 'atualizado' : 'criado'} com sucesso!` });
            fetchItems();
            handleCloseDialog();
        } catch (error: any) {
            handleApiError(error, toast, `Erro ao ${isEditing ? 'atualizar' : 'criar'} item`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (itemId: string) => {
        try {
            await api.delete(`/items/admin/${itemId}`);
            toast({ title: 'Item excluído!', variant: 'destructive' });
            fetchItems();
        } catch (error: any) {
            handleApiError(error, toast, 'Erro ao excluir');
        }
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Gem className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Gerenciar Itens</h1>
                        <p className="text-muted-foreground">Crie e edite os itens que os jogadores podem ganhar.</p>
                    </div>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Item
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingItem ? 'Editar Item' : 'Novo Item'}</DialogTitle>
                            <DialogDescription>
                                Preencha os detalhes do item que será usado como recompensa.
                            </DialogDescription>
                        </DialogHeader>
                        <EditItemForm
                            item={editingItem}
                            isSubmitting={isSubmitting}
                            onSave={handleSave}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <ItemsTable
                data={items}
                onEdit={handleOpenDialog}
                onDelete={handleDelete}
            />
        </div>
    );
}
