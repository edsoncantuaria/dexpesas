'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { CloudiveSplash } from '@/components/brand/cloudive-splash';

type RootClientShellProps = {
  children: React.ReactNode;
};

export function RootClientShell({ children }: RootClientShellProps) {
  const [isSplashActive, setIsSplashActive] = useState(false);

  return (
    <>
      <CloudiveSplash onVisibilityChange={setIsSplashActive} />
      <div
        className={cn(
          'transition-opacity duration-500 ease-out',
          isSplashActive ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        {children}
      </div>
    </>
  );
}
