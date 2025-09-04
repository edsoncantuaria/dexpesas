// src/components/dashboard/clans/clan-invites-list.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { ClanInvite, Clan } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Loader2, Mail, X } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { ClanIcon } from './clan-icon';
import { AnimatePresence, motion } from 'framer-motion';

interface ClanInvitesListProps {
    onActionSuccess: () => void;
}

type InviteWithClan = ClanInvite & { clan: Clan };

export function ClanInvitesList({ onActionSuccess }: ClanInvitesListProps) {
    const [invites, setInvites] = useState<InviteWithClan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchInvites = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/clans/invites/pending');
            setInvites(response.data);
        } catch (error) {
            // Silencioso, pois nem todo usuário terá convites
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInvites();
    }, [fetchInvites]);

    const handleAction = async (inviteId: string, action: 'accept' | 'decline') => {
        setProcessingId(inviteId);
        try {
            await api.post(`/clans/invites/${inviteId}/${action}`);
            toast({ title: `Convite ${action === 'accept' ? 'aceito' : 'recusado'}!` });
            onActionSuccess();
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Erro ao processar convite', description: error.response?.data?.message });
        } finally {
            setProcessingId(null);
        }
    };
    
    if (isLoading) {
        return (
             <div className="flex justify-center items-center h-24">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
            </div>
        )
    }

    if (invites.length === 0) {
        return null; // Não renderiza nada se não houver convites
    }

    return (
        <Card className="border-primary/50 bg-primary/5">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Mail className="h-6 w-6 text-primary" />
                    <div>
                        <CardTitle>Você tem convites!</CardTitle>
                        <CardDescription>Outros aventureiros querem você no clã deles.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                 <AnimatePresence>
                    {invites.map(invite => (
                        <motion.div
                            key={invite.id}
                            layout
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                        >
                            <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                                <div className="flex items-center gap-3">
                                    <ClanIcon iconUrl={invite.clan.iconUrl} clanName={invite.clan.name} size="md"/>
                                    <div>
                                        <p className="font-semibold">{invite.clan.name}</p>
                                        <p className="text-xs text-muted-foreground">Nível {invite.clan.level}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-8 w-8 bg-background"
                                        onClick={() => handleAction(invite.id, 'decline')}
                                        disabled={!!processingId}
                                    >
                                        {processingId === invite.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <X className="h-4 w-4"/>}
                                     </Button>
                                     <Button
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => handleAction(invite.id, 'accept')}
                                        disabled={!!processingId}
                                    >
                                        {processingId === invite.id ? <Loader2 className="h-4 w-4 animate-spin"/> : <Check className="h-4 w-4"/>}
                                     </Button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </CardContent>
        </Card>
    );
}
