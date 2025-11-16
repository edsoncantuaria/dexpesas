// src/components/dashboard/transacoes/descricao-inteligente.tsx
'use client';

import * as React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverAnchor,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandList,
  CommandItem,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, FileQuestion, type LucideIcon } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/use-debounce';
import { Input } from '@/components/ui/input';

export type SugestaoTransacao = {
  idTransacaoReferencia: string;
  descricao: string;
  categoriaId: string;
  categoriaNome: string;
  tags: string[];
  metodoPagamento: 'pix' | 'debito' | 'credito' | 'dinheiro';
  contaId?: string | null;
  cartaoId?: string | null;
  valorAproximado: number;
  recenciaDias: number;
};

interface DescricaoInteligenteProps {
  valor: string;
  onChange: (value: string) => void;
  tipoTransacao: 'receita' | 'despesa';
  valorTransacao?: number;
  onSugestaoSelecionada: (sugestao: SugestaoTransacao) => void;
}

export function DescricaoInteligente({
  valor,
  onChange,
  tipoTransacao,
  valorTransacao,
  onSugestaoSelecionada,
}: DescricaoInteligenteProps) {
  const [open, setOpen] = React.useState(false);
  const [sugestoes, setSugestoes] = React.useState<SugestaoTransacao[]>([]);
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const { toast } = useToast();
  const debouncedSearchTerm = useDebounce(valor, 800);
  const cacheRef = React.useRef<Record<string, SugestaoTransacao[]>>({});

  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const fetchSugestoes = async () => {
      if (debouncedSearchTerm.length < 3) {
        setSugestoes([]);
        setOpen(false);
        return;
      }

      if (cacheRef.current[debouncedSearchTerm]) {
        const cached = cacheRef.current[debouncedSearchTerm];
        setSugestoes(cached);
        setStatus('success');
        setOpen(cached.length > 0);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setStatus('loading');
      setOpen(true);

      try {
        const params = new URLSearchParams({
          termo: debouncedSearchTerm,
          tipo: tipoTransacao,
          limite: '7',
        });

        if (valorTransacao && valorTransacao > 0) {
          params.append('valor', String(valorTransacao));
        }
        
        const response = await api.get(`/sugestoes/transacoes?${params.toString()}`, {
          signal: abortControllerRef.current.signal,
        });

        const newSugestoes = response.data.itens;
        cacheRef.current[debouncedSearchTerm] = newSugestoes;
        setSugestoes(newSugestoes);
        setStatus('success');
        setOpen(newSugestoes.length > 0);

      } catch (error: any) {
        if (error.name === 'CanceledError') {
          return;
        }
        setStatus('error');
        setOpen(false);
        // O toast de erro foi removido daqui para não aparecer em buscas sem resultado.
      }
    };

    fetchSugestoes();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchTerm, tipoTransacao]);

  const handleSelect = (sugestao: SugestaoTransacao) => {
    onChange(sugestao.descricao);
    onSugestaoSelecionada(sugestao);
    setOpen(false);
    setSugestoes([]);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <Input
          placeholder="Descreva sua transação (ex: 'Almoço iFood')"
          value={valor}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => {
            if (sugestoes.length > 0) setOpen(true);
          }}
          autoComplete="off"
          className="w-full"
        />
      </PopoverAnchor>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
            <CommandList>
              {status === 'loading' && (
                <div className="p-2 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              )}
              {status === 'error' && (
                <div className="p-4 text-center text-sm text-destructive flex items-center justify-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Erro ao buscar.
                </div>
              )}
              {status === 'success' && sugestoes.length === 0 && debouncedSearchTerm.length >= 3 && (
                <div className="py-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <FileQuestion className="h-8 w-8" />
                  Nenhuma transação parecida encontrada.
                </div>
              )}
              {status === 'success' && sugestoes.length > 0 && (
                <CommandGroup heading="Sugestões Inteligentes">
                  {sugestoes.map((s) => (
                    <CommandItem
                      key={s.idTransacaoReferencia}
                      onSelect={() => handleSelect(s)}
                      className="flex flex-col items-start gap-1 cursor-pointer"
                      value={s.descricao}
                    >
                      <p className="font-medium">{s.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.categoriaNome} •{' '}
                        {s.valorAproximado.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })}
                      </p>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
