'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CategorizationRule, Category } from '@/lib/definitions';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Loader2, Wand2, ArrowRight, Search, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { CloudiveLoading } from '@/components/brand/cloudive-loading';

const ruleSchema = z.object({
  keyword: z.string().min(3, 'A palavra-chave deve ter pelo menos 3 caracteres.'),
  categoryId: z.string().min(1, 'Você deve selecionar uma categoria.'),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

function AddRuleForm({ categories, onSave, isSaving }: { categories: Category[], onSave: (values: RuleFormValues) => void, isSaving: boolean }) {
  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: { keyword: '', categoryId: '' },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        <FormField
          control={form.control}
          name="keyword"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Quando a despesa contiver:</FormLabel>
              <FormControl>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Ex: Netflix, Uber, iFood..." className="pl-9 h-12 text-lg" {...field} />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-center">
          <ArrowRight className="h-6 w-6 text-muted-foreground rotate-90 sm:rotate-0" />
        </div>

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">Categorizar automaticamente como:</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 text-lg">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSaving} size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando automação...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Criar Regra Mágica
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function RegrasPage() {
  const [rules, setRules] = useState<CategorizationRule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAllAlertOpen, setIsDeleteAllAlertOpen] = useState(false);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [rulesRes, catRes] = await Promise.all([
        api.get('/rules/categorization'),
        api.get('/categories'),
      ]);
      setRules(rulesRes.data);
      setCategories(catRes.data.filter((c: Category) => c.type === 'despesa'));
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao buscar dados' });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSaveRule = async (values: RuleFormValues) => {
    const existingRule = rules.find(
      (rule) => rule.keyword.toLowerCase() === values.keyword.toLowerCase()
    );

    if (existingRule) {
      toast({
        variant: 'destructive',
        title: 'Palavra-chave duplicada',
        description: `A palavra-chave "${existingRule.keyword}" já está sendo usada na categoria "${existingRule.category.label}".`,
      });
      return;
    }

    setIsSaving(true);
    try {
      await api.post('/rules/categorization', values);
      toast({
        title: 'Automação criada!',
        description: `Agora "${values.keyword}" será categorizado automaticamente.`,
        className: "bg-gradient-to-r from-emerald-500/10 to-green-500/5 border-emerald-500/20"
      });
      fetchData();
      setIsFormOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao salvar regra' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    const originalRules = [...rules];
    setRules((prev) => prev.filter((rule) => rule.id !== ruleId));

    try {
      await api.delete(`/rules/categorization/${ruleId}`);
      toast({ title: 'Regra removida.' });
    } catch (error) {
      setRules(originalRules);
      toast({ variant: 'destructive', title: 'Erro ao remover regra' });
    }
  };

  const handleDeleteAllRules = async () => {
    setIsSaving(true);
    try {
      const response = await api.delete('/rules/categorization');
      toast({ title: 'Todas as regras foram removidas.' });
      fetchData();
      setIsDeleteAllAlertOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao excluir regras' });
    } finally {
      setIsSaving(false);
    }
  };


  if (isLoading) {
    return <CloudiveLoading withSkeleton={true} fullscreen={false} />;
  }

  return (
    <>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary ring-1 ring-inset ring-primary/20">
                <Wand2 className="h-4 w-4" />
                <span>Automação Inteligente</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-headline bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                Regras de Categorização
              </h1>
              <p className="text-muted-foreground max-w-xl text-lg">
                Ensine o Dexpesas a organizar suas finanças automaticamente. Crie regras baseadas em palavras-chave.
              </p>
            </div>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/20 rounded-full px-8">
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Nova Automação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-headline flex items-center gap-2">
                    <Wand2 className="h-6 w-6 text-primary" />
                    Nova Regra Mágica
                  </DialogTitle>
                  <DialogDescription>
                    Configure o fluxo de automação abaixo.
                  </DialogDescription>
                </DialogHeader>
                <AddRuleForm categories={categories} onSave={handleSaveRule} isSaving={isSaving} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Decorative BG */}
          <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent" />
        </div>

        {/* Rules Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Regras Ativas ({rules.length})
            </h2>
            {rules.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setIsDeleteAllAlertOpen(true)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar tudo
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {rules.length > 0 ? (
                rules.map((rule) => (
                  <motion.div
                    key={rule.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="group overflow-hidden hover:shadow-md transition-all border-l-4 border-l-primary/50">
                      <CardContent className="p-5 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Search className="h-3 w-3" />
                            <span>Contém:</span>
                          </div>
                          <p className="font-bold text-lg truncate" title={rule.keyword}>"{rule.keyword}"</p>

                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-4 w-4 text-muted-foreground/50" />
                            <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                              {rule.category.label}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-12 text-center space-y-4 border-2 border-dashed rounded-3xl bg-muted/20"
                >
                  <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <Wand2 className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold">Nenhuma automação criada</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                      Crie sua primeira regra para que o Dexpesas categorize suas transações automaticamente.
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setIsFormOpen(true)}>
                    Começar agora
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AlertDialog open={isDeleteAllAlertOpen} onOpenChange={setIsDeleteAllAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir todas as automações?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente todas as suas regras. Suas transações futuras não serão mais categorizadas automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDeleteAllRules} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sim, excluir tudo
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
