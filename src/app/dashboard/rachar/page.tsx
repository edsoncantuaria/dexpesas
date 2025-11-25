'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Users, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { SplitGroup } from '@/lib/definitions';
import { CreateGroupModal } from '@/components/dashboard/rachar/create-group-modal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function RacharPage() {
    const [groups, setGroups] = useState<SplitGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    const fetchGroups = async () => {
        try {
            const response = await api.get('/rachar/groups');
            setGroups(response.data);
        } catch (error) {
            console.error('Erro ao buscar grupos:', error);
            toast({
                variant: 'destructive',
                title: 'Erro ao carregar grupos',
                description: 'Não foi possível carregar seus grupos de divisão.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchGroups();
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Rachar Conta</h1>
                    <p className="text-muted-foreground">
                        Gerencie despesas compartilhadas com amigos e família.
                    </p>
                </div>
                <Button onClick={() => setIsCreateModalOpen(true)} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Grupo
                </Button>
            </div>

            {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="animate-pulse">
                            <CardHeader className="h-24 bg-muted/50" />
                            <CardContent className="h-20 bg-muted/30" />
                        </Card>
                    ))}
                </div>
            ) : groups.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                        <Users className="h-10 w-10 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">Nenhum grupo encontrado</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                            Crie um grupo para começar a dividir despesas.
                        </p>
                        <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
                            Criar Primeiro Grupo
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                        <Card
                            key={group.id}
                            className="cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => router.push(`/dashboard/rachar/${group.id}`)}
                        >
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center justify-between">
                                    {group.name}
                                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                </CardTitle>
                                <CardDescription>
                                    {group.category || 'Geral'} • {format(new Date(group.updatedAt), "d 'de' MMM", { locale: ptBR })}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Users className="h-4 w-4" />
                                    <span>{group.members?.length || 0} membros</span>
                                    <span className="mx-1">•</span>
                                    <span>{group._count?.expenses || 0} despesas</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <CreateGroupModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
                onSuccess={() => {
                    fetchGroups();
                    setIsCreateModalOpen(false);
                }}
            />
        </div>
    );
}
