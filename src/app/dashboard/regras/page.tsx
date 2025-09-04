// src/app/dashboard/regras/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CategorizationRule, Category } from '@/lib/definitions';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { LoadingScreen } from '@/components/ui/loading-screen';
import { Button } from '@/components/ui/button';
import { BookText, PlusCircle, Trash2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
        <FormField
          control={form.control}
          name="keyword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Palavra-chave</FormLabel>
              <FormControl>
                <Input placeholder="Ex: iFood, Uber, Netflix" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoria a ser aplicada</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
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
            <Button type="submit" disabled={isSaving}>
                {isSaving ? 'Salvando...' : 'Salvar Regra'}
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
      toast({ title: 'Regra salva com sucesso!' });
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
      toast({ title: 'Regra removida.', variant: 'destructive' });
    } catch (error) {
      setRules(originalRules);
      toast({ variant: 'destructive', title: 'Erro ao remover regra' });
    }
  };

  const handleDeleteAllRules = async () => {
      setIsSaving(true);
      try {
          const response = await api.delete('/rules/categorization');
          toast({ title: 'Sucesso!', description: response.data.message });
          fetchData(); // Recarrega a lista vazia
          setIsDeleteAllAlertOpen(false);
      } catch (error) {
          toast({ variant: 'destructive', title: 'Erro ao excluir regras' });
      } finally {
          setIsSaving(false);
      }
  };


  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <BookText className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-headline">Regras de Categorização</h1>
            <p className="text-muted-foreground">Automatize a organização das suas despesas.</p>
          </div>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
                 <Button variant="outline" className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nova Regra
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Criar Nova Regra de Categorização</DialogTitle>
                    <DialogDescription>
                        Se a descrição de uma nova despesa contiver a palavra-chave, a categoria selecionada será aplicada automaticamente.
                    </DialogDescription>
                </DialogHeader>
                <AddRuleForm categories={categories} onSave={handleSaveRule} isSaving={isSaving} />
            </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Suas Regras</CardTitle>
          <CardDescription>
            Aqui estão todas as regras de categorização que você configurou.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Palavra-chave</TableHead>
                <TableHead>Categoria Aplicada</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length > 0 ? (
                rules.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">"{rule.keyword}"</TableCell>
                    <TableCell>
                      <Badge variant="outline">{rule.category.label}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    Nenhuma regra criada ainda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {rules.length > 0 && (
             <CardFooter className="border-t pt-6">
                <Button variant="destructive" onClick={() => setIsDeleteAllAlertOpen(true)} disabled={isSaving}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover Todas as Regras
                </Button>
             </CardFooter>
        )}
      </Card>
    </div>

    <AlertDialog open={isDeleteAllAlertOpen} onOpenChange={setIsDeleteAllAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso irá excluir permanentemente todas as suas
                    regras de categorização personalizadas.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                 <AlertDialogAction asChild>
                    <Button variant="destructive" onClick={handleDeleteAllRules} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                        Sim, excluir todas
                    </Button>
                 </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
