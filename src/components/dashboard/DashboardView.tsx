/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Clock,
  Ticket,
  QrCode,
  Check,
  X,
  MessageSquare,
  ImageIcon,
  ArrowRight,
  ExternalLink,
  Users,
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Building2,
  Bell,
  Sparkles,
  ChevronRight,
  Share2
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { AlumniEvent, Announcement, Opportunity, UserProfile } from '../../types';
import { getUserAvatar, handleUserAvatarError } from '../../lib/defaultImages';
import { CampusGalleryModal } from '../gallery/CampusGalleryModal';
import { triggerHaptic } from '../../services/hapticsService';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    users,
    events,
    announcements,
    opportunities,
    reservations,
    reserveEventSlot,
    setActiveTab,
    setActiveChatId,
    getOrCreateChat,
    setSelectedUserIdForModal,
    showToast
  } = useAlumni();

  // Modals
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [reservationEventTarget, setReservationEventTarget] = useState<AlumniEvent | null>(null);
  const [reservationGuests, setReservationGuests] = useState(1);
  const [isReserving, setIsReserving] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);

  // Time-of-day greeting
  const salutation = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Today's formatted calendar date in formal collegiate style
  const todayFormatted = useMemo(() => {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date());
  }, []);

  // Sorted Announcements (top 4 latest dispatches)
  const sortedAnnouncements = useMemo(() => {
    return [...announcements]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 4);
  }, [announcements]);

  // Featured Event (Homecoming or earliest upcoming)
  const featuredEvent = useMemo(() => {
    const homecoming = events.find(
      (e) => e.title.toLowerCase().includes('homecoming') || e.isFeaturedReservation
    );
    if (homecoming) return homecoming;
    const sortedUpcoming = [...events].sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
    return sortedUpcoming[0] || events[0] || null;
  }, [events]);

  // Secondary upcoming events (next 2)
  const secondaryEvents = useMemo(() => {
    if (!featuredEvent) return events.slice(0, 2);
    return events.filter((e) => e.id !== featuredEvent.id).slice(0, 2);
  }, [events, featuredEvent]);

  // Check if current user is reserved for an event
  const isUserReserved = (eventId: string) => {
    if (!currentUser) return false;
    return reservations.some(
      (r) => r.eventId === eventId && r.userId === currentUser.uid && r.status !== 'cancelled'
    );
  };

  // Classmates spotlight (prioritizes same batch)
  const batchmates = useMemo(() => {
    if (!currentUser) return users.slice(0, 4);
    const sameBatch = users.filter(
      (u) => u.uid !== currentUser.uid && u.batch === currentUser.batch
    );
    if (sameBatch.length >= 3) return sameBatch.slice(0, 4);
    const others = users.filter((u) => u.uid !== currentUser.uid);
    return others.slice(0, 4);
  }, [users, currentUser]);

  // Top career opportunities (2 curated items)
  const careerLeads = useMemo(() => {
    return opportunities.slice(0, 2);
  }, [opportunities]);

  // Handle Seat Reservation
  const handleConfirmReservation = async () => {
    if (!reservationEventTarget || !currentUser) return;
    setIsReserving(true);
    try {
      const res = await reserveEventSlot({
        eventId: reservationEventTarget.id,
        alumniName: currentUser.name || 'Cecilian Alumnus',
        email: currentUser.email,
        contactNumber: currentUser.phone || '0917-000-0000',
        alumniId: currentUser.alumniId || currentUser.studentId || `SCC-ALUM-${currentUser.uid.slice(0, 6)}`,
        graduationYear: currentUser.batch || '2023',
        course: currentUser.course || 'Bachelor of Science',
        numberOfGuests: Math.max(0, reservationGuests - 1),
        specialRequests: 'Collegiate alumni reserved pass'
      });
      if (res.success) {
        showToast('Your seat reservation is confirmed!', 'success');
        setReservationEventTarget(null);
      } else {
        showToast(res.error || 'Unable to complete reservation.', 'error');
      }
    } finally {
      setIsReserving(false);
    }
  };

  // Direct Peer Message Trigger
  const handleStartMessage = (peerUid: string) => {
    triggerHaptic('light');
    if (getOrCreateChat) {
      const threadId = getOrCreateChat(peerUid);
      setActiveChatId(threadId);
    }
    setActiveTab('messages');
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 sm:space-y-8 pb-24 font-sans selection:bg-[#8B181B] selection:text-white">
      {/* =========================================================================
          MASTHEAD & ALUMNI GREETING BAR
          Clean, institutional, calm — avoids generic AI hero clichés
          ========================================================================= */}
      <section className="bg-white dark:bg-[#181615] rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-stone-200/80 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Alumnus Identity Block */}
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
            <div className="relative shrink-0">
              <img
                src={getUserAvatar(currentUser?.profilePictureUrl)}
                alt={currentUser?.name || 'Alumnus'}
                onError={handleUserAvatarError}
                referrerPolicy="no-referrer"
                className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl object-cover ring-2 ring-stone-100 dark:ring-stone-800"
              />
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#8B181B] text-white flex items-center justify-center ring-2 ring-white dark:ring-[#181615]"
                title="Verified Cecilian Alumnus"
              >
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
            </div>

            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 text-[11px] font-medium text-stone-400 dark:text-stone-500 flex-wrap">
                <span>{todayFormatted}</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#8B181B] dark:text-rose-400 font-semibold">St. Cecilia's College - Cebu</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight font-sans truncate">
                {salutation}, {currentUser?.name?.split(' ')[0] || 'Cecilian'}
              </h1>
              <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2 flex-wrap">
                <span className="truncate">{currentUser?.course || 'Bachelor Degree'}</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-stone-700 dark:text-stone-300">
                  Class of {currentUser?.batch || '2023'}
                </span>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-medium">Verified Alumnus</span>
              </div>
            </div>
          </div>

          {/* Quick Action: Digital Alumni ID Pass */}
          <div className="flex items-center gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                window.dispatchEvent(new CustomEvent('applet:open-alumni-pass'));
              }}
              className="w-full md:w-auto px-4 py-2.5 bg-[#8B181B] hover:bg-[#721316] text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] min-h-[44px]"
            >
              <QrCode className="w-4 h-4 stroke-[2]" />
              <span>Digital Alumni Pass</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setActiveTab('profile');
              }}
              className="hidden sm:flex px-3.5 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/80 dark:hover:bg-stone-700/80 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl transition-colors items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
              title="View your public alumni profile"
            >
              <GraduationCap className="w-4 h-4 text-stone-500 dark:text-stone-400 stroke-[1.75]" />
              <span>Profile</span>
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          THE ASYMMETRICAL 2-COLUMN COLLEGIATE SPREAD
          Desktop: 7-column Journal + 5-column Desk
          Mobile: Clean single vertical stream with comfortable spacing
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* =====================================================================
            LEFT / PRIMARY COLUMN (lg:col-span-7)
            "The Campus Journal" — Official Notices & Gatherings
            ===================================================================== */}
        <div className="lg:col-span-7 space-y-6 sm:space-y-8 min-w-0">
          {/* SECTION 1: OFFICIAL INSTITUTIONAL NOTICES (EDITORIAL LIST) */}
          <section className="bg-white dark:bg-[#181615] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  Campus Bulletins & Dispatches
                </h2>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Official notices from St. Cecilia's College administration
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('announcements')}
                className="text-xs font-semibold text-[#8B181B] dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer min-h-[36px] px-2"
              >
                <span>All Notices</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* List of dispatches (clean editorial layout, no pill capsules) */}
            <div className="divide-y divide-stone-100 dark:divide-stone-800/80">
              {sortedAnnouncements.map((bulletin) => (
                <article
                  key={bulletin.id}
                  onClick={() => setSelectedAnnouncement(bulletin)}
                  className="py-3.5 first:pt-0 last:pb-0 group cursor-pointer space-y-1.5 transition-colors"
                >
                  <div className="flex items-center gap-2 text-xs text-stone-400 dark:text-stone-500">
                    <span className="font-semibold text-[#8B181B] dark:text-rose-400 text-[11px] uppercase tracking-wider">
                      {bulletin.category || 'Official Advisory'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[11px]">
                      {new Date(bulletin.publishedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-stone-900 dark:text-stone-100 group-hover:text-[#8B181B] dark:group-hover:text-rose-400 transition-colors leading-snug">
                    {bulletin.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                    {bulletin.content}
                  </p>

                  <div className="pt-1 flex items-center text-xs font-medium text-stone-400 group-hover:text-[#8B181B] dark:group-hover:text-rose-400 transition-colors">
                    <span>Read full dispatch</span>
                    <ArrowRight className="w-3 h-3 ml-1 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </article>
              ))}

              {sortedAnnouncements.length === 0 && (
                <div className="py-8 text-center text-xs text-stone-400">
                  No active bulletins posted at this time.
                </div>
              )}
            </div>
          </section>

          {/* SECTION 2: GATHERINGS & REUNIONS */}
          <section className="bg-white dark:bg-[#181615] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  Reunions & Official Gatherings
                </h2>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Campus homecomings, general assemblies, and batch celebrations
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('events')}
                className="text-xs font-semibold text-[#8B181B] dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer min-h-[36px] px-2"
              >
                <span>Calendar</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Featured Main Reunion Banner */}
            {featuredEvent && (
              <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 overflow-hidden bg-stone-50/50 dark:bg-stone-900/40">
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#8B181B] dark:text-rose-400">
                        {featuredEvent.isFeaturedReservation ? 'Grand Homecoming' : 'Featured Gathering'}
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug">
                        {featuredEvent.title}
                      </h3>
                    </div>

                    {/* Date Block */}
                    <div className="shrink-0 text-center px-3 py-2 bg-white dark:bg-stone-800 rounded-xl border border-stone-200/80 dark:border-stone-700 shadow-2xs">
                      <div className="text-[10px] font-bold text-[#8B181B] dark:text-rose-400 uppercase">
                        {new Date(featuredEvent.startDate).toLocaleDateString([], { month: 'short' })}
                      </div>
                      <div className="text-base font-extrabold text-stone-900 dark:text-stone-100 font-mono">
                        {new Date(featuredEvent.startDate).getDate()}
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed line-clamp-2">
                    {featuredEvent.description ||
                      'Join alumni from across all batches at the St. Cecilia campus in Minglanilla, Cebu.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-stone-500 dark:text-stone-400 pt-1">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      {new Date(featuredEvent.startDate).toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </span>
                    <span className="flex items-center gap-1.5 truncate max-w-[260px]">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{featuredEvent.location || 'Minglanilla, Cebu'}</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                      <Users className="w-3.5 h-3.5 shrink-0" />
                      <span>{featuredEvent.attendeesCount || 36} Cecilians Registered</span>
                    </span>
                  </div>

                  <div className="pt-2 flex items-center justify-end">
                    {isUserReserved(featuredEvent.id) ? (
                      <span className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                        <Check className="w-4 h-4 stroke-[2.5]" />
                        <span>Seat Reserved</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReservationEventTarget(featuredEvent)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-[#8B181B] hover:bg-[#721316] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer min-h-[44px] flex items-center justify-center gap-1.5"
                      >
                        <Ticket className="w-3.5 h-3.5" />
                        <span>Reserve Seat Pass</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Secondary Upcoming Events */}
            {secondaryEvents.length > 0 && (
              <div className="space-y-2.5 pt-1">
                {secondaryEvents.map((ev) => (
                  <div
                    key={ev.id}
                    onClick={() => setActiveTab('events')}
                    className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition-colors flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0 space-y-0.5">
                      <div className="text-[11px] text-stone-400 flex items-center gap-2">
                        <span>
                          {new Date(ev.startDate).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                        <span>·</span>
                        <span className="truncate">{ev.location}</span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                        {ev.title}
                      </h4>
                    </div>

                    <div className="shrink-0">
                      {isUserReserved(ev.id) ? (
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                          Reserved
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-[#8B181B] dark:text-rose-400 hover:underline">
                          Details →
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* =====================================================================
            RIGHT COLUMN (lg:col-span-5)
            "The Alumni Desk" — Credential, Peer Connections, Career Leads, Heritage
            ===================================================================== */}
        <div className="lg:col-span-5 space-y-6 sm:space-y-8 min-w-0">
          {/* CARD 1: OFFICIAL DIGITAL ALUMNI PASS WIDGET */}
          <section className="bg-gradient-to-br from-[#8B181B] to-[#5C0F11] text-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src="/assets/cecilians-seal.jpg"
                  alt="Seal"
                  className="w-8 h-8 rounded-full border border-white/30 object-cover"
                />
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-amber-300">
                    St. Cecilia's College
                  </div>
                  <div className="text-xs font-extrabold tracking-tight">Official Alumni Credential</div>
                </div>
              </div>

              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/15 text-white border border-white/20">
                Active Member
              </span>
            </div>

            <div className="space-y-1 pt-1">
              <div className="text-base sm:text-lg font-bold font-sans tracking-tight truncate">
                {currentUser?.name || 'Cecilian Alumnus'}
              </div>
              <div className="text-xs text-stone-200/90 font-mono">
                ID: {currentUser?.studentId || currentUser?.alumniId || 'SCC-ALUM-2023'}
              </div>
              <div className="text-xs text-amber-200/90 truncate">
                {currentUser?.course || 'Degree Graduate'} · Batch {currentUser?.batch || '2023'}
              </div>
            </div>

            <div className="pt-2 border-t border-white/15 flex items-center justify-between">
              <span className="text-[11px] text-white/80">Tap to present QR bar</span>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic('light');
                  window.dispatchEvent(new CustomEvent('applet:open-alumni-pass'));
                }}
                className="px-3.5 py-1.5 rounded-xl bg-white text-[#8B181B] hover:bg-stone-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs min-h-[38px]"
              >
                <QrCode className="w-3.5 h-3.5 stroke-[2]" />
                <span>Open Pass</span>
              </button>
            </div>
          </section>

          {/* CARD 2: CLASSMATES & BATCHMATES PULSE */}
          <section className="bg-white dark:bg-[#181615] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                  Batch {currentUser?.batch || '2023'} Classmates
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Alumni peers from your graduating cohort
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('network')}
                className="text-xs font-semibold text-[#8B181B] dark:text-rose-400 hover:underline cursor-pointer min-h-[36px] px-1 flex items-center"
              >
                Directory
              </button>
            </div>

            <div className="space-y-3">
              {batchmates.map((peer) => (
                <div
                  key={peer.uid}
                  className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                >
                  <div
                    onClick={() => setSelectedUserIdForModal(peer.uid)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  >
                    <img
                      src={getUserAvatar(peer.profilePictureUrl)}
                      alt={peer.name}
                      onError={handleUserAvatarError}
                      className="w-9 h-9 rounded-full object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate hover:text-[#8B181B] transition-colors">
                        {peer.name}
                      </div>
                      <div className="text-[11px] text-stone-400 dark:text-stone-500 truncate">
                        {peer.company || peer.currentPosition || peer.course || `Batch ${peer.batch || '2023'}`}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartMessage(peer.uid)}
                      className="p-2 rounded-lg text-stone-500 dark:text-stone-400 hover:text-[#8B181B] hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title={`Message ${peer.name}`}
                      aria-label={`Message ${peer.name}`}
                    >
                      <MessageSquare className="w-3.5 h-3.5 stroke-[1.75]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* CARD 3: CAREER & INDUSTRY BOARD */}
          <section className="bg-white dark:bg-[#181615] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-stone-200/80 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100">
                  Career Radar
                </h3>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Opportunities shared by Cecilian partners
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('opportunities')}
                className="text-xs font-semibold text-[#8B181B] dark:text-rose-400 hover:underline cursor-pointer min-h-[36px] px-1 flex items-center"
              >
                All Jobs
              </button>
            </div>

            <div className="space-y-3">
              {careerLeads.map((job) => (
                <div
                  key={job.id}
                  onClick={() => setActiveTab('opportunities')}
                  className="p-3 rounded-xl border border-stone-200/80 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 transition-colors cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-stone-400">
                    <span className="font-semibold text-stone-700 dark:text-stone-300 truncate max-w-[150px]">
                      {job.company}
                    </span>
                    <span>{job.location}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {job.title}
                  </h4>
                  <div className="text-[11px] text-[#8B181B] dark:text-rose-400 font-medium">
                    {job.type} · {job.salaryOrStipend || 'Competitive'}
                  </div>
                </div>
              ))}

              {careerLeads.length === 0 && (
                <div className="py-4 text-center text-xs text-stone-400">
                  No active career listings right now.
                </div>
              )}
            </div>
          </section>

          {/* CARD 4: CAMPUS HERITAGE ARCHIVE LINK */}
          <section
            onClick={() => setShowGalleryModal(true)}
            className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-900/40 hover:bg-stone-100/60 dark:hover:bg-stone-800/60 transition-all cursor-pointer flex items-center justify-between gap-4"
          >
            <div className="space-y-0.5 min-w-0">
              <div className="text-[10px] font-bold text-[#8B181B] dark:text-rose-400 uppercase tracking-wider">
                Alma Mater Heritage
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                Campus Gallery & Landmarks
              </h4>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">
                Photographs, academic buildings & traditions
              </p>
            </div>

            <button
              type="button"
              className="p-2.5 rounded-xl bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 text-stone-700 dark:text-stone-300 shrink-0 shadow-2xs"
              title="Open Campus Heritage Gallery"
            >
              <ImageIcon className="w-4 h-4 stroke-[1.75]" />
            </button>
          </section>
        </div>
      </div>

      {/* =========================================================================
          MODAL: ANNOUNCEMENT DETAIL READER
          ========================================================================= */}
      <AnimatePresence>
        {selectedAnnouncement && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setSelectedAnnouncement(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white dark:bg-[#181615] rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#8B181B] dark:text-rose-400 uppercase tracking-wider">
                  {selectedAnnouncement.category || 'Official Advisory'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedAnnouncement(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 overflow-y-auto space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug">
                  {selectedAnnouncement.title}
                </h3>
                <div className="text-xs text-stone-400 flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800 flex-wrap">
                  <span>{selectedAnnouncement.authorName || 'Alumni Affairs Office'}</span>
                  <span>·</span>
                  <span>
                    {new Date(selectedAnnouncement.publishedAt).toLocaleDateString([], {
                      dateStyle: 'long'
                    })}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line pt-2">
                  {selectedAnnouncement.content}
                </div>
              </div>

              <div className="p-3.5 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedAnnouncement(null)}
                  className="px-4 py-2 bg-stone-200 dark:bg-stone-800 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold cursor-pointer min-h-[38px]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL: EVENT SEAT RESERVATION
          ========================================================================= */}
      <AnimatePresence>
        {reservationEventTarget && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
            onClick={() => setReservationEventTarget(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white dark:bg-[#181615] rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-md overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 sm:p-5 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-[#8B181B] dark:text-rose-400 uppercase tracking-wider block">
                    Reserve Event Seat
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-stone-900 dark:text-stone-100 truncate max-w-[260px]">
                    {reservationEventTarget.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setReservationEventTarget(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs text-stone-600 dark:text-stone-300">
                <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-xl space-y-1 border border-stone-200/60 dark:border-stone-800">
                  <div>
                    <strong className="text-stone-900 dark:text-stone-100">Venue:</strong>{' '}
                    {reservationEventTarget.location}
                  </div>
                  <div>
                    <strong className="text-stone-900 dark:text-stone-100">Schedule:</strong>{' '}
                    {new Date(reservationEventTarget.startDate).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-stone-500 block mb-1.5">
                    Number of Seats to Reserve:
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setReservationGuests(num)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer min-h-[44px] ${
                          reservationGuests === num
                            ? 'bg-[#8B181B] text-white border-[#8B181B] shadow-xs'
                            : 'bg-stone-50 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                        }`}
                      >
                        {num} {num === 1 ? 'Seat (Personal)' : 'Seats'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReservationEventTarget(null)}
                  className="px-4 py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold cursor-pointer min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isReserving}
                  onClick={handleConfirmReservation}
                  className="px-5 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50 min-h-[40px]"
                >
                  {isReserving ? 'Confirming...' : 'Confirm Reservation'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CAMPUS HERITAGE GALLERY MODAL */}
      <CampusGalleryModal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
      />
    </div>
  );
};
