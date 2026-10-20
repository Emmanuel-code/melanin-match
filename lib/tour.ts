import AsyncStorage from '@react-native-async-storage/async-storage';

// Guided-tour state — persistent, on-device. Each helper shows ONCE (first
// visit), then never nags again. resetTour() clears everything, which is
// how the tour gets re-filmed or replayed start-to-finish.

export type TourKey = 'onboarding' | 'capture' | 'results' | 'store';

const PREFIX = 'peach-tour-v1-';
const KEYS: TourKey[] = ['onboarding', 'capture', 'results', 'store'];

export async function tourSeen(key: TourKey): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(PREFIX + key)) === '1';
  } catch {
    return false;
  }
}

export async function markTourSeen(key: TourKey): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, '1');
  } catch {
    // non-fatal — worst case the tip shows again next visit
  }
}

export async function resetTour(): Promise<void> {
  try {
    await AsyncStorage.multiRemove(KEYS.map((k) => PREFIX + k));
  } catch {
    // non-fatal
  }
}
