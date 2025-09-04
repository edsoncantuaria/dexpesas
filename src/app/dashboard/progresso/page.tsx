// src/app/dashboard/progresso/page.tsx
'use client';

import { AllAttributes } from '@/components/dashboard/progresso/all-attributes';
import { FinancialQuests } from '@/components/dashboard/progresso/financial-quests';
import type { GamificationProfile, User, UserItem } from '@/lib/definitions';
import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { InventoryCard } from '@/components/dashboard/progresso/inventory-card';

export default function ProgressoPage() {
    const [profile, setProfile] = useState<(GamificationProfile & { updatedAt: string }) | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [inventory, setInventory] = useState<UserItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const [profileRes, userRes, inventoryRes] = await Promise.all([
                api.get('/gamification/profile'),
                api.get('/user'),
                api.get('/data/inventory')
            ]);
            setProfile(profileRes.data);
            setUser(userRes.data);
            setInventory(inventoryRes.data);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Erro ao buscar perfil de progresso",
            });
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [toast]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    if (isLoading || !profile || !user) {
        return <LoadingScreen />;
    }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 rounded-md hover:bg-muted">
           <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
            <h1 className="text-3xl font-bold font-headline">Seu Progresso Detalhado</h1>
            <p className="text-muted-foreground">Veja todos os seus atributos e complete missões para ganhar mais XP.</p>
        </div>
      </div>
       <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
             <AllAttributes profile={profile} />
          </div>
          <div className="lg:col-span-1 space-y-6">
            <FinancialQuests user={user} />
            <InventoryCard items={inventory} onItemEquip={() => fetchData(false)} />
          </div>
       </div>
    </div>
  );
}
