/**
 * Download Utility for Cecilian Alumnet Mobile Releases
 * Provides cross-device scannable URLs, direct download triggers, and integrity metadata.
 */

export function getPublicApkDownloadUrl(): string {
  // If running in browser and NOT on localhost/loopback, use current origin
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    const origin = window.location.origin;
    if (!origin.includes('localhost') && !origin.includes('127.0.0.1')) {
      return `${origin}/api/download/apk`;
    }
  }

  // If VITE_APP_URL is injected (e.g. Cloud Run public URL from AI Studio), use it so external phones can scan the QR code!
  const envUrl = (import.meta.env.VITE_APP_URL as string) || '';
  if (envUrl && !envUrl.includes('MY_APP_URL') && !envUrl.includes('localhost')) {
    return `${envUrl.replace(/\/$/, '')}/api/download/apk`;
  }

  // Fallback to origin or relative API path
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/api/download/apk`;
  }

  return '/api/download/apk';
}

export function triggerApkDownload(downloadUrl?: string): void {
  const url = downloadUrl || getPublicApkDownloadUrl();
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', 'cecilian-alumnet-v1.0.0.apk');
  link.setAttribute('target', '_self');
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    try {
      document.body.removeChild(link);
    } catch {}
  }, 300);
}
