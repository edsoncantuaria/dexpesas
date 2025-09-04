// src/app/dashboard/habitos/page.tsx
'use client';

import { BrainCircuit, Rocket } from 'lucide-react';
import { HabitAnalysis } from '@/components/dashboard/habits/habit-analysis';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { OpportunityAnalysis } from '@/components/dashboard/habits/opportunity-analysis';

export default function HabitosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Descoberta de Hábitos com IA</h1>
        <p className="text-muted-foreground">
          Use a inteligência artificial para otimizar sua jornada financeira.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                  <BrainCircuit className="h-8 w-8 text-primary" />
              </div>
              <div>
                  <CardTitle>Análise de Hábitos de Consumo</CardTitle>
                  <CardDescription>Descubra quais hábitos estão custando mais pontos e receba dicas.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <HabitAnalysis />
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-full">
                  <Rocket className="h-8 w-8 text-accent" />
              </div>
              <div>
                  <CardTitle>Análise de Oportunidades</CardTitle>
                  <CardDescription>Identifique seus pontos fortes e acelere seu crescimento financeiro.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <OpportunityAnalysis />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
