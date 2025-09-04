// src/components/dashboard/customizar/customization-card.tsx
'use client';

import { Reorder, useMotionValue } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useRaisedShadow } from '@/hooks/use-raised-shadow';

export interface DashboardCard {
    id: string;
    title: string;
    enabled: boolean;
}

interface CustomizationCardProps {
    card: DashboardCard;
    onToggle: (id: string, enabled: boolean) => void;
}

export function CustomizationCard({ card, onToggle }: CustomizationCardProps) {
    const y = useMotionValue(0);
    const boxShadow = useRaisedShadow(y);

    return (
        <Reorder.Item
            value={card}
            style={{ boxShadow, y }}
            className="relative"
        >
            <Card className="p-4 flex items-center justify-between bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <span className="font-medium">{card.title}</span>
                </div>
                <Switch
                    checked={card.enabled}
                    onCheckedChange={(checked) => onToggle(card.id, checked)}
                    aria-label={`Habilitar card ${card.title}`}
                />
            </Card>
        </Reorder.Item>
    );
}
