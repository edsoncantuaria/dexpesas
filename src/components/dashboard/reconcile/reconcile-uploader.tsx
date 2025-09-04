// src/components/dashboard/reconcile/reconcile-uploader.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Account, Card as CardType, ImportTemplate } from '@/lib/definitions';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud, FileText, FileUp, Info } from 'lucide-react';
import { useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

const formSchema = z.object({
    reconciliationTarget: z.string().min(1, 'Selecione a conta ou cartão.'),
    fileType: z.enum(['OFX', 'CSV']),
    statementFile: z.any().refine(file => file instanceof File && file.size > 0, 'O arquivo do extrato é obrigatório.'),
    // Campos para CSV
    csvMapping: z.object({
        date: z.string(),
        description: z.string(),
        amount: z.string(),
        date_format: z.string().optional(),
    }).optional(),
    saveTemplate: z.boolean().optional(),
    templateName: z.string().optional(),
}).refine(data => {
    if (data.fileType === 'CSV') {
        return !!data.csvMapping?.date && !!data.csvMapping.description && !!data.csvMapping.amount;
    }
    return true;
}, {
    message: "Para CSV, os campos de data, descrição e valor devem ser mapeados.",
    path: ["csvMapping"],
}).refine(data => {
    if (data.saveTemplate) {
        return !!data.templateName && data.templateName.length > 2;
    }
    return true;
}, {
    message: "O nome do template deve ter pelo menos 3 caracteres.",
    path: ["templateName"]
});

interface ReconcileUploaderProps {
    accounts: Account[];
    cards: CardType[];
    templates: ImportTemplate[];
    onSuccess: (reconciliationId: string, targetId: string, targetType: 'account' | 'card') => void;
    onTargetChange: (targetId: string, targetType: 'account' | 'card') => void;
    isProcessing: boolean;
}

export function ReconcileUploader({ accounts, cards, templates, onSuccess, onTargetChange, isProcessing }: ReconcileUploaderProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [fileHeaders, setFileHeaders] = useState<string[]>([]);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            reconciliationTarget: '',
            fileType: 'OFX',
            csvMapping: { date: '', description: '', amount: '', date_format: 'dd/MM/yyyy' },
            saveTemplate: false,
            templateName: ''
        },
    });

    const watchFileType = form.watch('fileType');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue('statementFile', file);
            if (watchFileType === 'CSV') {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const text = event.target?.result as string;
                    const firstLine = text.split('\n')[0];
                    const headers = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
                    setFileHeaders(headers);
                };
                reader.readAsText(file);
            }
        }
    };
    
    const handleTemplateChange = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            form.setValue('csvMapping', template.mapping);
        }
    }


    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        const [targetType, targetId] = values.reconciliationTarget.split(':');
        
        const formData = new FormData();
        formData.append('targetId', targetId);
        formData.append('targetType', targetType);
        formData.append('fileType', values.fileType);
        formData.append('statement', values.statementFile);
        
        if (values.fileType === 'CSV' && values.csvMapping) {
            formData.append('mapping', JSON.stringify(values.csvMapping));
            if (values.saveTemplate) {
                formData.append('saveTemplate', 'true');
                formData.append('templateName', values.templateName || '');
            }
        }

        try {
            const response = await api.post('/reconcile/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            toast({ title: 'Arquivo enviado!', description: 'Seu extrato está sendo processado em segundo plano.' });
            onSuccess(response.data.reconciliationId, targetId, targetType as 'account' | 'card');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro no Upload', description: 'Não foi possível enviar o arquivo.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const isLoading = isSubmitting || isProcessing;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                     <FormField
                        control={form.control}
                        name="reconciliationTarget"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Conta ou Cartão</FormLabel>
                                <Select 
                                    onValueChange={(value) => { 
                                        field.onChange(value);
                                        const [type, id] = value.split(':');
                                        onTargetChange(id, type as 'account' | 'card'); 
                                    }} 
                                    value={field.value} 
                                    disabled={isLoading}
                                >
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectGroup>
                                            <FormLabel className='px-2 text-xs'>Contas</FormLabel>
                                            {accounts.map(acc => <SelectItem key={acc.id} value={`account:${acc.id}`}>{acc.nome}</SelectItem>)}
                                        </SelectGroup>
                                        <SelectGroup>
                                            <FormLabel className='px-2 text-xs'>Cartões de Crédito</FormLabel>
                                            {cards.map(card => <SelectItem key={card.id} value={`card:${card.id}`}>{card.nome}</SelectItem>)}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="fileType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Arquivo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="OFX"><div className='flex items-center gap-2'><FileText className='h-4 w-4'/> OFX (Padrão Bancário)</div></SelectItem>
                                        <SelectItem value="CSV"><div className='flex items-center gap-2'><FileUp className='h-4 w-4'/> CSV (Planilha)</div></SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                     <FormItem>
                        <FormLabel>Arquivo do Extrato</FormLabel>
                        <FormControl>
                            <Input type="file" accept={watchFileType === 'OFX' ? '.ofx' : '.csv'} onChange={handleFileChange} disabled={isLoading}/>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </div>
                
                {watchFileType === 'CSV' && (
                    <div className="space-y-4 rounded-md border p-4 bg-muted/30">
                        <h4 className="font-semibold text-foreground">Mapeamento de Colunas CSV</h4>
                        <p className="text-sm text-muted-foreground">Selecione as colunas do seu arquivo que correspondem a cada campo.</p>
                         <FormField
                            control={form.control} name="csvMapping.date" render={({ field }) => ( <FormItem>
                                <FormLabel>Template de Mapeamento (Opcional)</FormLabel>
                                 <Select onValueChange={handleTemplateChange} disabled={templates.length === 0}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Usar um template salvo..."/></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}/>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <FormField control={form.control} name="csvMapping.date" render={({ field }) => ( <FormItem><FormLabel>Coluna da Data</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger></FormControl><SelectContent>{fileHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                             <FormField control={form.control} name="csvMapping.description" render={({ field }) => ( <FormItem><FormLabel>Coluna da Descrição</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger></FormControl><SelectContent>{fileHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                             <FormField control={form.control} name="csvMapping.amount" render={({ field }) => ( <FormItem><FormLabel>Coluna do Valor</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione"/></SelectTrigger></FormControl><SelectContent>{fileHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)}/>
                        </div>
                        <FormField control={form.control} name="csvMapping.date_format" render={({ field }) => ( <FormItem className='max-w-xs'><FormLabel>Formato da Data</FormLabel><FormControl><Input placeholder="Ex: dd/MM/yyyy" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                        
                        <FormField control={form.control} name="saveTemplate" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>Salvar este mapeamento como um template?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
                        {form.watch('saveTemplate') && (
                            <FormField control={form.control} name="templateName" render={({ field }) => ( <FormItem><FormLabel>Nome do Template</FormLabel><FormControl><Input placeholder="Ex: Extrato Nubank" {...field}/></FormControl><FormMessage /></FormItem>)}/>
                        )}
                    </div>
                )}

                <div className="flex justify-end pt-2">
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                        {isProcessing ? 'Processando...' : isSubmitting ? 'Enviando...' : 'Iniciar Reconciliação'}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
