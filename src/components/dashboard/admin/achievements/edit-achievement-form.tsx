// src/components/dashboard/admin/achievements/edit-achievement-form.tsx
'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import type { Achievement } from '@/lib/definitions';
import { Textarea } from '@/components/ui/textarea';
import { useEffect } from 'react';

const achievementSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.'),
  icon: z.string().min(2, 'O nome do ícone (Lucide) é obrigatório.'),
  xp: z.coerce.number().int().positive('O XP deve ser um número inteiro positivo.'),
});

type AchievementFormValues = z.infer<typeof achievementSchema>;

interface EditAchievementFormProps {
    achievement?: Achievement | null;
    isSubmitting: boolean;
    onSave: (data: AchievementFormValues) => void;
}

export function EditAchievementForm({ achievement, isSubmitting, onSave }: EditAchievementFormProps) {
    const form = useForm<AchievementFormValues>({
        resolver: zodResolver(achievementSchema),
        defaultValues: {
            name: '',
            description: '',
            icon: '',
            xp: 10,
        },
    });
    
    useEffect(() => {
        if (achievement) {
            form.reset(achievement);
        }
    }, [achievement, form]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
                 <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da Conquista</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Planejador Mestre" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descrição</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Descreva como o jogador desbloqueia esta conquista." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ícone (Lucide)</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ex: PiggyBank" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name="xp"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Recompensa (XP)</FormLabel>
                                <FormControl>
                                    <Input type="number" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                 </div>

                 <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Conquista
                    </Button>
                </div>
            </form>
        </Form>
    );
}
