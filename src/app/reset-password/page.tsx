'use client';

import { useState, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, ArrowLeft, Lock } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Logo } from '@/components/logo';

const formSchema = z.object({
    password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
});

function ResetPasswordForm() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        if (!token) {
            toast({
                variant: 'destructive',
                title: 'Token inválido',
                description: 'O link de recuperação parece ser inválido ou expirou.',
            });
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/reset-password', {
                token,
                password: values.password,
            });

            toast({
                title: 'Senha alterada!',
                description: 'Sua senha foi redefinida com sucesso. Faça login para continuar.',
            });

            // Redirect to login after short delay
            setTimeout(() => {
                router.push('/');
            }, 2000);

        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Erro ao redefinir senha',
                description: error.response?.data?.message || 'Tente novamente mais tarde.',
            });
        } finally {
            setIsLoading(false);
        }
    }

    if (!token) {
        return (
            <div className="bg-card border rounded-xl p-6 shadow-sm text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto text-red-600 dark:text-red-400">
                    <Lock className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-lg">Link Inválido</h3>
                <p className="text-muted-foreground text-sm">
                    O link de recuperação é inválido ou está faltando o token de segurança.
                </p>
                <Button variant="outline" className="w-full mt-4" asChild>
                    <Link href="/forgot-password">Solicitar novo link</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-card border rounded-xl p-6 shadow-sm">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nova Senha</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="confirmPassword"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirmar Nova Senha</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Redefinindo...
                            </>
                        ) : (
                            'Redefinir Senha'
                        )}
                    </Button>
                </form>
            </Form>
        </div>
    );
}

export default function ResetPasswordPage() {
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
                    <h1 className="text-2xl font-bold tracking-tight">Redefinir Senha</h1>
                    <p className="text-muted-foreground mt-2">
                        Crie uma nova senha segura para sua conta.
                    </p>
                </div>

                <Suspense fallback={
                    <div className="bg-card border rounded-xl p-6 shadow-sm flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                }>
                    <ResetPasswordForm />
                </Suspense>

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
