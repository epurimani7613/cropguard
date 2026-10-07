/**
 * AI Plant Disease Detection Card.
 *
 * Displays the latest TinyML edge inference result from the hardware.
 * This component ONLY visualises results — it never performs inference.
 *
 * States rendered:
 *  1. Healthy detection (green status)
 *  2. Disease detected (amber/red status)
 *  3. No recent detection (neutral)
 *  4. Hardware offline (grey)
 *  5. Low confidence (amber warning)
 */

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Radio,
  Scan,
  Shield,
  ShieldAlert,
  ShieldQuestion,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/disease-detection-service';
import type { DiseaseDetection, DetectionStatus } from '@/types/disease-detection';
import { DISEASE_DETECTION_CONFIG } from '@/types/disease-detection';

/* ------------------------------------------------------------------ */
/* Status configuration                                                */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<
  DetectionStatus,
  {
    label: string;
    dot: string;
    text: string;
    bg: string;
    border: string;
    icon: typeof Wifi;
    pulse: boolean;
  }
> = {
  'detection-available': {
    label: 'Detection Available',
    dot: 'bg-ok',
    text: 'text-ok',
    bg: 'bg-ok/8',
    border: 'border-ok/25',
    icon: Wifi,
    pulse: true,
  },
  'waiting-for-hardware': {
    label: 'Waiting for Hardware',
    dot: 'bg-warn',
    text: 'text-warn',
    bg: 'bg-warn/8',
    border: 'border-warn/25',
    icon: Radio,
    pulse: true,
  },
  'no-recent-detection': {
    label: 'No Recent Detection',
    dot: 'bg-info',
    text: 'text-info',
    bg: 'bg-info/8',
    border: 'border-info/25',
    icon: Activity,
    pulse: false,
  },
  'hardware-offline': {
    label: 'Hardware Offline',
    dot: 'bg-muted',
    text: 'text-muted',
    bg: 'bg-elevated/50',
    border: 'border-line/70',
    icon: WifiOff,
    pulse: false,
  },
};

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: DetectionStatus }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-2.5 py-1',
        cfg.border,
        cfg.bg,
      )}
    >
      <span className="relative flex h-1.5 w-1.5 items-center justify-center">
        {cfg.pulse && (
          <span
            className={cn('absolute h-1.5 w-1.5 animate-pulse-ring rounded-full', cfg.dot, 'opacity-50')}
            aria-hidden
          />
        )}
        <span className={cn('relative h-1.5 w-1.5 rounded-full', cfg.dot)} />
      </span>
      <Icon className={cn('h-3 w-3', cfg.text)} strokeWidth={2} />
      <span className={cn('text-2xs font-semibold', cfg.text)}>{cfg.label}</span>
    </span>
  );
}

function DemoTag() {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-warn/30 bg-warn/10 px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-warn">
      Demo
    </span>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-[3px]">
      <dt className="shrink-0 text-2xs uppercase tracking-[0.1em] text-muted">{label}</dt>
      <dd className={cn('min-w-0 truncate text-right text-xs text-ink', mono && 'font-mono')}>
        {value}
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Confidence ring (compact version for this card)                     */
/* ------------------------------------------------------------------ */

function CompactConfidenceRing({
  value,
  isLowConfidence,
}: {
  value: number;
  isLowConfidence: boolean;
}) {
  const size = 88;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));
  const pct = clamped * 100;
  const dash = circumference * clamped;

  const tone = isLowConfidence ? 'warn' : pct >= 90 ? 'ok' : pct >= 70 ? 'info' : 'warn';
  const strokeClass: Record<string, string> = {
    ok: 'stroke-ok',
    warn: 'stroke-warn',
    info: 'stroke-info',
  };
  const textClass: Record<string, string> = {
    ok: 'text-ok',
    warn: 'text-warn',
    info: 'text-info',
  };

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="meter"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      aria-label="detection confidence"
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-line/70"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className={cn(strokeClass[tone], 'transition-[stroke-dasharray] duration-700 ease-out')}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn('font-mono text-lg font-semibold tabular-nums leading-none', textClass[tone])}>
          {pct.toFixed(1)}
          <span className="text-xs">%</span>
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main card                                                           */
/* ------------------------------------------------------------------ */

export function DiseaseDetectionCard({
  latest,
  status,
  isDemoMode,
}: {
  latest: DiseaseDetection | null;
  status: DetectionStatus;
  isDemoMode: boolean;
}) {
  const isLowConfidence =
    latest !== null && latest.confidence < DISEASE_DETECTION_CONFIG.LOW_CONFIDENCE_THRESHOLD;
  const isHealthy = latest?.disease.toLowerCase() === 'healthy';
  const hasDiseaseResult = status === 'detection-available' && latest !== null;

  /* Visual tone based on the detection result */
  const cardTone = !hasDiseaseResult
    ? 'neutral'
    : isLowConfidence
      ? 'warning'
      : isHealthy
        ? 'healthy'
        : 'disease';

  const toneStyles = {
    healthy: {
      icon: CheckCircle2,
      iconClass: 'text-ok',
      titleClass: 'text-ok',
      chip: 'border-ok/30 bg-ok/10 text-ok',
    },
    disease: {
      icon: ShieldAlert,
      iconClass: 'text-danger',
      titleClass: 'text-danger',
      chip: 'border-danger/30 bg-danger/10 text-danger',
    },
    warning: {
      icon: AlertTriangle,
      iconClass: 'text-warn',
      titleClass: 'text-warn',
      chip: 'border-warn/30 bg-warn/10 text-warn',
    },
    neutral: {
      icon: ShieldQuestion,
      iconClass: 'text-muted',
      titleClass: 'text-muted',
      chip: 'border-line/70 bg-elevated text-muted',
    },
  };

  const tone = toneStyles[cardTone];
  const ToneIcon = tone.icon;

  return (
    <Card>
      <CardHeader
        title="Edge AI Disease Detection"
        subtitle="TinyML inference performed on device"
        icon={<Scan className="h-3.5 w-3.5" strokeWidth={1.75} />}
        actions={
          <div className="flex items-center gap-2">
            {isDemoMode && <DemoTag />}
            <StatusBadge status={status} />
          </div>
        }
      />

      <CardBody className="space-y-4">
        {/* Detection result or waiting state */}
        {hasDiseaseResult && latest ? (
          <>
            {/* Primary result row */}
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <span className="mono-label">
                  {isHealthy ? 'Plant Status' : 'Disease Detected'}
                </span>
                <div className="mt-1.5 flex items-center gap-2.5">
                  <ToneIcon className={cn('h-5 w-5 shrink-0', tone.iconClass)} strokeWidth={2} />
                  <h3
                    className={cn(
                      'font-display text-xl font-extrabold uppercase leading-tight tracking-tight',
                      tone.titleClass,
                    )}
                  >
                    {latest.disease}
                  </h3>
                </div>

                {/* Badge row */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-2xs font-bold',
                      tone.chip,
                    )}
                  >
                    <ToneIcon className="h-3 w-3" strokeWidth={2.25} />
                    {isLowConfidence
                      ? 'Low Confidence'
                      : isHealthy
                        ? 'Healthy'
                        : 'Disease Detected'}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-line/70 bg-elevated px-2.5 py-0.5 text-2xs font-semibold text-ink">
                    {latest.crop}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-brand/25 bg-brand/8 px-2.5 py-0.5 text-2xs font-semibold text-brand">
                    <Cpu className="h-2.5 w-2.5" strokeWidth={2} />
                    {latest.model} • Edge
                  </span>
                </div>
              </div>

              {/* Confidence ring */}
              <CompactConfidenceRing value={latest.confidence} isLowConfidence={isLowConfidence} />
            </div>

            {/* Details grid */}
            <div className="hairline" />

            <dl>
              <InfoRow label="Confidence" value={`${(latest.confidence * 100).toFixed(1)}%`} mono />
              <InfoRow label="Detected" value={formatRelativeTime(latest.timestamp)} />
              <InfoRow label="Crop" value={latest.crop} />
              <InfoRow label="Device" value={latest.deviceId} mono />
              <InfoRow
                label="Severity"
                value={latest.severity ?? 'Not available'}
              />
              <InfoRow
                label="Model Version"
                value={latest.modelVersion ?? 'N/A'}
                mono
              />
              <InfoRow label="Inference" value={`${latest.model} • Edge Inference`} />
            </dl>

            {isLowConfidence && (
              <>
                <div className="hairline" />
                <div className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn/5 px-2.5 py-2">
                  <AlertTriangle
                    className="mt-[1px] h-3.5 w-3.5 shrink-0 text-warn"
                    strokeWidth={1.75}
                  />
                  <p className="text-2xs leading-relaxed text-muted">
                    Confidence is below the {(DISEASE_DETECTION_CONFIG.LOW_CONFIDENCE_THRESHOLD * 100).toFixed(0)}%
                    threshold. This classification should not be treated as reliable. Recapture the
                    image under better conditions or verify manually.
                  </p>
                </div>
              </>
            )}

            {latest.source === 'demo' && (
              <>
                <div className="hairline" />
                <div className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn/5 px-2.5 py-2">
                  <Shield
                    className="mt-[1px] h-3.5 w-3.5 shrink-0 text-warn"
                    strokeWidth={1.75}
                  />
                  <p className="text-2xs leading-relaxed text-muted">
                    <span className="font-semibold text-warn">DEMO DATA</span> — This result is
                    simulated for demonstration purposes. Connect the AGRIMIND ESP32 hardware to see
                    real disease detection results from the TinyML model.
                  </p>
                </div>
              </>
            )}
          </>
        ) : (
          /* Empty / waiting state */
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-elevated">
              {status === 'hardware-offline' ? (
                <WifiOff className="h-5 w-5 text-muted" strokeWidth={1.5} />
              ) : (
                <Radio className="h-5 w-5 text-info animate-pulse" strokeWidth={1.5} />
              )}
            </div>
            <p className="mt-3 text-sm font-medium text-ink">
              {status === 'hardware-offline' ? 'Device Offline' : 'Waiting for Detection'}
            </p>
            <p className="mt-1 max-w-xs text-center text-2xs text-muted">
              {status === 'hardware-offline'
                ? 'The AGRIMIND ESP32 is not connected. Connect the device to receive TinyML disease detection results.'
                : 'Awaiting the first disease detection result from the TinyML model running on the edge device.'}
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
