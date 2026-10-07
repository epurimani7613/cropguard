/**
 * Disease detection data service.
 *
 * This layer sits between the hardware/backend and the React UI.
 * It validates, normalises, and transforms raw payloads into the
 * `DiseaseDetection` records the components consume.
 *
 * When you wire up the real backend (Supabase realtime, MQTT, REST poll, etc.),
 * call `validateAndNormalise()` on the incoming payload. Everything downstream
 * expects a `DiseaseDetection` — the protocol itself is irrelevant.
 */

import type { DiseaseDetection, DiseaseDetectionPayload, DetectionStatus } from '@/types/disease-detection';
import { DISEASE_DETECTION_CONFIG } from '@/types/disease-detection';

let _counter = 0;
function detectionId(): string {
  _counter += 1;
  return `det-${_counter}-${Date.now().toString(36)}`;
}

/* ------------------------------------------------------------------ */
/* Validation & normalisation                                          */
/* ------------------------------------------------------------------ */

/**
 * Validates a raw payload from the hardware and returns a normalised
 * `DiseaseDetection` record, or `null` if the payload is malformed
 * beyond recovery.
 *
 * Rules:
 *  - `disease` must be a non-empty string.
 *  - `confidence` must be a finite number; values > 1 are treated as
 *    percentages and divided by 100.
 *  - `timestamp` must be a parseable date string; falls back to `now`.
 *  - Everything else falls back to sensible defaults.
 */
export function validateAndNormalise(
  raw: DiseaseDetectionPayload,
  source: DiseaseDetection['source'] = 'hardware',
): DiseaseDetection | null {
  // Disease label is mandatory — without it there is nothing to display.
  const disease = typeof raw.disease === 'string' ? raw.disease.trim() : '';
  if (!disease) return null;

  // Confidence: required, must be finite.
  let confidence = typeof raw.confidence === 'number' ? raw.confidence : NaN;
  if (!Number.isFinite(confidence)) return null;
  // Normalise percentage to 0–1.
  if (confidence > 1) confidence = confidence / 100;
  confidence = Math.max(0, Math.min(1, confidence));

  // Timestamp: best-effort parse, fallback to now.
  let timestamp = new Date();
  if (typeof raw.timestamp === 'string') {
    const parsed = new Date(raw.timestamp);
    if (!isNaN(parsed.getTime())) timestamp = parsed;
  }

  return {
    id: detectionId(),
    crop: typeof raw.crop === 'string' && raw.crop.trim() ? raw.crop.trim() : 'Unknown',
    disease,
    confidence,
    timestamp,
    model: typeof raw.model === 'string' && raw.model.trim() ? raw.model.trim() : 'TinyML',
    modelVersion: typeof raw.model_version === 'string' && raw.model_version.trim() ? raw.model_version.trim() : null,
    deviceId: typeof raw.device_id === 'string' && raw.device_id.trim() ? raw.device_id.trim() : 'Unknown',
    severity: typeof raw.severity === 'string' && raw.severity.trim() ? raw.severity.trim() : null,
    source,
  };
}

/* ------------------------------------------------------------------ */
/* Status computation                                                  */
/* ------------------------------------------------------------------ */

/**
 * Derives the current detection status from the latest detection and
 * the device connection state.
 */
export function computeDetectionStatus(
  latest: DiseaseDetection | null,
  isDeviceOnline: boolean,
): DetectionStatus {
  if (!isDeviceOnline && !latest) return 'hardware-offline';

  if (!latest) {
    return isDeviceOnline ? 'waiting-for-hardware' : 'hardware-offline';
  }

  const ageSeconds = (Date.now() - latest.timestamp.getTime()) / 1000;
  if (ageSeconds > DISEASE_DETECTION_CONFIG.STALE_DETECTION_SECONDS) {
    return isDeviceOnline ? 'no-recent-detection' : 'hardware-offline';
  }

  return 'detection-available';
}

/* ------------------------------------------------------------------ */
/* Time formatting                                                     */
/* ------------------------------------------------------------------ */

/** Human-friendly relative time, e.g. "2 minutes ago", "just now". */
export function formatRelativeTime(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Short clock format for history table rows. */
export function formatDetectionTime(date: Date): string {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  }
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ------------------------------------------------------------------ */
/* Demo / simulation data                                              */
/* ------------------------------------------------------------------ */

/**
 * Generates realistic demo detection records.
 * These are always clearly labelled as `source: 'demo'` so the UI can
 * badge them as "DEMO DATA".
 */
export function generateDemoDetections(): DiseaseDetection[] {
  const now = Date.now();
  const demos: DiseaseDetectionPayload[] = [
    { crop: 'Tomato', disease: 'Healthy', confidence: 0.972, timestamp: new Date(now - 12 * 60_000).toISOString(), model: 'TinyML', model_version: 'v1.0', device_id: 'AGRIMIND-ESP32-01' },
    { crop: 'Tomato', disease: 'Early Blight', confidence: 0.946, timestamp: new Date(now - 82 * 60_000).toISOString(), model: 'TinyML', model_version: 'v1.0', device_id: 'AGRIMIND-ESP32-01' },
    { crop: 'Tomato', disease: 'Healthy', confidence: 0.981, timestamp: new Date(now - 195 * 60_000).toISOString(), model: 'TinyML', model_version: 'v1.0', device_id: 'AGRIMIND-ESP32-01' },
    { crop: 'Tomato', disease: 'Late Blight', confidence: 0.887, timestamp: new Date(now - 340 * 60_000).toISOString(), model: 'TinyML', model_version: 'v1.0', device_id: 'AGRIMIND-ESP32-01' },
    { crop: 'Tomato', disease: 'Healthy', confidence: 0.994, timestamp: new Date(now - 480 * 60_000).toISOString(), model: 'TinyML', model_version: 'v1.0', device_id: 'AGRIMIND-ESP32-01' },
  ];

  return demos
    .map((d) => validateAndNormalise(d, 'demo'))
    .filter((d): d is DiseaseDetection => d !== null);
}
