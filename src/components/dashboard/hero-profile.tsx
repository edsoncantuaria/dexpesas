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
import { Crown, Star, Users, Banknote } from 'lucide-react';
import Link from 'next/link';
import { useGamificationMode } from '@/hooks/use-gamification-mode';
import { getGamificationCopy } from '@/lib/gamification-copy';

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
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
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
    <div className="flex flex-col gap-4 rounded-2xl bg-card p-4 shadow-lg border">
        {/* Seção de Identidade */}
        <div className="flex flex-row items-center gap-4">
             <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-4 border-primary/50">
                <AvatarImage src={avatarUrl || undefined} alt={user.name} />
                <AvatarFallback className="text-3xl bg-muted">{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
             <div className="flex-1 w-full">
                <div className="flex items-baseline gap-2">
                    <h1 className="text-2xl font-bold font-headline">{user.name}</h1>
                    {clan && (
                        <Link href="/dashboard/clans" className="text-sm italic text-muted-foreground hover:underline flex items-center gap-1">
                            <Users className="h-3 w-3"/>{clan.name}
                        </Link>
                    )}
                </div>
                <p className="font-semibold text-sm text-primary flex items-center gap-2 flex-wrap">
                    <Crown className="h-4 w-4 text-yellow-500" />
                    {subtitle}
                </p>
                {typeof familyBalance === 'number' && (
                  <div className="text-xs flex items-center gap-2 text-muted-foreground">
                    <Banknote className="h-3.5 w-3.5 text-green-500" />
                    {heroCopy.familyLabel}: <span className="text-green-600 font-semibold">{formatCurrency(familyBalance)}</span>
                  </div>
                )}
            </div>
        </div>

        {/* Seção de Progresso */}
        <div className="space-y-3">
            {heroCopy.showXp && (
            <div className="space-y-1">
                <div className="relative w-full">
                    <Progress value={xpPercentage} className="h-3" />
                    {showGlow && (
                        <motion.div
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="absolute inset-0 rounded-full"
                            style={{
                                boxShadow: `0 0 8px 2px hsl(var(--primary))`,
                                filter: 'blur(3px)',
                            }}
                        />
                    )}
                </div>
                <p className="text-xs text-muted-foreground text-right">{profile.xp} / {xpNeeded(profile.level)} XP</p>
            </div>
            )}
            {!isClassic && highlightedAchievements.length > 0 && (
                <div className="flex items-center gap-2 pt-2">
                    <p className="text-xs font-semibold text-muted-foreground">{heroCopy.badgesLabel}:</p>
                    <TooltipProvider>
                    {highlightedAchievements.map(ach => {
                        const Icon = iconMap[ach.icon] || Star;
                        return (
                        <Tooltip key={ach.id}>
                            <TooltipTrigger asChild>
                                <div className="p-1.5 bg-yellow-400/20 rounded-full">
                                    <Icon className="h-4 w-4 text-yellow-500" />
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                            <p className="font-semibold">{ach.nome}</p>
                            <p className="text-xs">{ach.description}</p>
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
