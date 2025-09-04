// src/components/dashboard/admin/items/edit-item-form.tsx
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import type { Item } from '@/lib/definitions';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const itemSchema = z.object({
  key: z.string().min(3, 'A chave deve ter pelo menos 3 caracteres.').regex(/^[a-z0-9_]+$/, 'Use apenas letras minúsculas, números e underlines.'),
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.').max(50),
  type: z.enum(['consumable', 'cosmetic', 'bonus']),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']).optional(),
  bonusJson: z.string().refine((val) => {
    if (!val) return true; // Permite campo vazio
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, { message: "O JSON de bônus é inválido."}).optional(),
});

type ItemFormValues = z.infer<typeof itemSchema>;

interface EditItemFormProps {
    item?: Item | null;
    isSubmitting: boolean;
    onSave: (data: Omit<Item, 'id' | 'bonusJson'> & { bonusJson?: any }) => void;
}

export function EditItemForm({ item, isSubmitting, onSave }: EditItemFormProps) {
    const form = useForm<ItemFormValues>({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            key: '',
            name: '',
            type: 'consumable',
            rarity: 'common',
            bonusJson: '',
        },
    });
    
    useEffect(() => {
        if (item) {
            form.reset({
                ...item,
                bonusJson: item.bonusJson ? JSON.stringify(item.bonusJson, null, 2) : '',
            });
        }
    }, [item, form]);
    
    const handleSubmit = (values: ItemFormValues) => {
        onSave({
            ...values,
            bonusJson: values.bonusJson ? JSON.parse(values.bonusJson) : undefined,
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                 <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nome do Item</FormLabel><FormControl><Input placeholder="Ex: Poção de Sorte" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                 <FormField control={form.control} name="key" render={({ field }) => ( <FormItem><FormLabel>Chave Única (ID)</FormLabel><FormControl><Input placeholder="ex: pocao_sorte_1" {...field} /></FormControl><FormMessage /></FormItem>)}/>

                 <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="type" render={({ field }) => ( <FormItem><FormLabel>Tipo</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="consumable">Consumível</SelectItem><SelectItem value="cosmetic">Cosmético</SelectItem><SelectItem value="bonus">Bônus</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                     <FormField control={form.control} name="rarity" render={({ field }) => ( <FormItem><FormLabel>Raridade</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="common">Comum</SelectItem><SelectItem value="rare">Raro</SelectItem><SelectItem value="epic">Épico</SelectItem><SelectItem value="legendary">Lendário</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                 </div>
                 
                 <FormField control={form.control} name="bonusJson" render={({ field }) => ( <FormItem><FormLabel>Bônus (JSON)</FormLabel><FormControl><Textarea placeholder='{"xpMultiplier": 1.1}' {...field} rows={4} className="font-mono text-xs" /></FormControl><FormMessage /></FormItem>)}/>
                 
                 <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Item
                    </Button>
                </div>
            </form>
        </Form>
    );
}
