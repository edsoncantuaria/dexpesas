// src/components/dashboard/navigation/desktop-sidebar.tsx
'use client';

import Link from 'next/link';
import { Logo } from '@/components/logo';
import { NavItem } from './nav-item';
import { Settings, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/UserContext';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type DesktopSidebarProps = {
  links: Array<{
    href: string;
    label: string;
    iconName: string;
  }>;
};

export function DesktopSidebar({ links }: DesktopSidebarProps) {
  const { user } = useUser();

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[5rem] flex-col border-r bg-background md:flex">
      <div className="flex h-16 items-center justify-center border-b px-2">
        <Link href="/dashboard" className="w-full flex justify-center">
          <Logo className="[&_svg]:h-8 [&_svg]:w-auto" />
        </Link>
      </div>
      <nav className="flex flex-1 flex-col items-center gap-4 py-4">
        {links.map((link) => {
          const isLocked = !user?.emailVerified && (link.href.includes('/family') || link.href.includes('/investments'));
          return (
            <NavItem
              key={link.href}
              href={link.href}
              label={link.label}
              iconName={link.iconName}
              isMobile={false}
              locked={isLocked}
              lockedMessage="Verifique seu e-mail para acessar"
            />
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col items-center gap-4 p-4">
        {user?.isAdmin && (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link href="/dashboard/admin">
                  <Button variant="outline" size="icon" className="rounded-lg">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="sr-only">Painel Admin</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Painel Admin</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
        <Link href="/dashboard/configuracoes">
          <Button variant="ghost" size="icon" className="rounded-lg">
            <Settings className="h-5 w-5" />
            <span className="sr-only">Configurações</span>
          </Button>
        </Link>
      </div>
    </aside>
  );
}
