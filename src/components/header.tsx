import { Cpu, MemoryStick, Moon, Sun, Timer, Usb, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Meter } from '@/components/ui/meter';
import { DEVICE_INFO } from '@/data/device';
import { formatBytes, formatMs } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { ConnectionState } from '@/types/telemetry';

const STATE_COPY: Record<
  ConnectionState,
  { label: string; dot: string; ring: string; text: string; pulse: boolean }
> = {
  connected: {
    label: 'Device connected',
    dot: 'bg-ok',
    ring: 'bg-ok/50',
    text: 'text-ok',
    pulse: true,
  },
  connecting: {
    label: 'Connecting…',
    dot: 'bg-warn',
    ring: 'bg-warn/50',
    text: 'text-warn',
    pulse: true,
  },
  disconnected: {
    label: 'Simulator (no device)',
    dot: 'bg-info',
    ring: 'bg-info/50',
    text: 'text-info',
    pulse: true,
  },
  unsupported: {
    label: 'Web Serial unsupported',
    dot: 'bg-muted',
    ring: 'bg-muted/40',
    text: 'text-muted',
    pulse: false,
  },
};

export function StatusBadge({ state }: { state: ConnectionState }) {
  const s = STATE_COPY[state];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-line/70 bg-elevated/80 px-2.5 py-1',
      )}
    >
      <span className="relative flex h-2 w-2 items-center justify-center">
        {s.pulse ? (
          <span className={cn('absolute h-2 w-2 animate-pulse-ring rounded-full', s.ring)} aria-hidden />
        ) : null}
        <span className={cn('relative h-2 w-2 rounded-full', s.dot)} />
      </span>
      <span className={cn('text-2xs font-semibold', s.text)}>
        {state === 'connected' ? `${s.label} · ${DEVICE_INFO.board} via Web Serial / UART` : s.label}
      </span>
    </span>
  );
}

function QuickStat({
  icon,
  label,
  value,
  unit,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-2.5">
      <span className="mt-0.5 shrink-0 text-muted">{icon}</span>
      <div className="min-w-0">
        <p className="mono-label truncate">{label}</p>
        <p className="mt-0.5 truncate font-mono text-[13px] font-semibold tabular-nums text-ink">
          {value}
          {unit ? <span className="ml-0.5 text-2xs font-normal text-muted">{unit}</span> : null}
        </p>
        {hint ? <p className="mt-0.5 truncate text-2xs text-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

export function Header({
  state,
  theme,
  onToggleTheme,
  totalMs,
  heapPct,
}: {
  state: ConnectionState;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  totalMs: number;
  heapPct: number;
}) {
  return (
    <header className="glass sticky top-0 z-30 border-b border-line/60">
      <div className="mx-auto max-w-[1600px] px-5 py-3">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <Cpu className="h-4 w-4 shrink-0 text-ok" strokeWidth={2} />
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-ink">
                CropGuard TinyML
                <span className="ml-2 font-normal text-muted">— Edge Health Diagnostics</span>
              </h1>
            </div>
            <p className="mt-1 font-mono text-2xs text-muted">
              Target: {DEVICE_INFO.board} | Engine: Edge Impulse CMSIS-NN
            </p>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge state={state} />
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
            </Button>
          </div>
        </div>

        {/* Quick stats bar — four facts, equal weight, no chart. */}
        <div className="mt-3.5 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-line/50 pt-3 lg:grid-cols-4">
          <QuickStat
            icon={<Cpu className="h-3.5 w-3.5" strokeWidth={1.75} />}
            label="Baud rate"
            value="115200"
            unit="8N1"
            hint="USB-UART · Web Serial"
          />
          <QuickStat
            icon={<Zap className="h-3.5 w-3.5" strokeWidth={1.75} />}
            label="Model runtime"
            value="CMSIS-NN / TFLM"
            hint={DEVICE_INFO.inputShape}
          />
          <QuickStat
            icon={<Timer className="h-3.5 w-3.5" strokeWidth={1.75} />}
            label="Last latency"
            value={formatMs(totalMs, 2)}
            unit="per frame"
            hint="DSP pre-processing + NN forward"
          />
          <QuickStat
            icon={<MemoryStick className="h-3.5 w-3.5" strokeWidth={1.75} />}
            label="System memory"
            value={`${heapPct.toFixed(1)}%`}
            hint={`SRAM heap · fixed ${formatBytes(DEVICE_INFO.arenaBytes)} tensor arena reserved separately`}
          />
        </div>

        <div className="mt-2.5 hidden lg:block">
          <Meter
            height={2}
            tone={heapPct > 85 ? 'danger' : heapPct > 65 ? 'warn' : 'info'}
            value={heapPct / 100}
            label="system memory usage"
          />
        </div>
      </div>
    </header>
  );
}

export function DeviceStrip({ flashBytes, ramBytes }: { flashBytes: number; ramBytes: number }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-2xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <Usb className="h-3 w-3" strokeWidth={1.75} />
        {DEVICE_INFO.board} · {formatBytes(flashBytes)} FLASH · {formatBytes(ramBytes)} SRAM
      </span>
      <span>{DEVICE_INFO.sdk}</span>
      <span>{DEVICE_INFO.projectName} · deploy v2</span>
    </div>
  );
}