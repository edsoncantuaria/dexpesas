'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'dexpesas:classic-mode-alert-dismissed';

type ClassicModeNoticeOptions = {
  isClassicModeActive: boolean;
  userId?: string | number | null;
  storageKey?: string;
};

export function useClassicModeNotice({
  isClassicModeActive,
  userId,
  storageKey,
}: ClassicModeNoticeOptions) {
  const [showClassicNotice, setShowClassicNotice] = useState(false);
  const wasClassic = useRef<boolean | null>(null);

  const resolvedKey = useMemo(() => {
    const baseKey = storageKey ?? STORAGE_KEY;
    return userId ? `${baseKey}:${userId}` : baseKey;
  }, [userId, storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (isClassicModeActive) {
      try {
        const dismissed = window.localStorage.getItem(resolvedKey) === 'true';
        setShowClassicNotice(!dismissed);
      } catch {
        setShowClassicNotice(true);
      }
    } else {
      setShowClassicNotice(false);
      if (wasClassic.current) {
        try {
          window.localStorage.removeItem(resolvedKey);
        } catch {
          // ignore storage errors
        }
      }
    }

    wasClassic.current = isClassicModeActive;
  }, [isClassicModeActive, resolvedKey]);

  const dismissClassicNotice = useCallback(() => {
    setShowClassicNotice(false);
    if (typeof window === 'undefined') {
      return;
    }
    try {
      window.localStorage.setItem(resolvedKey, 'true');
    } catch {
      // ignore storage errors
    }
  }, [resolvedKey]);

  return { showClassicNotice, dismissClassicNotice };
}
