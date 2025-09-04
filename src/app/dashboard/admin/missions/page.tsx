// src/app/dashboard/admin/missions/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Mission, Item } from '@/lib/definitions';
import api from '@/lib/api';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { MissionsTable } from '@/components/dashboard/admin/missions/missions-table';
import { EditMissionForm } from '@/components/dashboard/admin/missions/edit-mission-form';

export default function AdminMissionsPage() {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [items, setItems] = useState<Item[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingMission, setEditingMission] = useState<Mission | null>(null);
    const { toast } = useToast();

    const fetchMissions = useCallback(async () => {
        setIsLoading(true);
        try {
            // No futuro, teremos uma rota para buscar missões de admin, por agora, a pública serve.
            const [missionsRes, itemsRes] = await Promise.all([
                api.get('/missions/available'), // Reutilizando endpoint existente por enquanto
                api.get('/items') 
            ]);
            setMissions(missionsRes.data);
            setItems(itemsRes.data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar dados' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchMissions();
    }, [fetchMissions]);

    const handleOpenDialog = (mission?: Mission) => {
        setEditingMission(mission || null);
        setIsDialogOpen(true);
    }
    
    const handleCloseDialog = () => {
        setEditingMission(null);
        setIsDialogOpen(false);
    }

    const handleSave = async (data: Omit<Mission, 'id'>) => {
        setIsSubmitting(true);
        const isEditing = !!editingMission;
        const method = isEditing ? 'patch' : 'post';
        const url = isEditing ? `/missions/admin/${editingMission.id}` : '/missions/admin';

        try {
            await api[method](url, data);
            toast({ title: `Missão ${isEditing ? 'atualizada' : 'criada'} com sucesso!` });
            fetchMissions();
            handleCloseDialog();
        } catch (error: any) {
            toast({ variant: 'destructive', title: `Erro ao ${isEditing ? 'atualizar' : 'criar'} missão`, description: error.response?.data?.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (missionId: string) => {
        try {
            await api.delete(`/missions/admin/${missionId}`);
            toast({ title: 'Missão excluída!', variant: 'destructive' });
            fetchMissions();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao excluir', description: error.response?.data?.message });
        }
    };

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Target className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Gerenciar Missões</h1>
                        <p className="text-muted-foreground">Crie e edite os desafios para os jogadores.</p>
                    </div>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                         <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nova Missão
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editingMission ? 'Editar Missão' : 'Nova Missão'}</DialogTitle>
                            <DialogDescription>
                                Preencha os detalhes e a condição para completar a missão.
                            </DialogDescription>
                        </DialogHeader>
                        <EditMissionForm 
                            mission={editingMission}
                            items={items}
                            isSubmitting={isSubmitting}
                            onSave={handleSave}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <MissionsTable
                data={missions}
                onEdit={handleOpenDialog}
                onDelete={handleDelete}
            />
        </div>
    );
}
