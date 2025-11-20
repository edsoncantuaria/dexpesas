// src/components/dashboard/habits/habit-analysis.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, BrainCircuit } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AIInsightCard } from '@/components/dashboard/ai/ai-insight-card';
import { motion, AnimatePresence } from 'framer-motion';

export function HabitAnalysis() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const response = await api.post('/ai/analyze-habits');
      setAnalysis(response.data.analysis);
    } catch (err) {
      setError('Não foi possível obter a análise de hábitos.');
      toast({
        variant: 'destructive',
        title: 'Erro na Análise',
        description: 'Não foi possível se conectar ao serviço de IA.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!analysis && !loading && (
        <div className="text-center py-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
            <BrainCircuit className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Raio-X de Consumo</h3>
          <p className="mb-6 text-sm text-muted-foreground max-w-xs mx-auto">
            Nossa IA analisa seus padrões de gastos para identificar onde você pode economizar sem perder qualidade de vida.
          </p>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20"
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Analisar Meus Hábitos
          </Button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-12 space-y-4 text-center"
          >
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              <div className="relative rounded-full bg-primary/10 p-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Processando seus dados...</p>
              <p className="text-sm text-muted-foreground">A IA está identificando padrões de consumo.</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert variant="destructive">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Erro na Análise</AlertTitle>
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <AIInsightCard
              title="Análise de Hábitos"
              content={analysis}
              type="insight"
            />
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={handleSubmit} size="sm">
                Gerar nova análise
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
