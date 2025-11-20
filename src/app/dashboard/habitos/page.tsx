// src/app/dashboard/habitos/page.tsx
'use client';

import { BrainCircuit, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { HabitAnalysis } from '@/components/dashboard/habits/habit-analysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OpportunityAnalysis } from '@/components/dashboard/habits/opportunity-analysis';
import { motion } from 'framer-motion';

export default function HabitosPage() {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8 md:p-12">
        <div className="relative z-10 max-w-2xl space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20"
          >
            <Sparkles className="h-4 w-4" />
            <span>Inteligência Financeira 2.0</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold tracking-tight sm:text-5xl font-headline bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent"
          >
            Insights que geram riqueza
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground"
          >
            Use o poder da inteligência artificial para analisar seus hábitos, encontrar oportunidades ocultas e acelerar sua liberdade financeira.
          </motion.p>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent" />
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full shadow-lg border-primary/10 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <BrainCircuit className="h-32 w-32" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <BrainCircuit className="h-5 w-5 text-primary" />
                Raio-X de Consumo
              </CardTitle>
              <CardDescription>
                Análise profunda dos seus padrões de gastos para identificar desperdícios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HabitAnalysis />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full shadow-lg border-emerald-500/10 overflow-hidden group hover:shadow-xl transition-all duration-300">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="h-32 w-32 text-emerald-500" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Zap className="h-5 w-5 text-emerald-500" />
                Potencial de Crescimento
              </CardTitle>
              <CardDescription>
                Identifique oportunidades de renda extra e otimização de investimentos.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OpportunityAnalysis />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
