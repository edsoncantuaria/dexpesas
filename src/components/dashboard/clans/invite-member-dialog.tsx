// src/components/dashboard/clans/invite-member-dialog.tsx
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
import { Loader2 } from 'lucide-react';

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clanId: string;
}

const formSchema = z.object({
  invitedUserId: z.string().min(1, 'O ID do jogador é obrigatório.'),
});

export function InviteMemberDialog({ isOpen, onClose, clanId }: InviteMemberDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { invitedUserId: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      await api.post(`/familia/${clanId}/invite`, values);
      toast({ title: 'Convite Enviado!', description: 'O jogador foi notificado sobre o seu convite.' });
      onClose();
      form.reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro ao convidar', description: error.response?.data?.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar para a Família</DialogTitle>
          <DialogDescription>
            Peça o ID de Jogador do seu familiar (disponível na página de Perfil dele) e cole abaixo para enviar um convite.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="invitedUserId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ID do Jogador</FormLabel>
                  <FormControl>
                    <Input placeholder="Cole o ID aqui..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar Convite
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
