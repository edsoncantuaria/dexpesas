'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    ResponsiveDialog,
} from '@/components/ui/responsive-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { handleApiError } from '@/lib/error-handler';

const deleteAccountSchema = z.object({
    currentPassword: z.string().min(1, 'Digite sua senha para confirmar.'),
});

interface DeleteAccountDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DeleteAccountDialog({ open, onOpenChange }: DeleteAccountDialogProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm<z.infer<typeof deleteAccountSchema>>({
        resolver: zodResolver(deleteAccountSchema),
        defaultValues: {
            currentPassword: '',
        },
    });

    const onSubmit = async (data: z.infer<typeof deleteAccountSchema>) => {
        setIsDeleting(true);
        try {
            await api.delete('/auth/account', {
                data: { currentPassword: data.currentPassword }
            });

            toast({
                title: 'Conta excluída',
                description: 'Sua conta foi excluída com sucesso.',
            });

            // Remove o token e redireciona para login
            localStorage.removeItem('token');
            router.push('/login');

        } catch (error) {
            handleApiError(error, toast, 'Erro ao excluir conta');
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (!isDeleting) {
            form.reset();
            onOpenChange(false);
        }
    };

    return (
        <ResponsiveDialog
            isOpen={open}
            setIsOpen={onOpenChange}
            title="Excluir Conta"
            description="Esta ação não pode ser desfeita"
        >
            <div className="space-y-4 py-4">
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                    <p className="text-sm font-medium text-destructive">
                        ⚠️ Atenção: Esta ação é permanente
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                        <li>Sua conta será desativada permanentemente</li>
                        <li>Seu usuário e email serão removidos do sistema</li>
                        <li>Você não poderá mais fazer login</li>
                        <li>Não será possível recuperar esta conta</li>
                    </ul>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Digite sua senha para confirmar</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="password"
                                            placeholder="Senha atual"
                                            disabled={isDeleting}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isDeleting}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={isDeleting}
                            >
                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Excluir Minha Conta
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </ResponsiveDialog>
    );
}
