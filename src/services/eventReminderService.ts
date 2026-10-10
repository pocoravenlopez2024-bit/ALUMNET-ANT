/**
 * St. Cecilia's College - Alumni Network
 * Event Local Notification & Scheduled Reminder Service
 * 
 * Features:
 * 1. 1-hour pre-event local notification scheduling with exact timing calculation.
 * 2. Web Notification API & Service Worker integration for OS/desktop/mobile notifications.
 * 3. Harmonic collegiate chime synthesizer integration.
 * 4. Persistent localStorage queue surviving page refreshes and browser restarts.
 * 5. Background interval polling (30s) to catch wake-from-sleep and tab-throttle events.
 * 6. Reactive window events for real-time UI synchronization across cards and modals.
 */

import { AlumniEvent } from '../types';
import { playCollegiateChime } from './eventPushNotificationService';

export interface ScheduledEventReminder {
  eventId: string;
  eventTitle: string;
  eventStartDate: string;
  eventLocation?: string;
  eventVenue?: string;
  eventHeroImageUrl?: string;
  scheduledNotificationTime: string; // ISO string: exactly 1h before eventStartDate
  createdAt: string;
  userId?: string;
  status: 'scheduled' | 'triggered' | 'cancelled';
}

export interface ReminderCalculationResult {
  isPastEvent: boolean;
  isWithinOneHour: boolean;
  scheduledTime: Date;
  eventTime: Date;
  msUntilReminder: number;
  formattedEventTime: string;
  formattedReminderTime: string;
  minutesRemainingText: string;
}

const STORAGE_KEY = 'cecilian_event_reminders_v1';
const activeTimers = new Map<string, number>();
let isSchedulerRunning = false;
let intervalCheckId: any = null;

/**
 * Checks if browser notification API is supported
 */
export function isNotificationSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'Notification' in window;
}

/**
 * Gets current notification permission status
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Requests browser notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.warn('[EventReminder] Failed to request notification permission:', err);
    return false;
  }
}

/**
 * Retrieves all stored reminders from localStorage
 */
export function getStoredReminders(): ScheduledEventReminder[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('[EventReminder] Error loading reminders from storage:', err);
    return [];
  }
}

/**
 * Persists reminders array to localStorage
 */
function saveStoredReminders(reminders: ScheduledEventReminder[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
  } catch (err) {
    console.warn('[EventReminder] Error saving reminders to storage:', err);
  }
}

/**
 * Checks if an event has an active, scheduled reminder
 */
export function isEventReminderActive(eventId: string): boolean {
  const reminders = getStoredReminders();
  return reminders.some((r) => r.eventId === eventId && r.status === 'scheduled');
}

/**
 * Calculates exact timing details for a 1-hour pre-event reminder
 */
export function calculateReminderDetails(eventStartDate: string, now: Date = new Date()): ReminderCalculationResult {
  const eventTime = new Date(eventStartDate);
  const eventMs = isNaN(eventTime.getTime()) ? now.getTime() + 2 * 60 * 60 * 1000 : eventTime.getTime();
  const reminderMs = eventMs - 60 * 60 * 1000; // Exactly 1 hour before
  const scheduledTime = new Date(reminderMs);
  const nowMs = now.getTime();

  const isPastEvent = nowMs >= eventMs;
  const isWithinOneHour = nowMs >= reminderMs && !isPastEvent;
  const msUntilReminder = reminderMs - nowMs;

  const minutesUntilStart = Math.max(0, Math.round((eventMs - nowMs) / (60 * 1000)));
  const minutesRemainingText =
    minutesUntilStart < 60
      ? `${minutesUntilStart} min remaining`
      : `${Math.floor(minutesUntilStart / 60)}h ${minutesUntilStart % 60}m remaining`;

  const formattedEventTime = isNaN(eventTime.getTime())
    ? eventStartDate
    : eventTime.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

  const formattedReminderTime = scheduledTime.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return {
    isPastEvent,
    isWithinOneHour,
    scheduledTime,
    eventTime,
    msUntilReminder,
    formattedEventTime,
    formattedReminderTime,
    minutesRemainingText
  };
}

/**
 * Fires the notification for a scheduled event reminder
 */
export async function triggerScheduledReminder(reminder: ScheduledEventReminder): Promise<void> {
  console.info(`[EventReminder] Firing scheduled reminder for "${reminder.eventTitle}"`);

  // 1. Play collegiate harmonic chime
  playCollegiateChime();

  // 2. Mobile haptic vibration if supported
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([220, 100, 220]);
    } catch {
      // Non-blocking
    }
  }

  const timing = calculateReminderDetails(reminder.eventStartDate);
  const venue = reminder.eventVenue || reminder.eventLocation || 'St. Cecilia’s College Campus';
  const notifTitle = `Event Starting in 1 Hour: ${reminder.eventTitle}`;
  const notifBody = timing.isWithinOneHour
    ? `Starting soon at ${timing.formattedEventTime} (${venue}). Prepare your entry pass.`
    : `Begins at ${timing.formattedEventTime} (${venue}). Tap to open details and agenda.`;

  // 3. Dispatch native/web notification if permission is granted
  if (isNotificationSupported() && Notification.permission === 'granted') {
    try {
      let notifiedViaSW = false;

      // Try service worker showNotification first
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration && 'showNotification' in registration) {
          await registration.showNotification(notifTitle, {
            body: notifBody,
            icon: reminder.eventHeroImageUrl || '/icon.svg',
            badge: '/icon.svg',
            tag: `cecilian-reminder-${reminder.eventId}`,
            data: {
              eventId: reminder.eventId,
              url: `/?tab=events&event=${reminder.eventId}`
            },
            renotify: true,
            requireInteraction: true
          } as NotificationOptions);
          notifiedViaSW = true;
        }
      }

      if (!notifiedViaSW) {
        const notif = new Notification(notifTitle, {
          body: notifBody,
          icon: reminder.eventHeroImageUrl || '/icon.svg',
          tag: `cecilian-reminder-${reminder.eventId}`,
          data: {
            eventId: reminder.eventId
          },
          requireInteraction: true
        } as NotificationOptions);

        notif.onclick = () => {
          window.focus();
          window.dispatchEvent(
            new CustomEvent('applet:navigate-event', { detail: { eventId: reminder.eventId } })
          );
          notif.close();
        };
      }
    } catch (err) {
      console.warn('[EventReminder] Native notification presentation warning:', err);
    }
  }

  // 4. Update reminder status in storage to 'triggered'
  const reminders = getStoredReminders();
  const updated = reminders.map((r) =>
    r.eventId === reminder.eventId ? { ...r, status: 'triggered' as const } : r
  );
  saveStoredReminders(updated);

  // 5. Dispatch reactive in-app custom event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('applet:event-reminder-fired', {
        detail: {
          eventId: reminder.eventId,
          eventTitle: reminder.eventTitle,
          eventStartDate: reminder.eventStartDate,
          venue
        }
      })
    );

    window.dispatchEvent(
      new CustomEvent('applet:event-reminders-changed', {
        detail: { eventId: reminder.eventId, isReminderSet: false }
      })
    );
  }
}

/**
 * Schedules a pre-event reminder for exactly 1 hour before event starts
 */
export async function scheduleEventReminder(
  event: AlumniEvent,
  userId?: string
): Promise<{ success: boolean; message: string; scheduledTime?: Date }> {
  const timing = calculateReminderDetails(event.startDate);

  if (timing.isPastEvent) {
    return {
      success: false,
      message: 'This convocation has already concluded. Reminders can only be scheduled for upcoming events.'
    };
  }

  // Request browser notification permissions if supported and not yet decided
  if (isNotificationSupported() && Notification.permission === 'default') {
    await requestNotificationPermission();
  }

  // Clear any existing timer for this event
  const existingTimer = activeTimers.get(event.id);
  if (existingTimer) {
    window.clearTimeout(existingTimer);
    activeTimers.delete(event.id);
  }

  const reminderRecord: ScheduledEventReminder = {
    eventId: event.id,
    eventTitle: event.title,
    eventStartDate: event.startDate,
    eventLocation: event.location,
    eventVenue: event.venue,
    eventHeroImageUrl: event.heroImageUrl,
    scheduledNotificationTime: timing.scheduledTime.toISOString(),
    createdAt: new Date().toISOString(),
    userId,
    status: 'scheduled'
  };

  // Upsert into persistent localStorage
  const currentReminders = getStoredReminders().filter((r) => r.eventId !== event.id);
  currentReminders.push(reminderRecord);
  saveStoredReminders(currentReminders);

  // If event is starting in less than 1 hour, trigger reminder right away
  if (timing.isWithinOneHour) {
    console.info(`[EventReminder] Event starts in under 1 hour; firing reminder immediately.`);
    // Brief 800ms delay so user sees the toggle transition cleanly
    window.setTimeout(() => {
      triggerScheduledReminder(reminderRecord);
    }, 800);

    return {
      success: true,
      message: `Reminder active! The event begins soon (${timing.minutesRemainingText}). An alert has been scheduled.`,
      scheduledTime: new Date()
    };
  }

  // Schedule in-memory timeout if within max 32-bit integer ms limit (~24.8 days)
  const MAX_TIMEOUT_MS = 2147483647;
  if (timing.msUntilReminder > 0 && timing.msUntilReminder < MAX_TIMEOUT_MS) {
    const timerId = window.setTimeout(() => {
      activeTimers.delete(event.id);
      triggerScheduledReminder(reminderRecord);
    }, timing.msUntilReminder);

    activeTimers.set(event.id, timerId);
  }

  // Make sure background supervisor loop is active
  initEventReminderScheduler();

  // Dispatch reactive event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('applet:event-reminders-changed', {
        detail: { eventId: event.id, isReminderSet: true }
      })
    );
  }

  return {
    success: true,
    message: `Reminder set! You will receive a local notification at ${timing.formattedReminderTime} (1 hour before start).`,
    scheduledTime: timing.scheduledTime
  };
}

/**
 * Cancels a scheduled event reminder
 */
export function cancelEventReminder(eventId: string): { success: boolean; message: string } {
  // Clear running in-memory timer
  const timerId = activeTimers.get(eventId);
  if (timerId) {
    window.clearTimeout(timerId);
    activeTimers.delete(eventId);
  }

  // Remove from localStorage
  const reminders = getStoredReminders();
  const target = reminders.find((r) => r.eventId === eventId);
  const updated = reminders.filter((r) => r.eventId !== eventId);
  saveStoredReminders(updated);

  // Dispatch reactive event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('applet:event-reminders-changed', {
        detail: { eventId, isReminderSet: false }
      })
    );
  }

  return {
    success: true,
    message: target
      ? `Reminder cancelled for "${target.eventTitle}".`
      : 'Reminder has been removed.'
  };
}

/**
 * Toggles an event reminder between active and cancelled
 */
export async function toggleEventReminder(
  event: AlumniEvent,
  userId?: string
): Promise<{ isReminderSet: boolean; message: string; scheduledTime?: Date }> {
  if (isEventReminderActive(event.id)) {
    const res = cancelEventReminder(event.id);
    return {
      isReminderSet: false,
      message: res.message
    };
  } else {
    const res = await scheduleEventReminder(event, userId);
    return {
      isReminderSet: res.success,
      message: res.message,
      scheduledTime: res.scheduledTime
    };
  }
}

/**
 * Periodic supervisor check that ensures due reminders are fired
 * even if device went into sleep or timer was paused by browser throttling
 */
function runPeriodicReminderCheck(): void {
  if (typeof window === 'undefined') return;
  const now = new Date();
  const nowMs = now.getTime();
  const reminders = getStoredReminders();

  let changed = false;

  for (const reminder of reminders) {
    if (reminder.status !== 'scheduled') continue;

    const eventTime = new Date(reminder.eventStartDate).getTime();
    const reminderTime = new Date(reminder.scheduledNotificationTime).getTime();

    // If event passed more than 2 hours ago, mark as expired/cancelled
    if (nowMs > eventTime + 2 * 60 * 60 * 1000) {
      reminder.status = 'cancelled';
      changed = true;
      continue;
    }

    // If current time has reached or surpassed the 1h pre-event reminder time, fire now!
    if (nowMs >= reminderTime && nowMs < eventTime) {
      triggerScheduledReminder(reminder);
      changed = true;
    }
  }

  if (changed) {
    saveStoredReminders(reminders);
  }
}

/**
 * Initializes the background reminder supervisor loop on application startup
 */
export function initEventReminderScheduler(): void {
  if (typeof window === 'undefined' || isSchedulerRunning) return;
  isSchedulerRunning = true;

  console.info('[EventReminder] Initializing collegiate event reminder scheduler');

  // Initial check on boot
  runPeriodicReminderCheck();

  // Re-arm in-memory timers for any valid scheduled reminders
  const reminders = getStoredReminders();
  const nowMs = Date.now();
  const MAX_TIMEOUT_MS = 2147483647;

  reminders.forEach((reminder) => {
    if (reminder.status === 'scheduled') {
      const reminderMs = new Date(reminder.scheduledNotificationTime).getTime();
      const delay = reminderMs - nowMs;

      if (delay > 0 && delay < MAX_TIMEOUT_MS && !activeTimers.has(reminder.eventId)) {
        const timerId = window.setTimeout(() => {
          activeTimers.delete(reminder.eventId);
          triggerScheduledReminder(reminder);
        }, delay);
        activeTimers.set(reminder.eventId, timerId);
      }
    }
  });

  // Regular periodic check every 30 seconds
  if (!intervalCheckId) {
    intervalCheckId = window.setInterval(() => {
      runPeriodicReminderCheck();
    }, 30000);
  }

  // Also check when page gains focus or tab visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      runPeriodicReminderCheck();
    }
  });
}
