import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export type HapticKind = 'none' | 'selection' | 'light' | 'medium' | 'success' | 'warning';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

/** Fire-and-forget haptic feedback; silently no-ops where unsupported. */
export function triggerHaptic(kind: HapticKind) {
  if (!supported || kind === 'none') return;
  let pending: Promise<void>;
  switch (kind) {
    case 'selection':
      pending = Haptics.selectionAsync();
      break;
    case 'light':
      pending = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      break;
    case 'medium':
      pending = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      break;
    case 'success':
      pending = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'warning':
      pending = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
  }
  pending.catch(() => {});
}
