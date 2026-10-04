import { cn } from '@/lib/utils';

type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'muted';

const FILL: Record<Tone, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  info: 'bg-info',
  muted: 'bg-muted/60',
};

/**
 * Horizontal meter. Only the width animates; the track stays flat so a changing
 * value reads as data movement rather than decoration.
 */
export function Meter({
  value,
  tone = 'info',
  height = 6,
  animated = false,
  className,
  label,
}: {
  /** 0..1 */
  value: number;
  tone?: Tone;
  height?: number;
  animated?: boolean;
  className?: string;
  label?: string;
}) {
  const pct = Math.max(0, Math.min(1, value)) * 100;

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={cn('gauge-track', className)}
      style={{ height }}
    >
      <div
        className={cn('relative h-full rounded-full transition-[width] duration-500 ease-out', FILL[tone])}
        style={{ width: `${pct}%` }}
      >
        {animated && pct > 6 ? (
          <span className="absolute inset-0 overflow-hidden rounded-full">
            <span className="absolute inset-y-0 w-1/3 animate-sheen bg-gradient-to-r from-transparent via-white/45 to-transparent" />
          </span>
        ) : null}
      </div>
    </div>
  );
}