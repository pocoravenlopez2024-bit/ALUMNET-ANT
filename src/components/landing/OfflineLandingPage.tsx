import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { motion, AnimatePresence } from 'framer-motion';
import {
  WifiOff,
  RefreshCw,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Info,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Download,
  Smartphone,
  Copy,
  Check
} from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useAlumni } from '../../context/AlumniContext';
import { getPublicApkDownloadUrl, triggerApkDownload } from '../../lib/downloadUtils';

interface OfflineLandingPageProps {
  onReturnToOnlineLanding?: () => void;
  onNavigateToAuth?: (mode: 'login' | 'register') => void;
}

export const OfflineLandingPage: React.FC<OfflineLandingPageProps> = ({
  onReturnToOnlineLanding,
  onNavigateToAuth
}) => {
  const { isOnline, isChecking, lastOnlineTime, checkConnection } = useNetworkStatus();
  const { currentUser } = useAlumni();
  const [activeTab, setActiveTab] = useState<'overview' | 'contacts' | 'creed' | 'pass' | 'download'>('overview');
  const [retryResult, setRetryResult] = useState<string | null>(null);
  const [offlineQrCode, setOfflineQrCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const downloadUrl = getPublicApkDownloadUrl();

  useEffect(() => {
    QRCode.toDataURL(downloadUrl, { width: 240, margin: 1, errorCorrectionLevel: 'H' })
      .then(setOfflineQrCode)
      .catch(() => {});
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

  const handleManualRetry = async () => {
    setRetryResult(null);
    const reachable = await checkConnection();
    if (reachable) {
      setRetryResult('online');
      if (onReturnToOnlineLanding) {
        setTimeout(() => onReturnToOnlineLanding(), 600);
      }
    } else {
      setRetryResult('offline');
      setTimeout(() => setRetryResult(null), 4000);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF9F6] dark:bg-[#121316] text-stone-900 dark:text-stone-100 flex flex-col font-sans selection:bg-[#8B181B] selection:text-white">
      {/* ========================================================
          CRITICAL OFFLINE SYSTEM STATUS BANNER
          ======================================================== */}
      <div className="w-full bg-[#8B181B] text-white px-4 py-3 sm:py-3.5 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
              <WifiOff className="w-4 h-4 text-amber-300" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold tracking-tight">
                  Offline Mode Active
                </span>
                <span className="inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-400 text-stone-900 uppercase tracking-wider">
                  Cached Hub
                </span>
              </div>
              <p className="text-[11px] text-white/80">
                You are currently disconnected from the live alumni cloud network. Cached institutional data is available below.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={handleManualRetry}
              disabled={isChecking}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-[#8B181B] text-xs font-bold shadow-xs hover:bg-stone-100 active:scale-95 transition-all cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} strokeWidth={2} />
              <span>{isChecking ? 'Checking...' : 'Check Connection'}</span>
            </button>

            {onReturnToOnlineLanding && (
              <button
                onClick={onReturnToOnlineLanding}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all cursor-pointer whitespace-nowrap"
              >
                View Full Page
              </button>
            )}
          </div>
        </div>

        {/* Retry Feedback Alert */}
        <AnimatePresence>
          {retryResult === 'offline' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-6xl mx-auto pt-2 text-center"
            >
              <p className="text-[11px] font-semibold text-amber-200 flex items-center justify-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                No internet connection detected yet. Continuing to provide offline cached resources.
              </p>
            </motion.div>
          )}
          {retryResult === 'online' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-6xl mx-auto pt-2 text-center"
            >
              <p className="text-[11px] font-semibold text-emerald-200 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connection re-established! Redirecting to online alumni portal...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========================================================
          OFFLINE BRAND HEADER & NAVIGATION
          ======================================================== */}
      <header className="border-b border-stone-200 dark:border-stone-800 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#8B181B] to-amber-500 shadow-sm flex items-center justify-center shrink-0">
              <img
                src="/assets/cecilians-seal.jpg"
                alt="Cecilian Seal"
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-bold text-lg sm:text-xl text-stone-900 dark:text-white tracking-tight">
                  Cecilian Alumnet
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                  Offline Standby
                </span>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                St. Cecilia's College - Cebu, Inc. • Global Alumni Network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onNavigateToAuth && (
              <button
                onClick={() => onNavigateToAuth('login')}
                className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-[#8B181B] text-[#8B181B] dark:text-rose-400 hover:bg-[#8B181B]/5 transition-colors cursor-pointer"
              >
                Sign In (Cached)
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ========================================================
          MAIN CONTENT AREA
          ======================================================== */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-3 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Offline Overview', icon: Info },
            { id: 'contacts', label: 'Campus Directory', icon: Building2 },
            { id: 'creed', label: 'Heritage & Creed', icon: BookOpen },
            { id: 'pass', label: 'Digital Alumni Pass', icon: ShieldCheck },
            { id: 'download', label: 'App APK & QR', icon: QrCode }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#8B181B] text-white shadow-[0_1px_3px_rgba(0,0,0,0.08)]'
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)]">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8B181B] dark:text-rose-400">
                  Local Service Worker Active
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white mt-1 mb-3">
                  Always Connected to St. Cecilia's Heritage
                </h2>
                <p className="text-stone-600 dark:text-stone-300 text-sm sm:text-base leading-relaxed mb-6">
                  Even when you are traveling, off the grid, or experiencing temporary network interruptions, Cecilian Alumnet caches essential institutional contacts, emergency numbers, identity passes, and collegiate records locally in your browser.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                    <div className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                      Cache Status
                    </div>
                    <div className="text-sm font-bold text-stone-900 dark:text-white mt-1">
                      Local Storage Synced
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Vite PWA Service Worker v1.0
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                    <div className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                      Last Live Sync
                    </div>
                    <div className="text-sm font-bold text-stone-900 dark:text-white mt-1">
                      {lastOnlineTime ? lastOnlineTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Earlier Today'}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Cached on your device
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60">
                    <div className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400">
                      Auto-Reconnect
                    </div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                      Continuous Listening
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Transitions instantly when online
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div
                onClick={() => setActiveTab('contacts')}
                className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 hover:border-[#8B181B]/40 transition-all cursor-pointer shadow-xs group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-rose-950/60 text-[#8B181B] dark:text-rose-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-white mb-1">
                  Campus Directory
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-3">
                  Direct hotline, registrar, admissions, and campus security contacts for Minglanilla campus.
                </p>
                <span className="text-xs font-bold text-[#8B181B] dark:text-rose-400 flex items-center gap-1">
                  View Numbers <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>

              <div
                onClick={() => setActiveTab('creed')}
                className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 hover:border-[#8B181B]/40 transition-all cursor-pointer shadow-xs group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <BookOpen className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-white mb-1">
                  Alma Mater & Creed
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-3">
                  Read the lyrics to the St. Cecilia Hymn and reflect on our core pillars: Virtus, Scientia, Charitas.
                </p>
                <span className="text-xs font-bold text-[#8B181B] dark:text-rose-400 flex items-center gap-1">
                  Read Creed <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>

              <div
                onClick={() => setActiveTab('pass')}
                className="bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 hover:border-[#8B181B]/40 transition-all cursor-pointer shadow-xs group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-bold text-sm text-stone-900 dark:text-white mb-1">
                  Digital Alumni Pass
                </h3>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed mb-3">
                  Present your verified collegiate identity card offline at campus gates and alumni partner venues.
                </p>
                <span className="text-xs font-bold text-[#8B181B] dark:text-rose-400 flex items-center gap-1">
                  Open Pass <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CAMPUS DIRECTORY & EMERGENCY CONTACTS */}
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-xs">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-white mb-2">
                St. Cecilia's College Campus Directory
              </h2>
              <p className="text-sm text-stone-600 dark:text-stone-400 mb-6">
                All numbers and addresses below are stored in local offline memory for immediate reference during network outages.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
                  <div className="flex items-center gap-2.5 mb-2">
                    <Building2 className="w-4 h-4 text-[#8B181B]" />
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white">Main Institutional Campus</h4>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
                    St. Cecilia's College - Cebu, Inc.
                  </p>
                  <div className="space-y-1 text-xs text-stone-700 dark:text-stone-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>Poblacion Ward II, Minglanilla, Cebu 6046, Philippines</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <a href="tel:+63322728989" className="hover:underline font-semibold">+63 (032) 272-8989</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>info@scc-cebu.edu.ph</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
                  <div className="flex items-center gap-2.5 mb-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white">Alumni Affairs & Registrar</h4>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
                    Official Transcript, Certificate of Graduation & Records
                  </p>
                  <div className="space-y-1 text-xs text-stone-700 dark:text-stone-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <a href="tel:+63322728990" className="hover:underline font-semibold">+63 (032) 272-8990 (Ext. 104)</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>registrar@scc-cebu.edu.ph</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>Monday – Friday: 8:00 AM – 5:00 PM PHT</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
                  <div className="flex items-center gap-2.5 mb-2">
                    <Phone className="w-4 h-4 text-amber-600" />
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white">Campus Safety & Gate Security</h4>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
                    24/7 Campus Gate & Alumni Visitor Access
                  </p>
                  <div className="space-y-1 text-xs text-stone-700 dark:text-stone-300">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <a href="tel:+63322728991" className="hover:underline font-semibold">+63 (032) 272-8991 (24/7 Desk)</a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>Present your Cecilian ID or Alumni Pass upon entry</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/40">
                  <div className="flex items-center gap-2.5 mb-2">
                    <Mail className="w-4 h-4 text-sky-600" />
                    <h4 className="font-bold text-sm text-stone-900 dark:text-white">Alumni Association Board</h4>
                  </div>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mb-2">
                    Cecilian Alumnet Leadership & Chapter Support
                  </p>
                  <div className="space-y-1 text-xs text-stone-700 dark:text-stone-300">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>alumni.association@scc-cebu.edu.ph</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>Alumni Lounge, 2nd Floor, Main Building</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: ALMA MATER & HERITAGE CREED */}
        {activeTab === 'creed' && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 sm:p-10 border border-stone-200/80 dark:border-stone-800 shadow-xs max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#8B181B] dark:text-rose-400">
                St. Cecilia's College - Cebu, Inc.
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-white mt-1">
                The Cecilian Alma Mater Hymn
              </h2>
              <p className="text-xs text-stone-500 italic mt-1">
                Honoring our shared foundation in Virtus, Scientia, Charitas
              </p>
            </div>

            <div className="bg-stone-50 dark:bg-stone-800/50 p-6 sm:p-8 rounded-xl border border-stone-200/80 dark:border-stone-700/60 font-serif text-stone-800 dark:text-stone-200 text-center space-y-4 text-sm sm:text-base leading-relaxed">
              <p>
                Hail to thee, our Alma Mater,<br />
                Beacon light upon our way.<br />
                Guiding youth with truth and honor,<br />
                Leading into brighter day.
              </p>
              <div className="w-8 h-[1px] bg-[#8B181B]/40 mx-auto" />
              <p>
                In your halls we learned to cherish,<br />
                Virtue, Wisdom, Love profound.<br />
                Though in distant lands we flourish,<br />
                Here our proudest roots are found.
              </p>
              <div className="w-8 h-[1px] bg-[#8B181B]/40 mx-auto" />
              <p className="font-bold text-[#8B181B] dark:text-rose-400">
                Chorus:<br />
                St. Cecilia, beloved Mother,<br />
                We will keep your banner high!<br />
                Cecilians one and all forever,<br />
                Loyal till the end of time!
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-6 text-center">
              <div className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-200/50">
                <span className="font-bold text-xs text-[#8B181B] block">VIRTUS</span>
                <span className="text-[10px] text-stone-500">Moral Virtue</span>
              </div>
              <div className="p-3 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200/50">
                <span className="font-bold text-xs text-amber-700 block">SCIENTIA</span>
                <span className="text-[10px] text-stone-500">Academic Science</span>
              </div>
              <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200/50">
                <span className="font-bold text-xs text-emerald-700 block">CHARITAS</span>
                <span className="text-[10px] text-stone-500">Selfless Charity</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DIGITAL ALUMNI PASS (OFFLINE) */}
        {activeTab === 'pass' && (
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-[#8B181B] via-[#721316] to-stone-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-red-900/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white p-0.5 shadow-sm shrink-0">
                    <img
                      src="/assets/cecilians-seal.jpg"
                      alt="Seal"
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                      Offline Verified Credential
                    </span>
                    <h3 className="font-serif font-bold text-base text-white">
                      Cecilian Alumnet Pass
                    </h3>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[9px] font-bold text-emerald-300 uppercase">
                  Valid
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-white/60 block">Alumni Name</span>
                  <div className="text-lg font-bold text-white tracking-wide">
                    {currentUser ? currentUser.name : 'Cecilian Alumni Member'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-white/60 block">Member ID</span>
                    <span className="font-mono font-bold text-amber-200">
                      {currentUser?.alumniId || 'SCC-ALUM-2024-OFFLINE'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-white/60 block">Batch / Year</span>
                    <span className="font-semibold text-white">
                      {currentUser?.batch ? `Class of ${currentUser.batch}` : 'Distinguished Graduate'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/70">
                  <span>Campus Gate & Library Access</span>
                  <span className="font-mono text-amber-300/80">OFFLINE-ID</span>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-stone-500 dark:text-stone-400 mt-4">
              This card is cached locally on this device. Present to security upon visiting the Minglanilla campus.
            </p>
          </div>
        )}

        {/* TAB 5: DOWNLOAD APP & QR CODE */}
        {activeTab === 'download' && (
          <div className="max-w-md mx-auto bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-200/80 dark:border-stone-800 shadow-sm text-center">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 dark:bg-rose-950/50 text-[#8B181B] dark:text-rose-400 text-xs font-bold uppercase mb-3">
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android Release APK</span>
            </div>

            <h3 className="font-serif font-bold text-xl text-stone-900 dark:text-white mb-2">
              Scan to Download APK
            </h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 leading-relaxed">
              Scan with your smartphone camera or tap the download button below to save the official package.
            </p>

            <div className="p-3 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 inline-block mb-5">
              {offlineQrCode ? (
                <img
                  src={offlineQrCode}
                  alt="Scan QR to download Cecilian Alumnet APK"
                  className="w-48 h-48 rounded-xl object-contain mx-auto"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-stone-400">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              <a
                href={downloadUrl}
                download="cecilian-alumnet-v1.0.0.apk"
                onClick={() => handleDirectDownload()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#8B181B] hover:bg-[#721316] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer no-underline"
              >
                <Download className="w-4 h-4" />
                <span>Download APK File (18.4 MB)</span>
              </a>

              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Link Copied!' : 'Copy Download Link'}</span>
              </button>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-[11px] text-stone-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Release v1.0.0</span>
              </span>
              <span>SHA-256 Verified</span>
            </div>
          </div>
        )}

      </main>

      {/* ========================================================
          FOOTER WITH COPYRIGHT & STATUS
          ======================================================== */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
          <p>© {new Date().getFullYear()} St. Cecilia's College - Cebu, Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Offline Service Worker Active
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};
