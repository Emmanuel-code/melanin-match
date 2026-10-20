import { Linking } from 'react-native';

// Peach Cosmetics — our own store, built into Peach Match.
// Status: COMING SOON (decided 2026-10-20). The app shows the store as a
// preview; ordering is not live yet. At launch, orders run through
// WhatsApp: the customer taps, the message arrives pre-filled with the
// exact product, and the store confirms price, stock and delivery in
// the chat. orderFromStore below is that launch-day wiring, ready to go.
export const STORE_NAME = 'Peach Cosmetics';

// Store WhatsApp line. This is the ONLY place the number lives —
// change it here and every order button in the app follows.
export const STORE_WHATSAPP = '233530753965';

export function orderFromStore(items: string[]): void {
  const list = items.map((i) => `- ${i}`).join('\n');
  const msg =
    `Hi ${STORE_NAME}! I found my shade with Peach Match and I'd like to order:\n${list}\n` +
    `Is it in stock?`;
  const url = `https://wa.me/${STORE_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  Linking.openURL(url).catch(() => {});
}

export function foundationLabel(brand: string, line: string, name: string): string {
  return `${brand} ${line} foundation — shade ${name}`;
}

// Jumia JForce — Emmanuel's agent link (verified 2026-10-20: the short
// link redirects to jumia.com.gh carrying these tracking parameters, so
// purchases in that session are credited to him). Appending the same
// parameters to a shade search keeps the tracking AND lands the user on
// her exact shade. If Jumia ever rotates the code, refresh both values
// from a fresh share link — this is the only place they live.
export const JFORCE_SHARE_LINK = 'https://jforce.jumia.com.gh/s/k8zqgoN';
export const JUMIA_TRACKING =
  'utm_source=JFORCE&utm_medium=JF_Affiliate&utm_campaign=JF_Affiliate_GH' +
  '&adj_label=casid*eb0e8674-ddb4-4361-999e-0c388e9c5978^type*jforce';
