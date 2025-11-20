'use client';

import { useState, useEffect, useCallback } from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Loader2, Check, UserSearch, Shield, Send } from 'lucide-react';

interface InviteWizardProps {
    cellId: string;
    open: boolean;
    onClose: () => void;
    onSuccess: () => Promise<void>;
}

type WizardInviteForm = {
    identifier: string;
    visibility: {
        viewPersonalBudget: boolean;
        viewAccounts: boolean;
        shareDebtSummary: boolean;
    };
};

export function InviteWizard({ cellId, open, onClose, onSuccess }: InviteWizardProps) {
    type LookupUser = { id: string; name?: string; email?: string; username?: string; avatarUrl?: string | null };
    const [step, setStep] = useState(1);
    const { toast } = useToast();
    const [form, setForm] = useState<WizardInviteForm>({
        identifier: '',
        visibility: {
            viewPersonalBudget: false,
            viewAccounts: false,
            shareDebtSummary: false,
        },
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lookupResult, setLookupResult] = useState<LookupUser | null>(null);
    const [validatedIdentifier, setValidatedIdentifier] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [lookupError, setLookupError] = useState<string | null>(null);

    const resetWizard = useCallback(() => {
        setStep(1);
        setForm({
            identifier: '',
            visibility: {
                viewPersonalBudget: false,
                viewAccounts: false,
                shareDebtSummary: false,
            },
        });
        setLookupResult(null);
        setValidatedIdentifier('');
        setLookupError(null);
    }, []);

    useEffect(() => {
        if (!open) {
            resetWizard();
        }
    }, [open, resetWizard]);

    const ensureLookup = useCallback(async () => {
        const trimmed = form.identifier.trim();
        if (!trimmed) {
            setLookupError('Informe o email ou ID do convidado.');
            return false;
        }
        if (lookupResult && validatedIdentifier === trimmed) {
            return true;
        }
        setIsSearching(true);
        try {
            const response = await api.get('/user/lookup', { params: { identifier: trimmed } });
            setLookupResult(response.data);
            setValidatedIdentifier(trimmed);
            setLookupError(null);
            return true;
        } catch (error: any) {
            setLookupResult(null);
            setLookupError(error?.response?.data?.message || 'Usuário não encontrado.');
            return false;
        } finally {
            setIsSearching(false);
        }
    }, [form.identifier, lookupResult, validatedIdentifier]);

    const handleNext = async () => {
        if (step === 1) {
            const ok = await ensureLookup();
            if (!ok) return;
        }
        setStep((current) => Math.min(3, current + 1));
    };

    const handleSubmit = async () => {
        if (!lookupResult) {
            toast({ variant: 'destructive', title: 'Valide o convidado antes de enviar.' });
            return;
        }
        setIsSubmitting(true);
        try {
            await api.post(`/cells/${cellId}/invite`, {
                invitedUserId: lookupResult.id,
                requestedVisibility: form.visibility,
            });
            toast({ title: 'Convite enviado!' });
            await onSuccess();
            onClose();
            resetWizard();
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Não foi possível enviar o convite.',
                description: error?.response?.data?.message || 'Revise os dados e tente novamente.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const visibilityOptions: Array<{ key: keyof WizardInviteForm['visibility']; label: string }> = [
        { key: 'viewPersonalBudget', label: 'Ver orçamento coletivo no pessoal' },
        { key: 'viewAccounts', label: 'Ver contas compartilhadas' },
        { key: 'shareDebtSummary', label: 'Acessar resumo de dívidas' },
    ];

    return (
        <DialogContent className="max-w-lg max-h-[85vh] space-y-4 overflow-hidden">
            <DialogHeader>
                <DialogTitle>Convidar novo membro</DialogTitle>
                <DialogDescription>Localize a pessoa pelo ID ou email e ajuste o que ela poderá ver.</DialogDescription>
            </DialogHeader>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                {[1, 2, 3].map((current) => (
                    <div
                        key={current}
                        className={`h-2 flex-1 rounded-full transition-all duration-300 ${step >= current ? 'bg-primary' : 'bg-muted'}`}
                    />
                ))}
            </div>

            <div className="max-h-[60vh] space-y-6 overflow-y-auto pr-1 py-2">
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-2">
                            <Label>Email ou ID do convidado</Label>
                            <div className="flex gap-2">
                                <Input
                                    value={form.identifier}
                                    onChange={(e) => {
                                        setForm({ ...form, identifier: e.target.value });
                                        setLookupError(null);
                                    }}
                                    placeholder="pessoa@exemplo.com ou usr_123"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') ensureLookup();
                                    }}
                                />
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={ensureLookup}
                                    disabled={!form.identifier.trim() || isSearching}
                                >
                                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserSearch className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>

                        {lookupResult && (
                            <div className="rounded-md border bg-accent/20 p-4 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {lookupResult.name?.[0] || lookupResult.username?.[0] || '?'}
                                </div>
                                <div>
                                    <p className="font-semibold">{lookupResult.name || lookupResult.username || lookupResult.email}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {lookupResult.email || lookupResult.username || `ID: ${lookupResult.id}`}
                                    </p>
                                </div>
                                <Check className="ml-auto h-5 w-5 text-green-500" />
                            </div>
                        )}
                        {lookupError && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                {lookupError}
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="h-5 w-5 text-primary" />
                            <p className="text-sm font-semibold">Permissões de visualização</p>
                        </div>
                        <div className="space-y-3">
                            {visibilityOptions.map((option) => (
                                <div key={option.key} className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/10 transition-colors">
                                    <span className="text-sm">{option.label}</span>
                                    <Switch
                                        checked={form.visibility[option.key]}
                                        onCheckedChange={(checked) =>
                                            setForm((prev) => ({
                                                ...prev,
                                                visibility: { ...prev.visibility, [option.key]: checked },
                                            }))
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 text-center py-4">
                        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Send className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold">Confirmar envio?</h3>
                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                            Você está convidando <strong>{lookupResult?.name || lookupResult?.username}</strong> para se juntar à sua família.
                        </p>
                        <div className="text-xs text-muted-foreground mt-4 bg-muted p-3 rounded-md inline-block">
                            <p>Permissões concedidas:</p>
                            <ul className="list-disc list-inside mt-1 text-left">
                                {Object.entries(form.visibility).filter(([_, v]) => v).map(([k]) => (
                                    <li key={k}>{visibilityOptions.find(o => o.key === k)?.label}</li>
                                ))}
                                {Object.values(form.visibility).every(v => !v) && <li>Nenhuma permissão adicional</li>}
                            </ul>
                        </div>
                    </div>
                )}
            </div>

            <DialogFooter className="flex justify-between sm:justify-between">
                <Button
                    variant="ghost"
                    onClick={() => setStep((s) => Math.max(1, s - 1))}
                    disabled={step === 1 || isSubmitting}
                >
                    Voltar
                </Button>
                {step < 3 ? (
                    <Button onClick={handleNext} disabled={step === 1 && !lookupResult}>
                        Próximo
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        Enviar Convite
                    </Button>
                )}
            </DialogFooter>
        </DialogContent>
    );
}
