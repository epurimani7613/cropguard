/**
 * Preset sample leaf images encoded as SVG Data URIs.
 * Allows instant, zero-friction testing of all three disease classes
 * directly inside the browser without requiring external image downloads.
 */

export interface SampleLeaf {
  id: string;
  name: string;
  category: 'Healthy' | 'Early Blight' | 'Late Blight';
  description: string;
  dataUrl: string;
}

// ── 1. Healthy Leaf SVG ──────────────────────────────────────────────────────
const HEALTHY_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141e1b"/>
      <stop offset="100%" stop-color="#0c1412"/>
    </linearGradient>
    <radialGradient id="leafGrad" cx="45%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#4caf50"/>
      <stop offset="45%" stop-color="#2e7d32"/>
      <stop offset="85%" stop-color="#1b5e20"/>
      <stop offset="100%" stop-color="#0f3813"/>
    </radialGradient>
    <linearGradient id="veinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#81c784" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#388e3c" stop-opacity="0.4"/>
    </linearGradient>
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.4"/>
    </filter>
  </defs>

  <rect width="400" height="400" fill="url(#bg)"/>

  <!-- Petiole / Stem -->
  <path d="M 200 370 Q 200 320 200 270" stroke="#558b2f" stroke-width="6" stroke-linecap="round" fill="none"/>

  <!-- Main Leaf Blade -->
  <path d="M 200 40
           C 260 80, 340 140, 330 230
           C 320 290, 260 330, 200 350
           C 140 330, 80 290, 70 230
           C 60 140, 140 80, 200 40 Z"
        fill="url(#leafGrad)"
        filter="url(#softGlow)"
        stroke="#43a047"
        stroke-width="2"/>

  <!-- Leaf Vein Architecture -->
  <path d="M 200 50 Q 200 200 200 345" stroke="url(#veinGrad)" stroke-width="4" stroke-linecap="round" fill="none"/>
  
  <!-- Right Veins -->
  <path d="M 200 110 Q 240 120 280 135" stroke="url(#veinGrad)" stroke-width="2.5" fill="none"/>
  <path d="M 200 150 Q 250 170 300 190" stroke="url(#veinGrad)" stroke-width="2.5" fill="none"/>
  <path d="M 200 195 Q 260 220 295 245" stroke="url(#veinGrad)" stroke-width="2.5" fill="none"/>
  <path d="M 200 240 Q 250 265 270 290" stroke="url(#veinGrad)" stroke-width="2" fill="none"/>

  <!-- Left Veins -->
  <path d="M 200 110 Q 160 120 120 135" stroke="url(#veinGrad)" stroke-width="2.5" fill="none"/>
  <path d="M 200 150 Q 150 170 100 190" stroke="url(#veinGrad)" stroke-width="2.5" fill="none"/>
  <path d="M 200 195 Q 140 220 105 245" stroke="url(#veinGrad)" stroke-width="2.5" fill="none"/>
  <path d="M 200 240 Q 150 265 130 290" stroke="url(#veinGrad)" stroke-width="2" fill="none"/>

  <!-- Secondary Lateral Micro-veins -->
  <path d="M 240 120 Q 260 105 275 112" stroke="url(#veinGrad)" stroke-width="1.2" fill="none"/>
  <path d="M 250 170 Q 275 160 290 168" stroke="url(#veinGrad)" stroke-width="1.2" fill="none"/>
  <path d="M 160 120 Q 140 105 125 112" stroke="url(#veinGrad)" stroke-width="1.2" fill="none"/>
  <path d="M 150 170 Q 125 160 110 168" stroke="url(#veinGrad)" stroke-width="1.2" fill="none"/>

  <!-- Subtle Healthy Translucent Chlorophyll Highlight -->
  <ellipse cx="170" cy="180" rx="45" ry="75" transform="rotate(-15 170 180)" fill="#66bb6a" opacity="0.25"/>
</svg>
`.trim();

// ── 2. Early Blight Leaf SVG (Target Concentric Rings + Yellow Chlorosis Halos) ─
const EARLY_BLIGHT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141e1b"/>
      <stop offset="100%" stop-color="#0c1412"/>
    </linearGradient>
    <radialGradient id="leafGrad2" cx="45%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#4caf50"/>
      <stop offset="50%" stop-color="#2e7d32"/>
      <stop offset="90%" stop-color="#1b5e20"/>
      <stop offset="100%" stop-color="#0f3813"/>
    </radialGradient>
    <radialGradient id="targetHalo1" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#3e2723"/>
      <stop offset="35%" stop-color="#5d4037"/>
      <stop offset="55%" stop-color="#8d6e63"/>
      <stop offset="72%" stop-color="#fdd835"/>
      <stop offset="90%" stop-color="#ffee58" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="#ffee58" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="targetHalo2" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#27130b"/>
      <stop offset="40%" stop-color="#4e342e"/>
      <stop offset="65%" stop-color="#6d4c41"/>
      <stop offset="80%" stop-color="#fbc02d"/>
      <stop offset="100%" stop-color="#fff59d" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="targetHalo3" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#3e2723"/>
      <stop offset="45%" stop-color="#6d4c41"/>
      <stop offset="75%" stop-color="#fdd835"/>
      <stop offset="100%" stop-color="#fff59d" stop-opacity="0"/>
    </radialGradient>
  </defs>

  <rect width="400" height="400" fill="url(#bg2)"/>

  <!-- Petiole / Stem -->
  <path d="M 200 370 Q 200 320 200 270" stroke="#558b2f" stroke-width="6" stroke-linecap="round" fill="none"/>

  <!-- Main Leaf Blade -->
  <path d="M 200 40
           C 260 80, 340 140, 330 230
           C 320 290, 260 330, 200 350
           C 140 330, 80 290, 70 230
           C 60 140, 140 80, 200 40 Z"
        fill="url(#leafGrad2)"
        stroke="#43a047"
        stroke-width="2"/>

  <!-- Leaf Vein Architecture -->
  <path d="M 200 50 Q 200 200 200 345" stroke="#81c784" stroke-width="4" stroke-linecap="round" opacity="0.6" fill="none"/>
  <path d="M 200 110 Q 240 120 280 135" stroke="#81c784" stroke-width="2.5" opacity="0.6" fill="none"/>
  <path d="M 200 150 Q 250 170 300 190" stroke="#81c784" stroke-width="2.5" opacity="0.6" fill="none"/>
  <path d="M 200 195 Q 260 220 295 245" stroke="#81c784" stroke-width="2.5" opacity="0.6" fill="none"/>
  <path d="M 200 110 Q 160 120 120 135" stroke="#81c784" stroke-width="2.5" opacity="0.6" fill="none"/>
  <path d="M 200 150 Q 150 170 100 190" stroke="#81c784" stroke-width="2.5" opacity="0.6" fill="none"/>
  <path d="M 200 195 Q 140 220 105 245" stroke="#81c784" stroke-width="2.5" opacity="0.6" fill="none"/>

  <!-- Yellow Chlorosis Background Wash on Lower Leaf Lobes -->
  <path d="M 120 230 Q 160 270 200 290 Q 140 320 100 270 Z" fill="#fbc02d" opacity="0.55"/>
  <path d="M 240 210 Q 280 250 290 280 Q 240 290 210 270 Z" fill="#fbc02d" opacity="0.45"/>

  <!-- Primary Alternaria Solani Target Spot Lesion 1 (Lower Left) -->
  <ellipse cx="145" cy="240" rx="42" ry="38" fill="url(#targetHalo1)"/>
  <!-- Concentric Rings (Concentric Target Pattern) -->
  <circle cx="145" cy="240" r="28" stroke="#795548" stroke-width="2.5" fill="none" opacity="0.85"/>
  <circle cx="145" cy="240" r="20" stroke="#4e342e" stroke-width="2" fill="none" opacity="0.9"/>
  <circle cx="145" cy="240" r="12" stroke="#27130b" stroke-width="2" fill="none" opacity="0.95"/>
  <circle cx="145" cy="240" r="5" fill="#1b0000"/>

  <!-- Target Spot Lesion 2 (Lower Right) -->
  <ellipse cx="250" cy="235" rx="35" ry="32" fill="url(#targetHalo2)"/>
  <circle cx="250" cy="235" r="22" stroke="#6d4c41" stroke-width="2" fill="none" opacity="0.85"/>
  <circle cx="250" cy="235" r="14" stroke="#3e2723" stroke-width="2" fill="none" opacity="0.9"/>
  <circle cx="250" cy="235" r="5" fill="#1b0000"/>

  <!-- Smaller Satellite Lesion 3 (Mid-Upper) -->
  <ellipse cx="170" cy="140" rx="22" ry="20" fill="url(#targetHalo3)"/>
  <circle cx="170" cy="140" r="11" stroke="#4e342e" stroke-width="1.8" fill="none"/>
  <circle cx="170" cy="140" r="4" fill="#21100b"/>

  <!-- Small Satellite Lesion 4 (Margin) -->
  <ellipse cx="265" cy="165" rx="16" ry="14" fill="url(#targetHalo3)"/>
  <circle cx="265" cy="165" r="7" stroke="#3e2723" stroke-width="1.5" fill="none"/>
</svg>
`.trim();

// ── 3. Late Blight Leaf SVG (Water-Soaked Dark Margin Necrosis) ───────────────
const LATE_BLIGHT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141e1b"/>
      <stop offset="100%" stop-color="#0c1412"/>
    </linearGradient>
    <radialGradient id="leafGrad3" cx="45%" cy="40%" r="65%">
      <stop offset="0%" stop-color="#4caf50"/>
      <stop offset="50%" stop-color="#2e7d32"/>
      <stop offset="85%" stop-color="#1b5e20"/>
      <stop offset="100%" stop-color="#0f3813"/>
    </radialGradient>
    <!-- Water-soaked necrotic lesion gradient -->
    <radialGradient id="waterSoaked" cx="40%" cy="40%" r="70%">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="35%" stop-color="#292524"/>
      <stop offset="65%" stop-color="#44403c"/>
      <stop offset="85%" stop-color="#4d4c38"/>
      <stop offset="95%" stop-color="#84cc16" stop-opacity="0.4"/>
      <stop offset="100%" stop-color="#84cc16" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="paleMargin" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1c1917"/>
      <stop offset="70%" stop-color="#3f3f46"/>
      <stop offset="88%" stop-color="#a3e635" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect width="400" height="400" fill="url(#bg3)"/>

  <!-- Petiole / Stem -->
  <path d="M 200 370 Q 200 320 200 270" stroke="#334155" stroke-width="6" stroke-linecap="round" fill="none"/>

  <!-- Main Leaf Blade -->
  <path d="M 200 40
           C 260 80, 340 140, 330 230
           C 320 290, 260 330, 200 350
           C 140 330, 80 290, 70 230
           C 60 140, 140 80, 200 40 Z"
        fill="url(#leafGrad3)"
        stroke="#334155"
        stroke-width="2"/>

  <!-- Primary Leaf Vein Architecture -->
  <path d="M 200 50 Q 200 200 200 345" stroke="#4ade80" stroke-width="3.5" opacity="0.4" fill="none"/>
  <path d="M 200 110 Q 240 120 280 135" stroke="#4ade80" stroke-width="2" opacity="0.4" fill="none"/>
  <path d="M 200 150 Q 250 170 300 190" stroke="#4ade80" stroke-width="2" opacity="0.4" fill="none"/>
  <path d="M 200 110 Q 160 120 120 135" stroke="#4ade80" stroke-width="2" opacity="0.4" fill="none"/>

  <!-- Late Blight: Large Water-Soaked Irregular Lesion advancing from Tip & Margins -->
  <!-- Top apex collapse -->
  <path d="M 200 40 C 230 65, 250 95, 230 130 C 210 160, 175 145, 160 110 C 150 75, 175 50, 200 40 Z"
        fill="url(#waterSoaked)"/>

  <!-- Large Right Lateral Margin Water-Soaked Collapse -->
  <path d="M 240 130
           C 310 150, 345 200, 330 250
           C 310 290, 270 295, 220 260
           C 200 230, 210 190, 220 160
           C 230 140, 235 130, 240 130 Z"
        fill="url(#waterSoaked)"/>

  <!-- Left Irregular Water-Soaked Spreading Margin -->
  <path d="M 80 190
           C 65 240, 100 290, 150 280
           C 170 270, 165 230, 140 200
           C 115 170, 95 160, 80 190 Z"
        fill="url(#waterSoaked)"/>

  <!-- Wet Black Core Necrosis Areas -->
  <path d="M 255 180 C 290 190, 310 230, 290 250 C 265 265, 245 235, 255 180 Z" fill="#09090b" opacity="0.88"/>
  <path d="M 190 70 C 215 80, 210 110, 190 120 C 175 110, 170 85, 190 70 Z" fill="#09090b" opacity="0.85"/>
  <path d="M 100 220 C 120 230, 130 260, 110 270 C 90 260, 85 240, 100 220 Z" fill="#09090b" opacity="0.82"/>

  <!-- Pale Oomycete Sporulation / Margin Advance Zone -->
  <path d="M 220 160 Q 200 220 220 260" stroke="#cbd5e1" stroke-width="2.5" stroke-dasharray="3,2" fill="none" opacity="0.6"/>
  <path d="M 160 110 Q 190 140 230 130" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="3,2" fill="none" opacity="0.5"/>
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
    description: 'Uniform emerald lamina, continuous interveinal tissue, no necrotic lesions.',
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

