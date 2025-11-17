// src/components/dashboard/transacoes/add-transaction-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { Account, Card, Transaction, Category, OcrData, User, Tag } from '@/lib/definitions';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { CalendarIcon, Loader2, Sparkles, Info, Camera, Repeat, Check, MessageSquareText, ChevronDown, Repeat1, Layers, Tags as TagsIcon, Paperclip, PencilLine, CircleDollarSign, Shapes, Wallet, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, addYears, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileUpload } from '@/components/ui/file-upload';
import { AttachmentPreviewer } from '@/components/ui/attachment-previewer';
import { CurrencyInput } from '@/components/ui/currency-input';
import { OcrUploadDialog } from '@/components/ui/ocr-upload-dialog';
import { TagInput } from './tag-input';
import { DescricaoInteligente, type SugestaoTransacao } from './descricao-inteligente';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { AnimatePresence, motion } from 'framer-motion';


// Schema único e robusto com validação condicional
const ENTRY_TYPE_OPTIONS = [
  { value: 'single', title: 'Único', description: 'Vale para uma data', icon: Repeat1 },
  { value: 'installment', title: 'Parcelado', description: 'Divide o valor', icon: Layers },
  { value: 'recurring', title: 'Recorrente', description: 'Repete automaticamente', icon: Repeat },
];

const formSchema = z.object({
  tipo: z.enum(['despesa', 'receita', 'transferencia']),
  descricao: z.string().optional(), 
  valor: z.coerce.number().positive({ message: 'O valor deve ser positivo.' }),
  data: z.date({ required_error: "A data é obrigatória."}),
  pago: z.boolean().optional(),
  categoryId: z.string().optional(),
  attachmentUrl: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().max(1000, "As observações não podem exceder 1000 caracteres.").optional(),
  metodoPagamento: z.enum(['debito', 'credito', 'pix', 'dinheiro']).optional(),
  contaCartaoId: z.string().optional(),
  entryType: z.enum(['single', 'installment', 'recurring']).default('single'), // Novo campo para controlar a UI
  recurrenceType: z.string().optional(),
  installment: z.boolean().optional(),
  totalInstallments: z.coerce.number().optional(),
  withInterest: z.boolean().optional(),
  interestRate: z.coerce.number().optional(),
  fromAccountId: z.string().optional(),
  toAccountId: z.string().optional(),
})
.refine(data => {
    if (data.tipo === 'transferencia') {
        if (!data.fromAccountId || data.fromAccountId.length < 1) return false;
        if (!data.toAccountId || data.toAccountId.length < 1) return false;
        if (data.fromAccountId === data.toAccountId) return false;
    }
    return true;
}, {
    message: "Contas de origem e destino são obrigatórias e devem ser diferentes.",
    path: ['toAccountId'],
})
.refine(data => {
    if (data.tipo === 'despesa' || data.tipo === 'receita') {
        return !!data.descricao && data.descricao.length >= 2;
    }
    return true;
}, {
    message: "O título é obrigatório.",
    path: ['descricao'],
})
.refine(data => {
    if ((data.tipo === 'despesa' || data.tipo === 'receita') && data.metodoPagamento !== 'dinheiro') {
        return !!data.contaCartaoId && data.contaCartaoId.length > 0;
    }
    return true;
}, {
    message: "Selecione uma conta ou cartão.",
    path: ['contaCartaoId'],
})
.refine(data => {
    if (data.entryType === 'installment') {
        if (!data.totalInstallments || data.totalInstallments < 2) return false;
    }
    return true;
}, {
    message: "O número de parcelas deve ser no mínimo 2.",
    path: ['totalInstallments']
})
.refine(data => {
    if (data.entryType === 'recurring') {
        if (!data.recurrenceType || data.recurrenceType === 'NONE') return false;
    }
    return true;
}, {
    message: "Selecione uma frequência para a recorrência.",
    path: ['recurrenceType']
})
.refine(data => {
    const selectedDate = data.data;
    const minDate = subYears(new Date(), 5);
    const maxDate = addYears(new Date(), 2);
    return selectedDate >= minDate && selectedDate <= maxDate;
}, {
    message: "Escolha uma data dentro de um intervalo válido.",
    path: ['data'],
});



type FormValues = z.infer<typeof formSchema>;


type AddTransactionFormProps = {
  transaction?: Transaction | null;
  accounts: Account[];
  cards: Card[];
  onSave: (data: any, shouldClose: boolean) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
  className?: string;
};

export function AddTransactionForm({
  transaction,
  accounts,
  cards,
  onSave,
  onClose,
  isSubmitting,
  className,
}: AddTransactionFormProps) {
  const isEditing = !!transaction;
  const [categories, setCategories] = useState<Category[]>([]);
  const [userTags, setUserTags] = useState<Tag[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isOcrDialogOpen, setIsOcrDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [openCollapsible, setOpenCollapsible] = useState<string | null>(null);
  const { toast } = useToast();

  const defaultValues: Partial<FormValues> = {
    tipo: 'despesa',
    descricao: '', 
    valor: 0, 
    data: new Date(), 
    categoryId: '',
    metodoPagamento: 'credito', 
    contaCartaoId: '', 
    pago: true, 
    entryType: 'single',
    recurrenceType: 'NONE', 
    attachmentUrl: null, 
    tags: [], 
    notes: '',
    installment: false, 
    totalInstallments: 2, 
    withInterest: false, 
    interestRate: 0,
  };
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as FormValues,
  });
  
  const resetFormToDefault = () => {
    const currentTipo = form.getValues('tipo');
    form.reset({
        ...(defaultValues as FormValues),
        tipo: currentTipo,
    });
    setOpenCollapsible(null);
  };

  const fetchInitialData = useCallback(async () => {
    try {
      const [catRes, userRes, tagsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/user'),
        api.get('/tags'),
      ]);
      setCategories(catRes.data);
      setUser(userRes.data);
      setUserTags(tagsRes.data);
    } catch (error) {
      console.error("Failed to fetch initial data", error);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);
  
  useEffect(() => {
    if (transaction && categories.length > 0) {
        const category = categories.find(c => c.id === transaction.categoryId);
        let entryType: 'single' | 'installment' | 'recurring' = 'single';
        if (transaction.installment) entryType = 'installment';
        else if (transaction.recurrenceType && transaction.recurrenceType !== 'NONE') entryType = 'recurring';

        const valuesToReset: Partial<FormValues> = {
            tipo: transaction.tipo,
            descricao: transaction.installment ? transaction.descricao.replace(/\s\(\d+\/\d+\)$/, '') : transaction.descricao,
            valor: transaction.installment ? (Number(transaction.valorTotal) ?? Number(transaction.valor)) : Number(transaction.valor),
            data: new Date(transaction.data),
            pago: transaction.pago,
            categoryId: category?.id || '',
            attachmentUrl: transaction.attachmentUrl,
            tags: transaction.tags?.map(t => t.id) || [],
            notes: transaction.notes || '',
            metodoPagamento: transaction.metodoPagamento,
            contaCartaoId: transaction.accountId || transaction.cardId || '',
            entryType: entryType,
            recurrenceType: transaction.recurrenceType || 'NONE',
            installment: !!transaction.installment,
            totalInstallments: transaction.totalInstallments || 2,
            withInterest: !!transaction.withInterest,
            interestRate: transaction.interestRate || 0,
        };
        form.reset(valuesToReset);
    } else if (!transaction) {
         form.reset(defaultValues as FormValues);
    }
  }, [transaction, form, categories]);

  const handleOcrComplete = (data: OcrData) => {
    if (data.estabelecimento) form.setValue('descricao', data.estabelecimento, { shouldValidate: true, shouldDirty: true });
    if (data.valor) form.setValue('valor', data.valor, { shouldValidate: true, shouldDirty: true });
    if (data.data) form.setValue('data', parseISO(data.data), { shouldValidate: true, shouldDirty: true });
  };
  
  const handleSuggestionSelected = (sugestao: SugestaoTransacao) => {
    const currentValues = form.getValues();
    if (currentValues.tipo !== 'transferencia') {
        if (!form.formState.dirtyFields.categoryId) form.setValue('categoryId', sugestao.categoriaId);
        if (currentValues.tipo === 'despesa' && !form.formState.dirtyFields.metodoPagamento) form.setValue('metodoPagamento', sugestao.metodoPagamento);
        if (!form.formState.dirtyFields.contaCartaoId) form.setValue('contaCartaoId', sugestao.contaId || sugestao.cartaoId || '');
    }
    if (!form.formState.dirtyFields.tags) {
        const tagIds = sugestao.tags.map(tagName => userTags.find(t => t.name === tagName)?.id).filter((id): id is string => !!id);
        form.setValue('tags', tagIds);
    }
    toast({ title: "Campos preenchidos!", description: `Sugestão "${sugestao.descricao}" aplicada.` });
  };

  const watchTipo = form.watch('tipo');
  const watchMetodo = form.watch('metodoPagamento');
  const watchEntryType = form.watch('entryType');
  
  useEffect(() => {
    if (!isEditing) {
        const currentValues = form.getValues();
        form.reset({ ...defaultValues, tipo: currentValues.tipo } as FormValues);

        if (watchTipo === 'receita') {
            form.setValue('metodoPagamento', 'pix');
        } else if (watchTipo === 'despesa') {
             form.setValue('metodoPagamento', 'credito');
        }
    }
  }, [watchTipo, form, isEditing]);
  
  async function onSubmit(values: FormValues, shouldClose: boolean) {
    const dataToSend = { 
        ...values,
        installment: values.entryType === 'installment',
        recurrenceType: values.entryType === 'recurring' ? values.recurrenceType : 'NONE',
     };

    await onSave(dataToSend, shouldClose);
    if (!shouldClose && !isEditing) {
        resetFormToDefault();
    }
  }

  const paymentSources = (watchTipo === 'despesa' && watchMetodo === 'credito') ? cards : accounts;
  
  const filteredCategories = useMemo(() => {
    return categories.filter(c => c.type === watchTipo);
  }, [categories, watchTipo]);

  const favoriteCategoryIds = useMemo(() => {
    if (!user?.favoriteCategories) return [];
    if (Array.isArray(user.favoriteCategories)) return user.favoriteCategories;
    if (typeof user.favoriteCategories === 'string') {
        try {
            const parsed = JSON.parse(user.favoriteCategories);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }
    return [];
  }, [user]);

  const favoriteCategorySuggestions = useMemo(() => {
    if (!favoriteCategoryIds.length) return [];
    return favoriteCategoryIds
      .map((id) => categories.find((cat) => cat.id === id))
      .filter(Boolean) as Category[];
  }, [favoriteCategoryIds, categories]);

  return (
    <>
    <Form {...form}>
        <form className={cn("w-full max-w-full space-y-4", className)}>
        {/* Bloco Principal */}
        <div className="flex w-full flex-wrap items-center justify-between gap-4">
            <FormField control={form.control} name="tipo" render={({ field }) => (
                <FormItem>
                    <FormControl>
                        <RadioGroup onValueChange={(value) => field.onChange(value as 'despesa' | 'receita' | 'transferencia')} value={field.value} className="flex items-center space-x-2 sm:space-x-4">
                           <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="despesa" /></FormControl><FormLabel className="font-normal text-sm sm:text-base">Despesa</FormLabel></FormItem>
                           <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="receita" /></FormControl><FormLabel className="font-normal text-sm sm:text-base">Receita</FormLabel></FormItem>
                           <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="transferencia" /></FormControl><FormLabel className="font-normal text-sm sm:text-base">Transferência</FormLabel></FormItem>
                        </RadioGroup>
                    </FormControl>
                </FormItem>
            )}/>
            {user?.enableOcr && watchTipo !== 'transferencia' && (<Button type="button" variant="outline" size="sm" onClick={() => setIsOcrDialogOpen(true)}><Camera className="mr-2 h-4 w-4"/>Digitalizar</Button>)}
        </div>
        
        <FormField control={form.control} name="descricao" render={({ field }) => (<FormItem><FormLabel className="flex items-center gap-2"><PencilLine className="h-4 w-4" />Título</FormLabel><FormControl>{user?.habilitarDescricaoInteligente && watchTipo !== 'transferencia' ? (<DescricaoInteligente valor={field.value || ''} onChange={field.onChange} tipoTransacao={watchTipo} onSugestaoSelecionada={handleSuggestionSelected} valorTransacao={form.watch('valor')}/>) : (<Input placeholder={watchTipo === 'transferencia' ? "Ex: Dinheiro para emergências" : "Ex: Almoço no restaurante"} {...field}/>)}</FormControl><FormMessage/></FormItem>)}/>
        
        <div className="flex w-full flex-col gap-4 sm:flex-row">
            <FormField control={form.control} name="valor" render={({ field }) => (<FormItem className="w-full flex-1"><FormLabel className="flex items-center gap-2"><CircleDollarSign className="h-4 w-4" />Valor</FormLabel><FormControl><CurrencyInput value={field.value || 0} onValueChange={field.onChange} /></FormControl><FormMessage /></FormItem>)}/>
            <FormField control={form.control} name="data" render={({ field }) => (<FormItem className="flex w-full flex-1 flex-col"><FormLabel className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" />Data</FormLabel><Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-full pl-3 text-left font-normal h-10',!field.value && 'text-muted-foreground')}>{field.value ? (format(field.value, 'PPP', { locale: ptBR })) : (<span>Escolha uma data</span>)}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={(date) => {if (date) field.onChange(date); setIsCalendarOpen(false)}} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
        </div>

        {watchTipo === 'transferencia' && (
            <div className="flex w-full flex-col gap-4 sm:flex-row">
                <FormField control={form.control} name="fromAccountId" render={({ field }) => (<FormItem className="w-full flex-1"><FormLabel className="flex items-center gap-2"><Landmark className="h-4 w-4" />Conta de Origem</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="De onde sairá o dinheiro?" /></SelectTrigger></FormControl><SelectContent>{accounts.filter(acc => acc.id !== form.watch('toAccountId')).map(acc => (<SelectItem key={acc.id} value={acc.id}>{acc.nome}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                <FormField control={form.control} name="toAccountId" render={({ field }) => (<FormItem className="w-full flex-1"><FormLabel className="flex items-center gap-2"><Landmark className="h-4 w-4" />Conta de Destino</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Para onde vai o dinheiro?" /></SelectTrigger></FormControl><SelectContent>{accounts.filter(acc => acc.id !== form.watch('fromAccountId')).map(acc => (<SelectItem key={acc.id} value={acc.id}>{acc.nome}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
            </div>
        )}
        
        {watchTipo !== 'transferencia' && (
            <>
                <div className="flex w-full flex-col gap-4 sm:flex-row">
                    <FormField control={form.control} name="metodoPagamento" render={({ field }) => (<FormItem className="w-full flex-1"><FormLabel className="flex items-center gap-2"><Wallet className="h-4 w-4" />Pagamento</FormLabel><Select onValueChange={field.onChange as (value: string) => void} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione o método" /></SelectTrigger></FormControl><SelectContent>{watchTipo === 'despesa' && <SelectItem value="credito">Cartão de Crédito</SelectItem>}<SelectItem value="debito">Débito</SelectItem><SelectItem value="pix">PIX</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                    {watchMetodo !== 'dinheiro' && (<FormField control={form.control} name="contaCartaoId" render={({ field }) => (<FormItem className="w-full flex-1"><FormLabel className="flex items-center gap-2"><Landmark className="h-4 w-4" />{watchMetodo === 'credito' ? 'Cartão' : 'Conta'}</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder={`Selecione`} /></SelectTrigger></FormControl><SelectContent>{paymentSources.map(source => (<SelectItem key={source.id} value={source.id}>{source.nome}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>)}
                </div>

                <FormField control={form.control} name="pago" render={({ field }) => (<FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>{field.value ? 'Operação Efetuada' : 'Operação Pendente'}</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
                
                <Separator className="my-4"/>

                <FormField control={form.control} name="entryType" render={({ field }) => (
                    <FormItem className="space-y-3">
                        <FormLabel className="flex items-center gap-2"><Shapes className="h-4 w-4" />Tipo de Lançamento</FormLabel>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {ENTRY_TYPE_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const disabled = option.value === 'installment' && watchTipo !== 'despesa';
                                const isActive = field.value === option.value;
                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={isActive}
                                        disabled={disabled}
                                        onClick={() => field.onChange(option.value)}
                                        className={cn(
                                            'rounded-md border-2 p-3 text-left text-sm transition',
                                            isActive ? 'border-primary/60 bg-primary/5' : 'border-muted',
                                            disabled && 'opacity-40 pointer-events-none'
                                        )}
                                    >
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Icon className="h-4 w-4" />
                                            {option.title}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                                    </button>
                                );
                            })}
                        </div>
                        <FormMessage />
                    </FormItem>
                )}/>
                
                <AnimatePresence>
                {watchEntryType === 'installment' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                        <div className="space-y-4 rounded-lg border p-3 mt-2">
                             <FormField control={form.control} name="totalInstallments" render={({ field }) => (<FormItem><FormLabel>Nº de Parcelas</FormLabel><Select onValueChange={(val) => field.onChange(Number(val))} value={String(field.value)}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>{[...Array(47)].map((_, i) => (<SelectItem key={i + 2} value={String(i + 2)}>{i + 2}x</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>)}/>
                             <FormField control={form.control} name="withInterest" render={({ field }) => (<FormItem className="flex items-center justify-between"><FormLabel>Incluir juros?</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange}/></FormControl></FormItem>)}/>
                             {form.watch('withInterest') && (<FormField control={form.control} name="interestRate" render={({ field }) => (<FormItem><FormLabel>Taxa de Juros ao Mês (%)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="Ex: 1.99" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} /></FormControl><FormMessage /></FormItem>)}/>)}
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>

                 <AnimatePresence>
                {watchEntryType === 'recurring' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                       <div className="space-y-4 rounded-lg border p-3 mt-2">
                           <FormField control={form.control} name="recurrenceType" render={({ field }) => ( <FormItem><FormLabel>Frequência</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="NONE">Nenhuma</SelectItem><SelectItem value="WEEKLY">Semanal</SelectItem><SelectItem value="BIWEEKLY">Quinzenal</SelectItem><SelectItem value="MONTHLY">Mensal</SelectItem><SelectItem value="BIMONTHLY">Bimestral</SelectItem><SelectItem value="TRIMONTHLY">Trimestral</SelectItem><SelectItem value="SEMIANNUALLY">Semestral</SelectItem></SelectContent></Select><FormMessage /></FormItem>)}/>
                       </div>
                    </motion.div>
                )}
                </AnimatePresence>
                
                 <Collapsible open={openCollapsible === 'details'} onOpenChange={() => setOpenCollapsible(prev => prev === 'details' ? null : 'details')}>
                    <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-start gap-2"><ChevronDown className={cn("h-4 w-4 transition-transform", openCollapsible === 'details' && "rotate-180")}/> Detalhes Adicionais</Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent asChild>
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="space-y-4 pt-2">
                                <FormField control={form.control} name="categoryId" render={({ field }) => ( 
                                    <FormItem>
                                        <FormLabel>Categoria</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {filteredCategories.map(cat => (
                                                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {favoriteCategorySuggestions.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                <span className="w-full text-[11px] uppercase tracking-wide text-muted-foreground">
                                                    Sugestões
                                                </span>
                                                {favoriteCategorySuggestions.map((cat) => (
                                                    <Button
                                                        key={cat.id}
                                                        type="button"
                                                        size="xs"
                                                        variant={field.value === cat.id ? 'default' : 'outline'}
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            field.onChange(cat.id);
                                                        }}
                                                    >
                                                        {cat.label}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <FormField control={form.control} name="tags" render={({ field }) => (<FormItem><FormLabel>Tags</FormLabel><FormControl><TagInput allTags={userTags} selectedTags={field.value || []} onChange={(newTags) => field.onChange(newTags)} onTagsUpdate={setUserTags}/></FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="attachmentUrl" render={({ field }) => (<FormItem><FormLabel>Comprovante</FormLabel><FormControl>{field.value ? (<AttachmentPreviewer objectName={field.value} onRemove={() => form.setValue('attachmentUrl', null)}/>) : (<FileUpload onValueChange={(objectName) => field.onChange(objectName)}/>)}</FormControl><FormMessage /></FormItem>)}/>
                                <FormField control={form.control} name="notes" render={({ field }) => (<FormItem><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Detalhes adicionais..." {...field}/></FormControl><FormMessage /></FormItem>)}/>
                            </div>
                        </motion.div>
                    </CollapsibleContent>
                </Collapsible>
            </>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end pt-6 gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">Cancelar</Button>
          {!isEditing && watchTipo !== 'transferencia' && (
            <Button type="button" onClick={() => onSubmit(form.getValues(), false)} disabled={isSubmitting} className="w-full sm:w-auto">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
              Salvar e Criar Nova
            </Button>
          )}
          <Button type="button" onClick={() => onSubmit(form.getValues(), true)} disabled={isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : null}
            {isEditing ? 'Salvar Alterações' : 'Salvar e Fechar'}
          </Button>
        </div>
        </form>
    </Form>
    <OcrUploadDialog isOpen={isOcrDialogOpen} onClose={() => setIsOcrDialogOpen(false)} onOcrComplete={handleOcrComplete}/>
    </>
  );
}
