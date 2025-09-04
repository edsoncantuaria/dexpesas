// src/components/ui/loading-screen.tsx
'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type LoadingScreenProps = {
  className?: string;
};

export function LoadingScreen({ className }: LoadingScreenProps) {
  return (
    <div className={cn("flex flex-1 items-center justify-center p-8", className)}>
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
