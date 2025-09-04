// src/components/dashboard/clans/clan-ranking-tab.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/definitions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Crown, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { MemberAvatar } from './member-avatar';
import { cn } from '@/lib/utils';

export function ClanRankingTab() {
  const [ranking, setRanking] = useState<Partial<User & { heroClass: string }>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const fetchRanking = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/rankings');
      setRanking(response.data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar ranking' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRanking();
  }, [fetchRanking]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <CardTitle>Salão da Fama</CardTitle>
        </div>
        <CardDescription>Os heróis mais poderosos do reino.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Pos.</TableHead>
              <TableHead>Herói</TableHead>
              <TableHead>Nível</TableHead>
              <TableHead>Classe</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranking.map((player, index) => {
              const isCurrentUser = player.id === currentUser?.id;
              return (
                <TableRow key={player.id} className={cn(isCurrentUser && 'bg-primary/10')}>
                  <TableCell className="font-bold text-lg">
                    {index === 0 ? <Crown className="h-5 w-5 text-yellow-500" /> : index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <MemberAvatar avatarUrl={player.avatarUrl} name={player.name || ''} className="h-8 w-8" />
                      <span className="font-medium">{player.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{player.level}</TableCell>
                  <TableCell className="text-muted-foreground">{player.heroClass}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
