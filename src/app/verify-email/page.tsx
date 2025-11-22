'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api';
import { Logo } from '@/components/logo';
import Cookies from 'js-cookie';

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Verificando seu e-mail...');

    useEffect(() => {
        if (!token) {
            setStatus('error');
            setMessage('Token de verificação inválido ou ausente.');
            return;
        }

        const verify = async () => {
            try {
                console.log('🔐 Iniciando verificação de e-mail com token:', token);
                const response = await api.post('/auth/verify-email', { token });
                console.log('✅ Resposta do backend:', response.data);

                // Se o backend retornar um token, fazemos o login automático
                if (response.data.token) {
                    console.log('💾 Salvando token no cookie auth_token...');
                    console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
                    console.log('🔒 Secure flag será:', process.env.NODE_ENV === 'production');

                    // Ajuste: usar Lax em vez de Strict para cloudflared
                    const cookieOptions = {
                        expires: 1,
                        path: '/',
                        sameSite: 'lax' as const,
                        secure: window.location.protocol === 'https:'
                    };

                    console.log('🍪 Cookie options:', cookieOptions);
                    Cookies.set('auth_token', response.data.token, cookieOptions);

                    // Verificar se foi salvo
                    const savedCookie = Cookies.get('auth_token');
                    console.log('✔️ Cookie salvo?', savedCookie ? 'SIM' : 'NÃO');
                    console.log('📋 Valor do cookie:', savedCookie ? savedCookie.substring(0, 20) + '...' : 'vazio');
                }

                setStatus('success');
                setMessage('Seu e-mail foi verificado com sucesso! Redirecionando...');

                // Redireciona automaticamente após 2 segundos
                setTimeout(() => {
                    // Usar reload completo para garantir que o contexto seja atualizado
                    window.location.href = '/dashboard';
                }, 2000);

            } catch (error: any) {
                console.error('❌ Erro na verificação:', error);
                setStatus('error');
                setMessage(error.response?.data?.message || 'Falha ao verificar e-mail. O link pode ter expirado.');
            }
        };

        verify();
    }, [token]);

    return (
        <Card className="w-full max-w-md shadow-lg border-0 sm:border bg-card/50 backdrop-blur-sm">
            <CardHeader className="space-y-1 flex flex-col items-center text-center">
                <div className="mb-4">
                    {status === 'loading' && <Loader2 className="h-12 w-12 text-primary animate-spin" />}
                    {status === 'success' && <CheckCircle2 className="h-12 w-12 text-green-500" />}
                    {status === 'error' && <XCircle className="h-12 w-12 text-destructive" />}
                </div>
                <CardTitle className="text-2xl font-bold">
                    {status === 'loading' && 'Verificando...'}
                    {status === 'success' && 'E-mail Verificado!'}
                    {status === 'error' && 'Erro na Verificação'}
                </CardTitle>
                <CardDescription>
                    {message}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {/* Conteúdo adicional se necessário */}
            </CardContent>
            <CardFooter className="flex justify-center">
                <Link href={status === 'success' ? "/dashboard" : "/"}>
                    <Button className="w-full sm:w-auto min-w-[200px]">
                        {status === 'success' ? 'Ir para o Dashboard' : 'Voltar para o Login'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-muted/30">
            <div className="mb-8">
                <Logo className="scale-125" />
            </div>
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin text-primary" />}>
                <VerifyEmailContent />
            </Suspense>
        </div>
    );
}
