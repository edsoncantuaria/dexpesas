// src/components/dashboard/progresso/inventory-card.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Gem, Scroll, Skull, Check } from "lucide-react";
import type { UserItem } from "@/lib/definitions";
import type { LucideIcon } from "lucide-react";
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Mapeamento de tipo de item para ícone
const itemTypeIcons: Record<string, LucideIcon> = {
    consumable: Gem, // Ex: Poção de Sorte
    cosmetic: Skull, // Ex: Avatar de Caveira
    bonus: Scroll, // Ex: Pergaminho de XP
    default: Briefcase,
};

interface InventoryCardProps {
    items: UserItem[];
    onItemEquip: () => void; // Callback para forçar o refresh do profile
}

export function InventoryCard({ items, onItemEquip }: InventoryCardProps) {
    const { toast } = useToast();
    const [localItems, setLocalItems] = useState(items);

    const handleEquipItem = async (userItemId: string) => {
        const originalItems = [...localItems];
        // Otimista: atualiza a UI primeiro
        setLocalItems(prevItems => prevItems.map(item => 
            item.id === userItemId ? { ...item, equipped: !item.equipped } : item
        ));

        try {
            await api.post(`/items/equip/${userItemId}`);
            toast({ title: "Item equipado!", description: "Seus bônus foram aplicados." });
            onItemEquip(); // Chama o callback para o componente pai atualizar
        } catch (error) {
            setLocalItems(originalItems); // Reverte em caso de erro
            toast({ variant: 'destructive', title: 'Erro!', description: 'Não foi possível equipar o item.' });
        }
    };
    
    return (
        <Card className="shadow-md h-full">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Briefcase className="h-6 w-6 text-yellow-600" />
                    <div>
                        <CardTitle className="font-headline text-xl">Bolsa de Aventureiro</CardTitle>
                        <CardDescription>Seus itens coletados em missões.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {localItems.length > 0 ? (
                    <ul className="space-y-4">
                        {localItems.map(({ item, quantity, id, equipped }) => {
                            const Icon = itemTypeIcons[item.type] || itemTypeIcons.default;
                            return (
                                <li key={id} 
                                    className={cn(
                                        "flex items-center gap-4 p-2 rounded-lg transition-all cursor-pointer border",
                                        equipped ? "bg-primary/10 border-primary/50" : "bg-muted/50 hover:bg-muted"
                                    )}
                                    onClick={() => handleEquipItem(id)}
                                >
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="p-2 bg-background rounded-md">
                                                    <Icon className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="capitalize">{item.type}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                    <div className="flex-1">
                                        <p className="font-semibold">{item.name}</p>
                                        <p className="text-sm text-muted-foreground">{item.bonusJson ? `Bônus: ${Object.values(item.bonusJson)[0]}` : 'Item cosmético'}</p>
                                    </div>
                                    {equipped && (
                                        <div className="text-right">
                                            <Check className="h-5 w-5 text-primary" />
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                ) : (
                    <div className="text-center text-muted-foreground py-8">
                        <p>Sua bolsa está vazia. Complete missões para ganhar itens!</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
