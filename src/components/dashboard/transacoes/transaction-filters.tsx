'use client';

import { useEffect, useState } from 'react';
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
import { Loader2, Sparkles, Calendar as CalendarIcon, X, Check, Filter } from 'lucide-react';
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
import { motion } from 'framer-motion';

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
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-start h-auto min-h-[44px] flex-wrap py-2 px-3 rounded-xl border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30 transition-all">
          <div className="flex gap-1.5 flex-wrap">
            {selectedLabels.length > 0 ? selectedLabels.map(label => (
              <Badge key={label} variant="secondary" className="mr-1 py-1 px-2 rounded-md bg-primary/10 text-primary hover:bg-primary/20 border-0">
                {label}
                <span
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleUnselect(options.find(opt => opt.label === label)!.value)}
                  className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const option = options.find(opt => opt.label === label);
                    if (option) handleUnselect(option.value);
                  }}
                >
                  <X className="h-3 w-3 hover:text-destructive" />
                </span>
              </Badge>
            )) : <span className="text-muted-foreground font-normal">Selecione {title}...</span>}
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 rounded-xl shadow-xl border-muted">
        <Command className="rounded-xl">
          <CommandInput placeholder={`Buscar ${title}...`} value={search} onValueChange={setSearch} className="h-11" />
          <CommandEmpty>Nenhum resultado.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map(option => (
                <CommandItem key={option.value} onSelect={() => handleSelect(option.value)} className="cursor-pointer py-2.5">
                  <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", selectedValues.includes(option.value) ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible")}>
                    <Check className="h-3 w-3" />
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

  useEffect(() => {
    setLocalFilters(currentFilters);
  }, [currentFilters]);

  const handleSetDateRange = (preset: '30d' | '90d' | '1y') => {
    const today = new Date();
    let from: Date;
    switch (preset) {
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
    setLocalFilters(prev => ({ ...prev, dateRange: { from, to: today } }));
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

      setLocalFilters(prev => ({ ...prev, ...newFilters }));
      onFilterChange({ ...currentFilters, ...newFilters });

      toast({
        title: "Filtros aplicados com IA",
        description: "Encontrei o que você pediu e apliquei os filtros.",
        className: "bg-primary text-primary-foreground border-none"
      });

    } catch (e) {
      toast({ variant: 'destructive', title: "Erro na busca IA", description: "Não consegui processar seu pedido agora." });
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
    <div className="flex h-full flex-col bg-background">
      <SheetHeader className="px-6 pt-6 pb-4 border-b">
        <SheetTitle className="flex items-center gap-2 text-xl">
          <Filter className="h-5 w-5 text-primary" />
          Filtrar Transações
        </SheetTitle>
        <SheetDescription>
          Refine sua busca para encontrar exatamente o que precisa.
        </SheetDescription>
      </SheetHeader>

      <ScrollArea className="flex-1">
        <div className="space-y-8 p-6">

          {/* Busca IA */}
          <div className="space-y-3 p-4 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-background border border-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Sparkles className="h-24 w-24" />
            </div>
            <Label htmlFor="ai-search" className="flex items-center gap-2 text-primary font-semibold">
              <Sparkles className="h-4 w-4" />
              Busca Inteligente com IA
            </Label>
            <div className="flex gap-2 relative z-10">
              <Input
                id="ai-search"
                placeholder="Ex: gastos com iFood mês passado..."
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                className="bg-background/80 backdrop-blur-sm border-primary/30 focus-visible:ring-primary/50"
              />
              <Button onClick={handleAiSearch} disabled={isAiSearching || !aiQuery} className="px-3 shadow-md bg-primary hover:bg-primary/90">
                {isAiSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground/80">
              A IA entende linguagem natural para filtrar datas, categorias e valores automaticamente.
            </p>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Período</Label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal h-11 rounded-xl border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/30 transition-all",
                    !localFilters.dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
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
              <PopoverContent className="w-auto p-0 rounded-xl shadow-xl border-muted" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={localFilters.dateRange?.from}
                  selected={localFilters.dateRange}
                  onSelect={(range) => {
                    setLocalFilters(prev => ({ ...prev, dateRange: range }));
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
              <Button variant="outline" size="sm" className="rounded-full text-xs h-7 px-3 hover:bg-primary/10 hover:text-primary hover:border-primary/30" onClick={() => handleSetDateRange('30d')}>30 dias</Button>
              <Button variant="outline" size="sm" className="rounded-full text-xs h-7 px-3 hover:bg-primary/10 hover:text-primary hover:border-primary/30" onClick={() => handleSetDateRange('90d')}>90 dias</Button>
              <Button variant="outline" size="sm" className="rounded-full text-xs h-7 px-3 hover:bg-primary/10 hover:text-primary hover:border-primary/30" onClick={() => handleSetDateRange('1y')}>1 ano</Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Tipo de Transação</Label>
            <RadioGroup
              value={localFilters.type || 'todos'}
              onValueChange={(value) => setLocalFilters(prev => ({ ...prev, type: value === 'todos' ? null : value as 'receita' | 'despesa' }))}
              className="flex items-center gap-4 p-1 bg-muted/30 rounded-xl border border-border/50"
            >
              <div className="flex-1">
                <RadioGroupItem value="todos" id="r-all" className="peer sr-only" />
                <Label htmlFor="r-all" className="flex items-center justify-center w-full py-2 rounded-lg cursor-pointer text-muted-foreground peer-data-[state=checked]:bg-background peer-data-[state=checked]:text-foreground peer-data-[state=checked]:shadow-sm transition-all">
                  Todos
                </Label>
              </div>
              <div className="flex-1">
                <RadioGroupItem value="despesa" id="r-expense" className="peer sr-only" />
                <Label htmlFor="r-expense" className="flex items-center justify-center w-full py-2 rounded-lg cursor-pointer text-muted-foreground peer-data-[state=checked]:bg-background peer-data-[state=checked]:text-rose-500 peer-data-[state=checked]:shadow-sm transition-all">
                  Despesas
                </Label>
              </div>
              <div className="flex-1">
                <RadioGroupItem value="receita" id="r-income" className="peer sr-only" />
                <Label htmlFor="r-income" className="flex items-center justify-center w-full py-2 rounded-lg cursor-pointer text-muted-foreground peer-data-[state=checked]:bg-background peer-data-[state=checked]:text-emerald-500 peer-data-[state=checked]:shadow-sm transition-all">
                  Receitas
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Categorias</Label>
            <MultiSelectFilter
              title="Categorias"
              options={categoryOptions}
              selectedValues={localFilters.categories}
              onValueChange={(values) => setLocalFilters(prev => ({ ...prev, categories: values }))}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Tags</Label>
            <MultiSelectFilter
              title="Tags"
              options={tagOptions}
              selectedValues={localFilters.tags}
              onValueChange={(values) => setLocalFilters(prev => ({ ...prev, tags: values }))}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Contas</Label>
            <MultiSelectFilter
              title="Contas"
              options={accountOptions}
              selectedValues={localFilters.accounts}
              onValueChange={(values) => setLocalFilters(prev => ({ ...prev, accounts: values }))}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Cartões</Label>
            <MultiSelectFilter
              title="Cartões"
              options={cardOptions}
              selectedValues={localFilters.cards}
              onValueChange={(values) => setLocalFilters(prev => ({ ...prev, cards: values }))}
            />
          </div>

          <div className="space-y-3">
            <Label className="text-base font-medium">Métodos de Pagamento</Label>
            <MultiSelectFilter
              title="Métodos"
              options={paymentMethods}
              selectedValues={localFilters.methods}
              onValueChange={(values) => setLocalFilters(prev => ({ ...prev, methods: values }))}
            />
          </div>
        </div>
      </ScrollArea>

      <SheetFooter className="p-6 mt-auto border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex w-full gap-3">
          <Button variant="outline" onClick={handleClearFilters} className="flex-1 rounded-xl h-12 border-muted-foreground/20 hover:bg-muted">
            Limpar
          </Button>
          <SheetClose asChild>
            <Button onClick={handleApplyFilters} className="flex-1 rounded-xl h-12 shadow-lg shadow-primary/20 text-base font-semibold">
              Aplicar Filtros
            </Button>
          </SheetClose>
        </div>
      </SheetFooter>
    </div>
  );
}
