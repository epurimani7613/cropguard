import { CheckCircle2, FlaskConical, Play, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { SelectField } from '@/components/ui/select';
import { SwitchRow } from '@/components/ui/switch';
import { DEVICE_INFO } from '@/data/device';
import { TEST_PRESETS } from '@/data/presets';
import { formatMs } from '@/lib/format';
import { cn } from '@/lib/utils';
import type { Inference, InputMode, PresetId, SimMode } from '@/types/telemetry';

/** The three quick-start simulation buttons from the brief. */
const SIM_BUTTONS: { mode: SimMode; label: string; hint: string }[] = [
  { mode: 'healthy', label: 'Simulate Healthy Leaf', hint: 'Stream confident Healthy frames' },
  { mode: 'late-blight', label: 'Simulate Late Blight', hint: 'Stream critical Late_Blight frames' },
  { mode: 'random', label: 'Simulate Random', hint: 'Drift across all classes' },
];

export function SimulationPanel({
  presetId,
  onPresetChange,
  onRun,
  lastTrigger,
  frameRate,
  onFrameRate,
  inputMode,
  onInputMode,
  disabled,
  simMode,
  onSimMode,
  simBlocked,
}: {
  presetId: PresetId;
  onPresetChange: (id: PresetId) => void;
  onRun: (id: PresetId) => void;
  lastTrigger: Inference | null;
  frameRate: number;
  onFrameRate: (n: number) => void;
  inputMode: InputMode;
  onInputMode: (m: InputMode) => void;
  disabled: boolean;
  simMode: SimMode;
  onSimMode: (m: SimMode) => void;
  simBlocked: boolean;
}) {
  const preset = TEST_PRESETS.find((p) => p.id === presetId) ?? TEST_PRESETS[0];
  const topLabel = lastTrigger?.scores[lastTrigger.topIndex]?.label ?? null;
  const match = lastTrigger ? topLabel === preset.expectedLabel : null;

  return (
    <Card>
      <CardHeader
        title="Simulation & Test Vectors"
        subtitle="Exercise the dashboard with synthetic frames when hardware is unplugged"
        icon={<FlaskConical className="h-3.5 w-3.5" strokeWidth={1.75} />}
      />
      <CardBody className="space-y-3.5">
        <div>
          <SwitchRow
            checked={simMode !== 'off'}
            onCheckedChange={(v) => onSimMode(v ? 'healthy' : 'off')}
            label="Simulation mode"
            hint="Streams JSON frames every 2 s"
          />
          {simBlocked ? (
            <p className="mt-1 text-2xs leading-snug text-warn">
              A device is connected, so live hardware takes priority. Disconnect to simulate.
            </p>
          ) : null}

          <div className="mt-2 grid grid-cols-1 gap-1.5">
            {SIM_BUTTONS.map((b) => {
              const active = simMode === b.mode;
              return (
                <button
                  key={b.mode}
                  type="button"
                  onClick={() => onSimMode(active ? 'off' : b.mode)}
                  disabled={simBlocked}
                  aria-pressed={active}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left transition-colors disabled:opacity-40',
                    active ? 'border-info/50 bg-info/10' : 'border-line bg-surface hover:bg-elevated',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-ink">{b.label}</span>
                    <span className="block truncate text-2xs text-muted">{b.hint}</span>
                  </span>
                  <span
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      active ? 'animate-pulse bg-info' : 'bg-line',
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <div className="hairline" />

        <div>
          <label className="mono-label mb-1.5 block" htmlFor="preset-select">
            Test vector preset
          </label>
          <SelectField
            label="Preset vector"
            value={presetId}
            onValueChange={(v) => onPresetChange(v as PresetId)}
            options={TEST_PRESETS.map((p) => ({ value: p.id, label: p.name, hint: p.hint }))}
          />
          <p className="mt-1.5 text-2xs leading-snug text-muted">{preset.hint}</p>
        </div>

        <Button
          variant="primary"
          size="lg"
          className="w-full"
          onClick={() => onRun(presetId)}
          disabled={disabled}
        >
          <Play className="h-3.5 w-3.5" strokeWidth={2} />
          Trigger single inference
        </Button>

        {/* Last run verdict against the preset's expected label. */}
        <div
          className={cn(
            'flex items-start gap-2 rounded-lg border px-2.5 py-2',
            match === null
              ? 'border-line/70 bg-elevated/50'
              : match
                ? 'border-ok/40 bg-ok/10'
                : 'border-danger/40 bg-danger/10',
          )}
          aria-live="polite"
        >
          {match === null ? (
            <FlaskConical className="mt-[1px] h-3.5 w-3.5 shrink-0 text-muted" strokeWidth={1.75} />
          ) : match ? (
            <CheckCircle2 className="mt-[1px] h-3.5 w-3.5 shrink-0 text-ok" strokeWidth={1.75} />
          ) : (
            <XCircle className="mt-[1px] h-3.5 w-3.5 shrink-0 text-danger" strokeWidth={1.75} />
          )}
          <div className="min-w-0 text-2xs leading-relaxed">
            {lastTrigger && match !== null ? (
              <>
                <p className="text-ink">
                  Expected <span className="font-mono">{preset.expectedLabel}</span> → got{' '}
                  <span className="font-mono">{topLabel}</span> at{' '}
                  {(lastTrigger.topScore * 100).toFixed(2)}% —{' '}
                  <span className={match ? 'text-ok' : 'text-danger'}>{match ? 'PASS' : 'FAIL'}</span>
                </p>
                <p className="mt-0.5 font-mono text-muted">
                  DSP {formatMs(lastTrigger.timing.dspMs, 2)} · NN {formatMs(lastTrigger.timing.nnMs, 2)} · total{' '}
                  {formatMs(lastTrigger.timing.dspMs + lastTrigger.timing.nnMs, 2)}
                </p>
              </>
            ) : (
              <p className="text-muted">
                Trigger the preset to check it against the expected class. Threshold{' '}
                {DEVICE_INFO.threshold.toFixed(2)}.
              </p>
            )}
          </div>
        </div>

        <div className="hairline" />

        <div>
          <label className="mono-label mb-1.5 block" htmlFor="framerate">
            Capture rate — {frameRate} FPS
          </label>
          <input
            id="framerate"
            type="range"
            min={1}
            max={30}
            step={1}
            value={frameRate}
            onChange={(e) => onFrameRate(Number(e.target.value))}
            disabled={disabled || inputMode === 'static-vector'}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line/70 accent-[rgb(var(--cg-info))] disabled:opacity-40"
          />
          <div className="mt-1 flex justify-between font-mono text-2xs text-muted">
            <span>1 FPS</span>
            <span>30 FPS</span>
          </div>
          <p className="mt-1.5 text-2xs leading-snug text-muted">
            Frame budget {(1000 / frameRate).toFixed(0)} ms. The classifier needs ~15 ms, so 10 FPS is
            the practical ceiling on this part.
          </p>
        </div>

        <SwitchRow
          checked={inputMode === 'camera'}
          onCheckedChange={(v) => onInputMode(v ? 'camera' : 'static-vector')}
          label="Static feature vector mode"
          hint="Disable the live stream and trigger inferences manually"
        />
      </CardBody>
    </Card>
  );
}