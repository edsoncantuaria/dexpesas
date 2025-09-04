// src/components/dashboard/transacoes/AddTransactionButton.tsx
'use client';

import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

type AddTransactionButtonProps = {
  onClick: () => void;
};

/**
 * Botão de Ação Flutuante (FAB - Floating Action Button).
 * - Padrão de design mobile clássico para a ação principal da tela.
 * - Fica fixo no canto inferior direito para acesso rápido.
 * - Usa framer-motion para animações de hover e clique.
 */
export function AddTransactionButton({ onClick }: AddTransactionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-24 right-4 z-40 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 md:bottom-8 md:right-8"
      aria-label="Adicionar nova transação"
    >
      <Plus className="h-8 w-8" />
    </motion.button>
  );
}
