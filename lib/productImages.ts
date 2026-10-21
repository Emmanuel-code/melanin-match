// Real foundation bottle image mappings for cosmetics brands

export function getProductBottleImage(brand: string): any {
  const b = (brand || '').toLowerCase();
  if (b.includes('fenty')) {
    return require('../assets/fenty-bottle.jpg');
  }
  if (b.includes('nars')) {
    return require('../assets/nars-bottle.jpg');
  }
  if (b.includes('peach')) {
    return require('../assets/peach-foundation.jpg');
  }
  // Default luxury cosmetics bottle
  return require('../assets/fenty-bottle.jpg');
}

export function getConcealerImage(): any {
  return require('../assets/peach-concealer.jpg');
}
