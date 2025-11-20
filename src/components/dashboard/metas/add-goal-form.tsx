

// src/components/dashboard/metas/add-goal-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Goal, Account } from '@/lib/definitions';
import { useState, useEffect } from 'react';
import { Loader2, Calendar as CalendarIcon, Image } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CurrencyInput } from '@/components/ui/currency-input';
import { FileUpload } from '@/components/ui/file-upload';
import { AttachmentPreviewer } from '@/components/ui/attachment-previewer';

const formSchema = z.object({
  name: z.string().min(3, { message: 'O nome da meta deve ter pelo menos 3 caracteres.' }),
  targetAmount: z.coerce.number().positive({ message: 'O valor alvo deve ser positivo.' }),
  deadline: z.date().optional().nullable(),
  accountId: z.string().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
});

type AddGoalFormProps = {
  goal?: Goal | null;
  accounts: Account[];
  onSuccess: (goal: Omit<Goal, 'id' | 'userId' | 'currentAmount' | 'status' | 'contributions' | 'projectionDate'> & { id?: string }) => void;
  onClose: () => void;
  isSubmitting: boolean;
};

export function AddGoalForm({ goal, accounts, onSuccess, onClose, isSubmitting }: AddGoalFormProps) {
  const isEditing = !!goal;
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      deadline: null,
      accountId: 'none',
      imageUrl: null,
    },
  });

  useEffect(() => {
    if (goal) {
      form.reset({
        name: goal.name,
        targetAmount: Number(goal.targetAmount),
        deadline: goal.deadline ? new Date(goal.deadline) : null,
        accountId: (goal as any).accountId || 'none',
        imageUrl: goal.imageUrl,
      });
    }
  }, [goal, form]);


  function onSubmit(values: z.infer<typeof formSchema>) {
    const dataToSend = {
      ...values,
      id: goal?.id,
      accountId: values.accountId === 'none' ? null : values.accountId,
    };
    onSuccess(dataToSend);
  }

  const watchImageUrl = form.watch('imageUrl');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Objetivo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: Viagem para o Japão" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="targetAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor Alvo</FormLabel>
                <FormControl>
                  <CurrencyInput value={field.value} onValueChange={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data Alvo (Opcional)</FormLabel>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal h-10',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: ptBR })
                        ) : (
                          <span>Escolha uma data</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ?? undefined}
                      onSelect={(date) => {
                        field.onChange(date);
                        setIsCalendarOpen(false);
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="accountId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Vincular a uma Conta (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} value={field.value ?? 'none'}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a conta de poupança/investimento" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {accounts.filter(a => ['poupanca', 'investimento'].includes(a.tipo)).map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.nome} ({acc.tipo})
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
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Imagem do Objetivo (Opcional)</FormLabel>
              <FormControl>
                <div>
                  {watchImageUrl && !watchImageUrl.startsWith('http') ? (
                    <AttachmentPreviewer
                      objectName={watchImageUrl}
                      onRemove={() => form.setValue('imageUrl', null)}
                    />
                  ) : (
                    <div className='flex items-center gap-2'>
                      <Input placeholder="Cole uma URL ou faça upload" {...field} value={field.value ?? ''} />
                      <FileUpload
                        onValueChange={(objectName) => field.onChange(objectName)}
                        options={{
                          maxFiles: 1,
                          accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] },
                        }}
                      >
                        <Button type="button" variant="outline" size="icon" asChild>
                          <div><Image className="h-4 w-4" /></div>
                        </Button>
                      </FileUpload>
                    </div>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />


        <div className="flex justify-end pt-4 gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Criar Objetivo'}
          </Button>
        </div>
      </form>
    </Form>
  );
}

