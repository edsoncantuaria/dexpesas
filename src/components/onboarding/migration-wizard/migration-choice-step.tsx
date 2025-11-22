'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Rocket, FilePenLine, Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface MigrationChoiceStepProps {
    onChoice: (choice: 'simplified' | 'manual' | 'later') => void;
}

export function MigrationChoiceStep({ onChoice }: MigrationChoiceStepProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleChoice = async (choice: 'simplified' | 'manual' | 'later') => {
        setIsLoading(true);
        try {
            if (choice === 'simplified') {
                await api.post('/migration/start');
                onChoice('simplified');
            } else if (choice === 'manual') {
                await api.post('/migration/skip');
                toast({
                    title: "Migração não realizada",
                    description: "Você optou por adicionar suas transações manualmente.",
                });
                onChoice('manual');
            } else if (choice === 'later') {
                // Não marca como completo, apenas fecha
                onChoice('later');
            }
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.response?.data?.message || "Erro ao processar escolha.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">
                    Migração Inicial
                </h2>
                <p className="text-muted-foreground">
                    Importe seus dados financeiros de forma rápida e fácil
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="cursor-pointer hover:border-primary transition-all"
                    onClick={() => !isLoading && handleChoice('simplified')}>
                    <CardContent className="p-6 space-y-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Rocket className="h-6 w-6 text-primary" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">Migração Simplificada</h3>
                            <p className="text-sm text-muted-foreground">
                                Recomendado! Importamos seus dados de forma rápida: apenas informe
                                quantas contas tem, saldos atuais e histórico mensal de cartão.
                            </p>
                        </div>
                        <Button className="w-full" disabled={isLoading}>
                            Começar Migração
                        </Button>
                    </CardContent>
                </Card>

                <Card className="cursor-pointer hover:border-muted-foreground/50 transition-all"
                    onClick={() => !isLoading && handleChoice('manual')}>
                    <CardContent className="p-6 space-y-4">
                        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                            <FilePenLine className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold">Fazer Manualmente</h3>
                            <p className="text-sm text-muted-foreground">
                                Prefere adicionar transação por transação e ajustar tudo no
                                detalhe? Você pode começar do zero.
                            </p>
                        </div>
                        <Button variant="outline" className="w-full" disabled={isLoading}>
                            Inserir Manualmente
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                    <strong>Importante:</strong> A migração só pode ser feita uma vez.
                    Se escolher fazer manualmente agora, não poderá usar a migração simplificada depois.
                </AlertDescription>
            </Alert>

            <div className="text-center">
                <Button
                    variant="ghost"
                    onClick={() => handleChoice('later')}
                    disabled={isLoading}
                >
                    <Clock className="mr-2 h-4 w-4" />
                    Migrar Depois
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                    Você poderá fazer isso mais tarde
                </p>
            </div>
        </div>
    );
}
