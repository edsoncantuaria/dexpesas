// src/components/dashboard/progresso/financial-quests.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, Target, Loader2, Plus } from "lucide-react";
import type { Mission, UserMission, User } from "@/lib/definitions";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";

interface QuestProps {
    user: User;
}

export function FinancialQuests({ user }: QuestProps) {
    const [availableMissions, setAvailableMissions] = useState<Mission[]>([]);
    const [myMissions, setMyMissions] = useState<UserMission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [availableRes, myRes] = await Promise.all([
                api.get('/missions/available'),
                api.get('/missions/my-missions')
            ]);
            setAvailableMissions(availableRes.data);
            setMyMissions(myRes.data);
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao buscar missões" });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleAcceptMission = async (missionId: string) => {
        try {
            await api.post('/missions/accept', { missionId });
            toast({ title: "Missão Aceita!", description: "Seu progresso será acompanhado." });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Erro ao aceitar missão" });
        }
    };

    const completedMissions = myMissions.filter(m => m.completedAt);
    const inProgressMissions = myMissions.filter(m => !m.completedAt);

    return (
        <Card className="shadow-md h-full">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Target className="h-6 w-6 text-accent" />
                    <div>
                        <CardTitle className="font-headline text-xl">Missões Financeiras</CardTitle>
                        <CardDescription>Complete para ganhar XP extra.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
               {isLoading ? <div className="flex justify-center"><Loader2 className="h-6 w-6 animate-spin"/></div> : (
                   <div className="space-y-6">
                       {/* Missões em Andamento */}
                       {inProgressMissions.length > 0 && (
                           <div className="space-y-3">
                               <h4 className="font-semibold text-sm">Em Andamento</h4>
                               <ul className="space-y-4">
                                   {inProgressMissions.map(userMission => (
                                       <li key={userMission.id} className="flex items-center gap-4">
                                            <Circle className="h-6 w-6 text-blue-500" />
                                            <div className="flex-1">
                                               <p className="font-semibold">{userMission.mission.title}</p>
                                               <p className="text-sm text-muted-foreground">{userMission.mission.description}</p>
                                            </div>
                                            <div className="text-right"><p className="font-bold text-accent">+{userMission.mission.xpReward} XP</p></div>
                                       </li>
                                   ))}
                               </ul>
                           </div>
                       )}

                       {/* Missões Disponíveis */}
                       {availableMissions.length > 0 && (
                           <div className="space-y-3">
                               <h4 className="font-semibold text-sm">Disponíveis</h4>
                               <ul className="space-y-4">
                                   {availableMissions.map(mission => (
                                       <li key={mission.id} className="flex items-center gap-4">
                                            <div className="flex-1">
                                               <p className="font-semibold">{mission.title}</p>
                                               <p className="text-sm text-muted-foreground">{mission.description}</p>
                                            </div>
                                            <Button size="sm" onClick={() => handleAcceptMission(mission.id)}>
                                                <Plus className="h-4 w-4 mr-1"/> Aceitar
                                            </Button>
                                       </li>
                                   ))}
                               </ul>
                           </div>
                       )}

                        {/* Missões Completas */}
                       {completedMissions.length > 0 && (
                           <div className="space-y-3">
                               <h4 className="font-semibold text-sm">Concluídas</h4>
                               <ul className="space-y-4">
                                   {completedMissions.map(userMission => (
                                       <li key={userMission.id} className="flex items-center gap-4 opacity-60">
                                            <CheckCircle2 className="h-6 w-6 text-green-500" />
                                            <div className="flex-1">
                                               <p className="font-semibold line-through">{userMission.mission.title}</p>
                                            </div>
                                            <div className="text-right"><p className="font-bold text-accent">+{userMission.mission.xpReward} XP</p></div>
                                       </li>
                                   ))}
                               </ul>
                           </div>
                       )}

                       {availableMissions.length === 0 && inProgressMissions.length === 0 && (
                           <p className="text-center text-sm text-muted-foreground py-4">Nenhuma nova missão disponível no momento. Volte mais tarde!</p>
                       )}
                   </div>
               )}
            </CardContent>
        </Card>
    )
}
