// src/components/dashboard/navigation/nav-item.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ArrowLeftRight, Rocket, User, type LucideIcon, type LucideProps, Grid3x3, Target, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const iconMap: Record<string, React.ElementType<LucideProps>> = {
  Home,
  ArrowLeftRight,
  User,
  Grid3x3,
  Rocket,
  Target,
  Users,
};

type NavItemProps = {
  href: string;
  label: string;
  iconName: string;
  isMobile: boolean;
};

export function NavItem({ href, label, iconName, isMobile }: NavItemProps) {
  const pathname = usePathname();
  const isActive = (href === "/dashboard" && pathname === href) || (href !== "/dashboard" && pathname.startsWith(href));
  const Icon = iconMap[iconName];

  if (isMobile) {
    return (
      <Link
        href={href}
        className={cn(
          'flex flex-col items-center gap-1 p-2 text-xs font-medium rounded-lg transition-colors w-16',
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
        )}
      >
        <Icon className="h-6 w-6" />
        <span>{label}</span>
      </Link>
    );
  }

  // Desktop version uses Tooltips
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <Link
            href={href}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
              isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-primary/5'
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="sr-only">{label}</span>
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-foreground text-background">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
