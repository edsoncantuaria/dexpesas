'use client';

import { AllAttributes } from '@/components/dashboard/progresso/all-attributes';
import type { GamificationProfile, User } from '@/lib/definitions';
import { ChevronLeft, BarChart3, Trophy } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { AchievementsList } from '@/components/dashboard/progresso/achievements-list';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGamificationMode } from '@/hooks/use-gamification-mode';
import { handleApiError } from '@/lib/error-handler';

export default function ProgressoPage() {
    const [profile, setProfile] = useState<(GamificationProfile & { updatedAt: string }) | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [allAchievements, setAllAchievements] = useState([]);
    const [unlockedAchievements, setUnlockedAchievements] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const { mode } = useGamificationMode();

    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const [profileRes, userRes, allAchievRes, unlockedAchievRes] = await Promise.all([
                api.get('/gamification/profile'),
                api.get('/user'),
                api.get('/achievements'),
                api.get('/achievements/unlocked')
            ]);
            setProfile(profileRes.data);
            setUser(userRes.data);
            setAllAchievements(allAchievRes.data);
            setUnlockedAchievements(unlockedAchievRes.data);
        } catch (error) {
            handleApiError(error, toast, "Erro ao buscar perfil de progresso");
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading || !profile || !user) {
        return <LoadingScreen />;
    }

    const isLite = mode === 'LITE';

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/dashboard" className="p-2 rounded-md hover:bg-muted transition-colors">
                    <ChevronLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold font-headline">
                        {isLite ? 'Seu Progresso' : 'Progresso do Herói'}
                    </h1>
                    <p className="text-muted-foreground">
                        {isLite
                            ? 'Acompanhe suas conquistas e evolua financeiramente'
                            : 'Domine seus atributos e desbloqueie conquistas através dos seus gastos'}
                    </p>
                </div>
            </div>

            {/* Tabbed Content */}
            <Tabs defaultValue="attributes" className="w-full">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                    <TabsTrigger value="attributes" className="text-xs sm:text-sm">
                        <BarChart3 className="h-4 w-4 mr-1.5" />
                        Atributos
                    </TabsTrigger>
                    <TabsTrigger value="achievements" className="text-xs sm:text-sm">
                        <Trophy className="h-4 w-4 mr-1.5" />
                        Conquistas
                    </TabsTrigger>
                </TabsList>

                {/* Attributes Tab */}
                <TabsContent value="attributes" className="space-y-6 mt-6">
                    <AllAttributes profile={profile} />
                </TabsContent>

                {/* Achievements Tab */}
                <TabsContent value="achievements" className="mt-6">
                    <AchievementsList
                        allAchievements={allAchievements}
                        unlockedAchievements={unlockedAchievements}
                    />
                </TabsContent>
            </Tabs>
        </div>
    );
}
