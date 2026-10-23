/**
 * DataSimulatePanel — "Simulate data" button (test mode) for Features 4 & 5.
 *
 * Feeds sample DATA lines through the same parser as real hardware so
 * alerts, charts and CSV can all be tested without an STM32 board.
 * Shows each sample button and the parse result (success/ignored).
 */

import { useState } from 'react';
import { CheckCircle2, FlaskConical, XCircle } from 'lucide-react';

import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { SIMULATE_LINES } from '@/state/useDataStream';
import type { DataRow } from '@/types/data-row';

interface FeedResult {
  lineLabel: string;
  success: boolean;
  alertLevel?: string;
  classLabel?: string;
}

export function DataSimulatePanel({
  onSimulateLine,
}: {
  onSimulateLine: (line: string) => DataRow | null;
}) {
  const [lastResult, setLastResult] = useState<FeedResult | null>(null);

  const feed = (item: (typeof SIMULATE_LINES)[number]) => {
    const row = onSimulateLine(item.line);
    setLastResult({
      lineLabel: item.label,
      success: row !== null,
      alertLevel: row?.alertLevel,
      classLabel: row ? `${row.class} ${row.status} (${row.confidencePct}%)` : undefined,
    });
  };

  return (
    <Card>
      <CardHeader
        title="Simulate DATA Lines"
        subtitle="Feed sample DATA protocol lines to test alerts, charts and CSV without hardware"
        icon={<FlaskConical className="h-3.5 w-3.5" strokeWidth={1.75} />}
      />
      <CardBody className="space-y-3">
        <div className="grid grid-cols-1 gap-1.5">
          {SIMULATE_LINES.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => feed(item)}
              className={cn(
                'flex items-start gap-2 rounded-lg border border-line bg-surface px-2.5 py-2 text-left transition-colors hover:bg-elevated hover:border-brand/30',
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-ink">{item.label}</span>
                <span className="block truncate font-mono text-2xs text-muted">{item.line}</span>
              </span>
            </button>
          ))}
        </div>

        {lastResult && (
          <div
            className={cn(
              'flex items-start gap-2 rounded-lg border px-2.5 py-2',
              lastResult.success ? 'border-ok/40 bg-ok/10' : 'border-line/60 bg-elevated/50',
            )}
            aria-live="polite"
          >
            {lastResult.success ? (
              <CheckCircle2 className="mt-px h-3.5 w-3.5 shrink-0 text-ok" strokeWidth={1.75} />
            ) : (
              <XCircle className="mt-px h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={1.75} />
            )}
            <div className="min-w-0 text-2xs">
              <p className="font-medium text-ink">
                {lastResult.lineLabel}:{' '}
                {lastResult.success ? (
                  <span className="text-ok">parsed ✓</span>
                ) : (
                  <span className="text-muted">ignored (malformed)</span>
                )}
              </p>
              {lastResult.success && lastResult.classLabel && (
                <p className="mt-0.5 text-muted">
                  {lastResult.classLabel} · alert:{' '}
                  <span
                    className={cn(
                      'font-mono font-semibold',
                      lastResult.alertLevel === 'RED'
                        ? 'text-danger'
                        : lastResult.alertLevel === 'AMBER'
                          ? 'text-warn'
                          : 'text-ok',
                    )}
                  >
                    {lastResult.alertLevel}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        <p className="text-2xs leading-relaxed text-muted">
          Each button feeds one DATA line through the exact same parser that real hardware uses.
          Confirmed blight lines will trigger the alert panel and play a sound if unmuted.
          The malformed line tests the error-handling path and should show "ignored".
        </p>
      </CardBody>
    </Card>
  );
}
