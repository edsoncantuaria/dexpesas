'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock, Trophy, Filter, Check, X } from "lucide-react";
import { iconMap } from "@/lib/icon-map";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useGamificationMode } from "@/hooks/use-gamification-mode";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    xp: number;
}

interface UnlockedAchievement {
    id: string;
    userId: string;
    achievementId: string;
    unlockedAt: string;
}

interface AchievementsListProps {
    allAchievements: Achievement[];
    unlockedAchievements: UnlockedAchievement[];
}

type FilterType = 'all' | 'unlocked' | 'locked';

export function AchievementsList({ allAchievements, unlockedAchievements }: AchievementsListProps) {
    const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievementId));
    const { isClassic } = useGamificationMode();
    const [filter, setFilter] = useState<FilterType>('all');

    if (isClassic) return null;

    // Create a map for quick unlock date lookup
    const unlockMap = new Map(
        unlockedAchievements.map(ua => [ua.achievementId, ua.unlockedAt])
    );

    // Apply filters
    const filteredAchievements = allAchievements.filter(achievement => {
        const isUnlocked = unlockedIds.has(achievement.id);
        if (filter === 'unlocked') return isUnlocked;
        if (filter === 'locked') return !isUnlocked;
        return true;
    });

    // Sort: unlocked first, then by XP
    const sortedAchievements = [...filteredAchievements].sort((a, b) => {
        const aUnlocked = unlockedIds.has(a.id);
        const bUnlocked = unlockedIds.has(b.id);
        if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;
        return b.xp - a.xp;
    });

    const filterButtons: { type: FilterType; label: string; icon: React.ElementType }[] = [
        { type: 'all', label: 'Todas', icon: Filter },
        { type: 'unlocked', label: 'Desbloqueadas', icon: Check },
        { type: 'locked', label: 'Travadas', icon: X },
    ];

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        <CardTitle>Conquistas</CardTitle>
                        <Badge variant="secondary" className="ml-2">
                            {unlockedIds.size} / {allAchievements.length}
                        </Badge>
                    </div>

                    {/* Filter Buttons */}
                    <div className="flex gap-2">
                        {filterButtons.map(({ type, label, icon: Icon }) => (
                            <Button
                                key={type}
                                variant={filter === type ? "default" : "outline"}
                                size="sm"
                                onClick={() => setFilter(type)}
                                className="text-xs h-8"
                            >
                                <Icon className="h-3 w-3 mr-1" />
                                {label}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[500px] px-6 pb-6">
                    {sortedAchievements.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center">
                            <Trophy className="h-12 w-12 text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">
                                {filter === 'unlocked'
                                    ? 'Você ainda não desbloqueou nenhuma conquista.'
                                    : 'Nenhuma conquista encontrada.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sortedAchievements.map((achievement) => {
                                const isUnlocked = unlockedIds.has(achievement.id);
                                const IconComponent = iconMap[achievement.icon as keyof typeof iconMap] || Trophy;
                                const isBase64 = achievement.icon.startsWith('data:image');
                                const unlockDate = unlockMap.get(achievement.id);

                                return (
                                    <div
                                        key={achievement.id}
                                        className={cn(
                                            "relative flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300",
                                            "hover:shadow-md",
                                            isUnlocked
                                                ? "bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800 shadow-sm"
                                                : "bg-muted/30 border-muted-foreground/20 opacity-60 grayscale hover:opacity-80"
                                        )}
                                    >
                                        {/* Icon */}
                                        <div className={cn(
                                            "p-3 rounded-xl shrink-0 shadow-sm",
                                            isUnlocked
                                                ? "bg-gradient-to-br from-amber-400 to-yellow-500 text-white"
                                                : "bg-muted text-muted-foreground"
                                        )}>
                                            {isBase64 ? (
                                                <div className="relative h-6 w-6">
                                                    <Image
                                                        src={achievement.icon}
                                                        alt={achievement.name}
                                                        fill
                                                        className="object-contain"
                                                    />
                                                </div>
                                            ) : (
                                                <IconComponent className="h-6 w-6" />
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 space-y-1.5 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h4 className={cn(
                                                    "font-semibold text-sm leading-tight",
                                                    isUnlocked && "text-amber-900 dark:text-amber-100"
                                                )}>
                                                    {achievement.name}
                                                </h4>
                                                {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />}
                                            </div>

                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {achievement.description}
                                            </p>

                                            <div className="flex items-center justify-between pt-1">
                                                <Badge
                                                    variant={isUnlocked ? "default" : "outline"}
                                                    className={cn(
                                                        "text-[10px] h-5",
                                                        isUnlocked && "bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
                                                    )}
                                                >
                                                    <Trophy className="h-2.5 w-2.5 mr-1" />
                                                    +{achievement.xp} XP
                                                </Badge>

                                                {isUnlocked && unlockDate && (
                                                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">
                                                        {format(new Date(unlockDate), "dd/MM/yyyy", { locale: ptBR })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Unlocked Badge */}
                                        {isUnlocked && (
                                            <div className="absolute top-2 right-2">
                                                <div className="bg-amber-500 text-white rounded-full p-1">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
