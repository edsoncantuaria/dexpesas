// src/hooks/use-debounce.ts
import { useState, useEffect } from 'react';

/**
 * Hook customizado para "atrasar" a atualização de um valor.
 * Muito útil para evitar chamadas excessivas a uma API enquanto o usuário digita.
 *
 * @param value O valor a ser "atrasado".
 * @param delay O tempo de atraso em milissegundos.
 * @returns O valor após o atraso.
 */
export function useDebounce<T>(value: T, delay: number): T {
  // Estado para armazenar o valor atrasado
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configura um temporizador que só atualizará o estado `debouncedValue`
    // após o `delay` especificado ter passado sem que o `value` original mude.
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Função de limpeza: se o `value` ou `delay` mudarem antes do temporizador
    // terminar, ele será limpo, cancelando a atualização pendente.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]); // Re-executa o efeito apenas se `value` ou `delay` mudarem.

  return debouncedValue;
}
