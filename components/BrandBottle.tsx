/**
 * BrandBottle — crisp SVG bottle illustrations for every brand in the catalog.
 * Each brand gets its own distinctive silhouette and color palette so users can
 * visually identify products at a glance without needing external image files.
 */
import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

interface Props {
  brand: string;
  shadeHex: string;
  size?: number; // width; height = size * 1.4
}

// ─── Fenty Beauty ────────────────────────────────────────────────────────────
// Slim matte black pump bottle with gold pump head
function FentyBottle({ hex, w, h }: { hex: string; w: number; h: number }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 60 84">
      <Defs>
        <LinearGradient id="fb_body" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#1a1a1a" />
          <Stop offset="0.45" stopColor="#2e2e2e" />
          <Stop offset="1" stopColor="#111111" />
        </LinearGradient>
        <LinearGradient id="fb_pump" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#c9a84c" />
          <Stop offset="1" stopColor="#e8c96a" />
        </LinearGradient>
      </Defs>
      {/* pump stem */}
      <Rect x="27" y="2" width="6" height="22" rx="3" fill="url(#fb_pump)" />
      {/* pump head */}
      <Rect x="20" y="2" width="20" height="8" rx="4" fill="url(#fb_pump)" />
      {/* bottle body */}
      <Rect x="10" y="22" width="40" height="56" rx="6" fill="url(#fb_body)" />
      {/* shine */}
      <Rect x="14" y="26" width="5" height="40" rx="2.5" fill="rgba(255,255,255,0.07)" />
      {/* shade swatch */}
      <Rect x="10" y="62" width="40" height="16" rx="0" fill={hex} opacity="0.9" />
      <Rect x="10" y="72" width="40" height="6" rx="6" fill={hex} />
      {/* label text */}
      <SvgText x="30" y="50" fontSize="6" fill="#c9a84c" textAnchor="middle" fontWeight="bold">
        FENTY
      </SvgText>
    </Svg>
  );
}

// ─── NARS ─────────────────────────────────────────────────────────────────────
// Iconic black square-ish bottle with white NARS lettering
function NarsBottle({ hex, w, h }: { hex: string; w: number; h: number }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 60 84">
      <Defs>
        <LinearGradient id="nb_body" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#0d0d0d" />
          <Stop offset="0.5" stopColor="#222222" />
          <Stop offset="1" stopColor="#0a0a0a" />
        </LinearGradient>
      </Defs>
      {/* cap */}
      <Rect x="14" y="4" width="32" height="18" rx="4" fill="#1a1a1a" />
      {/* body */}
      <Rect x="10" y="20" width="40" height="58" rx="4" fill="url(#nb_body)" />
      {/* shine stripe */}
      <Rect x="13" y="22" width="4" height="50" rx="2" fill="rgba(255,255,255,0.06)" />
      {/* shade band */}
      <Rect x="10" y="64" width="40" height="14" rx="0" fill={hex} opacity="0.92" />
      <Rect x="10" y="72" width="40" height="6" rx="4" fill={hex} />
      {/* NARS label */}
      <SvgText x="30" y="48" fontSize="7" fill="#ffffff" textAnchor="middle" fontWeight="bold" letterSpacing="2">
        NARS
      </SvgText>
    </Svg>
  );
}

// ─── MAC ──────────────────────────────────────────────────────────────────────
// Cylindrical gunmetal bottle with bold MAC logo
function MacBottle({ hex, w, h }: { hex: string; w: number; h: number }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 60 84">
      <Defs>
        <LinearGradient id="mac_body" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#3a3a3a" />
          <Stop offset="0.4" stopColor="#555555" />
          <Stop offset="1" stopColor="#2a2a2a" />
        </LinearGradient>
        <LinearGradient id="mac_cap" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#888" />
          <Stop offset="0.5" stopColor="#bbb" />
          <Stop offset="1" stopColor="#777" />
        </LinearGradient>
      </Defs>
      {/* cap */}
      <Ellipse cx="30" cy="10" rx="16" ry="10" fill="url(#mac_cap)" />
      <Rect x="14" y="10" width="32" height="14" fill="url(#mac_cap)" />
      {/* body */}
      <Rect x="12" y="22" width="36" height="56" rx="8" fill="url(#mac_body)" />
      {/* shine */}
      <Rect x="15" y="24" width="5" height="46" rx="2.5" fill="rgba(255,255,255,0.1)" />
      {/* shade band */}
      <Rect x="12" y="62" width="36" height="16" rx="0" fill={hex} opacity="0.9" />
      <Rect x="12" y="70" width="36" height="8" rx="8" fill={hex} />
      {/* MAC text */}
      <SvgText x="30" y="48" fontSize="8" fill="#ffffff" textAnchor="middle" fontWeight="bold" letterSpacing="1">
        M·A·C
      </SvgText>
    </Svg>
  );
}

// ─── Maybelline ───────────────────────────────────────────────────────────────
// White bottle with pink/magenta accent — Fit Me classic look
function MaybellineBottle({ hex, w, h }: { hex: string; w: number; h: number }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 60 84">
      <Defs>
        <LinearGradient id="may_body" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#f5f0ee" />
          <Stop offset="0.5" stopColor="#ffffff" />
          <Stop offset="1" stopColor="#ede8e5" />
        </LinearGradient>
      </Defs>
      {/* pump */}
      <Rect x="26" y="2" width="8" height="20" rx="4" fill="#c4166b" />
      <Rect x="20" y="2" width="20" height="7" rx="3.5" fill="#c4166b" />
      {/* body */}
      <Rect x="10" y="20" width="40" height="58" rx="6" fill="url(#may_body)" />
      {/* pink top stripe */}
      <Rect x="10" y="20" width="40" height="12" rx="0" fill="#c4166b" />
      <Rect x="10" y="20" width="40" height="8" rx="6" fill="#c4166b" />
      {/* shade swatch */}
      <Rect x="10" y="62" width="40" height="16" rx="0" fill={hex} opacity="0.9" />
      <Rect x="10" y="70" width="40" height="8" rx="6" fill={hex} />
      {/* label */}
      <SvgText x="30" y="48" fontSize="5" fill="#333" textAnchor="middle" fontWeight="bold">
        MAYBELLINE
      </SvgText>
      <SvgText x="30" y="56" fontSize="4.5" fill="#888" textAnchor="middle">
        FIT ME
      </SvgText>
    </Svg>
  );
}

// ─── Black Opal ───────────────────────────────────────────────────────────────
// Warm chocolate tube / stick form factor with gold accents
function BlackOpalBottle({ hex, w, h }: { hex: string; w: number; h: number }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 60 84">
      <Defs>
        <LinearGradient id="bo_body" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#3b1f0e" />
          <Stop offset="0.5" stopColor="#5c3218" />
          <Stop offset="1" stopColor="#2e1809" />
        </LinearGradient>
        <LinearGradient id="bo_gold" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#c9a84c" />
          <Stop offset="1" stopColor="#e8c96a" />
        </LinearGradient>
      </Defs>
      {/* cap top */}
      <Rect x="14" y="4" width="32" height="16" rx="5" fill="#1a0d05" />
      {/* body */}
      <Rect x="10" y="18" width="40" height="60" rx="6" fill="url(#bo_body)" />
      {/* gold band */}
      <Rect x="10" y="36" width="40" height="5" fill="url(#bo_gold)" />
      <Rect x="10" y="56" width="40" height="5" fill="url(#bo_gold)" />
      {/* shade window */}
      <Rect x="16" y="42" width="28" height="12" rx="3" fill={hex} opacity="0.95" />
      {/* brand text */}
      <SvgText x="30" y="28" fontSize="5" fill="#c9a84c" textAnchor="middle" fontWeight="bold">
        BLACK OPAL
      </SvgText>
      <SvgText x="30" y="70" fontSize="4" fill="#c9a84c" textAnchor="middle">
        TRUE COLOR
      </SvgText>
    </Svg>
  );
}

// ─── Lancôme ──────────────────────────────────────────────────────────────────
// Frosted glass rose gold cap luxury bottle
function LancomeBottle({ hex, w, h }: { hex: string; w: number; h: number }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 60 84">
      <Defs>
        <LinearGradient id="lan_body" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#e8ddd6" stopOpacity="0.85" />
          <Stop offset="0.5" stopColor="#f5ede8" stopOpacity="0.9" />
          <Stop offset="1" stopColor="#ddd0c8" stopOpacity="0.85" />
        </LinearGradient>
        <LinearGradient id="lan_cap" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#b5836a" />
          <Stop offset="0.5" stopColor="#d4a58c" />
          <Stop offset="1" stopColor="#a87060" />
        </LinearGradient>
      </Defs>
      {/* cap */}
      <Rect x="16" y="4" width="28" height="20" rx="6" fill="url(#lan_cap)" />
      {/* neck */}
      <Rect x="22" y="22" width="16" height="6" fill="#c4907a" />
      {/* body */}
      <Rect x="10" y="26" width="40" height="52" rx="8" fill="url(#lan_body)" />
      {/* subtle shine */}
      <Rect x="14" y="30" width="6" height="38" rx="3" fill="rgba(255,255,255,0.35)" />
      {/* shade band */}
      <Rect x="10" y="60" width="40" height="18" rx="0" fill={hex} opacity="0.88" />
      <Rect x="10" y="68" width="40" height="10" rx="8" fill={hex} />
      {/* label */}
      <SvgText x="30" y="46" fontSize="5.5" fill="#8b5a44" textAnchor="middle" fontWeight="bold" fontStyle="italic">
        Lancôme
      </SvgText>
    </Svg>
  );
}

// ─── L'Oréal Paris ────────────────────────────────────────────────────────────
// Classic red and gold True Match bottle
function LorealBottle({ hex, w, h }: { hex: string; w: number; h: number }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 60 84">
      <Defs>
        <LinearGradient id="lor_body" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#c8102e" />
          <Stop offset="0.4" stopColor="#e0162f" />
          <Stop offset="1" stopColor="#b00e28" />
        </LinearGradient>
        <LinearGradient id="lor_cap" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#8b0000" />
          <Stop offset="0.5" stopColor="#cc0022" />
          <Stop offset="1" stopColor="#7a0000" />
        </LinearGradient>
      </Defs>
      {/* pump */}
      <Rect x="26" y="2" width="8" height="18" rx="4" fill="#8b0000" />
      <Rect x="18" y="2" width="24" height="7" rx="3.5" fill="#8b0000" />
      {/* cap */}
      <Rect x="12" y="18" width="36" height="12" rx="3" fill="url(#lor_cap)" />
      {/* body */}
      <Rect x="10" y="28" width="40" height="50" rx="6" fill="url(#lor_body)" />
      {/* shine */}
      <Rect x="13" y="30" width="5" height="40" rx="2.5" fill="rgba(255,255,255,0.12)" />
      {/* shade band */}
      <Rect x="10" y="62" width="40" height="16" rx="0" fill={hex} opacity="0.92" />
      <Rect x="10" y="70" width="40" height="8" rx="6" fill={hex} />
      {/* label */}
      <SvgText x="30" y="44" fontSize="4.5" fill="#fff" textAnchor="middle" fontWeight="bold">
        L'ORÉAL
      </SvgText>
      <SvgText x="30" y="52" fontSize="4" fill="#ffd700" textAnchor="middle">
        TRUE MATCH
      </SvgText>
    </Svg>
  );
}

// ─── Estée Lauder ─────────────────────────────────────────────────────────────
// Signature warm champagne / beige Double Wear bottle with gold band
function EsteeLauderBottle({ hex, w, h }: { hex: string; w: number; h: number }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 60 84">
      <Defs>
        <LinearGradient id="el_body" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#c8b89a" />
          <Stop offset="0.5" stopColor="#ddd0b8" />
          <Stop offset="1" stopColor="#baa88e" />
        </LinearGradient>
        <LinearGradient id="el_gold" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#b8860b" />
          <Stop offset="0.5" stopColor="#d4a017" />
          <Stop offset="1" stopColor="#a07808" />
        </LinearGradient>
      </Defs>
      {/* cap */}
      <Rect x="14" y="4" width="32" height="18" rx="6" fill="#8b7355" />
      {/* neck */}
      <Rect x="20" y="20" width="20" height="6" fill="#9e845e" />
      {/* body */}
      <Rect x="10" y="24" width="40" height="54" rx="6" fill="url(#el_body)" />
      {/* gold band */}
      <Rect x="10" y="38" width="40" height="5" fill="url(#el_gold)" />
      {/* shade swatch */}
      <Rect x="14" y="48" width="32" height="18" rx="4" fill={hex} opacity="0.92" />
      {/* brand text */}
      <SvgText x="30" y="32" fontSize="4.5" fill="#4a3520" textAnchor="middle" fontWeight="bold">
        ESTÉE LAUDER
      </SvgText>
      <SvgText x="30" y="72" fontSize="4" fill="#5a4030" textAnchor="middle">
        DOUBLE WEAR
      </SvgText>
    </Svg>
  );
}

// ─── Rare Beauty ──────────────────────────────────────────────────────────────
// Soft lavender/white droplet-inspired bottle
function RareBeautyBottle({ hex, w, h }: { hex: string; w: number; h: number }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 60 84">
      <Defs>
        <LinearGradient id="rb_body" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#e8e2f0" />
          <Stop offset="0.5" stopColor="#f5f0fa" />
          <Stop offset="1" stopColor="#ddd6ea" />
        </LinearGradient>
      </Defs>
      {/* dropper top — Rare Beauty's signature dropper bottle */}
      <Rect x="27" y="2" width="6" height="16" rx="3" fill="#9b8ec4" />
      <Ellipse cx="30" cy="3" rx="5" ry="4" fill="#b4a8d4" />
      {/* neck */}
      <Rect x="23" y="16" width="14" height="8" rx="4" fill="#9b8ec4" />
      {/* body — teardrop-ish */}
      <Path
        d="M12 28 Q8 42 10 58 Q12 74 30 78 Q48 74 50 58 Q52 42 48 28 Q44 22 30 22 Q16 22 12 28Z"
        fill="url(#rb_body)"
      />
      {/* shine */}
      <Ellipse cx="20" cy="46" rx="4" ry="14" fill="rgba(255,255,255,0.4)" />
      {/* shade band */}
      <Path
        d="M14 60 Q12 72 30 76 Q48 72 46 60 Z"
        fill={hex}
        opacity="0.9"
      />
      {/* label */}
      <SvgText x="30" y="44" fontSize="5" fill="#6b5a9a" textAnchor="middle" fontWeight="bold">
        RARE
      </SvgText>
      <SvgText x="30" y="51" fontSize="4.5" fill="#6b5a9a" textAnchor="middle">
        BEAUTY
      </SvgText>
    </Svg>
  );
}

// ─── Bobbi Brown ──────────────────────────────────────────────────────────────
// Minimalist taupe/cream bottle
function BobbiBottle({ hex, w, h }: { hex: string; w: number; h: number }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 60 84">
      <Defs>
        <LinearGradient id="bb_body" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#d4c4b0" />
          <Stop offset="0.5" stopColor="#e8dcd0" />
          <Stop offset="1" stopColor="#c4b4a0" />
        </LinearGradient>
      </Defs>
      {/* cap */}
      <Rect x="12" y="4" width="36" height="18" rx="4" fill="#8b7d6b" />
      {/* body */}
      <Rect x="10" y="20" width="40" height="58" rx="5" fill="url(#bb_body)" />
      {/* thin top line */}
      <Rect x="10" y="20" width="40" height="3" fill="#7a6a58" />
      {/* shade swatch */}
      <Rect x="14" y="50" width="32" height="16" rx="4" fill={hex} opacity="0.92" />
      {/* label */}
      <SvgText x="30" y="36" fontSize="5" fill="#4a3c2c" textAnchor="middle" fontWeight="bold">
        BOBBI
      </SvgText>
      <SvgText x="30" y="43" fontSize="5" fill="#4a3c2c" textAnchor="middle" fontWeight="bold">
        BROWN
      </SvgText>
      <SvgText x="30" y="74" fontSize="4" fill="#6a5a48" textAnchor="middle">
        SKIN LONGWEAR
      </SvgText>
    </Svg>
  );
}

// ─── Peach Cosmetics ──────────────────────────────────────────────────────────
// Elegant warm rose-gold bottle with peach motif
function PeachBottle({ hex, w, h }: { hex: string; w: number; h: number }) {
  return (
    <Svg width={w} height={h} viewBox="0 0 60 84">
      <Defs>
        <LinearGradient id="pc_body" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#c8896a" />
          <Stop offset="0.45" stopColor="#e8a880" />
          <Stop offset="1" stopColor="#b87858" />
        </LinearGradient>
        <LinearGradient id="pc_gold" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#c9a84c" />
          <Stop offset="1" stopColor="#e8c96a" />
        </LinearGradient>
      </Defs>
      {/* pump */}
      <Rect x="26" y="2" width="8" height="18" rx="4" fill="url(#pc_gold)" />
      <Rect x="18" y="2" width="24" height="8" rx="4" fill="url(#pc_gold)" />
      {/* body */}
      <Rect x="10" y="18" width="40" height="60" rx="8" fill="url(#pc_body)" />
      {/* peach glow shine */}
      <Rect x="13" y="22" width="7" height="46" rx="3.5" fill="rgba(255,255,255,0.2)" />
      {/* gold band */}
      <Rect x="10" y="36" width="40" height="4" fill="url(#pc_gold)" />
      {/* shade band */}
      <Rect x="10" y="62" width="40" height="16" rx="0" fill={hex} opacity="0.92" />
      <Rect x="10" y="68" width="40" height="10" rx="8" fill={hex} />
      {/* 🍑 peach icon */}
      <SvgText x="30" y="30" fontSize="10" textAnchor="middle">🍑</SvgText>
      {/* brand text */}
      <SvgText x="30" y="54" fontSize="5" fill="#fff" textAnchor="middle" fontWeight="bold">
        PEACH
      </SvgText>
    </Svg>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function BrandBottle({ brand, shadeHex, size = 46 }: Props) {
  const b = (brand || '').toLowerCase();
  const w = size;
  const h = Math.round(size * 1.4);
  const props = { hex: shadeHex, w, h };

  if (b.includes('fenty')) return <FentyBottle {...props} />;
  if (b.includes('nars')) return <NarsBottle {...props} />;
  if (b.includes('mac')) return <MacBottle {...props} />;
  if (b.includes('maybelline')) return <MaybellineBottle {...props} />;
  if (b.includes('black opal')) return <BlackOpalBottle {...props} />;
  if (b.includes('lanc')) return <LancomeBottle {...props} />;
  if (b.includes('oréal') || b.includes('loreal') || b.includes('l\'or')) return <LorealBottle {...props} />;
  if (b.includes('estée') || b.includes('estee') || b.includes('lauder')) return <EsteeLauderBottle {...props} />;
  if (b.includes('rare')) return <RareBeautyBottle {...props} />;
  if (b.includes('bobbi')) return <BobbiBottle {...props} />;
  if (b.includes('peach')) return <PeachBottle {...props} />;

  // Generic fallback — minimal dark bottle
  return (
    <Svg width={w} height={h} viewBox="0 0 60 84">
      <Defs>
        <LinearGradient id="gen_body" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#2a2a2a" />
          <Stop offset="0.5" stopColor="#3d3d3d" />
          <Stop offset="1" stopColor="#1f1f1f" />
        </LinearGradient>
      </Defs>
      <Rect x="24" y="2" width="12" height="18" rx="6" fill="#555" />
      <Rect x="10" y="18" width="40" height="60" rx="7" fill="url(#gen_body)" />
      <Rect x="13" y="22" width="5" height="46" rx="2.5" fill="rgba(255,255,255,0.07)" />
      <Rect x="10" y="62" width="40" height="16" rx="0" fill={shadeHex} opacity="0.9" />
      <Rect x="10" y="70" width="40" height="8" rx="7" fill={shadeHex} />
    </Svg>
  );
}
