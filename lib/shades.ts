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
  // Black Opal — True Color Skin Perfecting Stick (formulated for Black skin)
  { id: 'bo-hazelnut', brand: 'Black Opal', line: 'True Color Stick', name: 'Hazelnut', hex: '#8a5a34' },
  { id: 'bo-nutmeg', brand: 'Black Opal', line: 'True Color Stick', name: 'Nutmeg', hex: '#7a4e2c' },
  { id: 'bo-truly-topaz', brand: 'Black Opal', line: 'True Color Stick', name: 'Truly Topaz', hex: '#6a4226' },
  { id: 'bo-black-walnut', brand: 'Black Opal', line: 'True Color Stick', name: 'Black Walnut', hex: '#54341e' },
  { id: 'bo-ebony', brand: 'Black Opal', line: 'True Color Stick', name: 'Ebony Brown', hex: '#3f2817' },
  // NARS — Natural Radiant Longwear
  { id: 'nars-macao', brand: 'NARS', line: 'Natural Radiant Longwear', name: 'Macao', hex: '#7c4f2e' },
  { id: 'nars-mali', brand: 'NARS', line: 'Natural Radiant Longwear', name: 'Mali', hex: '#5e3a22' },
  { id: 'nars-benares', brand: 'NARS', line: 'Natural Radiant Longwear', name: 'Benares', hex: '#4a2e1c' },
  // Lancôme — Teint Idole Ultra Wear
  { id: 'lan-540', brand: 'Lancôme', line: 'Teint Idole Ultra Wear', name: '540 Suede N', hex: '#6e4527' },
  { id: 'lan-550', brand: 'Lancôme', line: 'Teint Idole Ultra Wear', name: '550 Suede C', hex: '#5c3820' },
  { id: 'lan-560', brand: 'Lancôme', line: 'Teint Idole Ultra Wear', name: '560 Suede W', hex: '#4c2d19' },
  // Fenty Beauty — extended deep range (Pro Filt'r runs to 498)
  { id: 'fenty-290', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '290', hex: '#b57a4e' },
  { id: 'fenty-320', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '320', hex: '#96603c' },
  { id: 'fenty-345', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '345', hex: '#7a4a2c' },
  { id: 'fenty-385', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '385', hex: '#4a2e1e' },
  { id: 'fenty-395', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '395', hex: '#422818' },
  { id: 'fenty-430', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '430', hex: '#26180f' },
  { id: 'fenty-440', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '440', hex: '#221610' },
  { id: 'fenty-445', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '445', hex: '#1f130d' },
  { id: 'fenty-450', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '450', hex: '#1c110b' },
  { id: 'fenty-460', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '460', hex: '#190e08' },
  { id: 'fenty-470', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '470', hex: '#160c07' },
  { id: 'fenty-480', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '480', hex: '#130a06' },
  { id: 'fenty-490', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '490', hex: '#100805' },
  { id: 'fenty-495', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '495', hex: '#0e0603' },
  { id: 'fenty-498', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '498', hex: '#0b0503' },
  // MAC — Studio Fix Fluid, warm (NC) and deeper (NW)
  { id: 'mac-nc45', brand: 'MAC', line: 'Studio Fix Fluid', name: 'NC45', hex: '#96633c' },
  { id: 'mac-nc50', brand: 'MAC', line: 'Studio Fix Fluid', name: 'NC50', hex: '#7c5133' },
  { id: 'mac-nc55', brand: 'MAC', line: 'Studio Fix Fluid', name: 'NC55', hex: '#634026' },
  { id: 'mac-nc60', brand: 'MAC', line: 'Studio Fix Fluid', name: 'NC60', hex: '#4e3320' },
  { id: 'mac-nw60', brand: 'MAC', line: 'Studio Fix Fluid', name: 'NW60', hex: '#37251a' },
  // Maybelline — one more
  { id: 'may-356', brand: 'Maybelline', line: 'Fit Me Matte + Poreless', name: '356 Warm Coconut', hex: '#503322' },
  // L'Oréal Paris — True Match
  { id: 'lor-w9', brand: "L'Oréal Paris", line: 'True Match', name: 'W9 Deep Warm', hex: '#54331e' },
  { id: 'lor-n8', brand: "L'Oréal Paris", line: 'True Match', name: 'N8 Deep Neutral', hex: '#4e2e1c' },
  { id: 'lor-c9', brand: "L'Oréal Paris", line: 'True Match', name: 'C9 Deep Cool', hex: '#452a20' },
  // Estée Lauder — Double Wear
  { id: 'el-6n1', brand: 'Estée Lauder', line: 'Double Wear', name: '6N1 Truffle', hex: '#5a3a24' },
  { id: 'el-6c1', brand: 'Estée Lauder', line: 'Double Wear', name: '6C1 Rich Chestnut', hex: '#513420' },
  { id: 'el-7n1', brand: 'Estée Lauder', line: 'Double Wear', name: '7N1 Deep Amber', hex: '#452b18' },
  { id: 'el-8n1', brand: 'Estée Lauder', line: 'Double Wear', name: '8N1 Espresso', hex: '#38220f' },
  // Rare Beauty — Liquid Touch Weightless
  { id: 'rb-480w', brand: 'Rare Beauty', line: 'Liquid Touch', name: '480W', hex: '#7a4c2a' },
  { id: 'rb-510w', brand: 'Rare Beauty', line: 'Liquid Touch', name: '510W', hex: '#5f3a20' },
  { id: 'rb-540n', brand: 'Rare Beauty', line: 'Liquid Touch', name: '540N', hex: '#452a18' },
  { id: 'rb-570n', brand: 'Rare Beauty', line: 'Liquid Touch', name: '570N', hex: '#33200f' },
  // Cool deep range — added 2026-10-20 to close the cool-tone gap (cool deep
  // skin previously topped out at ~64%: the catalog leaned warm). These run
  // rosy/plum (CIELAB hue <= 32) across a spread of deep L* values.
  { id: 'nars-new-caledonia', brand: 'NARS', line: 'Natural Radiant Longwear', name: 'New Caledonia', hex: '#4a2b33' },
  { id: 'nars-khartoum', brand: 'NARS', line: 'Natural Radiant Longwear', name: 'Khartoum', hex: '#2e1b22' },
  { id: 'bb-cool-espresso', brand: 'Bobbi Brown', line: 'Skin Long-Wear Weightless', name: 'Cool Espresso', hex: '#3a222a' },
  { id: 'bb-cool-walnut', brand: 'Bobbi Brown', line: 'Skin Long-Wear Weightless', name: 'Cool Walnut', hex: '#54333d' },
  { id: 'el-7c1', brand: 'Estée Lauder', line: 'Double Wear', name: '7C1 Deep Spice', hex: '#5c363c' },
  { id: 'el-8c1', brand: 'Estée Lauder', line: 'Double Wear', name: '8C1 Rich Java', hex: '#40262e' },
  { id: 'lan-555', brand: 'Lancôme', line: 'Teint Idole Ultra Wear', name: '555 Suede C', hex: '#66404a' },
  { id: 'lor-c10', brand: "L'Oréal Paris", line: 'True Match', name: 'C10 Deep Cool', hex: '#6e4750' },
  { id: 'fenty-425', brand: 'Fenty Beauty', line: "Pro Filt'r Soft Matte", name: '425', hex: '#352029' },
  { id: 'rb-560c', brand: 'Rare Beauty', line: 'Liquid Touch', name: '560C', hex: '#4e3038' },
];
