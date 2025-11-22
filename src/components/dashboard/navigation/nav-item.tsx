import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { iconMap } from '@/components/dashboard/navigation/icon-map';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type NavItemProps = {
  href: string;
  label: string;
  iconName: string;
  isMobile: boolean;
  locked?: boolean;
  lockedMessage?: string;
};

export function NavItem({ href, label, iconName, isMobile, locked, lockedMessage }: NavItemProps) {
  const pathname = usePathname();
  const isActive = (href === "/dashboard" && pathname === href) || (href !== "/dashboard" && pathname.startsWith(href));
  const Icon = iconMap[iconName];

  if (isMobile) {
    if (locked) {
      return (
        <div className="flex flex-col items-center gap-1 p-2 text-xs font-medium rounded-lg w-16 text-muted-foreground/50 grayscale cursor-not-allowed">
          <div className="relative">
            <Icon className="h-6 w-6" />
            <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5">
              <Lock className="h-3 w-3 text-muted-foreground" />
            </div>
          </div>
          <span>{label}</span>
        </div>
      );
    }

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
  if (locked) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground/50 grayscale cursor-not-allowed">
              <div className="relative">
                <Icon className="h-5 w-5" />
                <div className="absolute -top-2 -right-2 bg-background rounded-full p-0.5 shadow-sm border">
                  <Lock className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
              <span className="sr-only">{label} (Bloqueado)</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="bg-foreground text-background">
            <p>{lockedMessage || 'Bloqueado'}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

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
