// src/components/dashboard/achievements.tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Achievement, UnlockedAchievement } from "@/lib/definitions";
import { ArrowRight, Trophy, PiggyBank, LayoutDashboard, BarChart, Landmark, ShieldCheck, Star } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from 'lucide-react';

type AchievementsProps = {
    unlockedAchievements: UnlockedAchievement[];
    allAchievements: Achievement[];
}

const iconMap: Record<string, LucideIcon> = {
    PiggyBank,
    LayoutDashboard,
    BarChart,
    Landmark,
    ShieldCheck,
    Star
};

export function Achievements({ unlockedAchievements, allAchievements }: AchievementsProps) {

    const allAchievementsMap = new Map(allAchievements.map(a => [a.id, a]));
    
    const highlightedAchievements = unlockedAchievements
        .filter(ua => ua.destacada)
        .map(ua => allAchievementsMap.get(ua.achievementId))
        .filter(Boolean);

    return (
        <Link href="/dashboard/conquistas" className="block group">
            <Card className="shadow-md h-full transition-all group-hover:shadow-xl group-hover:border-primary/50">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Trophy className="h-6 w-6 text-yellow-500" />
                            <div>
                                <CardTitle className="font-headline text-xl">Conquistas</CardTitle>
                                <CardDescription>Suas medalhas na jornada.</CardDescription>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                    </div>
                </CardHeader>
                <CardContent>
                {highlightedAchievements.length > 0 ? (
                    <ul className="space-y-4">
                        {highlightedAchievements.map((ach, index) => {
                            if (!ach) return null;
                            const Icon = iconMap[ach.icon];
                            return (
                                <li key={ach.id}>
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-yellow-500/10 rounded-full mt-1">
                                            {Icon && <Icon className="h-5 w-5 text-yellow-500" />}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{ach.nome}</p>
                                            <p className="text-sm text-muted-foreground">{ach.descricao}</p>
                                        </div>
                                    </div>
                                    {index < highlightedAchievements.length - 1 && <Separator className="my-4" />}
                                </li>
                            )
                        })}
                    </ul>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <p>Nenhuma conquista destacada. Clique para gerenciar.</p>
                    </div>
                )}
                </CardContent>
            </Card>
        </Link>
    )
}
