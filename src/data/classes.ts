import type { CropClass } from '@/types/telemetry';

/**
 * Label → agronomy lookup.
 *
 * The deployed model on this machine is a 3-class POTATO model. Read straight
 * out of the generated Edge Impulse header:
 *
 *   model-parameters/model_variables.h
 *   ei_classifier_inferencing_categories_1111905_1[] =
 *     { "Early_Blight", "Healthy", "Late_Blight" }
 *
 * The brief asks for a fourth label, "Yellow_Leaf_Curl". That class exists in
 * the source dataset as a TOMATO disease
 * (Tomato___Tomato_Yellow_Leaf_Curl_Virus, 2740 images), NOT as a potato
 * class — so it cannot be produced by the current model. It is included below
 * because the UI must render it the moment you retrain onto it, and because the
 * live parser is label-agnostic: if the device reports it, it is looked up.
 *
 * The dashboard renders whatever labels the device actually reports. Unknown
 * labels degrade to an "unmapped" entry rather than crashing.
 */
export const CROP_CLASSES: Record<string, CropClass> = {
  Healthy: {
    label: 'Healthy',
    title: 'Healthy Leaf',
    crop: 'Potato',
    pathogen: 'None detected',
    severity: 'healthy',
    accent: 'ok',
    summary: 'Chlorophyll distribution and vein contrast sit inside the healthy reference envelope. No clustered necrosis above the 0.8% canopy threshold.',
    overview:
      'The capture shows uniform pigmentation across the lamina with continuous interveinal tissue and no marginal necrosis. Lesion-area analysis is below the alerting threshold, and the decision boundary has been stable across the last 200 inferences — which indicates good capture conditions rather than the model guessing. No fungicide intervention is warranted; the correct action here is to keep monitoring on the existing schedule.',
    actionPlan: [
      'Hold the current irrigation schedule — no corrective action required.',
      'Re-baseline with ~200 frames from this canopy block at the next scheduled capture.',
      'Keep the sensor head at 0.4 m standoff; drift beyond 0.5 m degrades crop-size accuracy.',
      'Log this reading against the field notebook so treatment history stays auditable.',
    ],
    organicControls: [
      'Maintain a 3-species companion planting ratio to suppress aphid vectors.',
      'Top-dress with compost at 200 g/m² to hold soil moisture variance under 12%.',
      'Rotate to a non-solanaceous cover crop between potato cycles.',
    ],
    chemicalControls: [
      'No foliar application required. Avoid prophylactic spraying — it selects for resistance.',
    ],
    alerts: ['No active alerts. Escalate if humidity stays above 85% for 6+ hours.'],
  },

  Early_Blight: {
    label: 'Early_Blight',
    title: 'Early Blight (Alternaria solani)',
    crop: 'Potato',
    pathogen: 'Alternaria solani',
    severity: 'watch',
    accent: 'warn',
    summary: 'Concentric target-spot lesions with chlorotic halos, concentrated on older lower leaves.',
    overview:
      'Dark brown lesions showing concentric zonation and a surrounding chlorotic halo, worst on the oldest foliage, match Alternaria solani at low-to-moderate severity. The pathogen is soil-borne and splash-dispersed, so it always advances from the canopy floor upward — which is what this frame shows. Spore pressure climbs sharply once relative humidity stays above 80%, so at the current reading this canopy sits inside the infection window even though total lesion area is still modest.',
    actionPlan: [
      'Remove and destroy the most affected lower leaves today — do not compost on site.',
      'Raise airflow: reduce canopy density by ~20% and support stems upright within 48 h.',
      'Switch to drip irrigation for 72 h; keep the leaf surface dry overnight.',
      'Re-scan this zone in 5–7 days; escalate to the critical protocol if lesion area passes 5%.',
    ],
    organicControls: [
      'Apply a copper-based bactericide/fungicide at 2 g/L as a protectant, repeat every 10 days.',
      'Spray 1% neem emulsion with a wetting agent to disrupt spore germination.',
      'Apply Trichoderma harzianum soil drench at 5 L/ha to outcompete soil inoculum.',
      'Mulch with clean straw to stop soil splash reaching the lower canopy.',
    ],
    chemicalControls: [
      'Mancozeb 75% WP at 2 g/L — the standard protectant for early blight.',
      'Azoxystrobin 23% SC at 1 ml/L where local residue limits permit; rotate FRAC groups.',
      'Always confirm the product is registered for early blight on potato in your region.',
    ],
    alerts: [
      'Wetness > 70% for more than 4 h → outbreak likely, notify the agronomist.',
      'Humidity above 85% for 6 h → shorten the spray interval to 7 days.',
    ],
  },

  Late_Blight: {
    label: 'Late_Blight',
    title: 'Late Blight (Phytophthora infestans)',
    crop: 'Potato',
    pathogen: 'Phytophthora infestans',
    severity: 'critical',
    accent: 'danger',
    summary: 'Water-soaked margins with a chlorotic advance zone and sporulation — containment required now.',
    overview:
      'Water-soaked lesions spreading inward from the leaf margin, with a pale advance zone ahead of the necrotic tissue and visible sporulation on the abaxial surface, confirm Phytophthora infestans. Unlike the slow, dry lesions of early blight, this oomycete completes a full infection cycle in under 48 h under these humidity conditions and is already vectored across the block by wind-driven rain. This is a reportable, economically severe finding and the response is containment, not treatment.',
    actionPlan: [
      'STOP — isolate this zone within 2 h and mark it; do not walk the block.',
      'Harvest clean tubers from unaffected rows first; never move plants from this zone inward.',
      'Strip and destroy all symptomatic foliage within 24 h — bag it, do not compost.',
      'Notify the grower and regional extension service; late blight is a notifiable outbreak.',
      'Start a 3-day spray interval protectant program; no more than 2 consecutive curative sprays.',
    ],
    organicControls: [
      'Copper oxychloride 50% WP at 2.5 g/L tank-mixed with mancozeb 75% WP at 2.5 g/L.',
      'Support with Bacillus subtilis foliar sprays at 5 ml/L every 5 days as a biological barrier.',
      'Trench and solarise infected beds to kill overwintering soil inoculum before the next season.',
    ],
    chemicalControls: [
      'Cymoxanil 8% + mancozeb 64% WP at 2 g/L — the standard protectant mix.',
      'Curative rotation: dimethomorph 50% WP at 0.75 g/L, then metalaxyl-M + mancozeb at 2 g/L.',
      'Respect PHI and MRLs; confirm registration for your crop and region before application.',
    ],
    alerts: [
      'Spore count and wetness both rising → outbreak trajectory confirmed.',
      'Any neighbouring block within 200 m must be scouted within 24 h.',
      'Treat visible sporulation as a biosecurity event, not a nutrition issue.',
    ],
  },
Yellow_Leaf_Curl: {
    label: 'Yellow_Leaf_Curl',
    title: 'Yellow Leaf Curl Virus (TYLCV)',
    crop: 'Tomato',
    pathogen: 'Tomato yellow leaf curl virus (TYLCV)',
    severity: 'critical',
    accent: 'danger',
    summary: 'Upward leaf curl with interveinal chlorosis and stunting — whitefly vectored virus.',
    overview:
      'Upward cupping of the leaf margins, interveinal chlorosis, and pronounced internode stunting match the symptom complex of Tomato yellow leaf curl virus. Note this is a TOMATO disease in the source dataset, so the currently deployed potato model cannot emit it — it appears here for a retrained multi-crop model. The virus is transmitted persistently by Bemisia tabaci, so leaf wetness is not the driver; vector pressure and temperature are. Untreated neighbouring plants will likely acquire the virus within 1–2 weeks.',
    actionPlan: [
      'Remove and bag infected plants immediately — they are a permanent virus reservoir.',
      'Install 40-mesh insect-proof netting over the block within 72 h.',
      'Deploy 8–10 yellow sticky traps per 100 m² and record whitefly counts twice weekly.',
      'Raise potassium and magnesium to correct the induced micronutrient display — this is not a cure.',
      'Do not propagate from symptomatic tissue; rogue seedlings from affected trays.',
    ],
    organicControls: [
      'Neem oil 1500 ppm at 3 ml/L with soap, applied to leaf undersides, every 5 days.',
      'Release Encarsia formosa at 200 adults/100 m² where greenhouse conditions permit.',
      'Reflective mulches and border trap crops of 2 rows of maize around the block.',
    ],
    chemicalControls: [
      'Imidacloprid 17.8% SL at 0.3 ml/L — systemic whitefly control; rotate modes of action.',
      'Alternate with spiromesifen 22.9% SC at 0.6 ml/L for anti-oviposition cover.',
      'Resistance in B. tabaci is widespread — never repeat a mode of action twice.',
    ],
    alerts: [
      'Incidence above 5% plants → treat as an outbreak and re-map the whole block.',
      'Whitefly count above 30/leaf → vector threshold exceeded, spray within 48 h.',
    ],
  },
};

/**
 * Deployed-model label order. `Yellow_Leaf_Curl` is deliberately NOT listed
 * here: it is not an output of the current model, so it must not appear in the
 * breakdown chart until the device actually reports it.
 */
export const CLASS_ORDER = ['Early_Blight', 'Healthy', 'Late_Blight'] as const;

/** Every label the UI knows how to describe, including not-yet-deployed ones. */
export const ALL_KNOWN_LABELS = [...CLASS_ORDER, 'Yellow_Leaf_Curl'] as const;

export function getCropClass(label: string): CropClass {
  return (
    CROP_CLASSES[label] ?? {
      label,
      title: label.replace(/_/g, ' '),
      crop: 'Unmapped crop',
      pathogen: 'Unknown — label not in lookup table',
      severity: 'watch' as const,
      accent: 'info' as const,
      summary: 'This label has no agronomy entry. Add one in src/data/classes.ts.',
      overview: '',
      actionPlan: [],
      organicControls: [],
      chemicalControls: [],
      alerts: [],
    }
  );
}