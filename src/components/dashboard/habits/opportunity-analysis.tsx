// src/components/dashboard/habits/opportunity-analysis.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Rocket, Terminal, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { AIInsightCard } from '@/components/dashboard/ai/ai-insight-card';
import { motion, AnimatePresence } from 'framer-motion';

import { handleApiError } from '@/lib/error-handler';

export function OpportunityAnalysis() {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const response = await api.post('/ai/analyze-opportunities');
      setAnalysis(response.data.analysis);
    } catch (err) {
      setError('Não foi possível obter a análise de oportunidades.');
      handleApiError(err, toast, 'Erro na Análise');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!analysis && !loading && (
        <div className="text-center py-8">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
            <TrendingUp className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-lg font-semibold">Potencial de Crescimento</h3>
          <p className="mb-6 text-sm text-muted-foreground max-w-xs mx-auto">
            Descubra oportunidades ocultas para aumentar sua renda e otimizar seus investimentos.
          </p>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            size="lg"
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg shadow-emerald-500/20"
          >
            <Rocket className="mr-2 h-4 w-4" />
            Encontrar Oportunidades
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
              <div className="absolute inset-0 animate-ping rounded-full bg-emerald-500/20" />
              <div className="relative rounded-full bg-emerald-500/10 p-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="font-medium">Analisando mercado...</p>
              <p className="text-sm text-muted-foreground">Buscando estratégias de crescimento para você.</p>
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
              title="Oportunidades Identificadas"
              content={analysis}
              type="opportunity"
            />
            <div className="flex justify-center pt-4">
              <Button variant="outline" onClick={handleSubmit} size="sm">
                Buscar novas oportunidades
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
