// src/components/dashboard/admin/bosses/edit-boss-form.tsx
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import type { Boss } from '@/lib/definitions';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';
import { Switch } from '@/components/ui/switch';

const bossSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  hp: z.coerce.number().int().positive('O HP deve ser um número inteiro positivo.'),
  currentHp: z.coerce.number().int().nonnegative('O HP atual não pode ser negativo.').optional(),
  rewardJson: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "O JSON de recompensa é inválido." }),
  isActive: z.boolean().default(false),
  startAt: z.string().optional().nullable(),
  endAt: z.string().optional().nullable(),
});

type BossFormValues = z.infer<typeof bossSchema>;

interface EditBossFormProps {
    boss?: Boss | null;
    isSubmitting: boolean;
    onSave: (data: Omit<Boss, 'id'>) => void;
}

export function EditBossForm({ boss, isSubmitting, onSave }: EditBossFormProps) {
    const form = useForm<BossFormValues>({
        resolver: zodResolver(bossSchema),
        defaultValues: {
            name: '',
            hp: 100000,
            currentHp: 100000,
            rewardJson: '{\n  "xp": 10000,\n  "items": []\n}',
            isActive: false,
            startAt: null,
            endAt: null,
        },
    });
    
    useEffect(() => {
        if (boss) {
            form.reset({
                ...boss,
                hp: Number(boss.hp), // Garante que é number
                currentHp: Number(boss.currentHp),
                rewardJson: JSON.stringify(boss.rewardJson, null, 2),
                startAt: boss.startAt ? new Date(boss.startAt).toISOString().slice(0, 16) : null,
                endAt: boss.endAt ? new Date(boss.endAt).toISOString().slice(0, 16) : null,
            });
        }
    }, [boss, form]);
    
    const handleSubmit = (values: BossFormValues) => {
        onSave({
            ...values,
            rewardJson: JSON.parse(values.rewardJson),
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                 <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome do Chefe</FormLabel><FormControl><Input placeholder="Ex: A Grande Dívida" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="hp" render={({ field }) => ( <FormItem><FormLabel>HP Total</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    {boss && <FormField control={form.control} name="currentHp" render={({ field }) => ( <FormItem><FormLabel>HP Atual</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>}
                 </div>
                 
                 <FormField control={form.control} name="rewardJson" render={({ field }) => ( <FormItem><FormLabel>Recompensas (JSON)</FormLabel><FormControl><Textarea placeholder='{"xp": 10000, "items": [{"itemId": "clz...", "qty": 1}]}' {...field} rows={6} className="font-mono text-xs" /></FormControl><FormMessage /></FormItem>)}/>
                 
                 <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="startAt" render={({ field }) => ( <FormItem><FormLabel>Início do Evento</FormLabel><FormControl><Input type="datetime-local" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                     <FormField control={form.control} name="endAt" render={({ field }) => ( <FormItem><FormLabel>Fim do Evento</FormLabel><FormControl><Input type="datetime-local" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)}/>
                 </div>

                <FormField control={form.control} name="isActive" render={({ field }) => ( <FormItem className="flex items-center gap-4 pt-2"><FormLabel>Ativar evento agora?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>

                 <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Chefe
                    </Button>
                </div>
            </form>
        </Form>
    );
}
