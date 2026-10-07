import type { TestPreset } from '@/types/telemetry';
import { CLASS_ORDER } from '@/data/classes';

/**
 * Static feature vectors for the retrained multi-class model.
 * Scores are fixed so a preset always yields the same verdict — this keeps
 * demos and regression checks reproducible.
 *
 * Each preset provides scores for ALL deployed classes. The remaining classes
 * are zero-filled to match CLASS_ORDER length.
 */

/** Helper: fill out any missing labels with zero. */
function fillScores(partial: { label: string; score: number }[]): { label: string; score: number }[] {
  const map = new Map(partial.map((s) => [s.label, s.score]));
  return CLASS_ORDER.map((label) => ({ label, score: map.get(label) ?? 0 }));
}

export const TEST_PRESETS: TestPreset[] = [
  {
    id: 'healthy',
    name: 'Sample 1: Healthy Crop',
    hint: 'Uniform lamina, continuous interveinal tissue, no lesions.',
    expectedLabel: 'Healthy',
    scores: fillScores([
      { label: 'Healthy', score: 0.9482 },
      { label: 'Early_Blight', score: 0.0142 },
      { label: 'Late_Blight', score: 0.0098 },
      { label: 'Tomato_Target_Spot', score: 0.0121 },
      { label: 'Tomato_Bacterial_Spot', score: 0.0057 },
      { label: 'Yellow_Leaf_Curl', score: 0.0041 },
      { label: 'Tomato_Mosaic_Virus', score: 0.0022 },
      { label: 'Septoria_Leaf_Spot', score: 0.0019 },
      { label: 'Leaf_Mold', score: 0.0011 },
      { label: 'Spider_Mites', score: 0.0007 },
    ]),
    telemetry: { temperatureC: 23.1, humidityPct: 61, leafWetnessPct: 22 },
  },
  {
    id: 'early-blight',
    name: 'Sample 2: Early Blight',
    hint: 'Concentric target-spot lesions with chlorotic halos on lower leaves.',
    expectedLabel: 'Early_Blight',
    scores: fillScores([
      { label: 'Early_Blight', score: 0.9127 },
      { label: 'Healthy', score: 0.0314 },
      { label: 'Late_Blight', score: 0.0209 },
      { label: 'Tomato_Target_Spot', score: 0.0188 },
      { label: 'Septoria_Leaf_Spot', score: 0.0091 },
      { label: 'Tomato_Bacterial_Spot', score: 0.0041 },
      { label: 'Yellow_Leaf_Curl', score: 0.0012 },
      { label: 'Tomato_Mosaic_Virus', score: 0.0009 },
      { label: 'Leaf_Mold', score: 0.0005 },
      { label: 'Spider_Mites', score: 0.0004 },
    ]),
    telemetry: { temperatureC: 26.9, humidityPct: 79, leafWetnessPct: 58 },
  },
  {
    id: 'late-blight',
    name: 'Sample 3: Late Blight (critical)',
    hint: 'Water-soaked margins, chlorotic advance zone, abaxial sporulation.',
    expectedLabel: 'Late_Blight',
    scores: fillScores([
      { label: 'Late_Blight', score: 0.9156 },
      { label: 'Early_Blight', score: 0.0411 },
      { label: 'Healthy', score: 0.0133 },
      { label: 'Tomato_Target_Spot', score: 0.0112 },
      { label: 'Septoria_Leaf_Spot', score: 0.0077 },
      { label: 'Tomato_Bacterial_Spot', score: 0.0052 },
      { label: 'Leaf_Mold', score: 0.0028 },
      { label: 'Yellow_Leaf_Curl', score: 0.0015 },
      { label: 'Tomato_Mosaic_Virus', score: 0.0009 },
      { label: 'Spider_Mites', score: 0.0007 },
    ]),
    telemetry: { temperatureC: 19.4, humidityPct: 91, leafWetnessPct: 88 },
  },
  {
    id: 'target-spot',
    name: 'Sample 4: Target Spot',
    hint: 'Concentric ring lesions with dark centres on lower canopy.',
    expectedLabel: 'Tomato_Target_Spot',
    scores: fillScores([
      { label: 'Tomato_Target_Spot', score: 0.9231 },
      { label: 'Early_Blight', score: 0.0327 },
      { label: 'Septoria_Leaf_Spot', score: 0.0194 },
      { label: 'Late_Blight', score: 0.0098 },
      { label: 'Healthy', score: 0.0063 },
      { label: 'Tomato_Bacterial_Spot', score: 0.0041 },
      { label: 'Leaf_Mold', score: 0.0021 },
      { label: 'Spider_Mites', score: 0.0013 },
      { label: 'Yellow_Leaf_Curl', score: 0.0007 },
      { label: 'Tomato_Mosaic_Virus', score: 0.0005 },
    ]),
    telemetry: { temperatureC: 27.2, humidityPct: 82, leafWetnessPct: 64 },
  },
  {
    id: 'bacterial-spot',
    name: 'Sample 5: Bacterial Spot',
    hint: 'Water-soaked angular spots with yellow halos, scab-like fruit lesions.',
    expectedLabel: 'Tomato_Bacterial_Spot',
    scores: fillScores([
      { label: 'Tomato_Bacterial_Spot', score: 0.8842 },
      { label: 'Early_Blight', score: 0.0413 },
      { label: 'Septoria_Leaf_Spot', score: 0.0291 },
      { label: 'Tomato_Target_Spot', score: 0.0187 },
      { label: 'Late_Blight', score: 0.0112 },
      { label: 'Healthy', score: 0.0074 },
      { label: 'Leaf_Mold', score: 0.0038 },
      { label: 'Spider_Mites', score: 0.0021 },
      { label: 'Yellow_Leaf_Curl', score: 0.0013 },
      { label: 'Tomato_Mosaic_Virus', score: 0.0009 },
    ]),
    telemetry: { temperatureC: 28.5, humidityPct: 85, leafWetnessPct: 72 },
  },
  {
    id: 'yellow-leaf-curl',
    name: 'Sample 6: Yellow Leaf Curl (viral)',
    hint: 'Upward leaf curl, interveinal chlorosis, internode stunting.',
    expectedLabel: 'Yellow_Leaf_Curl',
    scores: fillScores([
      { label: 'Yellow_Leaf_Curl', score: 0.9364 },
      { label: 'Tomato_Mosaic_Virus', score: 0.0287 },
      { label: 'Healthy', score: 0.0142 },
      { label: 'Leaf_Mold', score: 0.0078 },
      { label: 'Early_Blight', score: 0.0052 },
      { label: 'Tomato_Target_Spot', score: 0.0031 },
      { label: 'Tomato_Bacterial_Spot', score: 0.0019 },
      { label: 'Late_Blight', score: 0.0012 },
      { label: 'Septoria_Leaf_Spot', score: 0.0009 },
      { label: 'Spider_Mites', score: 0.0006 },
    ]),
    telemetry: { temperatureC: 30.1, humidityPct: 68, leafWetnessPct: 18 },
  },
  {
    id: 'mosaic-virus',
    name: 'Sample 7: Mosaic Virus (viral)',
    hint: 'Light/dark green mottling with leaf distortion, mechanically transmitted.',
    expectedLabel: 'Tomato_Mosaic_Virus',
    scores: fillScores([
      { label: 'Tomato_Mosaic_Virus', score: 0.9018 },
      { label: 'Yellow_Leaf_Curl', score: 0.0421 },
      { label: 'Healthy', score: 0.0231 },
      { label: 'Leaf_Mold', score: 0.0128 },
      { label: 'Early_Blight', score: 0.0082 },
      { label: 'Tomato_Target_Spot', score: 0.0054 },
      { label: 'Tomato_Bacterial_Spot', score: 0.0031 },
      { label: 'Late_Blight', score: 0.0017 },
      { label: 'Septoria_Leaf_Spot', score: 0.0012 },
      { label: 'Spider_Mites', score: 0.0006 },
    ]),
    telemetry: { temperatureC: 25.8, humidityPct: 72, leafWetnessPct: 34 },
  },
];