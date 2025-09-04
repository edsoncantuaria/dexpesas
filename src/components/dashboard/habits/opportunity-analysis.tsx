// src/components/dashboard/habits/opportunity-analysis.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Rocket, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

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
      <div className="text-center">
        <Button onClick={handleSubmit} disabled={loading} size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent">
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="mr-2 h-4 w-4" />
          )}
          Encontrar Oportunidades
        </Button>
      </div>

      {loading && (
        <div className="flex items-center justify-center space-x-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Buscando potenciais de crescimento...</span>
        </div>
      )}

      {error && (
         <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Erro na Análise</AlertTitle>
            <AlertDescription>
                {error}
            </AlertDescription>
        </Alert>
      )}

      {analysis && (
        <Alert variant="default" className="border-accent/50 bg-accent/5">
            <Rocket className="h-4 w-4 text-accent" />
            <AlertTitle className="text-accent font-headline">Potencial Encontrado!</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap">
              {analysis}
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
