// src/app/dashboard/conquistas/page.tsx
'use client';

import { AchievementsList } from "@/components/dashboard/progresso/achievements-list";
import type { Achievement, UnlockedAchievement } from "@/lib/definitions";
import { ChevronLeft, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from "@/hooks/use-toast";
import { LoadingScreen } from "@/components/ui/loading-screen";

import { handleApiError } from "@/lib/error-handler";

export default function ConquistasPage() {
    const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
    const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [allRes, unlockedRes] = await Promise.all([
                api.get('/achievements'),
                api.get('/achievements/unlocked')
            ]);
            setAllAchievements(allRes.data);
            setUnlockedAchievements(unlockedRes.data);
        } catch (error) {
            handleApiError(error, toast, 'Erro ao buscar conquistas');
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleHighlightToggle = async (achievementId: string, isHighlighted: boolean) => {
        // Optimistic update
        const originalUnlocked = [...unlockedAchievements];
        setUnlockedAchievements(prev => prev.map(ua =>
            ua.achievementId === achievementId
                ? { ...ua, destacada: !isHighlighted }
                : ua
        ));

        try {
            await api.patch(`/user/achievements/${achievementId}`, { destacada: !isHighlighted });
            toast({
                title: 'Conquista atualizada!',
                description: `A conquista foi ${!isHighlighted ? 'destacada' : 'removida dos destaques'}.`
            });
            // Opcional: refetch para garantir consistência, embora o update otimista já ajude.
            // fetchData();
        } catch (error) {
            // Revert on error
            setUnlockedAchievements(originalUnlocked);
            handleApiError(error, toast, 'Erro ao atualizar conquista');
        }
    };


    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="p-2 rounded-md hover:bg-muted">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <Trophy className="h-8 w-8 text-yellow-500" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Gerenciar Conquistas</h1>
                    <p className="text-muted-foreground">Veja todas as suas conquistas e escolha quais destacar no seu perfil.</p>
                </div>
            </div>

            <AchievementsList
                allAchievements={allAchievements}
                unlockedAchievements={unlockedAchievements}
                onTogglePin={handleHighlightToggle}
                ignoreGamificationMode={true}
            />
        </div>
    );
}

