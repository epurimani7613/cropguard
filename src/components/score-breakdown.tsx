import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Meter } from '@/components/ui/meter';
import { VerticalBars } from '@/components/vertical-bars';
import { formatMs } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AccentVar, DiseaseCategory, Inference } from '@/types/telemetry';
import { getCropClass, inferCategory, normaliseLabel } from '@/data/classes';

const METER_TONE: Record<AccentVar, 'ok' | 'warn' | 'danger' | 'info'> = {
  ok: 'ok',
  warn: 'warn',
  danger: 'danger',
  info: 'info',
};

/**
 * Glow colours keyed by disease category — applied as a box-shadow on the
 * active prediction row to make it visually pop.
 */
const CATEGORY_GLOW: Record<DiseaseCategory, string> = {
  healthy: '0 0 12px rgba(16,185,129,0.35)',
  fungal: '0 0 12px rgba(239,68,68,0.35)',
  bacterial: '0 0 12px rgba(139,92,246,0.35)',
  viral: '0 0 12px rgba(245,158,11,0.35)',
};

const CATEGORY_BORDER: Record<DiseaseCategory, string> = {
  healthy: 'rgba(16,185,129,0.4)',
  fungal: 'rgba(239,68,68,0.4)',
  bacterial: 'rgba(139,92,246,0.4)',
  viral: 'rgba(245,158,11,0.4)',
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass rounded-lg border border-line/80 px-2.5 py-1.5 shadow-e2">
      {label ? <p className="mb-0.5 font-mono text-2xs text-muted">{label}</p> : null}
      {payload.map((p) => (
        <p key={p.name} className="font-mono text-2xs" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(2) : p.value}
        </p>
      ))}
    </div>
  );
}

export function ScoreBreakdown({ current }: { current: Inference | null }) {
  const [metric, setMetric] = useState<'bars' | 'trend'>('bars');
  const topScore = current?.topScore ?? 0;
  const topLabel = current?.scores[current.topIndex]?.label ?? '';
  const topCategory = topLabel ? inferCategory(topLabel) : 'healthy';

  return (
    <Card className="h-full">
      <CardHeader
        title="Multi-Class Confidence Breakdown"
        subtitle="Softmax output — all trained classes from the retrained model"
        actions={
          <div className="inline-flex h-7 items-center gap-0.5 rounded-lg border border-line/70 bg-elevated p-0.5">
            {(['bars', 'trend'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetric(m)}
                className={cn(
                  'rounded-[5px] px-2 py-0.5 text-2xs font-medium capitalize transition-colors',
                  metric === m ? 'bg-surface text-ink shadow-e1' : 'text-muted hover:text-ink',
                )}
              >
                {m}
              </button>
            ))}
          </div>
        }
      />
      <CardBody className="space-y-2.5">
        {current ? (
          current.scores.map((s) => {
            const info = getCropClass(s.label);
            const isTop = current.scores[current.topIndex]?.label === s.label;
            const displayName = normaliseLabel(s.label);
            return (
              <div
                key={s.label}
                className={cn(
                  'rounded-lg px-2 py-1.5 transition-all duration-300',
                  isTop && 'animate-pulse-glow',
                )}
                style={
                  isTop
                    ? {
                        boxShadow: CATEGORY_GLOW[topCategory],
                        border: `1px solid ${CATEGORY_BORDER[topCategory]}`,
                        background: `linear-gradient(135deg, ${CATEGORY_BORDER[topCategory].replace('0.4', '0.06')}, transparent)`,
                      }
                    : undefined
                }
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate font-mono text-xs text-ink">{displayName}</span>
                    {isTop ? (
                      <span className="shrink-0 rounded border border-ok/40 bg-ok/10 px-1 text-2xs font-medium text-ok">
                        TOP
                      </span>
                    ) : null}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 font-mono text-xs tabular-nums',
                      isTop ? 'font-semibold text-ink' : 'text-muted',
                    )}
                  >
                    {(s.score * 100).toFixed(2)}%
                  </span>
                </div>
                <Meter
                  className="mt-1"
                  value={s.score}
                  tone={METER_TONE[info.accent]}
                  animated={isTop}
                  label={`${displayName} confidence`}
                />
              </div>
            );
          })
        ) : (
          <p className="py-6 text-center text-xs text-muted">Awaiting first inference…</p>
        )}

        <div className="hairline my-3" />

        {/* Hardware timing metrics from the STM32 */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="mono-label">DSP Latency</p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-info">
              {formatMs(current?.timing.dspMs ?? 0, 2)}
            </p>
          </div>
          <div>
            <p className="mono-label">NN Exec Time</p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-info">
              {formatMs(current?.timing.nnMs ?? 0, 2)}
            </p>
          </div>
          <div>
            <p className="mono-label">Total Latency</p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-ink">
              {formatMs((current?.timing.dspMs ?? 0) + (current?.timing.nnMs ?? 0), 2)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="mono-label">Frame Budget</p>
            <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">
              {current ? `${current.timing.frameMs.toFixed(0)} ms` : '—'}
            </p>
          </div>
          <div>
            <p className="mono-label">Buffer</p>
            <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">
              96×96 RGB · 4096
            </p>
          </div>
          <div>
            <p className="mono-label">Classes</p>
            <p className="mt-0.5 font-mono text-xs tabular-nums text-muted">
              {current?.scores.length ?? 0}
            </p>
          </div>
        </div>

        <p className="font-mono text-2xs text-muted">
          threshold 0.600 · top score {(topScore * 100).toFixed(2)}%{' '}
          {topScore >= 0.6 ? '→ PASS' : '→ below threshold, no action emitted'}
        </p>

        <div className="hairline my-3" />

        <VerticalBars current={current} />
      </CardBody>
    </Card>
  );
}

export function ThroughputTrend({
  history,
  frameRate,
}: {
  history: Inference[];
  frameRate: number;
}) {
  const data = useMemo(
    () =>
      history.slice(-40).map((h, i) => ({
        i,
        t: h.timestamp.toLocaleTimeString('en-GB', { hour12: false }),
        label: `${i}`,
        dsp: Number(h.timing.dspMs.toFixed(2)),
        nn: Number(h.timing.nnMs.toFixed(2)),
        total: Number((h.timing.dspMs + h.timing.nnMs).toFixed(2)),
      })),
    [history],
  );

  const budgetMs = frameRate > 0 ? 1000 / frameRate : 100;

  return (
    <Card>
      <CardHeader
        title="Inference Latency"
        subtitle={`Per-frame cost against the ${budgetMs.toFixed(0)} ms budget at ${frameRate} FPS`}
      />
      <CardBody>
        {data.length < 2 ? (
          <p className="py-10 text-center text-xs text-muted">Collecting samples…</p>
        ) : (
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                <defs>
                  <linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--cg-info))" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="rgb(var(--cg-info))" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgb(var(--cg-line))" strokeOpacity={0.45} vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'rgb(var(--cg-muted))' }}
                  stroke="rgb(var(--cg-line))"
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'rgb(var(--cg-muted))' }}
                  stroke="rgb(var(--cg-line))"
                  tickLine={false}
                  width={40}
                  unit=""
                />
                <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgb(var(--cg-line))' }} />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="total ms"
                  stroke="rgb(var(--cg-info))"
                  strokeWidth={1.5}
                  fill="url(#latencyFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-2xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-[2px] w-4 rounded bg-info" /> total latency
          </span>
          <span>peak {Math.max(...data.map((d) => d.total)).toFixed(1)} ms</span>
          <span>avg {(data.reduce((a, d) => a + d.total, 0) / data.length).toFixed(1)} ms</span>
        </div>
      </CardBody>
    </Card>
  );
}

export function ConfidenceSparkline({ history }: { history: Inference[] }) {
  const data = useMemo(
    () =>
      history.slice(-60).map((h, i) => ({
        i,
        confidence: Number((h.topScore * 100).toFixed(2)),
        label: String(i),
      })),
    [history],
  );

  if (data.length < 2) return null;

  return (
    <div className="h-9 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <Line
            type="monotone"
            dataKey="confidence"
            stroke="rgb(var(--cg-ok))"
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}