// src/app/dashboard/admin/conquistas/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Shield, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Achievement } from '@/lib/definitions';
import api from '@/lib/api';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AchievementsTable } from '@/components/dashboard/admin/achievements/achievements-table';
import { EditAchievementForm } from '@/components/dashboard/admin/achievements/edit-achievement-form';

export default function AdminAchievementsPage() {
    const [achievements, setAchievements] = useState<Achievement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
    const { toast } = useToast();

    const fetchAchievements = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/achievements');
            setAchievements(response.data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar conquistas' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchAchievements();
    }, [fetchAchievements]);

    const handleOpenDialog = (achievement?: Achievement) => {
        setEditingAchievement(achievement || null);
        setIsDialogOpen(true);
    }
    
    const handleCloseDialog = () => {
        setEditingAchievement(null);
        setIsDialogOpen(false);
    }

    const handleSave = async (data: Omit<Achievement, 'id'>) => {
        setIsSubmitting(true);
        const isEditing = !!editingAchievement;
        const method = isEditing ? 'patch' : 'post';
        const url = isEditing ? `/achievements/${editingAchievement.id}` : '/achievements';

        try {
            await api[method](url, data);
            toast({ title: `Conquista ${isEditing ? 'atualizada' : 'criada'} com sucesso!` });
            fetchAchievements();
            handleCloseDialog();
        } catch (error) {
            toast({ variant: 'destructive', title: `Erro ao ${isEditing ? 'atualizar' : 'criar'} conquista` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (achievementId: string) => {
        try {
            await api.delete(`/achievements/${achievementId}`);
            toast({ title: 'Conquista excluída!', variant: 'destructive' });
            fetchAchievements();
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
                    <Shield className="h-8 w-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline">Gerenciar Conquistas</h1>
                        <p className="text-muted-foreground">Crie, edite e remova as conquistas do jogo.</p>
                    </div>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                         <Button onClick={() => handleOpenDialog()}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Nova Conquista
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingAchievement ? 'Editar Conquista' : 'Nova Conquista'}</DialogTitle>
                            <DialogDescription>
                                Preencha os detalhes para a nova conquista que os jogadores poderão desbloquear.
                            </DialogDescription>
                        </DialogHeader>
                        <EditAchievementForm 
                            achievement={editingAchievement}
                            isSubmitting={isSubmitting}
                            onSave={handleSave}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            <AchievementsTable
                data={achievements}
                onEdit={handleOpenDialog}
                onDelete={handleDelete}
            />
        </div>
    );
}
