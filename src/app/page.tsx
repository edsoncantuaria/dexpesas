'use client';

import { useState } from 'react';
import { AuthForm } from '@/components/auth/auth-form';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [showLogin, setShowLogin] = useState(false);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-400/20 via-background to-background dark:from-indigo-900/20"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-20"></div>

      {/* Decorative Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, 90, 0]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-20 -left-20 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl filter"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.5, 0.3],
          rotate: [0, -45, 0]
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl filter"
      />

      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {!showLogin ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full flex flex-col items-center relative z-10"
        >
          <div className="mb-8">
            <Logo className="h-24 w-auto" />
          </div>
          <OnboardingScreen onLoginClick={() => setShowLogin(true)} />
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md mx-auto space-y-6 relative z-10"
        >
          <div className="flex flex-col items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              className="self-start text-muted-foreground hover:text-foreground"
              onClick={() => setShowLogin(false)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Logo className="h-24 w-auto" />
          </div>

          <Card className="border-t border-white/10 shadow-2xl bg-card/60 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
            <CardHeader className="text-center space-y-1">
              <CardTitle className="text-2xl font-headline tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                Bem-vindo de volta!
              </CardTitle>
              <CardDescription className="text-base">
                Entre com seu e-mail ou usuário para acessar sua jornada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AuthForm type="login" />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </main>
  );
}
