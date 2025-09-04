// src/components/dashboard/transacoes/transaction-filters.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Account, Card as CardType, Category, Tag } from '@/lib/definitions';
import { Loader2, Sparkles, Calendar as CalendarIcon, X, Check } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, subDays, subMonths, subYears, parseISO } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { ptBR } from 'date-fns/locale';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';

export type FilterState = {
  text: string | null;
  accounts: string[];
  cards: string[];
  categories: string[];
  methods: string[];
  tags: string[];
  type: 'receita' | 'despesa' | null;
  dateRange?: DateRange;
  value_greater_than?: number | null;
  value_less_than?: number | null;
};

type TransactionFiltersProps = {
  accounts: Account[];
  cards: CardType[];
  categories: Category[];
  tags: Tag[];
  currentFilters: FilterState;
  onFilterChange: (filters: FilterState) => void;
};

// Componente reutilizável para seleção múltipla com busca
function MultiSelectFilter({ title, options, selectedValues, onValueChange }: { title: string, options: { value: string, label: string }[], selectedValues: string[], onValueChange: (newValues: string[]) => void }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');

    const handleSelect = (value: string) => {
        const newSelection = selectedValues.includes(value)
            ? selectedValues.filter(v => v !== value)
            : [...selectedValues, value];
        onValueChange(newSelection);
    }
    
    const handleUnselect = (value: string) => {
        onValueChange(selectedValues.filter(v => v !== value));
    }
    
    const selectedLabels = options.filter(opt => selectedValues.includes(opt.value)).map(opt => opt.label);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-start h-auto flex-wrap">
                    <div className="flex gap-1 flex-wrap">
                         {selectedLabels.length > 0 ? selectedLabels.map(label => (
                            <Badge key={label} variant="secondary" className="mr-1">
                                {label}
                                <span
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleUnselect(options.find(opt => opt.label === label)!.value)}
                                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const option = options.find(opt => opt.label === label);
                                        if (option) handleUnselect(option.value);
                                    }}
                                >
                                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                                </span>
                            </Badge>
                         )) : `Selecione ${title}...`}
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                    <CommandInput placeholder={`Buscar ${title}...`} value={search} onValueChange={setSearch} />
                    <CommandEmpty>Nenhum resultado.</CommandEmpty>
                    <CommandList>
                        <CommandGroup>
                            {options.map(option => (
                                <CommandItem key={option.value} onSelect={() => handleSelect(option.value)}>
                                    <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", selectedValues.includes(option.value) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                                        <Check className="h-4 w-4" />
                                    </div>
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

export function TransactionFilters({
  accounts,
  cards,
  categories,
  tags,
  currentFilters,
  onFilterChange,
}: TransactionFiltersProps) {
  const [localFilters, setLocalFilters] = useState<FilterState>(currentFilters);
  const [aiQuery, setAiQuery] = useState('');
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();

  const handleSetDateRange = (preset: '30d' | '90d' | '1y') => {
    const today = new Date();
    let from: Date;
    switch(preset) {
        case '30d':
            from = subDays(today, 30);
            break;
        case '90d':
            from = subMonths(today, 3);
            break;
        case '1y':
            from = subYears(today, 1);
            break;
    }
    setLocalFilters(prev => ({...prev, dateRange: { from, to: today }}));
  };
  
  const handleClearFilters = () => {
    const clearedFilters: FilterState = {
        text: null,
        accounts: [],
        cards: [],
        categories: [],
        methods: [],
        tags: [],
        type: null,
        dateRange: undefined,
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
    setAiQuery('');
  };
  
  const handleApplyFilters = () => {
    onFilterChange(localFilters);
  };

   const handleAiSearch = async () => {
    if (!aiQuery) return;
    setIsAiSearching(true);
    try {
      const response = await api.post('/ai/search-transactions', { query: aiQuery });
      const filtersFromAI = response.data;
      
      const newFilters: Partial<FilterState> = {
          text: null, accounts: [], cards: [], categories: [], methods: [], type: null, dateRange: undefined, tags: []
      };
      
      if (filtersFromAI.text) newFilters.text = filtersFromAI.text;
      if (filtersFromAI.categories) newFilters.categories = filtersFromAI.categories;
      if (filtersFromAI.accounts) newFilters.accounts = filtersFromAI.accounts;
      if (filtersFromAI.cards) newFilters.cards = filtersFromAI.cards;
      if (filtersFromAI.methods) newFilters.methods = filtersFromAI.methods;
      if (filtersFromAI.type) newFilters.type = filtersFromAI.type;
      if (filtersFromAI.value_greater_than) newFilters.value_greater_than = filtersFromAI.value_greater_than;
      if (filtersFromAI.value_less_than) newFilters.value_less_than = filtersFromAI.value_less_than;
      if (filtersFromAI.start_date || filtersFromAI.end_date) {
        newFilters.dateRange = {
            from: filtersFromAI.start_date ? parseISO(filtersFromAI.start_date) : undefined,
            to: filtersFromAI.end_date ? parseISO(filtersFromAI.end_date) : undefined
        }
      }

      setLocalFilters(prev => ({...prev, ...newFilters}));
      onFilterChange({ ...currentFilters, ...newFilters });

      toast({ title: "Filtros aplicados", description: "A busca com IA aplicou novos filtros." });

    } catch (e) {
       toast({ variant: 'destructive', title: "Erro", description: "Ocorreu um erro ao processar a busca." });
    } finally {
      setIsAiSearching(false);
    }
  };


  const paymentMethods = [
    { value: 'credito', label: 'Cartão de Crédito' },
    { value: 'debito', label: 'Débito' },
    { value: 'pix', label: 'PIX' },
    { value: 'dinheiro', label: 'Dinheiro' },
  ];

  const categoryOptions = categories.map(cat => ({ value: cat.nome, label: cat.label }));
  const tagOptions = tags.map(tag => ({ value: tag.id, label: tag.name }));
  const accountOptions = accounts.map(acc => ({ value: acc.id, label: acc.nome }));
  const cardOptions = cards.map(card => ({ value: card.id, label: card.nome }));

  return (
    <div className="flex h-full flex-col">
      <SheetHeader className="p-6">
        <SheetTitle>Filtrar Transações</SheetTitle>
        <SheetDescription>
          Use a busca com IA ou os filtros manuais para encontrar o que procura.
        </SheetDescription>
      </SheetHeader>
      
      <ScrollArea className="flex-1">
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="ai-search">Busca Inteligente com IA</Label>
            <div className="flex gap-2">
              <Input
                id="ai-search"
                placeholder="Ex: gastos com iFood no mês passado"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
              />
              <Button onClick={handleAiSearch} disabled={isAiSearching || !aiQuery} className="px-3">
                {isAiSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Período</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                    "w-full justify-start text-left font-normal",
                    !localFilters.dateRange && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFilters.dateRange?.from ? (
                    localFilters.dateRange.to ? (
                        <>
                        {format(localFilters.dateRange.from, "dd/MM/y", { locale: ptBR })} -{" "}
                        {format(localFilters.dateRange.to, "dd/MM/y", { locale: ptBR })}
                        </>
                    ) : (
                        format(localFilters.dateRange.from, "dd/MM/y", { locale: ptBR })
                    )
                    ) : (
                    <span>Escolha um período</span>
                    )}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={localFilters.dateRange?.from}
                    selected={localFilters.dateRange}
                    onSelect={(range) => {
                      setLocalFilters(prev => ({...prev, dateRange: range}));
                      if (range?.from && range.to) {
                          setIsCalendarOpen(false);
                      }
                    }}
                    numberOfMonths={1}
                    locale={ptBR}
                />
                </PopoverContent>
            </Popover>
            <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleSetDateRange('30d')}>30 dias</Button>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleSetDateRange('90d')}>90 dias</Button>
                <Button variant="outline" size="sm" className="rounded-full" onClick={() => handleSetDateRange('1y')}>1 ano</Button>
            </div>
          </div>

          <div className="space-y-3">
              <Label>Tipo de Transação</Label>
              <RadioGroup
                value={localFilters.type || 'todos'}
                onValueChange={(value) => setLocalFilters(prev => ({...prev, type: value === 'todos' ? null : value as 'receita' | 'despesa'}))}
                className="flex items-center space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="todos" id="r-all"/>
                  <Label htmlFor='r-all' className="font-normal">Todos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="despesa" id="r-expense"/>
                  <Label htmlFor='r-expense' className="font-normal">Despesas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="receita" id="r-income"/>
                  <Label htmlFor='r-income' className="font-normal">Receitas</Label>
                </div>
              </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Categorias</Label>
            <MultiSelectFilter
                title="Categorias"
                options={categoryOptions}
                selectedValues={localFilters.categories}
                onValueChange={(values) => setLocalFilters(prev => ({...prev, categories: values}))}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Tags</Label>
             <MultiSelectFilter
                title="Tags"
                options={tagOptions}
                selectedValues={localFilters.tags}
                onValueChange={(values) => setLocalFilters(prev => ({...prev, tags: values}))}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Contas</Label>
             <MultiSelectFilter
                title="Contas"
                options={accountOptions}
                selectedValues={localFilters.accounts}
                onValueChange={(values) => setLocalFilters(prev => ({...prev, accounts: values}))}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Cartões</Label>
             <MultiSelectFilter
                title="Cartões"
                options={cardOptions}
                selectedValues={localFilters.cards}
                onValueChange={(values) => setLocalFilters(prev => ({...prev, cards: values}))}
            />
          </div>
          
          <div className="space-y-2">
              <Label>Métodos de Pagamento</Label>
               <MultiSelectFilter
                title="Métodos"
                options={paymentMethods}
                selectedValues={localFilters.methods}
                onValueChange={(values) => setLocalFilters(prev => ({...prev, methods: values}))}
            />
            </div>
        </div>
      </ScrollArea>

      <SheetFooter className="p-6 mt-auto border-t bg-background">
        <div className="flex w-full gap-2">
            <Button variant="ghost" onClick={handleClearFilters} className="flex-1">Limpar</Button>
            <SheetClose asChild>
                <Button onClick={handleApplyFilters} className="flex-1">Aplicar Filtros</Button>
            </SheetClose>
        </div>
      </SheetFooter>
    </div>
  );
}
