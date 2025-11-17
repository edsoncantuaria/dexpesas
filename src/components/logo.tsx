import { useId } from 'react';
import { cn } from '@/lib/utils';

type LogoProps = {
    isIconOnly?: boolean;
    className?: string;
}

type LogoMarkProps = {
  className?: string;
};

function LogoMark({ className }: LogoMarkProps) {
  const gradientId = useId();
  const glowId = useId();
  const maskId = useId();

  return (
 <svg
    className={cn('h-12 w-auto max-w-full', className)}
    viewBox="0 0 360 96"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient
        id="dexpesas-mint-sky"
        x1={16}
        y1={16}
        x2={88}
        y2={72}
        gradientUnits="userSpaceOnUse"
      >
        <stop offset={0} stopColor="#A5F3D2" />
        <stop offset={1} stopColor="#3B82F6" />
      </linearGradient>
      <radialGradient
        id="dexpesas-inner-light"
        cx={0}
        cy={0}
        r={1}
        gradientUnits="userSpaceOnUse"
        gradientTransform="translate(60 28) rotate(45) scale(40 32)"
      >
        <stop offset={0} stopColor="#F8FAFC" stopOpacity={0.85} />
        <stop offset={1} stopColor="#F8FAFC" stopOpacity={0} />
      </radialGradient>
      <mask id="dexpesas-icon-mask">
        <g fill="white">
          <circle cx={32} cy={48} r={18} />
          <circle cx={52} cy={32} r={18} />
          <circle cx={72} cy={48} r={18} />
        </g>
      </mask>
    </defs>
    <g id="dexpesas-icon" transform="translate(16,8)">
      <g fill="url(#dexpesas-mint-sky)">
        <circle cx={32} cy={48} r={18} />
        <circle cx={52} cy={32} r={18} />
        <circle cx={72} cy={48} r={18} />
      </g>
      <rect
        x={14}
        y={14}
        width={60}
        height={52}
        fill="url(#dexpesas-inner-light)"
        mask="url(#dexpesas-icon-mask)"
      />
      <path
        d="M24 52 L36 40 L46 44 L60 32 L70 36"
        fill="none"
        stroke="#0F172A"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.75}
      />
      <circle cx={70} cy={36} r={3.2} fill="#F8FAFC" opacity={0.95} />
    </g>
    <text
      x={120}
      y={60}
      fontFamily="'Inter Tight', Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      fontWeight={600}
      fontSize={32}
      letterSpacing="0.04em"
      fill="var(--logo-text)"
    >
      {"\n    Dexpesas\n  "}
    </text>
    <text
      x={120}
      y={78}
      fontFamily="Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
      fontWeight={500}
      fontSize={13}
      letterSpacing="0.16em"
      fill="var(--logo-subtext)"
      style={{ textTransform: 'uppercase' }}
    >
      {"\n    App de Finan\xE7a\n  "}
    </text>
  </svg>

  );
}

export function Logo({ isIconOnly = false, className }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)} aria-label="Dexpesas">
      <LogoMark className={isIconOnly ? undefined : "drop-shadow-sm"} />
    </div>
  );
}
