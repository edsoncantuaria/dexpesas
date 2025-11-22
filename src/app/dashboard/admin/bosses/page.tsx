// src/app/dashboard/admin/bosses/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Skull } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Boss } from '@/lib/definitions';
import api from '@/lib/api';
import { handleApiError } from '@/lib/error-handler';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { BossesTable } from '@/components/dashboard/admin/bosses/bosses-table';
import { EditBossForm } from '@/components/dashboard/admin/bosses/edit-boss-form';

export default function AdminBossesPage() {
    const [bosses, setBosses] = useState<Boss[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingBoss, setEditingBoss] = useState<Boss | null>(null);
    const { toast } = useToast();

    const fetchBosses = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/bosses/admin');
            setBosses(response.data);
        } catch (error) {
            handleApiError(error, toast, 'Erro ao buscar chefes');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchBosses();
    }, [fetchBosses]);

    const handleOpenDialog = (boss?: Boss) => {
        setEditingBoss(boss || null);
        setIsDialogOpen(true);
    }

    const handleCloseDialog = () => {
        setEditingBoss(null);
        setIsDialogOpen(false);
    }

    const handleSave = async (data: Omit<Boss, 'id'>) => {
        setIsSubmitting(true);
        const isEditing = !!editingBoss;
        const method = isEditing ? 'patch' : 'post';
        const url = isEditing ? `/bosses/admin/${editingBoss.id}` : '/bosses/admin';

        try {
            await api[method](url, data);
            toast({ title: `Chefe ${isEditing ? 'atualizado' : 'criado'} com sucesso!` });
            fetchBosses();
            handleCloseDialog();
        } catch (error: any) {
            handleApiError(error, toast, `Erro ao ${isEditing ? 'atualizar' : 'criar'} chefe`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (bossId: string) => {
        try {
            await api.delete(`/bosses/admin/${bossId}`);
            toast({ title: 'Chefe excluído!', variant: 'destructive' });
            fetchBosses();
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
                    <Skull className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Gerenciar Chefes</h1>
                        <p className="text-muted-foreground">Crie e ative as batalhas de chefe para os jogadores.</p>
                    </div>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Novo Chefe
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingBoss ? 'Editar Chefe' : 'Novo Chefe'}</DialogTitle>
                            <DialogDescription>
                                Defina o HP, recompensas e período de atividade do chefe.
                            </DialogDescription>
                        </DialogHeader>
                        <EditBossForm
                            boss={editingBoss}
                            isSubmitting={isSubmitting}
                            onSave={handleSave}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <BossesTable
                data={bosses}
                onEdit={handleOpenDialog}
                onDelete={handleDelete}
            />
        </div>
    );
}
