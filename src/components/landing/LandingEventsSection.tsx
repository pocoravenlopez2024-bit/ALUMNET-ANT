import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  Users,
  Ticket,
  X,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { INITIAL_EVENTS } from '../../data/initialData';
import { AlumniEvent } from '../../types';
import { LandingEventCard } from './LandingEventCard';
import {
  getEventImage,
  handleEventImageError,
  getUserAvatar,
  handleUserAvatarError
} from '../../lib/defaultImages';

interface LandingEventsSectionProps {
  onNavigateToAuth: (mode: 'login' | 'register', role?: 'alumni' | 'employer') => void;
}

export const LandingEventsSection: React.FC<LandingEventsSectionProps> = ({
  onNavigateToAuth
}) => {
  const { events: contextEvents, currentUser } = useAlumni();
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'reunion' | 'workshop' | 'social'>('all');
  const [previewEvent, setPreviewEvent] = useState<AlumniEvent | null>(null);

  // Guarantee high quality flagship events are always presented
  const allEvents = (contextEvents && contextEvents.length > 0 ? contextEvents : INITIAL_EVENTS);

  // Filter events according to active category tab
  const filteredEvents = allEvents.filter((ev) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'reunion') return ev.type === 'reunion';
    if (selectedCategory === 'workshop') return ev.type === 'workshop' || ev.type === 'webinar';
    if (selectedCategory === 'social') return ev.type === 'social' || ev.type === 'networking';
    return true;
  }).slice(0, 6);

  const handleReserveClick = (event: AlumniEvent) => {
    if (currentUser) {
      // If user is already signed in, open the event in portal
      window.location.href = `/?tab=events&event=${event.id}`;
    } else {
      setPreviewEvent(event);
    }
  };

  return (
    <section id="events" className="py-24 sm:py-32 bg-[#FAF9F6] border-t border-[#E5E7EB] relative overflow-hidden">
      {/* Subtle architectural ambient backdrop */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-100/30 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-100/20 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-2xl"
          >
            {/* Red Accent Label */}
            <div className="flex items-center gap-2 mb-4">
              <span className="w-5 h-[1.5px] bg-[#8B181B]" />
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-[#8B181B]">
                SIGNATURE GATHERINGS & REUNIONS
              </span>
            </div>

            <h2 className="font-display text-4xl sm:text-5xl lg:text-6xl text-[#111827] font-normal leading-[1.12] tracking-tight">
              Where Cecilians<br />
              Reconvene.
            </h2>

            <p className="mt-4 text-[#6B7280] text-sm sm:text-base leading-relaxed font-light">
              Experience our landmark alumni homecomings, academic convocations, leadership forums, and campus athletics. Hover any gathering to explore in interactive 3D perspective.
            </p>
          </motion.div>

          {/* Interactive Category Filter Tabs (Zero-pill button segmented controls) */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-wrap items-center gap-1.5 p-1.5 bg-stone-200/60 rounded-2xl border border-stone-300/60"
          >
            {[
              { id: 'all', label: 'All Convocations' },
              { id: 'reunion', label: 'Reunions & Homecomings' },
              { id: 'workshop', label: 'Tech & Leadership' },
              { id: 'social', label: 'Fellowship & Sports' }
            ].map((tab) => {
              const active = selectedCategory === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedCategory(tab.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-white text-[#8B181B] shadow-sm font-bold'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white/40'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </motion.div>
        </div>

        {/* 3D Perspective Tilt Event Cards Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 sm:gap-8 items-stretch"
        >
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="h-full"
            >
              <LandingEventCard
                event={event}
                priority={index === 0}
                onReserve={handleReserveClick}
                onSelect={(ev) => setPreviewEvent(ev)}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA Directives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 pt-8 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Active registration open for verified St. Cecilia graduates and faculty.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateToAuth('register')}
              className="font-bold text-[#8B181B] hover:text-[#721316] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer group"
            >
              <span>Explore Full Institutional Calendar</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* Interactive Convocation Preview Modal */}
      <AnimatePresence>
        {previewEvent && (
          <div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setPreviewEvent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl border border-stone-200 max-w-xl w-full overflow-hidden my-8"
            >
              {/* Modal Hero Banner */}
              <div className="relative h-56 w-full bg-stone-900 overflow-hidden">
                <img
                  src={getEventImage(previewEvent.heroImageUrl)}
                  alt={previewEvent.title}
                  onError={handleEventImageError}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

                <button
                  type="button"
                  onClick={() => setPreviewEvent(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors cursor-pointer z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="absolute bottom-4 left-6 right-6 text-white">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#fca5a5] mb-1">
                    <span>{previewEvent.type} Convocation</span>
                    <span>·</span>
                    <span>{new Date(previewEvent.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <h3 className="font-display text-2xl font-bold text-white leading-tight">
                    {previewEvent.title}
                  </h3>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 sm:p-7 space-y-5 text-stone-700">
                {/* Event Schedule & Location Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-stone-50 rounded-2xl border border-stone-200/80 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-[#8B181B] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-stone-900">Date & Schedule</div>
                      <div className="text-stone-500 mt-0.5">
                        {new Date(previewEvent.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                        {new Date(previewEvent.startDate).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#8B181B] mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-stone-900">Venue & Campus</div>
                      <div className="text-stone-500 mt-0.5">
                        {previewEvent.venue || previewEvent.location || 'St. Cecilia’s Campus Grounds'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Narrative Description */}
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
                    About This Gathering
                  </h4>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
                    {previewEvent.description}
                  </p>
                </div>

                {/* Attendees Roster Snapshot */}
                <div>
                  <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Confirmed Attendees ({previewEvent.attendeesCount || (previewEvent.attendees ? previewEvent.attendees.length : 0)})</span>
                    <span className="text-[11px] font-normal text-stone-400">Verified Cecilian Graduates</span>
                  </h4>
                  <div className="flex items-center gap-2 overflow-x-auto py-1">
                    {(previewEvent.attendees && previewEvent.attendees.length > 0 ? previewEvent.attendees.slice(0, 5) : []).map((att, i) => (
                      <div key={att.uid || i} className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 shrink-0 text-xs">
                        <img
                          src={getUserAvatar(att.avatar)}
                          alt={att.name || 'Alumnus'}
                          onError={handleUserAvatarError}
                          className="w-5 h-5 rounded-full object-cover ring-1 ring-stone-300"
                        />
                        <span className="font-medium text-stone-800">{att.name}</span>
                      </div>
                    ))}
                    {(previewEvent.attendeesCount || 0) > 5 && (
                      <span className="text-xs text-stone-400 font-semibold px-2">
                        +{(previewEvent.attendeesCount || 0) - 5} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Reservation Action Box */}
                <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-stone-500">
                    Sign in with your verified alumni account to RSVP and connect with fellow alumni.
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewEvent(null);
                        onNavigateToAuth('login');
                      }}
                      className="flex-1 sm:flex-initial px-5 py-2.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer text-center"
                    >
                      Sign In & Attend
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewEvent(null);
                        onNavigateToAuth('register');
                      }}
                      className="px-4 py-2.5 border border-stone-300 hover:border-stone-400 text-stone-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-center"
                    >
                      Register
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
