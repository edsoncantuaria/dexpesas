'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, ScrollText, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGamificationMode } from '@/hooks/use-gamification-mode';
import { cn } from '@/lib/utils';

interface MonthlyMission {
    id: string;
    title: string;
    description: string;
    progress: number;
    target: number;
    xpReward: number;
    completed: boolean;
}

// Mock data for now - in real implementation this would come from API
const MOCK_MISSIONS: MonthlyMission[] = [
    {
        id: '1',
        title: 'Mestre dos Registros',
        description: 'Registre 30 transações neste mês',
        progress: 12,
        target: 30,
        xpReward: 300,
        completed: false
    },
    {
        id: '2',
        title: 'Guardião do Orçamento',
        description: 'Não estoure nenhum orçamento mensal',
        progress: 1,
        target: 1,
        xpReward: 500,
        completed: true
    },
    {
        id: '3',
        title: 'Sábio Investidor',
        description: 'Faça um aporte em seus investimentos',
        progress: 0,
        target: 1,
        xpReward: 200,
        completed: false
    }
];

export function MonthlyMissionBoard() {
    const { mode, isClassic } = useGamificationMode();

    if (isClassic) return null;

    return (
        <Card className="border-indigo-100 bg-gradient-to-br from-white to-indigo-50/50 dark:from-slate-950 dark:to-slate-900/50 dark:border-slate-800">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ScrollText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        <CardTitle className="text-lg font-headline">Missões Mensais</CardTitle>
                    </div>
                    <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/30 px-2 py-1 rounded-full">
                        Reseta em 12 dias
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {MOCK_MISSIONS.map((mission) => (
                    <div key={mission.id} className="group relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 transition-all hover:shadow-md">
                        <div className="flex items-start gap-3">
                            <div className={cn(
                                "mt-0.5 rounded-full p-1",
                                mission.completed ? "text-green-500 bg-green-50 dark:bg-green-900/20" : "text-slate-300 dark:text-slate-700"
                            )}>
                                {mission.completed ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                            </div>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className={cn("font-medium text-sm", mission.completed && "text-slate-500 line-through")}>
                                            {mission.title}
                                        </h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            {mission.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">
                                        <Trophy className="h-3 w-3" />
                                        +{mission.xpReward} XP
                                    </div>
                                </div>

                                {!mission.completed && (
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-[10px] text-slate-500">
                                            <span>Progresso</span>
                                            <span>{mission.progress} / {mission.target}</span>
                                        </div>
                                        <Progress value={(mission.progress / mission.target) * 100} className="h-1.5" />
                                    </div>
                                )}
                            </div>
                        </div>
                        {mission.completed && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 bg-green-500/5 pointer-events-none"
                            />
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
