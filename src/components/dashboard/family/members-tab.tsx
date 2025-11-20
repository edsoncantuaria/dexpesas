'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Users, LogOut, Trash2, Crown, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Clan, CellEquilibriumEntry } from '@/lib/definitions';
import { InviteWizard } from './invite-wizard';
import { EquilibriumPanel } from './equilibrium-panel';
import { MemberAvatar } from '@/components/dashboard/clans/member-avatar';
import { motion } from 'framer-motion';

interface MembersTabProps {
    cell: Clan;
    currentUserId?: string;
    onChange: () => Promise<void>;
    equilibriumEntries: CellEquilibriumEntry[];
}

export function MembersTab({
    cell,
    currentUserId,
    onChange,
    equilibriumEntries,
}: MembersTabProps) {
    const { toast } = useToast();
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const currentMembership = cell.members?.find((member) => member.userId === currentUserId) || null;
    const otherMembersCount = currentMembership ? Math.max(0, (cell.members?.length || 0) - 1) : cell.members?.length || 0;
    const canDelete = currentMembership?.role === 'LEADER';
    const canDeleteNow = canDelete && otherMembersCount === 0;

    const handleLeave = async () => {
        setIsLeaving(true);
        try {
            await api.post(`/cells/${cell.id}/leave`);
            toast({ title: 'Você saiu do Modo Família.' });
            await onChange();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Não foi possível sair.',
                description: error?.response?.data?.message || 'Tente novamente em instantes.',
            });
        } finally {
            setIsLeaving(false);
            setIsLeaveDialogOpen(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/cells/${cell.id}`);
            toast({ title: 'Modo Família excluído com sucesso.' });
            await onChange();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Não foi possível excluir a família.',
                description: error?.response?.data?.message || 'Revise os requisitos e tente novamente.',
            });
        } finally {
            setIsDeleting(false);
            setIsDeleteDialogOpen(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-none shadow-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
                <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <CardTitle>Membros e Convites</CardTitle>
                        <CardDescription>Gerencie quem faz parte da sua família financeira.</CardDescription>
                    </div>
                    <TooltipProvider>
                        <div className="flex items-center gap-2">
                            <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DialogTrigger asChild>
                                            <Button size="sm" className="gap-2">
                                                <UserPlus className="h-4 w-4" />
                                                Convidar
                                            </Button>
                                        </DialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Convidar novo membro</TooltipContent>
                                </Tooltip>
                                <InviteWizard
                                    cellId={cell.id}
                                    open={isInviteOpen}
                                    onClose={() => setIsInviteOpen(false)}
                                    onSuccess={onChange}
                                />
                            </Dialog>

                            <AlertDialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="text-muted-foreground hover:text-destructive"
                                                disabled={!currentMembership}
                                                aria-label="Sair do Modo Família"
                                            >
                                                <LogOut className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>Sair do Modo Família</TooltipContent>
                                </Tooltip>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Deseja sair do Modo Família?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Você perderá acesso aos orçamentos, fundos e decisões deste grupo. Essa ação não remove os demais membros.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={handleLeave}
                                            disabled={isLeaving}
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                            {isLeaving ? 'Saindo...' : 'Confirmar saída'}
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>

                            {canDelete && (
                                <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="destructive"
                                                    size="icon"
                                                    disabled={!canDeleteNow}
                                                    aria-label="Excluir Modo Família"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            {canDeleteNow ? 'Excluir Modo Família' : 'Remova outros membros antes de excluir'}
                                        </TooltipContent>
                                    </Tooltip>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir família definitivamente?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Essa ação remove todos os dados compartilhados (orçamentos, fundos e histórico). Não é possível desfazer.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction
                                                onClick={handleDelete}
                                                disabled={isDeleting}
                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                                {isDeleting ? 'Excluindo...' : 'Excluir família'}
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            )}
                        </div>
                    </TooltipProvider>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {cell.members?.map((member) => (
                            <motion.div
                                key={member.userId}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <MemberAvatar
                                        avatarUrl={member.user?.avatarUrl}
                                        name={member.user?.name || 'Membro'}
                                        className="h-10 w-10"
                                    />
                                    <div>
                                        <p className="font-semibold leading-none">{member.user?.name || 'Membro'}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{member.user?.email}</p>
                                    </div>
                                </div>
                                <Badge variant={member.role === 'LEADER' ? 'default' : 'secondary'} className="ml-2">
                                    {member.role === 'LEADER' && <Crown className="h-3 w-3 mr-1 text-yellow-400" />}
                                    {member.role === 'LEADER' ? 'Líder' : 'Membro'}
                                </Badge>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <EquilibriumPanel
                entries={equilibriumEntries}
                currentUserId={currentUserId}
                cellId={cell.id}
                members={cell.members}
                onRefresh={onChange}
            />
        </div>
    );
}
