
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Lock, User, Check, ArrowRight } from 'lucide-react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import Cookies from 'js-cookie';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Email ou usuário é obrigatório.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  username: z.string().min(3, 'Usuário deve ter pelo menos 3 caracteres.').regex(/^[a-zA-Z0-9_]+$/, 'Usuário pode conter apenas letras, números e underline.'),
  email: z.string().email('Por favor, insira um email válido.'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres.'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

type AuthFormProps = {
  type: 'login' | 'register';
};

function SubmitButton({ isLoading, type }: { isLoading: boolean, type: 'login' | 'register' }) {
  return (
    <Button
      type="submit"
      className={cn(
        "w-full h-11 font-semibold text-base transition-all duration-300",
        type === 'login'
          ? "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-lg shadow-indigo-500/20"
          : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-500/20"
      )}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
      ) : (
        <span className="flex items-center gap-2">
          {type === 'login' ? 'Fazer login' : 'Concluir Cadastro'}
          <ArrowRight className="h-4 w-4" />
        </span>
      )}
    </Button>
  );
}

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const currentSchema = type === 'login' ? loginSchema : registerSchema;
  type FormValues = z.infer<typeof currentSchema>;

  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormValues>({
    resolver: zodResolver(currentSchema),
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);

    try {
      if (type === 'login') {
        const response = await api.post('/auth/login', data);
        Cookies.set('auth_token', response.data.token, { expires: 1, path: '/', sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
        toast({ title: `Bem-vindo!`, description: 'Login realizado com sucesso.' });

        if (response.data.user.firstOpen) {
          router.push('/welcome');
        } else {
          router.push('/dashboard');
        }
        router.refresh();

      } else {
        const registerResponse = await api.post('/auth/register', data);
        toast({ title: 'Cadastro realizado!', description: 'Sua conta foi criada. Prepare-se para a aventura!' });

        const loginData = { identifier: (data as RegisterValues).email, password: (data as RegisterValues).password };
        const loginResponse = await api.post('/auth/login', loginData);
        Cookies.set('auth_token', loginResponse.data.token, { expires: 1, path: '/', sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
        router.push('/welcome');
        router.refresh();
      }
    } catch (error: any) {
      const message = error.response?.data?.message || `Erro ao ${type === 'login' ? 'entrar' : 'registrar'}. Tente novamente.`;
      toast({
        variant: 'destructive',
        title: `Falha no ${type === 'login' ? 'Login' : 'Cadastro'}`,
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const inputClasses = "h-11 bg-background/50 border-muted-foreground/20 focus:border-primary focus:ring-primary/20 transition-all";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {type === 'register' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <Input id="name" {...register('name' as any)} placeholder="Seu nome completo" className={cn(inputClasses, "pl-10")} />
            </div>
            {errors.name && <p className="text-sm text-destructive">{(errors.name as any).message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Usuário</Label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-muted-foreground font-bold">@</span>
              <Input id="username" {...register('username' as any)} placeholder="seu_usuario" className={cn(inputClasses, "pl-10")} />
            </div>
            {errors.username && <p className="text-sm text-destructive">{(errors.username as any).message}</p>}
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        <Label htmlFor="identifier">{type === 'login' ? 'Email ou Usuário' : 'Email'}</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input
            id="identifier"
            {...register(type === 'login' ? 'identifier' : 'email' as any)}
            type={type === 'register' ? 'email' : 'text'}
            placeholder={type === 'login' ? 'seu@email.com ou usuario' : 'seu@email.com'}
            className={cn(inputClasses, "pl-10")}
          />
        </div>
        {errors.identifier && <p className="text-sm text-destructive">{(errors.identifier as any).message}</p>}
        {type === 'register' && errors.email && <p className="text-sm text-destructive">{(errors.email as any).message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          <Input id="password" type="password" {...register('password' as any)} className={cn(inputClasses, "pl-10")} />
        </div>
        {errors.password && <p className="text-sm text-destructive">{(errors.password as any).message}</p>}
      </div>

      {type === 'register' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-2"
        >
          <Label htmlFor="confirmPassword">Confirmar Senha</Label>
          <div className="relative">
            <Check className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input id="confirmPassword" type="password" {...register('confirmPassword' as any)} className={cn(inputClasses, "pl-10")} />
          </div>
          {errors.confirmPassword && <p className="text-sm text-destructive">{(errors.confirmPassword as any).message}</p>}
        </motion.div>
      )}

      <div className="pt-2">
        <SubmitButton isLoading={isLoading} type={type} />
      </div>

      <div className="mt-4 text-center text-sm text-muted-foreground">
        {type === 'login' ? (
          <>
            Não tem uma conta?{' '}
            <Link href="/register" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Cadastre-se agora
            </Link>
          </>
        ) : (
          <>
            Já tem uma conta?{' '}
            <Link href="/" className="font-semibold text-primary hover:text-primary/80 transition-colors">
              Faça login
            </Link>
          </>
        )}
      </div>
    </form>
  );
}
