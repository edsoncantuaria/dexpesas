import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock, Trophy } from "lucide-react";
import { iconMap } from "@/lib/icon-map";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useGamificationMode } from "@/hooks/use-gamification-mode";

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

export function AchievementsList({ allAchievements, unlockedAchievements }: AchievementsListProps) {
    const unlockedIds = new Set(unlockedAchievements.map(ua => ua.achievementId));
    const { isClassic } = useGamificationMode();

    if (isClassic) return null;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Conquistas
                    <Badge variant="secondary" className="ml-auto">
                        {unlockedIds.size} / {allAchievements.length}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
                <ScrollArea className="h-[400px] px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allAchievements.map((achievement) => {
                            const isUnlocked = unlockedIds.has(achievement.id);
                            const IconComponent = iconMap[achievement.icon as keyof typeof iconMap] || Trophy;
                            const isBase64 = achievement.icon.startsWith('data:image');

                            return (
                                <div
                                    key={achievement.id}
                                    className={cn(
                                        "flex items-start gap-4 p-4 rounded-lg border transition-all",
                                        isUnlocked
                                            ? "bg-card border-primary/20 shadow-sm"
                                            : "bg-muted/50 border-muted opacity-70 grayscale"
                                    )}
                                >
                                    <div className={cn(
                                        "p-2 rounded-full shrink-0",
                                        isUnlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
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
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-semibold text-sm">{achievement.name}</h4>
                                            {!isUnlocked && <Lock className="h-3 w-3 text-muted-foreground" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {achievement.description}
                                        </p>
                                        <div className="pt-1">
                                            <Badge variant={isUnlocked ? "default" : "outline"} className="text-[10px] h-5">
                                                +{achievement.xp} XP
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
