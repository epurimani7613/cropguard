import { rgbToHsv } from '../src/lib/image-classifier';
import { SAMPLE_LEAVES } from '../src/data/sample-leaves';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exit(1);
  }
  console.log(`PASS: ${msg}`);
}

console.log('Testing HSV Color-Space and Lesion Classifier math...');

// 1. Test RGB to HSV conversions
// (a) Healthy Green: e.g. #388e3c (R=56, G=142, B=60)
const [hgH, hgS, hgV] = rgbToHsv(56, 142, 60);
assert(hgH >= 65 && hgH <= 165, `Healthy green hue is in range: ${hgH}`);
assert(hgS > 0.20, `Healthy green saturation > 0.20: ${hgS}`);
assert(hgV > 0.20, `Healthy green value > 0.20: ${hgV}`);

// (b) Yellow Chlorosis Halo: e.g. #fdd835 (R=253, G=216, B=53)
const [yH, yS, yV] = rgbToHsv(253, 216, 53);
assert(yH >= 35 && yH <= 64, `Yellow halo hue is in range: ${yH}`);
assert(yS > 0.25, `Yellow halo saturation > 0.25: ${yS}`);
assert(yV > 0.30, `Yellow halo value > 0.30: ${yV}`);

// (c) Brown Lesion Target Spot: e.g. #795548 (R=121, G=85, B=72)
const [bH, bS, bV] = rgbToHsv(121, 85, 72);
assert(bH >= 10 && bH <= 34, `Brown lesion hue is in range: ${bH}`);
assert(bS > 0.20, `Brown lesion saturation > 0.20: ${bS}`);
assert(bV >= 0.18 && bV <= 0.75, `Brown lesion value in range: ${bV}`);

// (d) Dark Water-Soaked Necrosis: e.g. #27272a (R=39, G=39, B=42)
const [dwH, dwS, dwV] = rgbToHsv(39, 39, 42);
assert(dwV >= 0.10 && dwV <= 0.32, `Dark necrosis value in range: ${dwV}`);
assert(dwS < 0.45, `Dark necrosis saturation < 0.45: ${dwS}`);

// 2. Test Background Filtering Rules
// (a) Transparent pixel: handled by alpha < 128
// (b) Pure white: #ffffff (R=255, G=255, B=255 -> S=0, V=1)
const [wH, wS, wV] = rgbToHsv(255, 255, 255);
assert(wS < 0.15 && wV > 0.80, 'Pure white correctly identified as background');

// (c) Light grey studio background: #eeeeee (R=238, G=238, B=238 -> S=0, V=0.93)
const [lgH, lgS, lgV] = rgbToHsv(238, 238, 238);
assert(lgS < 0.15 && lgV > 0.80, 'Light grey correctly identified as background');

// (d) Pure black studio background: #050505 (R=5, G=5, B=5 -> V=0.019)
const [bkH, bkS, bkV] = rgbToHsv(5, 5, 5);
assert(bkV < 0.10, 'Pure black correctly identified as background');

// 3. Test Sample Leaves definitions
assert(SAMPLE_LEAVES.length === 3, 'All 3 sample leaves present');
assert(SAMPLE_LEAVES[0].category === 'Healthy', 'Sample 0 is Healthy');
assert(SAMPLE_LEAVES[1].category === 'Early Blight', 'Sample 1 is Early Blight');
assert(SAMPLE_LEAVES[2].category === 'Late Blight', 'Sample 2 is Late Blight');

// Ensure background rect was removed and SVG is clean transparent vector
for (const sample of SAMPLE_LEAVES) {
  assert(!sample.dataUrl.includes('rect%20width%3D%22400%22%20height%3D%22400%22%20fill%3D%22url(%23bg)'), `Sample ${sample.name} has no opaque background rect`);
}

console.log('All HSV Color-Space & Lesion Classifier tests passed!');
