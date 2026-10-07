/**
 * Detection History — compact table of recent detections.
 *
 * Shows: time, crop, detection, confidence, device.
 * Clearly labels demo data entries.
 */

import { Clock, History } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Meter } from '@/components/ui/meter';
import { cn } from '@/lib/utils';
import { formatDetectionTime } from '@/lib/disease-detection-service';
import type { DiseaseDetection } from '@/types/disease-detection';
import { DISEASE_DETECTION_CONFIG } from '@/types/disease-detection';

function ConfidenceBadge({ value }: { value: number }) {
  const pct = value * 100;
  const isLow = value < DISEASE_DETECTION_CONFIG.LOW_CONFIDENCE_THRESHOLD;
  return (
    <span
      className={cn(
        'font-mono text-2xs tabular-nums',
        isLow ? 'text-warn' : pct >= 90 ? 'text-ok' : 'text-info',
      )}
    >
      {pct.toFixed(1)}%
    </span>
  );
}

function DiseasePill({ disease, isHealthy }: { disease: string; isHealthy: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-2xs font-medium',
        isHealthy
          ? 'border-ok/30 bg-ok/8 text-ok'
          : 'border-danger/30 bg-danger/8 text-danger',
      )}
    >
      <span
        className={cn(
          'h-1.5 w-1.5 rounded-full',
          isHealthy ? 'bg-ok' : 'bg-danger',
        )}
      />
      {disease}
    </span>
  );
}

export function DiseaseDetectionHistory({
  history,
  isDemoMode,
}: {
  history: DiseaseDetection[];
  isDemoMode: boolean;
}) {
  // Show up to 10 recent entries.
  const visible = history.slice(0, 10);

  return (
    <Card>
      <CardHeader
        title="Detection History"
        subtitle={`Last ${visible.length} detection${visible.length !== 1 ? 's' : ''} from edge device`}
        icon={<History className="h-3.5 w-3.5" strokeWidth={1.75} />}
        actions={
          isDemoMode ? (
            <span className="rounded border border-warn/30 bg-warn/10 px-1.5 py-0.5 text-2xs font-bold uppercase tracking-wider text-warn">
              Demo
            </span>
          ) : null
        }
      />

      <CardBody>
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Clock className="h-5 w-5 text-muted" strokeWidth={1.5} />
            <p className="mt-2 text-xs text-muted">No detection history available</p>
            <p className="mt-1 text-2xs text-muted">
              Results will appear here as the TinyML model processes images on the edge device.
            </p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className="grid grid-cols-[auto_1fr_1fr_auto_1fr] gap-x-3 gap-y-0 border-b border-line/60 pb-2 text-2xs font-medium uppercase tracking-[0.1em] text-muted">
              <span>Time</span>
              <span>Crop</span>
              <span>Detection</span>
              <span className="text-right">Confidence</span>
              <span className="text-right">Device</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-line/40">
              {visible.map((det) => {
                const isHealthy = det.disease.toLowerCase() === 'healthy';
                return (
                  <div
                    key={det.id}
                    className="grid grid-cols-[auto_1fr_1fr_auto_1fr] items-center gap-x-3 py-2"
                  >
                    <span className="font-mono text-2xs tabular-nums text-muted">
                      {formatDetectionTime(det.timestamp)}
                    </span>
                    <span className="truncate text-2xs text-ink">{det.crop}</span>
                    <DiseasePill disease={det.disease} isHealthy={isHealthy} />
                    <div className="flex items-center gap-2">
                      <ConfidenceBadge value={det.confidence} />
                      <div className="hidden w-12 sm:block">
                        <Meter
                          height={3}
                          value={det.confidence}
                          tone={
                            det.confidence < DISEASE_DETECTION_CONFIG.LOW_CONFIDENCE_THRESHOLD
                              ? 'warn'
                              : det.confidence >= 0.9
                                ? 'ok'
                                : 'info'
                          }
                          label={`${det.disease} confidence`}
                        />
                      </div>
                    </div>
                    <span className="truncate text-right font-mono text-2xs text-muted">
                      {det.deviceId.replace('AGRIMIND-', '')}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-2 border-t border-line/60 pt-2">
              <p className="font-mono text-2xs text-muted">
                {history.length} total detection{history.length !== 1 ? 's' : ''} ·
                threshold {(DISEASE_DETECTION_CONFIG.LOW_CONFIDENCE_THRESHOLD * 100).toFixed(0)}% ·
                edge inference
              </p>
            </div>
          </>
        )}
      </CardBody>
    </Card>
  );
}
