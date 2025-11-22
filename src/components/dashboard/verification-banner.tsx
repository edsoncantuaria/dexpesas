'use client';

import { useState } from 'react';
import { AlertTriangle, Send, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function VerificationBanner() {
    const { user } = useUser();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    // Don't show if user is not loaded or already verified
    if (!user || user.emailVerified || !isVisible) {
        return null;
    }

    const handleResend = async () => {
        setIsLoading(true);
        try {
            await api.post('/auth/resend-verification', { email: user.email });
            toast({
                title: 'E-mail enviado!',
                description: 'Verifique sua caixa de entrada (e spam) pelo link de confirmação.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao enviar',
                description: error.response?.data?.message || 'Tente novamente mais tarde.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800"
                >
                    <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <p>
                                <span className="font-semibold">Atenção:</span> Seu e-mail ainda não foi verificado.
                                Alguns recursos como <strong>Família</strong> e <strong>Investimentos</strong> estão bloqueados.
                            </p>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleResend}
                                disabled={isLoading}
                                className="w-full sm:w-auto border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-100"
                            >
                                {isLoading ? (
                                    <>Enviando...</>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-3 w-3" />
                                        Reenviar E-mail
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/50"
                                onClick={() => setIsVisible(false)}
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Fechar</span>
                            </Button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
