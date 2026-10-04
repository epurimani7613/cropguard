import { cn } from '@/lib/utils';
import type { AccentVar } from '@/types/telemetry';

export const ACCENT_TEXT: Record<AccentVar, string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  info: 'text-info',
};

export const ACCENT_BG: Record<AccentVar, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  info: 'bg-info',
};

export const ACCENT_RING: Record<AccentVar, string> = {
  ok: 'ring-ok/30',
  warn: 'ring-warn/30',
  danger: 'ring-danger/30',
  info: 'ring-info/30',
};

export const SEVERITY_LABEL = {
  healthy: 'Healthy',
  watch: 'Monitor',
  critical: 'Action required',
} as const;

/**
 * Small labelled metric. Used in dense grids where a chart would be noise —
 * the number is the content, the label is the scale.
 */
export function Stat({
  label,
  value,
  unit,
  hint,
  accent = 'info',
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  hint?: string;
  accent?: AccentVar;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <p className="mono-label truncate">{label}</p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className={cn('font-mono text-lg font-semibold tabular-nums tracking-tight', ACCENT_TEXT[accent])}>
          {value}
        </span>
        {unit ? <span className="font-mono text-2xs text-muted">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-0.5 truncate text-2xs text-muted">{hint}</p> : null}
    </div>
  );
}

/** Inline key/value row used in spec sheets. */
export function SpecRow({ k, v, mono = false }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-[3px]">
      <dt className="shrink-0 text-2xs uppercase tracking-[0.1em] text-muted">{k}</dt>
      <dd className={cn('min-w-0 truncate text-right text-xs text-ink', mono && 'font-mono')}>{v}</dd>
    </div>
  );
}