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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { Account, Card, Transaction, Category, OcrData, User, Tag } from '@/lib/definitions';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
import { CalendarIcon, Loader2, Camera, Repeat, Repeat1, Layers, PencilLine, CircleDollarSign, Shapes, Wallet, Landmark, ChevronDown, CreditCard, Banknote, QrCode, ArrowRightLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, addYears, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Switch } from '@/components/ui/switch';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { FileUpload } from '@/components/ui/file-upload';
import { AttachmentPreviewer } from '@/components/ui/attachment-previewer';
import { CurrencyInput } from '@/components/ui/currency-input';
import { OcrUploadDialog } from '@/components/ui/ocr-upload-dialog';
import { TagInput } from './tag-input';
import { DescricaoInteligente, type SugestaoTransacao } from './descricao-inteligente';
import { Textarea } from '@/components/ui/textarea';
import { AnimatePresence, motion } from 'framer-motion';
import { useDebts } from '@/hooks/use-debts';


// Schema único e robusto com validação condicional
const ENTRY_TYPE_OPTIONS = [
  { value: 'single', title: 'Único', description: 'Vale para uma data', icon: Repeat1 },
  { value: 'installment', title: 'Parcelado', description: 'Divide o valor', icon: Layers },
  { value: 'recurring', title: 'Recorrente', description: 'Repete automaticamente', icon: Repeat },
];

const TRANSACTION_TYPE_OPTIONS = [
  { value: 'despesa', label: 'Despesa', icon: TrendingDown },
  { value: 'receita', label: 'Receita', icon: TrendingUp },
  { value: 'transferencia', label: 'Transferência', icon: ArrowRightLeft },
] as const;

type OptionalSectionProps = {
  title: string;
  description?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
};

const OptionalSection = ({ title, description, isOpen, onToggle, children }: OptionalSectionProps) => (
  <div className="rounded-2xl border bg-card/40 px-4 py-3 shadow-sm transition-all duration-200 hover:bg-card/60">
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      className="flex w-full items-center justify-between gap-3 text-left"
    >
      <div className="space-y-0.5">
        <p className="text-sm font-semibold leading-tight">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <ChevronDown className={cn('h-4 w-4 transition-transform duration-300', isOpen && 'rotate-180')} />
    </button>
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="pt-4 pb-2">
            <div className="space-y-4 text-sm text-foreground">{children}</div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const formSchema = z.object({
  tipo: z.enum(['despesa', 'receita', 'transferencia']),
  descricao: z.string().optional(),
  valor: z.coerce.number().positive({ message: 'O valor deve ser positivo.' }),
  data: z.date({ required_error: "A data é obrigatória." }),
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
  debtId: z.string().optional(),
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

type OptionalSectionName = 'status' | 'schedule' | 'extras';

const OPTIONAL_FIELD_SECTION: Partial<Record<keyof FormValues, OptionalSectionName>> = {
  pago: 'status',
  entryType: 'schedule',
  totalInstallments: 'schedule',
  withInterest: 'schedule',
  interestRate: 'schedule',
  recurrenceType: 'schedule',
  categoryId: 'extras',
  tags: 'extras',
  attachmentUrl: 'extras',
  notes: 'extras',
  debtId: 'extras',
};

const computeOptionalSectionState = (values: Partial<FormValues>): Record<OptionalSectionName, boolean> => ({
  status: values.pago === false,
  schedule: values.entryType === 'installment' || values.entryType === 'recurring',
  extras: Boolean(
    (values.tags && values.tags.length > 0) ||
    values.categoryId ||
    values.attachmentUrl ||
    (values.notes && values.notes.length > 0) ||
    values.debtId
  ),
});


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
    debtId: undefined,
  };
  const [isOcrDialogOpen, setIsOcrDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [optionalSections, setOptionalSections] = useState<Record<OptionalSectionName, boolean>>(
    computeOptionalSectionState(defaultValues as FormValues)
  );
  const { toast } = useToast();
  const { debts } = useDebts();
  const fieldRefs = useRef<Partial<Record<keyof FormValues, HTMLDivElement | null>>>({});
  const registerFieldRef = useCallback(
    (name: keyof FormValues) => (node: HTMLDivElement | null) => {
      fieldRefs.current[name] = node;
    },
    []
  );
  const toggleOptionalSection = useCallback((section: OptionalSectionName) => {
    setOptionalSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);
  const openSectionForField = useCallback((field: keyof FormValues) => {
    const targetSection = OPTIONAL_FIELD_SECTION[field];
    if (!targetSection) return;
    setOptionalSections((prev) => (prev[targetSection] ? prev : { ...prev, [targetSection]: true }));
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues as FormValues,
  });

  const resetFormToDefault = () => {
    const currentTipo = form.getValues('tipo');
    const nextValues = {
      ...(defaultValues as FormValues),
      tipo: currentTipo,
    };
    form.reset(nextValues);
    setOptionalSections(computeOptionalSectionState(nextValues));
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
      else if (transaction.recurrenceType) entryType = 'recurring';

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
        metodoPagamento: (transaction.metodoPagamento === 'transferencia' ? 'debito' : transaction.metodoPagamento) as any,
        contaCartaoId: transaction.accountId || transaction.cardId || '',
        entryType: entryType,
        recurrenceType: transaction.recurrenceType || 'NONE',
        installment: !!transaction.installment,
        totalInstallments: transaction.totalInstallments || 2,
        withInterest: !!transaction.withInterest,
        interestRate: transaction.interestRate || 0,
        debtId: transaction.debtId || undefined,
      };
      const mergedValues = { ...(defaultValues as FormValues), ...valuesToReset };
      form.reset(mergedValues as FormValues);
      setOptionalSections(computeOptionalSectionState(mergedValues));
    } else if (!transaction) {
      form.reset(defaultValues as FormValues);
      setOptionalSections(computeOptionalSectionState(defaultValues as FormValues));
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
    if (form.formState.submitCount === 0) return;
    const firstErrorEntry = Object.entries(form.formState.errors)[0] as [keyof FormValues, unknown] | undefined;
    if (!firstErrorEntry) return;
    const fieldName = firstErrorEntry[0];
    openSectionForField(fieldName);
    let attempts = 0;
    let scrollTimeout: number | null = null;
    let highlightTimeout: number | null = null;

    const tryScroll = () => {
      const fieldNode = fieldRefs.current[fieldName];
      if (!fieldNode && attempts < 5) {
        attempts += 1;
        scrollTimeout = window.setTimeout(tryScroll, 120);
        return;
      }
      if (!fieldNode) return;
      fieldNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
      fieldNode.classList.add('ring-2', 'ring-destructive/40');
      highlightTimeout = window.setTimeout(() => {
        fieldNode.classList.remove('ring-2', 'ring-destructive/40');
      }, 1800);
    };

    scrollTimeout = window.setTimeout(tryScroll, 120);

    return () => {
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
      if (highlightTimeout) {
        window.clearTimeout(highlightTimeout);
        const node = fieldRefs.current[fieldName];
        node?.classList.remove('ring-2', 'ring-destructive/40');
      }
    };
  }, [form.formState.errors, form.formState.submitCount, openSectionForField]);

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
        <form className={cn("w-full max-w-full space-y-6", className)}>

          {/* 1. Animated Segmented Control for Type */}
          <div className="flex justify-center pb-2 w-full overflow-x-auto no-scrollbar" ref={registerFieldRef('tipo')}>
            <div className="relative flex p-1 bg-muted/50 rounded-full min-w-fit">
              {TRANSACTION_TYPE_OPTIONS.map((option) => {
                const isActive = watchTipo === option.value;
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => form.setValue('tipo', option.value)}
                    className={cn(
                      "relative z-10 flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-colors duration-200 rounded-full whitespace-nowrap",
                      isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeType"
                        className={cn(
                          "absolute inset-0 rounded-full shadow-sm",
                          option.value === 'despesa' ? "bg-rose-500" :
                            option.value === 'receita' ? "bg-emerald-500" : "bg-primary"
                        )}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                      />
                    )}
                    <span className="relative z-20 flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      {option.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* 2. Hero Amount Input */}
          <div className="flex flex-col items-center justify-center py-2" ref={registerFieldRef('valor')}>
            <FormField
              control={form.control}
              name="valor"
              render={({ field }) => (
                <FormItem className="w-full text-center">
                  <FormControl>
                    <div className="relative flex items-center justify-center">
                      <span className="text-3xl sm:text-4xl font-bold text-muted-foreground mr-2">R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="0,00"
                        className="bg-transparent text-5xl sm:text-6xl font-bold text-center w-full max-w-[250px] sm:max-w-[300px] outline-none placeholder:text-muted-foreground/30"
                        value={new Intl.NumberFormat('pt-BR', {
                          style: 'decimal',
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        }).format(field.value || 0)}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          const realValue = Number(value) / 100;
                          field.onChange(realValue);
                        }}
                        autoFocus
                      />
                    </div>
                  </FormControl>
                  <FormMessage className="text-center" />
                </FormItem>
              )}
            />
          </div>

          {/* 3. Description & Date Row */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
            <div className="scroll-mt-28" ref={registerFieldRef('descricao')}>
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      {user?.habilitarDescricaoInteligente && watchTipo !== 'transferencia' ? (
                        <DescricaoInteligente
                          valor={field.value || ''}
                          onChange={field.onChange}
                          tipoTransacao={watchTipo}
                          onSugestaoSelecionada={handleSuggestionSelected}
                          valorTransacao={form.watch('valor')}
                        />
                      ) : (
                        <div className="relative">
                          <PencilLine className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder={
                              watchTipo === 'transferencia'
                                ? 'Ex: Dinheiro para emergências'
                                : 'Ex: Almoço no restaurante'
                            }
                            className="pl-10 h-12 text-lg bg-card/50 border-muted-foreground/20 focus-visible:ring-primary/50"
                            {...field}
                          />
                        </div>
                      )}
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="scroll-mt-28 min-w-[160px]" ref={registerFieldRef('data')}>
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn('w-full pl-3 text-left font-normal h-12 bg-card/50 border-muted-foreground/20 hover:bg-card/80', !field.value && 'text-muted-foreground')}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                            {field.value ? (
                              format(field.value, 'dd/MM/yyyy')
                            ) : (
                              <span>Data</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            if (date) field.onChange(date);
                            setIsCalendarOpen(false);
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* 4. Quick Payment Methods (Horizontal Scroll) */}
          {watchTipo !== 'transferencia' && (
            <div className="space-y-2" ref={registerFieldRef('metodoPagamento')}>
              <FormField
                control={form.control}
                name="metodoPagamento"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {[
                          { value: 'credito', label: 'Crédito', icon: CreditCard },
                          { value: 'debito', label: 'Débito', icon: CreditCard },
                          { value: 'pix', label: 'PIX', icon: QrCode },
                          { value: 'dinheiro', label: 'Dinheiro', icon: Banknote },
                        ].map((method) => {
                          if (watchTipo === 'despesa' && method.value === 'credito') {
                            // Show Credit
                          } else if (watchTipo === 'receita' && method.value === 'credito') {
                            return null; // Hide Credit for Income
                          }

                          const isActive = field.value === method.value;
                          const Icon = method.icon;
                          return (
                            <button
                              key={method.value}
                              type="button"
                              onClick={() => field.onChange(method.value)}
                              className={cn(
                                "flex flex-col items-center justify-center min-w-[80px] h-20 rounded-xl border-2 transition-all duration-200 gap-2",
                                isActive
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-muted bg-card/30 text-muted-foreground hover:bg-card/60 hover:border-muted-foreground/50"
                              )}
                            >
                              <Icon className="h-6 w-6" />
                              <span className="text-xs font-medium">{method.label}</span>
                            </button>
                          )
                        })}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* Account/Card Selection */}
          {watchTipo !== 'transferencia' && watchMetodo !== 'dinheiro' && (
            <div className="scroll-mt-28" ref={registerFieldRef('contaCartaoId')}>
              <FormField
                control={form.control}
                name="contaCartaoId"
                render={({ field }) => (
                  <FormItem>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 bg-card/50 border-muted-foreground/20">
                          <div className="flex items-center gap-2">
                            <Landmark className="h-4 w-4 text-muted-foreground" />
                            <SelectValue placeholder={`Selecione ${watchMetodo === 'credito' ? 'o cartão' : 'a conta'}`} />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {paymentSources.map((source) => (
                          <SelectItem key={source.id} value={source.id}>
                            {source.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}


          {watchTipo === 'transferencia' && (
            <div className="flex w-full flex-col gap-4 sm:flex-row">
              <div className="w-full flex-1 scroll-mt-28" ref={registerFieldRef('fromAccountId')}>
                <FormField
                  control={form.control}
                  name="fromAccountId"
                  render={({ field }) => (
                    <FormItem className="w-full flex-1">
                      <FormLabel className="flex items-center gap-2">
                        <Landmark className="h-4 w-4" />
                        Conta de Origem
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 bg-card/50">
                            <SelectValue placeholder="De onde sairá o dinheiro?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts
                            .filter((acc) => acc.id !== form.watch('toAccountId'))
                            .map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.nome}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="w-full flex-1 scroll-mt-28" ref={registerFieldRef('toAccountId')}>
                <FormField
                  control={form.control}
                  name="toAccountId"
                  render={({ field }) => (
                    <FormItem className="w-full flex-1">
                      <FormLabel className="flex items-center gap-2">
                        <Landmark className="h-4 w-4" />
                        Conta de Destino
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-11 bg-card/50">
                            <SelectValue placeholder="Para onde vai o dinheiro?" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accounts
                            .filter((acc) => acc.id !== form.watch('fromAccountId'))
                            .map((acc) => (
                              <SelectItem key={acc.id} value={acc.id}>
                                {acc.nome}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          {/* Optional Sections */}
          <div className="space-y-3 pt-2">
            <OptionalSection
              title="Status do pagamento"
              description="Atualize quando a operação já foi concluída."
              isOpen={optionalSections.status}
              onToggle={() => toggleOptionalSection('status')}
            >
              <div className="scroll-mt-28" ref={registerFieldRef('pago')}>
                <FormField
                  control={form.control}
                  name="pago"
                  render={({ field }) => {
                    const isCreditCard = watchTipo === 'despesa' && watchMetodo === 'credito';
                    return (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-card/50">
                        <div className="space-y-0.5">
                          <FormLabel>
                            {isCreditCard
                              ? 'Cartão de Crédito - Pago com a Fatura'
                              : field.value ? 'Operação Efetuada' : 'Operação Pendente'
                            }
                          </FormLabel>
                          {isCreditCard && (
                            <p className="text-xs text-muted-foreground">
                              Despesas de crédito são pagas ao quitar a fatura
                            </p>
                          )}
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isCreditCard}
                          />
                        </FormControl>
                      </FormItem>
                    );
                  }}
                />
              </div>
            </OptionalSection>

            <OptionalSection
              title="Parcelas ou recorrência"
              description="Use apenas se precisar parcelar ou repetir um lançamento."
              isOpen={optionalSections.schedule}
              onToggle={() => toggleOptionalSection('schedule')}
            >
              <div className="scroll-mt-28" ref={registerFieldRef('entryType')}>
                <FormField
                  control={form.control}
                  name="entryType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="flex items-center gap-2">
                        <Shapes className="h-4 w-4" />
                        Tipo de Lançamento
                      </FormLabel>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
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
                                'rounded-xl border-2 p-3 text-left text-sm transition-all duration-200',
                                isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-muted bg-card/30 hover:bg-card/60',
                                disabled && 'pointer-events-none opacity-40'
                              )}
                            >
                              <div className="flex items-center gap-2 font-semibold">
                                <Icon className="h-4 w-4" />
                                {option.title}
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                            </button>
                          );
                        })}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <AnimatePresence>
                {watchEntryType === 'installment' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-4 rounded-lg border p-3 bg-card/50">
                      <div className="scroll-mt-28" ref={registerFieldRef('totalInstallments')}>
                        <FormField
                          control={form.control}
                          name="totalInstallments"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nº de Parcelas</FormLabel>
                              <Select onValueChange={(val) => field.onChange(Number(val))} value={String(field.value)}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {[...Array(47)].map((_, i) => (
                                    <SelectItem key={i + 2} value={String(i + 2)}>
                                      {i + 2}x
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="scroll-mt-28" ref={registerFieldRef('withInterest')}>
                        <FormField
                          control={form.control}
                          name="withInterest"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <FormLabel>Incluir juros?</FormLabel>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      {form.watch('withInterest') && (
                        <div className="scroll-mt-28" ref={registerFieldRef('interestRate')}>
                          <FormField
                            control={form.control}
                            name="interestRate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Taxa de Juros ao Mês (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="Ex: 1.99"
                                    {...field}
                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {watchEntryType === 'recurring' && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 space-y-4 rounded-lg border p-3 bg-card/50">
                      <div className="scroll-mt-28" ref={registerFieldRef('recurrenceType')}>
                        <FormField
                          control={form.control}
                          name="recurrenceType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Frequência</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="NONE">Nenhuma</SelectItem>
                                  <SelectItem value="WEEKLY">Semanal</SelectItem>
                                  <SelectItem value="BIWEEKLY">Quinzenal</SelectItem>
                                  <SelectItem value="MONTHLY">Mensal</SelectItem>
                                  <SelectItem value="BIMONTHLY">Bimestral</SelectItem>
                                  <SelectItem value="TRIMONTHLY">Trimestral</SelectItem>
                                  <SelectItem value="SEMIANNUALLY">Semestral</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </OptionalSection>

            <OptionalSection
              title="Detalhes adicionais"
              description="Categoria, tags, anexos e observações."
              isOpen={optionalSections.extras}
              onToggle={() => toggleOptionalSection('extras')}
            >
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="scroll-mt-28" ref={registerFieldRef('categoryId')}>
                    <FormField
                      control={form.control}
                      name="categoryId"
                      render={({ field }) => {
                        const selectedCategoryId = field.value;
                        const selectedCategory = categories.find(c => c.id === selectedCategoryId);

                        // Determine current parent and sub selection
                        let currentParentId: string | undefined;
                        let currentSubId: string | undefined;

                        if (selectedCategory) {
                          if (selectedCategory.parentCategoryId) {
                            currentParentId = selectedCategory.parentCategoryId;
                            currentSubId = selectedCategory.id;
                          } else {
                            currentParentId = selectedCategory.id;
                            currentSubId = undefined;
                          }
                        }

                        const parentCategories = useMemo(() =>
                          filteredCategories.filter(c => !c.parentCategoryId),
                          [filteredCategories]
                        );

                        const subCategories = useMemo(() =>
                          currentParentId ? filteredCategories.filter(c => c.parentCategoryId === currentParentId) : [],
                          [filteredCategories, currentParentId]
                        );

                        return (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {/* Parent Select */}
                              <Select
                                value={currentParentId}
                                onValueChange={(val) => field.onChange(val)}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-card/50 border-muted-foreground/20">
                                    <SelectValue placeholder="Categoria Principal" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {parentCategories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              {/* Subcategory Select */}
                              <Select
                                value={currentSubId || "none"}
                                onValueChange={(val) => {
                                  if (val === "none") {
                                    field.onChange(currentParentId);
                                  } else {
                                    field.onChange(val);
                                  }
                                }}
                                disabled={!currentParentId || subCategories.length === 0}
                              >
                                <FormControl>
                                  <SelectTrigger className="bg-card/50 border-muted-foreground/20">
                                    <SelectValue placeholder="Subcategoria (Opcional)" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">Sem subcategoria</SelectItem>
                                  {subCategories.map(cat => (
                                    <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {favoriteCategorySuggestions.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                <span className="w-full text-[11px] uppercase tracking-wide text-muted-foreground">
                                  Sugestões
                                </span>
                                {favoriteCategorySuggestions.map((cat) => (
                                  <Button
                                    key={cat.id}
                                    type="button"
                                    size="sm"
                                    className="h-6 text-xs px-2"
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
                        );
                      }}
                    />
                  </div>

                  {watchTipo === 'despesa' && (
                    <FormField
                      control={form.control}
                      name="debtId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Vincular Pagamento de Dívida (Opcional)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-card/50 border-muted-foreground/20">
                                <SelectValue placeholder="Selecione uma dívida para abater" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">Nenhuma</SelectItem>
                              {debts.filter(d => d.status === 'ACTIVE').map((debt) => (
                                <SelectItem key={debt.id} value={debt.id}>
                                  {debt.name} ({new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(debt.currentBalance))})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  <div className="scroll-mt-28" ref={registerFieldRef('tags')}>
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <TagInput
                              allTags={userTags}
                              selectedTags={field.value || []}
                              onChange={(newTags) => field.onChange(newTags)}
                              onTagsUpdate={setUserTags}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="scroll-mt-28" ref={registerFieldRef('attachmentUrl')}>
                    <FormField
                      control={form.control}
                      name="attachmentUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Comprovante</FormLabel>
                          <FormControl>
                            {field.value ? (
                              <AttachmentPreviewer objectName={field.value} onRemove={() => form.setValue('attachmentUrl', null)} />
                            ) : (
                              <FileUpload onValueChange={(objectName) => field.onChange(objectName)} />
                            )}
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="scroll-mt-28 md:col-span-2" ref={registerFieldRef('notes')}>
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Detalhes adicionais..." {...field} className="bg-card/50 border-muted-foreground/20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </OptionalSection>
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end pt-6 gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting} className="w-full sm:w-auto">Cancelar</Button>
            {!isEditing && watchTipo !== 'transferencia' && (
              <Button type="button" variant="outline" onClick={() => onSubmit(form.getValues(), false)} disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar e Criar Nova
              </Button>
            )}
            <Button type="button" onClick={() => onSubmit(form.getValues(), true)} disabled={isSubmitting} className="w-full sm:w-auto shadow-lg shadow-primary/20">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isEditing ? 'Salvar Alterações' : 'Salvar Transação'}
            </Button>
          </div>
        </form>
      </Form>
      <OcrUploadDialog isOpen={isOcrDialogOpen} onClose={() => setIsOcrDialogOpen(false)} onOcrComplete={handleOcrComplete} />
    </>
  );
}
