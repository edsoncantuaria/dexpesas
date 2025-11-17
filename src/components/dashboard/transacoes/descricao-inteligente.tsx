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
  CommandGroup,
  CommandList,
  CommandItem,
} from '@/components/ui/command';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, FileQuestion, type LucideIcon } from 'lucide-react';
import api from '@/lib/api';
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
  const debouncedSearchTerm = useDebounce(valor, 800);
  const [historyRequestToken, setHistoryRequestToken] = React.useState(0);
  const cacheRef = React.useRef<Record<string, SugestaoTransacao[]>>({});

  const abortControllerRef = React.useRef<AbortController | null>(null);

  React.useEffect(() => {
    const fetchSugestoes = async () => {
      const hasSearchTerm = debouncedSearchTerm.length >= 2;

      if (!hasSearchTerm && historyRequestToken === 0) {
        setSugestoes([]);
        setOpen(false);
        setStatus('idle');
        return;
      }

      const cacheKey = hasSearchTerm ? debouncedSearchTerm : `history-${historyRequestToken}`;

      if (cacheRef.current[cacheKey]) {
        const cached = cacheRef.current[cacheKey];
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
          tipo: tipoTransacao,
          limite: '7',
        });

        if (!hasSearchTerm) {
          // Usa um termo genérico para ajudar na busca por histórico recente
          params.set('termo', tipoTransacao);
        } else {
          params.set('termo', debouncedSearchTerm);
          if (valorTransacao && valorTransacao > 0) {
            params.append('valor', String(valorTransacao));
          }
        }
        
        const response = await api.get(`/sugestoes/transacoes?${params.toString()}`, {
          signal: abortControllerRef.current.signal,
        });

        const newSugestoes = response.data.itens;
        cacheRef.current[cacheKey] = newSugestoes;
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
  }, [debouncedSearchTerm, tipoTransacao, valorTransacao, historyRequestToken]);

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
              {status === 'success' && sugestoes.length === 0 && debouncedSearchTerm.length >= 2 && (
                <div className="py-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <FileQuestion className="h-8 w-8" />
                  Nenhuma transação parecida encontrada.
                </div>
              )}
              {debouncedSearchTerm.length < 2 && historyRequestToken === 0 && sugestoes.length === 0 && (
                <div className="p-4 text-xs text-muted-foreground space-y-2 text-center">
                  <p>Digite pelo menos 2 caracteres para buscar ou visualize os últimos lançamentos.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setHistoryRequestToken((prev) => prev + 1)}
                  >
                    Buscar lançamentos recentes
                  </Button>
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
                      <div className="flex w-full items-center justify-between gap-2">
                        <div>
                          <p className="font-medium">{s.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.categoriaNome} •{' '}
                            {s.valorAproximado.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary" className="text-[10px]">
                            {s.metodoPagamento.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {s.recenciaDias === 0 ? 'Hoje' : `há ${s.recenciaDias}d`}
                          </Badge>
                        </div>
                      </div>
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
