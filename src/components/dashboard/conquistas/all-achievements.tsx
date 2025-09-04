// src/components/dashboard/conquistas/all-achievements.tsx
'use client';

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { Achievement, UnlockedAchievement } from "@/lib/definitions";
import { Lock, Pin, PinOff, PiggyBank, LayoutDashboard, BarChart, Landmark, ShieldCheck, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import type { LucideIcon } from "lucide-react";

type AllAchievementsProps = {
    allAchievements: Achievement[];
    unlockedAchievements: UnlockedAchievement[];
    onHighlightToggle: (achievementId: string, isHighlighted: boolean) => void;
};

const MAX_HIGHLIGHTED = 2;

const iconMap: Record<string, LucideIcon> = {
    PiggyBank,
    LayoutDashboard,
    BarChart,
    Landmark,
    ShieldCheck,
    Star
};

export function AllAchievements({ allAchievements, unlockedAchievements, onHighlightToggle }: AllAchievementsProps) {
    
    const unlockedMap = new Map(unlockedAchievements.map(ua => [ua.achievementId, ua]));
    const highlightedCount = unlockedAchievements.filter(ua => ua.destacada).length;

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle>Todas as Conquistas</CardTitle>
                <CardDescription>
                    Você pode destacar até {MAX_HIGHLIGHTED} conquistas no seu perfil. 
                    Atualmente, você tem {highlightedCount} conquista(s) destacada(s).
                </CardDescription>
                {highlightedCount >= MAX_HIGHLIGHTED && (
                    <Alert variant="default" className="border-accent/50 bg-accent/5 mt-4">
                        <AlertTitle>Limite Atingido</AlertTitle>
                        <AlertDescription>Você já selecionou o número máximo de conquistas para destacar.</AlertDescription>
                    </Alert>
                )}
            </CardHeader>
            <CardContent>
                <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {allAchievements.map(ach => {
                        const Icon = iconMap[ach.icon];
                        const unlockedAchievement = unlockedMap.get(ach.id);
                        const isUnlocked = !!unlockedAchievement;
                        const isHighlighted = unlockedAchievement?.destacada || false;
                        const canToggle = isUnlocked && (isHighlighted || highlightedCount < MAX_HIGHLIGHTED);

                        return (
                            <div key={ach.id} className={cn(
                                "p-4 rounded-lg flex flex-col justify-between gap-4",
                                isUnlocked ? "bg-card border" : "bg-muted/50 border border-dashed"
                            )}>
                                <div>
                                    <div className="flex items-start gap-4">
                                        <div className={cn(
                                            "p-3 rounded-full mt-1",
                                            isUnlocked ? "bg-yellow-500/10" : "bg-muted-foreground/10"
                                        )}>
                                            {Icon && <Icon className={cn(
                                                "h-6 w-6",
                                                isUnlocked ? "text-yellow-500" : "text-muted-foreground"
                                            )} />}
                                        </div>
                                        <div>
                                            <p className="font-semibold">{ach.nome}</p>
                                            <p className="text-sm text-muted-foreground">{ach.descricao}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                    <p className="text-sm font-bold text-primary">+{ach.xp} XP</p>
                                    {isUnlocked ? (
                                         <div className="flex items-center gap-2">
                                            {isHighlighted ? <Pin className="h-4 w-4 text-accent" /> : <PinOff className="h-4 w-4 text-muted-foreground" />}
                                            <Label htmlFor={`switch-${ach.id}`} className="sr-only">Destacar</Label>
                                            <Switch
                                                id={`switch-${ach.id}`}
                                                checked={isHighlighted}
                                                onCheckedChange={() => onHighlightToggle(ach.id, isHighlighted)}
                                                disabled={!canToggle}
                                                aria-label={`Destacar ${ach.nome}`}
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Lock className="h-4 w-4" />
                                            <span className="text-sm">Bloqueada</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
