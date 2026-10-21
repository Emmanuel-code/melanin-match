import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Universal safe haptic feedback helpers.
 * Never throws on unsupported platforms or simulators.
 */

export const triggerHaptic = {
  selection: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.selectionAsync().catch(() => {});
    } catch {
      // fallback gracefully
    }
  },

  light: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    } catch {
      // fallback gracefully
    }
  },

  medium: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    } catch {
      // fallback gracefully
    }
  },

  heavy: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    } catch {
      // fallback gracefully
    }
  },

  success: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } catch {
      // fallback gracefully
    }
  },

  warning: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
    } catch {
      // fallback gracefully
    }
  },

  error: () => {
    if (Platform.OS === 'web') return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    } catch {
      // fallback gracefully
    }
  },
};
