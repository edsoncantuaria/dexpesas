// src/components/dashboard/hero-profile.tsx
'use client';

import type { User, GamificationProfile, Achievement, UnlockedAchievement, Clan } from '@/lib/definitions';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { iconMap } from '@/lib/icon-map';
import { Crown, Star, Users, Banknote, Eye, EyeOff, Dumbbell, BookOpen, Shield, Sparkles, Scroll, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { useGamificationMode } from '@/hooks/use-gamification-mode';
import { getGamificationCopy } from '@/lib/gamification-copy';
import { usePrivacy } from '@/contexts/PrivacyContext';

interface HeroProfileProps {
    user: User;
    profile: GamificationProfile & { heroClass?: string };
    clan: Clan | null;
    allAchievements: Achievement[];
    unlockedAchievements: UnlockedAchievement[];
    familyBalance?: number | null;
}

const xpNeeded = (level: number) => Math.floor(100 * Math.pow(level, 1.15));
const formatCurrency = (value: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function HeroProfile({ user, profile, clan, allAchievements, unlockedAchievements, familyBalance }: HeroProfileProps) {
    const { showBalance, togglePrivacy } = usePrivacy();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const { mode, isClassic } = useGamificationMode();
    const heroCopy = getGamificationCopy('hero', mode);

    useEffect(() => {
        const fetchAvatar = async () => {
            if (user.avatarUrl) {
                try {
                    const res = await api.post('/storage/get-url', { objectName: user.avatarUrl });
                    setAvatarUrl(res.data.url);
                } catch (error) {
                    console.error("Failed to fetch presigned URL for avatar");
                    setAvatarUrl(null);
                }
            } else {
                setAvatarUrl(null);
            }
        }
        fetchAvatar();

        const handleProfileUpdate = () => fetchAvatar();
        window.addEventListener('profile-updated', handleProfileUpdate);
        return () => window.removeEventListener('profile-updated', handleProfileUpdate);
    }, [user.avatarUrl]);

    const highlightedAchievements = useMemo(() => {
        const allAchievementsMap = new Map(allAchievements.map(a => [a.id, a]));
        return unlockedAchievements
            .filter(ua => ua.destacada)
            .map(ua => allAchievementsMap.get(ua.achievementId))
            .filter((ach): ach is Achievement => !!ach);
    }, [allAchievements, unlockedAchievements]);


    const xpPercentage = (profile.xp / xpNeeded(profile.level)) * 100;
    const showGlow = xpPercentage > 90;
    const playerClass = profile.heroClass || 'Aventureiro';
    const levelLabel = `${playerClass} - Nível ${profile.level}`;
    const subtitle =
        typeof heroCopy.subtitle === 'function'
            ? heroCopy.subtitle(levelLabel)
            : heroCopy.subtitle || levelLabel;

    return (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white shadow-xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                </svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="relative">
                    <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 opacity-75 blur-sm"></div>
                    <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white/20 relative">
                        <AvatarImage src={avatarUrl || undefined} alt={user.name} />
                        <AvatarFallback className="text-3xl bg-white/10 text-white">{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm">
                        Lvl {profile.level}
                    </div>
                </div>

                <div className="flex-1 w-full text-center md:text-left space-y-2">
                    <div>
                        <h1 className="text-3xl font-bold font-headline tracking-tight">{user.name}</h1>
                        <div className="flex items-center justify-center md:justify-start gap-2 text-indigo-100">
                            <Crown className="h-4 w-4 text-yellow-300" />
                            <span className="font-medium">{subtitle}</span>
                            {clan && (
                                <>
                                    <span className="text-indigo-300">•</span>
                                    <Link href="/dashboard/cells" className="hover:text-white transition-colors flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {clan?.name}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {typeof familyBalance === 'number' && (
                        <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                            <Banknote className="h-4 w-4 text-green-300" />
                            <span>Saldo Familiar: <span className="font-bold text-green-300">{showBalance ? formatCurrency(familyBalance || 0) : 'R$ ••••••'}</span></span>
                            <button
                                type="button"
                                onClick={() => togglePrivacy()}
                                className="ml-1 text-green-300 hover:text-white transition-colors"
                            >
                                {showBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                        </div>
                    )}

                    {/* XP Bar & Weekly Progress */}
                    {heroCopy.showXp && (
                        <div className="max-w-md mx-auto md:mx-0 pt-2 space-y-3">
                            {/* Level Progress */}
                            <div>
                                <div className="flex justify-between text-xs text-indigo-200 mb-1">
                                    <span>XP Nível {profile.level}</span>
                                    <span>{profile.xp} / {xpNeeded(profile.level)}</span>
                                </div>
                                <div className="relative h-2.5 bg-black/20 rounded-full overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                                        style={{ width: `${xpPercentage}%` }}
                                    />
                                    {showGlow && (
                                        <motion.div
                                            animate={{ opacity: [0, 1, 0] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="absolute inset-0 bg-white/30"
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Weekly XP Cap */}
                            {profile.weeklyCap && (
                                <div>
                                    <div className="flex justify-between text-[10px] text-indigo-300 mb-0.5">
                                        <span>Limite Semanal</span>
                                        <span>{profile.weeklyXp || 0} / {profile.weeklyCap}</span>
                                    </div>
                                    <Progress value={((profile.weeklyXp || 0) / profile.weeklyCap) * 100} className="h-1 bg-black/20" indicatorClassName="bg-indigo-400" />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Attributes Toggle */}
                    {mode === 'FULL' && (
                        <div className="mt-4 pt-2 border-t border-white/10">
                            <button
                                onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                                className="flex items-center gap-2 text-xs font-medium text-indigo-200 hover:text-white transition-colors w-full justify-center md:justify-start"
                            >
                                {isDetailsOpen ? (
                                    <>
                                        <ChevronUp className="h-3 w-3" />
                                        Ocultar Atributos & Oráculo
                                    </>
                                ) : (
                                    <>
                                        <ChevronDown className="h-3 w-3" />
                                        Ver Atributos & Oráculo
                                    </>
                                )}
                            </button>

                            <motion.div
                                initial={false}
                                animate={{ height: isDetailsOpen ? 'auto' : 0, opacity: isDetailsOpen ? 1 : 0 }}
                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                {/* Attributes Grid */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                                    <div className="bg-white/5 rounded-lg p-2 text-center backdrop-blur-sm">
                                        <div className="flex items-center justify-center gap-1.5 text-red-300 mb-1">
                                            <Dumbbell className="h-3.5 w-3.5" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Força</span>
                                        </div>
                                        <div className="text-lg font-bold">{profile.Forca || 0}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 text-center backdrop-blur-sm">
                                        <div className="flex items-center justify-center gap-1.5 text-blue-300 mb-1">
                                            <BookOpen className="h-3.5 w-3.5" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Sabedoria</span>
                                        </div>
                                        <div className="text-lg font-bold">{profile.Sabedoria || 0}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 text-center backdrop-blur-sm">
                                        <div className="flex items-center justify-center gap-1.5 text-green-300 mb-1">
                                            <Shield className="h-3.5 w-3.5" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Resistência</span>
                                        </div>
                                        <div className="text-lg font-bold">{profile.Resistencia || 0}</div>
                                    </div>
                                    <div className="bg-white/5 rounded-lg p-2 text-center backdrop-blur-sm">
                                        <div className="flex items-center justify-center gap-1.5 text-amber-300 mb-1">
                                            <Sparkles className="h-3.5 w-3.5" />
                                            <span className="text-xs font-bold uppercase tracking-wider">Sorte</span>
                                        </div>
                                        <div className="text-lg font-bold">{profile.Sorte || 0}</div>
                                    </div>
                                </div>

                                {/* Oracle Insight */}
                                {profile.insight && (
                                    <div className="mt-3 p-3 bg-indigo-950/40 border border-indigo-400/20 rounded-lg backdrop-blur-sm">
                                        <div className="flex gap-2 items-start">
                                            <Scroll className="h-4 w-4 text-indigo-300 mt-0.5 shrink-0" />
                                            <div>
                                                <p className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-0.5">Oráculo</p>
                                                <p className="text-sm text-indigo-100 italic">"{profile.insight}"</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )}
                </div>

                {/* Badges */}
                {!isClassic && highlightedAchievements.length > 0 && (
                    <div className="flex gap-2 bg-white/10 p-2 rounded-xl backdrop-blur-sm">
                        <TooltipProvider>
                            {highlightedAchievements.map(ach => {
                                const Icon = iconMap[ach.icon] || Star;
                                return (
                                    <Tooltip key={ach.id}>
                                        <TooltipTrigger asChild>
                                            <div className="p-2 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 rounded-lg border border-white/10 hover:bg-white/20 transition-colors">
                                                <Icon className="h-5 w-5 text-yellow-300" />
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="bg-slate-900 text-white border-slate-800">
                                            <p className="font-semibold text-yellow-400">{ach.name}</p>
                                            <p className="text-xs text-slate-300">{ach.description}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                )
                            })}
                        </TooltipProvider>
                    </div>
                )}
            </div>
        </div>
    );
}
