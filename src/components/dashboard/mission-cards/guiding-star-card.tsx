// src/components/dashboard/mission-cards/guiding-star-card.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from "@/hooks/use-toast";
import api from '@/lib/api';

interface AiInsight {
    analysis: string;
    relevantTransactionIds: string[];
}

export function GuidingStarCard() {
    const [insight, setInsight] = useState<AiInsight | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const fetchInsight = async () => {
            try {
                // Tenta buscar uma oportunidade primeiro
                const response = await api.post('/ai/analyze-opportunities');
                setInsight(response.data);
            } catch (error) {
                // Se falhar (ou não tiver), busca um hábito a ser melhorado
                try {
                    const response = await api.post('/ai/analyze-habits');
                    setInsight(response.data);
                } catch (err) {
                    // Se ambos falharem, não mostra nada.
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchInsight();
    }, []);

    return (
        <Card className="shadow-md h-full transition-all group">
             <CardHeader>
                <div className="flex items-center gap-3">
                   <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                     <Compass className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                   </div>
                    <div>
                        <CardTitle className="font-headline text-xl">A Estrela Guia</CardTitle>
                        <CardDescription>Seus próximos passos, segundo a IA.</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-24">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : insight ? (
                     <Alert variant="default" className="border-blue-500/20 bg-blue-500/5">
                        <Sparkles className="h-4 w-4 text-blue-500" />
                        <AlertTitle className="font-semibold text-blue-600 dark:text-blue-400">Sabedoria Ancestral</AlertTitle>
                        <AlertDescription className="whitespace-pre-wrap text-sm">
                            {insight.analysis}
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="text-center text-muted-foreground pt-8">
                        <p>A IA está meditando... Nenhum conselho por agora.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
