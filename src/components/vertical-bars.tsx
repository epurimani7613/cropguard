import { getCropClass } from '@/data/classes';
import { cn } from '@/lib/utils';
import type { AccentVar, Inference } from '@/types/telemetry';

const FILL: Record<AccentVar, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  info: 'bg-info',
};

const TEXT: Record<AccentVar, string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  danger: 'text-danger',
  info: 'text-info',
};

/**
 * Vertical percentage bars, one per exported label.
 *
 * Height is proportional to the score itself, with a floor so a 0.4% class is
 * still visible rather than collapsing to nothing.
 */
export function VerticalBars({ current }: { current: Inference | null }) {
  if (!current) {
    return (
      <p className="py-10 text-center text-xs text-muted">Awaiting first inference…</p>
    );
  }

  const max = Math.max(...current.scores.map((s) => s.score), 0.01);

  return (
    <div>
      <div className="flex items-end justify-between gap-2" style={{ height: 132 }}>
        {current.scores.map((s) => {
          const info = getCropClass(s.label);
          const isTop = current.scores[current.topIndex]?.label === s.label;
          // Scale against the leader so the bars compare to each other, not to
          // an absolute 100% — otherwise a confident 94.8% and a weak 94.8%
          // would look identical.
          const heightPct = Math.max(3, (s.score / max) * 100);

          return (
            <div
              key={s.label}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
              title={`${s.label}: ${(s.score * 100).toFixed(2)}%`}
            >
              <span
                className={cn(
                  'font-mono text-2xs tabular-nums',
                  isTop ? 'font-semibold text-ink' : 'text-muted',
                )}
              >
                {(s.score * 100).toFixed(1)}
              </span>
              {/* Fixed-height block track: the percentage on the fill resolves against this
                  element's height, so it must be a block box — a flex parent
                  derives its height from content and collapses the fill to ~0. */}
              <div className="flex h-[104px] w-full items-end">
                <div className="relative h-full w-full">
                  <div
                    className={cn(
                      'absolute inset-x-0 bottom-0 rounded-t-[3px] transition-[height] duration-500 ease-out',
                      FILL[info.accent],
                      isTop ? 'opacity-100' : 'opacity-70',
                    )}
                    style={{ height: `${heightPct}%` }}
                  />
                </div>
              </div>
              <span
                className={cn(
                  'w-full truncate text-center font-mono text-2xs',
                  isTop ? TEXT[info.accent] : 'text-muted',
                )}
              >
                {s.label.replace(/_/g, ' ')}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-2.5 border-t border-line/60 pt-2 font-mono text-2xs text-muted">
        bars scaled to the top class · values are softmax probabilities
      </p>
    </div>
  );
}