'use client';

import { useEffect, useState } from 'react';

const HOLD_DURATION = 1500;
const FADE_DURATION = 1000;

type CloudiveSplashProps = {
  onVisibilityChange?: (active: boolean) => void;
};

/**
 * CloudiveSplash exibe a abertura institucional quando o usuário não possui sessão ativa (sem auth_token).
 * A animação dura ~2.5s (1.5s estático + 1s de fade) e dispara callbacks para permitir esconder o app enquanto roda.
 */
export function CloudiveSplash({ onVisibilityChange }: CloudiveSplashProps) {
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hasToken = document.cookie.includes('auth_token=');
    if (hasToken) return;

    setVisible(true);
    onVisibilityChange?.(true);
    const holdTimer = window.setTimeout(() => setIsExiting(true), HOLD_DURATION);
    const fadeTimer = window.setTimeout(() => {
      setVisible(false);
      setIsExiting(false);
      onVisibilityChange?.(false);
    }, HOLD_DURATION + FADE_DURATION);

    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(fadeTimer);
    };
  }, [onVisibilityChange]);

  if (!visible) return null;

  return (
    <div
      className={[
        'fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]',
        'transition-opacity duration-1000 ease-in-out',
        isExiting ? 'opacity-0 pointer-events-none' : 'opacity-100',
      ].join(' ')}
    >
      <div className="flex flex-col items-center gap-6 text-white md:flex-row">
        <svg
          className="h-28 w-28 animate-cloudive-fade"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="48" cy="62" r="26" fill="#3B82F6" />
          <circle cx="72" cy="48" r="26" fill="#A7D5FF" />
          <circle cx="72" cy="76" r="26" fill="#C7C8FF" />
        </svg>

        <div className="flex flex-col gap-1 text-center md:text-left">
          <span className="text-4xl font-semibold tracking-[0.2em] animate-cloudive-fade">
            CLOUDIVE
          </span>
          <p className="text-sm font-medium text-slate-200">
            tecnologia leve, modular e acessível
          </p>
        </div>
      </div>
    </div>
  );
}
