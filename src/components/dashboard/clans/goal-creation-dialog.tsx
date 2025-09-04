// src/components/dashboard/clans/goal-creation-dialog.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GoalCreationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clanId: string;
  onSuccess: () => void;
}

const formSchema = z.object({
  name: z.string().min(3, 'O nome da meta é obrigatório.'),
  targetAmount: z.coerce.number().positive('O valor alvo deve ser positivo.'),
  deadline: z.date().optional(),
});

export function GoalCreationDialog({ isOpen, onClose, clanId, onSuccess }: GoalCreationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', targetAmount: 0 },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await api.post(`/familia/${clanId}/goals`, values);
      toast({ title: 'Meta da família criada com sucesso!' });
      onSuccess();
      onClose();
      form.reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao criar meta', description: error.response?.data?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Meta para a Família</DialogTitle>
          <DialogDescription>Defina um objetivo financeiro para todos trabalharem juntos.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome da Meta</FormLabel><FormControl><Input placeholder="Ex: Viagem de Fim de Ano" {...field} /></FormControl><FormMessage /></FormItem> )}/>
            <div className="grid grid-cols-2 gap-4">
                 <FormField control={form.control} name="targetAmount" render={({ field }) => ( <FormItem><FormLabel>Valor Alvo</FormLabel><FormControl><CurrencyInput value={field.value} onValueChange={field.onChange} /></FormControl><FormMessage /></FormItem> )}/>
                 <FormField control={form.control} name="deadline" render={({ field }) => (<FormItem className="flex flex-col"><FormLabel>Prazo (Opcional)</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}>{field.value ? (format(field.value, 'PPP', { locale: ptBR })) : (<span>Escolha uma data</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Meta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
