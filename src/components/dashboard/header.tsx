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
import { CardAlertsBadge } from './header/card-alerts-badge';
import { useState, useEffect } from 'react';
import { useTransactionForm } from '@/contexts/TransactionFormContext';
import { Logo } from '@/components/logo';
import { motion } from 'framer-motion';
import api from '@/lib/api';

export function Header() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { openForm } = useTransactionForm();

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await api.get('/notifications');
        const count = response.data.filter((n: any) => !n.read).length;
        setUnreadCount(count);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchUnreadCount();

    // Listen for notification updates
    const handleNotificationUpdate = () => fetchUnreadCount();
    window.addEventListener('notification-received', handleNotificationUpdate);
    window.addEventListener('notification-read', handleNotificationUpdate);

    return () => {
      window.removeEventListener('notification-received', handleNotificationUpdate);
      window.removeEventListener('notification-read', handleNotificationUpdate);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between gap-4 border-b bg-gradient-to-r from-background/95 via-background/90 to-background/95 px-4 backdrop-blur-xl md:px-6 shadow-sm">
      {/* Desktop Left Side */}
      <div className="hidden md:flex flex-1 items-center gap-4">
        <Logo className="h-8 w-auto" />
        <Button
          onClick={() => openForm()}
          className="shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Adicionar Transação
        </Button>
      </div>

      {/* Mobile Logo */}
      <div className="md:hidden">
        <Logo isIconOnly className="[&_svg]:h-40   [&_svg]:w-40" />
      </div>

      <div className="flex items-center gap-2">
        {/* Card Alerts Badge */}
        <CardAlertsBadge />

        {/* Notifications */}
        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full relative hover:bg-primary/10 transition-colors"
            >
              <Bell className="h-5 w-5" />
              <span className="sr-only">Notificações</span>
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-[10px] font-bold text-white shadow-lg"
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </motion.span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 md:w-96 p-0" align="end">
            <NotificationPanel onClose={() => setOpen(false)} onCountChange={(count) => setUnreadCount(count)} />
          </DropdownMenuContent>
        </DropdownMenu>

        <UserNav />
      </div>
    </header>
  );
}
