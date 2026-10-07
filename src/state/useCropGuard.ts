import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  ClassScore,
  ConnectionState,
  Inference,
  InputMode,
  LogLevel,
  LogLine,
  PresetId,
  SimMode,
  Telemetry,
  UartCommand,
} from '@/types/telemetry';
import { CLASS_ORDER } from '@/data/classes';
import { DEVICE_INFO } from '@/data/device';
import { TEST_PRESETS } from '@/data/presets';
import { LineSplitter } from '@/lib/line-splitter';
import { expandScores, extractUpdate, parseSerialLine, topOf, type FrameUpdate } from '@/lib/parser';
import { isSerialSupported, readSerialLines, writeSerialLine, type SerialPort } from '@/lib/serial';
import {
  buildJsonFrame,
  buildLogBatch,
  isHiddenTruth,
  makeInference,
  pickNextTruth,
  randomScores,
  resetTelemetry,
  stepTelemetry,
  uid,
  type HiddenTruth,
} from './simulator';

const MAX_LOG_LINES = 600;
const HISTORY_LIMIT = 120;
/** Simulated frames are paced to the brief's 2-second cadence. */
const SIM_INTERVAL_MS = 2000;

/** Firmware commands offered in the console's test-command row. */
export const UART_COMMANDS: { label: string; command: string; hint: string }[] = [
  { label: 'Ping', command: 'ping', hint: 'Expect a [SYS] pong back' },
  { label: 'Run once', command: 'run_once', hint: 'Force a single inference' },
  { label: 'Stream on', command: 'stream on', hint: 'Begin continuous capture' },
  { label: 'Stream off', command: 'stream off', hint: 'Halt continuous capture' },
  { label: 'Status', command: 'status', hint: 'Report uptime, heap, frame rate' },
];

function makeLog(level: LogLevel, message: string): LogLine {
  return { id: uid('log'), timestamp: new Date(), level, message };
}

function describeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'unknown error';
}

export function useCropGuard() {
  const [logs, setLogs] = useState<LogLine[]>(() => [
    makeLog('SYS', `Edge Impulse runtime: ${DEVICE_INFO.runtime}`),
    makeLog('SYS', `Labels: ${CLASS_ORDER.join(', ')} (threshold ${DEVICE_INFO.threshold})`),
    makeLog('SYS', 'No device attached — simulator available from the control panel.'),
  ]);
  const [history, setHistory] = useState<Inference[]>([]);
  const [telemetry, setTelemetry] = useState<Telemetry>(() => resetTelemetry('Healthy'));
  const [state, setState] = useState<ConnectionState>(() =>
    isSerialSupported() ? 'disconnected' : 'unsupported',
  );
  const [inputMode, setInputMode] = useState<InputMode>('camera');
  const [paused, setPaused] = useState(false);
  const [frameRate, setFrameRate] = useState(10);
  const [presetId, setPresetId] = useState<PresetId>('healthy');
  const [simMode, setSimMode] = useState<SimMode>('off');
  const [uartLog, setUartLog] = useState<UartCommand[]>([]);

  /**
   * The result of the most recent explicit preset trigger. Kept separate from
   * `history` so the live stream cannot overwrite it and make the PASS/FAIL
   * check report a false failure.
   */
  const [lastRun, setLastRun] = useState<Inference | null>(null);

  const truthRef = useRef<HiddenTruth>('Healthy');
  const portRef = useRef<SerialPort | null>(null);
  const splitterRef = useRef(new LineSplitter());
  /** Scores accumulate across lines and commit when a frame completes. */
  const pendingRef = useRef<{ scores: Map<string, number>; dspMs?: number; nnMs?: number }>({
    scores: new Map(),
  });
  // Read inside callbacks without making them dependencies.
  const loadRef = useRef(telemetry.cpuLoadPct);
  loadRef.current = telemetry.cpuLoadPct;

  const pushLogs = useCallback((batch: LogLine[] | LogLine) => {
    setLogs((prev) => {
      const incoming = Array.isArray(batch) ? batch : [batch];
      const next = prev.concat(incoming);
      return next.length > MAX_LOG_LINES ? next.slice(next.length - MAX_LOG_LINES) : next;
    });
  }, []);

  const pushInference = useCallback((inf: Inference) => {
    setHistory((prev) => {
      const next = [...prev, inf];
      return next.length > HISTORY_LIMIT ? next.slice(next.length - HISTORY_LIMIT) : next;
    });
  }, []);

  /* ---------------------------------------------------------------- */
  /* Frame assembly                                                    */
  /* ---------------------------------------------------------------- */
  /**
   * Commits an inference from whatever the parser has accumulated. A frame is
   * ready when the model's full label set has arrived, or when a single line
   * names a winner (the terse JSON case).
   */
  const commitFrame = useCallback(
    (update: FrameUpdate) => {
      const pending = pendingRef.current;

      if (update.dspMs !== undefined) pending.dspMs = update.dspMs;
      if (update.nnMs !== undefined) pending.nnMs = update.nnMs;
      if (update.scores?.length) {
        for (const s of update.scores) pending.scores.set(s.label, s.score);
      }

      // Dynamic class handling: commit when we have a winner or a
      // sufficient score set. With a retrained model the label count may
      // differ from CLASS_ORDER, so we don't require a full match.
      const haveFullSet = CLASS_ORDER.every((l) => pending.scores.has(l));
      const havePartialSet = pending.scores.size >= 3;
      const hasWinner = update.topLabel !== undefined;
      if (!haveFullSet && !havePartialSet && !hasWinner) return;

      let scores: ClassScore[];

      if (haveFullSet || havePartialSet) {
        // Build scores from everything the device reported.
        const seen = [...pending.scores.entries()];
        scores = seen.map(([label, score]) => ({ label, score }));
        // Ensure all CLASS_ORDER labels are present even if the device
        // only sent a subset.
        for (const l of CLASS_ORDER) {
          if (!scores.some((s) => s.label === l)) scores.push({ label: l, score: 0 });
        }
      } else {
        const label = update.topLabel as string;
        // The winner may be a label outside the deployed set (after a retrain),
        // so build the tail from every label seen this cycle.
        const seen = [...pending.scores.keys()];
        scores = expandScores(label, update.topScore ?? 0, seen.length ? seen : [...CLASS_ORDER]);
        for (const l of CLASS_ORDER) {
          if (!scores.some((s) => s.label === l)) scores.push({ label: l, score: 0 });
        }
      }

      pending.scores.clear();

      const inf = makeInference(scores, frameRate, loadRef.current, 'serial', update.source);
      if (pending.dspMs !== undefined) inf.timing.dspMs = pending.dspMs;
      if (pending.nnMs !== undefined) {
        // Firmware reports total NN time; the interpreter excludes DSP.
        inf.timing.nnMs =
          pending.dspMs !== undefined
            ? Math.max(0.1, pending.nnMs - pending.dspMs)
            : pending.nnMs;
      }
      pending.dspMs = undefined;
      pending.nnMs = undefined;

      pushInference(inf);
    },
    [frameRate, pushInference],
  );

  /** Handles one complete line from the device or the simulator. */
  const handleLine = useCallback(
    (raw: string) => {
      const parsed = parseSerialLine(raw);
      pushLogs([makeLog(parsed.level, parsed.message)]);

      const update = extractUpdate(raw);
      if (update) commitFrame(update);
    },
    [commitFrame, pushLogs],
  );

  /* ---------------------------------------------------------------- */
  /* Simulator                                                         */
  /* ---------------------------------------------------------------- */
  /**
   * Emits one simulated frame as a real JSON wire frame, pushed through the
   * same parser the serial path uses — so the simulation genuinely exercises
   * Mode 1 parsing instead of bypassing it.
   */
  const emitSimFrame = useCallback(
    (truth?: HiddenTruth) => {
      const t = truth ?? pickNextTruth(truthRef.current);
      if (truth) truthRef.current = truth;

      setTelemetry((prev) => {
        const next = stepTelemetry(prev, t);
        const draft = makeInference(randomScores(t), frameRate, next.cpuLoadPct, 'simulated', 'json');

        // Round-trip through the exact JSON the firmware would send.
        const line = buildJsonFrame(draft);
        pushLogs([makeLog('SYS', line)]);

        const update = extractUpdate(line);
        if (update) {
          const inf = makeInference(
            update.scores ?? draft.scores,
            frameRate,
            next.cpuLoadPct,
            'simulated',
            'json',
          );
          if (update.dspMs !== undefined) inf.timing.dspMs = update.dspMs;
          if (update.nnMs !== undefined) inf.timing.nnMs = update.nnMs;
          pushInference(inf);
        }
        return next;
      });
    },
    [frameRate, pushInference, pushLogs],
  );

  useEffect(() => {
    if (simMode === 'off') return;
    if (state === 'connected' || paused) return;

    const SIM_TRUTH_MAP: Partial<Record<typeof simMode, HiddenTruth>> = {
      healthy: 'Healthy',
      'late-blight': 'Late_Blight',
      'target-spot': 'Tomato_Target_Spot',
      'bacterial-spot': 'Tomato_Bacterial_Spot',
    };
    const truth: HiddenTruth | undefined = SIM_TRUTH_MAP[simMode];

    const id = window.setInterval(() => emitSimFrame(truth), SIM_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [simMode, state, paused, emitSimFrame]);

  /* ---------------------------------------------------------------- */
  /* Web Serial                                                        */
  /* ---------------------------------------------------------------- */
  const connect = useCallback(async () => {
    const serial = navigator.serial;
    if (!serial) {
      pushLogs([makeLog('ERROR', 'Web Serial unavailable — use Chrome or Edge over https/localhost.')]);
      return;
    }
    try {
      setState('connecting');
      pushLogs([makeLog('SYS', 'requestPort() — pick the STM32 USB-UART device in the browser dialog.')]);

      const port = await serial.requestPort({ filters: [] });
      await port.open({ baudRate: 115200, dataBits: 8, stopBits: 1, parity: 'none', bufferSize: 4096 });
      portRef.current = port;
      splitterRef.current.reset();
      pendingRef.current.scores.clear();
      setState('connected');

      const info = port.getInfo();
      pushLogs([
        makeLog(
          'SYS',
          `Port opened @ 115200 8N1 · VID 0x${(info.usbVendorId ?? 0).toString(16).padStart(4, '0')} PID 0x${(info.usbProductId ?? 0).toString(16).padStart(4, '0')}`,
        ),
        makeLog('INFO', 'Accepting JSON frames and Edge Impulse log lines.'),
      ]);

      await readSerialLines(
        port,
        (chunk) => {
          for (const line of splitterRef.current.push(chunk)) handleLine(line);
        },
        (err) => {
          const trailing = splitterRef.current.flush();
          if (trailing) handleLine(trailing);
          pushLogs([makeLog('ERROR', `Serial stream ended: ${describeError(err)}`)]);
          portRef.current = null;
          setState('disconnected');
        },
      );
    } catch (err) {
      setState('disconnected');
      const msg = describeError(err);
      pushLogs([
        msg.toLowerCase().includes('cancel')
          ? makeLog('SYS', 'Port selection cancelled.')
          : makeLog('ERROR', `Connect failed: ${msg}`),
      ]);
    }
  }, [handleLine, pushLogs]);

  const disconnect = useCallback(async () => {
    const port = portRef.current;
    portRef.current = null;
    setState('disconnected');
    if (port) {
      try {
        await port.close();
      } catch {
        /* already gone */
      }
    }
    splitterRef.current.reset();
    pendingRef.current.scores.clear();
    pushLogs([makeLog('SYS', 'Port closed.')]);
  }, [pushLogs]);

  useEffect(() => {
    const serial = navigator.serial;
    if (!serial) return;

    const onConnect = () => {
      pushLogs([makeLog('SYS', 'USB device attached — re-attaching.')]);
      void connect();
    };
    const onDisconnect = () => {
      pushLogs([makeLog('WARN', 'USB device removed — link lost.')]);
      portRef.current = null;
      setState('disconnected');
    };

    serial.addEventListener('connect', onConnect);
    serial.addEventListener('disconnect', onDisconnect);
    return () => {
      serial.removeEventListener('connect', onConnect);
      serial.removeEventListener('disconnect', onDisconnect);
    };
  }, [connect, pushLogs]);

  /* ---------------------------------------------------------------- */
  /* UART writes                                                       */
  /* ---------------------------------------------------------------- */
  const sendCommand = useCallback(
    async (command: string) => {
      const port = portRef.current;
      if (!port || state !== 'connected') {
        pushLogs([makeLog('ERROR', `Cannot send "${command}" — no device connected.`)]);
        return;
      }

      const entry: UartCommand = { id: uid('cmd'), command, status: 'sending' };
      setUartLog((prev) => [entry, ...prev].slice(0, 8));
      pushLogs([makeLog('SYS', `>>> ${command}`)]);

      const ok = await writeSerialLine(port, command, (err) => {
        setUartLog((prev) =>
          prev.map((c) => (c.id === entry.id ? { ...c, status: 'failed', detail: describeError(err) } : c)),
        );
        pushLogs([makeLog('ERROR', `UART write failed: ${describeError(err)}`)]);
      });

      setUartLog((prev) =>
        prev.map((c) => (c.id === entry.id ? { ...c, status: ok ? 'sent' : 'failed' } : c)),
      );
      if (ok) pushLogs([makeLog('SYS', `<<< ${command} sent @ 115200`)]);
    },
    [state, pushLogs],
  );

  /* ---------------------------------------------------------------- */
  /* Console + presets                                                 */
  /* ---------------------------------------------------------------- */
  const clearLogs = useCallback(() => setLogs([]), []);

  const runPreset = useCallback(
    (id: PresetId = presetId) => {
      const preset = TEST_PRESETS.find((p) => p.id === id) ?? TEST_PRESETS[0];
      const merged = { ...telemetry, ...preset.telemetry };

      const inf = makeInference(preset.scores, frameRate, telemetry.cpuLoadPct, 'simulated', 'json');
      inf.timing.dspMs = Number((1.6 + Math.random() * 0.8).toFixed(2));
      inf.timing.nnMs = Number((9.8 + Math.random() * 3).toFixed(2));

      if (isHiddenTruth(preset.expectedLabel)) truthRef.current = preset.expectedLabel;
      setTelemetry(merged);
      setInputMode('static-vector');

      const top = topOf(inf.scores);
      const pass = top.label === preset.expectedLabel;

      pushLogs([
        makeLog('SYS', `--- TRIGGER_SINGLE_INFERENCE(preset=${preset.id}) ---`),
        makeLog('SYS', buildJsonFrame(inf)),
        ...buildLogBatch(inf, merged).map((b) => makeLog(b.level, b.message)),
        makeLog('SYS', `Expected ${preset.expectedLabel} → ${pass ? 'PASS' : 'FAIL'} @ ${top.label}`),
      ]);
      pushInference(inf);
      setLastRun(inf);
    },
    [frameRate, presetId, telemetry, pushInference, pushLogs],
  );

  const exportLogs = useCallback(
    (format: 'csv' | 'json') => {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

      const content =
        format === 'json'
          ? JSON.stringify(
              {
                device: DEVICE_INFO,
                exportedAt: new Date().toISOString(),
                inferences: history.map((i) => ({
                  timestamp: i.timestamp.toISOString(),
                  source: i.source,
                  transport: i.transport,
                  topClass: i.scores[i.topIndex]?.label,
                  topScore: Number(i.topScore.toFixed(4)),
                  scores: Object.fromEntries(i.scores.map((s) => [s.label, Number(s.score.toFixed(4))])),
                  timingMs: i.timing,
                })),
                console: logs.map((l) => ({
                  timestamp: l.timestamp.toISOString(),
                  level: l.level,
                  message: l.message,
                })),
              },
              null,
              2,
            )
          : [
              'timestamp,level,message',
              ...logs.map((l) =>
                [l.timestamp.toISOString(), l.level, `"${l.message.replace(/"/g, '""')}"`].join(','),
              ),
            ].join('\n');

      const blob = new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cropguard-session-${stamp}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      pushLogs([makeLog('SYS', `Session exported → cropguard-session-${stamp}.${format}`)]);
    },
    [history, logs, pushLogs],
  );

  /* ---------------------------------------------------------------- */
  /* Derived                                                           */
  /* ---------------------------------------------------------------- */
  const current = history.at(-1) ?? null;

  const derived = useMemo(() => {
    const inf = current;
    const totalMs = (inf?.timing.dspMs ?? 0) + (inf?.timing.nnMs ?? 0);
    const budgetMs = frameRate > 0 ? 1000 / frameRate : 0;
    return {
      dspMs: inf?.timing.dspMs ?? 0,
      nnMs: inf?.timing.nnMs ?? 0,
      totalMs,
      budgetMs,
      budgetPct: budgetMs > 0 ? (totalMs / budgetMs) * 100 : 0,
      heapPct: (telemetry.heapUsedBytes / telemetry.heapCapacityBytes) * 100,
      paused,
    };
  }, [current, frameRate, telemetry.heapCapacityBytes, telemetry.heapUsedBytes, paused]);

  return {
    logs,
    history,
    telemetry,
    state,
    inputMode,
    paused,
    frameRate,
    presetId,
    simMode,
    uartLog,
    current,
    lastRun,
    derived,
    actions: {
      connect,
      disconnect,
      sendCommand,
      setInputMode,
      setPaused,
      setFrameRate,
      setSimMode,
      // Changing the preset invalidates the previous run's verdict.
      setPresetId: (id: PresetId) => {
        setPresetId(id);
        setLastRun(null);
      },
      runPreset,
      clearLogs,
      exportLogs,
    },
  };
}