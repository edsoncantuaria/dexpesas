// src/components/dashboard/overview/family-summary-card.tsx
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Users, Crown, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FamilySummary } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { useUser } from '@/contexts/UserContext';

type FamilySummaryCardProps = {
  summary: FamilySummary;
  onHideFamily: () => Promise<void> | void;
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export function FamilySummaryCard({ summary, onHideFamily }: FamilySummaryCardProps) {
  const { toast } = useToast();
  const { fetchUser } = useUser();
  const [isSavingPreference, setIsSavingPreference] = useState(false);

  const handleHideFamilyMode = async () => {
    setIsSavingPreference(true);
    try {
      await api.put('/user/preferences', { hideFamilyMode: true });
      await fetchUser();
      await onHideFamily();
      toast({ title: 'Modo família ocultado' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível atualizar a preferência',
      });
    } finally {
      setIsSavingPreference(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <CardTitle>Modo Família</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={handleHideFamilyMode} disabled={isSavingPreference}>
          {isSavingPreference ? 'Salvando...' : 'Não mostrar'}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border bg-muted/30 p-3">
          <p className="text-xs text-muted-foreground">Saldo compartilhado</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.clan.balance)}</p>
          <p className="text-xs text-muted-foreground">
            {summary.totalMembers} membros colaborando.
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Ranking de gastos</p>
          <div className="space-y-2">
            {summary.ranking.slice(0, 4).map((member, index) => (
              <div key={member.memberId} className="flex items-center justify-between rounded-md border p-2">
                <div className="flex items-center gap-2">
                  <Badge variant={index === 0 ? 'default' : 'secondary'}>{index + 1}º</Badge>
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1">
                      {member.name}
                      {member.role === 'LEADER' && <Crown className="h-3 w-3 text-yellow-500" />}
                    </p>
                    <p className="text-xs text-muted-foreground">{member.role.toLowerCase()}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(member.spent)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href={`/dashboard/clans/${summary.clan.id}`} className="flex-1 min-w-[150px]">
            <Button className="w-full">
              <ShieldCheck className="h-4 w-4 mr-2" />
              Aprovar gastos
            </Button>
          </Link>
          <Link href={`/dashboard/clans/${summary.clan.id}?tab=orcamento`} className="flex-1 min-w-[150px]">
            <Button variant="secondary" className="w-full">
              Ver orçamento familiar
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
