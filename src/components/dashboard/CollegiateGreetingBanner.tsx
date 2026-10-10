/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap,
  MapPin,
  ShieldCheck,
  Calendar,
  ArrowUpRight,
  BookOpen,
  Building2,
  Users,
  Compass,
  FileBadge,
  RefreshCw,
  ScanFace
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { QuickStatusSelector, getStatusConfig } from './QuickStatusSelector';
import { GooeyBackground } from '../common/GooeyBackground';
import { CollegiateGreetingBannerSkeleton } from '../common/BentoSkeleton';

interface CollegiateGreetingBannerProps {
  onOpenDigitalCard?: () => void;
}

export const CollegiateGreetingBanner: React.FC<CollegiateGreetingBannerProps> = ({
  onOpenDigitalCard
}) => {
  const { currentUser, users, events, opportunities, friendRequests, setActiveTab, refreshData, isLoadingData } = useAlumni();

  // Natural time-of-day human salutation (Morning, Afternoon, Evening)
  const salutation = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Formatted human calendar date (e.g., Wednesday, September 24, 2026)
  const formattedDate = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date());
  }, []);

  // Compute live contextual metrics
  const activeEventsCount = events.filter((e) => new Date(e.startDate) >= new Date()).length;
  const activeOpportunitiesCount = opportunities.length;
  const pendingRequestsCount = friendRequests.filter(
    (r) => r.toUid === currentUser?.uid && r.status === 'pending'
  ).length;

  // Authentic human-crafted summary based on real institutional context
  const contextualNote = useMemo(() => {
    if (!currentUser) {
      return "Welcome to the official St. Cecilia's College alumni commons. Connect with fellow graduates and explore alumni community updates.";
    }

    if (currentUser.role === 'admin' || currentUser.role === 'registrar' || currentUser.role === 'superadmin') {
      return `Institutional governance session active. You have oversight over ${users.length} registered Cecilians across ${new Set(users.map((u) => u.course).filter(Boolean)).size} academic degree programs, with ${activeEventsCount} upcoming campus engagements.`;
    }

    if (currentUser.role === 'employer') {
      return `Partner portal active for ${currentUser.company || 'Partner Organization'}. Review verified student credentials, publish career openings, and coordinate recruitment drives with Cecilian talent.`;
    }

    // Default Alumni
    const batchText = currentUser.batch ? `Class of ${currentUser.batch}` : 'Cecilian Alumni';
    return `Welcome to your lifelong Cecilian gateway. You are connected with ${users.length} alumni, with ${activeEventsCount} scheduled campus events and ${activeOpportunitiesCount} verified partner career postings available.`;
  }, [currentUser, users, activeEventsCount, activeOpportunitiesCount]);

  // Determine user title or academic degree display
  const academicAffiliation = useMemo(() => {
    if (!currentUser) return 'Cecilian Community Member';
    if (currentUser.role === 'admin' || currentUser.role === 'superadmin') {
      return 'Office of Systems & Institutional Governance';
    }
    if (currentUser.role === 'registrar') {
      return 'Office of the Registrar & Academic Masterlist';
    }
    if (currentUser.role === 'employer') {
      return currentUser.company ? `Corporate Liaison · ${currentUser.company}` : 'Industry Partner Representative';
    }
    if (currentUser.course) {
      return currentUser.course;
    }
    return 'Bachelor of Science Graduate';
  }, [currentUser]);

  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Alumnus';

  if (isLoadingData) {
    return <CollegiateGreetingBannerSkeleton />;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden w-full max-w-full overflow-x-hidden rounded-xl bg-white border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
    >
      {/* Refined St. Cecilia Deep Crimson Top Architectural Accent */}
      <div className="h-1 w-full bg-[#8B181B]" />

      <div className="relative z-10 px-4 py-3 sm:px-6 sm:py-3.5 lg:px-6 lg:py-3.5 w-full max-w-full overflow-x-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 lg:gap-6 w-full">
          {/* Main Editorial Greetings Column */}
          <div className="space-y-1.5 sm:space-y-2 min-w-0 flex-1">
            {/* Collegiate Institutional Kicker & Quick Status Badge Bar */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
              <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-2.5 gap-y-0.5 text-[10px] sm:text-[11px] font-medium tracking-wider text-stone-500 uppercase">
                <span className="text-[#8B181B] font-bold">St. Cecilia's College - Cebu, Inc.</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span>Office of Alumni Relations</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="text-stone-400">Minglanilla Campus</span>
              </div>

              {/* Quick Status Selector */}
              <QuickStatusSelector />
            </div>

            {/* Salutation with Profile Avatar */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={
                    currentUser?.profilePictureUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80'
                  }
                  alt={currentUser?.name || 'Alumni'}
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl object-cover ring-1 ring-stone-200 shadow-2xs border border-stone-100"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-white ring-2 ring-white">
                  <span
                    className={`block h-2 w-2 rounded-full ${
                      getStatusConfig(currentUser?.quickStatus).dotColor
                    }`}
                  />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-sm sm:text-lg md:text-xl lg:text-2xl text-stone-900 font-bold tracking-tight leading-snug break-words">
                  {salutation}, <span className="text-[#8B181B] font-bold">{currentUser?.name || 'Cecilian'}</span>.
                </h1>
              </div>
            </div>

            {/* Clean Unboxed Metadata Line */}
            <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-2.5 gap-y-0.5 text-[10px] sm:text-xs text-stone-600 break-words">
              {currentUser?.batch && (
                <>
                  <span className="font-semibold text-stone-800">
                    Class of {currentUser.batch}
                  </span>
                  <span aria-hidden="true" className="text-stone-300">·</span>
                </>
              )}

              <span className="text-stone-700 truncate max-w-full">
                {academicAffiliation}
              </span>

              {currentUser?.location && (
                <>
                  <span aria-hidden="true" className="text-stone-300">·</span>
                  <span className="inline-flex items-center gap-1 text-stone-500 truncate max-w-full">
                    <MapPin className="w-3.5 h-3.5 text-stone-400 stroke-[1.5] shrink-0" />
                    <span className="truncate">{currentUser.location}</span>
                  </span>
                </>
              )}

              {currentUser?.isVerified && (
                <>
                  <span aria-hidden="true" className="text-stone-300">·</span>
                  <span className="inline-flex items-center gap-1 text-emerald-800 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/80 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[1.75]" />
                    Verified Cecilian Record
                  </span>
                </>
              )}
            </div>

            {/* Institutional Contextual Copy */}
            <p className="text-xs sm:text-[13px] text-stone-600 leading-relaxed pt-0.5 break-words line-clamp-2 lg:line-clamp-1">
              {contextualNote}
            </p>

            {/* Classic Minimalist Utility Action Links with St. Cecilia Primary Button */}
            <div className="pt-1 flex flex-wrap items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onOpenDigitalCard) {
                    onOpenDigitalCard();
                  } else {
                    setActiveTab('profile');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#8B181B] text-white hover:bg-[#721316] transition-colors shadow-2xs cursor-pointer active:scale-98"
              >
                <FileBadge className="w-3.5 h-3.5 stroke-[1.75]" />
                <span>Digital Alumni Pass</span>
                <ArrowUpRight className="w-3.5 h-3.5 stroke-[1.75] opacity-80" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('network')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer"
              >
                <Users className="w-3.5 h-3.5 text-stone-500 stroke-[1.75]" />
                <span>Batch Directory</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-white text-stone-700 border border-stone-200 hover:bg-stone-50 hover:text-stone-900 transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-stone-500 stroke-[1.75]" />
                <span>Reunions & Events</span>
              </button>

              <button
                type="button"
                onClick={() => refreshData()}
                disabled={isLoadingData}
                title="Refresh dashboard data and check live updates"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-stone-850 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 hover:text-stone-900 transition-colors cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-stone-500 stroke-[1.75] ${isLoadingData ? 'animate-spin text-[#8B181B]' : ''}`} />
                <span>{isLoadingData ? 'Syncing...' : 'Refresh'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('applet:lock-dashboard'));
                }}
                title="Lock dashboard with native Face Detection recognition"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer shadow-2xs"
              >
                <ScanFace className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400 stroke-[1.75]" />
                <span className="hidden sm:inline">Lock Dashboard</span>
              </button>

              {currentUser?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('admin')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5 text-amber-700 stroke-[1.75]" />
                  <span>Admin Workspace</span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: St. Cecilia Institutional Almanac & Heritage Medallion */}
          <div className="hidden sm:flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 lg:border-l border-stone-200 pt-3 lg:pt-0 lg:pl-6 shrink-0">
            <div className="flex items-center gap-3 lg:flex-row-reverse text-left lg:text-right">
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white p-0.5 ring-1 ring-stone-200 shadow-2xs shrink-0">
                <img
                  src="/assets/st-cecilias-college-seal.jpg"
                  alt="St. Cecilia's College Official Seal"
                  className="w-full h-full object-contain rounded-full"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== window.location.origin + '/assets/cecilians-seal.jpg') {
                      target.src = '/assets/cecilians-seal.jpg';
                    }
                  }}
                />
              </div>

              <div>
                <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">
                  Collegiate Almanac
                </p>
                <p className="text-xs font-medium text-stone-800 mt-0.5">
                  {formattedDate}
                </p>
                <p className="text-[10px] text-stone-500 mt-0.5">
                  First Term · A.Y. 2026–2027
                </p>
              </div>
            </div>

            {/* Subtle Institutional Motto Badge */}
            <div className="mt-2.5 pt-2 border-t border-stone-100 hidden lg:block text-right">
              <p className="italic font-serif text-xs text-stone-600">
                "Virtus, Scientia, Charitas"
              </p>
              <p className="text-[9px] text-stone-400 tracking-wider uppercase font-medium mt-0.5">
                Motto of St. Cecilia's College
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
