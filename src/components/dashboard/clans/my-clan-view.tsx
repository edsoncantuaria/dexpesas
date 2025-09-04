// src/components/dashboard/clans/my-clan-view.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MessagesSquare, Users, Shield, Trophy } from 'lucide-react';
import type { Clan, User, Boss, AuditLog } from '@/lib/definitions';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/contexts/UserContext';
import { ClanChat } from './clan-chat';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineCard } from '../progresso/timeline-card';
import { BossBattleCard } from '../boss/boss-battle-card';
import { ClanMissionsTab } from './clan-missions-tab';
import { ClanRankingTab } from './clan-ranking-tab';
import { ClanHeader } from './clan-header';

interface MyClanViewProps {
    clanId: string;
    onLeaveSuccess: () => void;
    onUpdate: () => void;
}

export function MyClanView({ clanId, onLeaveSuccess, onUpdate }: MyClanViewProps) {
    const { user } = useUser();
    const [clan, setClan] = useState<(Clan & { members: Partial<User>[], owner: any }) | null>(null);
    const [activeBoss, setActiveBoss] = useState<Boss | null>(null);
    const [timelineLogs, setTimelineLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const { toast } = useToast();

    const fetchClanData = useCallback(async () => {
        if (!clanId) return;
        try {
            const [clanRes, bossRes, timelineRes] = await Promise.all([
                api.get(`/clans/${clanId}`),
                api.get('/bosses/active'),
                api.get('/audit/timeline'),
            ]);
            setClan(clanRes.data);
            setActiveBoss(bossRes.data?.[0] || null);
            setTimelineLogs(timelineRes.data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar dados do clã.' });
        } finally {
            setIsLoading(false);
        }
    }, [clanId, toast]);

    useEffect(() => {
        setIsLoading(true);
        fetchClanData();
    }, [fetchClanData]);
    
    // Efeito para polling do chat
    useEffect(() => {
        let intervalId: NodeJS.Timeout | null = null;
        if (isChatOpen) {
            const poll = () => {
                // Apenas busca novos dados, não reseta o loading
                api.get(`/clans/${clanId}`).then(res => setClan(res.data)).catch(() => {});
            }
            intervalId = setInterval(poll, 5000); 
        }
        return () => {
          if (intervalId) {
            clearInterval(intervalId);
          }
        }
    }, [isChatOpen, clan?.id, clanId]);


    if (isLoading) {
        return (
             <Card>
                <CardHeader><CardTitle>Carregando QG do Clã...</CardTitle></CardHeader>
                <CardContent className="flex justify-center items-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        )
    }

    if (!clan) {
        return (
             <Card>
                <CardHeader><CardTitle>Clã não encontrado</CardTitle></CardHeader>
                <CardContent>
                    <p>Não foi possível carregar os dados do seu clã. Tente recarregar a página.</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
        <div className="relative space-y-6">
            <ClanHeader clan={clan} onLeaveSuccess={onLeaveSuccess} onUpdate={onUpdate} />
            
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
                 <ClanMissionsTab />
              </TabsContent>
              <TabsContent value="ranking" className="mt-4">
                 <ClanRankingTab />
              </TabsContent>
            </Tabs>
        </div>
        
        <Button 
            className="fixed bottom-24 right-4 md:bottom-8 md:right-8 h-16 w-16 rounded-full shadow-lg z-40"
            onClick={() => setIsChatOpen(true)}
            aria-label="Abrir chat do clã"
        >
            <MessagesSquare className="h-8 w-8" />
        </Button>
        
        <ClanChat 
            clan={clan}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
        />
        </>
    );
}
