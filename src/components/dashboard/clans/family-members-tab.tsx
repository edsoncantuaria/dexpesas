// src/components/dashboard/clans/family-members-tab.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Crown, Star, User as UserIcon } from 'lucide-react';
import { MemberAvatar } from './member-avatar';
import { useUser } from '@/contexts/UserContext';
import { ManageMemberDialog } from './manage-member-dialog';
import type { Clan } from '@/lib/definitions';

interface FamilyMembersTabProps {
  clan: Clan & { members: any[] };
  onUpdate: () => void;
}

export function FamilyMembersTab({ clan, onUpdate }: FamilyMembersTabProps) {
    const { user } = useUser();
    const [managingMember, setManagingMember] = useState<any | null>(null);

    const isLeader = user?.id === clan.leaderId;

    const handleManageClick = (member: any) => {
        if (isLeader && member.user.id !== user.id) {
            setManagingMember(member);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Membros da Família</CardTitle>
                    <CardDescription>Veja todos os participantes e gerencie seus papéis.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {clan.members.map(member => {
                            const canManage = isLeader && member.user.id !== user?.id;
                            return (
                                <div 
                                    key={member.user.id} 
                                    className={`flex items-center gap-3 p-2 rounded-md border ${canManage ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
                                    onClick={() => canManage && handleManageClick(member)}
                                >
                                    <MemberAvatar avatarUrl={member.user.avatarUrl} name={member.user.name || ''} className="h-10 w-10" />
                                    <div>
                                        <p className="font-semibold text-sm">{member.user.name}</p>
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            {member.role === 'LEADER' && <Crown className="h-3 w-3 text-yellow-500" />}
                                            {member.role === 'ADMIN' && <Star className="h-3 w-3 text-blue-500" />}
                                            {member.role === 'MEMBER' && <UserIcon className="h-3 w-3" />}
                                            <span className="capitalize">{member.role.toLowerCase()}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {managingMember && isLeader && (
                <ManageMemberDialog
                    isOpen={!!managingMember}
                    onClose={() => setManagingMember(null)}
                    clanId={clan.id}
                    member={managingMember}
                    onUpdate={onUpdate}
                />
            )}
        </>
    );
}
