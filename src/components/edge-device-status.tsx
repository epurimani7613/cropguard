/**
 * Edge Device Status — live status panel for ESP32 + TinyML readiness.
 *
 * Integrates with the existing `ConnectionState` from the CropGuard system
 * and augments it with TinyML-specific status information.
 */

import { Cpu, Radio } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/disease-detection-service';
import type { ConnectionState } from '@/types/telemetry';
import type { DiseaseDetection, DetectionStatus } from '@/types/disease-detection';

function StatusDot({
  online,
  pulse = false,
}: {
  online: boolean;
  pulse?: boolean;
}) {
  return (
    <span className="relative flex h-2 w-2 items-center justify-center">
      {pulse && online && (
        <span
          className="absolute h-2 w-2 animate-pulse-ring rounded-full bg-ok/50"
          aria-hidden
        />
      )}
      <span
        className={cn(
          'relative h-2 w-2 rounded-full',
          online ? 'bg-ok' : 'bg-muted',
        )}
      />
    </span>
  );
}

function StatusRow({
  label,
  status,
  detail,
  online,
}: {
  label: string;
  status: string;
  detail?: string;
  online: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div className="flex items-center gap-2.5 min-w-0">
        <StatusDot online={online} pulse={online} />
        <span className="truncate text-xs font-medium text-ink">{label}</span>
      </div>
      <div className="text-right min-w-0">
        <span
          className={cn(
            'text-2xs font-semibold',
            online ? 'text-ok' : 'text-muted',
          )}
        >
          {status}
        </span>
        {detail && (
          <p className="truncate text-2xs text-muted">{detail}</p>
        )}
      </div>
    </div>
  );
}

export function EdgeDeviceStatus({
  connectionState,
  detectionStatus,
  latest,
}: {
  connectionState: ConnectionState;
  detectionStatus: DetectionStatus;
  latest: DiseaseDetection | null;
}) {
  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  const tinyMLStatus =
    detectionStatus === 'detection-available'
      ? 'READY'
      : detectionStatus === 'waiting-for-hardware'
        ? 'Waiting for device'
        : detectionStatus === 'no-recent-detection'
          ? 'Idle'
          : 'Offline';

  const tinyMLOnline =
    detectionStatus === 'detection-available' ||
    detectionStatus === 'waiting-for-hardware';

  return (
    <Card>
      <CardHeader
        title="Edge Device Status"
        subtitle="Hardware connectivity and TinyML readiness"
        icon={<Radio className="h-3.5 w-3.5" strokeWidth={1.75} />}
      />

      <CardBody className="space-y-1">
        <StatusRow
          label="ESP32"
          status={isConnected ? 'ONLINE' : isConnecting ? 'CONNECTING' : 'OFFLINE'}
          detail={
            isConnected
              ? 'Web Serial · 115200 baud'
              : isConnecting
                ? 'Establishing connection…'
                : 'Not connected'
          }
          online={isConnected}
        />

        <StatusRow
          label="TinyML Detection"
          status={tinyMLStatus}
          detail={
            detectionStatus === 'detection-available' && latest
              ? `Last: ${formatRelativeTime(latest.timestamp)}`
              : undefined
          }
          online={tinyMLOnline}
        />

        <StatusRow
          label="Model Runtime"
          status={latest?.model ?? 'TinyML'}
          detail={latest?.modelVersion ? `Version ${latest.modelVersion}` : 'Edge Inference'}
          online={tinyMLOnline}
        />

        <div className="hairline my-2" />

        <div className="flex items-start gap-2 rounded-lg border border-line/60 bg-elevated/50 px-2.5 py-2">
          <Cpu className="mt-[1px] h-3 w-3 shrink-0 text-muted" strokeWidth={1.75} />
          <p className="text-2xs leading-relaxed text-muted">
            Disease detection runs entirely on the edge device using TinyML.
            The dashboard receives classification results — it does not
            perform inference.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
