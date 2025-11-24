'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Sparkles, ArrowRight } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser } from '@/contexts/UserContext';

interface MigrationResumeCardProps {
    onResume: () => void;
}

export function MigrationResumeCard({ onResume }: MigrationResumeCardProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const { user } = useUser();

    const isNew = user?.hasCompletedMigration === 0;

    const texts = {
        title: isNew ? "Bem-vindo ao Dexpesas!" : "Migração Inicial Pendente",
        badge: isNew ? "Primeiros Passos" : "Ação Recomendada",
        description: isNew
            ? "Para aproveitar ao máximo a plataforma, vamos configurar sua conta e importar seus dados iniciais."
            : "Você adiou a importação dos seus dados financeiros.",
        cta: isNew ? "Começar Agora em poucos minutos" : "Complete agora em poucos minutos",
        button: isNew ? "Iniciar Configuração" : "Retomar Migração"
    };

    const handleResume = async () => {
        setIsLoading(true);
        try {
            await api.post('/migration/resume');
            toast({
                title: "Migração retomada!",
                description: "O wizard será aberto automaticamente.",
            });
            onResume();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Erro",
                description: error.response?.data?.message || "Erro ao retomar migração.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="relative"
            >
                <Card className="border-2 border-primary bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -z-10" />

                    <CardContent className="p-6 relative">
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg">
                                    <Rocket className="h-8 w-8 text-white" />
                                </div>
                                <div className="absolute -top-1 -right-1">
                                    <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
                                </div>
                            </div>

                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-2xl font-bold">{texts.title}</h3>
                                    <span className="px-2 py-1 text-xs font-semibold bg-primary/20 text-primary rounded-full">
                                        {texts.badge}
                                    </span>
                                </div>
                                <p className="text-muted-foreground">
                                    {texts.description}
                                    <strong className="text-foreground"> {texts.cta}</strong> e tenha uma visão completa das suas finanças!
                                </p>
                                <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                        <span>Rápido e fácil</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                                        <span>Dados seguros</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-purple-500" />
                                        <span>Só precisa fazer uma vez</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                <Button
                                    size="lg"
                                    onClick={handleResume}
                                    disabled={isLoading}
                                    className="group relative overflow-hidden"
                                >
                                    <span className="relative z-10 flex items-center gap-2">
                                        {isLoading ? 'Abrindo...' : texts.button}
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                                    </span>
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </Button>
                                <p className="text-xs text-center text-muted-foreground">
                                    ⏱️ Leva apenas 3-5 minutos
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </AnimatePresence>
    );
}
