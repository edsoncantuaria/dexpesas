// src/components/dashboard/orcamentos/add-budget-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Budget, Category, User } from '@/lib/definitions';
import { useEffect, useState } from 'react';
import { Loader2, Sparkles, Info } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { motion } from 'framer-motion';
import { handleApiError } from '@/lib/error-handler';

type AddBudgetFormProps = {
  budget?: Budget | null;
  categories: Category[];
  budgetsForMonth: Budget[];
  onSuccess: (budget: Omit<Budget, 'id' | 'userId' | 'month' | 'spent' | 'category' | 'originalLimit' | 'rolloverAmount'> & { id?: string }) => void;
  onClose: () => void;
  isSubmitting: boolean;
  user: User | null;
};

export function AddBudgetForm({ budget, categories, budgetsForMonth, onSuccess, onClose, isSubmitting, user }: AddBudgetFormProps) {
  const isEditing = !!budget;
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestion, setSuggestion] = useState<{ amount: number; justification: string } | null>(null);
  const { toast } = useToast();

  const formSchema = z.object({
    limit: z.coerce.number().positive({ message: 'O limite deve ser um número positivo.' }),
    categoryId: z.string({ required_error: 'Selecione uma categoria.' }).min(1, 'Selecione uma categoria'),
    rollover: z.boolean().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      limit: 0,
      categoryId: '',
      rollover: false,
    },
  });

  useEffect(() => {
    if (isEditing && budget) {
      form.reset({
        limit: budget.originalLimit,
        categoryId: budget.categoryId,
        rollover: budget.rollover,
      });
    } else {
      form.reset({
        limit: 0,
        categoryId: '',
        rollover: false,
      })
    }
  }, [budget, isEditing, form]);

  const handleSuggestBudget = async () => {
    const categoryId = form.getValues('categoryId');
    if (!categoryId) {
      toast({ variant: 'destructive', title: 'Selecione uma categoria primeiro.' });
      return;
    }

    setIsSuggesting(true);
    setSuggestion(null);
    try {
      const categoryName = categories.find(c => c.id === categoryId)?.nome;
      const response = await api.post('/ai/suggest-budget', { categoryId, categoryName });
      const { suggestedAmount, justification } = response.data;

      form.setValue('limit', suggestedAmount, { shouldValidate: true, shouldDirty: true });
      setSuggestion({ amount: suggestedAmount, justification });

      toast({ title: "Sugestão da IA aplicada!", description: `Valor de ${suggestedAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} sugerido.` });

    } catch (error) {
      handleApiError(error, toast, "Erro na IA");
    } finally {
      setIsSuggesting(false);
    }
  };


  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isEditing) {
      const isDuplicate = budgetsForMonth.some(b => b.categoryId === values.categoryId);
      if (isDuplicate) {
        form.setError('categoryId', { message: 'Já existe um orçamento para esta categoria neste mês.' });
        return;
      }
    }
    const budgetData = isEditing ? { ...values, id: budget.id } : values;
    onSuccess(budgetData);
  }

  const categoryLabel = isEditing ? budget?.category?.label || budget?.category?.nome : '';

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

        {isEditing ? (
          <FormItem>
            <FormLabel className="text-sm font-medium text-muted-foreground">Categoria</FormLabel>
            <FormControl>
              <Input value={categoryLabel} disabled className="bg-muted/50" />
            </FormControl>
          </FormItem>
        ) : (
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-muted-foreground">Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Selecione uma categoria para orçar" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.filter(c => !budgetsForMonth.some(b => b.categoryId === c.id)).map((cat) => (
                      <SelectItem
                        key={cat.id}
                        value={cat.id}
                      >
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}


        <FormField
          control={form.control}
          name="limit"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center mb-2">
                <FormLabel className="text-sm font-medium text-muted-foreground">Limite de Gasto Mensal</FormLabel>
                {user?.enableBudgetSuggestion && !isEditing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSuggestBudget}
                    disabled={isSuggesting || !form.watch('categoryId')}
                    className="h-8 text-xs"
                  >
                    {isSuggesting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                    Sugerir com IA
                  </Button>
                )}
              </div>
              <FormControl>
                <div className="relative">
                  <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    className="text-center py-6 px-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20"
                  >
                    <CurrencyInput
                      value={field.value}
                      onValueChange={field.onChange}
                      className="text-4xl font-bold text-center bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </motion.div>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Alert className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <Sparkles className="h-4 w-4" />
              <AlertDescription className="text-sm">
                {suggestion.justification}
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <FormField
          control={form.control}
          name="rollover"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-xl border bg-card/50 p-4 shadow-sm">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <FormLabel className="text-sm font-medium">Acumular saldo para o próximo mês?</FormLabel>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild><button type="button"><Info className="h-4 w-4 text-muted-foreground" /></button></TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Se ativado, o valor que sobrar (ou faltar) <br />deste orçamento será somado ao do próximo mês.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />


        <div className="flex justify-end pt-4 gap-3">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="min-w-[140px]">
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Orçamento'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
