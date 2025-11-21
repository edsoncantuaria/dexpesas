import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Achievement } from '@/lib/definitions';
import { useEffect } from 'react';

const formSchema = z.object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    description: z.string().min(5, 'Descrição deve ter pelo menos 5 caracteres'),
    icon: z.string().min(1, 'Ícone é obrigatório'),
    xp: z.coerce.number().min(1, 'XP deve ser maior que 0'),
    trigger: z.string().min(1, 'Gatilho é obrigatório'),
    criteria: z.string().optional(), // JSON string
});

interface EditAchievementFormProps {
    achievement: Achievement | null;
    isSubmitting: boolean;
    onSave: (data: any) => void;
}

const TRIGGER_OPTIONS = [
    { value: 'TRANSACTION_CREATED', label: 'Transação Criada' },
    { value: 'BUDGET_CREATED', label: 'Orçamento Criado' },
    { value: 'GOAL_COMPLETED', label: 'Meta Completada' },
    { value: 'BILL_PAID', label: 'Conta Paga' },
    { value: 'INVESTMENT_MADE', label: 'Investimento Realizado' },
];

export function EditAchievementForm({ achievement, isSubmitting, onSave }: EditAchievementFormProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            icon: 'Trophy',
            xp: 100,
            trigger: 'TRANSACTION_CREATED',
            criteria: '{}',
        },
    });

    useEffect(() => {
        if (achievement) {
            form.reset({
                name: achievement.name,
                description: achievement.description,
                icon: achievement.icon,
                xp: achievement.xp,
                trigger: achievement.trigger || 'TRANSACTION_CREATED',
                criteria: achievement.criteria ? JSON.stringify(achievement.criteria, null, 2) : '{}',
            });
        } else {
            form.reset({
                name: '',
                description: '',
                icon: 'Trophy',
                xp: 100,
                trigger: 'TRANSACTION_CREATED',
                criteria: '{}',
            });
        }
    }, [achievement, form]);

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        try {
            const criteriaJson = values.criteria ? JSON.parse(values.criteria) : null;
            onSave({ ...values, criteria: criteriaJson });
        } catch (e) {
            form.setError('criteria', { message: 'JSON inválido' });
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da Conquista</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Mestre da Poupança" {...field} />
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
                                <Textarea placeholder="Ex: Economize R$ 1000 em um mês" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
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

                    <FormField
                        control={form.control}
                        name="icon"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Ícone (Lucide ou Upload)</FormLabel>
                                <div className="flex gap-2">
                                    <FormControl>
                                        <Input placeholder="Ex: Trophy, Star..." {...field} />
                                    </FormControl>
                                    <div className="relative">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        form.setValue('icon', reader.result as string);
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        <Button type="button" variant="outline" size="icon">
                                            <span className="sr-only">Upload</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-upload h-4 w-4"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" /></svg>
                                        </Button>
                                    </div>
                                </div>
                                <FormDescription>
                                    Nome do ícone Lucide ou upload de imagem.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="trigger"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Gatilho (Evento)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione um gatilho" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {TRIGGER_OPTIONS.map((opt) => (
                                        <SelectItem key={opt.value} value={opt.value}>
                                            {opt.label}
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
                    name="criteria"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Critérios (JSON)</FormLabel>
                            <FormControl>
                                <Textarea
                                    className="font-mono text-xs"
                                    rows={5}
                                    placeholder='{ "type": "count", "min": 10 }'
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>
                                Ex: {`{ "type": "count", "entity": "transaction", "min": 50 }`} ou {`{ "type": "amount", "min": 1000 }`}
                            </FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Salvando...' : 'Salvar Conquista'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
