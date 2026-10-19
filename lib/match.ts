import { SHADES, Shade } from './shades';

// --- Hex <-> RGB ------------------------------------------------------------

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Weighted "redmean" RGB distance — cheap, perceptual-ish, good enough to rank
// foundation shades. Max possible distance ~806 (black vs white).
export function colorDistance(hexA: string, hexB: string): number {
  const [r1, g1, b1] = hexToRgb(hexA);
  const [r2, g2, b2] = hexToRgb(hexB);
  const rMean = (r1 + r2) / 2;
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return Math.sqrt(
    (2 + rMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - rMean) / 256) * db * db,
  );
}

export interface MatchedShade extends Shade {
  distance: number;
  /** 0–100, higher = closer match */
  matchPercent: number;
}

function toPercent(distance: number): number {
  return Math.max(0, Math.round(100 - distance / 8.06));
}

// --- Matching ---------------------------------------------------------------

export function findNearestShades(skinHex: string, n = 3): MatchedShade[] {
  return SHADES.map((shade) => {
    const distance = colorDistance(skinHex, shade.hex);
    return { ...shade, distance, matchPercent: toPercent(distance) };
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
  label: string;
  /** one-liner the UI can show */
  tip: string;
}

// Depth gets you close; undertone is why a shade looks ashy or glowing.
// Warm skin carries more red/yellow relative to blue; cool skin is pinker.
export function analyzeUndertone(skinHex: string): UndertoneResult {
  const [r, , b] = hexToRgb(skinHex);
  const warmth = (r - b) / Math.max(r, 1); // ~0..1 for skin tones
  if (warmth > 0.38) {
    return {
      undertone: 'warm',
      confidence: Math.min(99, Math.round(55 + (warmth - 0.38) * 160)),
      label: 'Warm',
      tip: 'Golden / yellow base — look for shades labeled W, Warm, or Golden.',
    };
  }
  if (warmth < 0.2) {
    return {
      undertone: 'cool',
      confidence: Math.min(99, Math.round(55 + (0.2 - warmth) * 160)),
      label: 'Cool',
      tip: 'Pink / rosy base — look for shades labeled C, Cool, or Rosy.',
    };
  }
  return {
    undertone: 'neutral',
    confidence: 72,
    label: 'Neutral',
    tip: 'Balanced base — neutral (N) shades are your safest bet.',
  };
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
