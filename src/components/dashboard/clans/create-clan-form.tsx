// src/components/dashboard/clans/create-clan-form.tsx
'use client';

import { useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Image as ImageIcon } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from '@/components/ui/file-upload';
import { AttachmentPreviewer } from '@/components/ui/attachment-previewer';
import type { Clan } from '@/lib/definitions';

const clanSchema = z.object({
  name: z.string().min(3, 'O nome deve ter pelo menos 3 caracteres.').max(50, 'Máximo de 50 caracteres.'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres.').max(200, 'Máximo de 200 caracteres.'),
  iconUrl: z.string().optional().nullable(),
});

type ClanFormValues = z.infer<typeof clanSchema>;

interface CreateClanFormProps {
    onSuccess: (clanId: string) => void;
    clan?: Clan | null;
}

export function CreateClanForm({ onSuccess, clan }: CreateClanFormProps) {
    const { toast } = useToast();
    const isEditing = !!clan;

    const form = useForm<ClanFormValues>({
        resolver: zodResolver(clanSchema),
        defaultValues: { name: '', description: '', iconUrl: null },
    });

    useEffect(() => {
        if (isEditing && clan) {
            form.reset({
                name: clan.name,
                description: clan.description,
                iconUrl: clan.iconUrl,
            });
        }
    }, [isEditing, clan, form]);

    const onSubmit: SubmitHandler<ClanFormValues> = async (data) => {
        form.clearErrors();
        const method = isEditing ? 'patch' : 'post';
        const url = isEditing ? `/familia/${clan.id}` : '/familia';
        
        try {
            const response = await api[method](url, data);
            const clanId = response.data.id || clan?.id;
            toast({ title: `Família ${isEditing ? 'atualizada' : 'criada'} com sucesso!` });
            onSuccess(clanId);
        } catch (error: any) {
            const message = error.response?.data?.message || 'Tente novamente.';
            toast({ variant: 'destructive', title: `Erro ao ${isEditing ? 'atualizar' : 'criar'} família`, description: message });
        }
    };
    
    const watchIconUrl = form.watch('iconUrl');

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                    control={form.control}
                    name="iconUrl"
                    render={({ field }) => (
                        <FormItem className="flex flex-col items-center">
                            <FormLabel>Ícone da Família (Opcional)</FormLabel>
                            <FormControl>
                                <div className="w-24 h-24 rounded-full border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden">
                                {watchIconUrl ? (
                                    <AttachmentPreviewer
                                        objectName={watchIconUrl}
                                        onRemove={() => form.setValue('iconUrl', null, { shouldDirty: true })}
                                        isAvatar
                                    />
                                ) : (
                                    <FileUpload
                                        onValueChange={(objectName) => field.onChange(objectName)}
                                        options={{ maxFiles: 1, accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] } }}
                                    >
                                        <button type="button" className="flex flex-col items-center justify-center w-full h-full text-muted-foreground hover:text-primary">
                                            <ImageIcon className="h-8 w-8" />
                                            <span className="text-xs mt-1">Enviar</span>
                                        </button>
                                    </FileUpload>
                                )}
                                </div>
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nome da Família</FormLabel>
                            <FormControl>
                                <Input placeholder="Ex: Família Silva" {...field} />
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
                                <Textarea placeholder="Uma breve descrição sobre os objetivos da sua família..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                        {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? 'Salvar Alterações' : 'Fundar Família'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
