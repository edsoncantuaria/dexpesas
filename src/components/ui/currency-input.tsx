// src/components/ui/currency-input.tsx
'use client';

import * as React from 'react';
import { Input } from '@/components/ui/input';

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onValueChange: (value: number) => void;
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    React.useEffect(() => {
      // Formata o valor numérico (ex: 123.45) para a string de exibição (ex: "R$ 123,45")
      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(value || 0);
      setDisplayValue(formatted);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { value: inputValue } = e.target;

      // Remove tudo que não for dígito
      const digitsOnly = inputValue.replace(/\D/g, '');
      if (digitsOnly === '') {
        onValueChange(0);
        return;
      }

      // Converte a string de dígitos para um valor decimal
      const realValue = parseFloat(digitsOnly) / 100;
      onValueChange(realValue);
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={displayValue}
        onChange={handleChange}
        type="text"
        inputMode="decimal"
        placeholder="R$ 0,00"
      />
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';
