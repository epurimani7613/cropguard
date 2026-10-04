import type { TestPreset } from '@/types/telemetry';

/**
 * Static feature vectors captured from the Edge Impulse test set.
 * Scores are fixed so a preset always yields the same verdict — this keeps
 * demos and regression checks reproducible.
 */
export const TEST_PRESETS: TestPreset[] = [
  {
    id: 'healthy',
    name: 'Sample 1: Healthy Crop',
    hint: 'Uniform lamina, continuous interveinal tissue, no lesions.',
    expectedLabel: 'Healthy',
    scores: [
      { label: 'Early_Blight', score: 0.0281 },
      { label: 'Healthy', score: 0.9482 },
      { label: 'Late_Blight', score: 0.0237 },
    ],
    telemetry: { temperatureC: 23.1, humidityPct: 61, leafWetnessPct: 22 },
  },
  {
    id: 'early-blight',
    name: 'Sample 2: Early Blight',
    hint: 'Concentric target-spot lesions with chlorotic halos on lower leaves.',
    expectedLabel: 'Early_Blight',
    scores: [
      { label: 'Early_Blight', score: 0.9127 },
      { label: 'Healthy', score: 0.0614 },
      { label: 'Late_Blight', score: 0.0259 },
    ],
    telemetry: { temperatureC: 26.9, humidityPct: 79, leafWetnessPct: 58 },
  },
  {
    id: 'late-blight',
    name: 'Sample 3: Late Blight (critical)',
    hint: 'Water-soaked margins, chlorotic advance zone, abaxial sporulation.',
    expectedLabel: 'Late_Blight',
    scores: [
      { label: 'Early_Blight', score: 0.0611 },
      { label: 'Healthy', score: 0.0233 },
      { label: 'Late_Blight', score: 0.9156 },
    ],
    telemetry: { temperatureC: 19.4, humidityPct: 91, leafWetnessPct: 88 },
  },
];