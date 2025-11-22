import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Rocket, FilePenLine, Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface MigrationChoiceStepProps {
    onChoice: (choice: 'simplified' | 'manual' | 'later') => void;
}

export function MigrationChoiceStep({ onChoice }: MigrationChoiceStepProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showLaterConfirm, setShowLaterConfirm] = useState(false);
    const [showManualConfirm, setShowManualConfirm] = useState(false);
    const { toast } = useToast();

    const handleChoice = async (choice: 'simplified' | 'manual' | 'later') => {
        // Se escolher "later", mostrar confirmação primeiro
        if (choice === 'later') {
            setShowLaterConfirm(true);
            return;
        }

        // Se escolher "manual", mostrar confirmação primeiro
        if (choice === 'manual') {
            setShowManualConfirm(true);
            return;
        }

        setIsLoading(true);
        try {
            if (choice === 'simplified') {
                await api.post('/migration/start');
                onChoice('simplified');
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

    const handleConfirmManual = async () => {
        setIsLoading(true);
        try {
            // Manual = marca como 1 (concluído sem migração)
            await api.post('/migration/complete');
            toast({
                title: "Migração não realizada",
                description: "Você optou por adicionar suas transações manualmente.",
            });
            onChoice('manual');
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.response?.data?.message || "Erro ao processar escolha.",
            });
        } finally {
            setIsLoading(false);
            setShowManualConfirm(false);
        }
    };

    const handleConfirmLater = async () => {
        setIsLoading(true);
        try {
            // Later = marca como 2 (pulado/adiado)
            await api.post('/migration/skip');
            toast({
                title: "Migração adiada",
                description: "Você pode retomá-la depois na seção Serviços.",
            });
            onChoice('later');
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.response?.data?.message || "Erro ao processar escolha.",
            });
        } finally {
            setIsLoading(false);
            setShowLaterConfirm(false);
        }
    };

    return (
        <>
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

            {/* Manual Confirmation Dialog */}
            <AlertDialog open={showManualConfirm} onOpenChange={setShowManualConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Fazer migração manualmente?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <div>
                                    Você está prestes a <strong>desabilitar permanentemente</strong> a migração simplificada.
                                </div>
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-2">
                                    <div className="font-medium text-destructive flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        Esta ação não pode ser desfeita!
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Após confirmar, você <strong>não poderá mais</strong> usar a ferramenta de importação rápida.
                                        Terá que adicionar todas as transações manualmente, uma por uma.
                                    </div>
                                </div>
                                <div className="text-sm">
                                    Tem certeza que prefere fazer tudo manualmente?
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmManual}
                            disabled={isLoading}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            {isLoading ? 'Confirmando...' : 'Sim, fazer manualmente'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Later Confirmation Dialog */}
            <AlertDialog open={showLaterConfirm} onOpenChange={setShowLaterConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Adiar migração?</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-2">
                                <div>
                                    Você está prestes a adiar a importação dos seus dados financeiros.
                                </div>
                                <div className="font-medium text-foreground">
                                    ✓ Você poderá retomar a migração a qualquer momento na seção <strong>Serviços</strong>
                                </div>
                                <div className="text-muted-foreground text-sm">
                                    Seu progresso será salvo caso você já tenha começado a preencher algum dado.
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isLoading}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmLater} disabled={isLoading}>
                            {isLoading ? 'Adiando...' : 'Sim, adiar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
