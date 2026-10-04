import { cn } from '@/lib/utils';

type Tone = 'ok' | 'warn' | 'danger' | 'info' | 'muted';

const STROKE: Record<Tone, string> = {
  ok: 'stroke-ok',
  warn: 'stroke-warn',
  danger: 'stroke-danger',
  info: 'stroke-info',
  muted: 'stroke-muted',
};

const TEXT: Record<Tone, string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  info: 'text-info',
  muted: 'text-muted',
};

const SIZE = 168;
const STROKE_WIDTH = 10;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Circular confidence gauge.
 *
 * Deliberately not a Recharts radar/pie — a single deterministic arc reads
 * faster than a chart library for one number, and avoids animating a path
 * attribute that some browsers handle poorly.
 */
export function ConfidenceRing({
  value,
  tone,
  label,
  caption,
  size = SIZE,
}: {
  /** 0..1 */
  value: number;
  tone: Tone;
  label?: string;
  caption?: string;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(1, value));
  const pct = clamped * 100;
  const dash = CIRCUMFERENCE * clamped;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label={label ?? 'confidence'}
    >
      <svg width={size} height={size} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          className="stroke-line/70"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          className={cn(STROKE[tone], 'transition-[stroke-dasharray] duration-700 ease-out')}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-mono text-3xl font-semibold tabular-nums leading-none', TEXT[tone])}>
          {pct.toFixed(1)}
          <span className="text-lg">%</span>
        </span>
        {label ? <span className="mono-label mt-1.5">{label}</span> : null}
        {caption ? (
          <span className="mt-0.5 font-mono text-2xs text-muted">{caption}</span>
        ) : null}
      </div>
    </div>
  );
}