/**
 * St. Cecilia's College - Cecilian Alumnet
 * Native Push Notifications Service
 * 
 * Powered by @capacitor/push-notifications for real-time mobile alerts:
 * - Alumni Events & 24h RSVPs
 * - Direct Messages & Networking chats
 * - Institutional Announcements & Campus Bulletins
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { playCollegiateChime } from './eventPushNotificationService';

export interface PushRegistrationResult {
  granted: boolean;
  token?: string;
  error?: string;
}

export type NotificationCategory = 'event' | 'message' | 'announcement' | 'general';

export interface PushNotificationPayload {
  title: string;
  body: string;
  category?: NotificationCategory;
  data?: Record<string, any>;
}

type NotificationActionHandler = (action: ActionPerformed) => void;
type NotificationReceivedHandler = (notification: PushNotificationSchema) => void;

let actionHandlers: NotificationActionHandler[] = [];
let receivedHandlers: NotificationReceivedHandler[] = [];
let isInitialized = false;

/**
 * Checks push notification permission status
 */
export async function checkPushPermissions(): Promise<'granted' | 'denied' | 'prompt'> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await PushNotifications.checkPermissions();
      if (status.receive === 'granted') return 'granted';
      if (status.receive === 'denied') return 'denied';
      return 'prompt';
    } catch {
      return 'prompt';
    }
  }

  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    return 'prompt';
  }

  return 'prompt';
}

/**
 * Requests push notification permissions and registers the device for tokens
 */
export async function requestPushNotifications(): Promise<PushRegistrationResult> {
  if (Capacitor.isNativePlatform()) {
    try {
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        return {
          granted: false,
          error: 'Push notification permissions were not granted by the user.'
        };
      }

      // Register device with APNS (iOS) / FCM (Android)
      await PushNotifications.register();

      return { granted: true };
    } catch (err: any) {
      console.warn('Native push registration error:', err);
      return {
        granted: false,
        error: err?.message || 'Could not register for push notifications.'
      };
    }
  }

  // Web / PWA fallback
  if (typeof window !== 'undefined' && 'Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      return { granted: permission === 'granted' };
    } catch (err: any) {
      return { granted: false, error: err?.message };
    }
  }

  return { granted: false, error: 'Push notifications are not supported in this environment.' };
}

/**
 * Initializes listeners for incoming push alerts and user click actions
 */
export function initPushNotificationListeners(
  onNavigateTab?: (tab: string, contextId?: string) => void
): () => void {
  if (!Capacitor.isNativePlatform() || isInitialized) {
    return () => {};
  }

  isInitialized = true;

  // On successful registration with FCM/APNs
  const registrationListener = PushNotifications.addListener('registration', (token: Token) => {
    console.info('[Push] Device registered with native push token:', token.value);
    try {
      localStorage.setItem('sc_alumni_push_token', token.value);
    } catch {}
  });

  // On registration error
  const registrationErrorListener = PushNotifications.addListener('registrationError', (err: any) => {
    console.error('[Push] Native push registration failed:', err);
  });

  // When a push notification arrives while app is in foreground
  const receivedListener = PushNotifications.addListener(
    'pushNotificationReceived',
    (notification: PushNotificationSchema) => {
      console.info('[Push] Notification received in foreground:', notification);
      
      // Play harmonic collegiate chime
      playCollegiateChime();

      // Dispatch custom event for in-app toast/banner
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('applet:push-received', {
            detail: notification
          })
        );
      }

      receivedHandlers.forEach((handler) => handler(notification));
    }
  );

  // When user taps/clicks a notification
  const actionListener = PushNotifications.addListener(
    'pushNotificationActionPerformed',
    (action: ActionPerformed) => {
      console.info('[Push] User tapped notification action:', action);
      const data = action.notification.data || {};
      const category = (data.category || data.type || '').toLowerCase();

      if (onNavigateTab) {
        if (category === 'event' || category === 'events') {
          onNavigateTab('events', data.eventId);
        } else if (category === 'message' || category === 'messages' || category === 'chat') {
          onNavigateTab('messages', data.chatId);
        } else if (category === 'announcement' || category === 'announcements') {
          onNavigateTab('announcements', data.announcementId);
        } else {
          onNavigateTab('dashboard');
        }
      }

      actionHandlers.forEach((handler) => handler(action));
    }
  );

  return () => {
    registrationListener.then((l) => l.remove()).catch(() => {});
    registrationErrorListener.then((l) => l.remove()).catch(() => {});
    receivedListener.then((l) => l.remove()).catch(() => {});
    actionListener.then((l) => l.remove()).catch(() => {});
    isInitialized = false;
  };
}

/**
 * Triggers a local/in-app alert simulating push notifications for events, messages, and announcements
 */
export function sendInAppPushAlert(payload: PushNotificationPayload): void {
  playCollegiateChime();

  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(payload.title, {
        body: payload.body,
        icon: '/favicon.ico',
        tag: payload.category || 'alumnet',
        data: payload.data
      });
    } catch {}
  }

  // Broadcast event for UI banners/toasts
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('applet:push-received', {
        detail: {
          title: payload.title,
          body: payload.body,
          data: {
            category: payload.category,
            ...(payload.data || {})
          }
        }
      })
    );
  }
}
