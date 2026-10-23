/**
 * Parser for the STM32 DATA line protocol.
 *
 * Only lines beginning with "DATA," are processed here. Every other line is
 * passed through to the existing UART console parser untouched.
 *
 * Format (11 comma-separated fields after the "DATA" prefix):
 *   DATA,<ms>,<temp_c>,<humidity_pct>,<soil_pct>,<class>,<confidence_pct>,<status>,<early_risk>,<late_risk>,<water>
 *
 * Malformed rows (wrong field count, non-numeric where numeric expected) are
 * silently discarded — parseDataLine returns null instead of throwing.
 */

import type { BlightClass, DataRow, DetectionStatus, RiskLevel, WaterAdvice } from '@/types/data-row';
import { computeAlertLevel } from '@/lib/alert-engine';

/** Returns true when the raw line is a machine-readable DATA line. */
export function isDataLine(raw: string): boolean {
  return raw.trimStart().startsWith('DATA,');
}

const VALID_CLASSES = new Set<string>(['healthy', 'early', 'late', 'unknown']);
const VALID_STATUSES = new Set<string>(['confirmed', 'checking']);
const VALID_WATERS = new Set<string>(['water_now', 'enough', 'too_wet']);
const VALID_RISKS = new Set<number>([0, 1, 2]);

/** Parse a decimal number from a string, returning null on failure. */
function parseNum(s: string): number | null {
  const n = Number(s.trim());
  return Number.isFinite(n) ? n : null;
}

/** Parse an integer (digits only, no decimals) from a string. */
function parseInt10(s: string): number | null {
  const trimmed = s.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  const n = parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parses one DATA line and returns a DataRow, or null if the line is malformed.
 *
 * NA temperature/humidity values are normalised to null (chart gap).
 * The timestamp is always the PC wall clock (Date.now()), never device ms.
 */
export function parseDataLine(raw: string): DataRow | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith('DATA,')) return null;

  const parts = trimmed.split(',');
  // Expect exactly 11 fields: DATA + 10 values
  if (parts.length !== 11) return null;

  const [, msStr, tempStr, humStr, soilStr, cls, confStr, statusStr, earlyStr, lateStr, waterStr] =
    parts as [string, string, string, string, string, string, string, string, string, string, string];

  // ms: device uptime — must be a non-negative integer
  const deviceMs = parseInt10(msStr);
  if (deviceMs === null || deviceMs < 0) return null;

  // temp_c: decimal or "NA"
  let tempC: number | null = null;
  if (tempStr.trim() !== 'NA') {
    tempC = parseNum(tempStr);
    if (tempC === null) return null;
  }

  // humidity_pct: decimal or "NA"
  let humidityPct: number | null = null;
  if (humStr.trim() !== 'NA') {
    humidityPct = parseNum(humStr);
    if (humidityPct === null) return null;
  }

  // soil_pct: integer 0–100
  const soilPct = parseInt10(soilStr);
  if (soilPct === null || soilPct < 0 || soilPct > 100) return null;

  // class: one of the known BlightClass values (case-insensitive)
  const classCleaned = cls.trim().toLowerCase();
  if (!VALID_CLASSES.has(classCleaned)) return null;

  // confidence_pct: integer 0–100
  const confidencePct = parseInt10(confStr);
  if (confidencePct === null || confidencePct < 0 || confidencePct > 100) return null;

  // status: confirmed | checking
  const statusCleaned = statusStr.trim().toLowerCase();
  if (!VALID_STATUSES.has(statusCleaned)) return null;

  // early_risk, late_risk: 0, 1, or 2
  const earlyRisk = parseInt10(earlyStr);
  const lateRisk = parseInt10(lateStr);
  if (earlyRisk === null || !VALID_RISKS.has(earlyRisk)) return null;
  if (lateRisk === null || !VALID_RISKS.has(lateRisk)) return null;

  // water: one of the valid advice strings (case-insensitive)
  const waterCleaned = waterStr.trim().toLowerCase();
  if (!VALID_WATERS.has(waterCleaned)) return null;

  const row: DataRow = {
    timestamp: Date.now(),
    deviceMs,
    tempC,
    humidityPct,
    soilPct,
    class: classCleaned as BlightClass,
    confidencePct,
    status: statusCleaned as DetectionStatus,
    earlyRisk: earlyRisk as RiskLevel,
    lateRisk: lateRisk as RiskLevel,
    water: waterCleaned as WaterAdvice,
    alertLevel: 'GREEN', // computed below
  };
  row.alertLevel = computeAlertLevel(row);
  return row;
}
