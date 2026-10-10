import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
  Clock,
  MapPin,
  Users,
  ArrowRight,
  Flame
} from 'lucide-react';
import { AlumniEvent } from '../../types';
import { EventReminderToggle } from '../events/EventReminderToggle';
import {
  getEventImage,
  handleEventImageError,
  getUserAvatar,
  handleUserAvatarError
} from '../../lib/defaultImages';

interface LandingEventCardProps {
  event: AlumniEvent;
  onReserve: (event: AlumniEvent) => void;
  onSelect: (event: AlumniEvent) => void;
  priority?: boolean;
}

export const LandingEventCard: React.FC<LandingEventCardProps> = ({
  event,
  onReserve,
  onSelect,
  priority = false
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Framer Motion 3D Tilt Coordinates
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth, weighted spring physics for institutional tactile feel
  const springConfig = { damping: 20, stiffness: 260, mass: 0.6 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [12, -12]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-12, 12]), springConfig);

  // Dynamic Specular Light Glare that follows pointer
  const glareX = useTransform(x, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(y, [-0.5, 0.5], ['0%', '100%']);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const normalizedX = (e.clientX - rect.left) / rect.width - 0.5;
    const normalizedY = (e.clientY - rect.top) / rect.height - 0.5;

    x.set(normalizedX);
    y.set(normalizedY);
  };

  const handlePointerEnter = () => setIsHovered(true);
  const handlePointerLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const eventDate = new Date(event.startDate);
  const attendeesCount = event.attendeesCount || (event.attendees ? event.attendees.length : 0);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      onClick={() => onSelect(event)}
      style={{ perspective: 1200 }}
      className="h-full"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d'
        }}
        whileHover={{
          scale: 1.025,
          y: -8,
          transition: { duration: 0.25, ease: 'easeOut' }
        }}
        className="relative bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-[0_24px_48px_rgba(139,24,27,0.16),0_6px_20px_rgba(0,0,0,0.06)] hover:border-[#8B181B]/40 transition-shadow duration-300 flex flex-col justify-between h-full group cursor-pointer select-none"
      >
        {/* Dynamic Specular Spotlight Glare Overlay */}
        {isHovered && (
          <motion.div
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255,255,255,0.28) 0%, rgba(255,255,255,0.08) 35%, transparent 65%)`
            }}
            className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
          />
        )}

        {/* 3D Elevated Content Layers */}
        <div style={{ transform: 'translateZ(18px)' }}>
          {/* Card Hero Banner */}
          <div className="relative h-48 sm:h-52 w-full bg-stone-900 overflow-hidden">
            <img
              src={getEventImage(event.heroImageUrl)}
              alt={event.title}
              onError={handleEventImageError}
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
            />
            {/* Cinematic Gradient Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

            {/* Top Category Badge (Floated in 3D) */}
            <div
              style={{ transform: 'translateZ(30px)' }}
              className="absolute top-3.5 left-3.5 flex items-center gap-2 z-10"
            >
              {priority || event.isImportant ? (
                <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest bg-[#8B181B] text-white rounded-xl shadow-md border border-red-300/30 flex items-center gap-1.5 backdrop-blur-md">
                  <Flame className="w-3 h-3 fill-amber-300 text-amber-300" />
                  <span>Flagship Convocation</span>
                </span>
              ) : (
                <span className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md text-stone-200 rounded-xl border border-white/15 shadow-sm">
                  {event.type}
                </span>
              )}
            </div>

            {/* Floating Date Badge (Floated in 3D with depth) */}
            <div
              style={{ transform: 'translateZ(38px)' }}
              className="absolute top-3.5 right-3.5 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-xl text-center border border-stone-100 z-10"
            >
              <span className="block text-[10px] font-extrabold text-[#8B181B] uppercase tracking-wider leading-none">
                {eventDate.toLocaleDateString([], { month: 'short' })}
              </span>
              <span className="block text-lg font-black text-stone-900 leading-none mt-1">
                {eventDate.getDate()}
              </span>
            </div>

            {/* Bottom Media Bar: Attendance Pill + Virtual Tag */}
            <div
              style={{ transform: 'translateZ(26px)' }}
              className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-xs text-white z-10"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-medium">
                  <Users className="w-3.5 h-3.5 text-amber-400" />
                  <span>{attendeesCount} Attending</span>
                </span>
                {event.isVirtual && (
                  <span className="px-2 py-0.5 rounded-md bg-blue-600/90 text-[10px] font-bold tracking-wide">
                    Virtual
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Card Body */}
          <div className="p-5 sm:p-6 space-y-3.5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] font-bold text-[#8B181B] tracking-wider uppercase">
                <span>{event.type} Gathering</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="text-stone-500 font-medium">Class of {eventDate.getFullYear()}</span>
              </div>

              <h3 className="font-display text-xl sm:text-2xl font-bold text-stone-900 group-hover:text-[#8B181B] transition-colors leading-snug tracking-tight line-clamp-2">
                {event.title}
              </h3>

              {event.tagline && (
                <p className="text-xs italic text-stone-500 line-clamp-1">
                  "{event.tagline}"
                </p>
              )}
            </div>

            {/* Time & Venue Indicators */}
            <div className="space-y-1.5 text-xs text-stone-600 pt-1">
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span>
                  {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}{' '}
                  • {eventDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#8B181B] shrink-0" />
                <span className="truncate">{event.venue || event.location || 'St. Cecilia’s Campus Grounds'}</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
              {event.description}
            </p>
          </div>
        </div>

        {/* Footer Actions (Floated in 3D) */}
        <div
          style={{ transform: 'translateZ(26px)' }}
          className="p-5 sm:p-6 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between gap-3 mt-auto"
        >
          {/* Attendees Avatar Cluster */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex -space-x-2 overflow-hidden py-0.5 shrink-0">
              {(event.attendees && event.attendees.length > 0 ? event.attendees.slice(0, 3) : []).map(
                (att, i) => (
                  <img
                    key={att.uid || i}
                    src={getUserAvatar(att.avatar)}
                    alt={att.name || 'Alumnus'}
                    onError={handleUserAvatarError}
                    className="inline-block h-6 w-6 rounded-full ring-2 ring-white object-cover shadow-xs bg-stone-200"
                  />
                )
              )}
            </div>
            <span className="text-[11px] font-semibold text-stone-600 truncate">
              {attendeesCount > 0 ? `${attendeesCount} alumni attending` : 'Gathering scheduled'}
            </span>
          </div>

          {/* Actions: Reminder Toggle & View Gathering CTA Button */}
          <div className="flex items-center gap-2 shrink-0">
            <EventReminderToggle
              event={event}
              variant="icon"
              size="sm"
            />

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(event);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-sm transition-all duration-200 hover:scale-103 active:scale-97 cursor-pointer shrink-0"
            >
              <span>View Gathering</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
