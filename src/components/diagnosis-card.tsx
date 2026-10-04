import { AlertTriangle, CheckCircle2, HelpCircle, Leaf, Sprout, TriangleAlert } from 'lucide-react';
import { ConfidenceRing } from '@/components/confidence-ring';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { SEVERITY_LABEL } from '@/components/ui/stat';
import { getCropClass } from '@/data/classes';
import { DEVICE_INFO } from '@/data/device';
import { formatStamp } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Inference } from '@/types/telemetry';

const SEVERITY_STYLE = {
  healthy: { chip: 'border-ok/40 bg-ok/10 text-ok', meter: 'ok' as const, icon: CheckCircle2 },
  watch: { chip: 'border-warn/40 bg-warn/10 text-warn', meter: 'warn' as const, icon: AlertTriangle },
  critical: { chip: 'border-danger/40 bg-danger/10 text-danger', meter: 'danger' as const, icon: TriangleAlert },
};

function List({ items, tone }: { items: string[]; tone: 'ok' | 'warn' | 'danger' | 'muted' }) {
  if (!items.length) return <p className="text-2xs text-muted">No entries for this class.</p>;
  const dot =
    tone === 'ok' ? 'bg-ok' : tone === 'warn' ? 'bg-warn' : tone === 'danger' ? 'bg-danger' : 'bg-muted';
  return (
    <ol className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className={cn('mt-[7px] h-1 w-1 shrink-0 rounded-full', dot)} aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function DiagnosisCard({ current }: { current: Inference | null }) {
  if (!current) {
    return (
      <Card className="flex h-full flex-col">
        <CardHeader title="Live Diagnosis" subtitle="Awaiting first inference from the device" />
        <CardBody className="flex flex-1 items-center justify-center py-12">
          <div className="text-center">
            <Sprout className="mx-auto h-8 w-8 text-muted" strokeWidth={1.25} />
            <p className="mt-2 text-xs text-muted">
              Run a preset vector or connect a board to produce a verdict.
            </p>
          </div>
        </CardBody>
      </Card>
    );
  }

  const label = current.scores[current.topIndex]?.label ?? 'Healthy';
  const info = getCropClass(label);
  const passes = current.topScore >= DEVICE_INFO.threshold;

  /**
   * Below threshold the model's top class is not a finding — it is the
   * least-wrong option among three. Emitting "Action required" on a 58%
   * reading would tell a grower to spray for late blight on evidence the
   * firmware itself rejects, so a sub-threshold frame gets a neutral,
   * muted treatment and suppresses the agronomy panels entirely.
   */
  const style = passes
    ? SEVERITY_STYLE[info.severity]
    : {
        chip: 'border-line/80 bg-elevated text-muted',
        meter: 'muted' as const,
        icon: HelpCircle,
      };
  const SeverityIcon = style.icon;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader
        title="Live Diagnosis"
        subtitle={`Inference ${formatStamp(current.timestamp)} · ${current.source === 'serial' ? 'UART' : 'simulated'}`}
        actions={
          <span className="rounded-md border border-line/70 bg-elevated px-1.5 py-0.5 font-mono text-2xs text-muted">
            {info.crop}
          </span>
        }
      />

      <CardBody className="flex flex-1 flex-col gap-3.5">
        {/* Verdict — the single most important thing on this surface. */}
        <div className="flex flex-wrap items-start justify-between gap-x-5 gap-y-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.75} />
              <h3 className="text-2xl font-semibold uppercase leading-tight tracking-tight text-ink">
                {passes ? info.title : 'Inconclusive'}
              </h3>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              {passes
                ? info.summary
                : `Top class "${label}" scored ${(current.topScore * 100).toFixed(1)}%, under the ${DEVICE_INFO.threshold.toFixed(2)} decision threshold. No treatment guidance is emitted for a sub-threshold frame.`}
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-2xs font-semibold',
                  style.chip,
                )}
              >
                <SeverityIcon className="h-3 w-3" strokeWidth={2.25} />
                {passes ? SEVERITY_LABEL[info.severity] : 'Below threshold'}
              </span>
              <span className="rounded-full border border-line/70 bg-elevated px-2 py-0.5 font-mono text-2xs text-muted">
                {info.crop}
              </span>
              <span className="font-mono text-2xs text-muted">{info.pathogen}</span>
            </div>

            <p className="mt-3 font-mono text-2xs text-muted">
              threshold {DEVICE_INFO.threshold.toFixed(2)} ·{' '}
              {passes ? 'classification accepted' : 'below threshold — treat as inconclusive'}
            </p>
          </div>

          <ConfidenceRing
            value={current.topScore}
            tone={style.meter}
            label="Confidence"
            caption={current.transport === 'json' ? 'JSON frame' : `${current.transport} parse`}
          />
        </div>

        {/* Agronomy is withheld entirely below threshold — see the note above. */}
        {passes ? (
          <Accordion className="mt-auto space-y-1.5" defaultOpen={['plan']}>
            <AccordionItem value="plan" title="Disease overview & action plan">
              <p>{info.overview}</p>
              <p className="mono-label mt-3">Immediate steps</p>
              <div className="mt-1.5">
                <List items={info.actionPlan} tone={style.meter} />
              </div>
            </AccordionItem>

            <AccordionItem value="organic" title="Organic & cultural controls">
              <List items={info.organicControls} tone="ok" />
            </AccordionItem>

            <AccordionItem value="chemical" title="Chemical controls">
              <List items={info.chemicalControls} tone="warn" />
              <p className="mt-2.5 border-t border-line/60 pt-2 text-2xs text-muted">
                Verify registration, pre-harvest interval and maximum residue limits for your crop and
                region before any application. Rates shown are typical label ranges, not a prescription.
              </p>
            </AccordionItem>

            <AccordionItem value="alerts" title="Operational alerts">
              <List items={info.alerts} tone={style.meter} />
            </AccordionItem>
          </Accordion>
        ) : (
          <p className="mt-auto border-t border-line/60 pt-3 text-2xs leading-relaxed text-muted">
            Treatment guidance is withheld until a frame clears the{' '}
            {DEVICE_INFO.threshold.toFixed(2)} threshold. Recapture the canopy with better lighting
            or closer standoff, then re-run the inference.
          </p>
        )}
      </CardBody>
    </Card>
  );
}