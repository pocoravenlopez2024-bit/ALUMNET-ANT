import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone,
  Download,
  Share,
  PlusSquare,
  X,
  Sparkles,
  ShieldCheck,
  WifiOff,
  BellRing,
  CheckCircle2,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { getPublicApkDownloadUrl, triggerApkDownload } from '../../lib/downloadUtils';

interface LandingPWAInstallPromptProps {
  /** Optional callback to open native APK download modal */
  onOpenApkModal?: () => void;
  /** Force show modal directly (e.g. from a header button) */
  forceOpenModal?: boolean;
  onCloseModal?: () => void;
}

const STORAGE_KEY_TOAST_DISMISSED = 'cecilian_pwa_toast_dismissed';
const STORAGE_KEY_SNOOZE_UNTIL = 'cecilian_pwa_snooze_until';

export const LandingPWAInstallPrompt: React.FC<LandingPWAInstallPromptProps> = ({
  onOpenApkModal,
  forceOpenModal = false,
  onCloseModal
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isMobile, install } = usePWAInstall();
  const [showToast, setShowToast] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Synchronize external modal trigger
  useEffect(() => {
    if (forceOpenModal) {
      setShowModal(true);
    }
  }, [forceOpenModal]);

  // Initial detection: Show toast on mobile devices after a graceful 1.8s delay
  useEffect(() => {
    // If already running standalone, do not show prompt
    if (isInstalled) {
      setShowToast(false);
      return;
    }

    // Check if dismissed in this session or snoozed
    try {
      const isSessionDismissed = sessionStorage.getItem(STORAGE_KEY_TOAST_DISMISSED);
      const snoozeUntil = localStorage.getItem(STORAGE_KEY_SNOOZE_UNTIL);
      if (isSessionDismissed) return;
      if (snoozeUntil && Date.now() < parseInt(snoozeUntil, 10)) return;
    } catch {
      // Storage access blocked or restricted; continue safely
    }

    // Detect if on mobile (or touch device / small screen)
    const isMobileViewport =
      typeof window !== 'undefined' &&
      (isMobile || isIOS || isAndroid || window.innerWidth <= 840 || 'ontouchstart' in window);

    if (isMobileViewport) {
      const timer = setTimeout(() => {
        setShowToast(true);
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isInstalled, isMobile, isIOS, isAndroid]);

  const handleDismissToast = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowToast(false);
    try {
      sessionStorage.setItem(STORAGE_KEY_TOAST_DISMISSED, 'true');
    } catch {}
  };

  const handleCloseModal = () => {
    setShowModal(false);
    if (onCloseModal) onCloseModal();
  };

  const handleSnoozeModal = () => {
    try {
      // Snooze for 7 days
      localStorage.setItem(STORAGE_KEY_SNOOZE_UNTIL, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
      sessionStorage.setItem(STORAGE_KEY_TOAST_DISMISSED, 'true');
    } catch {}
    handleCloseModal();
  };

  const handleInstallClick = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isInstallable) {
      setIsInstalling(true);
      try {
        const accepted = await install();
        if (accepted) {
          setShowToast(false);
          setShowModal(false);
        }
      } finally {
        setIsInstalling(false);
      }
    } else {
      // On iOS or browsers without direct prompt, open guided modal
      setShowModal(true);
      setShowToast(false);
    }
  };

  const handleDirectApkDownload = () => {
    const url = getPublicApkDownloadUrl();
    triggerApkDownload(url);
  };

  // If already installed, hide everything
  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* ========================================================
          1. SLEEK FLOATING MOBILE TOAST / BANNER
          ======================================================== */}
      <AnimatePresence>
        {showToast && !showModal && (
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 pointer-events-auto pb-safe"
            role="dialog"
            aria-live="polite"
            aria-label="Install Cecilian Alumnet Mobile App"
          >
            <div className="bg-white/95 dark:bg-[#181615]/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-stone-200/90 dark:border-stone-800 shadow-[0_8px_30px_rgb(0,0,0,0.14)] text-stone-900 dark:text-stone-100 flex items-center gap-3 relative">
              {/* Close Button */}
              <button
                onClick={handleDismissToast}
                className="absolute top-2.5 right-2.5 p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 rounded-lg transition-colors cursor-pointer"
                aria-label="Dismiss install banner"
              >
                <X className="w-4 h-4" />
              </button>

              {/* College Seal Avatar */}
              <div className="w-12 h-12 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 p-0.5 shrink-0 shadow-xs flex items-center justify-center relative overflow-hidden">
                <img
                  src="/assets/cecilians-seal.jpg"
                  alt="St. Cecilia's Seal"
                  className="w-full h-full object-cover rounded-lg"
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#181615] rounded-full" />
              </div>

              {/* Title & Microcopy */}
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B181B] dark:text-rose-400">
                    Official App
                  </span>
                  <span className="text-stone-300 dark:text-stone-700">•</span>
                  <span className="text-[10px] text-stone-500 font-medium">Fast & Offline</span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-white truncate mt-0.5">
                  Install Cecilian Alumnet
                </h4>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-tight truncate">
                  {isIOS ? 'Add to Home Screen via Safari' : 'Install for the best mobile experience'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={handleInstallClick}
                  disabled={isInstalling}
                  className="px-3 py-2 rounded-xl bg-[#8B181B] hover:bg-[#721316] text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Download className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>{isIOS ? 'How to Add' : 'Install'}</span>
                </button>

                <button
                  onClick={() => {
                    setShowToast(false);
                    setShowModal(true);
                  }}
                  className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  title="View benefits & installation instructions"
                  aria-label="More installation details"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================
          2. INSTITUTIONAL INSTALL PWA MODAL
          ======================================================== */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-70 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#181615] rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden z-10 my-8 text-stone-900 dark:text-stone-100"
            >
              {/* Header with collegiate crimson gradient */}
              <div className="bg-gradient-to-r from-[#8B181B] via-[#721316] to-[#590e11] px-6 py-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white p-0.5 shadow-md shrink-0 flex items-center justify-center">
                    <img
                      src="/assets/cecilians-seal.jpg"
                      alt="St. Cecilia Seal"
                      className="w-full h-full rounded-xl object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-base sm:text-lg tracking-tight">
                      Install Cecilian Alumnet
                    </h3>
                    <p className="text-[11px] text-amber-200/90 font-medium">
                      Official Progressive Web Application (PWA)
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleCloseModal}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                  aria-label="Close install modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5">
                {/* Intro summary */}
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  Enjoy the full St. Cecilia's College alumni experience directly on your smartphone. Launch instantly from your home screen with zero app store delays.
                </p>

                {/* 4 Feature Highlights */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-stone-900 dark:text-white">Instant Launch</h5>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">No 50MB app store downloads</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 flex items-center justify-center shrink-0">
                      <WifiOff className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-stone-900 dark:text-white">Offline Resilience</h5>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Cached news & directory</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-stone-900 dark:text-white">Digital Pass</h5>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Verified Alumni ID card</p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800/80 flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-rose-950/40 text-[#8B181B] dark:text-rose-400 flex items-center justify-center shrink-0">
                      <BellRing className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-stone-900 dark:text-white">Push Dispatches</h5>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Campus events & news</p>
                    </div>
                  </div>
                </div>

                {/* Platform-Specific Step-by-Step Instructions */}
                {isIOS ? (
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-[#8B181B] dark:text-rose-400" />
                      <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                        iOS Safari Quick Installation
                      </h4>
                    </div>

                    <div className="space-y-2.5 text-xs text-stone-700 dark:text-stone-300">
                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#8B181B] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          1
                        </span>
                        <p>
                          In Safari, tap the <strong>Share</strong> button{' '}
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 font-mono text-[10px]">
                            <Share className="w-3 h-3 text-sky-600 inline" /> Share
                          </span>{' '}
                          in the browser toolbar.
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#8B181B] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          2
                        </span>
                        <p>
                          Scroll down the share sheet and tap{' '}
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-stone-200 dark:bg-stone-800 font-medium text-[10px]">
                            <PlusSquare className="w-3 h-3 text-emerald-600 inline" /> Add to Home Screen
                          </span>.
                        </p>
                      </div>

                      <div className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-[#8B181B] text-white flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                          3
                        </span>
                        <p>
                          Tap <strong>Add</strong> in the top-right corner. The official Cecilian icon will appear on your home screen!
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900/40 border border-stone-200 dark:border-stone-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-4 h-4 text-[#8B181B] dark:text-rose-400" />
                        <h4 className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                          Android & Web App Options
                        </h4>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-bold">
                        PWA Ready
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                      Tap below to add the lightweight Progressive Web App directly to your Android device, or download the full signed native Android package (.apk).
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                      {isInstallable ? (
                        <button
                          onClick={handleInstallClick}
                          disabled={isInstalling}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8B181B] hover:bg-[#721316] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98 cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>{isInstalling ? 'Installing...' : 'Install Web App (PWA)'}</span>
                        </button>
                      ) : (
                        <a
                          href="/api/download/apk"
                          download="cecilian-alumnet-v1.0.0.apk"
                          onClick={() => handleDirectApkDownload()}
                          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8B181B] hover:bg-[#721316] text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98 cursor-pointer no-underline text-center"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Android APK</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 font-mono">18.4 MB</span>
                        </a>
                      )}

                      {isInstallable && (
                        <a
                          href="/api/download/apk"
                          download="cecilian-alumnet-v1.0.0.apk"
                          onClick={() => handleDirectApkDownload()}
                          className="flex items-center justify-center gap-1.5 py-3 px-3.5 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer no-underline whitespace-nowrap"
                        >
                          <span>Native APK</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Controls */}
                <div className="pt-2 flex items-center justify-between text-xs">
                  <button
                    onClick={handleSnoozeModal}
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors cursor-pointer underline underline-offset-4"
                  >
                    Don't show again this week
                  </button>

                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-semibold transition-colors cursor-pointer"
                  >
                    Got It
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
