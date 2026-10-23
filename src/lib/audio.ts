/**
 * Web Audio API sound alerts.
 *
 * Key design rules:
 *  - AudioContext must be created on the first user gesture (Chrome policy).
 *    Call `initAudio()` from the Connect button click handler.
 *  - Different tone patterns for AMBER (two-tone warning) vs RED (urgent alarm).
 *  - All operations are wrapped in try/catch so a blocked AudioContext never
 *    crashes the rest of the dashboard.
 *  - Mute state is checked before scheduling any oscillators.
 */

let ctx: AudioContext | null = null;
let muted = false;

/** Call once from the first user interaction (e.g. Connect button click). */
export function initAudio(): void {
  try {
    if (!ctx) {
      ctx = new AudioContext();
    } else if (ctx.state === 'suspended') {
      void ctx.resume();
    }
  } catch {
    // AudioContext blocked or unavailable — degrade gracefully
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean): void {
  muted = value;
}

export function toggleMuted(): boolean {
  muted = !muted;
  return muted;
}

/** Play an oscillator tone. */
function tone(
  audioCtx: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
  gain = 0.25,
): void {
  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime + startOffset);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime + startOffset);
    gainNode.gain.linearRampToValueAtTime(gain, audioCtx.currentTime + startOffset + 0.02);
    gainNode.gain.setValueAtTime(gain, audioCtx.currentTime + startOffset + duration - 0.04);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + startOffset + duration);

    osc.start(audioCtx.currentTime + startOffset);
    osc.stop(audioCtx.currentTime + startOffset + duration + 0.01);
  } catch {
    /* ignore — audio context may be closed */
  }
}

/**
 * AMBER alert: two-tone warning beep (lower urgency).
 * Pattern: 660 Hz for 0.18 s, pause, 880 Hz for 0.18 s.
 */
export function playAmberAlert(): void {
  if (muted || !ctx) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    tone(ctx, 660, 0, 0.18);
    tone(ctx, 880, 0.26, 0.18);
  } catch {
    /* graceful degradation */
  }
}

/**
 * RED alert: urgent repeating alarm (higher urgency).
 * Pattern: 1100 Hz × 3 pulses with short gaps.
 */
export function playRedAlert(): void {
  if (muted || !ctx) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume();
    tone(ctx, 1100, 0.00, 0.15, 0.3);
    tone(ctx, 1200, 0.22, 0.15, 0.3);
    tone(ctx, 1100, 0.44, 0.15, 0.3);
    tone(ctx, 1300, 0.64, 0.20, 0.35);
  } catch {
    /* graceful degradation */
  }
}

/** Play the appropriate sound for a given alert level. */
export function playAlert(level: 'AMBER' | 'RED'): void {
  if (level === 'RED') playRedAlert();
  else playAmberAlert();
}
