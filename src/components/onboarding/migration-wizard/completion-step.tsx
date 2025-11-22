'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface CompletionStepProps {
    migrationData: any;
    onComplete: () => void;
}

export function CompletionStep({ migrationData, onComplete }: CompletionStepProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState('');
    const { toast } = useToast();

    const handleComplete = async () => {
        setIsLoading(true);
        try {
            // Step 1: Create accounts
            if (migrationData.accounts.length > 0) {
                setProgress('Criando contas...');
                await api.post('/migration/accounts', { accounts: migrationData.accounts });
            }

            // Step 2: Create cards and get their IDs
            let createdCards: any[] = [];
            if (migrationData.cards.length > 0) {
                setProgress('Criando cartões...');
                const response = await api.post('/migration/cards', { cards: migrationData.cards });
                createdCards = response.data.cards || [];
            }

            // Step 3: Create card history for each card
            if (createdCards.length > 0 && migrationData.cardHistory) {
                for (let i = 0; i < createdCards.length; i++) {
                    const card = createdCards[i];
                    const originalCard = migrationData.cards[i];

                    // Find history for this card by matching index
                    // (cardHistory is indexed by card index from the wizard)
                    const history = migrationData.cardHistory[i];

                    if (history && history.length > 0) {
                        setProgress(`Importando histórico do cartão ${card.nome}...`);
                        await api.post('/migration/card-history', {
                            cardId: card.id,
                            history: history,
                        });
                    }
                }
            }

            // Step 4: Mark migration as complete
            setProgress('Finalizando...');
            await api.post('/migration/complete');

            toast({
                title: "Migração concluída!",
                description: "Seus dados foram importados com sucesso.",
            });

            onComplete();
        } catch (error: any) {
            console.error('Migration error:', error);
            toast({
                variant: "destructive",
                title: "Erro na migração",
                description: error.response?.data?.message || "Erro ao completar migração.",
            });
        } finally {
            setIsLoading(false);
            setProgress('');
        }
    };

    const totalAccounts = migrationData.accounts.length;
    const totalCards = migrationData.cards.length;
    const hasHistory = migrationData.cardHistory && Object.keys(migrationData.cardHistory).length > 0;

    return (
        <div className="space-y-6 text-center">
            <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle className="h-12 w-12 text-primary" />
                </div>
            </div>

            <div>
                <h2 className="text-3xl font-bold">Tudo Pronto!</h2>
                <p className="text-muted-foreground mt-2">
                    Vamos importar seus dados financeiros
                </p>
            </div>

            <div className="bg-muted/50 p-6 rounded-lg text-left space-y-2">
                <p className="text-sm">
                    <strong>Resumo da migração:</strong>
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    {totalAccounts > 0 && (
                        <li>{totalAccounts} conta{totalAccounts > 1 ? 's' : ''} bancária{totalAccounts > 1 ? 's' : ''}</li>
                    )}
                    {totalCards > 0 && (
                        <li>{totalCards} cartão{totalCards > 1 ? 'ões' : ''} de crédito</li>
                    )}
                    {hasHistory && (
                        <li>Histórico de faturas dos cartões</li>
                    )}
                </ul>
            </div>

            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg text-sm text-muted-foreground">
                <p>
                    Estes dados representam o estado atual das suas finanças.
                    A partir de agora, todos os novos gastos que você registrar no app refletirão corretamente.
                </p>
            </div>

            {isLoading && progress && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{progress}</span>
                </div>
            )}

            <Button
                size="lg"
                onClick={handleComplete}
                disabled={isLoading}
                className="w-full"
            >
                {isLoading ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importando...
                    </>
                ) : (
                    'Começar a Usar o App'
                )}
            </Button>
        </div>
    );
}
