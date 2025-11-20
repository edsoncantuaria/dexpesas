'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ClanIcon } from '@/components/dashboard/clans/clan-icon';
import { ImagePlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import type { Clan } from '@/lib/definitions';

export function CreateCellDialog({ open, onOpenChange, onSubmit }: { open: boolean; onOpenChange: (open: boolean) => void; onSubmit: (values: { name: string; description?: string; iconUrl?: string }) => Promise<void> }) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [form, setForm] = useState({ name: '', description: '', iconUrl: '' });
    const [iconObjectName, setIconObjectName] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post('/storage/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setIconObjectName(response.data.objectName);
            toast({ title: 'Imagem enviada com sucesso.' });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Não foi possível enviar a imagem.',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.name.trim()) return;
        setIsSubmitting(true);
        await onSubmit({
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            iconUrl: iconObjectName || form.iconUrl.trim() || undefined,
        });
        setIsSubmitting(false);
        setForm({ name: '', description: '', iconUrl: '' });
        setIconObjectName(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nova Família Financeira</DialogTitle>
                    <DialogDescription>Defina nome e ícone para o seu workspace.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <ClanIcon iconUrl={iconObjectName || form.iconUrl || undefined} clanName={form.name || 'Nova Família'} size="lg" />
                        <div className="space-y-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleUpload}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                <ImagePlus className="h-4 w-4 mr-2" />
                                {isUploading ? 'Enviando...' : 'Enviar foto'}
                            </Button>
                            {iconObjectName && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIconObjectName(null)}
                                >
                                    Remover
                                </Button>
                            )}
                        </div>
                    </div>
                    <div>
                        <Label>Nome</Label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Família Costa" />
                    </div>
                    <div>
                        <Label>Descrição</Label>
                        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Contextualize os objetivos desta família." />
                    </div>
                    <div>
                        <Label>Ícone (URL opcional)</Label>
                        <Input value={form.iconUrl} onChange={(e) => setForm({ ...form, iconUrl: e.target.value })} placeholder="https://..." />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={isSubmitting || !form.name.trim()}>
                        {isSubmitting ? 'Criando...' : 'Criar família'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function EditCellDialog({
    cell,
    open,
    onOpenChange,
    onSuccess,
}: {
    cell: Clan;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => Promise<void>;
}) {
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [form, setForm] = useState({
        name: cell.name,
        description: cell.description || '',
    });
    const [iconObjectName, setIconObjectName] = useState<string | null>(cell.iconUrl || null);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open) {
            setForm({
                name: cell.name,
                description: cell.description || '',
            });
            setIconObjectName(cell.iconUrl || null);
        }
    }, [cell, open]);

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const response = await api.post('/storage/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setIconObjectName(response.data.objectName);
            toast({ title: 'Imagem enviada com sucesso.' });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Não foi possível enviar a imagem.',
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload: Record<string, any> = {
                name: form.name.trim(),
                description: form.description?.trim() || null,
                iconUrl: iconObjectName,
            };
            await api.patch(`/cells/${cell.id}`, payload);
            toast({ title: 'Informações atualizadas!' });
            await onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'Não foi possível salvar.',
                description: error?.response?.data?.message || 'Tente novamente em instantes.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar identidade da família</DialogTitle>
                    <DialogDescription>Atualize nome, descrição e imagem exibida no Modo Família.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <ClanIcon iconUrl={iconObjectName || cell.iconUrl || undefined} clanName={form.name || cell.name} size="lg" />
                        <div className="space-y-2">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleUpload}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                <ImagePlus className="h-4 w-4 mr-2" />
                                {isUploading ? 'Enviando...' : 'Trocar imagem'}
                            </Button>
                            {iconObjectName && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setIconObjectName(null)}
                                >
                                    Remover imagem
                                </Button>
                            )}
                        </div>
                    </div>
                    <div>
                        <Label>Nome</Label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                        <Label>Descrição</Label>
                        <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={!form.name.trim() || isSubmitting}>
                        {isSubmitting ? 'Salvando...' : 'Salvar alterações'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function FamilyHelpDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
                <DialogHeader className="space-y-2">
                    <DialogTitle>Guia rápido do Modo Família</DialogTitle>
                    <DialogDescription>
                        Sincronize orçamentos, metas e rateios entre todos os membros preservando permissões individuais. Use este resumo para tirar dúvidas rápidas.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-3 text-sm text-muted-foreground">
                    <section className="space-y-2">
                        <h4 className="text-base font-semibold text-foreground">Fluxo em três passos</h4>
                        <ol className="list-decimal space-y-2 pl-5">
                            <li>Convide os membros e defina quem é líder/admin. As permissões determinam quem pode criar budgets, fundos e rateios.</li>
                            <li>Configure orçamentos compartilhados ou híbridos. Eles aparecem como “espelhos” no orçamento pessoal de cada membro.</li>
                            <li>Registre caixinhas e despesas compartilhadas. Cada parte gera uma transação pendente na conta pessoal escolhida.</li>
                        </ol>
                    </section>
                    <section className="space-y-2">
                        <h4 className="text-base font-semibold text-foreground">Orçamentos e metas</h4>
                        <ul className="list-disc space-y-1 pl-5">
                            <li><span className="font-medium text-foreground">Categoria:</span> usa as mesmas categorias do módulo pessoal. Assim o espelho cai no lugar certo.</li>
                            <li><span className="font-medium text-foreground">Limite:</span> valor máximo mensal. Escolha divisão igualitária ou porcentagens customizadas.</li>
                            <li><span className="font-medium text-foreground">Tipo:</span> CELL (todos), HYBRID (parte pessoal + parte coletiva) ou PERSONAL (apenas referência vinculada).</li>
                            <li><span className="font-medium text-foreground">Caixinhas:</span> sempre vinculam uma meta espelho ao responsável. Investir/Resgatar pede conta de origem/destino.</li>
                        </ul>
                    </section>
                    <section className="space-y-2">
                        <h4 className="text-base font-semibold text-foreground">Rateios e transações</h4>
                        <ul className="list-disc space-y-1 pl-5">
                            <li>“Nova despesa” cria uma transação pendente para cada participante. É preciso selecionar a conta pessoal de cada um.</li>
                            <li>Ao registrar pagamento, a transação é quitada e o histórico fica disponível para todos.</li>
                            <li>O filtro lateral ajuda a encontrar despesas por descrição, status ou mês.</li>
                        </ul>
                    </section>
                    <section className="space-y-2">
                        <h4 className="text-base font-semibold text-foreground">Permissões e rastreio</h4>
                        <p>Timeline e alertas registram toda alteração (limites, fundos, decisões). Use-os para auditar quem editou o quê e quando.</p>
                        <p className="text-xs">Dica: se um membro não vê saldos, verifique se ele possui permissão e se a conta foi compartilhada na aba “Contas”.</p>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    )
}
