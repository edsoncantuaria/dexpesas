'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';

type CloudiveLoadingProps = {
  message?: string;
  fullscreen?: boolean;
  backdrop?: boolean;
  className?: string;
  withSkeleton?: boolean;
};

/**
 * CloudiveLoading centraliza o padrão de carregamento institucional premium.
 * Use fullscreen/backdrop para cobrir toda a viewport quando necessário.
 * Use withSkeleton para mostrar skeleton UI durante carregamento de página.
 */
export function CloudiveLoading({
  message = 'Carregando…',
  fullscreen = false,
  backdrop = false,
  className,
  withSkeleton = false,
}: CloudiveLoadingProps) {
  const wrapperClasses = cn(
    'flex items-center justify-center',
    fullscreen && 'fixed inset-0 z-40',
    backdrop && 'bg-background/95 backdrop-blur-sm',
    className,
  );

  if (withSkeleton) {
    return (
      <div className={wrapperClasses}>
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 animate-pulse" />
            <div className="flex-1 space-y-3">
              <div className="h-10 w-64 rounded-lg bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse" />
              <div className="h-4 w-96 rounded bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="rounded-2xl border bg-card p-6 space-y-4"
              >
                <div className="h-48 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-6 w-3/4 rounded bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse" />
                  <div className="h-4 w-1/2 rounded bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse" />
                </div>
                <div className="h-3 rounded-full bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse" />
              </motion.div>
            ))}
          </div>

          {/* Centered Logo with pulse */}
          <motion.div
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-background/95 to-background/90 backdrop-blur-xl border shadow-2xl px-8 py-6">
              <motion.div
                className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10"
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.8, 1, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <Wallet className="h-12 w-12 text-primary" />
              </motion.div>
              {message && (
                <p className="text-sm font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                  {message}
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className={wrapperClasses}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border shadow-2xl px-8 py-6"
      >
        <motion.div
          className="p-4 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10"
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <Wallet className="h-12 w-12 text-primary" />
        </motion.div>
        {message && (
          <p className="text-sm font-semibold tracking-wide bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            {message}
          </p>
        )}
      </motion.div>
    </div>
  );
}
