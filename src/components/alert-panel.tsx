/**
 * AlertPanel — Feature 4: Alert Status Panel
 *
 * Shows a colour-coded badge (GREEN / AMBER / RED) with icon + text,
 * current sensor readings, watering advice, weather risk levels,
 * a pop-up banner for confirmed blight detections, a mute/unmute toggle,
 * and a scrollable alert log.
 */

import { useCallback, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  BellOff,
  CheckCircle2,
  Clock,
  Droplets,
  Leaf,
  ShieldAlert,
  Thermometer,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';

import { cn } from '@/lib/utils';
import { isMuted, setMuted } from '@/lib/audio';
import type { AlertLevel, AlertLogEntry, DataRow } from '@/types/data-row';

// ── risk level label ──────────────────────────────────────────────────────
function riskLabel(level: 0 | 1 | 2): { text: string; className: string } {
  switch (level) {
    case 2:
      return { text: 'High', className: 'text-danger font-semibold' };
    case 1:
      return { text: 'Medium', className: 'text-warn font-semibold' };
    default:
      return { text: 'Low', className: 'text-ok' };
  }
}

function waterLabel(water: DataRow['water']): string {
  switch (water) {
    case 'water_now':
      return 'Water now ⚠';
    case 'too_wet':
      return 'Too wet — reduce irrigation';
    case 'enough':
      return 'Enough water';
  }
}

function waterClass(water: DataRow['water']): string {
  switch (water) {
    case 'water_now':
      return 'text-warn';
    case 'too_wet':
      return 'text-danger';
    case 'enough':
      return 'text-ok';
  }
}

// ── badge config ──────────────────────────────────────────────────────────
interface BadgeConfig {
  bg: string;
  border: string;
  text: string;
  icon: React.ReactNode;
  label: string;
}

function badgeConfig(level: AlertLevel): BadgeConfig {
  switch (level) {
    case 'RED':
      return {
        bg: 'bg-danger/10',
        border: 'border-danger/40',
        text: 'text-danger',
        icon: <ShieldAlert className="h-5 w-5" strokeWidth={2} />,
        label: 'RED ALERT',
      };
    case 'AMBER':
      return {
        bg: 'bg-warn/10',
        border: 'border-warn/40',
        text: 'text-warn',
        icon: <AlertTriangle className="h-5 w-5" strokeWidth={2} />,
        label: 'AMBER WARNING',
      };
    default:
      return {
        bg: 'bg-ok/10',
        border: 'border-ok/30',
        text: 'text-ok',
        icon: <CheckCircle2 className="h-5 w-5" strokeWidth={2} />,
        label: 'ALL CLEAR',
      };
  }
}

// ── Alert banner (pop-up) ─────────────────────────────────────────────────
function AlertBanner({
  level,
  reason,
  onDismiss,
}: {
  level: AlertLevel;
  reason: string;
  onDismiss: () => void;
}) {
  const cfg = badgeConfig(level);
  return (
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label={`${cfg.label}: ${reason}`}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-3.5 animate-rise',
        cfg.bg,
        cfg.border,
      )}
    >
      <span className={cn('mt-px shrink-0', cfg.text)}>{cfg.icon}</span>
      <div className="min-w-0 flex-1">
        <p className={cn('text-[13px] font-bold', cfg.text)}>{cfg.label}</p>
        <p className="mt-0.5 text-2xs text-muted">{reason}</p>
        <p className="mt-0.5 font-mono text-2xs text-muted">
          {new Date().toLocaleTimeString()}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss alert"
        className="pressable mt-px shrink-0 rounded-lg p-0.5 text-muted hover:bg-line/40 hover:text-ink"
      >
        <X className="h-4 w-4" strokeWidth={2} />
      </button>
    </div>
  );
}

// ── Alert log entry ───────────────────────────────────────────────────────
function LogRow({ entry }: { entry: AlertLogEntry }) {
  const cfg = badgeConfig(entry.level);
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className={cn('mt-0.5 shrink-0', cfg.text)}>
        {entry.level === 'RED' ? (
          <ShieldAlert className="h-3.5 w-3.5" strokeWidth={2} />
        ) : entry.level === 'AMBER' ? (
          <AlertTriangle className="h-3.5 w-3.5" strokeWidth={2} />
        ) : (
          <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-2xs text-ink">{entry.reason}</p>
        <p className="font-mono text-2xs text-muted">
          {new Date(entry.timestamp).toLocaleTimeString()}
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-md border px-1.5 py-0.5 font-mono text-[10px] font-bold',
          cfg.text,
          cfg.border,
          cfg.bg,
        )}
      >
        {entry.level}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────
export function AlertPanel({
  latest,
  alertLevel,
  alertReasonText,
  bannerVisible,
  onDismissBanner,
  alertLog,
}: {
  latest: DataRow | null;
  alertLevel: AlertLevel;
  alertReasonText: string;
  bannerVisible: boolean;
  onDismissBanner: () => void;
  alertLog: AlertLogEntry[];
}) {
  const [muted, setMutedState] = useState(() => isMuted());

  const toggleMute = useCallback(() => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  }, [muted]);

  const cfg = badgeConfig(alertLevel);

  return (
    <Card>
      <CardHeader
        title="Alert Status"
        subtitle="Disease detection and environmental risk monitor"
        icon={<Bell className="h-3.5 w-3.5" strokeWidth={1.75} />}
        actions={
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? 'Unmute alerts' : 'Mute alerts'}
            title={muted ? 'Unmute alerts' : 'Mute alerts'}
            className={cn(
              'pressable flex h-7 w-7 items-center justify-center rounded-lg border border-line/70 bg-surface text-muted hover:border-brand/40 hover:text-ink',
              muted && 'border-danger/30 bg-danger/5 text-danger',
            )}
          >
            {muted ? (
              <VolumeX className="h-3.5 w-3.5" strokeWidth={1.75} />
            ) : (
              <Volume2 className="h-3.5 w-3.5" strokeWidth={1.75} />
            )}
          </button>
        }
      />

      <CardBody className="space-y-4">
        {/* Alert banner */}
        {bannerVisible && alertLevel !== 'GREEN' && (
          <AlertBanner
            level={alertLevel}
            reason={alertReasonText}
            onDismiss={onDismissBanner}
          />
        )}

        {/* Main status badge */}
        <div
          className={cn(
            'flex items-center gap-3 rounded-xl border p-3.5',
            cfg.bg,
            cfg.border,
          )}
          role="status"
          aria-label={`Alert level: ${cfg.label}. ${alertReasonText}`}
        >
          <span className={cn('shrink-0', cfg.text)}>{cfg.icon}</span>
          <div className="min-w-0 flex-1">
            <p className={cn('text-base font-bold', cfg.text)}>{cfg.label}</p>
            <p className="mt-0.5 text-2xs text-muted leading-relaxed">{alertReasonText}</p>
          </div>
          <span
            className={cn(
              'shrink-0 rounded-lg border px-2.5 py-1 font-mono text-xs font-bold',
              cfg.text,
              cfg.border,
              cfg.bg,
            )}
          >
            {alertLevel}
          </span>
        </div>

        {/* Sensor readings */}
        {latest ? (
          <div className="grid grid-cols-2 gap-3">
            {/* Temperature */}
            <div className="rounded-lg border border-line/60 bg-elevated/50 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-muted">
                <Thermometer className="h-3 w-3" strokeWidth={2} />
                <span className="text-2xs uppercase tracking-wide">Temperature</span>
              </div>
              <p className="mt-1 font-mono text-sm font-semibold text-ink">
                {latest.tempC !== null ? `${latest.tempC.toFixed(1)} °C` : (
                  <span className="text-muted italic">NA</span>
                )}
              </p>
            </div>

            {/* Humidity */}
            <div className="rounded-lg border border-line/60 bg-elevated/50 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-muted">
                <Droplets className="h-3 w-3" strokeWidth={2} />
                <span className="text-2xs uppercase tracking-wide">Humidity</span>
              </div>
              <p className="mt-1 font-mono text-sm font-semibold text-ink">
                {latest.humidityPct !== null ? `${latest.humidityPct.toFixed(1)} %` : (
                  <span className="text-muted italic">NA</span>
                )}
              </p>
            </div>

            {/* Soil moisture */}
            <div className="rounded-lg border border-line/60 bg-elevated/50 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-muted">
                <Leaf className="h-3 w-3" strokeWidth={2} />
                <span className="text-2xs uppercase tracking-wide">Soil</span>
              </div>
              <p className="mt-1 font-mono text-sm font-semibold text-ink">
                {latest.soilPct} %
              </p>
            </div>

            {/* Watering advice */}
            <div className="rounded-lg border border-line/60 bg-elevated/50 px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-muted">
                <Zap className="h-3 w-3" strokeWidth={2} />
                <span className="text-2xs uppercase tracking-wide">Watering</span>
              </div>
              <p className={cn('mt-1 text-2xs font-semibold leading-snug', waterClass(latest.water))}>
                {waterLabel(latest.water)}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-center text-2xs text-muted py-2">
            No sensor data yet. Connect hardware or use Simulate Data.
          </p>
        )}

        {/* Weather risk levels */}
        {latest && (
          <div className="flex gap-4 rounded-lg border border-line/60 bg-elevated/50 px-3 py-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-2xs text-muted uppercase tracking-wide">Early Blight Risk</p>
              <p className={cn('mt-0.5 text-[13px]', riskLabel(latest.earlyRisk).className)}>
                {riskLabel(latest.earlyRisk).text}
              </p>
            </div>
            <div className="h-auto w-px bg-line/60" />
            <div className="flex-1 min-w-0">
              <p className="text-2xs text-muted uppercase tracking-wide">Late Blight Risk</p>
              <p className={cn('mt-0.5 text-[13px]', riskLabel(latest.lateRisk).className)}>
                {riskLabel(latest.lateRisk).text}
              </p>
            </div>
          </div>
        )}

        {/* Alert log */}
        {alertLog.length > 0 && (
          <>
            <div className="hairline" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-3 w-3 text-muted" strokeWidth={1.75} />
                <p className="mono-label">Alert log</p>
                <span className="ml-auto rounded-full border border-line/70 bg-surface px-2 py-0.5 font-mono text-2xs text-muted">
                  {alertLog.length}
                </span>
              </div>
              <div className="scroll-thin max-h-40 divide-y divide-line/40 overflow-y-auto rounded-lg border border-line/60 bg-elevated/30 px-2">
                {alertLog.map((entry) => (
                  <LogRow key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Mute indicator */}
        {muted && (
          <div className="flex items-center gap-2 rounded-lg border border-danger/20 bg-danger/5 px-2.5 py-2">
            <BellOff className="h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={1.75} />
            <p className="text-2xs text-muted">Sound alerts are muted. Click the bell icon to unmute.</p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
