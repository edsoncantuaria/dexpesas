// src/components/dashboard/clans/clan-missions-tab.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Mission } from '@/lib/definitions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

export function ClanMissionsTab() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/missions/guild');
      setMissions(response.data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar missões da família' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchMissions();
  }, [fetchMissions]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {missions.length > 0 ? (
        missions.map((mission) => (
          <Card key={mission.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Target className="h-5 w-5 text-primary" />
                <CardTitle>{mission.title}</CardTitle>
              </div>
              <CardDescription>{mission.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <p className="text-lg font-bold text-accent">+{mission.xpReward} XP</p>
              <Button size="sm" disabled>Ver Detalhes</Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <Card className="flex flex-col items-center justify-center h-48 text-center">
          <CardContent>
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="font-semibold">O Quadro de Missões está Vazio</p>
            <p className="text-sm text-muted-foreground">
              O Game Master ainda não publicou nenhuma missão para a família. Volte em breve!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
