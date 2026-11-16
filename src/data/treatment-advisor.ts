/**
 * Agronomic Recommendation Knowledge Base
 *
 * Mapped to the three primary Solanaceae leaf classes:
 *  1. Healthy
 *  2. Early Blight (Alternaria solani)
 *  3. Late Blight (Phytophthora infestans)
 *
 * Provides specific NPK ratios, active ingredients, dosages, spray intervals,
 * and actionable preventive care notes for farmers.
 */

export type LeafDiseaseClass = 'Healthy' | 'Early Blight' | 'Late Blight';

export interface TreatmentRecommendation {
  category: LeafDiseaseClass;
  commonName: string;
  scientificName: string;
  pathogen: string;
  severity: 'healthy' | 'watch' | 'critical';
  statusBadge: {
    label: string;
    variant: 'healthy' | 'early_blight' | 'late_blight';
    dotClass: string;
    textClass: string;
    bgClass: string;
    borderClass: string;
  };
  fertilizer: {
    npkRatio: string;
    npkChip: string;
    guidance: string;
    applicationTip: string;
    warning?: string;
  };
  pesticide: {
    activeIngredients: string;
    dosageAndSpray: string;
    organicOption?: string;
  };
  preventiveCare: {
    summary: string;
    actionSteps: string[];
  };
}

export const AGRONOMIC_KNOWLEDGE_BASE: Record<LeafDiseaseClass, TreatmentRecommendation> = {
  Healthy: {
    category: 'Healthy',
    commonName: 'Healthy Crop',
    scientificName: 'Solanum lycopersicum (Healthy)',
    pathogen: 'None detected',
    severity: 'healthy',
    statusBadge: {
      label: 'Healthy',
      variant: 'healthy',
      dotClass: 'bg-ok',
      textClass: 'text-ok',
      bgClass: 'bg-ok/10',
      borderClass: 'border-ok/30',
    },
    fertilizer: {
      npkRatio: 'NPK 19-19-19',
      npkChip: 'Balanced Vegetative',
      guidance:
        'Balanced NPK 19-19-19 water-soluble fertilizer or organic vermicompost (500g per plant) every 15 days to maintain steady vegetative growth.',
      applicationTip:
        'Apply via fertigation or ring top-dressing 10 cm away from the base stem to encourage strong root development.',
    },
    pesticide: {
      activeIngredients: 'Neem Oil (Azadirachtin 1500 ppm)',
      dosageAndSpray:
        'No chemical pesticide required. Apply a preventive Neem Oil (Azadirachtin 1500 ppm) foliar spray (3 ml/liter of water) every 10–14 days to deter pests.',
      organicOption:
        'Cold-pressed neem seed oil emulsion with 1 ml/L liquid soap as an organic bio-protectant.',
    },
    preventiveCare: {
      summary:
        'Maintain regular drip irrigation at the root zone and avoid wetting foliage late in the evening.',
      actionSteps: [
        'Maintain regular drip irrigation directly at the root zone.',
        'Avoid wetting foliage late in the evening to eliminate humid leaf conditions that promote fungal germination.',
        'Conduct routine scouting every 7 days for early signs of chlorosis or leaf spotting.',
        'Maintain 45–60 cm row spacing to guarantee healthy inter-canopy ventilation.',
      ],
    },
  },

  'Early Blight': {
    category: 'Early Blight',
    commonName: 'Early Blight',
    scientificName: 'Alternaria solani',
    pathogen: 'Alternaria solani (Fungus)',
    severity: 'watch',
    statusBadge: {
      label: 'Early Blight',
      variant: 'early_blight',
      dotClass: 'bg-warn',
      textClass: 'text-warn',
      bgClass: 'bg-warn/10',
      borderClass: 'border-warn/30',
    },
    fertilizer: {
      npkRatio: 'NPK 12-12-17 + Ca',
      npkChip: 'Potassium & Calcium Rich',
      guidance:
        'Switch to a Potassium- and Calcium-rich fertilizer (NPK 12-12-17 or Potassium Nitrate + Calcium Nitrate) to strengthen leaf cell walls. Avoid high-nitrogen fertilizers, as excess nitrogen promotes soft, susceptible foliage.',
      applicationTip:
        'Foliar spray 1% Potassium Nitrate in the early morning to reinforce the epidermal cell wall matrix against hyphal penetration.',
      warning:
        'Avoid high-nitrogen fertilizers — excess nitrogen promotes soft, succulent foliage highly vulnerable to fungal attack.',
    },
    pesticide: {
      activeIngredients: 'Mancozeb 75% WP / Chlorothalonil / Azoxystrobin',
      dosageAndSpray:
        'Apply Mancozeb 75% WP (2.5 g/liter of water) or Chlorothalonil / Azoxystrobin fungicide at 7–10 day intervals. For organic control, use Bacillus subtilis bio-fungicide.',
      organicOption:
        'Bacillus subtilis bio-fungicide (5 ml/L) or Copper Hydroxide 77% WP (2 g/L) protective spray.',
    },
    preventiveCare: {
      summary:
        'Prune and destroy infected lower yellow/brown leaves with concentric rings immediately and improve air circulation between plants.',
      actionSteps: [
        'Prune and destroy infected lower yellow/brown leaves with concentric target-ring spots immediately.',
        'Bag and remove pruned debris from the field — never compost infected foliage on site.',
        'Improve air circulation between plants by staking stems and selective sucker thinning.',
        'Apply organic straw or plastic mulch to prevent rainwater splashing soil-borne spores onto lower leaves.',
      ],
    },
  },

  'Late Blight': {
    category: 'Late Blight',
    commonName: 'Late Blight',
    scientificName: 'Phytophthora infestans',
    pathogen: 'Phytophthora infestans (Oomycete)',
    severity: 'critical',
    statusBadge: {
      label: 'Late Blight',
      variant: 'late_blight',
      dotClass: 'bg-danger',
      textClass: 'text-danger',
      bgClass: 'bg-danger/10',
      borderClass: 'border-danger/30',
    },
    fertilizer: {
      npkRatio: 'NPK 0-52-34 (MKP)',
      npkChip: 'Mono Potassium Phosphate',
      guidance:
        'Apply Mono Potassium Phosphate (NPK 0-52-34) foliar feed to boost plant immunity and stress tolerance. Strictly stop all nitrogen-based fertilizers immediately.',
      applicationTip:
        'Dissolve MKP at 3 g/L for foliar absorption. Phosphite ions trigger systemic acquired resistance (SAR) inside the host vascular tissue.',
      warning:
        'Strictly stop all nitrogen-based fertilizers immediately — nitrogen fuels rapid pathogen multiplication and cell necrosis.',
    },
    pesticide: {
      activeIngredients: 'Metalaxyl-M 8% + Mancozeb 64% WP / Cymoxanil + Mancozeb',
      dosageAndSpray:
        'Immediately spray a systemic + contact fungicide such as Metalaxyl-M 8% + Mancozeb 64% WP (2.5 g/liter of water) or Cymoxanil + Mancozeb every 5–7 days until spread stops.',
      organicOption:
        'Copper Oxychloride 50% WP (2.5 g/L) tank-mixed with protective bio-barrier film.',
    },
    preventiveCare: {
      summary:
        'Quarantine affected plants, remove water-soaked dark lesions immediately, and reduce overhead humidity/watering.',
      actionSteps: [
        'Quarantine affected plants immediately and halt field movement from infected plots into clean areas.',
        'Remove water-soaked dark lesions immediately using disinfected cutting tools.',
        'Strictly avoid overhead watering or late-day irrigation; reduce canopy moisture exposure.',
        'Alert regional growers if ambient humidity exceeds 85%, as sporangia are wind-blown over miles.',
      ],
    },
  },
};

/**
 * Normalizes any predicted label string into one of the 3 treatment categories.
 */
export function getTreatmentRecommendation(label: string): TreatmentRecommendation {
  const norm = label.toLowerCase().replace(/_/g, ' ');
  if (norm.includes('late')) {
    return AGRONOMIC_KNOWLEDGE_BASE['Late Blight'];
  }
  if (norm.includes('early')) {
    return AGRONOMIC_KNOWLEDGE_BASE['Early Blight'];
  }
  return AGRONOMIC_KNOWLEDGE_BASE['Healthy'];
}

