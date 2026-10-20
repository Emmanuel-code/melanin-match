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
