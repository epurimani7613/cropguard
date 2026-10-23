/**
 * Types for the STM32 DATA line protocol.
 *
 * Format: DATA,<ms>,<temp_c>,<humidity_pct>,<soil_pct>,<class>,<confidence_pct>,<status>,<early_risk>,<late_risk>,<water>
 *
 * Only lines starting with "DATA," are machine-readable; all other lines are
 * human-readable console output and are ignored by the DATA parser (but still
 * passed to the existing parser for the UART console display).
 */

export type BlightClass = 'healthy' | 'early' | 'late' | 'unknown';
export type DetectionStatus = 'confirmed' | 'checking';
export type RiskLevel = 0 | 1 | 2; // 0=low, 1=medium, 2=high
export type WaterAdvice = 'water_now' | 'enough' | 'too_wet';
export type AlertLevel = 'GREEN' | 'AMBER' | 'RED';

export interface DataRow {
  /** PC wall-clock timestamp (Date.now()), not the device uptime. */
  timestamp: number;
  /** Device uptime in ms (from the DATA line). */
  deviceMs: number;
  /** Temperature in °C, or null for NA. */
  tempC: number | null;
  /** Relative humidity %, or null for NA. */
  humidityPct: number | null;
  /** Soil moisture 0–100 %. */
  soilPct: number;
  /** Disease class detected. */
  class: BlightClass;
  /** Model confidence 0–100. */
  confidencePct: number;
  /** Whether the current reading is confirmed (3 consecutive) or still checking. */
  status: DetectionStatus;
  /** Early blight weather risk (0=low, 1=medium, 2=high). */
  earlyRisk: RiskLevel;
  /** Late blight weather risk (0=low, 1=medium, 2=high). */
  lateRisk: RiskLevel;
  /** Watering recommendation. */
  water: WaterAdvice;
  /** Computed alert level for this row. */
  alertLevel: AlertLevel;
}

export interface AlertLogEntry {
  id: string;
  timestamp: number;
  level: AlertLevel;
  reason: string;
}

/** Maximum DATA rows to keep in memory and localStorage. */
export const MAX_DATA_ROWS = 5000;
/** Maximum alert log entries to keep. */
export const MAX_ALERT_LOG = 20;
