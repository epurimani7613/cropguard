/**
 * React state hook for TinyML plant disease detection.
 *
 * Manages the detection history, latest result, status, and demo mode.
 * When a real backend is wired up, call `pushDetection()` with validated
 * payloads — everything else is derived automatically.
 */

import { useCallback, useMemo, useState } from 'react';
import type { DiseaseDetection, DiseaseDetectionPayload, DetectionStatus } from '@/types/disease-detection';
import { DISEASE_DETECTION_CONFIG } from '@/types/disease-detection';
import {
  validateAndNormalise,
  computeDetectionStatus,
  generateDemoDetections,
} from '@/lib/disease-detection-service';
import type { ConnectionState } from '@/types/telemetry';

export interface UseDiseaseDetectionReturn {
  /** Most recent detection (or null). */
  latest: DiseaseDetection | null;
  /** Full history, newest first. */
  history: DiseaseDetection[];
  /** Computed status for UI state rendering. */
  status: DetectionStatus;
  /** Whether the dashboard is showing demo data. */
  isDemoMode: boolean;
  /** Push a validated detection into state. */
  pushDetection: (detection: DiseaseDetection) => void;
  /** Ingest a raw payload from hardware/backend. Returns the validated record or null. */
  ingestPayload: (payload: DiseaseDetectionPayload) => DiseaseDetection | null;
  /** Toggle demo mode on/off. */
  setDemoMode: (enabled: boolean) => void;
  /** Clear all history. */
  clearHistory: () => void;
}

export function useDiseaseDetection(connectionState: ConnectionState): UseDiseaseDetectionReturn {
  const [history, setHistory] = useState<DiseaseDetection[]>([]);
  const [demoMode, setDemoModeState] = useState(false);

  // Demo data is computed once and cached.
  const demoDetections = useMemo(() => generateDemoDetections(), []);

  const effectiveHistory = useMemo(() => {
    if (demoMode && history.length === 0) return demoDetections;
    return history;
  }, [demoMode, history, demoDetections]);

  const latest = effectiveHistory.length > 0 ? effectiveHistory[0] : null;

  const isDeviceOnline = connectionState === 'connected';

  const status = useMemo(
    () => computeDetectionStatus(latest, isDeviceOnline),
    [latest, isDeviceOnline],
  );

  const pushDetection = useCallback((detection: DiseaseDetection) => {
    setHistory((prev) => {
      const next = [detection, ...prev];
      return next.length > DISEASE_DETECTION_CONFIG.MAX_HISTORY
        ? next.slice(0, DISEASE_DETECTION_CONFIG.MAX_HISTORY)
        : next;
    });
  }, []);

  const ingestPayload = useCallback(
    (payload: DiseaseDetectionPayload): DiseaseDetection | null => {
      const detection = validateAndNormalise(payload, 'hardware');
      if (detection) pushDetection(detection);
      return detection;
    },
    [pushDetection],
  );

  const setDemoMode = useCallback((enabled: boolean) => {
    setDemoModeState(enabled);
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    latest,
    history: effectiveHistory,
    status,
    isDemoMode: demoMode && history.length === 0,
    pushDetection,
    ingestPayload,
    setDemoMode,
    clearHistory,
  };
}
