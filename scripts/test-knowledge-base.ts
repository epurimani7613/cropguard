import {
  AGRONOMIC_KNOWLEDGE_BASE,
  getTreatmentRecommendation,
} from '../src/data/treatment-advisor';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`PASS: ${msg}`);
}

console.log('Testing Agronomic Knowledge Base...');

// Test 1: Healthy
const healthy = getTreatmentRecommendation('Healthy');
assert(healthy.category === 'Healthy', 'Healthy category match');
assert(healthy.fertilizer.npkRatio.includes('19-19-19'), 'Healthy fertilizer NPK 19-19-19');
assert(healthy.fertilizer.guidance.includes('NPK 19-19-19'), 'Healthy fertilizer guidance');
assert(healthy.pesticide.activeIngredients.includes('Neem Oil'), 'Healthy pesticide Neem Oil');
assert(healthy.pesticide.dosageAndSpray.includes('3 ml/liter'), 'Healthy pesticide dosage');
assert(healthy.preventiveCare.summary.includes('drip irrigation'), 'Healthy care action drip irrigation');

// Test 2: Early Blight
const early = getTreatmentRecommendation('Early Blight');
assert(early.category === 'Early Blight', 'Early Blight category match');
assert(early.scientificName.includes('Alternaria solani'), 'Early Blight scientific name');
assert(early.fertilizer.npkRatio.includes('12-12-17'), 'Early Blight fertilizer NPK 12-12-17');
assert(early.fertilizer.guidance.includes('Potassium- and Calcium-rich'), 'Early Blight fertilizer guidance');
assert(early.pesticide.activeIngredients.includes('Mancozeb 75% WP'), 'Early Blight pesticide Mancozeb 75% WP');
assert(early.pesticide.dosageAndSpray.includes('2.5 g/liter'), 'Early Blight dosage 2.5 g/liter');
assert(early.preventiveCare.summary.includes('Prune and destroy'), 'Early Blight care action prune and destroy');

// Test 3: Late Blight
const late = getTreatmentRecommendation('Late Blight');
assert(late.category === 'Late Blight', 'Late Blight category match');
assert(late.scientificName.includes('Phytophthora infestans'), 'Late Blight scientific name');
assert(late.fertilizer.npkRatio.includes('0-52-34'), 'Late Blight fertilizer NPK 0-52-34');
assert(late.fertilizer.guidance.includes('Mono Potassium Phosphate'), 'Late Blight fertilizer guidance');
assert(late.pesticide.activeIngredients.includes('Metalaxyl-M'), 'Late Blight pesticide Metalaxyl-M');
assert(late.pesticide.dosageAndSpray.includes('2.5 g/liter'), 'Late Blight dosage 2.5 g/liter');
assert(late.preventiveCare.summary.includes('Quarantine affected plants'), 'Late Blight care action quarantine');

console.log('All Knowledge Base assertions verified successfully!');

