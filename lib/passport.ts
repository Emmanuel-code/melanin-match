import AsyncStorage from '@react-native-async-storage/async-storage';

// Shade Passport — the user's latest match, kept on-device (never uploaded).
// Saved automatically on the results screen; shown on the home screen so a
// returning user is greeted by HER shade, not a blank start.

export interface ShadePassport {
  skinHex: string;
  fitzpatrickLabel: string;
  undertoneLabel: string;
  brand: string;
  line: string;
  shadeName: string;
  shadeHex: string;
  matchPercent: number;
  concealerLabel?: string;
  savedAt: string; // ISO date
}

const KEY = 'peach-match-passport-v1';

export async function savePassport(p: ShadePassport): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    // storage full/blocked — the passport is a nicety, never block results
  }
}

export async function loadPassport(): Promise<ShadePassport | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ShadePassport) : null;
  } catch {
    return null;
  }
}
