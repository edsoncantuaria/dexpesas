// src/components/dashboard/clans/manage-member-dialog.tsx
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Crown, Star, User, Trash2 } from 'lucide-react';
import type { User as UserType } from '@/lib/definitions';
import { MemberAvatar } from './member-avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

type MemberWithRole = {
    userId: string;
    role: 'LEADER' | 'ADMIN' | 'MEMBER';
    user: Partial<UserType>
}

interface ManageMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clanId: string;
  member: MemberWithRole;
  onUpdate: () => void;
}

export function ManageMemberDialog({ isOpen, onClose, clanId, member, onUpdate }: ManageMemberDialogProps) {
  const [newRole, setNewRole] = useState(member.role);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleRoleChange = async () => {
    setIsSaving(true);
    try {
      await api.patch(`/familia/${clanId}/members/${member.userId}/role`, { role: newRole });
      toast({ title: 'Papel atualizado!', description: `${member.user.name} agora é ${newRole}.` });
      onUpdate();
      onClose();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro ao atualizar papel' });
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleRemoveMember = async () => {
    setIsSaving(true);
    try {
      await api.delete(`/familia/${clanId}/members/${member.userId}`);
      toast({ title: 'Membro removido.', variant: 'destructive' });
      onUpdate();
      onClose();
    } catch (error) {
       toast({ variant: 'destructive', title: 'Erro ao remover membro' });
    } finally {
       setIsSaving(false);
    }
  }

  const handleTransferLeadership = async () => {
      setIsSaving(true);
      try {
          await api.post(`/familia/${clanId}/transfer-leadership`, { newLeaderId: member.userId });
          toast({ title: 'Liderança Transferida!', description: `${member.user.name} é o novo líder da família.` });
          onUpdate();
          onClose();
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Erro ao transferir liderança', description: error.response?.data?.message });
      } finally {
          setIsSaving(false);
      }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-4">
            <MemberAvatar avatarUrl={member.user.avatarUrl} name={member.user.name || ''} className="h-12 w-12" />
            <div>
              <DialogTitle>Gerenciar {member.user.name}</DialogTitle>
              <DialogDescription>Altere o papel ou remova este membro da família.</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4 space-y-6">
            <RadioGroup value={newRole} onValueChange={(value) => setNewRole(value as any)}>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ADMIN" id="role-admin" />
                    <Label htmlFor="role-admin" className="flex items-center gap-2 font-normal"><Star className="h-4 w-4 text-blue-500"/> Admin <span className="text-xs text-muted-foreground">(Pode convidar e registrar despesas)</span></Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="MEMBER" id="role-member" />
                    <Label htmlFor="role-member" className="flex items-center gap-2 font-normal"><User className="h-4 w-4 text-muted-foreground"/> Membro</Label>
                </div>
            </RadioGroup>
            <Button onClick={handleRoleChange} disabled={isSaving || newRole === member.role}>
                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
                Atualizar Papel
            </Button>
        </div>
        <DialogFooter className="border-t pt-4 mt-4 flex-col sm:flex-row gap-2">
           <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" className="w-full sm:w-auto"><Trash2 className="mr-2 h-4 w-4"/>Remover da Família</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover {member.user.name}?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleRemoveMember} asChild><Button variant="destructive">Confirmar</Button></AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
           </AlertDialog>
           <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="outline" className="w-full sm:w-auto"><Crown className="mr-2 h-4 w-4"/>Transferir Liderança</Button>
                </AlertDialogTrigger>
                 <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Transferir Liderança?</AlertDialogTitle>
                        <AlertDialogDescription>Você perderá suas permissões de líder e se tornará um Admin. {member.user.name} será o novo líder. Esta ação é irreversível.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleTransferLeadership} asChild><Button>Confirmar Transferência</Button></AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
           </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
