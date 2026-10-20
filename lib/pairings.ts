// Lip shades that flatter each undertone — turns a foundation match into a
// complete look. Hexes are approximate, like the foundation catalog.
import { Undertone } from './match';

export interface LipShade {
  brand: string;
  name: string;
  hex: string;
  note: string;
}

const PAIRINGS: Record<Undertone, LipShade[]> = {
  warm: [
    { brand: 'MAC', name: 'Chili', hex: '#a63d2a', note: 'Warm brick red — your undertone’s best friend' },
    { brand: 'MAC', name: 'Lady Danger', hex: '#c1442e', note: 'Vivid orange-red for bold days' },
    { brand: 'Fenty Beauty', name: 'Freckle Fiesta', hex: '#b05c33', note: 'Terracotta nude, glows on golden skin' },
    { brand: 'MAC', name: 'Taupe', hex: '#8a5a44', note: 'Warm brown nude for every day' },
  ],
  cool: [
    { brand: 'MAC', name: 'Ruby Woo', hex: '#a4123f', note: 'The classic blue-red — makes teeth look whiter' },
    { brand: 'MAC', name: 'Diva', hex: '#6e2434', note: 'Deep burgundy, rich on rosy undertones' },
    { brand: 'Fenty Beauty', name: 'Grise', hex: '#7a4a56', note: 'Muted mauve for a soft finish' },
    { brand: 'MAC', name: 'Mehr', hex: '#a05a68', note: 'Cool pink nude that never washes you out' },
  ],
  neutral: [
    { brand: 'MAC', name: 'Velvet Teddy', hex: '#a06a52', note: 'The neutral nude that suits almost everyone' },
    { brand: 'MAC', name: 'Whirl', hex: '#8a5a4a', note: 'Rosewood — polished without trying' },
    { brand: 'Fenty Beauty', name: 'MVP', hex: '#a01830', note: 'Blue-red that reads neutral on balanced skin' },
    { brand: 'MAC', name: 'Brick-o-la', hex: '#9c4a3a', note: 'Soft brick — warm or cool, it works' },
  ],
};

export function lipPairingsFor(undertone: Undertone): LipShade[] {
  return PAIRINGS[undertone];
}
