// src/components/dashboard/metas/goal-projection.tsx
'use client';

import { useState } from 'react';
import type { Goal } from '@/lib/definitions';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Sparkles, Wand2 } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const projectionSchema = z.object({
  goalId: z.string().min(1, 'Selecione uma meta para simular.'),
  simulationQuery: z.string().min(10, 'Descreva sua simulação com mais detalhes.'),
});

interface GoalProjectionProps {
  goals: Goal[];
}

interface ProjectionResult {
    newProjectedDate: string;
    analysis: string;
}

export function GoalProjection({ goals }: GoalProjectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ProjectionResult | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof projectionSchema>>({
    resolver: zodResolver(projectionSchema),
    defaultValues: { goalId: '', simulationQuery: '' },
  });

  const onSubmit = async (values: z.infer<typeof projectionSchema>) => {
    setIsLoading(true);
    setResult(null);
    try {
      const response = await api.post('/ai/project-goal', values);
      setResult(response.data);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro na Simulação', description: 'Não foi possível se comunicar com a IA.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="goalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Meta para Simulação</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a meta..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="simulationQuery"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descreva o Cenário</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Ex: E se eu economizar R$ 100 com lazer e investir R$ 50 a mais por mês?"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            {isLoading ? 'Calculando...' : 'Calcular Projeção'}
          </Button>
        </form>
      </Form>
      
      {result && (
        <Alert>
            <Sparkles className='h-4 w-4'/>
            <AlertTitle className='font-bold'>Projeção da IA: {result.newProjectedDate}</AlertTitle>
            <AlertDescription className='mt-2'>
                {result.analysis}
            </AlertDescription>
        </Alert>
      )}

      {goals.length === 0 && (
         <Alert variant="default">
            <AlertDescription>
                Crie uma meta em andamento para poder usar a simulação.
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
