// src/components/ui/loading-screen.tsx
'use client';

import { CloudiveLoading } from '@/components/brand/cloudive-loading';
import { cn } from '@/lib/utils';

type LoadingScreenProps = {
  className?: string;
  message?: string;
};

export function LoadingScreen({ className, message }: LoadingScreenProps) {
  return (
    <div className={cn('flex flex-1 items-center justify-center p-8', className)}>
      <CloudiveLoading message={message ?? 'Preparando sua jornada…'} />
    </div>
  );
}
