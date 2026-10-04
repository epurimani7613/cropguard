import type { ClassScore, LogLevel } from '@/types/telemetry';

/**
 * Dual-mode firmware output parsing.
 *
 * Mode 1 — JSON stream. The firmware may emit one self-describing object per
 * inference, which is the only format that carries timings and a full score
 * set atomically:
 *
 *   {"class":"Healthy","confidence":0.948,"dsp_time":3,"nn_time":11}
 *   {"class":"Healthy","confidence":0.948,"dsp_time":3,"nn_time":11,
 *    "scores":{"Healthy":0.948,"Early_Blight":0.052}}
 *
 * Mode 2 — raw log lines. Everything else is matched against the Edge Impulse
 * console grammar:
 *
 *   [DSP] timing: 3ms
 *   [NN] timing: 11ms
 *   Predictions: Healthy: 0.9482, Blight: 0.0518
 *   [DSP] Signal length: 9216
 *   [INFO] run_classifier() completed in 14ms
 *   [PREDICTION] Class: Healthy (0.9482)
 *
 * Anything unrecognised still becomes an INFO log line, so no device output is
 * ever dropped.
 */

const KNOWN_LEVELS: LogLevel[] = [
  'INFO',
  'DSP',
  'NN',
  'PREDICTION',
  'SENSOR',
  'WARN',
  'ERROR',
  'SYS',
];

/** A complete or partial inference contribution from one line. */
export interface FrameUpdate {
  /** Full score set, when the line carried one. */
  scores?: ClassScore[];
  topLabel?: string;
  topScore?: number;
  dspMs?: number;
  nnMs?: number;
  source: 'json' | 'log';
}

export interface ParsedLine {
  level: LogLevel;
  message: string;
  /** True when the line was a structured JSON frame, not free text. */
  isJson: boolean;
}

/* ------------------------------------------------------------------ */
/* Mode 1: JSON                                                        */
/* ------------------------------------------------------------------ */

interface JsonFrame {
  class?: string;
  confidence?: number;
  dsp_time?: number;
  nn_time?: number;
  scores?: Record<string, number>;
}

/**
 * `tryParseJson` returns null for anything that is not a JSON object with at
 * least a class and a confidence — including text that merely starts with `{`.
 */
export function tryParseJson(line: string): { frame: JsonFrame; update: FrameUpdate } | null {
  const trimmed = line.trim();
  if (!trimmed.startsWith('{') || !trimmed.endsWith('}')) return null;

  let obj: unknown;
  try {
    obj = JSON.parse(trimmed);
  } catch {
    return null;
  }
  if (typeof obj !== 'object' || obj === null) return null;

  const raw = obj as Record<string, unknown>;
  const cls = typeof raw.class === 'string' ? raw.class : undefined;
  const confidence =
    typeof raw.confidence === 'number'
      ? raw.confidence
      : typeof raw.score === 'number'
        ? (raw.score as number)
        : undefined;

  // Require the identifying pair; anything else is just JSON noise on the wire.
  if (!cls || confidence === undefined || !Number.isFinite(confidence)) return null;

  const frame: JsonFrame = {
    class: cls,
    confidence,
    dsp_time: typeof raw.dsp_time === 'number' ? raw.dsp_time : undefined,
    nn_time: typeof raw.nn_time === 'number' ? raw.nn_time : undefined,
    scores:
      typeof raw.scores === 'object' && raw.scores !== null
        ? (raw.scores as Record<string, number>)
        : undefined,
  };

  let scores: ClassScore[] | undefined;
  if (frame.scores) {
    scores = Object.entries(frame.scores)
      .filter(([, v]) => typeof v === 'number' && Number.isFinite(v))
      .map(([label, score]) => ({ label, score }));
    if (!scores.length) scores = undefined;
  }

  return {
    frame,
    update: {
      scores,
      topLabel: frame.class,
      topScore: frame.confidence,
      dspMs: frame.dsp_time,
      nnMs: frame.nn_time,
      source: 'json',
    },
  };
}

/**
 * A JSON frame usually carries only the winning class. Distribute the residual
 * probability across the other known labels so the breakdown chart stays
 * honest about summing to 1 instead of showing a lone 94.8%.
 */
export function expandScores(topLabel: string, topScore: number, otherLabels: string[]): ClassScore[] {
  const rest = Math.max(0, 1 - topScore);
  const others = otherLabels.filter((l) => l !== topLabel);

  // Weight the tail slightly toward the classes that are not the winner, so a
  // 94.8% verdict doesn't render as three identical slivers.
  const weights = others.map((_, i) => 1 / (i + 1.4));
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  const tail = others.map((label, i) => ({
    label,
    score: totalWeight > 0 ? (rest * weights[i]) / totalWeight : 0,
  }));

  return [{ label: topLabel, score: topScore }, ...tail];
}

/* ------------------------------------------------------------------ */
/* Mode 2: raw log lines                                               */
/* ------------------------------------------------------------------ */

const PREFIX = /^\s*\[([A-Z]+)\]\s*(.*)$/;

export function parseSerialLine(raw: string): ParsedLine {
  const line = raw.trim();
  const prefixMatch = PREFIX.exec(line);
  const levelRaw = prefixMatch?.[1];
  const level: LogLevel = KNOWN_LEVELS.includes(levelRaw as LogLevel)
    ? (levelRaw as LogLevel)
    : 'INFO';
  const message = (prefixMatch?.[2] ?? line).trim();
  return { level, message, isJson: false };
}

/**
 * Extracts whatever inference signal a single raw line carries. Returns null
 * for lines that are pure logging noise.
 */
export function extractUpdate(line: string): FrameUpdate | null {
  const json = tryParseJson(line);
  if (json) return json.update;

  const { level, message } = parseSerialLine(line);
  const out: Partial<FrameUpdate> = { source: 'log' };
  let sawSignal = false;

  // [DSP] timing: 3ms   /   [INFO] completed in 14ms
  const timingMatch = /timing\s*[:=]\s*([\d.]+)\s*ms|completed in\s*([\d.]+)\s*ms/i.exec(message);
  if (timingMatch) {
    const value = Number(timingMatch[1] ?? timingMatch[2]);
    if (Number.isFinite(value)) {
      if (level === 'NN') out.nnMs = value;
      else out.dspMs = value;
      sawSignal = true;
    }
  }

  // Predictions: Healthy: 0.9482, Blight: 0.0518
  const predictions = extractScores(message);
  if (predictions && predictions.length > 1) {
    out.scores = predictions;
    const top = topOf(predictions);
    out.topLabel = top.label;
    out.topScore = top.score;
    return out as FrameUpdate;
  }

  // [PREDICTION] Class: Healthy (0.9482)
  const classMatch = /Class:\s*([A-Za-z_][\w ]*?)\s*(?:\(|$)/.exec(message);
  const probMatch = /\((0?\.\d+|1\.0+)\)/.exec(message);
  if (classMatch && probMatch) {
    out.topLabel = classMatch[1].trim();
    out.topScore = Number(probMatch[1]);
    return out as FrameUpdate;
  }

  // A lone label with no score still tells us which class the head picked.
  if (classMatch && level === 'PREDICTION') {
    out.topLabel = classMatch[1].trim();
    return out as FrameUpdate;
  }

  // Timings alone are signal — the frame assembler pairs them with the scores
  // that arrive on a later line, so returning null here would drop them.
  return sawSignal ? (out as FrameUpdate) : null;
}

/** Picks the highest score. Ties resolve to the earlier entry. */
export function topOf(scores: ClassScore[]): { label: string; score: number; index: number } {
  let best = { label: scores[0]?.label ?? 'Healthy', score: 0, index: 0 };
  scores.forEach((s, i) => {
    if (s.score > best.score) best = { label: s.label, score: s.score, index: i };
  });
  return best;
}

/**
 * Accepts both score-block shapes the firmware may emit:
 *   scores: {early_blight: 0.91, healthy: 0.06}
 *   Predictions: Healthy: 0.9482, Late_Blight: 0.0040
 */
export function extractScores(message: string): ClassScore[] | null {
  const braced = /\{([^}]*)\}/.exec(message);
  const body = braced?.[1] ?? message;
  const pairs = body.matchAll(/([A-Za-z][\w]*)\s*[:=]\s*(0?\.\d+|1\.0+)/g);
  const scores: ClassScore[] = [];
  for (const m of pairs) {
    // Skip a bare "timing:" key so it is never mistaken for a class label.
    if (/^(timing|confidence|score|dsp_time|nn_time)$/i.test(m[1])) continue;
    scores.push({ label: m[1], score: Number(m[2]) });
  }
  return scores.length ? scores : null;
}