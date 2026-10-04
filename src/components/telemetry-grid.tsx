import { Camera, Cpu, Droplets, Gauge as GaugeIcon, Thermometer, Zap } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Meter } from '@/components/ui/meter';
import { SwitchRow } from '@/components/ui/switch';
import { formatBytes, formatUptime } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { AccentVar, InputMode, Telemetry } from '@/types/telemetry';

/** Small gauge: a labelled bar. Density over decoration. */
function ReadingGauge({
  icon,
  label,
  value,
  unit,
  min,
  max,
  tone,
  footnote,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  tone: AccentVar;
  footnote?: string;
}) {
  const norm = (value - min) / (max - min);
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-1.5 text-muted">
          {icon}
          <span className="truncate text-2xs font-medium uppercase tracking-[0.11em]">{label}</span>
        </span>
        <span className="shrink-0 font-mono text-lg font-semibold leading-none tabular-nums text-ink">
          {value.toFixed(unit === '%' ? 1 : 2)}
          <span className="ml-0.5 text-2xs font-normal text-muted">{unit}</span>
        </span>
      </div>
      <Meter
        className="mt-2"
        height={4}
        tone={tone}
        value={norm}
        label={`${label} ${value}${unit} of range ${min}-${max}`}
      />
      {footnote ? <p className="mt-1 truncate font-mono text-2xs text-muted">{footnote}</p> : null}
    </div>
  );
}

export function TelemetryGrid({
  telemetry,
  inputMode,
  onInputMode,
  frameRate,
  paused,
}: {
  telemetry: Telemetry;
  inputMode: InputMode;
  onInputMode: (m: InputMode) => void;
  frameRate: number;
  paused: boolean;
}) {
  const heapPct = (telemetry.heapUsedBytes / telemetry.heapCapacityBytes) * 100;

  return (
    <Card>
      <CardHeader
        title="Environmental & Hardware Telemetry"
        subtitle="SHT31 environmental pair, leaf-wetness probe, and MCU health"
        icon={<GaugeIcon className="h-3.5 w-3.5" strokeWidth={1.75} />}
      />
      <CardBody>
        <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
          <ReadingGauge
            icon={<Thermometer className="h-3 w-3" strokeWidth={2} />}
            label="Ambient temp"
            value={telemetry.temperatureC}
            unit="°C"
            min={5}
            max={45}
            tone="info"
            footnote="SHT31-AD1B @ 0x40"
          />
          <ReadingGauge
            icon={<Droplets className="h-3 w-3" strokeWidth={2} />}
            label="Rel. humidity"
            value={telemetry.humidityPct}
            unit="%"
            min={0}
            max={100}
            tone={telemetry.humidityPct > 85 ? 'warn' : 'info'}
            footnote={telemetry.humidityPct > 85 ? 'above infection threshold' : 'SHT31-AD2B @ 0x44'}
          />
          <ReadingGauge
            icon={<Zap className="h-3 w-3" strokeWidth={2} />}
            label="Leaf wetness"
            value={telemetry.leafWetnessPct}
            unit="%"
            min={0}
            max={100}
            tone={telemetry.leafWetnessPct > 70 ? 'danger' : telemetry.leafWetnessPct > 45 ? 'warn' : 'ok'}
            footnote={telemetry.leafWetnessPct > 70 ? 'infection window open' : 'ADS1118 AIN0 @ 0x48'}
          />
        </div>

        <div className="hairline my-3.5" />

        <div className="grid grid-cols-2 gap-x-6 gap-y-3.5 sm:grid-cols-4">
          <div>
            <p className="mono-label">CPU load</p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-ink">
              {telemetry.cpuLoadPct.toFixed(1)}
              <span className="ml-0.5 text-2xs font-normal text-muted">%</span>
            </p>
            <Meter className="mt-1.5" height={3} tone={telemetry.cpuLoadPct > 72 ? 'warn' : 'ok'} value={telemetry.cpuLoadPct / 100} label="cpu load" />
          </div>
          <div>
            <p className="mono-label">SRAM in use</p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-ink">
              {formatBytes(telemetry.heapUsedBytes)}
            </p>
            <Meter className="mt-1.5" height={3} tone={heapPct > 85 ? 'danger' : 'info'} value={heapPct / 100} label="heap usage" />
            <p className="mt-1 font-mono text-2xs text-muted">of {formatBytes(telemetry.heapCapacityBytes)} heap</p>
          </div>
          <div>
            <p className="mono-label">Core clock</p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-ink">100.0</p>
            <p className="mt-1.5 font-mono text-2xs text-muted">MHz · HSE+PLL</p>
          </div>
          <div>
            <p className="mono-label">Uptime</p>
            <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-ink">
              {formatUptime(telemetry.uptimeS)}
            </p>
            <p className="mt-1.5 font-mono text-2xs text-muted">since boot</p>
          </div>
        </div>

        <div className="hairline my-3.5" />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-ink">
              <Camera className="h-3.5 w-3.5 text-muted" strokeWidth={1.75} />
              <span className="text-[13px] font-medium">Camera / sensor input</span>
            </div>
            <p className="mt-0.5 font-mono text-2xs text-muted">
              {inputMode === 'camera'
                ? `active · ${frameRate} FPS · ${paused ? 'stream paused' : 'streaming'}`
                : 'static feature vector · trigger-driven'}
            </p>
          </div>
          <div className="w-full max-w-[260px]">
            <SwitchRow
              checked={inputMode === 'camera'}
              onCheckedChange={(v) => onInputMode(v ? 'camera' : 'static-vector')}
              label="Live camera"
              hint="Off = static feature vector"
            />
          </div>
        </div>

        <div className="hairline my-3.5" />

        <div>
          <p className="mono-label">I²C bus scan</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {telemetry.i2c.map((d) => (
              <span
                key={d.address}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 font-mono text-2xs',
                  d.ok
                    ? 'border-line/70 bg-elevated text-muted'
                    : 'border-danger/40 bg-danger/10 text-danger',
                )}
              >
                <span className={cn('h-1.5 w-1.5 rounded-full', d.ok ? 'bg-ok' : 'bg-danger')} />
                {d.address}
                <span className="text-muted/70">{d.device}</span>
              </span>
            ))}
          </div>
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-2xs leading-snug text-muted">
          <Cpu className="mt-[1px] h-3 w-3 shrink-0" strokeWidth={1.75} />
          Environmental readings are simulated until a board is attached over Web Serial. Values are
          plausible field values, not measurements.
        </p>
      </CardBody>
    </Card>
  );
}