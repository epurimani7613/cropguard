/**
 * Alert level computation for incoming DATA rows.
 *
 * Rules (evaluated in priority order, highest wins):
 *   RED   : status === 'confirmed' AND class === 'late'
 *   AMBER : status === 'confirmed' AND class === 'early'
 *           OR early_risk === 2
 *           OR late_risk  === 2
 *           OR water === 'too_wet'
 *   GREEN : everything else
 */

import type { AlertLevel, DataRow } from '@/types/data-row';

/**
 * Returns the alert level for a given data row.
 * Evaluation is pure — no side effects.
 */
export function computeAlertLevel(row: Pick<DataRow, 'class' | 'status' | 'earlyRisk' | 'lateRisk' | 'water'>): AlertLevel {
  // RED: late blight confirmed
  if (row.status === 'confirmed' && row.class === 'late') return 'RED';

  // AMBER: any of the amber conditions
  if (
    (row.status === 'confirmed' && row.class === 'early') ||
    row.earlyRisk === 2 ||
    row.lateRisk === 2 ||
    row.water === 'too_wet'
  ) {
    return 'AMBER';
  }

  return 'GREEN';
}

/** Human-readable reason string for a given alert state. */
export function alertReason(row: Pick<DataRow, 'class' | 'status' | 'earlyRisk' | 'lateRisk' | 'water' | 'confidencePct'>): string {
  if (row.status === 'confirmed' && row.class === 'late') {
    return `Late blight confirmed, ${row.confidencePct}% confidence`;
  }
  if (row.status === 'confirmed' && row.class === 'early') {
    return `Early blight confirmed, ${row.confidencePct}% confidence`;
  }
  if (row.lateRisk === 2) return 'Weather risk high for late blight';
  if (row.earlyRisk === 2) return 'Weather risk high for early blight';
  if (row.water === 'too_wet') return 'Soil is too wet — overwatering risk';
  return 'All clear';
}

/** Returns true when an alert should be announced (new, higher level, or confirmed class changed). */
export function shouldTriggerAlert(
  prevLevel: AlertLevel,
  nextLevel: AlertLevel,
  prevConfirmedClass: string | null,
  nextConfirmedClass: string | null,
): boolean {
  if (nextLevel === 'GREEN') return false;

  const levels: AlertLevel[] = ['GREEN', 'AMBER', 'RED'];
  const prevIdx = levels.indexOf(prevLevel);
  const nextIdx = levels.indexOf(nextLevel);

  // Upward level change
  if (nextIdx > prevIdx) return true;

  // Same non-green level but confirmed class changed
  if (nextConfirmedClass !== prevConfirmedClass) return true;

  return false;
}
