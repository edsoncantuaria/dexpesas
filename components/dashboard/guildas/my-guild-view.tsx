
// src/components/dashboard/guildas/my-guild-view.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Crown, LogOut, Trash2, Pencil, MessagesSquare } from 'lucide-react';
import type { Guild, User } from '@/lib/definitions';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useUser } from '@/contexts/UserContext';
import { GuildIcon } from './guild-icon';
import { CreateGuildDialog } from './create-guild-dialog';
import { MemberProfileDialog } from './member-profile-dialog';
import { MemberAvatar } from './member-avatar';
import { GuildChat } from './guild-chat'; // Novo componente de chat

interface MyGuildViewProps {
    guildId: string;
    onLeaveSuccess: () => void;
    onUpdate: () => void;
}

export function MyGuildView({ guildId, onLeaveSuccess, onUpdate }: MyGuildViewProps) {
    const { user } = useUser();
    const [guild, setGuild] = useState<(Guild & { members: Partial<User>[], owner: any }) | null>(null);
    const [isLoadingGuild, setIsLoadingGuild] = useState(true);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [viewingMember, setViewingMember] = useState<Partial<User> | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false); // Novo estado para o chat
    const { toast } = useToast();

    const fetchGuild = useCallback(async () => {
        if (!guildId) return;
        setIsLoadingGuild(true);
        try {
            const response = await api.get('/guilds/my-guild');
            setGuild(response.data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar dados da guilda.' });
        } finally {
            setIsLoadingGuild(false);
        }
    }, [guildId, toast]);

    useEffect(() => {
        fetchGuild();
    }, [fetchGuild]);


    const handleLeave = async () => {
        setIsLeaving(true);
        try {
            await api.post('/guilds/leave');
            toast({ title: 'Você saiu da guilda.', variant: 'destructive' });
            onLeaveSuccess();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao sair da guilda', description: error.response?.data?.message });
        } finally {
            setIsLeaving(false);
        }
    };
    
    const handleDelete = async () => {
        if (!guild) return;
        setIsDeleting(true);
        try {
            await api.delete(`/guilds/${guild.id}`);
            toast({ title: 'Guilda dissolvida!', description: 'A guilda foi excluída com sucesso.' });
            onLeaveSuccess();
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'Erro ao excluir guilda', description: error.response?.data?.message });
        } finally {
            setIsDeleting(false);
        }
    };
    
    if (isLoadingGuild) {
        return (
             <Card>
                <CardHeader><CardTitle>Carregando Guilda...</CardTitle></CardHeader>
                <CardContent className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    if (!guild) {
        return (
             <Card>
                <CardHeader><CardTitle>Guilda não encontrada</CardTitle></CardHeader>
                <CardContent>
                    <p>Não foi possível carregar os dados da sua guilda. Tente recarregar a página.</p>
                </CardContent>
            </Card>
        );
    }
    
    const isOwner = user?.id === guild.ownerId;

    return (
        <>
        <div className="relative">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <GuildIcon iconUrl={guild.iconUrl} guildName={guild.name} size="lg"/>
                             <div>
                                <CardTitle>{guild.name}</CardTitle>
                                <CardDescription>{guild.description}</CardDescription>
                             </div>
                        </div>
                        {isOwner && <CreateGuildDialog guildToEdit={guild} onCreateSuccess={onUpdate} />}
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <h4 className="font-semibold text-lg">Membros ({guild.members.length})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {guild.members.map(member => (
                            <div key={member.id} className="flex items-center gap-3 p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setViewingMember(member)}>
                                <MemberAvatar avatarUrl={member.avatarUrl} name={member.name || ''} className="h-10 w-10" />
                                <div>
                                    <p className="font-semibold text-sm">{member.name}</p>
                                    <p className="text-xs text-muted-foreground">Nível {member.level}</p>
                                </div>
                                {guild.ownerId === member.id && (
                                    <Crown className="h-4 w-4 text-yellow-500 ml-auto" />
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-end gap-2">
                    {isOwner ? (
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <Button variant="destructive" disabled={isDeleting}>
                                   <Trash2 className="mr-2 h-4 w-4" /> Dissolver Guilda
                               </Button>
                            </AlertDialogTrigger>
                             <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Dissolver a Guilda "{guild.name}"?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Esta ação é irreversível. A guilda será permanentemente excluída e todos os membros serão removidos.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} asChild>
                                        <Button variant="destructive" disabled={isDeleting}>
                                         {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            Sim, Dissolver
                                        </Button>
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    ) : (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" disabled={isLeaving}>
                                   <LogOut className="mr-2 h-4 w-4" /> Sair da Guilda
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Sair da Guilda "{guild.name}"?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Você tem certeza que deseja sair? Você perderá o progresso de guilda e poderá se juntar a outra.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleLeave} disabled={isLeaving} asChild>
                                        <Button variant="destructive">
                                            {isLeaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                            Sim, Sair
                                        </Button>
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </CardFooter>
            </Card>

            {/* Botão Flutuante do Chat */}
            <Button 
                className="fixed bottom-24 right-4 md:bottom-8 md:right-8 h-16 w-16 rounded-full shadow-lg z-40"
                onClick={() => setIsChatOpen(true)}
            >
                <MessagesSquare className="h-8 w-8" />
            </Button>
        </div>
        
        {viewingMember && (
            <MemberProfileDialog
                member={viewingMember}
                isOpen={!!viewingMember}
                onClose={() => setViewingMember(null)}
            />
        )}
        
        {/* Painel do Chat */}
        <GuildChat 
            guild={guild}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
        />
        </>
    );
}
