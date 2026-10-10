/**
 * St. Cecilia's College - Cecilian Alumnet
 * Native Sharing Service
 * 
 * Powered by @capacitor/share to allow alumni to share the portal, events,
 * and campus invitations natively across mobile apps (Messages, WhatsApp, AirDrop, etc.)
 */

import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { triggerHaptic } from './hapticsService';

export interface ShareOptions {
  title?: string;
  text?: string;
  url?: string;
  dialogTitle?: string;
}

/**
 * Triggers native OS share dialog or Web Share API fallback
 */
export async function shareAlumniPortal(options?: ShareOptions): Promise<{
  shared: boolean;
  copiedToClipboard?: boolean;
  error?: string;
}> {
  const shareTitle =
    options?.title || "Join Cecilian Alumnet • St. Cecilia's College Alumni Network";
  const shareText =
    options?.text ||
    "Connect with verified St. Cecilia's College alumni, explore career listings, attend reunions, and access institutional registrar services.";
  const shareUrl =
    options?.url ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : 'https://ais-pre-sskahhr775rjjitvxpyz6e-52245444605.asia-southeast1.run.app');

  await triggerHaptic('selection');

  try {
    if (Capacitor.isNativePlatform()) {
      const canShareResult = await Share.canShare();
      if (canShareResult.value) {
        await Share.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
          dialogTitle: options?.dialogTitle || "Share Cecilian Alumnet with Alumni"
        });
        await triggerHaptic('success');
        return { shared: true };
      }
    }

    // Web Share API fallback (Supported in mobile Safari, Chrome, Edge)
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      });
      await triggerHaptic('success');
      return { shared: true };
    }

    // Clipboard fallback
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareTitle}\n${shareText}\n${shareUrl}`);
      await triggerHaptic('success');
      return { shared: false, copiedToClipboard: true };
    }

    return { shared: false, error: 'Sharing not supported in this environment' };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      // User cancelled/dismissed share sheet
      return { shared: false };
    }
    console.warn('Native share error:', err);
    return { shared: false, error: err?.message };
  }
}

/**
 * Broadcasts event details to external apps using the Capacitor Share plugin.
 * Opens native OS share sheet (WhatsApp, Messages, AirDrop, Gmail, Twitter, etc.)
 * with robust web share and clipboard fallback.
 */
export async function shareEventViaCapacitor(
  event: {
    id: string;
    title: string;
    description?: string;
    startDate?: string;
    location?: string;
    venue?: string;
    type?: string;
  },
  customOptions?: ShareOptions
): Promise<{
  shared: boolean;
  copiedToClipboard?: boolean;
  error?: string;
}> {
  const dateFormatted = event.startDate
    ? new Date(event.startDate).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : 'Upcoming Event';
  const timeFormatted = event.startDate
    ? new Date(event.startDate).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    : '';
  const venue = event.venue || event.location || "St. Cecilia's College Campus";

  const shareTitle = customOptions?.title || `${event.title} • St. Cecilia's College`;
  const shareText =
    customOptions?.text ||
    `Join me for "${event.title}" on ${dateFormatted}${timeFormatted ? ` at ${timeFormatted}` : ''} (${venue}).\n\n${(event.description || '').slice(0, 180)}${(event.description || '').length > 180 ? '...' : ''}\n\nSt. Cecilia's College Alumni Network`;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl =
    customOptions?.url ||
    (origin
      ? `${origin}/?event=${encodeURIComponent(event.id)}`
      : 'https://ais-pre-sskahhr775rjjitvxpyz6e-52245444605.asia-southeast1.run.app');

  await triggerHaptic('selection');

  try {
    // 1. Try Capacitor Share plugin directly
    const canShareResult = await Share.canShare().catch(() => ({ value: false }));
    if (canShareResult.value || Capacitor.isNativePlatform()) {
      await Share.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
        dialogTitle: customOptions?.dialogTitle || `Broadcast "${event.title}" to External Apps`
      });
      await triggerHaptic('success');
      return { shared: true };
    }

    // 2. Web Share API fallback
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      });
      await triggerHaptic('success');
      return { shared: true };
    }

    // 3. Clipboard copy fallback
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${shareTitle}\n\n${shareText}\n\nEvent Link: ${shareUrl}`);
      await triggerHaptic('success');
      return { shared: false, copiedToClipboard: true };
    }

    return { shared: false, error: 'Sharing not supported in this environment' };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      // User cancelled share sheet
      return { shared: false };
    }
    console.warn('Capacitor Share plugin execution notice:', err);
    return { shared: false, error: err?.message };
  }
}

