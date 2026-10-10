import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Download,
  QrCode,
  ShieldCheck,
  BellRing,
  WifiOff,
  CheckCircle2,
  Copy,
  Check,
  ExternalLink
} from 'lucide-react';
import { getPublicApkDownloadUrl, triggerApkDownload } from '../../lib/downloadUtils';

export const AppDownloadSection: React.FC = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const downloadUrl = getPublicApkDownloadUrl();

  useEffect(() => {
    QRCode.toDataURL(downloadUrl, {
      width: 260,
      margin: 2,
      color: {
        dark: '#1c1917',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Failed to generate inline QR code:', err));
  }, [downloadUrl]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDirectDownload = () => {
    triggerApkDownload(downloadUrl);
  };

  return (
    <section id="download-app" className="py-20 bg-stone-50 dark:bg-[#121316] relative overflow-hidden border-t border-stone-200/80 dark:border-stone-800">
      {/* Subtle brand glow background */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-[#8B181B]/5 dark:bg-[#8B181B]/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-white dark:bg-[#181615] rounded-3xl p-8 sm:p-12 border border-stone-200/80 dark:border-stone-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row items-center justify-between gap-10">
          
          {/* Left Column: Description & App Highlights */}
          <div className="flex-1 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-rose-950/50 border border-red-200/60 dark:border-rose-800/60 text-[#8B181B] dark:text-rose-400 text-xs font-bold tracking-wide uppercase mb-4">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Native Android Application</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-stone-900 dark:text-white tracking-tight leading-tight mb-4">
              Stay Connected to St. Cecilia's from Your Smartphone
            </h2>

            <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base leading-relaxed mb-6">
              Install the official Cecilian Alumnet mobile application. Access verified collegiate passes, participate in community discussions, browse career opportunities, and receive real-time university notifications.
            </p>

            {/* Feature Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              <div className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-stone-300">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified Digital Alumni ID Pass</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-stone-300">
                <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Full Offline Resilient Mode</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-stone-300">
                <BellRing className="w-4 h-4 text-[#8B181B] dark:text-rose-400 shrink-0" />
                <span>Push Event & News Broadcasts</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-stone-700 dark:text-stone-300">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span>One-Tap Campus Trunkline</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <a
                href={downloadUrl}
                download="cecilian-alumnet-v1.0.0.apk"
                onClick={() => handleDirectDownload()}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#8B181B] hover:bg-[#721316] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-98 cursor-pointer no-underline"
              >
                <Download className="w-4 h-4" />
                <span>Download Android APK</span>
                <span className="text-xs px-2 py-0.5 rounded bg-white/20 font-mono">18.4 MB</span>
              </a>

              <button
                onClick={handleCopyLink}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-3.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Link Copied!' : 'Copy Download Link'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Live QR Code Card */}
          <div className="shrink-0 flex flex-col items-center">
            <div className="p-5 bg-white rounded-3xl shadow-xl border border-stone-200 dark:border-stone-700 flex flex-col items-center text-center max-w-[280px]">
              <div className="flex items-center gap-2 mb-3">
                <img
                  src="/assets/cecilians-seal.jpg"
                  alt="Seal"
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="text-xs font-bold font-serif text-stone-900 tracking-tight">
                  Cecilian Alumnet
                </span>
              </div>

              {/* QR Image */}
              <div className="p-2 bg-stone-50 rounded-2xl border border-stone-100 mb-3">
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Scan QR code to download Cecilian Alumnet Android App"
                    className="w-48 h-48 rounded-xl object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center text-xs text-stone-400">
                    Generating Code...
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs font-bold text-[#8B181B] mb-1">
                <QrCode className="w-3.5 h-3.5" />
                <span>Scan with Smartphone</span>
              </div>
              <p className="text-[11px] text-stone-500 leading-snug">
                Instantly downloads the release APK or opens the mobile application.
              </p>
            </div>
            <span className="text-[11px] text-stone-400 dark:text-stone-500 mt-2 font-mono">
              Release v1.0.0 • SHA-256 Verified
            </span>
          </div>

        </div>
      </div>
    </section>
  );
};
