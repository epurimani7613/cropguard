/**
 * useDataStream — React state hook for the STM32 DATA line pipeline.
 *
 * Responsibilities:
 *  - Parse incoming raw lines through the DATA parser.
 *  - Maintain a ring-buffer of up to MAX_DATA_ROWS rows.
 *  - Persist rows to localStorage (wrapped in try/catch).
 *  - Compute the current alert level and fire audio/notification side-effects.
 *  - Maintain an alert log (last MAX_ALERT_LOG entries).
 *  - Provide a CSV export helper.
 *  - Provide a simulate-data function for testing without hardware.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { AlertLevel, AlertLogEntry, DataRow } from '@/types/data-row';
import { MAX_ALERT_LOG, MAX_DATA_ROWS } from '@/types/data-row';
import { parseDataLine } from '@/lib/data-parser';
import { alertReason, shouldTriggerAlert } from '@/lib/alert-engine';
import { playAlert } from '@/lib/audio';

const STORAGE_KEY = 'cropguard-data-rows-v1';

// ── localStorage helpers ───────────────────────────────────────────────────

function loadStoredRows(): DataRow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DataRow[];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(-MAX_DATA_ROWS);
  } catch {
    return [];
  }
}

function saveRows(rows: DataRow[]): void {
  try {
    const slice = rows.slice(-MAX_DATA_ROWS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slice));
  } catch {
    /* quota exceeded — ignore */
  }
}

let alertIdCounter = 0;
function newAlertId(): string {
  alertIdCounter += 1;
  return `alert-${alertIdCounter}-${Date.now().toString(36)}`;
}

// ── Simulate data lines ────────────────────────────────────────────────────

/**
 * Sample DATA lines for manual testing (Feature 4 & 5).
 * Covers: healthy, confirmed early blight, confirmed late blight, NA reading, malformed.
 */
export const SIMULATE_LINES: { label: string; line: string }[] = [
  {
    label: 'Healthy (checking)',
    line: `DATA,12000,24.1,62.0,45,healthy,88,checking,0,0,enough`,
  },
  {
    label: 'Early blight confirmed',
    line: `DATA,24000,27.5,82.3,52,early,91,confirmed,1,0,enough`,
  },
  {
    label: 'Late blight confirmed (RED)',
    line: `DATA,36000,18.9,93.1,60,late,87,confirmed,0,2,too_wet`,
  },
  {
    label: 'NA sensor reading',
    line: `DATA,48000,NA,NA,38,healthy,72,checking,0,0,enough`,
  },
  {
    label: 'High weather risk (AMBER)',
    line: `DATA,60000,25.0,78.0,55,healthy,65,checking,2,0,water_now`,
  },
  {
    label: 'Too wet (AMBER)',
    line: `DATA,72000,26.2,75.0,88,healthy,71,checking,0,0,too_wet`,
  },
  {
    label: 'Malformed (ignored)',
    line: `DATA,bad,data,here`,
  },
];

// ── Hook ──────────────────────────────────────────────────────────────────

export interface UseDataStreamReturn {
  /** All stored data rows, oldest-first. */
  rows: DataRow[];
  /** The most recent parsed row, or null. */
  latest: DataRow | null;
  /** Current alert level based on latest row. */
  alertLevel: AlertLevel;
  /** Human-readable reason for the current alert. */
  alertReason: string;
  /** Whether an unacknowledged alert banner is visible. */
  bannerVisible: boolean;
  /** Dismiss the alert banner. */
  dismissBanner: () => void;
  /** Log of last MAX_ALERT_LOG alert events. */
  alertLog: AlertLogEntry[];
  /** Process a raw serial line through the DATA parser. */
  handleRawLine: (raw: string) => DataRow | null;
  /** Feed a raw DATA line string directly (for testing). */
  simulateLine: (line: string) => DataRow | null;
  /** Clear all stored rows (with a confirmation guard in the component). */
  clearHistory: () => void;
  /** Export all rows as a CSV blob download. */
  exportCsv: () => void;
}

export function useDataStream(): UseDataStreamReturn {
  const [rows, setRows] = useState<DataRow[]>(() => loadStoredRows());
  const [alertLog, setAlertLog] = useState<AlertLogEntry[]>([]);
  const [bannerVisible, setBannerVisible] = useState(false);

  // Track previous alert state for edge-triggered sound/banner.
  const prevLevelRef = useRef<AlertLevel>('GREEN');
  const prevConfirmedClassRef = useRef<string | null>(null);

  // Throttle: don't write localStorage more than once per second.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSaveRef = useRef<DataRow[]>([]);

  const scheduleSave = useCallback((newRows: DataRow[]) => {
    pendingSaveRef.current = newRows;
    if (!saveTimerRef.current) {
      saveTimerRef.current = setTimeout(() => {
        saveRows(pendingSaveRef.current);
        saveTimerRef.current = null;
      }, 1000);
    }
  }, []);

  // Save on unmount to avoid losing the last batch
  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveRows(pendingSaveRef.current);
      }
    };
  }, []);

  const pushRow = useCallback(
    (row: DataRow): void => {
      setRows((prev) => {
        const next = prev.length >= MAX_DATA_ROWS ? [...prev.slice(1), row] : [...prev, row];
        scheduleSave(next);
        return next;
      });

      // Alert side-effects
      const currentLevel = row.alertLevel;
      const currentConfirmedClass =
        row.status === 'confirmed' && row.class !== 'healthy' && row.class !== 'unknown'
          ? row.class
          : null;

      if (
        shouldTriggerAlert(
          prevLevelRef.current,
          currentLevel,
          prevConfirmedClassRef.current,
          currentConfirmedClass,
        )
      ) {
        if (currentLevel !== 'GREEN') {
          const reason = alertReason(row);

          // Sound
          try {
            playAlert(currentLevel as 'AMBER' | 'RED');
          } catch {
            /* graceful degradation */
          }

          // Banner
          setBannerVisible(true);

          // Alert log
          const entry: AlertLogEntry = {
            id: newAlertId(),
            timestamp: Date.now(),
            level: currentLevel,
            reason,
          };
          setAlertLog((prev) => {
            const next = [entry, ...prev];
            return next.length > MAX_ALERT_LOG ? next.slice(0, MAX_ALERT_LOG) : next;
          });
        }
      }

      // Reset banner when level returns to GREEN
      if (currentLevel === 'GREEN' && prevLevelRef.current !== 'GREEN') {
        setBannerVisible(false);
      }

      prevLevelRef.current = currentLevel;
      prevConfirmedClassRef.current = currentConfirmedClass;
    },
    [scheduleSave],
  );

  const handleRawLine = useCallback(
    (raw: string): DataRow | null => {
      const row = parseDataLine(raw);
      if (row) pushRow(row);
      return row;
    },
    [pushRow],
  );

  const simulateLine = useCallback(
    (line: string): DataRow | null => handleRawLine(line),
    [handleRawLine],
  );

  const dismissBanner = useCallback(() => setBannerVisible(false), []);

  const clearHistory = useCallback(() => {
    setRows([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    prevLevelRef.current = 'GREEN';
    prevConfirmedClassRef.current = null;
    setBannerVisible(false);
  }, []);

  const exportCsv = useCallback(() => {
    const header =
      'timestamp_iso,device_ms,temp_c,humidity_pct,soil_pct,class,confidence_pct,status,early_risk,late_risk,water,alert_level';

    function escapeCell(v: string | number | null | undefined): string {
      if (v === null || v === undefined || v === '') return '';
      const s = String(v);
      // Escape double-quotes by doubling them; wrap in quotes if needed.
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    }

    const csvRows = rows.map((r) =>
      [
        new Date(r.timestamp).toISOString(),
        r.deviceMs,
        r.tempC ?? '',
        r.humidityPct ?? '',
        r.soilPct,
        r.class,
        r.confidencePct,
        r.status,
        r.earlyRisk,
        r.lateRisk,
        r.water,
        r.alertLevel,
      ]
        .map(escapeCell)
        .join(','),
    );

    const content = [header, ...csvRows].join('\n');
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;

    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate(),
    ).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(
      now.getMinutes(),
    ).padStart(2, '0')}-${String(now.getSeconds()).padStart(2, '0')}`;
    a.download = `crop_health_${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [rows]);

  const latest = rows.length > 0 ? rows[rows.length - 1] : null;
  const currentAlertLevel = latest?.alertLevel ?? 'GREEN';

  return {
    rows,
    latest,
    alertLevel: currentAlertLevel,
    alertReason: latest ? alertReason(latest) : 'All clear',
    bannerVisible,
    dismissBanner,
    alertLog,
    handleRawLine,
    simulateLine,
    clearHistory,
    exportCsv,
  };
}
