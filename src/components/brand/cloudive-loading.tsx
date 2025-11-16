import { cn } from '@/lib/utils';

type CloudiveLoadingProps = {
  message?: string;
  fullscreen?: boolean;
  backdrop?: boolean;
  className?: string;
};

/**
 * CloudiveLoading centraliza o padrão de carregamento institucional.
 * Use fullscreen/backdrop para cobrir toda a viewport quando necessário.
 */
export function CloudiveLoading({
  message = 'Carregando Cloudive…',
  fullscreen = false,
  backdrop = false,
  className,
}: CloudiveLoadingProps) {
  const wrapperClasses = cn(
    'flex items-center justify-center',
    fullscreen && 'fixed inset-0 z-40',
    backdrop && 'bg-[#020617]/85 backdrop-blur-sm',
    className,
  );

  return (
    <div className={wrapperClasses}>
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white/90 px-6 py-5 text-slate-900 shadow-floating dark:bg-slate-900/90 dark:text-slate-50">
        <img
          src="/cloudive-icon.svg"
          alt="Cloudive"
          className="h-12 w-12 animate-cloudive-pulse drop-shadow-lg"
          loading="lazy"
          decoding="async"
        />
        {message && <p className="text-sm font-semibold tracking-wide">{message}</p>}
      </div>
    </div>
  );
}
