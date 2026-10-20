import { SHADES, Shade } from './shades';

// --- Hex <-> RGB ------------------------------------------------------------

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// --- CIELAB -----------------------------------------------------------------
// Proper color science: convert sRGB -> XYZ (D65) -> CIELAB, the space the
// cosmetics industry actually uses. Distances here are perceptual delta E,
// and undertone comes from the hue angle, not a red-minus-blue shortcut.

export interface Lab {
  L: number;
  a: number;
  b: number;
}

export function hexToLab(hex: string): Lab {
  const [r8, g8, b8] = hexToRgb(hex);
  const linear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  const r = linear(r8);
  const g = linear(g8);
  const b = linear(b8);
  // sRGB -> XYZ
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

/** CIELAB delta E (CIE76) — 0 = identical, ~2.3 = just-noticeable difference. */
export function colorDistance(hexA: string, hexB: string): number {
  const p = hexToLab(hexA);
  const q = hexToLab(hexB);
  return Math.sqrt((p.L - q.L) ** 2 + (p.a - q.a) ** 2 + (p.b - q.b) ** 2);
}

export interface MatchedShade extends Shade {
  distance: number;
  /** 0–100, higher = closer match */
  matchPercent: number;
}

function toPercent(distance: number): number {
  // delta E scale: 0 = perfect, ~55+ = a different color family entirely.
  return Math.max(0, Math.round(100 - distance * 1.8));
}

// --- Matching ---------------------------------------------------------------

export function findNearestShades(skinHex: string, n = 3): MatchedShade[] {
  const skinTone = analyzeUndertone(skinHex).undertone;
  return SHADES.map((shade) => {
    const distance = colorDistance(skinHex, shade.hex);
    const shadeTone = analyzeUndertone(shade.hex).undertone;
    // Undertone agreement earns a ranking bonus: a shade that flatters your
    // undertone outranks a marginally closer depth that would look ashy.
    // Neutral flatters everyone, so it always counts as aligned.
    const aligned =
      skinTone === shadeTone || skinTone === 'neutral' || shadeTone === 'neutral';
    const ranked = aligned ? distance * 0.92 : distance;
    return { ...shade, distance: ranked, matchPercent: toPercent(ranked) };
  })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, n);
}

// --- Undertone --------------------------------------------------------------

export type Undertone = 'warm' | 'neutral' | 'cool';

export interface UndertoneResult {
  undertone: Undertone;
  /** 0–100 confidence */
  confidence: number;
  /** CIELAB hue angle in degrees — the science behind the call */
  hueAngle: number;
  label: string;
  /** one-liner the UI can show */
  tip: string;
}

// Depth gets you close; undertone is why a shade looks ashy or glowing.
// In CIELAB, skin hue angles run ~10° (rosy/red) to ~65° (golden/yellow):
// high angle = warm, low angle = cool, the middle = neutral.
export function analyzeUndertone(skinHex: string): UndertoneResult {
  const { a, b } = hexToLab(skinHex);
  let hue = (Math.atan2(b, a) * 180) / Math.PI;
  if (hue < 0) hue += 360;
  const hueAngle = Math.round(hue);
  if (hue >= 45) {
    return {
      undertone: 'warm',
      confidence: Math.min(99, Math.round(60 + (hue - 45) * 2)),
      hueAngle,
      label: 'Warm',
      tip: 'Golden / yellow base — look for shades labeled W, Warm, or Golden.',
    };
  }
  if (hue <= 32) {
    return {
      undertone: 'cool',
      confidence: Math.min(99, Math.round(60 + (32 - hue) * 2)),
      hueAngle,
      label: 'Cool',
      tip: 'Pink / rosy base — look for shades labeled C, Cool, or Rosy.',
    };
  }
  return {
    undertone: 'neutral',
    confidence: 74,
    hueAngle,
    label: 'Neutral',
    tip: 'Balanced base — neutral (N) shades are your safest bet.',
  };
}

// --- Concealer ---------------------------------------------------------------
// Concealer rule every makeup artist uses: same family, a few steps lighter
// (to brighten) — in CIELAB terms, L* roughly +5 to +16 over your skin.

export function findConcealerShade(skinHex: string): Shade | null {
  const skinL = hexToLab(skinHex).L;
  const candidates = SHADES.filter((s) => {
    const dL = hexToLab(s.hex).L - skinL;
    return dL >= 5 && dL <= 16;
  }).sort((a, b) => colorDistance(skinHex, a.hex) - colorDistance(skinHex, b.hex));
  return candidates[0] ?? null;
}

// --- Explainability ---------------------------------------------------------

export interface MatchExplanation {
  /** 0–100: how close the shade's depth is */
  depthScore: number;
  /** true when undertones agree (neutral flatters everyone) */
  undertoneAligned: boolean;
  /** e.g. "Warm ↔ Warm" */
  undertonePair: string;
}

export function explainMatch(skinHex: string, shade: Shade): MatchExplanation {
  const depthScore = toPercent(colorDistance(skinHex, shade.hex));
  const skin = analyzeUndertone(skinHex).undertone;
  const shadeTone = analyzeUndertone(shade.hex).undertone;
  const aligned = skin === shadeTone || skin === 'neutral' || shadeTone === 'neutral';
  const cap = (u: Undertone) => u[0].toUpperCase() + u.slice(1);
  return { depthScore, undertoneAligned: aligned, undertonePair: `${cap(skin)} ↔ ${cap(shadeTone)}` };
}
