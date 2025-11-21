'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/api';
import { Logo } from '@/components/logo';

const formSchema = z.object({
    email: z.string().email('Informe um e-mail válido'),
});

export default function ForgotPasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setIsLoading(true);
        try {
            await api.post('/auth/forgot-password', values);
            setIsSubmitted(true);
            toast({
                title: 'E-mail enviado!',
                description: 'Verifique sua caixa de entrada para redefinir sua senha.',
            });
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao enviar e-mail',
                description: error.response?.data?.message || 'Tente novamente mais tarde.',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
            {/* Dynamic Background */}
            <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background -z-10" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md space-y-8"
            >
                <div className="flex flex-col items-center text-center">
                    <Logo className="h-12 w-12 mb-6" />
                    <h1 className="text-2xl font-bold tracking-tight">Recuperar Senha</h1>
                    <p className="text-muted-foreground mt-2">
                        Digite seu e-mail e enviaremos um link para você redefinir sua senha.
                    </p>
                </div>

                <div className="bg-card border rounded-xl p-6 shadow-sm">
                    {isSubmitted ? (
                        <div className="flex flex-col items-center text-center space-y-4 py-6">
                            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                                <CheckCircle2 className="h-6 w-6" />
                            </div>
                            <h3 className="font-semibold text-lg">Verifique seu e-mail</h3>
                            <p className="text-muted-foreground text-sm">
                                Enviamos instruções de recuperação para <strong>{form.getValues('email')}</strong>
                            </p>
                            <Button variant="outline" className="w-full mt-4" asChild>
                                <Link href="/">Voltar para o Login</Link>
                            </Button>
                        </div>
                    ) : (
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>E-mail</FormLabel>
                                            <FormControl>
                                                <Input placeholder="seu@email.com" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full" disabled={isLoading}>
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        'Enviar Link de Recuperação'
                                    )}
                                </Button>
                            </form>
                        </Form>
                    )}
                </div>

                <div className="text-center">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Voltar para o Login
                    </Link>
                </div>
            </motion.div>
        </main>
    );
}
