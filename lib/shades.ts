// Curated foundation shade catalog, weighted toward deep/dark skin tones.
// Hex values are approximate matches for demo purposes.

export interface Shade {
  id: string;
  brand: string;
  line: string;
  name: string;
  hex: string;
}

export const SHADES: Shade[] = [
  // Fenty Beauty — Pro Filt'r Soft Matte Longwear
  { id: 'fenty-300', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '300', hex: '#a06a42' },
  { id: 'fenty-310', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '310', hex: '#8f5c38' },
  { id: 'fenty-330', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '330', hex: '#7d4f30' },
  { id: 'fenty-340', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '340', hex: '#714627' },
  { id: 'fenty-350', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '350', hex: '#654021' },
  { id: 'fenty-360', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '360', hex: '#5c3a24' },
  { id: 'fenty-370', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '370', hex: '#4e3220' },
  { id: 'fenty-380', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '380', hex: '#452c1d' },
  { id: 'fenty-390', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '390', hex: '#3d271b' },
  { id: 'fenty-400', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '400', hex: '#38220f' },
  { id: 'fenty-410', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '410', hex: '#2f1e14' },
  { id: 'fenty-420', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '420', hex: '#2a1a10' },
  // MAC — Studio Fix Fluid
  { id: 'mac-nw43', brand: 'MAC', line: 'Studio Fix Fluid', name: 'NW43', hex: '#8d5c3a' },
  { id: 'mac-nw46', brand: 'MAC', line: 'Studio Fix Fluid', name: 'NW46', hex: '#7a4f31' },
  { id: 'mac-nw48', brand: 'MAC', line: 'Studio Fix Fluid', name: 'NW48', hex: '#6b452b' },
  { id: 'mac-nw50', brand: 'MAC', line: 'Studio Fix Fluid', name: 'NW50', hex: '#5e3d27' },
  { id: 'mac-nw55', brand: 'MAC', line: 'Studio Fix Fluid', name: 'NW55', hex: '#4c3120' },
  { id: 'mac-nw58', brand: 'MAC', line: 'Studio Fix Fluid', name: 'NW58', hex: '#3f2a1c' },
  // Maybelline — Fit Me Matte + Poreless
  { id: 'may-330', brand: 'Maybelline', line: 'Fit Me Matte + Poreless', name: '330 Toffee', hex: '#9c6a41' },
  { id: 'may-332', brand: 'Maybelline', line: 'Fit Me Matte + Poreless', name: '332 Golden Caramel', hex: '#8a5a35' },
  { id: 'may-335', brand: 'Maybelline', line: 'Fit Me Matte + Poreless', name: '335 Classic Tan', hex: '#7c4f2d' },
  { id: 'may-338', brand: 'Maybelline', line: 'Fit Me Matte + Poreless', name: '338 Spicy Brown', hex: '#6a4226' },
  { id: 'may-340', brand: 'Maybelline', line: 'Fit Me Matte + Poreless', name: '340 Cappuccino', hex: '#5b3a22' },
  { id: 'may-355', brand: 'Maybelline', line: 'Fit Me Matte + Poreless', name: '355 Coconut', hex: '#4a2f1d' },
  { id: 'may-360', brand: 'Maybelline', line: 'Fit Me Matte + Poreless', name: '360 Mocha', hex: '#3d2818' },
];
