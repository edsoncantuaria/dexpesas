// src/components/dashboard/boss/boss-battle-card.tsx
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Boss } from "@/lib/definitions";
import { Skull, Sword } from "lucide-react";
import { motion } from "framer-motion";

interface BossBattleCardProps {
    boss: Boss;
}

const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function BossBattleCard({ boss }: BossBattleCardProps) {
    const hpPercentage = (Number(boss.currentHp) / Number(boss.hp)) * 100;

    return (
        <Card className="shadow-lg border-destructive/50 bg-destructive/5">
            <CardHeader>
                <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                       <div className="p-3 bg-destructive/10 rounded-lg">
                         <Skull className="h-6 w-6 text-destructive" />
                       </div>
                        <div>
                            <CardTitle className="font-headline text-xl text-destructive">Batalha de Chefe Ativa!</CardTitle>
                            <CardDescription>Una-se à sua guilda para derrotar este monstro financeiro.</CardDescription>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-lg">{boss.name}</p>
                        <p className="text-sm text-muted-foreground">Recompensa: ???</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="relative">
                    <Progress value={hpPercentage} className="h-6" indicatorClassName="bg-destructive" />
                    <motion.div
                        className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white drop-shadow-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                       HP: {formatNumber(Number(boss.currentHp))} / {formatNumber(Number(boss.hp))}
                    </motion.div>
                </div>
                 <div className="flex justify-center items-center gap-2 text-xs text-muted-foreground">
                    <Sword className="h-4 w-4" />
                    <span>Ações financeiras positivas causam dano ao chefe!</span>
                </div>
            </CardContent>
        </Card>
    );
}
