// src/app/dashboard/customizar/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { User } from '@/lib/definitions';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/ui/loading-screen';
import api from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Reorder } from 'framer-motion';
import { CustomizationCard } from '@/components/dashboard/customizar/customization-card';
import type { DashboardCard } from '@/components/dashboard/customizar/customization-card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const ALL_CARDS_CONFIG: Omit<DashboardCard, 'enabled'>[] = [
    { id: 'account_book', title: 'O Livro de Contas' },
    { id: 'journey_map', title: 'O Mapa da Jornada' },
    { id: 'credit_pact', title: 'O Pacto de Prata' },
    { id: 'challenge_tower', title: 'A Torre dos Desafios' },
];


export default function CustomizarPage() {
    const { toast } = useToast();
    const [cards, setCards] = useState<DashboardCard[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<User | null>(null);

     const fetchUser = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/user');
            setUser(response.data);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao carregar dados do usuário' });
        }
    }, [toast]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const initializeLayout = useCallback(() => {
        if (!user) return;
        
        let userLayout: string[] = [];
        // Garante que o layout do usuário seja um array
        if (typeof user.dashboardLayout === 'string' && user.dashboardLayout.startsWith('[')) {
            try {
                userLayout = JSON.parse(user.dashboardLayout);
            } catch (e) {
                console.error("Erro ao parsear layout do dashboard:", e);
                userLayout = []; // Reseta para o padrão em caso de erro
            }
        } else if (Array.isArray(user.dashboardLayout)) {
            userLayout = user.dashboardLayout;
        }

        const enabledCardIds = new Set(userLayout);
        
        const initialCards: DashboardCard[] = ALL_CARDS_CONFIG.map(config => ({
            ...config,
            enabled: enabledCardIds.has(config.id),
        }));

        initialCards.sort((a, b) => {
            const indexA = userLayout.indexOf(a.id);
            const indexB = userLayout.indexOf(b.id);
            if (indexA === -1 && indexB === -1) return 0;
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
        
        setCards(initialCards);
        setIsLoading(false);
    }, [user]);

    useEffect(() => {
        if(user) {
            initializeLayout();
        }
    }, [user, initializeLayout]);

    const saveLayout = async (newCards: DashboardCard[]) => {
        try {
            const layoutToSave = newCards
                .filter(card => card.enabled)
                .map(card => card.id);
                
            // Correção: Garante que o layout seja sempre salvo como string JSON
            await api.put('/user/preferences', { dashboardLayout: JSON.stringify(layoutToSave) });
            toast({ title: 'Layout salvo!', description: 'Sua tela de aventura foi atualizada.'});
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro ao salvar layout' });
            initializeLayout(); // Reverte em caso de erro
        }
    };
    
    const handleReorder = (newOrder: DashboardCard[]) => {
        setCards(newOrder);
        saveLayout(newOrder);
    };

    const handleToggle = (cardId: string, enabled: boolean) => {
        const newCards = cards.map(card => 
            card.id === cardId ? { ...card, enabled } : card
        );
        setCards(newCards);
        saveLayout(newCards);
    };

    if (isLoading || !user) {
        return <LoadingScreen />
    }

    return (
        <div className="space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <LayoutDashboard className="h-8 w-8 text-primary" />
                    <div>
                    <h1 className="text-3xl font-bold font-headline">Customizar Dashboard</h1>
                    <p className="text-muted-foreground">Arraste para reordenar ou desative os cards da sua tela inicial.</p>
                    </div>
                </div>
                <Button asChild>
                    <Link href="/dashboard">Voltar</Link>
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Cards da Tela de Aventura</CardTitle>
                    <CardDescription>Organize os cards na ordem que fizer mais sentido para você.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertTitle>Como Funciona?</AlertTitle>
                        <AlertDescription>
                            Segure e arraste o card para personalizar a sequência ou use o interruptor para habilitar/desabilitar. As alterações são salvas automaticamente.
                        </AlertDescription>
                    </Alert>
                    <Reorder.Group axis="y" values={cards} onReorder={handleReorder} className="space-y-3 mt-4">
                        {cards.map((card) => (
                            <CustomizationCard
                                key={card.id}
                                card={card}
                                onToggle={handleToggle}
                            />
                        ))}
                    </Reorder.Group>
                </CardContent>
            </Card>
        </div>
    );
}
