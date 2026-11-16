/**
 * Preset sample leaf images encoded as SVG Data URIs.
 * Allows instant, zero-friction testing of all three disease classes
 * directly inside the browser without requiring external image downloads.
 *
 * Backgrounds are transparent so canvas background segmentation cleanly
 * isolates the leaf blade without background interference.
 */

export interface SampleLeaf {
  id: string;
  name: string;
  category: 'Healthy' | 'Early Blight' | 'Late Blight';
  description: string;
  dataUrl: string;
}

// ── 1. Healthy Leaf SVG (Lush Uniform Green, Zero Lesions, Transparent Canvas) ─
const HEALTHY_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <radialGradient id="healthyGrad" cx="45%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#4caf50"/>
      <stop offset="45%" stop-color="#388e3c"/>
      <stop offset="85%" stop-color="#2e7d32"/>
      <stop offset="100%" stop-color="#1b5e20"/>
    </radialGradient>
    <linearGradient id="healthyVein" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#81c784" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#4caf50" stop-opacity="0.5"/>
    </linearGradient>
  </defs>

  <!-- Petiole / Stem -->
  <path d="M 200 370 Q 200 320 200 270" stroke="#388e3c" stroke-width="8" stroke-linecap="round" fill="none"/>

  <!-- Main Leaf Blade -->
  <path d="M 200 35
           C 270 75, 345 135, 335 230
           C 325 295, 265 335, 200 355
           C 135 335, 75 295, 65 230
           C 55 135, 130 75, 200 35 Z"
        fill="url(#healthyGrad)"
        stroke="#2e7d32"
        stroke-width="3"/>

  <!-- Leaf Vein Architecture -->
  <path d="M 200 45 Q 200 200 200 350" stroke="url(#healthyVein)" stroke-width="4.5" stroke-linecap="round" fill="none"/>
  
  <!-- Right Veins -->
  <path d="M 200 110 Q 245 125 285 140" stroke="url(#healthyVein)" stroke-width="3" fill="none"/>
  <path d="M 200 155 Q 255 175 305 195" stroke="url(#healthyVein)" stroke-width="3" fill="none"/>
  <path d="M 200 205 Q 265 225 300 250" stroke="url(#healthyVein)" stroke-width="3" fill="none"/>
  <path d="M 200 250 Q 250 270 270 295" stroke="url(#healthyVein)" stroke-width="2.5" fill="none"/>

  <!-- Left Veins -->
  <path d="M 200 110 Q 155 125 115 140" stroke="url(#healthyVein)" stroke-width="3" fill="none"/>
  <path d="M 200 155 Q 145 175 95 195" stroke="url(#healthyVein)" stroke-width="3" fill="none"/>
  <path d="M 200 205 Q 135 225 100 250" stroke="url(#healthyVein)" stroke-width="3" fill="none"/>
  <path d="M 200 250 Q 150 270 130 295" stroke="url(#healthyVein)" stroke-width="2.5" fill="none"/>

  <!-- Healthy Leaf Texture -->
  <ellipse cx="170" cy="180" rx="45" ry="75" transform="rotate(-15 170 180)" fill="#66bb6a" opacity="0.3"/>
  <ellipse cx="230" cy="180" rx="45" ry="75" transform="rotate(15 230 180)" fill="#66bb6a" opacity="0.3"/>
</svg>
`.trim();

// ── 2. Early Blight Leaf SVG (Concentric Target Spots + Yellow Chlorosis Halos) 
const EARLY_BLIGHT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <radialGradient id="leafGrad2" cx="45%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#4caf50"/>
      <stop offset="50%" stop-color="#388e3c"/>
      <stop offset="85%" stop-color="#2e7d32"/>
      <stop offset="100%" stop-color="#1b5e20"/>
    </radialGradient>
    <radialGradient id="targetHalo1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#5d4037"/>
      <stop offset="45%" stop-color="#795548"/>
      <stop offset="68%" stop-color="#fdd835"/>
      <stop offset="100%" stop-color="#fbc02d"/>
    </radialGradient>
    <radialGradient id="targetHalo2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#4e342e"/>
      <stop offset="50%" stop-color="#6d4c41"/>
      <stop offset="70%" stop-color="#fbc02d"/>
      <stop offset="100%" stop-color="#fdd835"/>
    </radialGradient>
  </defs>

  <!-- Petiole / Stem -->
  <path d="M 200 370 Q 200 320 200 270" stroke="#388e3c" stroke-width="8" stroke-linecap="round" fill="none"/>

  <!-- Main Leaf Blade -->
  <path d="M 200 35
           C 270 75, 345 135, 335 230
           C 325 295, 265 335, 200 355
           C 135 335, 75 295, 65 230
           C 55 135, 130 75, 200 35 Z"
        fill="url(#leafGrad2)"
        stroke="#2e7d32"
        stroke-width="3"/>

  <!-- Leaf Vein Architecture -->
  <path d="M 200 45 Q 200 200 200 350" stroke="#81c784" stroke-width="4" stroke-linecap="round" opacity="0.6" fill="none"/>
  <path d="M 200 110 Q 245 125 285 140" stroke="#81c784" stroke-width="2.5" opacity="0.6" fill="none"/>
  <path d="M 200 155 Q 255 175 305 195" stroke="#81c784" stroke-width="2.5" opacity="0.6" fill="none"/>
  <path d="M 200 110 Q 155 125 115 140" stroke="#81c784" stroke-width="2.5" opacity="0.6" fill="none"/>
  <path d="M 200 155 Q 145 175 95 195" stroke="#81c784" stroke-width="2.5" opacity="0.6" fill="none"/>

  <!-- Broad Yellow Chlorosis Patches (Halos on Lower Leaves) -->
  <path d="M 110 220 C 150 250, 190 280, 180 320 C 130 330, 90 290, 80 250 Z" fill="#fbc02d" opacity="0.95"/>
  <path d="M 230 200 C 270 230, 310 260, 300 300 C 260 320, 220 290, 210 250 Z" fill="#fdd835" opacity="0.95"/>

  <!-- Primary Alternaria solani Target Spot 1 (Lower Left: Rings + Halo) -->
  <ellipse cx="140" cy="250" rx="44" ry="40" fill="url(#targetHalo1)"/>
  <!-- Concentric Rings -->
  <circle cx="140" cy="250" r="30" stroke="#8d6e63" stroke-width="3.5" fill="none"/>
  <circle cx="140" cy="250" r="20" stroke="#5d4037" stroke-width="3" fill="none"/>
  <circle cx="140" cy="250" r="11" stroke="#4e342e" stroke-width="2.5" fill="#3e2723"/>

  <!-- Target Spot 2 (Lower Right: Rings + Halo) -->
  <ellipse cx="255" cy="245" rx="38" ry="34" fill="url(#targetHalo2)"/>
  <circle cx="255" cy="245" r="24" stroke="#8d6e63" stroke-width="3" fill="none"/>
  <circle cx="255" cy="245" r="15" stroke="#5d4037" stroke-width="2.5" fill="none"/>
  <circle cx="255" cy="245" r="7" stroke="#4e342e" stroke-width="2" fill="#3e2723"/>

  <!-- Satellite Lesion 3 (Mid Leaf) -->
  <ellipse cx="175" cy="145" rx="24" ry="20" fill="url(#targetHalo1)"/>
  <circle cx="175" cy="145" r="12" stroke="#6d4c41" stroke-width="2.5" fill="none"/>
  <circle cx="175" cy="145" r="5" fill="#3e2723"/>

  <!-- Satellite Lesion 4 (Mid Right) -->
  <ellipse cx="250" cy="160" rx="20" ry="18" fill="url(#targetHalo2)"/>
  <circle cx="250" cy="160" r="9" stroke="#6d4c41" stroke-width="2" fill="none"/>
  <circle cx="250" cy="160" r="4" fill="#3e2723"/>
</svg>
`.trim();

// ── 3. Late Blight Leaf SVG (Water-Soaked Dark Margin Necrosis) ───────────────
const LATE_BLIGHT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <radialGradient id="leafGrad3" cx="45%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#4caf50"/>
      <stop offset="50%" stop-color="#388e3c"/>
      <stop offset="85%" stop-color="#2e7d32"/>
      <stop offset="100%" stop-color="#1b5e20"/>
    </radialGradient>
    <!-- Water-soaked necrotic lesion gradient -->
    <radialGradient id="waterSoaked" cx="40%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="35%" stop-color="#27272a"/>
      <stop offset="65%" stop-color="#1e293b"/>
      <stop offset="85%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#27272a"/>
    </radialGradient>
  </defs>

  <!-- Petiole / Stem -->
  <path d="M 200 370 Q 200 320 200 270" stroke="#334155" stroke-width="8" stroke-linecap="round" fill="none"/>

  <!-- Main Leaf Blade -->
  <path d="M 200 35
           C 270 75, 345 135, 335 230
           C 325 295, 265 335, 200 355
           C 135 335, 75 295, 65 230
           C 55 135, 130 75, 200 35 Z"
        fill="url(#leafGrad3)"
        stroke="#27272a"
        stroke-width="3"/>

  <!-- Leaf Vein Architecture -->
  <path d="M 200 45 Q 200 200 200 350" stroke="#81c784" stroke-width="4" opacity="0.4" fill="none"/>
  <path d="M 200 110 Q 245 125 285 140" stroke="#81c784" stroke-width="2.5" opacity="0.4" fill="none"/>
  <path d="M 200 155 Q 255 175 305 195" stroke="#81c784" stroke-width="2.5" opacity="0.4" fill="none"/>

  <!-- Late Blight: Large Water-Soaked Dark Margin Collapse (Apex) -->
  <path d="M 200 35 C 235 65, 260 100, 235 140 C 210 165, 175 145, 155 105 C 145 70, 170 45, 200 35 Z"
        fill="url(#waterSoaked)"/>

  <!-- Large Right Lateral Water-Soaked Necrosis -->
  <path d="M 235 135
           C 310 155, 345 205, 335 260
           C 315 295, 265 305, 215 265
           C 195 235, 205 195, 220 165 Z"
        fill="url(#waterSoaked)"/>

  <!-- Left Irregular Water-Soaked Collapse -->
  <path d="M 75 185
           C 60 240, 95 300, 155 285
           C 175 270, 165 230, 135 195
           C 110 165, 90 155, 75 185 Z"
        fill="url(#waterSoaked)"/>

  <!-- Core Black Necrotic Patches -->
  <path d="M 245 180 C 290 195, 310 235, 285 260 C 255 270, 235 240, 245 180 Z" fill="#18181b"/>
  <path d="M 190 65 C 215 75, 210 110, 190 120 C 170 110, 165 85, 190 65 Z" fill="#18181b"/>
  <path d="M 95 210 C 115 225, 125 255, 105 270 C 85 260, 80 235, 95 210 Z" fill="#18181b"/>

  <!-- Pale Sporulation Border Zone -->
  <path d="M 215 165 Q 195 225 215 265" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="4,2" fill="none" opacity="0.7"/>
  <path d="M 155 105 Q 185 140 235 135" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="4,2" fill="none" opacity="0.7"/>
</svg>
`.trim();

function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_LEAVES: SampleLeaf[] = [
  {
    id: 'sample-healthy',
    name: 'Healthy Leaf',
    category: 'Healthy',
    description: 'Uniform emerald lamina, continuous interveinal tissue, zero necrotic lesions.',
    dataUrl: svgToDataUrl(HEALTHY_SVG),
  },
  {
    id: 'sample-early-blight',
    name: 'Early Blight',
    category: 'Early Blight',
    description: 'Alternaria solani: Concentric target-spots with distinct chlorotic yellow halos.',
    dataUrl: svgToDataUrl(EARLY_BLIGHT_SVG),
  },
  {
    id: 'sample-late-blight',
    name: 'Late Blight',
    category: 'Late Blight',
    description: 'Phytophthora infestans: Water-soaked dark necrotic margin collapse.',
    dataUrl: svgToDataUrl(LATE_BLIGHT_SVG),
  },
];
