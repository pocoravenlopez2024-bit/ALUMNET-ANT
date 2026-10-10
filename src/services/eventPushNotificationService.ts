/**
 * St. Cecilia's College Alumni Network - 24-Hour Event Reservation Push Notification Service
 * 
 * Provides:
 * 1. Web Push Notification API integration (desktop & mobile OS level alerts)
 * 2. Harmonic collegiate chime synthesizer via Web Audio API
 * 3. 24-hour reservation window calculation & high-attendance check
 * 4. Attendance confirmation & seat release triggers
 */

import { AlumniEvent, EventReservation, AppNotification } from '../types';

export type PushPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, any>;
  onClick?: () => void;
}

export interface Event24hAlertCalculation {
  isWithin24HourWindow: boolean;
  isPastEvent: boolean;
  hoursUntilEvent: number;
  hoursUntil24hAlert: number;
  alertScheduledTime: Date;
  eventDate: Date;
  formattedEventTime: string;
  formattedAlertTime: string;
}

/**
 * Checks if the browser environment supports the Web Notification API
 */
export function isPushNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window;
}

/**
 * Gets the current notification permission state
 */
export function getPushPermission(): PushPermissionState {
  if (!isPushNotificationSupported()) return 'unsupported';
  return Notification.permission as PushPermissionState;
}

/**
 * Prompts user for browser notification permission
 */
export async function requestPushPermission(): Promise<PushPermissionState> {
  if (!isPushNotificationSupported()) return 'unsupported';
  try {
    const permission = await Notification.requestPermission();
    return permission as PushPermissionState;
  } catch (err) {
    console.warn('Notification permission request error:', err);
    return 'default';
  }
}

/**
 * Plays an authentic collegiate chime using the Web Audio API
 * Ensures the 24-hour alert is unmissable even if the browser tab is in the background.
 */
export function playCollegiateChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Harmonic Chord Chime (E5 659.25Hz -> G#5 830.61Hz -> B5 987.77Hz)
    const notes = [
      { freq: 523.25, time: 0.0, duration: 0.55 }, // C5
      { freq: 659.25, time: 0.12, duration: 0.7 }   // E5
    ];

    notes.forEach((note) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(note.freq, now + note.time);

      gain.gain.setValueAtTime(0.001, now + note.time);
      gain.gain.exponentialRampToValueAtTime(0.25, now + note.time + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + note.time);
      osc.stop(now + note.time + note.duration + 0.05);
    });

    // Device vibration (mobile)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([180, 80, 180]);
    }
  } catch (err) {
    // Non-blocking fallback
    console.debug('Chime audio playback prevented or unsupported:', err);
  }
}

/**
 * Dispatches an OS/browser-level push notification
 */
export async function triggerPushNotification(payload: PushNotificationPayload): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    console.warn('Push notification not supported by browser.');
    return false;
  }

  // Play chime for audio alert
  playCollegiateChime();

  if (Notification.permission !== 'granted') {
    return false;
  }

  const iconUrl = payload.icon || '/icon.svg';
  const badgeUrl = payload.badge || '/icon.svg';

  try {
    // Try service worker showNotification first if registered
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration && 'showNotification' in registration) {
        await registration.showNotification(payload.title, {
          body: payload.body,
          icon: iconUrl,
          badge: badgeUrl,
          tag: payload.tag || `scc-event-alert-${Date.now()}`,
          data: payload.data || {},
          renotify: true,
          requireInteraction: true
        } as NotificationOptions);
        return true;
      }
    }

    // Direct Notification fallback
    const notif = new Notification(payload.title, {
      body: payload.body,
      icon: iconUrl,
      tag: payload.tag || `scc-event-alert-${Date.now()}`,
      data: payload.data,
      requireInteraction: true
    } as NotificationOptions);

    notif.onclick = () => {
      window.focus();
      if (payload.onClick) {
        payload.onClick();
      }
      notif.close();
    };

    return true;
  } catch (err) {
    console.warn('Failed to fire desktop push notification:', err);
    return false;
  }
}

/**
 * Calculates exact 24-hour reminder status for an event reservation
 */
export function calculate24HourAlertStatus(
  eventStartDate: string,
  now: Date = new Date()
): Event24hAlertCalculation {
  const eventDate = new Date(eventStartDate);
  const eventStartMs = isNaN(eventDate.getTime()) ? now.getTime() + 24 * 60 * 60 * 1000 : eventDate.getTime();
  const alertWindowStartMs = eventStartMs - 24 * 60 * 60 * 1000;
  const nowMs = now.getTime();

  const isPastEvent = nowMs >= eventStartMs;
  const isWithin24HourWindow = nowMs >= alertWindowStartMs && !isPastEvent;

  const hoursUntilEvent = Math.max(0, Math.round((eventStartMs - nowMs) / (1000 * 60 * 60)));
  const hoursUntil24hAlert = Math.round((alertWindowStartMs - nowMs) / (1000 * 60 * 60));

  const alertScheduledTime = new Date(alertWindowStartMs);

  const formattedEventTime = isNaN(eventDate.getTime())
    ? eventStartDate
    : eventDate.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

  const formattedAlertTime = alertScheduledTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return {
    isWithin24HourWindow,
    isPastEvent,
    hoursUntilEvent,
    hoursUntil24hAlert,
    alertScheduledTime,
    eventDate,
    formattedEventTime,
    formattedAlertTime
  };
}

/**
 * Generates official 24-hour push alert copy and in-app notification payload
 * Crafted to guarantee maximum alumni turnout and verified seat presence.
 */
export function generate24HourReservationAlert(
  reservation: EventReservation,
  event: AlumniEvent
): {
  pushTitle: string;
  pushBody: string;
  inAppNotification: AppNotification;
} {
  const eventDate = new Date(event.startDate);
  const timeFormatted = isNaN(eventDate.getTime())
    ? event.startDate
    : eventDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const venue = event.venue || event.location || 'St. Cecilia’s College Main Campus';

  const pushTitle = `🚨 Event in 24 Hours: ${event.title}`;
  const pushBody = `Your seat (Pass #${reservation.id} · ${reservation.totalSeats} seat(s)) is reserved for tomorrow at ${timeFormatted} at ${venue}. Tap to verify your attendance!`;

  const inAppNotification: AppNotification = {
    id: `notif_24h_${reservation.id}_${Date.now()}`,
    toUid: reservation.userId,
    type: 'event',
    title: `🚨 24-Hour Alert: ${event.title} is Tomorrow!`,
    body: `Your reserved seat (Pass #${reservation.id}, ${reservation.totalSeats} seat(s)) is confirmed for tomorrow at ${timeFormatted} (${venue}). Please confirm your attendance or show your QR pass for rapid gate entry.`,
    refId: event.id,
    read: false,
    createdAt: new Date().toISOString(),
    metadata: {
      reservationId: reservation.id,
      eventId: event.id,
      type: '24h_reservation_alert',
      eventStartDate: event.startDate,
      venue,
      totalSeats: reservation.totalSeats,
      attendanceConfirmed: false
    }
  };

  return {
    pushTitle,
    pushBody,
    inAppNotification
  };
}
