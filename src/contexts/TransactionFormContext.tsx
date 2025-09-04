// src/contexts/TransactionFormContext.tsx
'use client';

import React, { createContext, useState, useContext, ReactNode } from 'react';
import type { Transaction } from '@/lib/definitions';

interface TransactionFormContextType {
  isFormOpen: boolean;
  editingTransaction: Transaction | null;
  openForm: () => void;
  closeForm: () => void;
  setEditingTransaction: (transaction: Transaction | null) => void;
}

const TransactionFormContext = createContext<TransactionFormContextType | undefined>(undefined);

export const TransactionFormProvider = ({ children }: { children: ReactNode }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const openForm = () => setIsFormOpen(true);
  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTransaction(null); // Limpa a transação em edição ao fechar
  }

  return (
    <TransactionFormContext.Provider
      value={{
        isFormOpen,
        editingTransaction,
        openForm,
        closeForm,
        setEditingTransaction,
      }}
    >
      {children}
    </TransactionFormContext.Provider>
  );
};

export const useTransactionForm = () => {
  const context = useContext(TransactionFormContext);
  if (context === undefined) {
    throw new Error('useTransactionForm must be used within a TransactionFormProvider');
  }
  return context;
};
