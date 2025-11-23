// src/components/dashboard/clans/member-profile-dialog.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
import { ResponsiveDialog } from '@/components/ui/responsive-dialog';
import { Loader2, Sword, ShieldCheck, GraduationCap, Sparkles } from 'lucide-react';
import type { User, GamificationProfile } from '@/lib/definitions';
import api from '@/lib/api';
import { Progress } from '@/components/ui/progress';
import type { LucideIcon } from 'lucide-react';
import { MemberAvatar } from './member-avatar';

interface MemberProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  member: Partial<User>;
}

const attributeToIconMap: Record<string, LucideIcon | undefined> = {
  Forca: Sword,
  Resistencia: ShieldCheck,
  Sabedoria: GraduationCap,
  Sorte: Sparkles,
};

export function MemberProfileDialog({ isOpen, onClose, member }: MemberProfileDialogProps) {
  const [profile, setProfile] = useState<GamificationProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchMemberProfile = useCallback(async () => {
    if (!member.id) return;
    setIsLoading(true);
    try {
      const response = await api.get(`/gamification/profile/${member.id}`);
      setProfile(response.data);
    } catch (error) {
      console.error("Erro ao buscar perfil do membro:", error);
      setProfile({ id: member.id, userId: member.id, level: member.level || 1, xp: 0, Forca: 0, Resistencia: 0, Sabedoria: 0, Sorte: 0 } as any);
    } finally {
      setIsLoading(false);
    }
  }, [member.id, member.level]);

  useEffect(() => {
    if (isOpen) {
      fetchMemberProfile();
    }
  }, [isOpen, fetchMemberProfile]);

  return (
    <ResponsiveDialog
      isOpen={isOpen}
      setIsOpen={(open) => !open && onClose()}
      title={member.name || 'Perfil do Membro'}
      description={`Nível ${member.level || 1} - ${profile?.heroClass || 'Aventureiro'}`}
    >
      <div className="flex flex-col items-center gap-4 py-4">
        <MemberAvatar avatarUrl={member.avatarUrl} name={member.name || ''} className="h-20 w-20" />

        {isLoading ? (
          <div className="flex justify-center items-center h-24 w-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : profile ? (
          <div className="space-y-4 w-full">
            {Object.entries(attributeToIconMap).map(([key, Icon]) => {
              const value = (profile as any)[key] || 0;
              const maxPoints = 100;
              const percentage = (value / maxPoints) * 100;
              return (
                <div key={key} className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    {Icon && <Icon className="h-4 w-4 text-accent" />}
                    <span>{key}</span>
                    <span className="ml-auto font-mono">{value}</span>
                  </div>
                  <Progress value={percentage} indicatorClassName="bg-accent" />
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-muted-foreground">Não foi possível carregar os atributos.</p>
        )}
      </div>
    </ResponsiveDialog>
  );
}
