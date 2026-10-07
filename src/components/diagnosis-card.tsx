import {
  AlertTriangle,
  Bug,
  CheckCircle2,
  HelpCircle,
  Sprout,
  TriangleAlert,
  Zap,
} from 'lucide-react';
import { ConfidenceRing } from '@/components/confidence-ring';
import { Accordion, AccordionItem } from '@/components/ui/accordion';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { SEVERITY_LABEL } from '@/components/ui/stat';
import { getCropClass, inferCategory, normaliseLabel } from '@/data/classes';
import { DEVICE_INFO } from '@/data/device';
import { formatStamp } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { DiseaseCategory, Inference } from '@/types/telemetry';

/* ------------------------------------------------------------------ */
/* Dynamic colour mapping by disease category                          */
/* ------------------------------------------------------------------ */

/**
 * Colour scheme per disease category.
 *   healthy   → Emerald Green  (#10B981)
 *   fungal    → Crimson Red    (#EF4444)
 *   bacterial → Violet         (#8B5CF6)
 *   viral     → Amber          (#F59E0B)
 */
const CATEGORY_STYLE: Record<
  DiseaseCategory,
  {
    /** CSS colour for the accent badge (inline style). */
    bg: string;
    text: string;
    border: string;
    /** Token-based TW class for the confidence ring. */
    ringTone: 'ok' | 'warn' | 'danger' | 'muted';
    icon: typeof CheckCircle2;
    categoryLabel: string;
  }
> = {
  healthy: {
    bg: 'rgba(16,185,129,0.12)',
    text: '#10B981',
    border: 'rgba(16,185,129,0.35)',
    ringTone: 'ok',
    icon: CheckCircle2,
    categoryLabel: 'Healthy',
  },
  fungal: {
    bg: 'rgba(239,68,68,0.12)',
    text: '#EF4444',
    border: 'rgba(239,68,68,0.35)',
    ringTone: 'danger',
    icon: TriangleAlert,
    categoryLabel: 'Fungal',
  },
  bacterial: {
    bg: 'rgba(139,92,246,0.12)',
    text: '#8B5CF6',
    border: 'rgba(139,92,246,0.35)',
    ringTone: 'warn',
    icon: Bug,
    categoryLabel: 'Bacterial',
  },
  viral: {
    bg: 'rgba(245,158,11,0.12)',
    text: '#F59E0B',
    border: 'rgba(245,158,11,0.35)',
    ringTone: 'warn',
    icon: Zap,
    categoryLabel: 'Viral',
  },
};

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

const SEVERITY_STYLE = {
  healthy: { chip: 'border-ok/30 bg-ok/10 text-ok', meter: 'ok' as const, icon: CheckCircle2 },
  watch: { chip: 'border-warn/30 bg-warn/10 text-warn', meter: 'warn' as const, icon: AlertTriangle },
  critical: { chip: 'border-danger/30 bg-danger/10 text-danger', meter: 'danger' as const, icon: TriangleAlert },
};

const DOT: Record<string, string> = {
  ok: 'bg-ok',
  warn: 'bg-warn',
  danger: 'bg-danger',
  muted: 'bg-muted',
};

/**
 * Treatment steps rendered as bold-lead bullets: the imperative is the scannable
 * part, the rationale trails it. This is why entries are written "STOP — do X"
 * in the data layer rather than as flat sentences.
 */
function List({ items, tone }: { items: string[]; tone: 'ok' | 'warn' | 'danger' | 'muted' }) {
  if (!items.length) return <p className="text-2xs text-muted">No entries for this class.</p>;
  return (
    <ol className="space-y-2">
      {items.map((item, i) => {
        // Split on the first em dash: bold lead, muted tail.
        const m = /^([^—]+?)\s*—\s*(.+)$/.exec(item);
        return (
          <li key={i} className="flex gap-2.5">
            <span
              className={cn('mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full', DOT[tone])}
              aria-hidden
            />
            <span className="leading-relaxed">
              {m ? (
                <>
                  <strong className="font-semibold text-ink">{m[1]}</strong>
                  <span className="text-muted"> — {m[2]}</span>
                </>
              ) : (
                <span className="text-muted">{item}</span>
              )}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------ */
/* Disease category badge (dynamic colour)                             */
/* ------------------------------------------------------------------ */

function CategoryBadge({ category }: { category: DiseaseCategory }) {
  const cat = CATEGORY_STYLE[category];
  const Icon = cat.icon;
  return (
    <span
      className="pressable inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-2xs font-bold"
      style={{
        backgroundColor: cat.bg,
        borderColor: cat.border,
        color: cat.text,
      }}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
      {cat.categoryLabel}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Main card                                                           */
/* ------------------------------------------------------------------ */

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
  const category = inferCategory(label);
  const catStyle = CATEGORY_STYLE[category];
  const displayLabel = normaliseLabel(label);

  /**
   * Below threshold the model's top class is not a finding — it is the
   * least-wrong option. Emitting "Action required" on a 58%
   * reading would tell a grower to spray on evidence the
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

      <CardBody className="flex flex-1 flex-col gap-4">
        {/* Verdict — the single most important thing on this surface. */}
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-5">
          <div className="min-w-0 flex-1">
            <span className="mono-label">Primary diagnosis</span>
            <h3
              className="mt-1.5 font-display text-[26px] font-extrabold uppercase leading-[1.1] tracking-tight"
              style={{ color: passes ? catStyle.text : undefined }}
            >
              {passes ? displayLabel : 'Inconclusive'}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted">
              {passes
                ? info.summary
                : `Top class "${displayLabel}" scored ${(current.topScore * 100).toFixed(1)}%, under the ${DEVICE_INFO.threshold.toFixed(2)} decision threshold. No treatment guidance is emitted for a sub-threshold frame.`}
            </p>

            {/* Badge tags — dynamic colour by disease category. */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {passes ? (
                <CategoryBadge category={category} />
              ) : (
                <span
                  className={cn(
                    'pressable inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-2xs font-bold',
                    style.chip,
                  )}
                >
                  <SeverityIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
                  Below threshold
                </span>
              )}

              {passes && (
                <span
                  className={cn(
                    'pressable inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-2xs font-bold',
                    style.chip,
                  )}
                >
                  <SeverityIcon className="h-3.5 w-3.5" strokeWidth={2.25} />
                  {SEVERITY_LABEL[info.severity]}
                </span>
              )}

              <span className="pressable inline-flex items-center rounded-full border border-line/70 bg-elevated px-3 py-1 text-2xs font-semibold text-ink">
                {info.crop}
              </span>
              <span className="pressable inline-flex items-center rounded-full border border-brand/25 bg-brand/8 px-3 py-1 text-2xs font-semibold text-brand">
                {info.pathogen}
              </span>
            </div>

            <p className="mt-3 font-mono text-2xs text-muted">
              threshold {DEVICE_INFO.threshold.toFixed(2)} ·{' '}
              {passes ? 'classification accepted' : 'below threshold — treat as inconclusive'}
            </p>
          </div>

          <ConfidenceRing
            value={current.topScore}
            tone={passes ? catStyle.ringTone : 'muted'}
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

            <AccordionItem value="remediation" title="Remediation & treatment plan">
              <div className="space-y-3">
                <div>
                  <p className="mono-label">Disease type</p>
                  <p className="mt-1 text-sm text-ink font-medium" style={{ color: catStyle.text }}>
                    {catStyle.categoryLabel} {category !== 'healthy' ? 'pathogen' : ''} — {info.pathogen}
                  </p>
                </div>
                <div>
                  <p className="mono-label">Immediate treatment</p>
                  <div className="mt-1.5">
                    <List items={info.chemicalControls} tone="warn" />
                  </div>
                </div>
                <div>
                  <p className="mono-label">Prevention</p>
                  <div className="mt-1.5">
                    <List items={info.organicControls} tone="ok" />
                  </div>
                </div>
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