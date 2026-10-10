/**
 * St. Cecilia's College - Cecilian Alumnet
 * In-App Browser Service
 * 
 * Powered by @capacitor/browser to open institutional links, external certification
 * bodies, and academic references in an in-app browser overlay without ejecting the
 * user from the native application.
 */

import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

export interface OpenBrowserOptions {
  url: string;
  toolbarColor?: string;
  windowName?: string;
}

/**
 * Opens an external URL inside an in-app browser overlay (Custom Tabs on Android, SFSafariViewController on iOS)
 */
export async function openExternalUrl(
  url: string,
  options?: Partial<OpenBrowserOptions>
): Promise<void> {
  if (!url || typeof url !== 'string') return;

  const targetUrl = url.startsWith('http://') || url.startsWith('https://')
    ? url
    : `https://${url}`;

  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.open({
        url: targetUrl,
        toolbarColor: options?.toolbarColor || '#8B181B', // St. Cecilia's Crimson
        presentationStyle: 'popover'
      });
      return;
    }

    // Web / Desktop fallback (opens clean target window)
    window.open(targetUrl, options?.windowName || '_blank', 'noopener,noreferrer');
  } catch (err) {
    console.warn('In-app browser open error, falling back to window.open:', err);
    window.open(targetUrl, options?.windowName || '_blank', 'noopener,noreferrer');
  }
}

/**
 * Closes the in-app browser overlay if active
 */
export async function closeExternalBrowser(): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Browser.close();
    }
  } catch {
    // Non-blocking
  }
}
