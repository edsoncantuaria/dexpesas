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
import { handleApiError } from '@/lib/error-handler';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const timezoneOptions = [
    { value: 'America/Sao_Paulo', label: 'América/São Paulo (UTC-3)' },
    { value: 'UTC', label: 'UTC' },
    { value: 'America/New_York', label: 'América/Nova Iorque (UTC-5)' },
];

const currencyOptions = [
    { value: 'BRL', label: 'Real (BRL)' },
    { value: 'USD', label: 'Dólar (USD)' },
];

const formSchema = z.object({
    reconciliationTarget: z.string().min(1, 'Selecione a conta ou cartão.'),
    fileType: z.enum(['OFX', 'CSV']),
    statementFile: z.any().refine(file => file instanceof File && file.size > 0, 'O arquivo do extrato é obrigatório.'),
    statementOpeningBalance: z.string().optional(),
    statementClosingBalance: z.string().optional(),
    statementCurrency: z.string().optional(),
    statementTimezone: z.string().optional(),
    // Campos para CSV
    csvMapping: z.object({
        date: z.string(),
        description: z.string(),
        amount: z.string(),
        date_format: z.string().optional(),
        type: z.string().optional(),
        credit_value: z.string().optional(),
        debit_value: z.string().optional(),
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
}).superRefine((data, ctx) => {
    const opening = data.statementOpeningBalance?.trim();
    const closing = data.statementClosingBalance?.trim();
    if (!opening || !closing) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Informe os saldos inicial e final conforme aparecem no extrato.',
            path: ['statementOpeningBalance'],
        });
    } else if (Number.isNaN(Number(opening)) || Number.isNaN(Number(closing))) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Use apenas números e vírgula/ponto para os saldos.',
            path: ['statementOpeningBalance'],
        });
    }
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
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [parsedBalances, setParsedBalances] = useState<{ opening: number; closing: number } | null>(null);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            reconciliationTarget: '',
            fileType: 'OFX',
            statementOpeningBalance: '',
            statementClosingBalance: '',
            statementCurrency: 'BRL',
            statementTimezone: 'America/Sao_Paulo',
            csvMapping: { date: '', description: '', amount: '', date_format: 'dd/MM/yyyy', type: '', credit_value: 'C', debit_value: 'D' },
            saveTemplate: false,
            templateName: ''
        },
    });

    const watchFileType = form.watch('fileType');
    const watchTarget = form.watch('reconciliationTarget');
    const currentTarget = (() => {
        if (!watchTarget) return null;
        const [type, id] = watchTarget.split(':');
        if (type === 'account') {
            return accounts.find(acc => acc.id === id) || null;
        }
        if (type === 'card') {
            return cards.find(card => card.id === id) || null;
        }
        return null;
    })();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            form.setValue('statementFile', file);
            if (watchTarget) {
                const [type, id] = watchTarget.split(':');
                onTargetChange(id, type as 'account' | 'card');
            }
            if (watchFileType === 'CSV') {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const text = event.target?.result as string;
                    const firstLine = text.split('\n')[0];
                    const headers = firstLine.split(',').map(h => h.trim().replace(/"/g, ''));
                    setFileHeaders(headers);
                };
                reader.readAsText(file);
                setParsedBalances(null);
            } else if (watchFileType === 'OFX') {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const text = event.target?.result as string;
                    const balances = parseOfxBalances(text);
                    if (balances) {
                        setParsedBalances(balances);
                        form.setValue('statementOpeningBalance', balances.opening.toFixed(2));
                        form.setValue('statementClosingBalance', balances.closing.toFixed(2));
                    } else {
                        setParsedBalances(null);
                    }
                };
                reader.readAsText(file);
            }
        }
    };

    const handleTemplateChange = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            const mapping = template.mapping || {};
            form.setValue('csvMapping', {
                date: mapping.date || '',
                description: mapping.description || '',
                amount: mapping.amount || '',
                date_format: mapping.date_format || 'dd/MM/yyyy',
                type: mapping.type || '',
                credit_value: mapping.credit_value || 'C',
                debit_value: mapping.debit_value || 'D',
            });
        }
        setSelectedTemplate(templateId);
    }

    const parseLocaleNumber = (value: string) => {
        if (!value) return NaN;
        let normalized = value.trim();
        if (normalized.includes('.') && normalized.includes(',')) {
            normalized = normalized.replace(/\./g, '').replace(',', '.');
        } else if (normalized.includes(',')) {
            normalized = normalized.replace(',', '.');
        }
        normalized = normalized.replace(/[^\d\-.]/g, '');
        return parseFloat(normalized);
    };

    const parseOfxBalances = (content: string) => {
        const ledgerMatch = content.match(/<LEDGERBAL>[\s\S]*?<BALAMT>([-\d.,]+)/i);
        if (!ledgerMatch) return null;
        const closing = parseLocaleNumber(ledgerMatch[1]);
        if (Number.isNaN(closing)) return null;
        const txnMatches = Array.from(content.matchAll(/<STMTTRN>[\s\S]*?<TRNAMT>([-\d.,]+)/gi));
        if (txnMatches.length === 0) return null;
        const netChange = txnMatches.reduce((total, match) => total + parseLocaleNumber(match[1]), 0);
        return { opening: closing - netChange, closing };
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        setIsSubmitting(true);
        const [targetType, targetId] = values.reconciliationTarget.split(':');

        const formData = new FormData();
        formData.append('targetId', targetId);
        formData.append('targetType', targetType);
        formData.append('fileType', values.fileType);
        formData.append('statement', values.statementFile);
        if (values.statementOpeningBalance) {
            formData.append('statementOpeningBalance', values.statementOpeningBalance);
        }
        if (values.statementClosingBalance) {
            formData.append('statementClosingBalance', values.statementClosingBalance);
        }
        formData.append('statementCurrency', values.statementCurrency || 'BRL');
        formData.append('statementTimezone', values.statementTimezone || 'America/Sao_Paulo');

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
        } catch (error: any) {
            handleApiError(error, toast, 'Erro no Upload');
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

                <div className="space-y-4 rounded-md border p-4 bg-muted/20">
                    <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-foreground">Resumo do Extrato</h4>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Esses dados são usados para validar o saldo do extrato com o saldo registrado no Dexpesas.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    {parsedBalances && (
                        <Alert>
                            <AlertTitle>Valores detectados no arquivo</AlertTitle>
                            <AlertDescription>
                                Saldo inicial: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parsedBalances.opening)} · Saldo final: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parsedBalances.closing)}.
                                Confirme se correspondem aos valores do banco antes de enviar.
                            </AlertDescription>
                        </Alert>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="statementOpeningBalance"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Saldo Inicial do Extrato</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="Ex: 2450,00" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="statementClosingBalance"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Saldo Final do Extrato</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="Ex: 1980,42" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="statementCurrency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Moeda</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione a moeda" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {currencyOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="statementTimezone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fuso Horário das Datas</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Selecione o fuso" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {timezoneOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )}
                        />
                    </div>
                    <Alert>
                        <AlertTitle>Por que isso importa?</AlertTitle>
                        <AlertDescription>
                            Esses saldos devem ser exatamente os mesmos que aparecem no extrato. Se o saldo inicial da conta no Dexpesas estiver diferente,
                            edite a conta em <span className="font-semibold">Finanças &gt; Contas</span> e ajuste o valor antes de importar para evitar diferenças.
                        </AlertDescription>
                    </Alert>
                    {parsedBalances && currentTarget && (
                        <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                            <p className="font-semibold text-foreground">Saldo cadastrado x saldo do extrato</p>
                            <p>Saldo configurado no Dexpesas: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number('saldoInicial' in currentTarget ? currentTarget.saldoInicial : 0))}</p>
                            <p>Saldo inicial do extrato: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parsedBalances.opening)}</p>
                            <p className="mt-1">
                                Ajuste a conta para {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parsedBalances.opening)} antes de continuar. Isto evita bloqueios na finalização.
                            </p>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="fileType"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Tipo de Arquivo</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="OFX"><div className='flex items-center gap-2'><FileText className='h-4 w-4' /> OFX (Padrão Bancário)</div></SelectItem>
                                        <SelectItem value="CSV"><div className='flex items-center gap-2'><FileUp className='h-4 w-4' /> CSV (Planilha)</div></SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )}
                    />
                    <FormItem>
                        <FormLabel>Arquivo do Extrato</FormLabel>
                        <FormControl>
                            <Input type="file" accept={watchFileType === 'OFX' ? '.ofx' : '.csv'} onChange={handleFileChange} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                </div>

                {watchFileType === 'CSV' && (
                    <div className="space-y-4 rounded-md border p-4 bg-muted/30">
                        <h4 className="font-semibold text-foreground">Mapeamento de Colunas CSV</h4>
                        <p className="text-sm text-muted-foreground">Selecione as colunas do seu arquivo que correspondem a cada campo.</p>
                        {templates.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <FormLabel>Template de Mapeamento (Opcional)</FormLabel>
                                    <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Usar um template salvo..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {templates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField control={form.control} name="csvMapping.date" render={({ field }) => (<FormItem><FormLabel>Coluna da Data</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{fileHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="csvMapping.description" render={({ field }) => (<FormItem><FormLabel>Coluna da Descrição</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{fileHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="csvMapping.amount" render={({ field }) => (<FormItem><FormLabel>Coluna do Valor</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl><SelectContent>{fileHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        </div>
                        <FormField control={form.control} name="csvMapping.type" render={({ field }) => (
                            <FormItem className="max-w-xs">
                                <FormLabel>Coluna do Tipo (opcional)</FormLabel>
                                <Select value={field.value} onValueChange={field.onChange}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {fileHeaders.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">Use quando o arquivo sinaliza crédito/debito com uma letra.</p>
                            </FormItem>
                        )} />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="csvMapping.debit_value" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor usado para Débito</FormLabel>
                                    <FormControl><Input placeholder="Ex: D" {...field} /></FormControl>
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="csvMapping.credit_value" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Valor usado para Crédito</FormLabel>
                                    <FormControl><Input placeholder="Ex: C" {...field} /></FormControl>
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="csvMapping.date_format" render={({ field }) => (<FormItem className='max-w-xs'><FormLabel>Formato da Data</FormLabel><FormControl><Input placeholder="Ex: dd/MM/yyyy" {...field} /></FormControl><FormMessage /></FormItem>)} />

                        <FormField control={form.control} name="saveTemplate" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><FormLabel>Salvar este mapeamento como um template?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>)} />
                        {form.watch('saveTemplate') && (
                            <FormField control={form.control} name="templateName" render={({ field }) => (<FormItem><FormLabel>Nome do Template</FormLabel><FormControl><Input placeholder="Ex: Extrato Nubank" {...field} /></FormControl><FormMessage /></FormItem>)} />
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
