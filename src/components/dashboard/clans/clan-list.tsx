// src/components/dashboard/clans/clan-list.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, Users, Crown } from 'lucide-react';
import type { Clan } from '@/lib/definitions';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { CreateClanDialog } from './create-clan-dialog';
import { useIsMobile } from '@/hooks/use-mobile';
import { ClanIcon } from './clan-icon';

interface ClanListProps {
    onCreateSuccess: (clanId: string) => void;
}

export function ClanList({ onCreateSuccess }: ClanListProps) {
    const [clans, setClans] = useState<(Clan & { _count: { members: number } })[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const isMobile = useIsMobile();

    const fetchClans = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/familia');
            setClans(response.data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao buscar famílias.' });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchClans();
    }, [fetchClans]);

    const handleCreateSuccess = (clanId: string) => {
        onCreateSuccess(clanId);
    }
    
    const renderDesktopView = () => (
         <div className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Membros</TableHead>
                        <TableHead>Líder</TableHead>
                        <TableHead className="text-right">Ação</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {clans.map((clan) => (
                        <TableRow key={clan.id}>
                            <TableCell className="font-semibold">
                                <div className="flex items-center gap-3">
                                    <ClanIcon iconUrl={clan.iconUrl} guildName={clan.name} size="sm" />
                                    <span>{clan.name}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    {clan._count.members}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Crown className="h-4 w-4 text-yellow-500" />
                                    {clan.leader.name} (Lvl {clan.leader.level})
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    size="sm"
                                    disabled
                                >
                                    Ver
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
    
    const renderMobileView = () => (
        <div className="space-y-3">
            {clans.map(clan => (
                <Card key={clan.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <ClanIcon iconUrl={clan.iconUrl} guildName={clan.name} />
                             <div>
                                 <p className="font-semibold">{clan.name}</p>
                                 <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1"><Users className="h-3 w-3"/> {clan._count.members}</span>
                                    <span className="flex items-center gap-1"><Crown className="h-3 w-3 text-yellow-500"/> {clan.leader.name}</span>
                                 </div>
                             </div>
                        </div>
                         <Button
                            size="sm"
                            disabled
                        >
                            Ver
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle>Encontre sua Família</CardTitle>
                        <CardDescription>Junte-se a um grupo ou crie o seu próprio para começar.</CardDescription>
                    </div>
                    <CreateClanDialog onCreateSuccess={handleCreateSuccess} />
                </div>
            </CardHeader>
            <CardContent>
                 {isLoading ? (
                    <div className="flex justify-center items-center h-24"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>
                ) : clans.length > 0 ? (
                    isMobile ? renderMobileView() : renderDesktopView()
                ) : (
                    <div className="h-24 flex items-center justify-center text-center text-muted-foreground">Nenhuma família encontrada. Seja o primeiro a criar uma!</div>
                )}
            </CardContent>
        </Card>
    );
}
