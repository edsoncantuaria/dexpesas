// src/app/dashboard/clans/page.tsx
'use client';

import { Users } from 'lucide-react';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { ClanList } from '@/components/dashboard/clans/clan-list';
import { useUser } from '@/contexts/UserContext';
import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ClanClientPage } from '@/components/dashboard/clans/clan-client-page';
import { ClanInvitesList } from '@/components/dashboard/clans/clan-invites-list';
import * as React from 'react';

export default function ClansPage() {
    const { user, isLoading: isUserLoading, fetchUser } = useUser();
    const router = useRouter();

    const handleActionSuccess = useCallback(() => {
        if (fetchUser) {
            fetchUser();
        }
    }, [fetchUser]);

    const handleCreateSuccess = useCallback((clanId: string) => {
        fetchUser().then(() => {
             router.push(`/dashboard/clans/${clanId}`);
        })
    }, [fetchUser, router]);


    if (isUserLoading || !user) {
        return <LoadingScreen />;
    }
    
    if (user.clanId) {
        return <ClanClientPage clanId={user.clanId} />;
    }

    return (
        <div className="space-y-6">
             <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline">Modo Família</h1>
                    <p className="text-muted-foreground">Junte-se aos seus familiares e conquistem objetivos juntos.</p>
                </div>
            </div>

            <ClanInvitesList onActionSuccess={handleActionSuccess} />
            <ClanList onCreateSuccess={handleCreateSuccess} />
        </div>
    );
}
