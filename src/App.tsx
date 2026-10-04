import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Cpu, Info } from 'lucide-react';
import { ConsolePanel } from '@/components/console-panel';
import { DiagnosisCard } from '@/components/diagnosis-card';
import { DeviceStrip, Header } from '@/components/header';
import { ScoreBreakdown, ThroughputTrend } from '@/components/score-breakdown';
import { SimulationPanel } from '@/components/simulation-panel';
import { TelemetryGrid } from '@/components/telemetry-grid';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { SpecRow } from '@/components/ui/stat';
import { CLASS_ORDER } from '@/data/classes';
import { DEVICE_INFO } from '@/data/device';
import { formatBytes } from '@/lib/format';
import { useCropGuard, UART_COMMANDS } from '@/state/useCropGuard';
import { readStoredTheme, storeTheme, type ThemeMode } from '@/lib/theme';

export default function App() {
  const cg = useCropGuard();
  const [theme, setTheme] = useState<ThemeMode>(
    () => readStoredTheme() ?? (document.documentElement.classList.contains('dark') ? 'dark' : 'light'),
  );

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    storeTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(
    () => setTheme((t) => (t === 'dark' ? 'light' : 'dark')),
    [],
  );

  const { derived, telemetry, state, actions } = cg;
  const serialBlocked = state === 'connected' || state === 'connecting';

  return (
    <div className="min-h-screen">
      <Header
        state={state}
        theme={theme}
        onToggleTheme={toggleTheme}
        totalMs={derived.totalMs}
        heapPct={derived.heapPct}
      />

      <main className="mx-auto max-w-[1600px] px-5 pb-10 pt-5">
        {/* Honest notice when no hardware is attached. */}
        {state !== 'connected' ? (
          <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-info/30 bg-info/5 px-3.5 py-2.5">
            <Info className="mt-[1px] h-3.5 w-3.5 shrink-0 text-info" strokeWidth={1.75} />
            <p className="text-2xs leading-relaxed text-muted">
              {state === 'unsupported' ? (
                <>
                  <span className="text-ink">Web Serial is unavailable in this browser.</span> All
                  readings below come from the built-in field simulator. Open this dashboard in Chrome or
                  Edge over <code className="font-mono">localhost</code> or <code className="font-mono">https</code> to attach an
                  STM32F411 board over USB-UART.
                </>
              ) : (
                <>
                  <span className="text-ink">Simulator mode.</span> Telemetry and verdicts are generated
                  locally and are plausible field values, not measurements. Use{' '}
                  <span className="font-mono text-ink">Connect via Web Serial</span> in the console below to
                  attach a real board.
                </>
              )}
            </p>
          </div>
        ) : null}

        {/* Monitor layout: verdict + scores dominate, controls sit in the right rail. */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-7">
            <DiagnosisCard current={cg.current} />
          </div>

          <div className="xl:col-span-5">
            <div className="grid grid-cols-1 gap-4">
              <ScoreBreakdown current={cg.current} />
              <ThroughputTrend history={cg.history} frameRate={cg.frameRate} />
            </div>
          </div>

          <div className="xl:col-span-8">
            <TelemetryGrid
              telemetry={telemetry}
              inputMode={cg.inputMode}
              onInputMode={actions.setInputMode}
              frameRate={cg.frameRate}
              paused={cg.paused}
            />
          </div>

          <div className="xl:col-span-4">
            <div className="grid grid-cols-1 gap-4">
              <SimulationPanel
                presetId={cg.presetId}
                onPresetChange={actions.setPresetId}
                onRun={actions.runPreset}
                lastTrigger={cg.lastRun}
                frameRate={cg.frameRate}
                onFrameRate={actions.setFrameRate}
                inputMode={cg.inputMode}
                onInputMode={actions.setInputMode}
                disabled={serialBlocked}
                simMode={cg.simMode}
                onSimMode={actions.setSimMode}
                simBlocked={state === 'connected'}
              />
              <DeviceSpec />
            </div>
          </div>

          <div className="xl:col-span-12">
            <ConsolePanel
              logs={cg.logs}
              paused={cg.paused}
              onTogglePause={() => actions.setPaused(!cg.paused)}
              onClear={actions.clearLogs}
              onExport={actions.exportLogs}
              state={state}
              onConnect={actions.connect}
              onDisconnect={actions.disconnect}
              commands={UART_COMMANDS}
              onSendCommand={actions.sendCommand}
            />
          </div>
        </div>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line/60 pt-3">
          <DeviceStrip flashBytes={DEVICE_INFO.flashBytes} ramBytes={DEVICE_INFO.ramBytes} />
          <p className="font-mono text-2xs text-muted">
            {CLASS_ORDER.length} classes · {formatBytes(DEVICE_INFO.arenaBytes)} tensor arena ·{' '}
            threshold {DEVICE_INFO.threshold}
          </p>
        </footer>
      </main>
    </div>
  );
}

function DeviceSpec() {
  return (
    <Card>
      <CardHeader
        title="Deployed Model"
        subtitle="Read from the generated Edge Impulse headers"
        icon={<Cpu className="h-3.5 w-3.5" strokeWidth={1.75} />}
      />
      <CardBody className="space-y-3">
        <dl>
          <SpecRow k="Project" v={DEVICE_INFO.projectName} />
          <SpecRow k="Board" v={DEVICE_INFO.board} mono />
          <SpecRow k="Input" v={DEVICE_INFO.inputShape} mono />
          <SpecRow k="Runtime" v={DEVICE_INFO.runtime} />
          <SpecRow k="SDK" v={DEVICE_INFO.sdk} />
          <SpecRow k="Tensor arena" v={`${formatBytes(DEVICE_INFO.arenaBytes)} (126016 B)`} mono />
          <SpecRow k="Flash / SRAM" v={`${formatBytes(DEVICE_INFO.flashBytes)} / ${formatBytes(DEVICE_INFO.ramBytes)}`} mono />
          <SpecRow k="Threshold" v={DEVICE_INFO.threshold.toFixed(2)} mono />
          <SpecRow
            k="Classes"
            v={CLASS_ORDER.map((c) => c.replace(/_/g, ' ')).join(' · ')}
          />
        </dl>

        <div className="hairline" />

        <div>
          <p className="mono-label">Frame budget check</p>
          <p className="mt-1.5 text-2xs leading-relaxed text-muted">
            DSP (~3 ms) plus NN forward (~11 ms) costs roughly 15 ms per frame, so the 100 ms budget at
            10 FPS leaves headroom for sensor I²C traffic and UART logging. Above ~25 FPS the budget
            breaks down on this MCU.
          </p>
        </div>

        <div className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn/5 px-2.5 py-2">
          <AlertTriangle className="mt-[1px] h-3.5 w-3.5 shrink-0 text-warn" strokeWidth={1.75} />
          <p className="text-2xs leading-relaxed text-muted">
            These are class-level predictions only. The model has no segmentation, so lesion extent is
            estimated from confidence, not measured. Confirm any treatment decision with a field
            inspection.
          </p>
        </div>
      </CardBody>
    </Card>
  );
}