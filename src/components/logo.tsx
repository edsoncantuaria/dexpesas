import { Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoProps = {
    isIconOnly?: boolean;
    className?: string;
}

export function Logo({ isIconOnly = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} aria-label="Jornada Financeira">
      <div className={cn(
          "rounded-lg p-2",
          isIconOnly ? "bg-transparent" : "bg-primary/10"
      )}>
        <Shield className="h-6 w-6 text-primary" />
      </div>
      {!isIconOnly && (
        <span className="text-xl font-semibold text-foreground font-headline">
            Jornada Financeira
        </span>
      )}
    </div>
  );
}
