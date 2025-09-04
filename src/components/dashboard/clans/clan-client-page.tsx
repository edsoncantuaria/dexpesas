// src/components/dashboard/clans/clan-client-page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import type { Clan, Account, AuditLog, Goal, User } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ClanBankCard } from './clan-bank-card';
import { ClanGoalsCard } from './clan-goals-card';
import { ClanActivityFeed } from './clan-activity-feed';
import { ClanHeader } from './clan-header';
import { useRouter } from 'next/navigation';
import { ClanSharedExpenses } from './clan-shared-expenses';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Home, List, Settings, Users } from 'lucide-react';
import { FamilyMembersTab } from './family-members-tab';

interface ClanClientPageProps {
  clanId: string;
}

export function ClanClientPage({ clanId }: ClanClientPageProps) {
  const [clan, setClan] = useState<(Clan & { _count: { members: number }, members: {user: Partial<User>, role: string}[], leader: Partial<User>}) | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);
  const [sharedExpenses, setSharedExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const fetchData = useCallback(async () => {
    // Não reseta o loading para evitar piscar em reloads
    try {
      const [clanRes, accountsRes, goalsRes, activityRes, sharedExpensesRes] = await Promise.all([
        api.get(`/familia/${clanId}`),
        api.get('/accounts'),
        api.get(`/familia/${clanId}/goals`),
        api.get(`/familia/${clanId}/activity`),
        api.get(`/familia/${clanId}/shared-expenses`),
      ]);
      setClan(clanRes.data);
      setAccounts(accountsRes.data);
      setGoals(goalsRes.data);
      setActivity(activityRes.data);
      setSharedExpenses(sharedExpensesRes.data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao carregar dados da família' });
    } finally {
      setIsLoading(false);
    }
  }, [clanId, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleLeaveClan = () => {
    toast({ title: 'Você saiu da família.', variant: 'destructive' });
    router.push('/dashboard/clans');
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!clan) {
    return (
      <div className="text-center">
        <p>Não foi possível encontrar os dados da família.</p>
        <Button asChild variant="link"><Link href="/dashboard/clans">Voltar</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ClanHeader clan={clan} onLeaveSuccess={handleLeaveClan} onUpdate={fetchData}/>
      
      <Tabs defaultValue="home" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="home"><Home className="w-4 h-4 mr-2"/>Visão Geral</TabsTrigger>
            <TabsTrigger value="transactions"><List className="w-4 h-4 mr-2"/>Transações</TabsTrigger>
            <TabsTrigger value="members"><Users className="w-4 h-4 mr-2"/>Membros</TabsTrigger>
        </TabsList>
        <TabsContent value="home" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ClanBankCard clan={clan} userAccounts={accounts} onTransactionSuccess={fetchData} />
                <ClanGoalsCard clanId={clan.id} goals={goals} onGoalUpdate={fetchData} userAccounts={accounts} />
            </div>
        </TabsContent>
         <TabsContent value="transactions" className="mt-6 space-y-6">
            <ClanActivityFeed logs={activity} clanId={clan.id} onActivityUpdate={fetchData} />
            <ClanSharedExpenses expenses={sharedExpenses} />
        </TabsContent>
         <TabsContent value="members" className="mt-6 space-y-6">
            <FamilyMembersTab clan={clan} onUpdate={fetchData} />
         </TabsContent>
      </Tabs>
    </div>
  );
}
