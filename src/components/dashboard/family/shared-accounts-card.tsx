'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Wallet, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { handleApiError } from '@/lib/error-handler';
import { CellSharedAccount, Clan, Account } from '@/lib/definitions';

interface SharedAccountsCardProps {
    sharedAccounts: CellSharedAccount[];
    members: Clan['members'];
    canManageSharedAccounts: boolean;
    cellId: string;
    onRefreshSharedAccounts: () => Promise<void>;
}

export function SharedAccountsCard({
    sharedAccounts,
    members,
    canManageSharedAccounts,
    cellId,
    onRefreshSharedAccounts,
}: SharedAccountsCardProps) {
    const { toast } = useToast();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [availableAccounts, setAvailableAccounts] = useState<Account[]>([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [visibility, setVisibility] = useState<'MEMBERS' | 'ADMINS' | 'CUSTOM'>('MEMBERS');
    const [allowedRoles, setAllowedRoles] = useState<Array<'LEADER' | 'ADMIN' | 'MEMBER'>>(['LEADER', 'ADMIN']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);

    useEffect(() => {
        if (!isDialogOpen) return;
        let active = true;
        setIsLoadingAccounts(true);
        api
            .get('/accounts')
            .then((response) => {
                if (!active) return;
                setAvailableAccounts(response.data || []);
            })
            .catch((error) => {
                if (!active) return;
                handleApiError(error, toast, 'Não foi possível carregar suas contas');
                setAvailableAccounts([]);
            })
            .finally(() => {
                if (active) {
                    setIsLoadingAccounts(false);
                }
            });
        return () => {
            active = false;
        };
    }, [isDialogOpen, toast]);

    const shareableAccounts = availableAccounts.filter(
        (account) => !sharedAccounts.some((shared) => shared.accountId === account.id),
    );

    useEffect(() => {
        if (!isDialogOpen) return;
        if (!shareableAccounts.length) {
            setSelectedAccountId('');
            return;
        }
        if (!selectedAccountId || !shareableAccounts.some((account) => account.id === selectedAccountId)) {
            setSelectedAccountId(shareableAccounts[0]?.id || '');
        }
    }, [isDialogOpen, shareableAccounts, selectedAccountId]);

    const resetForm = () => {
        setSelectedAccountId('');
        setVisibility('MEMBERS');
        setAllowedRoles(['LEADER', 'ADMIN']);
    };

    const handleLinkAccount = async () => {
        if (!cellId || !selectedAccountId) {
            toast({ variant: 'destructive', title: 'Selecione uma conta para vincular.' });
            return;
        }
        if (visibility === 'CUSTOM' && allowedRoles.length === 0) {
            toast({ variant: 'destructive', title: 'Escolha pelo menos um perfil autorizado.' });
            return;
        }
        try {
            setIsSubmitting(true);
            await api.post(`/cells/${cellId}/shared-accounts`, {
                accountId: selectedAccountId,
                visibility,
                allowedRoles: visibility === 'CUSTOM' ? allowedRoles : undefined,
            });
            toast({ title: 'Conta vinculada à família.' });
            await onRefreshSharedAccounts();
            setDialogOpen(false);
            resetForm();
        } catch (error: any) {
            handleApiError(error, toast, 'Não foi possível compartilhar a conta');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUnlink = async (sharedAccountId: string) => {
        try {
            setRemovingId(sharedAccountId);
            await api.delete(`/cells/${cellId}/shared-accounts/${sharedAccountId}`);
            toast({ title: 'Conta removida da família.' });
            await onRefreshSharedAccounts();
        } catch (error: any) {
            handleApiError(error, toast, 'Não foi possível remover a conta');
        } finally {
            setRemovingId(null);
        }
    };

    const renderOwnerName = (userId?: string | null) => {
        if (!userId) return 'Membro da família';
        const owner = members?.find((member) => member.userId === userId);
        return owner?.user?.name || 'Membro da família';
    };

    const visibilityLabel = (value: 'MEMBERS' | 'ADMINS' | 'CUSTOM') => {
        if (value === 'MEMBERS') return 'Visível para todos';
        if (value === 'ADMINS') return 'Só líderes/admins';
        return 'Permissões customizadas';
    };

    const roleLabels: Record<'LEADER' | 'ADMIN' | 'MEMBER', string> = {
        LEADER: 'Líder',
        ADMIN: 'Admin',
        MEMBER: 'Membro',
    };

    const isFormValid = Boolean(selectedAccountId) && (visibility !== 'CUSTOM' || (visibility === 'CUSTOM' && allowedRoles.length > 0));

    return (
        <Card className="md:col-span-2 border-none shadow-lg bg-white/50 dark:bg-black/20 backdrop-blur-sm">
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <CardTitle>Contas compartilhadas</CardTitle>
                    <CardDescription>Mostre saldos relevantes para toda a família e controle quem pode vê-los.</CardDescription>
                </div>
                {canManageSharedAccounts && (
                    <Dialog
                        open={isDialogOpen}
                        onOpenChange={(open) => {
                            setDialogOpen(open);
                            if (!open) resetForm();
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="w-full sm:w-auto">
                                <Wallet className="h-4 w-4 mr-1" />
                                Vincular conta
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Compartilhar conta com a família</DialogTitle>
                                <DialogDescription>Selecione uma das suas contas e escolha quem poderá enxergar os detalhes.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Conta</Label>
                                    {isLoadingAccounts ? (
                                        <p className="text-sm text-muted-foreground">Carregando contas...</p>
                                    ) : shareableAccounts.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">
                                            Você já compartilhou todas as contas disponíveis. Cadastre uma nova conta pessoal para vinculá-la aqui.
                                        </p>
                                    ) : (
                                        <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione uma conta" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {shareableAccounts.map((account) => (
                                                    <SelectItem key={account.id} value={account.id}>
                                                        {account.nome} • {account.instituicao || 'Instituição'}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label>Visibilidade</Label>
                                    <Select value={visibility} onValueChange={(value) => setVisibility(value as 'MEMBERS' | 'ADMINS' | 'CUSTOM')}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="MEMBERS">Todos os membros</SelectItem>
                                            <SelectItem value="ADMINS">Apenas líderes/admins</SelectItem>
                                            <SelectItem value="CUSTOM">Permissões customizadas</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                {visibility === 'CUSTOM' && (
                                    <div className="rounded-md border p-3 space-y-3">
                                        <p className="text-xs text-muted-foreground">Escolha quais perfis podem visualizar a conta.</p>
                                        {(['LEADER', 'ADMIN', 'MEMBER'] as Array<'LEADER' | 'ADMIN' | 'MEMBER'>).map((role) => (
                                            <label key={role} className="flex items-center justify-between text-sm">
                                                <span>{roleLabels[role]}</span>
                                                <Switch
                                                    checked={allowedRoles.includes(role)}
                                                    onCheckedChange={(checked) => {
                                                        setAllowedRoles((prev) =>
                                                            checked ? [...prev, role] : prev.filter((item) => item !== role),
                                                        );
                                                    }}
                                                />
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <DialogFooter>
                                <Button onClick={handleLinkAccount} disabled={!isFormValid || isSubmitting || shareableAccounts.length === 0}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    {isSubmitting ? 'Compartilhando...' : 'Compartilhar conta'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </CardHeader>
            <CardContent className="space-y-4">
                {sharedAccounts.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                        Nenhuma conta compartilhada ainda. Vincule uma conta bancária ou carteira para que os demais acompanhem o saldo coletivo.
                    </p>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sharedAccounts.map((item) => {
                        const visibilityText = visibilityLabel(item.visibility);
                        const allowed = Array.isArray(item.allowedRoles) ? item.allowedRoles : [];
                        return (
                            <div key={item.id} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 space-y-3 relative group">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <p className="font-semibold truncate">{item.account?.nome || 'Conta compartilhada'}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {item.account?.instituicao ? `${item.account?.instituicao} • ` : ''}
                                            {renderOwnerName(item.account?.userId)}
                                        </p>
                                    </div>
                                    {canManageSharedAccounts && (
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    aria-label="Remover conta compartilhada"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Remover conta da família?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Os demais membros deixarão de visualizar esta conta compartilhada.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleUnlink(item.id)}
                                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                        disabled={removingId === item.id}
                                                    >
                                                        {removingId === item.id ? 'Removendo...' : 'Remover'}
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                    <Badge variant="outline" className="text-[10px]">{visibilityText}</Badge>
                                    {item.visibility === 'CUSTOM' && allowed.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                            {allowed.map((role) => (
                                                <Badge key={`${item.id}-${role}`} variant="secondary" className="text-[10px]">
                                                    {roleLabels[role as 'LEADER' | 'ADMIN' | 'MEMBER'] || role}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
