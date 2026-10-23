/**
 * HistoryCharts — Feature 5: History charts and CSV export
 *
 * Three synchronised time-axis charts using Recharts (already in the project):
 *  1. Temperature & Humidity (two y-axes, gaps for NA)
 *  2. Soil Moisture % (with reference lines at 35% and 75%)
 *  3. Detection Timeline (category axis, point per row, confirmed = larger dot)
 *
 * Range selector: 10 min, 1 h, 6 h, all.
 * Clear history button with confirmation.
 * Summary stats: avg humidity during confirmed blight vs overall average.
 * Chart redraws are throttled to at most 1/s via useMemo on a 1 s tick.
 * CSV export delegates to useDataStream.exportCsv().
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BarChart2, Download as DownloadIcon, Trash2 } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DataRow } from '@/types/data-row';

// Recharts doesn't export these types cleanly; use inline props approach.

const BLIGHT_CLASS_ORDER = ['unknown', 'healthy', 'early', 'late'] as const;
type BlightClassStr = (typeof BLIGHT_CLASS_ORDER)[number];

const CLASS_Y: Record<BlightClassStr, number> = {
  unknown: 0,
  healthy: 1,
  early: 2,
  late: 3,
};
const CLASS_LABELS: Record<number, string> = {
  0: 'Unknown',
  1: 'Healthy',
  2: 'Early',
  3: 'Late',
};

// Alert-level colours mapped to tailwind-compatible raw hex for Recharts
const ALERT_DOT_COLOR: Record<string, string> = {
  GREEN: '#4ad682',  // --cg-ok dark
  AMBER: '#f5b042',  // --cg-warn dark
  RED: '#f88282',    // --cg-danger dark
  unknown: '#9aaaa4', // grey
};

// ── Range selector ─────────────────────────────────────────────────────────
type Range = '10m' | '1h' | '6h' | 'all';
const RANGES: { value: Range; label: string; ms: number | null }[] = [
  { value: '10m', label: '10 min', ms: 10 * 60_000 },
  { value: '1h', label: '1 hour', ms: 60 * 60_000 },
  { value: '6h', label: '6 hours', ms: 6 * 60 * 60_000 },
  { value: 'all', label: 'All', ms: null },
];

// ── Tooltip formatters ─────────────────────────────────────────────────────
function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('en-GB', { hour12: false });
}

// ── Chart helpers ──────────────────────────────────────────────────────────

/** Interpolate null gaps — Recharts needs null to create line gaps. */
function chartRow(row: DataRow): {
  t: number;
  tempC: number | null;
  humidityPct: number | null;
  soilPct: number;
  classY: number;
  alertColor: string;
  confirmed: boolean;
  label: string;
} {
  return {
    t: row.timestamp,
    tempC: row.tempC,
    humidityPct: row.humidityPct,
    soilPct: row.soilPct,
    classY: CLASS_Y[row.class as BlightClassStr] ?? 0,
    alertColor: ALERT_DOT_COLOR[row.alertLevel] ?? ALERT_DOT_COLOR.unknown,
    confirmed: row.status === 'confirmed',
    label: `${row.class} (${row.confidencePct}%)`,
  };
}

// ── Custom scatter dot for detection timeline ──────────────────────────────
function DetectionDot(props: {
  cx?: number;
  cy?: number;
  payload?: ReturnType<typeof chartRow>;
}) {
  const { cx = 0, cy = 0, payload } = props;
  const color = payload?.alertColor ?? '#9aaaa4';
  const r = payload?.confirmed ? 6 : 3;
  return (
    <circle
      cx={cx}
      cy={cy}
      r={r}
      fill={color}
      stroke={payload?.confirmed ? '#fff' : 'none'}
      strokeWidth={payload?.confirmed ? 1.5 : 0}
      opacity={0.85}
    />
  );
}

// ── Summary stats ──────────────────────────────────────────────────────────
function computeSummary(rows: DataRow[]): {
  overallAvgHum: number | null;
  blightAvgHum: number | null;
  confirmedBlightCount: number;
} {
  const humRows = rows.filter((r) => r.humidityPct !== null);
  const blightRows = humRows.filter(
    (r) => r.status === 'confirmed' && (r.class === 'early' || r.class === 'late'),
  );

  const avg = (arr: DataRow[]): number | null => {
    if (!arr.length) return null;
    const sum = arr.reduce((a, r) => a + (r.humidityPct as number), 0);
    return sum / arr.length;
  };

  return {
    overallAvgHum: avg(humRows),
    blightAvgHum: avg(blightRows),
    confirmedBlightCount: blightRows.length,
  };
}

// ── Axis tick style ────────────────────────────────────────────────────────
const tickStyle = { fontSize: 10, fill: 'currentColor', opacity: 0.6 };

// ── Main component ─────────────────────────────────────────────────────────
export function HistoryCharts({
  rows,
  onClearHistory,
  onExportCsv,
}: {
  rows: DataRow[];
  onClearHistory: () => void;
  onExportCsv: () => void;
}) {
  const [range, setRange] = useState<Range>('1h');
  const [confirmClear, setConfirmClear] = useState(false);

  // Throttled chart data: recompute at most once per second via useRef + useMemo
  const lastComputeRef = useRef<number>(0);
  const cachedDataRef = useRef<ReturnType<typeof chartRow>[]>([]);

  const chartData = useMemo(() => {
    const now = Date.now();
    if (now - lastComputeRef.current < 1000 && cachedDataRef.current.length === rows.length) {
      return cachedDataRef.current;
    }
    lastComputeRef.current = now;
    const rangeMs = RANGES.find((r) => r.value === range)?.ms ?? null;
    const cutoff = rangeMs !== null ? now - rangeMs : 0;
    const filtered = rows.filter((r) => r.timestamp >= cutoff);
    const data = filtered.map(chartRow);
    cachedDataRef.current = data;
    return data;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, range]);

  const summary = useMemo(() => {
    const rangeMs = RANGES.find((r) => r.value === range)?.ms ?? null;
    const cutoff = rangeMs !== null ? Date.now() - rangeMs : 0;
    return computeSummary(rows.filter((r) => r.timestamp >= cutoff));
  }, [rows, range]);

  const handleClear = useCallback(() => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 5000);
      return;
    }
    onClearHistory();
    setConfirmClear(false);
  }, [confirmClear, onClearHistory]);

  // Domain padding for time axis
  const tMin = chartData[0]?.t ?? Date.now() - 600_000;
  const tMax = chartData[chartData.length - 1]?.t ?? Date.now();
  const tPad = Math.max(30_000, (tMax - tMin) * 0.03);

  const noData = chartData.length === 0;

  return (
    <Card>
      <CardHeader
        title="History Charts"
        subtitle="Temperature, humidity, soil moisture and detection timeline"
        icon={<BarChart2 className="h-3.5 w-3.5" strokeWidth={1.75} />}
        actions={
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={onExportCsv} title="Export CSV">
              <DownloadIcon className="h-3 w-3" strokeWidth={2} />
              CSV
            </Button>
            <Button
              variant={confirmClear ? 'danger' : 'outline'}
              size="sm"
              onClick={handleClear}
              title={confirmClear ? 'Click again to confirm clear' : 'Clear history'}
            >
              <Trash2 className="h-3 w-3" strokeWidth={2} />
              {confirmClear ? 'Confirm clear?' : 'Clear'}
            </Button>
          </div>
        }
      />

      <CardBody className="space-y-5">
        {/* Range selector */}
        <div className="flex items-center gap-1.5">
          <span className="mono-label mr-1.5">Range</span>
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRange(r.value)}
              className={cn(
                'pressable rounded-lg border px-2.5 py-1 font-mono text-2xs transition-colors',
                range === r.value
                  ? 'border-brand/50 bg-brand/10 text-brand'
                  : 'border-line bg-surface text-muted hover:bg-elevated hover:text-ink',
              )}
            >
              {r.label}
            </button>
          ))}
          <span className="ml-auto font-mono text-2xs text-muted">
            {chartData.length} rows
          </span>
        </div>

        {noData ? (
          <p className="py-8 text-center text-sm text-muted">
            No data in the selected range. Connect hardware or use Simulate Data.
          </p>
        ) : (
          <>
            {/* Chart 1: Temperature & Humidity */}
            <div>
              <p className="mono-label mb-2">Temperature &amp; Humidity</p>
              <ResponsiveContainer width="100%" height={160}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 32, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                  <XAxis
                    dataKey="t"
                    type="number"
                    domain={[tMin - tPad, tMax + tPad]}
                    scale="time"
                    tickFormatter={fmtTime}
                    tick={tickStyle}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={60}
                  />
                  <YAxis
                    yAxisId="temp"
                    orientation="left"
                    tick={tickStyle}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: '°C', angle: -90, position: 'insideLeft', style: tickStyle, offset: 10 }}
                    width={36}
                  />
                  <YAxis
                    yAxisId="hum"
                    orientation="right"
                    domain={[0, 100]}
                    tick={tickStyle}
                    tickLine={false}
                    axisLine={false}
                    label={{ value: '%', angle: 90, position: 'insideRight', style: tickStyle, offset: 10 }}
                    width={28}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(val: unknown, name: unknown) => [
                      val != null ? `${(val as number).toFixed(1)}` : 'NA',
                      name === 'tempC' ? 'Temp (°C)' : 'Humidity (%)',
                    ]}
                    labelFormatter={(t: unknown) => new Date(t as number).toLocaleTimeString()}
                  />
                  <Line
                    yAxisId="temp"
                    type="monotone"
                    dataKey="tempC"
                    stroke="#6ecde8"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls={false}
                    name="tempC"
                  />
                  <Line
                    yAxisId="hum"
                    type="monotone"
                    dataKey="humidityPct"
                    stroke="#4ad682"
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls={false}
                    name="humidityPct"
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="mt-1 flex items-center gap-4 justify-end">
                <span className="flex items-center gap-1.5 font-mono text-2xs text-muted">
                  <span className="inline-block h-0.5 w-4 rounded bg-[#6ecde8]" />
                  Temperature
                </span>
                <span className="flex items-center gap-1.5 font-mono text-2xs text-muted">
                  <span className="inline-block h-0.5 w-4 rounded bg-[#4ad682]" />
                  Humidity
                </span>
              </div>
            </div>

            {/* Chart 2: Soil Moisture */}
            <div>
              <p className="mono-label mb-2">Soil Moisture %</p>
              <ResponsiveContainer width="100%" height={130}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 32, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                  <XAxis
                    dataKey="t"
                    type="number"
                    domain={[tMin - tPad, tMax + tPad]}
                    scale="time"
                    tickFormatter={fmtTime}
                    tick={tickStyle}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={60}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={tickStyle}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(val: number) => [`${val}%`, 'Soil']}
                    labelFormatter={(t: number) => new Date(t).toLocaleTimeString()}
                  />
                  {/* Reference lines */}
                  <ReferenceLine
                    y={35}
                    stroke="#f5b042"
                    strokeDasharray="4 3"
                    strokeWidth={1}
                    label={{ value: '35% (water now)', style: { ...tickStyle, fill: '#f5b042' }, position: 'right' }}
                  />
                  <ReferenceLine
                    y={75}
                    stroke="#f88282"
                    strokeDasharray="4 3"
                    strokeWidth={1}
                    label={{ value: '75% (too wet)', style: { ...tickStyle, fill: '#f88282' }, position: 'right' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="soilPct"
                    stroke="#9ab87a"
                    strokeWidth={1.5}
                    dot={false}
                    name="Soil %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Chart 3: Detection Timeline */}
            <div>
              <p className="mono-label mb-2">Detection Timeline</p>
              <ResponsiveContainer width="100%" height={140}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 32, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
                  <XAxis
                    dataKey="t"
                    type="number"
                    domain={[tMin - tPad, tMax + tPad]}
                    scale="time"
                    tickFormatter={fmtTime}
                    tick={tickStyle}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={60}
                  />
                  <YAxis
                    type="number"
                    domain={[-0.5, 3.5]}
                    ticks={[0, 1, 2, 3]}
                    tickFormatter={(v: number) => CLASS_LABELS[v] ?? ''}
                    tick={tickStyle}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    formatter={(_: unknown, __: unknown, props: { payload?: ReturnType<typeof chartRow> }) => [
                      props.payload?.label ?? '',
                      props.payload?.confirmed ? 'Confirmed ✓' : 'Checking',
                    ]}
                    labelFormatter={(t: unknown) => new Date(t as number).toLocaleTimeString()}
                  />
                  <Scatter
                    dataKey="classY"
                    shape={<DetectionDot />}
                    name="Class"
                  />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="mt-1 flex items-center gap-4 justify-end flex-wrap">
                {Object.entries(ALERT_DOT_COLOR).map(([k, color]) =>
                  k === 'unknown' ? null : (
                    <span key={k} className="flex items-center gap-1.5 font-mono text-2xs text-muted">
                      <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      {k}
                    </span>
                  ),
                )}
                <span className="flex items-center gap-1.5 font-mono text-2xs text-muted">
                  <span className="inline-block h-4 w-4 rounded-full border-2 border-white/50" style={{ background: '#9aaaa4' }} />
                  Confirmed (large)
                </span>
              </div>
            </div>

            {/* Summary line */}
            <div className="rounded-lg border border-line/60 bg-elevated/40 px-3 py-2.5">
              <p className="text-2xs text-muted leading-relaxed">
                <span className="font-medium text-ink">Period summary: </span>
                {summary.confirmedBlightCount > 0 ? (
                  <>
                    During the {summary.confirmedBlightCount} confirmed blight row(s) in this range, average
                    humidity was{' '}
                    <span className="font-mono font-semibold text-ink">
                      {summary.blightAvgHum?.toFixed(1) ?? 'N/A'}%
                    </span>
                    {summary.overallAvgHum !== null && (
                      <>
                        {' '}vs the overall average of{' '}
                        <span className="font-mono font-semibold text-ink">
                          {summary.overallAvgHum.toFixed(1)}%
                        </span>
                        {summary.blightAvgHum !== null &&
                          summary.blightAvgHum > summary.overallAvgHum && (
                            <span className="text-warn"> — disease followed higher humidity.</span>
                          )}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    No confirmed blight in this range.
                    {summary.overallAvgHum !== null && (
                      <>
                        {' '}
                        Overall average humidity:{' '}
                        <span className="font-mono font-semibold text-ink">
                          {summary.overallAvgHum.toFixed(1)}%
                        </span>
                        .
                      </>
                    )}
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
