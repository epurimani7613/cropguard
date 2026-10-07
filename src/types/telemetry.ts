export type Severity = 'healthy' | 'watch' | 'critical';
export type AccentVar = 'ok' | 'warn' | 'danger' | 'info';

/**
 * Disease category — drives the dynamic color coding in the verdict card.
 *
 *   healthy   → Emerald Green (#10B981 / --cg-ok)
 *   fungal    → Crimson Red   (#EF4444 / --cg-danger)
 *   bacterial → Violet        (custom inline)
 *   viral     → Amber         (#F59E0B / --cg-warn)
 */
export type DiseaseCategory = 'healthy' | 'fungal' | 'bacterial' | 'viral';

export interface CropClass {
  /** Edge Impulse output label, verbatim from model_variables.h. */
  label: string;
  title: string;
  /** PlantVillage crop, since these labels are crop-specific. */
  crop: string;
  pathogen: string;
  severity: Severity;
  accent: AccentVar;
  /** Category for dynamic badge colour mapping. */
  category: DiseaseCategory;
  summary: string;
  overview: string;
  actionPlan: string[];
  organicControls: string[];
  chemicalControls: string[];
  alerts: string[];
}

export interface ClassScore {
  label: string;
  score: number;
}

export interface InferenceTiming {
  /** Frame acquisition + DSP pre-processing (crop, resize, RGB, quantise). */
  dspMs: number;
  /** NN forward pass inside the TFLite Micro interpreter. */
  nnMs: number;
  /** Frame interval at the configured input rate. */
  frameMs: number;
}

export interface Inference {
  id: string;
  timestamp: Date;
  scores: ClassScore[];
  topIndex: number;
  /** Raw float, e.g. 0.9482 - mirrors what the firmware prints. */
  topScore: number;
  timing: InferenceTiming;
  /** Provenance, so the UI never implies hardware data when it is simulated. */
  source: 'serial' | 'simulated';
  /** Which wire format produced this frame. */
  transport: 'json' | 'log' | 'simulated';
}

export interface Telemetry {
  temperatureC: number;
  humidityPct: number;
  leafWetnessPct: number;
  i2c: { address: string; device: string; ok: boolean }[];
  heapUsedBytes: number;
  heapCapacityBytes: number;
  cpuLoadPct: number;
  clockHz: number;
  uptimeS: number;
  frameRate: number;
}

export interface DeviceInfo {
  board: string;
  mcu: string;
  flashBytes: number;
  ramBytes: number;
  sdk: string;
  runtime: string;
  firmware: string;
  inputShape: string;
  arenaBytes: number;
  threshold: number;
  projectName: string;
}

export type ConnectionState = 'unsupported' | 'disconnected' | 'connecting' | 'connected';

export type LogLevel = 'INFO' | 'DSP' | 'NN' | 'PREDICTION' | 'SENSOR' | 'WARN' | 'ERROR' | 'SYS';

export interface LogLine {
  id: string;
  timestamp: Date;
  level: LogLevel;
  message: string;
}

export type PresetId =
  | 'healthy'
  | 'early-blight'
  | 'late-blight'
  | 'target-spot'
  | 'bacterial-spot'
  | 'yellow-leaf-curl'
  | 'mosaic-virus';

export interface TestPreset {
  id: PresetId;
  name: string;
  hint: string;
  expectedLabel: string;
  scores: ClassScore[];
  telemetry: Pick<Telemetry, 'temperatureC' | 'humidityPct' | 'leafWetnessPct'>;
}

export type InputMode = 'camera' | 'static-vector';

/** Simulation source buttons from the control panel. */
export type SimMode =
  | 'off'
  | 'healthy'
  | 'late-blight'
  | 'target-spot'
  | 'bacterial-spot'
  | 'random';

/** A command queued for transmission to the device over UART. */
export interface UartCommand {
  id: string;
  command: string;
  status: 'sending' | 'sent' | 'failed';
  detail?: string;
}