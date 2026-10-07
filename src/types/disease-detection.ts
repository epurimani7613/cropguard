/**
 * Disease detection types — the contract between hardware and dashboard.
 *
 * The TinyML model runs on the ESP32 / edge device. The dashboard only
 * *consumes* the detection result; it never performs inference itself.
 *
 * The payload schema is intentionally loose: fields are optional so the
 * frontend degrades gracefully when hardware sends a partial report or
 * a future model revision adds/removes fields.
 */

/* ------------------------------------------------------------------ */
/* Detection payload from hardware                                     */
/* ------------------------------------------------------------------ */

/**
 * Raw payload received from the backend / hardware.
 *
 * This mirrors what the ESP32 will POST to Supabase or push over MQTT/WS.
 * Keep this in sync with your firmware output — the dashboard validates
 * every field before rendering, so missing or extra keys are safe.
 */
export interface DiseaseDetectionPayload {
  /** Which crop the detection applies to, e.g. "Tomato", "Potato". */
  crop?: string;
  /** Disease class label emitted by the TinyML model, e.g. "Early Blight". */
  disease?: string;
  /**
   * Model confidence, 0–1 float.
   * Values > 1 are treated as percentages and normalised to 0–1.
   */
  confidence?: number;
  /** ISO-8601 timestamp of the detection on the device. */
  timestamp?: string;
  /** Inference engine identifier, e.g. "TinyML". */
  model?: string;
  /** Firmware model version string, e.g. "v1.0". */
  model_version?: string;
  /** Hardware device identifier, e.g. "AGRIMIND-ESP32-01". */
  device_id?: string;
  /** Optional severity reported by the hardware. NOT invented by the dashboard. */
  severity?: string;
}

/* ------------------------------------------------------------------ */
/* Validated detection record used in the UI                           */
/* ------------------------------------------------------------------ */

export type DetectionStatus =
  | 'detection-available'
  | 'waiting-for-hardware'
  | 'no-recent-detection'
  | 'hardware-offline';

export interface DiseaseDetection {
  /** Unique ID for React keys and history deduplication. */
  id: string;
  /** Crop name, e.g. "Tomato". Falls back to "Unknown" if absent. */
  crop: string;
  /** Disease class, e.g. "Early Blight" or "Healthy". */
  disease: string;
  /** Confidence 0–1. */
  confidence: number;
  /** When the detection happened on the device. */
  timestamp: Date;
  /** Inference engine / runtime label. */
  model: string;
  /** Model version string or null when not provided by hardware. */
  modelVersion: string | null;
  /** Hardware device identifier. */
  deviceId: string;
  /** Severity label from hardware, or null if not provided. */
  severity: string | null;
  /** Whether this detection is real hardware data or demo/simulation data. */
  source: 'hardware' | 'demo';
}

/* ------------------------------------------------------------------ */
/* Configuration                                                       */
/* ------------------------------------------------------------------ */

/**
 * Configurable thresholds — not hard-coded in the UI components.
 * Change these when you retrain the model or alter your firmware's
 * confidence reporting.
 */
export const DISEASE_DETECTION_CONFIG = {
  /**
   * Below this confidence (0–1) the detection is considered low-confidence
   * and the UI flags it accordingly instead of presenting it as reliable.
   */
  LOW_CONFIDENCE_THRESHOLD: 0.60,

  /**
   * Detections older than this many seconds are considered stale and the
   * status switches to "no-recent-detection".
   */
  STALE_DETECTION_SECONDS: 600, // 10 minutes

  /**
   * Maximum number of history entries retained in the dashboard state.
   */
  MAX_HISTORY: 50,
} as const;
