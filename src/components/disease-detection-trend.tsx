/**
 * Detection Trend Chart — shows disease detection activity over time.
 *
 * Uses the same Recharts library and chart styling as the existing
 * ThroughputTrend component to maintain visual consistency.
 *
 * Only renders when sufficient historical data exists.
 */

import { useMemo } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import type { DiseaseDetection } from '@/types/disease-detection';

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
          {p.name}: {typeof p.value === 'number' ? `${p.value.toFixed(1)}%` : p.value}
        </p>
      ))}
    </div>
  );
}

export function DiseaseDetectionTrend({
  history,
  isDemoMode,
}: {
  history: DiseaseDetection[];
  isDemoMode: boolean;
}) {
  const data = useMemo(() => {
    // Reverse so chart goes left (oldest) to right (newest).
    const chronological = [...history].reverse().slice(-20);
    return chronological.map((det, i) => ({
      i,
      label: det.timestamp.toLocaleTimeString('en-GB', { hour12: false, hour: '2-digit', minute: '2-digit' }),
      confidence: Number((det.confidence * 100).toFixed(1)),
      disease: det.disease,
    }));
  }, [history]);

  if (data.length < 3) return null;

  const avg = data.reduce((sum, d) => sum + d.confidence, 0) / data.length;
  const healthyCount = data.filter((d) => d.disease.toLowerCase() === 'healthy').length;
  const healthyPct = (healthyCount / data.length) * 100;

  return (
    <Card>
      <CardHeader
        title="Detection Trend"
        subtitle="Confidence trend across recent edge inferences"
        icon={<TrendingUp className="h-3.5 w-3.5" strokeWidth={1.75} />}
        actions={
          isDemoMode ? (
            <span className="rounded border border-warn/30 bg-warn/10 px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-warn">
              Demo
            </span>
          ) : null
        }
      />
      <CardBody>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id="detectionConfFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgb(var(--cg-ok))" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="rgb(var(--cg-ok))" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="rgb(var(--cg-line))"
                strokeOpacity={0.45}
                vertical={false}
              />
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
                domain={[0, 100]}
                unit=""
              />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgb(var(--cg-line))' }} />
              <Area
                type="monotone"
                dataKey="confidence"
                name="confidence"
                stroke="rgb(var(--cg-ok))"
                strokeWidth={1.5}
                fill="url(#detectionConfFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-2xs text-muted">
          <span className="flex items-center gap-1.5">
            <span className="h-[2px] w-4 rounded bg-ok" /> confidence trend
          </span>
          <span>avg {avg.toFixed(1)}%</span>
          <span>healthy {healthyPct.toFixed(0)}%</span>
          <span>{data.length} samples</span>
        </div>
      </CardBody>
    </Card>
  );
}
