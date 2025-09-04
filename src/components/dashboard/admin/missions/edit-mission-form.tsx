// src/components/dashboard/admin/missions/edit-mission-form.tsx
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import type { Mission, Item } from '@/lib/definitions';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const missionSchema = z.object({
  title: z.string().min(5, 'O título deve ter pelo menos 5 caracteres.').max(100),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.').max(255),
  scope: z.enum(['USER', 'GUILD']).default('USER'),
  xpReward: z.coerce.number().int().positive('A recompensa de XP deve ser um número positivo.'),
  itemRewardId: z.string().optional().nullable(),
  minLevel: z.coerce.number().int().min(1).default(1),
  triggerSpec: z.string().refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, { message: 'O JSON do gatilho é inválido.'}),
  isRepeatable: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

type MissionFormValues = z.infer<typeof missionSchema>;

interface EditMissionFormProps {
    mission?: Mission | null;
    items: Item[];
    isSubmitting: boolean;
    onSave: (data: Omit<Mission, 'id' | 'requiredClass'> & { triggerSpec: any }) => void;
}

export function EditMissionForm({ mission, items, isSubmitting, onSave }: EditMissionFormProps) {
    const form = useForm<MissionFormValues>({
        resolver: zodResolver(missionSchema),
        defaultValues: {
            title: '',
            description: '',
            scope: 'USER',
            xpReward: 10,
            itemRewardId: null,
            minLevel: 1,
            triggerSpec: '{"type": "TRANSACTION_CREATED", "count": 5}',
            isRepeatable: false,
            isActive: true,
        },
    });
    
    useEffect(() => {
        if (mission) {
            form.reset({
                ...mission,
                triggerSpec: JSON.stringify(mission.triggerSpec, null, 2),
            });
        }
    }, [mission, form]);
    
    const handleSubmit = (values: MissionFormValues) => {
        onSave({
            ...values,
            triggerSpec: JSON.parse(values.triggerSpec),
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                 <FormField control={form.control} name="title" render={({ field }) => ( <FormItem><FormLabel>Título</FormLabel><FormControl><Input placeholder="Ex: Mestre das Transações" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 <FormField control={form.control} name="description" render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea placeholder="Descreva o objetivo da missão para o jogador." {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="xpReward" render={({ field }) => ( <FormItem><FormLabel>Recompensa (XP)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="minLevel" render={({ field }) => ( <FormItem><FormLabel>Nível Mínimo</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 </div>

                <FormField control={form.control} name="itemRewardId" render={({ field }) => ( 
                    <FormItem><FormLabel>Recompensa (Item)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Nenhum item como recompensa" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="">Nenhum</SelectItem>
                                {items.map(item => <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    <FormMessage /></FormItem>)}/>

                <FormField control={form.control} name="scope" render={({ field }) => ( 
                    <FormItem><FormLabel>Escopo da Missão</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="USER">Individual</SelectItem>
                                <SelectItem value="GUILD">Guilda / Clã</SelectItem>
                            </SelectContent>
                        </Select>
                    <FormMessage /></FormItem>)}/>
                 
                 <FormField control={form.control} name="triggerSpec" render={({ field }) => ( <FormItem><FormLabel>Gatilho (JSON)</FormLabel><FormControl><Textarea placeholder='{"type": "TRANSACTION_CREATED", "count": 5}' {...field} rows={4} className="font-mono text-xs" /></FormControl><FormDescription>Ex: Completar ao criar 5 transações.</FormDescription><FormMessage /></FormItem>)}/>
                 
                 <div className="flex items-center gap-8">
                     <FormField control={form.control} name="isRepeatable" render={({ field }) => ( <FormItem className="flex items-center gap-2"><FormLabel>Repetível?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
                     <FormField control={form.control} name="isActive" render={({ field }) => ( <FormItem className="flex items-center gap-2"><FormLabel>Ativa?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
                 </div>

                 <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Missão
                    </Button>
                </div>
            </form>
        </Form>
    );
}
