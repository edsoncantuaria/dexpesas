// src/components/dashboard/guildas/my-guild-view.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MessagesSquare, Users, Shield, Trophy } from 'lucide-react';
import type { Clan, User, Boss, AuditLog } from '@/lib/definitions';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { GuildChat } from './guild-chat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineCard } from '../progresso/timeline-card';
import { BossBattleCard } from '../boss/boss-battle-card';
import { GuildMissionsTab } from './guild-missions-tab';
import { GuildRankingTab } from './guild-ranking-tab';
import { ClanHeader } from '../clans/clan-header';

interface MyGuildViewProps {
    guildId: string;
    onLeaveSuccess: () => void;
    onUpdate: () => void;
}

export function MyGuildView({ guildId, onLeaveSuccess, onUpdate }: MyGuildViewProps) {
    const { user } = useUser();
    const [guild, setGuild] = useState<(Clan & { members: Partial<User>[], owner: any }) | null>(null);
    const [activeBoss, setActiveBoss] = useState<Boss | null>(null);
    const [timelineLogs, setTimelineLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const { toast } = useToast();

    const fetchGuildData = useCallback(async () => {
        if (!guildId) return;
        try {
            const [guildRes, bossRes, timelineRes] = await Promise.all([
                api.get('/guilds/my-guild'),
                api.get('/bosses'),
                api.get('/audit/timeline'),
            ]);
            setGuild(guildRes.data);
            setActiveBoss(bossRes.data?.[0] || null);
            setTimelineLogs(timelineRes.data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar dados da guilda.' });
        } finally {
            setIsLoading(false);
        }
    }, [guildId, toast]);

    useEffect(() => {
        setIsLoading(true);
        fetchGuildData();
    }, [fetchGuildData]);
    
    // Efeito para polling do chat
    useEffect(() => {
        let intervalId: NodeJS.Timeout;
        if (isChatOpen) {
            const poll = () => {
                // Apenas busca novos dados, não reseta o loading
                api.get('/guilds/my-guild').then(res => setGuild(res.data)).catch(() => {});
            }
            intervalId = setInterval(poll, 5000); 
        }
        return () => clearInterval(intervalId);
    }, [isChatOpen, guild?.id]);


    if (isLoading) {
        return (
             <Card>
                <CardHeader><CardTitle>Carregando QG da Guilda...</CardTitle></CardHeader>
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

    return (
        <>
        <div className="relative space-y-6">
            <ClanHeader clan={guild} onLeaveSuccess={onLeaveSuccess} onUpdate={onUpdate} />
            
            {activeBoss && <BossBattleCard boss={activeBoss} />}

            <Tabs defaultValue="mural" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="mural" className="gap-2"><Users className="h-4 w-4"/> Mural</TabsTrigger>
                <TabsTrigger value="missoes" className="gap-2"><Shield className="h-4 w-4"/>Missões</TabsTrigger>
                <TabsTrigger value="ranking" className="gap-2"><Trophy className="h-4 w-4"/>Ranking</TabsTrigger>
              </TabsList>
              <TabsContent value="mural" className="mt-4">
                 <TimelineCard logs={timelineLogs} />
              </TabsContent>
              <TabsContent value="missoes" className="mt-4">
                 <GuildMissionsTab />
              </TabsContent>
              <TabsContent value="ranking" className="mt-4">
                 <GuildRankingTab />
              </TabsContent>
            </Tabs>
        </div>
        
        <GuildChat 
            guild={guild}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
        />
        </>
    );
}
