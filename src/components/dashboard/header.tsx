// src/components/dashboard/header.tsx
'use client';

import { Bell, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from '@/components/dashboard/user-nav';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { NotificationPanel } from './notifications/notification-panel';
import { useState } from 'react';
import { useTransactionForm } from '@/contexts/TransactionFormContext';
import { Logo } from '@/components/logo';

export function Header() {
  const [open, setOpen] = useState(false);
  const { openForm } = useTransactionForm();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
      {/* Flex container for the left side of the header on desktop */}
      <div className="hidden md:flex flex-1 items-center gap-4">
        {/* Adiciona o botão de transação aqui para desktop */}
        <Button onClick={() => openForm()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Adicionar Transação
        </Button>
      </div>

      {/* Título da Página - Visível apenas em mobile para dar contexto */}
      <div className="md:hidden">
         <Logo isIconOnly className="[&_svg]:h-10 [&_svg]:w-auto" />
      </div>

      <div className="flex items-center gap-2">
         <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Bell className="h-5 w-5" />
                    <span className="sr-only">Notificações</span>
                    {/* Badge de Notificação - Lógica de contagem a ser adicionada */}
                 </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 md:w-96 p-0" align="end">
               <NotificationPanel onClose={() => setOpen(false)} />
            </DropdownMenuContent>
         </DropdownMenu>

         <UserNav />
      </div>
    </header>
  );
}
