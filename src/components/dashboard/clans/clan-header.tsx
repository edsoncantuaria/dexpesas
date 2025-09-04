// src/components/dashboard/clans/clan-header.tsx
'use client';

import { useState } from 'react';
import type { Clan, User } from '@/lib/definitions';
import { Card, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Crown, LogOut, Loader2, Users, UserPlus } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';
import { ClanIcon } from './clan-icon';
import { Progress } from '@/components/ui/progress';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CreateClanDialog } from './create-clan-dialog';
import { InviteMemberDialog } from './invite-member-dialog';
import { ManageMemberDialog } from './manage-member-dialog';

interface ClanHeaderProps {
  clan: Clan & { members: any[], leader: any, _count: { members: number } };
  onLeaveSuccess: () => void;
  onUpdate: () => void;
}

const xpForNextLevel = (level: number) => Math.floor(200 * Math.pow(level, 1.8));

export function ClanHeader({ clan, onLeaveSuccess, onUpdate }: ClanHeaderProps) {
  const { user } = useUser();
  const [isLeaving, setIsLeaving] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [managingMember, setManagingMember] = useState<any | null>(null);
  const { toast } = useToast();

  const handleLeave = async () => {
    setIsLeaving(true);
    try {
      await api.post(`/familia/${clan.id}/leave`);
      onLeaveSuccess();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao sair', description: error.response?.data?.message });
    } finally {
      setIsLeaving(false);
    }
  };
  
  const handleUpdateMember = () => {
    onUpdate();
    setManagingMember(null);
  }

  const isLeader = user?.id === clan.leaderId;
  const xpToLevelUp = xpForNextLevel(clan.level);
  const xpPercentage = (Number(clan.xp) / xpToLevelUp) * 100;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <ClanIcon iconUrl={clan.iconUrl} guildName={clan.name} size="lg" />
              <div>
                <h1 className="text-2xl font-bold font-headline">{clan.name}</h1>
                <p className="text-muted-foreground">{clan.description}</p>
                <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1 text-sm font-semibold text-yellow-500">
                        <Crown className="h-4 w-4" />
                        Líder: {clan.leader.name}
                    </div>
                     <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {clan._count.members} Membros
                    </div>
                </div>
              </div>
            </div>
            <div className="flex w-full sm:w-auto items-center gap-2">
                 {isLeader && (
                    <Button variant="outline" size="sm" onClick={() => setIsInviteOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" /> Convidar
                    </Button>
                )}
                {isLeader ? (
                    <CreateClanDialog clanToEdit={clan as any} onCreateSuccess={onUpdate} />
                ) : (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isLeaving}>
                                <LogOut className="mr-2 h-4 w-4" /> Sair da Família
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Sair da Família "{clan.name}"?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Você tem certeza que deseja sair? Você perderá o acesso às finanças e metas compartilhadas.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleLeave} disabled={isLeaving} asChild>
                                    <Button variant="destructive">
                                        {isLeaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                                        Sim, Sair
                                    </Button>
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
          </div>
           <div className="mt-4 space-y-2">
                <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold">Nível da Família: {clan.level}</span>
                    <span className="text-muted-foreground">{Number(clan.xp)} / {xpToLevelUp} XP</span>
                </div>
                <Progress value={xpPercentage} indicatorClassName="bg-yellow-500"/>
           </div>
        </CardHeader>
      </Card>
       
       <InviteMemberDialog 
          clanId={clan.id}
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
       />

       {managingMember && isLeader && (
            <ManageMemberDialog
                isOpen={!!managingMember}
                onClose={() => setManagingMember(null)}
                clanId={clan.id}
                member={managingMember}
                onUpdate={handleUpdateMember}
            />
       )}
    </>
  );
}
