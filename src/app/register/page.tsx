'use client';

import { AuthForm } from '@/components/auth/auth-form';
import { Logo } from '@/components/logo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function RegisterPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-4">
      {/* Dynamic Background */}
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-emerald-400/20 via-background to-background dark:from-emerald-900/20"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0))] opacity-20"></div>

      {/* Decorative Blobs */}
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
          x: [0, 50, 0]
        }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 -right-20 w-96 h-96 bg-teal-500/30 rounded-full blur-3xl filter"
      />
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
          x: [0, -30, 0]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute -bottom-20 -left-20 w-80 h-80 bg-green-500/30 rounded-full blur-3xl filter"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        <div className="flex flex-col items-center gap-6">
          <Link href="/" className="self-start text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Voltar para Login
          </Link>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Logo className="h-20 w-20" />
          </motion.div>
        </div>

        <Card className="border-t border-white/10 shadow-2xl bg-card/60 backdrop-blur-xl ring-1 ring-black/5 dark:ring-white/10">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-2xl font-headline tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
              Crie sua Conta
            </CardTitle>
            <CardDescription className="text-base">
              Comece sua jornada financeira hoje mesmo. É rápido e fácil!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AuthForm type="register" />
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
