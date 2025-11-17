'use client';

import { useUser } from '@/contexts/UserContext';
import type { GamificationMode } from '@/lib/definitions';

export function useGamificationMode() {
  const { user } = useUser();
  const mode = (user?.gamificationMode ?? 'FULL') as GamificationMode;

  return {
    mode,
    isFull: mode === 'FULL',
    isLite: mode === 'LITE',
    isClassic: mode === 'OFF',
  };
}
