import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  Briefcase,
  Megaphone,
  GraduationCap,
  Trophy,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  Landmark,
  BookOpen,
  ShieldCheck,
  Globe,
  Award,
  Building2,
  CheckCircle2,
  Search,
  School,
  ExternalLink,
  MapPin,
  Moon,
  Sun,
  WifiOff,
  RefreshCw,
  Smartphone,
  QrCode,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlumni } from '../../context/AlumniContext';
import { useTheme } from '../../lib/theme';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { OfflineLandingPage } from './OfflineLandingPage';
import { AppDownloadModal } from './AppDownloadModal';
import { AppDownloadSection } from './AppDownloadSection';
import { LandingPWAInstallPrompt } from './LandingPWAInstallPrompt';
import { CampusGalleryModal } from '../gallery/CampusGalleryModal';
import { Landing3DCanvas } from './Landing3DCanvas';
import { Landing3DPass } from './Landing3DPass';
import { TiltCard } from './TiltCard';
import { AnimatedStat } from './AnimatedStat';
import { CollegeHistorySection } from './CollegeHistorySection';

interface LandingPageProps {
  onNavigateToAuth: (mode: 'login' | 'register', role?: 'alumni' | 'employer') => void;
}

// 3 Slideshow images corresponding directly to the user's authentic uploaded campus photographs
const CAMPUS_SLIDES = [
  {
    id: 1,
    image: '/assets/landing-building-1.jpg',
    badge: 'SLIDE 01 • CAMPUS TOWER',
    title: 'St. Cecilia’s Modern Tower',
    caption: 'Towering academic high-rise architecture under the open sky.'
  },
  {
    id: 2,
    image: '/assets/landing-building-2.jpg',
    badge: 'SLIDE 02 • MAIN INSTITUTIONAL HALL',
    title: 'St. Cecilia’s College Main Building',
    caption: 'Official campus facade featuring the distinctive red column and main entrance canopy.'
  },
  {
    id: 3,
    image: '/assets/landing-building-3.jpg',
    badge: 'SLIDE 03 • CEBU CAMPUS COMPLEX',
    title: 'St. Cecilia’s Institutional Complex',
    caption: 'Academic grounds and collegiate learning facilities of St. Cecilia’s College - Cebu, Inc.'
  }
];

// Professional, welcoming messages tailored to St. Cecilia Alumni
const CECILIAN_WELCOME_MESSAGES = [
  "Welcome home, Cecilians.",
  "Reconnecting batches across generations.",
  "Honoring traditions of Virtus, Scientia & Charitas.",
  "Carrying the legacy of St. Cecilia's College forward.",
  "Your lifelong alumni community begins here."
];

// Staggered fade animation variants for hero heading, sub-headline, and CTAs
const heroHeadingContainerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.18,
      delayChildren: 0.25
    }
  }
};

const heroHeadingLineVariants = {
  hidden: {
    opacity: 0,
    y: 38,
    filter: 'blur(8px)'
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};

const heroSubheadlineVariants = {
  hidden: {
    opacity: 0,
    y: 24,
    filter: 'blur(6px)'
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.85,
      delay: 0.75,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};

const heroCtaVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.65,
      delay: 0.95,
      ease: [0.22, 1, 0.36, 1] as const
    }
  }
};

export const LandingPage: React.FC<LandingPageProps> = ({
  onNavigateToAuth
}) => {
  const { currentUser } = useAlumni();
  const { isDark, toggleTheme } = useTheme();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchBatchQuery, setSearchBatchQuery] = useState('');

  // Slideshow state for background images 1 to 3
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isHoveringControls, setIsHoveringControls] = useState(false);

  // Auto-advance slideshow every 6 seconds
  useEffect(() => {
    if (isHoveringControls) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % CAMPUS_SLIDES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isHoveringControls]);

  const goToNextSlide = () => {
    setCurrentSlideIndex((prev) => (prev + 1) % CAMPUS_SLIDES.length);
  };

  const goToPrevSlide = () => {
    setCurrentSlideIndex((prev) => (prev - 1 + CAMPUS_SLIDES.length) % CAMPUS_SLIDES.length);
  };

  // Track scroll position for dynamic sticky header styling with hysteresis to eliminate flutter
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const y = window.scrollY;
          setIsScrolled((prev) => {
            // Hysteresis deadband: activates past 45px, deactivates only when back above 15px
            if (prev) return y > 15;
            return y > 45;
          });
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sophisticated Typewriter Greeting Effect tailored to St. Cecilia Alumni
  const [welcomeIndex, setWelcomeIndex] = useState(0);
  const [displayedWelcomeText, setDisplayedWelcomeText] = useState('');
  const [isDeletingWelcome, setIsDeletingWelcome] = useState(false);

  useEffect(() => {
    const fullText = CECILIAN_WELCOME_MESSAGES[welcomeIndex];
    let timer: NodeJS.Timeout;

    if (!isDeletingWelcome) {
      if (displayedWelcomeText.length < fullText.length) {
        timer = setTimeout(() => {
          setDisplayedWelcomeText(fullText.slice(0, displayedWelcomeText.length + 1));
        }, 48);
      } else {
        timer = setTimeout(() => {
          setIsDeletingWelcome(true);
        }, 3400);
      }
    } else {
      if (displayedWelcomeText.length > 0) {
        timer = setTimeout(() => {
          setDisplayedWelcomeText(fullText.slice(0, displayedWelcomeText.length - 1));
        }, 22);
      } else {
        setIsDeletingWelcome(false);
        setWelcomeIndex((prev) => (prev + 1) % CECILIAN_WELCOME_MESSAGES.length);
      }
    }

    return () => clearTimeout(timer);
  }, [displayedWelcomeText, isDeletingWelcome, welcomeIndex]);

  const { isOnline, isChecking, checkConnection } = useNetworkStatus();
  const [viewOfflineHub, setViewOfflineHub] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [forcePwaModal, setForcePwaModal] = useState(false);

  // If user explicitly chooses to view the dedicated offline hub
  if (viewOfflineHub) {
    return (
      <OfflineLandingPage
        onReturnToOnlineLanding={() => setViewOfflineHub(false)}
        onNavigateToAuth={onNavigateToAuth}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#FFFFFF] dark:bg-[#121316] text-[#111827] dark:text-stone-100 font-sans selection:bg-[#991B1B] selection:text-white">
      
      {/* Offline Status Alert Bar */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 z-60 bg-[#8B181B] text-white px-4 py-2 shadow-md">
          <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <WifiOff className="w-3.5 h-3.5 text-amber-300" />
              <span className="font-semibold">
                Offline Mode — Cecilian Alumnet is operating with cached assets and directory data.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewOfflineHub(true)}
                className="px-2.5 py-1 rounded-md bg-white text-[#8B181B] font-bold text-[11px] shadow-xs hover:bg-stone-100 active:scale-95 transition-all cursor-pointer whitespace-nowrap"
              >
                Open Offline Hub
              </button>
              <button
                onClick={() => checkConnection()}
                disabled={isChecking}
                className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 border border-white/20 font-medium text-[11px] flex items-center gap-1 cursor-pointer disabled:opacity-60 whitespace-nowrap"
              >
                <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
                <span>{isChecking ? 'Retrying...' : 'Retry'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          STICKY HEADER — EXPANDED TO FULL SCREEN WIDTH (FLUTTER-FREE)
          ======================================================== */}
      <header
        className={`fixed ${!isOnline ? 'top-10 sm:top-8' : 'top-0'} left-0 right-0 z-50 pt-safe transition-[background-color,border-color,box-shadow] duration-200 ${
          isScrolled
            ? 'bg-white/95 dark:bg-[#181615]/95 backdrop-blur-md border-b border-stone-200/90 dark:border-stone-800 shadow-2xs'
            : 'bg-black/40 backdrop-blur-xs border-b border-white/10'
        }`}
      >
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 xl:px-16 h-16 sm:h-[68px] flex items-center justify-between">
          
          {/* Logo Brand: "ST. CECILIA'S" / "ALUMNI" with Team Seal */}
          <div
            onClick={() => {
              setIsMobileNavOpen(false);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 sm:gap-4 cursor-pointer select-none group"
          >
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full p-0.5 bg-gradient-to-tr from-[#8B181B] to-amber-500 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-200">
              <img
                src="/assets/cecilians-seal.jpg"
                alt="Alumni Cecilian's Seal"
                referrerPolicy="no-referrer"
                className="w-full h-full rounded-full object-cover bg-white"
              />
            </div>
            <div className="flex flex-col">
              <span
                className={`font-sans tracking-[0.14em] text-base sm:text-lg font-extrabold leading-none group-hover:opacity-90 transition-colors ${
                  isScrolled ? 'text-[#8B181B] dark:text-rose-400' : 'text-white'
                }`}
                style={{ letterSpacing: '0.14em' }}
              >
                CECILIAN ALUMNET
              </span>
              <span
                className={`text-[9px] sm:text-[10px] tracking-[0.22em] font-bold uppercase mt-1 transition-colors ${
                  isScrolled ? 'text-stone-500 dark:text-amber-400' : 'text-amber-400'
                }`}
                style={{ letterSpacing: '0.22em' }}
              >
                ST. CECILIA'S COLLEGE
              </span>
            </div>
          </div>

          {/* Desktop Nav items */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold">
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className={`py-1 relative group cursor-pointer transition-colors ${
                isScrolled
                  ? 'text-stone-700 dark:text-stone-200 hover:text-[#8B181B] dark:hover:text-rose-400'
                  : 'text-stone-200 hover:text-white'
              }`}
            >
              <span>Home</span>
              <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-[#8B181B] dark:bg-rose-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
            </button>

            <button
              type="button"
              onClick={() => document.getElementById('history')?.scrollIntoView({ behavior: 'smooth' })}
              className={`py-1 relative group cursor-pointer transition-colors ${
                isScrolled
                  ? 'text-stone-700 dark:text-stone-200 hover:text-[#8B181B] dark:hover:text-rose-400'
                  : 'text-stone-200 hover:text-white'
              }`}
            >
              <span>History</span>
              <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-[#8B181B] dark:bg-rose-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
            </button>

            <button
              type="button"
              onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
              className={`py-1 relative group cursor-pointer transition-colors ${
                isScrolled
                  ? 'text-stone-700 dark:text-stone-200 hover:text-[#8B181B] dark:hover:text-rose-400'
                  : 'text-stone-200 hover:text-white'
              }`}
            >
              <span>About</span>
              <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-[#8B181B] dark:bg-rose-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
            </button>

            <button
              type="button"
              onClick={() => setShowGalleryModal(true)}
              className={`py-1 relative group cursor-pointer transition-colors ${
                isScrolled
                  ? 'text-stone-700 dark:text-stone-200 hover:text-[#8B181B] dark:hover:text-rose-400'
                  : 'text-stone-200 hover:text-white'
              }`}
            >
              <span>Campus Gallery</span>
              <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-[#8B181B] dark:bg-rose-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
            </button>

            <button
              type="button"
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className={`py-1 relative group cursor-pointer transition-colors ${
                isScrolled
                  ? 'text-stone-700 dark:text-stone-200 hover:text-[#8B181B] dark:hover:text-rose-400'
                  : 'text-stone-200 hover:text-white'
              }`}
            >
              <span>Features</span>
              <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-[#8B181B] dark:bg-rose-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
            </button>

            <div className="flex items-center gap-3 sm:gap-4 pl-2 lg:pl-4 border-l border-stone-300/40 dark:border-stone-700/50">
              <button
                type="button"
                onClick={() => setShowDownloadModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isScrolled
                    ? 'bg-amber-500/10 text-amber-900 dark:text-amber-300 hover:bg-amber-500/20 border border-amber-300/40 dark:border-amber-500/30'
                    : 'bg-white/15 text-amber-200 hover:bg-white/25 border border-white/20'
                }`}
                title="Download Android APK / Scan QR Code"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Get App</span>
              </button>

              {currentUser ? (
                <button
                  type="button"
                  onClick={() => onNavigateToAuth('login')}
                  className="bg-[#8B181B] hover:bg-[#721316] text-white px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-1.5"
                >
                  <span>Return to Portal</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigateToAuth('login')}
                    className={`py-1.5 px-3 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${
                      isScrolled
                        ? 'text-stone-700 dark:text-stone-200 hover:text-[#8B181B] dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                        : 'text-stone-200 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    Sign In
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateToAuth('register', 'alumni')}
                    className="bg-[#8B181B] hover:bg-[#721316] text-white px-4 sm:px-5 py-2 rounded-xl font-bold text-xs sm:text-sm shadow-xs transition-all hover:scale-102 active:scale-98 cursor-pointer"
                  >
                    Join Network
                  </button>
                </>
              )}

              {/* Theme Toggle Button (Desktop) */}
              <button
                type="button"
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isScrolled
                    ? 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200/80 dark:border-stone-700'
                    : 'text-stone-200 hover:text-white hover:bg-white/10 border border-white/20'
                }`}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle Dark/Light Theme"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400 stroke-[1.75]" />
                ) : (
                  <Moon className="w-4 h-4 stroke-[1.75]" />
                )}
              </button>
            </div>
          </nav>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            {/* Theme Toggle Button (Mobile) */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isScrolled
                  ? 'text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                  : 'text-stone-200 hover:bg-white/10'
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Dark/Light Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 stroke-[1.75]" />
              ) : (
                <Moon className="w-4 h-4 stroke-[1.75]" />
              )}
            </button>

            {currentUser ? (
              <button
                type="button"
                onClick={() => onNavigateToAuth('login')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#8B181B] text-white transition-colors cursor-pointer"
              >
                Portal
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigateToAuth('login')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  isScrolled
                    ? 'text-stone-700 dark:text-stone-200 hover:text-[#8B181B] dark:hover:text-rose-400 hover:bg-stone-100 dark:hover:bg-stone-800'
                    : 'text-stone-200 hover:text-white hover:bg-white/10'
                }`}
              >
                Sign In
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isScrolled
                  ? 'text-stone-800 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                  : 'text-white hover:bg-white/10'
              }`}
              aria-label="Toggle Navigation Menu"
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Down Menu Drawer */}
        <AnimatePresence>
          {isMobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="md:hidden bg-white/98 dark:bg-[#181615]/98 backdrop-blur-md border-b border-stone-200 dark:border-stone-800 shadow-xl overflow-hidden"
            >
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <img
                      src="/assets/cecilians-seal.jpg"
                      alt="Seal"
                      className="w-7 h-7 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider">
                      Cecilian Community
                    </span>
                  </div>
                  <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">ST. CECILIA'S</span>
                </div>

                <div className="flex flex-col space-y-2 text-sm font-semibold text-stone-700 dark:text-stone-300">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      setForcePwaModal(true);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-red-50 dark:bg-rose-950/40 text-left transition-colors cursor-pointer text-[#8B181B] dark:text-rose-300 font-bold shadow-2xs border border-red-200/50 dark:border-rose-900/50"
                  >
                    <span className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-[#8B181B] dark:text-rose-400" />
                      <span>Install App on Phone (PWA)</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#8B181B] dark:text-rose-400" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      setShowDownloadModal(true);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 text-left transition-colors cursor-pointer text-stone-800 dark:text-stone-200 font-medium"
                  >
                    <span className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-stone-500 dark:text-stone-400" />
                      <span>Download Android APK / Scan QR</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 text-left transition-colors cursor-pointer text-stone-800 dark:text-stone-200"
                  >
                    <span>Home</span>
                    <ArrowRight className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      const el = document.getElementById('history');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 text-left transition-colors cursor-pointer text-stone-800 dark:text-stone-200"
                  >
                    <span className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[#8B181B] dark:text-rose-400" />
                      <span>College History & Annals</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      const el = document.getElementById('about');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 text-left transition-colors cursor-pointer text-stone-800 dark:text-stone-200"
                  >
                    <span className="flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-[#8B181B] dark:text-rose-400" />
                      <span>About Cecilian Heritage</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      setShowGalleryModal(true);
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 text-left transition-colors cursor-pointer text-stone-800 dark:text-stone-200"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#8B181B] dark:text-rose-400" />
                      <span>Campus Heritage Gallery</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileNavOpen(false);
                      const el = document.getElementById('features');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 text-left transition-colors cursor-pointer text-stone-800 dark:text-stone-200"
                  >
                    <span>Alumni Network Features</span>
                    <ArrowRight className="w-4 h-4 text-stone-400 dark:text-stone-500" />
                  </button>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex flex-col gap-2">
                  {currentUser ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMobileNavOpen(false);
                        onNavigateToAuth('login');
                      }}
                      className="w-full py-2.5 px-4 rounded-xl bg-[#8B181B] text-white font-bold text-xs uppercase tracking-wider text-center shadow-xs hover:bg-[#721316] transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Return to Member Portal</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileNavOpen(false);
                          onNavigateToAuth('register', 'alumni');
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#8B181B] text-white font-bold text-xs uppercase tracking-wider text-center shadow-xs hover:bg-[#721316] transition-colors cursor-pointer"
                      >
                        Register as Cecilian Alumni
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsMobileNavOpen(false);
                          onNavigateToAuth('register', 'employer');
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-bold text-xs uppercase tracking-wider text-center hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors cursor-pointer border border-stone-200/80 dark:border-stone-700"
                      >
                        Employer Career Portal
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ========================================================
          HERO SECTION — EXPANDED TO FULL SCREEN WIDTH
          ======================================================== */}
      <section className="relative min-h-[92vh] flex items-center bg-[#111827] text-white overflow-hidden pt-20">
        
        {/* Slideshow Architecture Backdrop */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={CAMPUS_SLIDES[currentSlideIndex].id}
              initial={{ opacity: 0, scale: 1.08 }}
              animate={{ opacity: 1, scale: 1.02 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0"
            >
              <img
                src={CAMPUS_SLIDES[currentSlideIndex].image}
                alt={CAMPUS_SLIDES[currentSlideIndex].title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover filter contrast-110 brightness-80"
              />
            </motion.div>
          </AnimatePresence>

          {/* Gradients for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/75 to-black/40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-black/50 pointer-events-none" />
        </div>

        {/* Interactive 3D Ambient Constellation Scene (WebGL Three.js) */}
        <Landing3DCanvas intensity={1.15} />

        {/* Decorative corner red bracket */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="absolute left-6 sm:left-12 lg:left-16 top-28 z-10 w-12 h-12 border-t border-l border-[#991B1B]/70 pointer-events-none"
        />

        {/* Vertical tracking text along right edge */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="hidden 2xl:flex absolute right-8 top-1/2 -translate-y-1/2 z-10 select-none pointer-events-none"
        >
          <span
            className="text-[10px] font-semibold text-white/30 tracking-[0.4em] uppercase"
            style={{ writingMode: 'vertical-rl' }}
          >
            ALUMNI • ST. CECILIA'S COLLEGE • EST. 1999
          </span>
        </motion.div>

        {/* Slideshow Arrow Controls */}
        <div
          className="hidden sm:flex absolute inset-y-0 left-4 sm:left-8 z-20 items-center"
          onMouseEnter={() => setIsHoveringControls(true)}
          onMouseLeave={() => setIsHoveringControls(false)}
        >
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(153, 27, 27, 0.85)' }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={goToPrevSlide}
            aria-label="Previous Slide"
            className="p-3 rounded-full bg-black/40 text-white/70 hover:text-white border border-white/10 hover:border-white/30 backdrop-blur-md transition-colors shadow-lg cursor-pointer"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
        </div>

        <div
          className="hidden sm:flex absolute inset-y-0 right-4 sm:right-8 z-20 items-center"
          onMouseEnter={() => setIsHoveringControls(true)}
          onMouseLeave={() => setIsHoveringControls(false)}
        >
          <motion.button
            whileHover={{ scale: 1.1, backgroundColor: 'rgba(153, 27, 27, 0.85)' }}
            whileTap={{ scale: 0.95 }}
            type="button"
            onClick={goToNextSlide}
            aria-label="Next Slide"
            className="p-3 rounded-full bg-black/40 text-white/70 hover:text-white border border-white/10 hover:border-white/30 backdrop-blur-md transition-colors shadow-lg cursor-pointer"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </div>

        {/* Main Hero Content — Widescreen 1800px Container */}
        <div className="relative z-10 w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-18 py-16 sm:py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 xl:gap-20 items-center">
            
            {/* Left Column: Heading, Typewriter, Subtext, CTAs */}
            <div className="lg:col-span-7 xl:col-span-7">
              {/* Typewriter Greeting with Official Cecilian Seal & Slide Badge */}
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-wrap items-center gap-3 mb-8"
              >
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-[#8B181B]/60 bg-black/60 backdrop-blur-md shadow-[0_4px_24px_rgba(139,24,27,0.25)] text-stone-200 text-xs sm:text-sm">
                  <div className="relative w-5 h-5 rounded-full ring-1 ring-amber-400/60 overflow-hidden shrink-0">
                    <img
                      src="/assets/cecilians-seal.jpg"
                      alt="Alumni Cecilian's Seal"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold tracking-[0.16em] uppercase text-[#fca5a5]">
                    Official Alumni Portal
                  </span>
                  <span aria-hidden="true" className="text-stone-500">·</span>
                  <div className="flex items-center min-h-[22px]">
                    <span className="font-serif italic text-xs sm:text-[14px] text-white tracking-wide">
                      {displayedWelcomeText}
                    </span>
                    <motion.span
                      animate={{ opacity: [1, 0, 1] }}
                      transition={{ duration: 0.75, repeat: Infinity, ease: 'linear' }}
                      className="inline-block w-[2px] h-3.5 sm:h-4 bg-[#f87171] ml-1 shadow-[0_0_8px_#ef4444]"
                    />
                  </div>
                </div>

                {/* Active Slide Tracker Chip */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={CAMPUS_SLIDES[currentSlideIndex].id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.3 }}
                    className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/15 bg-black/30 backdrop-blur-md text-[11px] font-semibold text-stone-300"
                  >
                    <span className="w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                    <span>{CAMPUS_SLIDES[currentSlideIndex].badge}</span>
                  </motion.div>
                </AnimatePresence>
              </motion.div>

              {/* High-Impact Display Headline */}
              <motion.h1
                variants={heroHeadingContainerVariants}
                initial="hidden"
                animate="visible"
                className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-7xl xl:text-8xl 2xl:text-9xl font-normal text-white leading-[1.05] tracking-tight mb-6 sm:mb-8"
              >
                <motion.span variants={heroHeadingLineVariants} className="block">
                  Where
                </motion.span>
                <motion.span variants={heroHeadingLineVariants} className="block italic font-normal text-[#fca5a5]/95">
                  Legacy
                </motion.span>
                <motion.span variants={heroHeadingLineVariants} className="block">
                  Lives On.
                </motion.span>
              </motion.h1>

              {/* Subtext with red accent mark & current slide details */}
              <motion.div
                variants={heroSubheadlineVariants}
                initial="hidden"
                animate="visible"
                className="flex items-start gap-4 max-w-3xl mb-10"
              >
                <motion.span
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                  className="w-6 h-[2px] bg-[#991B1B] mt-3 shrink-0 origin-left"
                />
                <div>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
                    className="text-stone-200 text-base sm:text-lg lg:text-xl leading-relaxed font-light"
                  >
                    The official digital bridge for graduates of St. Cecilia's College – Cebu, Inc. Reconnect with batchmates, verify alumni credentials, access career milestones, and honor our enduring heritage of excellence.
                  </motion.p>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={CAMPUS_SLIDES[currentSlideIndex].id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.35 }}
                      className="text-xs sm:text-sm text-red-300/90 font-medium mt-3 italic"
                    >
                      Featured: {CAMPUS_SLIDES[currentSlideIndex].title} — {CAMPUS_SLIDES[currentSlideIndex].caption}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Pillar Verification Chips */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                className="flex flex-wrap items-center gap-3 mb-10 text-xs sm:text-sm text-stone-300 font-medium"
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verified Registrar Matching</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-xs">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>CHED & DepEd Recognized</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 backdrop-blur-xs">
                  <Globe className="w-4 h-4 text-sky-400" />
                  <span>Global Chapters Network</span>
                </div>
              </motion.div>

              {/* CTA Buttons */}
              <motion.div
                variants={heroCtaVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-wrap items-center gap-4 sm:gap-6"
              >
                <motion.button
                  whileHover={{ scale: 1.03, backgroundColor: '#7f1616' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigateToAuth('register', 'alumni')}
                  className="bg-[#991B1B] text-white px-9 py-4 rounded-xl font-bold text-xs sm:text-sm tracking-[0.18em] uppercase shadow-lg shadow-red-950/50 hover:shadow-red-900/60 transition-all cursor-pointer flex items-center gap-2.5"
                >
                  <span>APPLY FOR ALUMNI ID</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.03, backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onNavigateToAuth('login')}
                  className="bg-transparent text-white border border-white/30 hover:border-white px-9 py-4 rounded-xl font-bold text-xs sm:text-sm tracking-[0.18em] uppercase transition-colors cursor-pointer"
                >
                  SIGN IN TO PORTAL
                </motion.button>
              </motion.div>
            </div>

            {/* Right Column: Interactive 3D Holographic Alumni Credential Pass */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.95, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5 xl:col-span-5 flex flex-col items-center justify-center pt-6 lg:pt-0"
            >
              <div className="w-full max-w-md lg:max-w-lg">
                <Landing3DPass onRegisterClick={() => onNavigateToAuth('register', 'alumni')} />
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Interactive Slideshow Pagination */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md border border-white/15"
          onMouseEnter={() => setIsHoveringControls(true)}
          onMouseLeave={() => setIsHoveringControls(false)}
        >
          {CAMPUS_SLIDES.map((slide, idx) => {
            const isSelected = idx === currentSlideIndex;
            return (
              <button
                key={slide.id}
                onClick={() => setCurrentSlideIndex(idx)}
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer relative ${
                  isSelected
                    ? 'text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeSlideIndicator"
                    className="absolute inset-0 bg-[#991B1B] rounded-full shadow-md -z-10"
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <span>0{slide.id}</span>
                <span className="hidden sm:inline text-[11px] font-medium opacity-90">
                  {idx === 0 ? 'Tower' : idx === 1 ? 'Main Hall' : 'Campus'}
                </span>
                <span
                  className={`h-1 rounded-full transition-all duration-300 ${
                    isSelected ? 'w-6 bg-white' : 'w-2 bg-white/30'
                  }`}
                />
              </button>
            );
          })}
        </motion.div>
      </section>

      {/* ========================================================
          STATS BAND — EXPANDED TO FULL SCREEN WIDTH
          ======================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="bg-gradient-to-r from-[#8B181B] via-[#991B1B] to-[#7f1616] text-white border-y border-[#7f1616] shadow-inner"
      >
        <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-18 py-6 sm:py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/20 py-2 sm:py-4">
            <AnimatedStat value={5000} suffix="+" label="Graduates" sublabel="Across 28 Countries Worldwide" />
            <AnimatedStat value={12} label="Active Chapters" sublabel="Regional & International Hubs" />
            <AnimatedStat value={98} suffix="%" label="Registrar Match Rate" sublabel="Official Cecilian Registry" />
            <AnimatedStat value={27} suffix="+" label="Years of Legacy" sublabel="Founded 1999 • Minglanilla, Cebu" />
          </div>
        </div>
      </motion.section>

      {/* ========================================================
          COLLEGE HISTORY & ANNALS — EXPANSIVE INSTITUTIONAL TIMELINE
          Chronicles of St. Cecilia's College - Cebu, Inc. (1999–Present)
          ======================================================== */}
      <CollegeHistorySection />

      {/* ========================================================
          ABOUT & INSTITUTIONAL HERITAGE — EXPANSIVE FULL-WIDTH BENTO
          ======================================================== */}
      <motion.section
        id="about"
        initial={{ opacity: 0, y: 28 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="py-24 sm:py-32 bg-[#FAF9F6] border-b border-[#E5E7EB]"
      >
        <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-18">
          
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 pb-8 border-b border-stone-200/80">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-6 h-[2px] bg-[#991B1B]" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#991B1B]">
                  ABOUT ST. CECILIA'S COLLEGE - CEBU
                </span>
              </div>
              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#111827] font-normal leading-[1.1] tracking-tight">
                A Network Built on Tradition.<br />
                A Future Powered by Community.
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => onNavigateToAuth('register', 'alumni')}
                className="bg-[#8B181B] hover:bg-[#721316] text-white px-7 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.18em] transition-all shadow-sm cursor-pointer"
              >
                Join Alumni Directory
              </button>
              <button
                onClick={() => setShowGalleryModal(true)}
                className="bg-white border border-stone-300 hover:border-stone-400 text-stone-800 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.18em] transition-all cursor-pointer"
              >
                View Archives
              </button>
            </div>
          </div>

          {/* Expansive Bento Grid filling the screen */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
            
            {/* Left Bento: Institutional Foundation & Core Pillars */}
            <div className="lg:col-span-5 flex flex-col justify-between bg-white border border-stone-200 rounded-3xl p-8 sm:p-10 lg:p-12 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)]">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-[#8B181B] border border-red-100 flex items-center justify-center shrink-0">
                    <Landmark className="w-6 h-6 stroke-[1.75]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B181B] block">
                      Foundational Heritage
                    </span>
                    <h3 className="font-display text-2xl text-stone-900 font-bold">
                      Est. January 1999 • Minglanilla
                    </h3>
                  </div>
                </div>

                <div className="space-y-5 text-stone-600 text-sm sm:text-base leading-relaxed font-normal">
                  <p>
                    Founded in January 1999 under the inspirational leadership of Mrs. Lorna Real Parrotina, St. Cecilia's College began with humble roots of 10 pioneer pupils.
                  </p>
                  <p>
                    Through the enduring stewardship of the Board of Trustees and Mrs. Rosalina N. Go, the institution has grown into an acclaimed center of excellence in southern Cebu, shaping leaders across technology, business, education, criminology, and the arts.
                  </p>
                </div>

                {/* Core Cecilian Pillars */}
                <div className="mt-8 pt-8 border-t border-stone-100">
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-stone-400 block mb-4">
                    The Three Cecilian Pillars
                  </span>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 text-center">
                      <span className="text-xs font-bold text-[#8B181B] block">Virtus</span>
                      <span className="text-[10px] text-stone-500">Character & Faith</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 text-center">
                      <span className="text-xs font-bold text-[#8B181B] block">Scientia</span>
                      <span className="text-[10px] text-stone-500">Academic Rigor</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-100 text-center">
                      <span className="text-xs font-bold text-[#8B181B] block">Charitas</span>
                      <span className="text-[10px] text-stone-500">Service to All</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-stone-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-semibold text-stone-500">
                  <MapPin className="w-4 h-4 text-[#8B181B]" />
                  <span>Poblacion Ward II, Minglanilla, Cebu</span>
                </div>
                <button
                  onClick={() => onNavigateToAuth('register', 'alumni')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B181B] hover:text-[#721316] transition-colors"
                >
                  <span>Connect With Batches</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right Bento: Campus Archival Spotlight + Fast Institutional Portals */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-6">
              
              {/* Top Banner: Campus Photographic Card */}
              <div className="relative rounded-3xl overflow-hidden border border-stone-200 shadow-md group min-h-[300px] flex items-end">
                <img
                  src="/assets/landing-building-2.jpg"
                  alt="St. Cecilia's College Main Hall"
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                
                <div className="relative z-10 p-8 sm:p-10 text-white w-full">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/80 backdrop-blur-md text-[11px] font-bold uppercase tracking-wider mb-3">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Campus Legacy Showcase</span>
                  </div>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold mb-2">
                    St. Cecilia's College Main Institutional Hall
                  </h3>
                  <p className="text-stone-200 text-xs sm:text-sm max-w-2xl font-light mb-4">
                    The heart of Cecilian collegiate life. Featuring modern computer laboratories, accredited criminology suites, maritime simulators, and comprehensive learning complexes.
                  </p>
                  <div className="flex flex-wrap gap-4 text-xs font-semibold text-stone-300">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> CHED & DepEd Government Recognition
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-amber-400" /> PACUCOA Accredited Programs
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Row: Direct Institutional Fast Directives */}
              <div className="bg-white border border-stone-200 rounded-3xl p-8 sm:p-10 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8B181B] block">
                      Direct Institutional Portals
                    </span>
                    <h4 className="text-lg font-bold text-stone-900">
                      Quick Cecilian Network Access
                    </h4>
                  </div>
                  <span className="text-xs text-stone-400 font-mono">PORTALS • 2026</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div
                    onClick={() => onNavigateToAuth('register', 'alumni')}
                    className="p-4 rounded-2xl bg-stone-50 hover:bg-red-50/50 border border-stone-200/80 hover:border-red-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <GraduationCap className="w-5 h-5 text-[#8B181B]" />
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#8B181B] group-hover:translate-x-1 transition-all" />
                    </div>
                    <span className="text-sm font-bold text-stone-900 block mb-1">
                      Alumni ID Card
                    </span>
                    <span className="text-xs text-stone-500">
                      Generate digital pass with QR verification
                    </span>
                  </div>

                  <div
                    onClick={() => onNavigateToAuth('register', 'alumni')}
                    className="p-4 rounded-2xl bg-stone-50 hover:bg-red-50/50 border border-stone-200/80 hover:border-red-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Users className="w-5 h-5 text-[#8B181B]" />
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#8B181B] group-hover:translate-x-1 transition-all" />
                    </div>
                    <span className="text-sm font-bold text-stone-900 block mb-1">
                      Batch Directory
                    </span>
                    <span className="text-xs text-stone-500">
                      Connect with graduates by class year
                    </span>
                  </div>

                  <div
                    onClick={() => onNavigateToAuth('register', 'employer')}
                    className="p-4 rounded-2xl bg-stone-50 hover:bg-red-50/50 border border-stone-200/80 hover:border-red-200 transition-all cursor-pointer group sm:col-span-2 lg:col-span-1"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Briefcase className="w-5 h-5 text-[#8B181B]" />
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-[#8B181B] group-hover:translate-x-1 transition-all" />
                    </div>
                    <span className="text-sm font-bold text-stone-900 block mb-1">
                      Career Placement
                    </span>
                    <span className="text-xs text-stone-500">
                      Post & apply for exclusive job roles
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>
      </motion.section>

      {/* ========================================================
          FEATURES SECTION — EXPANDED TO FULL SCREEN WIDTH
          ======================================================== */}
      <section id="features" className="py-24 sm:py-32 bg-[#FFFFFF] border-b border-[#E5E7EB]">
        <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-18">
          
          {/* Header Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16"
          >
            <div>
              {/* Red Label */}
              <div className="flex items-center gap-2 mb-4">
                <span className="w-6 h-[2px] bg-[#991B1B]" />
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#991B1B]">
                  FEATURES & NETWORK CAPABILITIES
                </span>
              </div>

              <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#111827] font-normal leading-[1.1] tracking-tight">
                Everything You Need,<br />
                In One Place.
              </h2>
            </div>

            {/* GET ACCESS button */}
            <div className="flex items-center gap-4">
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: '#991B1B', color: '#ffffff' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onNavigateToAuth('register', 'alumni')}
                className="border border-[#991B1B] text-[#991B1B] px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-[0.2em] transition-all cursor-pointer"
              >
                GET ACCESS NOW
              </motion.button>
            </div>
          </motion.div>

          {/* 6-Grid Feature Cards (3 columns x 2 rows) with generous wide padding */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          >
            {/* Card 1: Alumni Network */}
            <TiltCard className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-stone-50/60 hover:bg-white border border-stone-200/90 rounded-3xl transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] group cursor-default">
              <div>
                <div className="mb-8 w-14 h-14 rounded-2xl bg-red-50 text-[#8B181B] border border-red-100 flex items-center justify-center group-hover:scale-110 transition-transform origin-left shadow-2xs">
                  <Users className="w-7 h-7 stroke-[1.75]" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B181B]">
                    01 • DIRECTORY
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">
                  Alumni Network
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Connect with thousands of St. Cecilia's graduates across all generations, college programs, and corporate industries.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-200/60 flex items-center justify-between text-xs font-semibold text-stone-500">
                <span>Verified Match Records</span>
                <span className="text-[#8B181B] group-hover:translate-x-1 transition-transform">Explore →</span>
              </div>
            </TiltCard>

            {/* Card 2: Digital Alumni ID Pass */}
            <TiltCard className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-stone-50/60 hover:bg-white border border-stone-200/90 rounded-3xl transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] group cursor-default">
              <div>
                <div className="mb-8 w-14 h-14 rounded-2xl bg-amber-50 text-[#B45309] border border-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform origin-left shadow-2xs">
                  <GraduationCap className="w-7 h-7 stroke-[1.75]" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B45309]">
                    02 • CREDENTIALS
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">
                  Digital Alumni Card
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Interactive, QR-verifiable digital alumni pass authenticating your degree, graduation year, and official alumni status.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-200/60 flex items-center justify-between text-xs font-semibold text-stone-500">
                <span>Instant QR Verification</span>
                <span className="text-[#B45309] group-hover:translate-x-1 transition-transform">Preview Pass →</span>
              </div>
            </TiltCard>

            {/* Card 3: Career Board */}
            <TiltCard className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-stone-50/60 hover:bg-white border border-stone-200/90 rounded-3xl transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] group cursor-default">
              <div>
                <div className="mb-8 w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform origin-left shadow-2xs">
                  <Briefcase className="w-7 h-7 stroke-[1.75]" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">
                    03 • OPPORTUNITIES
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">
                  Career Placement Board
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Exclusive corporate partner openings, alumni-referred job vacancies, internship pipelines, and recruitment portals.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-200/60 flex items-center justify-between text-xs font-semibold text-stone-500">
                <span>For Employers & Alumni</span>
                <span className="text-emerald-800 group-hover:translate-x-1 transition-transform">Browse Jobs →</span>
              </div>
            </TiltCard>

            {/* Card 4: Announcements & Convocations */}
            <TiltCard className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-stone-50/60 hover:bg-white border border-stone-200/90 rounded-3xl transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] group cursor-default">
              <div>
                <div className="mb-8 w-14 h-14 rounded-2xl bg-stone-100 text-stone-800 border border-stone-200 flex items-center justify-center group-hover:scale-110 transition-transform origin-left shadow-2xs">
                  <Megaphone className="w-7 h-7 stroke-[1.75]" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-600">
                    04 • NOTIFICATIONS
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">
                  Institutional Announcements
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Real-time administration updates, Grand Homecoming notifications, presidential memos, and verified alumni news.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-200/60 flex items-center justify-between text-xs font-semibold text-stone-500">
                <span>Admin Broadcasts</span>
                <span className="text-stone-700 group-hover:translate-x-1 transition-transform">Read Feed →</span>
              </div>
            </TiltCard>

            {/* Card 5: Batch Chapters */}
            <TiltCard className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-stone-50/60 hover:bg-white border border-stone-200/90 rounded-3xl transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] group cursor-default">
              <div>
                <div className="mb-8 w-14 h-14 rounded-2xl bg-red-50 text-[#8B181B] border border-red-100 flex items-center justify-center group-hover:scale-110 transition-transform origin-left shadow-2xs">
                  <Globe className="w-7 h-7 stroke-[1.75]" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8B181B]">
                    05 • CHAPTERS
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">
                  Global Batch Chapters
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Join regional Cecilian chapters across Cebu, Metro Manila, Singapore, the Middle East, North America, and Europe.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-200/60 flex items-center justify-between text-xs font-semibold text-stone-500">
                <span>12 Active Hubs</span>
                <span className="text-[#8B181B] group-hover:translate-x-1 transition-transform">Find Chapter →</span>
              </div>
            </TiltCard>

            {/* Card 6: Career Milestones */}
            <TiltCard className="p-8 sm:p-10 lg:p-12 flex flex-col justify-between bg-stone-50/60 hover:bg-white border border-stone-200/90 rounded-3xl transition-all shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] group cursor-default">
              <div>
                <div className="mb-8 w-14 h-14 rounded-2xl bg-amber-50 text-[#B45309] border border-amber-100 flex items-center justify-center group-hover:scale-110 transition-transform origin-left shadow-2xs">
                  <Trophy className="w-7 h-7 stroke-[1.75]" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#B45309]">
                    06 • ACHIEVEMENTS
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#111827] mb-3">
                  Milestones & Honors
                </h3>
                <p className="text-sm text-[#6B7280] leading-relaxed">
                  Celebrate licensure board topnotchers, promotions, startup foundings, and distinguished alumni award recipients.
                </p>
              </div>
              <div className="mt-8 pt-6 border-t border-stone-200/60 flex items-center justify-between text-xs font-semibold text-stone-500">
                <span>Cecilian Pride</span>
                <span className="text-[#B45309] group-hover:translate-x-1 transition-transform">View Hall of Fame →</span>
              </div>
            </TiltCard>
          </motion.div>

          {/* Panoramic Collegiate Chapter & Batch Locator Banner */}
          <div className="mt-12 bg-stone-900 text-white rounded-3xl p-8 sm:p-12 border border-stone-800 shadow-xl relative overflow-hidden">
            <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#8B181B]/30 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-2xl">
                <span className="text-xs font-bold uppercase tracking-[0.25em] text-red-400 block mb-2">
                  BATCH DIRECTORY DISCOVERY
                </span>
                <h3 className="font-display text-3xl sm:text-4xl text-white font-normal mb-3">
                  Find Your Graduating Classmates
                </h3>
                <p className="text-stone-300 text-sm sm:text-base font-light leading-relaxed">
                  Search across 27+ graduating classes from Elementary, High School, Senior High, and College degree programs. Verified against official registrar records.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Search by Batch Year or Degree..."
                    value={searchBatchQuery}
                    onChange={(e) => setSearchBatchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder-stone-400 text-xs sm:text-sm focus:outline-none focus:border-red-400"
                  />
                </div>
                <button
                  onClick={() => onNavigateToAuth('register', 'alumni')}
                  className="w-full sm:w-auto bg-[#991B1B] hover:bg-[#7f1616] text-white px-7 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.16em] transition-all whitespace-nowrap cursor-pointer"
                >
                  Explore Batches
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          MOBILE APP & APK DOWNLOAD SECTION (WITH LIVE QR CODE)
          ======================================================== */}
      <AppDownloadSection />

      {/* ========================================================
          CALL TO ACTION FOOTER BANNER — EXPANDED TO FULL SCREEN WIDTH
          ======================================================== */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="py-24 sm:py-32 bg-[#111827] text-white relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#8B181B]/30 via-transparent to-transparent pointer-events-none" />

        <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-18 text-center relative z-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-16 h-16 rounded-2xl bg-[#991B1B] mx-auto flex items-center justify-center text-white mb-8 shadow-xl shadow-red-950/60 ring-4 ring-[#991B1B]/30"
          >
            <GraduationCap className="w-8 h-8" />
          </motion.div>

          <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl font-normal text-white mb-6 tracking-tight">
            Carry the Cecilian Spirit Forward
          </h2>

          <p className="text-stone-300 text-base sm:text-lg max-w-2xl mx-auto mb-10 font-light leading-relaxed">
            Rejoin your official alumni directory, connect with fellow graduates worldwide, access your digital credential ID, and honor St. Cecilia's continuing legacy of excellence.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-5">
            <motion.button
              whileHover={{ scale: 1.03, backgroundColor: '#7f1616' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigateToAuth('register', 'alumni')}
              className="bg-[#991B1B] text-white px-9 py-4 rounded-xl font-bold text-xs sm:text-sm tracking-[0.18em] uppercase shadow-lg shadow-red-950/40 transition-colors cursor-pointer"
            >
              REGISTER FOR ALUMNI ACCESS
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03, backgroundColor: 'rgba(255, 255, 255, 0.12)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigateToAuth('login')}
              className="bg-transparent text-white border border-white/30 hover:border-white px-9 py-4 rounded-xl font-bold text-xs sm:text-sm tracking-[0.18em] uppercase transition-colors cursor-pointer"
            >
              SIGN IN TO ACCOUNT
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDownloadModal(true)}
              className="flex items-center gap-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-8 py-4 rounded-xl font-bold text-xs sm:text-sm tracking-[0.16em] uppercase transition-colors cursor-pointer"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              <span>SCAN QR / GET APK</span>
            </motion.button>
          </div>
        </div>
      </motion.section>

      {/* ========================================================
          INSTITUTIONAL FOOTER — EXPANDED TO FULL SCREEN WIDTH
          ======================================================== */}
      <footer className="bg-[#FFFFFF] border-t border-[#E5E7EB] py-16 text-[#6B7280] text-xs">
        <div className="w-full max-w-[1800px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-18">
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-200">
            {/* Col 1 & 2: Branding & Address */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/assets/cecilians-seal.jpg"
                  alt="Cecilian Seal"
                  className="w-10 h-10 rounded-full object-cover shadow-xs"
                />
                <div className="flex flex-col">
                  <span className="font-display tracking-[0.2em] text-[#8B181B] text-lg font-bold">
                    ST. CECILIA'S COLLEGE
                  </span>
                  <span className="text-[10px] tracking-[0.25em] text-stone-500 font-semibold uppercase">
                    CEBU, INC. • ALUMNI NETWORK
                  </span>
                </div>
              </div>

              <p className="text-stone-500 text-xs sm:text-sm leading-relaxed max-w-sm mb-4">
                The institutional alumni network fostering lifelong engagement, academic legacy, and professional advancement for Cecilians worldwide.
              </p>

              <div className="text-[11px] text-stone-400 space-y-1">
                <p>Poblacion Ward II, Minglanilla, Cebu, Philippines</p>
                <p>Email: alumni@stcecilia.edu.ph • Tel: (032) 268-4746</p>
              </div>
            </div>

            {/* Col 3: Alumni Services */}
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4">
                Alumni Services
              </h4>
              <ul className="space-y-2.5 text-[13px] text-stone-600">
                <li>
                  <button onClick={() => onNavigateToAuth('register', 'alumni')} className="hover:text-[#8B181B] transition-colors cursor-pointer">
                    Digital Alumni ID
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigateToAuth('register', 'alumni')} className="hover:text-[#8B181B] transition-colors cursor-pointer">
                    Batch Directory
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigateToAuth('login')} className="hover:text-[#8B181B] transition-colors cursor-pointer">
                    Registrar Verification
                  </button>
                </li>
                <li>
                  <button onClick={() => onNavigateToAuth('register', 'employer')} className="hover:text-[#8B181B] transition-colors cursor-pointer">
                    Employer Career Hub
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 4: Community & Campus */}
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4">
                Campus & Chapters
              </h4>
              <ul className="space-y-2.5 text-[13px] text-stone-600">
                <li>
                  <button onClick={() => setShowGalleryModal(true)} className="hover:text-[#8B181B] transition-colors cursor-pointer">
                    Campus Photo Archives
                  </button>
                </li>
                <li>
                  <a href="#about" className="hover:text-[#8B181B] transition-colors">
                    Institutional Heritage
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-[#8B181B] transition-colors">
                    Global Alumni Chapters
                  </a>
                </li>
                <li>
                  <a href="#features" className="hover:text-[#8B181B] transition-colors">
                    Grand Homecoming 2026
                  </a>
                </li>
              </ul>
            </div>

            {/* Col 5: Cecilian Motto */}
            <div>
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-4">
                Institutional Creed
              </h4>
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
                <span className="text-xs font-bold text-[#8B181B] block mb-1">
                  Virtus • Scientia • Charitas
                </span>
                <p className="text-[11px] text-stone-500 leading-relaxed">
                  Virtue in moral character, Science in academic pursuit, Charity in genuine community service.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
            <div>
              © {new Date().getFullYear()} St. Cecilia's College - Cebu, Inc. All rights reserved.
            </div>
            <div className="flex items-center gap-6">
              <a href="#about" className="hover:text-stone-800">Privacy Policy</a>
              <span>•</span>
              <a href="#about" className="hover:text-stone-800">Terms of Use</a>
              <span>•</span>
              <a href="#about" className="hover:text-stone-800">Community Standards</a>
            </div>
          </div>

        </div>
      </footer>

      {/* ========================================================
          CAMPUS & HERITAGE GALLERY MODAL
          ======================================================== */}
      <CampusGalleryModal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
      />

      {/* ========================================================
          MOBILE APP & APK DOWNLOAD MODAL (QR CODE SCANNER)
          ======================================================== */}
      <AppDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />

      {/* ========================================================
          MOBILE PWA INSTALL TOAST & MODAL PROMPT
          ======================================================== */}
      <LandingPWAInstallPrompt
        forceOpenModal={forcePwaModal}
        onCloseModal={() => setForcePwaModal(false)}
        onOpenApkModal={() => {
          setForcePwaModal(false);
          setShowDownloadModal(true);
        }}
      />

    </div>
  );
};
