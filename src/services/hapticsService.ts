/**
 * St. Cecilia's College - Cecilian Alumnet
 * Native Haptics Service
 * 
 * Powered by @capacitor/haptics with tactile feedback for mobile interactions
 */

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

export type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

/**
 * Triggers native haptic vibration for mobile tactile feel
 */
export async function triggerHaptic(type: HapticFeedbackType = 'light'): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      if (type === 'selection') {
        await Haptics.selectionChanged();
      } else if (type === 'success') {
        await Haptics.notification({ type: NotificationType.Success });
      } else if (type === 'warning') {
        await Haptics.notification({ type: NotificationType.Warning });
      } else if (type === 'error') {
        await Haptics.notification({ type: NotificationType.Error });
      } else if (type === 'heavy') {
        await Haptics.impact({ style: ImpactStyle.Heavy });
      } else if (type === 'medium') {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } else {
        await Haptics.impact({ style: ImpactStyle.Light });
      }
      return;
    }

    // Web / PWA browser vibration fallback
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      if (type === 'selection' || type === 'light') {
        navigator.vibrate(12);
      } else if (type === 'medium') {
        navigator.vibrate(22);
      } else if (type === 'heavy') {
        navigator.vibrate(35);
      } else if (type === 'success') {
        navigator.vibrate([15, 60, 20]);
      } else if (type === 'error') {
        navigator.vibrate([40, 70, 40]);
      } else if (type === 'warning') {
        navigator.vibrate([30, 50, 20]);
      }
    }
  } catch {
    // Non-blocking
  }
}
