import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  Smartphone,
  Download,
  QrCode,
  Check,
  Copy,
  ExternalLink,
  X,
  ShieldCheck,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getPublicApkDownloadUrl, triggerApkDownload } from '../../lib/downloadUtils';

interface AppDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppDownloadModal: React.FC<AppDownloadModalProps> = ({ isOpen, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'steps'>('qr');

  const downloadUrl = getPublicApkDownloadUrl();

  useEffect(() => {
    if (!isOpen) return;

    // Generate real, scan-ready high-density QR code
    QRCode.toDataURL(downloadUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#1c1917',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'H'
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err));
  }, [isOpen, downloadUrl]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDirectDownload = (e?: React.MouseEvent) => {
    // Also trigger fallback programmatic download in case anchor download attribute is ignored
    triggerApkDownload(downloadUrl);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-70 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#181615] rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-8"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#8B181B] via-[#721316] to-[#590e11] px-6 py-5 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-md shrink-0">
                <img
                  src="/assets/cecilians-seal.jpg"
                  alt="St. Cecilia Seal"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base sm:text-lg tracking-tight">
                  Download Cecilian Alumnet
                </h3>
                <p className="text-[11px] text-amber-200/90 font-medium">
                  Official Android Mobile Application (.apk)
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Close download modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subheader / Tabs */}
          <div className="flex border-b border-stone-200 dark:border-stone-800 px-6 pt-3 bg-stone-50/50 dark:bg-stone-900/40">
            <button
              onClick={() => setActiveTab('qr')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'qr'
                  ? 'border-[#8B181B] text-[#8B181B] dark:text-rose-400'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Scan QR Code</span>
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`pb-2.5 px-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'steps'
                  ? 'border-[#8B181B] text-[#8B181B] dark:text-rose-400'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-300'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>Install Instructions</span>
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'qr' ? (
              <div className="flex flex-col items-center text-center">
                {/* QR Code Container */}
                <div className="p-4 bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-stone-200 mb-4 relative group">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Scan to download APK"
                      className="w-52 h-52 sm:w-60 sm:h-60 object-contain rounded-lg"
                    />
                  ) : (
                    <div className="w-52 h-52 sm:w-60 sm:h-60 flex items-center justify-center bg-stone-50 rounded-lg">
                      <span className="text-xs text-stone-400 animate-pulse">Generating QR Code...</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 -bottom-2.5 flex justify-center">
                    <span className="px-2.5 py-0.5 bg-[#8B181B] text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
                      Scan with Phone Camera
                    </span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-stone-900 dark:text-white mb-1">
                  Point your smartphone camera at the code
                </h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mb-5 leading-relaxed">
                  Open your camera app or QR scanner to instantly download the APK file directly to your phone.
                </p>

                {/* Direct Download Button */}
                <div className="w-full flex flex-col sm:flex-row gap-2.5">
                  <a
                    href={downloadUrl}
                    download="cecilian-alumnet-v1.0.0.apk"
                    onClick={() => handleDirectDownload()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8B181B] hover:bg-[#721316] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98 cursor-pointer no-underline"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download APK (.apk)</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-mono">18.4 MB</span>
                  </a>

                  <button
                    onClick={handleCopyLink}
                    className="flex items-center justify-center gap-1.5 py-3 px-3.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Link Copied!' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 flex gap-3 text-xs text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-5 h-5 shrink-0 text-amber-700 dark:text-amber-400" />
                  <p>
                    Because this is an official institutional release built for St. Cecilia's College, Android may request permission to "Install unknown apps". This is standard for direct APK installations.
                  </p>
                </div>

                <div className="space-y-3 pt-1">
                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#8B181B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      1
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                        Download the APK file
                      </h5>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        Scan the QR code or tap the "Download APK" button below to save <code className="text-[#8B181B] font-mono text-[11px]">cecilian-alumnet-v1.0.0.apk</code>.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#8B181B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      2
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                        Allow Unknown App Installation
                      </h5>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        When opening the download, tap <strong>Settings</strong> and enable <strong>"Allow from this source"</strong> for your browser or file manager.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#8B181B] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      3
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white">
                        Install and Sign In
                      </h5>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        Tap <strong>Install</strong>. Once completed, open <strong>Cecilian Alumnet</strong> and log in with your verified alumni account or register your student number.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <a
                    href={downloadUrl}
                    download="cecilian-alumnet-v1.0.0.apk"
                    onClick={() => handleDirectDownload()}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8B181B] hover:bg-[#721316] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer no-underline"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download APK Now (18.4 MB)</span>
                  </a>
                </div>
              </div>
            )}

            {/* Release Metadata Footer */}
            <div className="mt-5 pt-4 border-t border-stone-200 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-500 dark:text-stone-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Signed Release v1.0.0</span>
              </span>
              <span>Package: com.aistudio.applet.cnztsm</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
