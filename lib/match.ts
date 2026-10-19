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
