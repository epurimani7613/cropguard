import type { ClassScore, Inference, LogLevel, Telemetry } from '@/types/telemetry';
import { CLASS_ORDER } from '@/data/classes';
import { BASE_TELEMETRY } from '@/data/device';
import { topOf } from '@/lib/parser';

let counter = 0;
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter.toString(36)}-${Math.floor(performance.now() * 1000)}`;
}

function clamp(v: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, v));
}

function randn(): number {
  // Box–Muller; one output is enough here.
  const u = Math.max(Math.random(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random());
}

function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/** The condition the canopy is currently "truly" in — the simulator drifts toward it. */
export type HiddenTruth = (typeof CLASS_ORDER)[number];

export function isHiddenTruth(v: string): v is HiddenTruth {
  return (CLASS_ORDER as readonly string[]).includes(v);
}

/**
 * Logit bonus for the true class, so the top prediction is usually correct.
 *
 * Kept modest on purpose: the Edge Impulse threshold is 0.60, and a very high
 * clarity would make every simulated frame land far above it. Real captures of
 * a borderline canopy do produce sub-threshold readings, so the simulator must
 * be able to reproduce that state for the UI's inconclusive path to be
 * exercised at all.
 */
const CLARITY = 1.5;
/** Chance per frame that the truth flips — a new observation event. */
const DRIFT_RATE = 0.012;

export function randomScores(truth: HiddenTruth): ClassScore[] {
  const logits = CLASS_ORDER.map((label) => (label === truth ? CLARITY : randn() * 0.9));
  const probs = softmax(logits);
  return CLASS_ORDER.map((label, i) => ({ label, score: probs[i] }));
}

/** Frame timings for an STM32F411 at 100 MHz running a 96×96 EON int8 classifier. */
export function syntheticTiming(frameRate: number, loadPct: number) {
  const loadFactor = 0.75 + (loadPct / 100) * 0.9;
  return {
    dspMs: Math.max(0.4, 3.1 * loadFactor + randn() * 0.35),
    nnMs: Math.max(0.8, 11.2 * loadFactor + randn() * 1.1),
    frameMs: 1000 / frameRate,
  };
}

export function makeInference(
  scores: ClassScore[],
  frameRate: number,
  loadPct: number,
  source: Inference['source'],
  transport: Inference['transport'] = 'simulated',
): Inference {
  // Normalise into declared label order so the UI never depends on score order.
  const ordered = CLASS_ORDER.map((label) => scores.find((s) => s.label === label) ?? { label, score: 0 });
  const top = topOf(ordered);
  return {
    id: uid('inf'),
    timestamp: new Date(),
    scores: ordered,
    topIndex: top.index,
    topScore: top.score,
    timing: syntheticTiming(frameRate, loadPct),
    source,
    transport,
  };
}

/** Mean-reverting drift: correlated, bounded, and settles instead of jittering. */
function drift(current: number, target: number, theta: number, sigma: number, lo: number, hi: number) {
  return clamp(current + theta * (target - current) + sigma * randn(), lo, hi);
}

export function stepTelemetry(prev: Telemetry, truth: HiddenTruth): Telemetry {
  const humidityTarget = { Early_Blight: 79, Healthy: 62, Late_Blight: 90 }[truth];
  const tempTarget = { Early_Blight: 27, Healthy: 26, Late_Blight: 19 }[truth];
  const wetTarget = { Early_Blight: 55, Healthy: 24, Late_Blight: 86 }[truth];

  return {
    ...prev,
    humidityPct: Math.round(drift(prev.humidityPct, humidityTarget, 0.22, 1.4, 22, 98) * 10) / 10,
    temperatureC: Math.round(drift(prev.temperatureC, tempTarget, 0.2, 0.16, 12, 38) * 100) / 100,
    leafWetnessPct: Math.round(drift(prev.leafWetnessPct, wetTarget, 0.26, 2.1, 0, 100) * 10) / 10,
    cpuLoadPct: Math.round(drift(prev.cpuLoadPct, 34, 0.3, 2.6, 6, 88) * 10) / 10,
    heapUsedBytes: Math.round(
      drift(prev.heapUsedBytes, 21_840, 0.12, 640, 8_000, BASE_TELEMETRY.heapCapacityBytes),
    ),
    uptimeS: prev.uptimeS + 1,
  };
}

export function resetTelemetry(truth: HiddenTruth): Telemetry {
  return stepTelemetry({ ...BASE_TELEMETRY }, truth);
}

export function pickNextTruth(current: HiddenTruth): HiddenTruth {
  if (Math.random() > DRIFT_RATE) return current;
  const idx = CLASS_ORDER.indexOf(current);
  const offset = 1 + Math.floor(Math.random() * (CLASS_ORDER.length - 1));
  return CLASS_ORDER[(idx + offset) % CLASS_ORDER.length];
}

/* ------------------------------------------------------------------ */
/* Firmware-style console output                                       */
/* ------------------------------------------------------------------ */

/**
 * Emits the exact JSON frame the firmware would send, so the simulator
 * exercises the same code path as a real board (Mode 1 parsing).
 *
 *   {"class":"Healthy","confidence":0.948,"dsp_time":3,"nn_time":11,
 *    "scores":{"Early_Blight":0.052,"Healthy":0.948,"Late_Blight":0.000}}
 */
export function buildJsonFrame(inf: Inference): string {
  const scores = Object.fromEntries(inf.scores.map((s) => [s.label, Number(s.score.toFixed(4))]));
  return JSON.stringify({
    class: inf.scores[inf.topIndex]?.label ?? 'Healthy',
    confidence: Number(inf.topScore.toFixed(4)),
    dsp_time: Number(inf.timing.dspMs.toFixed(1)),
    nn_time: Number(inf.timing.nnMs.toFixed(1)),
    scores,
  });
}

const OVERFLOW_PCT = ['0.0', '0.0', '0.3', '1.2'];

export function buildLogBatch(inf: Inference, telemetry: Telemetry): { level: LogLevel; message: string }[] {
  const { dspMs, nnMs } = inf.timing;
  const heapPct = ((telemetry.heapUsedBytes / telemetry.heapCapacityBytes) * 100).toFixed(1);
  const overflow = OVERFLOW_PCT[Math.floor(Math.random() * OVERFLOW_PCT.length)];

  const batch: { level: LogLevel; message: string }[] = [
    { level: 'DSP', message: 'Signal length: 9216' },
    { level: 'DSP', message: `squash 96x96 · RGB → int8 · overflow ${overflow}%` },
    { level: 'NN', message: `EON int8 · arena 123.1 KB / 126.0 KB · heap ${heapPct}%` },
    { level: 'INFO', message: `run_classifier() completed in ${Math.round(dspMs + nnMs)}ms` },
    {
      level: 'SENSOR',
      message: `T=${telemetry.temperatureC.toFixed(1)}C RH=${telemetry.humidityPct.toFixed(0)}% LEAF=${telemetry.leafWetnessPct.toFixed(0)}% addr=0x40 ok`,
    },
  ];

  for (const s of inf.scores) {
    batch.push({ level: 'PREDICTION', message: `Class: ${s.label} (${s.score.toFixed(4)})` });
  }

  if (telemetry.leafWetnessPct > 70) {
    batch.push({ level: 'WARN', message: `leaf wetness ${telemetry.leafWetnessPct.toFixed(0)}% — infection window open` });
  }
  if (telemetry.cpuLoadPct > 72) {
    batch.push({ level: 'WARN', message: `CPU load ${telemetry.cpuLoadPct.toFixed(0)}% — frame budget at risk` });
  }

  return batch;
}