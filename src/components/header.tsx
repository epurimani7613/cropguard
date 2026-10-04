import { Cpu, MemoryStick, Moon, Sprout, Sun, Timer, Usb, Zap } from 'lucide-react';
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
        'pressable inline-flex items-center gap-2.5 rounded-full border border-line/70 bg-elevated px-3 py-1.5 shadow-e1',
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

/**
 * Brand mark. A leaf in a rounded emerald tile — the "logo placeholder" the
 * brief asks for, kept as an icon rather than an invented wordmark so it does
 * not pretend to be final brand art.
 */
export function BrandMark({ size = 'md' }: { size?: 'sm' | 'md' }) {
  return (
    <span
      className={cn(
        'pressable flex shrink-0 items-center justify-center rounded-xl bg-brand text-white shadow-e2',
        size === 'md' ? 'h-10 w-10' : 'h-8 w-8',
      )}
    >
      <Sprout
        className={cn('animate-sway', size === 'md' ? 'h-5 w-5' : 'h-4 w-4')}
        strokeWidth={2}
      />
    </span>
  );
}

/** Elevated metric tile — the brief's "glassmorphism cards" for core stats. */
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
    <div className="pressable group flex min-w-0 items-start gap-3 rounded-xl border border-line/70 bg-surface/70 px-3.5 py-3 shadow-e1 hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-e2">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10 text-brand transition-colors duration-300 group-hover:bg-brand/15">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="mono-label truncate">{label}</p>
        <p className="mt-1 truncate font-mono text-sm font-semibold tabular-nums text-ink">
          {value}
          {unit ? <span className="ml-1 text-2xs font-normal text-muted">{unit}</span> : null}
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
    <header className="glass sticky top-0 z-30 border-b border-line/60 shadow-e1">
      <div className="mx-auto max-w-[1600px] px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
          <div className="flex min-w-0 items-center gap-3">
            <BrandMark />
            <div className="min-w-0">
              <h1 className="truncate font-display text-lg font-extrabold tracking-tight text-ink">
                CropGuard <span className="text-brand">TinyML</span>
              </h1>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-medium text-muted">
                <span>Edge Health Diagnostics</span>
                <span className="font-mono text-2xs">
                  {DEVICE_INFO.board} · Edge Impulse CMSIS-NN
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge state={state} />
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} />
              )}
            </Button>
          </div>
        </div>

        {/* Core metrics grid — four real facts, equal weight, no invented metrics. */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <QuickStat
            icon={<Cpu className="h-4 w-4" strokeWidth={1.75} />}
            label="Baud rate"
            value="115200"
            unit="8N1"
            hint="USB-UART · Web Serial"
          />
          <QuickStat
            icon={<Zap className="h-4 w-4" strokeWidth={1.75} />}
            label="Model runtime"
            value="CMSIS-NN / TFLM"
            hint={DEVICE_INFO.inputShape}
          />
          <QuickStat
            icon={<Timer className="h-4 w-4" strokeWidth={1.75} />}
            label="Last latency"
            value={formatMs(totalMs, 2)}
            unit="per frame"
            hint="DSP pre-processing + NN forward"
          />
          <QuickStat
            icon={<MemoryStick className="h-4 w-4" strokeWidth={1.75} />}
            label="System memory"
            value={`${heapPct.toFixed(1)}%`}
            hint={`SRAM heap · fixed ${formatBytes(DEVICE_INFO.arenaBytes)} tensor arena reserved separately`}
          />
        </div>

        <div className="mt-3 hidden lg:block">
          <Meter
            height={3}
            tone={heapPct > 85 ? 'danger' : heapPct > 65 ? 'warn' : 'ok'}
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
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 font-mono text-2xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <Usb className="h-3 w-3" strokeWidth={1.75} />
        {DEVICE_INFO.board} · {formatBytes(flashBytes)} FLASH · {formatBytes(ramBytes)} SRAM
      </span>
      <span>{DEVICE_INFO.sdk}</span>
      <span>{DEVICE_INFO.projectName} · deploy v2</span>
    </div>
  );
}