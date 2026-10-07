import type { CropClass, DiseaseCategory } from '@/types/telemetry';

/**
 * Label → agronomy lookup.
 *
 * The retrained Edge Impulse model on the STM32F411 now outputs multi-class
 * tomato and potato disease labels. The dashboard renders whatever labels the
 * device reports. Unknown labels degrade to an "unmapped" entry.
 *
 * Categories drive the dynamic badge colour in the verdict card:
 *   healthy   → Emerald Green
 *   fungal    → Crimson Red
 *   bacterial → Violet
 *   viral     → Amber
 */
export const CROP_CLASSES: Record<string, CropClass> = {
  /* ------------------------------------------------------------------ */
  /* Healthy                                                             */
  /* ------------------------------------------------------------------ */
  Healthy: {
    label: 'Healthy',
    title: 'Healthy Leaf',
    crop: 'Tomato / Potato',
    pathogen: 'None detected',
    severity: 'healthy',
    accent: 'ok',
    category: 'healthy',
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
      'Rotate to a non-solanaceous cover crop between cycles.',
    ],
    chemicalControls: [
      'No foliar application required. Avoid prophylactic spraying — it selects for resistance.',
    ],
    alerts: ['No active alerts. Escalate if humidity stays above 85% for 6+ hours.'],
  },

  /* ------------------------------------------------------------------ */
  /* Fungal diseases                                                     */
  /* ------------------------------------------------------------------ */
  Early_Blight: {
    label: 'Early_Blight',
    title: 'Early Blight (Alternaria solani)',
    crop: 'Potato',
    pathogen: 'Alternaria solani',
    severity: 'watch',
    accent: 'warn',
    category: 'fungal',
    summary: 'Concentric target-spot lesions with chlorotic halos, concentrated on older lower leaves.',
    overview:
      'Dark brown lesions showing concentric zonation and a surrounding chlorotic halo, worst on the oldest foliage, match Alternaria solani at low-to-moderate severity. The pathogen is soil-borne and splash-dispersed, so it always advances from the canopy floor upward. Spore pressure climbs sharply once relative humidity stays above 80%.',
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
    crop: 'Potato / Tomato',
    pathogen: 'Phytophthora infestans',
    severity: 'critical',
    accent: 'danger',
    category: 'fungal',
    summary: 'Water-soaked margins with a chlorotic advance zone and sporulation — containment required now.',
    overview:
      'Water-soaked lesions spreading inward from the leaf margin, with a pale advance zone ahead of the necrotic tissue and visible sporulation on the abaxial surface, confirm Phytophthora infestans. This oomycete completes a full infection cycle in under 48 h and is vectored across the block by wind-driven rain. This is a reportable, economically severe finding.',
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

  Tomato_Target_Spot: {
    label: 'Tomato_Target_Spot',
    title: 'Target Spot (Corynespora cassiicola)',
    crop: 'Tomato',
    pathogen: 'Corynespora cassiicola',
    severity: 'watch',
    accent: 'warn',
    category: 'fungal',
    summary: 'Concentric ring lesions with dark centres on both leaves and fruit — monitor closely.',
    overview:
      'Circular to irregular brown lesions with concentric rings (target-board pattern) on lower-to-mid canopy leaves are characteristic of Corynespora cassiicola. The fungus favours warm (25–30 °C), humid conditions and can also infect fruit, reducing marketability. Under continued wet weather, lesions coalesce and defoliate the plant. Early intervention before lesion coalescence is critical.',
    actionPlan: [
      'Remove heavily spotted lower leaves to reduce inoculum load — bag and destroy off-site.',
      'Improve canopy ventilation by staking and selective pruning of suckers.',
      'Reduce overhead irrigation; switch to drip to keep foliage dry during high-risk periods.',
      'Monitor fruit clusters nearest affected leaves for early signs of fruit infection.',
    ],
    organicControls: [
      'Copper hydroxide 77% WP at 2 g/L as a protectant spray every 7–10 days.',
      'Bacillus subtilis biofungicide at label rate to suppress surface spore germination.',
      'Neem oil 1% emulsion applied in the evening to avoid phytotoxicity.',
      'Mulch beds with clean plastic film to prevent soil splash onto lower leaves.',
    ],
    chemicalControls: [
      'Chlorothalonil 75% WP at 2 g/L — broad-spectrum protectant, 7-day interval.',
      'Azoxystrobin 25% SC at 0.75 ml/L (alternate with Difenoconazole to manage resistance).',
      'Observe pre-harvest intervals carefully; target spot sprays are often close to harvest.',
    ],
    alerts: [
      'Lesion coalescence > 15% leaf area on lower canopy → escalate to critical.',
      'Fruit lesions detected → stop harvest from affected trusses until clearance.',
    ],
  },

  Septoria_Leaf_Spot: {
    label: 'Septoria_Leaf_Spot',
    title: 'Septoria Leaf Spot (Septoria lycopersici)',
    crop: 'Tomato',
    pathogen: 'Septoria lycopersici',
    severity: 'watch',
    accent: 'warn',
    category: 'fungal',
    summary: 'Small dark spots with grey centres and dark margins on lower foliage — splash-dispersed.',
    overview:
      'Numerous small (2–3 mm) circular spots with grey-white centres and dark brown margins on lower leaves indicate Septoria lycopersici. The fungus produces pycnidia visible as tiny dark specks in lesion centres. It is splash-dispersed and thrives in warm, wet conditions. Severe infections cause rapid defoliation from the bottom up, exposing fruit to sunscald.',
    actionPlan: [
      'Strip and destroy affected lower leaves immediately — do not leave debris in the field.',
      'Improve air circulation by wider spacing and removing lower side shoots.',
      'Water at the base only; eliminate any overhead irrigation.',
      'Re-inspect in 5 days — if new lesions appear on mid-canopy leaves, escalate to critical.',
    ],
    organicControls: [
      'Copper fungicide at 2 g/L applied every 7 days during wet weather.',
      'Trichoderma-based biofungicide applied as a soil drench and foliar spray.',
      'Mulch heavily with clean straw to form a splash barrier between soil and foliage.',
    ],
    chemicalControls: [
      'Mancozeb 75% WP at 2.5 g/L — protectant; begin at first symptom.',
      'Chlorothalonil 75% WP at 2 g/L, alternated with mancozeb for resistance management.',
      'Systemic option: azoxystrobin + difenoconazole ready-mix at label rate if protectants fail.',
    ],
    alerts: [
      'Rain forecast for 3+ consecutive days → apply protectant before the rain event.',
      'Defoliation > 30% on lower canopy → fruit sunscald risk, provide shade cloth.',
    ],
  },

  Leaf_Mold: {
    label: 'Leaf_Mold',
    title: 'Leaf Mold (Passalora fulva)',
    crop: 'Tomato',
    pathogen: 'Passalora fulva (syn. Fulvia fulva)',
    severity: 'watch',
    accent: 'warn',
    category: 'fungal',
    summary: 'Olive-green velvety patches on leaf undersides with yellowing above — greenhouse risk.',
    overview:
      'Pale green to yellowish spots on upper leaf surfaces with corresponding olive-green to brown velvety mold on the lower surface confirm Passalora fulva. This is primarily a greenhouse and high-tunnel pathogen favoured by high humidity (> 85%) and moderate temperatures (22–27 °C). It rarely kills plants outright but severely reduces photosynthetic area and fruit quality.',
    actionPlan: [
      'Increase greenhouse ventilation immediately — target RH below 80%.',
      'Remove and bag affected leaves; do not drop them to the greenhouse floor.',
      'Space plants to ensure at least 50 cm between canopy edges.',
      'If in a tunnel, open side vents and end doors for cross-ventilation.',
    ],
    organicControls: [
      'Potassium bicarbonate at 5 g/L — disrupts fungal cell membranes on contact.',
      'Bacillus amyloliquefaciens biofungicide at label rate, applied weekly.',
      'Improve soil drainage to reduce ambient humidity from below.',
    ],
    chemicalControls: [
      'Chlorothalonil 75% WP at 2 g/L — effective protectant for leaf mold.',
      'Difenoconazole 25% EC at 0.5 ml/L if protectant alone does not arrest spread.',
      'Rotate between FRAC groups to prevent resistance buildup in closed environments.',
    ],
    alerts: [
      'Greenhouse RH > 85% for 6+ hours → outbreak risk is extreme, ventilate now.',
      'Multiple Cf races reported in your region → consider resistant cultivar for next cycle.',
    ],
  },

  Spider_Mites: {
    label: 'Spider_Mites',
    title: 'Spider Mites (Tetranychus urticae)',
    crop: 'Tomato',
    pathogen: 'Tetranychus urticae (two-spotted spider mite)',
    severity: 'watch',
    accent: 'warn',
    category: 'fungal', // arachnid pest — grouped with 'fungal' for colour coding (red = danger)
    summary: 'Fine stippling and bronzing of leaves with webbing on undersides — acaricide required.',
    overview:
      'Fine yellow stippling progressing to bronzing on the upper leaf surface, combined with silken webbing and tiny mites visible on the underside, indicate a Tetranychus urticae infestation. Spider mites thrive in hot, dry conditions and can explode to damaging populations within days. They reduce photosynthesis and, at high densities, cause leaf drop and fruit quality loss.',
    actionPlan: [
      'Spray infested areas with a strong water jet to physically dislodge mites and webbing.',
      'Release predatory mites (Phytoseiulus persimilis) at 2–5 per m² as biological control.',
      'Increase ambient humidity where possible — mites prefer dry conditions.',
      'Scout every 3 days; re-apply acaricide if population rebounds.',
    ],
    organicControls: [
      'Neem oil 1% emulsion applied to leaf undersides — disrupts mite feeding and reproduction.',
      'Insecticidal soap at 20 ml/L — contact kill, must reach mites directly.',
      'Sulphur-based miticide at 3 g/L — protectant action, avoid in temperatures above 32 °C.',
    ],
    chemicalControls: [
      'Abamectin 1.8% EC at 0.5 ml/L — translaminar activity, effective on eggs and adults.',
      'Spiromesifen 24% SC at 0.8 ml/L — lipid biosynthesis inhibitor, long residual.',
      'Rotate acaricide modes of action strictly; resistance develops rapidly.',
    ],
    alerts: [
      'Webbing visible on fruit clusters → treat immediately, marketability at risk.',
      'Hot dry spell forecast → pre-emptive scouting before population spike.',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Bacterial diseases                                                  */
  /* ------------------------------------------------------------------ */
  Tomato_Bacterial_Spot: {
    label: 'Tomato_Bacterial_Spot',
    title: 'Bacterial Spot (Xanthomonas vesicatoria)',
    crop: 'Tomato',
    pathogen: 'Xanthomonas vesicatoria',
    severity: 'critical',
    accent: 'danger',
    category: 'bacterial',
    summary: 'Raised, scab-like lesions on fruit and water-soaked spots on leaves — bacterial, not fungal.',
    overview:
      'Small (2–3 mm), water-soaked, angular spots on leaves that become necrotic with a yellow halo, combined with raised, rough, scab-like lesions on fruit, confirm Xanthomonas bacterial spot. The bacterium is seed-borne and splash-dispersed; once established it is very difficult to eradicate from a planting. Chemical controls are limited to copper-based protectants and antibiotics where permitted.',
    actionPlan: [
      'Remove and destroy symptomatic plants immediately — bag, do not compost.',
      'Stop overhead irrigation now; switch to drip to break splash dispersal.',
      'Sanitise hands and tools with 70% ethanol between plants to prevent mechanical spread.',
      'Source certified disease-free seed for the next planting cycle.',
      'Hot-water treat seed at 50 °C for 25 min if certified seed is unavailable.',
    ],
    organicControls: [
      'Copper hydroxide 77% WP at 2.5 g/L — the only effective organic protectant.',
      'Tank-mix copper with mancozeb 75% WP at 2 g/L to improve efficacy and manage resistance.',
      'Bacillus-based bactericide at label rate as a supplementary biocontrol.',
    ],
    chemicalControls: [
      'Copper oxychloride 50% WP at 2.5 g/L — standard protectant, 5–7 day interval.',
      'Streptomycin sulphate (where legally permitted) at 200 ppm — last-resort curative.',
      'Acibenzolar-S-methyl (plant defence activator) at 25 g/ha — systemic acquired resistance.',
    ],
    alerts: [
      'Fruit infection detected → halt harvest from affected trusses, fruit is unmarketable.',
      'Rain + wind events predicted → pre-apply copper protectant 24 h before the event.',
      'Seed source changed → hot-water treat or PCR-test before sowing.',
    ],
  },

  /* ------------------------------------------------------------------ */
  /* Viral diseases                                                      */
  /* ------------------------------------------------------------------ */
  Yellow_Leaf_Curl: {
    label: 'Yellow_Leaf_Curl',
    title: 'Yellow Leaf Curl Virus (TYLCV)',
    crop: 'Tomato',
    pathogen: 'Tomato yellow leaf curl virus (TYLCV)',
    severity: 'critical',
    accent: 'danger',
    category: 'viral',
    summary: 'Upward leaf curl with interveinal chlorosis and stunting — whitefly vectored virus.',
    overview:
      'Upward cupping of the leaf margins, interveinal chlorosis, and pronounced internode stunting match the symptom complex of Tomato yellow leaf curl virus. The virus is transmitted persistently by Bemisia tabaci (silverleaf whitefly), so leaf wetness is not the driver; vector pressure and temperature are. Untreated neighbouring plants will likely acquire the virus within 1–2 weeks.',
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

  Tomato_Mosaic_Virus: {
    label: 'Tomato_Mosaic_Virus',
    title: 'Tomaic Mosaic Virus (ToMV)',
    crop: 'Tomato',
    pathogen: 'Tomato mosaic virus (ToMV)',
    severity: 'critical',
    accent: 'danger',
    category: 'viral',
    summary: 'Light and dark green mottling with leaf distortion — mechanically transmitted, highly stable.',
    overview:
      'Irregular light and dark green mottling (mosaic) on young leaves, sometimes accompanied by leaf curling, fern-leaf distortion, and internal browning of fruit, are hallmarks of Tomato mosaic virus. ToMV is extraordinarily stable — it survives in dried plant debris, on tools, and even on hands for hours. It is not insect-vectored but spreads by mechanical contact during pruning, transplanting, and harvesting.',
    actionPlan: [
      'STOP handling plants — the virus spreads by touch to every plant you contact.',
      'Mark and rogue infected plants immediately; bag them before removal.',
      'Disinfect all cutting tools, stakes, and ties with 10% trisodium phosphate solution.',
      'Wash hands thoroughly with soap; dip in milk (casein denatures ToMV) between rows.',
      'Do not smoke near the crop — tobacco mosaic virus is a close relative and can cross-infect.',
    ],
    organicControls: [
      'Milk spray (10% skim milk) applied weekly — casein protein inactivates the virus on contact.',
      'Remove all crop debris and deep-plough before the next planting cycle.',
      'Use resistant cultivars carrying the Tm-2² gene for the next season.',
    ],
    chemicalControls: [
      'No chemical cure exists for ToMV — management is entirely through sanitation and resistance.',
      'Seed treatment: soak seeds in 10% trisodium phosphate for 15 min, rinse, and dry.',
    ],
    alerts: [
      'Multiple plants showing mosaic within the same row → mechanical spread confirmed.',
      'Fruit showing internal browning → unmarketable, do not harvest for sale.',
      'Workers handling symptomatic plants must change gloves between each plant.',
    ],
  },
};

/**
 * Deployed-model label order. Now reflects the retrained multi-class model.
 * The dashboard renders whatever labels the device reports; these are the
 * labels the simulator uses to generate synthetic frames.
 */
export const CLASS_ORDER = [
  'Healthy',
  'Early_Blight',
  'Late_Blight',
  'Tomato_Target_Spot',
  'Tomato_Bacterial_Spot',
  'Yellow_Leaf_Curl',
  'Tomato_Mosaic_Virus',
  'Septoria_Leaf_Spot',
  'Leaf_Mold',
  'Spider_Mites',
] as const;

/** Every label the UI knows how to describe, including not-yet-deployed ones. */
export const ALL_KNOWN_LABELS = [...CLASS_ORDER] as const;

/**
 * Maps a raw label from the firmware to its CropClass entry.
 * Unknown labels get a generic "unmapped" entry so the UI never crashes.
 */
export function getCropClass(label: string): CropClass {
  // Try exact match first, then try normalised key (underscores).
  const key = label.replace(/\s+/g, '_');
  return (
    CROP_CLASSES[label] ??
    CROP_CLASSES[key] ?? {
      label,
      title: label.replace(/_/g, ' '),
      crop: 'Unmapped crop',
      pathogen: 'Unknown — label not in lookup table',
      severity: 'watch' as const,
      accent: 'info' as const,
      category: 'fungal' as const,
      summary: 'This label has no agronomy entry. Add one in src/data/classes.ts.',
      overview: '',
      actionPlan: [],
      organicControls: [],
      chemicalControls: [],
      alerts: [],
    }
  );
}

/**
 * Normalise a raw firmware label to a human-readable display name.
 *   "Tomato_Target_Spot" → "Target Spot"
 *   "Tomato_Bacterial_Spot" → "Bacterial Spot"
 *   "Early_Blight" → "Early Blight"
 */
export function normaliseLabel(raw: string): string {
  return raw
    .replace(/^Tomato_/i, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Infer a disease category from a label, falling back to 'fungal'.
 */
export function inferCategory(label: string): DiseaseCategory {
  const info = CROP_CLASSES[label] ?? CROP_CLASSES[label.replace(/\s+/g, '_')];
  if (info) return info.category;
  const lower = label.toLowerCase();
  if (lower === 'healthy') return 'healthy';
  if (/virus|viral|mosaic|curl/i.test(lower)) return 'viral';
  if (/bacteri/i.test(lower)) return 'bacterial';
  return 'fungal';
}