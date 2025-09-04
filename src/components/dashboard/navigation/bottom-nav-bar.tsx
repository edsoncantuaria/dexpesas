// src/components/dashboard/navigation/bottom-nav-bar.tsx
'use client';

import { Plus } from 'lucide-react';
import { NavItem } from './nav-item';
import { motion } from 'framer-motion';
import { useTransactionForm } from '@/contexts/TransactionFormContext';


type BottomNavBarProps = {
  links: Array<{
    href: string;
    label: string;
    iconName: string;
  }>;
};

export function BottomNavBar({ links }: BottomNavBarProps) {
  const { openForm } = useTransactionForm();
  
  // Divide os links para posicionar o botão de Ação no meio
  const firstHalf = links.slice(0, 2);
  const secondHalf = links.slice(2);

  const handleAddClick = () => {
    openForm();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-20 border-t bg-background/95 backdrop-blur-sm md:hidden">
      <nav className="relative flex h-full items-center justify-around">
        {firstHalf.map((link) => (
          <NavItem
            key={link.href}
            href={link.href}
            label={link.label}
            iconName={link.iconName}
            isMobile
          />
        ))}

         {/* Botão de Ação Flutuante (FAB) para Adicionar Transação */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-7">
          <motion.button
              onClick={handleAddClick}
              whileTap={{ scale: 0.9 }}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg"
              aria-label="Adicionar nova transação"
          >
              <Plus className="h-7 w-7" />
          </motion.button>
        </div>
        
        {secondHalf.map((link) => (
          <NavItem
            key={link.href}
            href={link.href}
            label={link.label}
            iconName={link.iconName}
            isMobile
          />
        ))}

      </nav>
    </div>
  );
}
