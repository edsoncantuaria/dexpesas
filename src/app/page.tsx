'use client';

import { AuthForm } from '@/components/auth/auth-form';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

export default function LoginPage() {
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

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        <div className="flex justify-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Logo className="h-32 w-auto" />
          </motion.div>
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
    </main>
  );
}
