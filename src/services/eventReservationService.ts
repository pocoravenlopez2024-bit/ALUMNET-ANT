/**
 * Event Reservation Service
 * Core business rules, deadline calculations, status detection, and calendar/ticket utilities.
 */

import { AlumniEvent, EventReservation, EventRegistrationStatusType } from '../types';

export interface EventReservationStatusDetails {
  status: EventRegistrationStatusType;
  label: string;
  dotEmoji: string;
  indicatorColor: 'emerald' | 'amber' | 'rose' | 'stone' | 'sky';
  badgeClass: string;
  deadlineDate: Date;
  deadlineFormatted: string;
  daysRemaining: number;
  hoursRemaining: number;
  isPastDeadline: boolean;
  totalCapacity: number;
  reservedCount: number;
  availableSeats: number;
  occupancyPercentage: number;
  isAlmostFull: boolean;
  isFullyBooked: boolean;
  canReserve: boolean;
  canJoinWaitlist: boolean;
  isBeforeOpening: boolean;
  openingDate?: Date;
  countdownText: string;
  timeline: {
    opensDate: Date;
    deadlineDate: Date;
    eventDate: Date;
    minDaysNotice: number;
  };
}

/**
 * Calculates the exact registration deadline based on event date and configurable joining rules.
 * Business Rule: Event Date: Dec 12, Registration Limit: 10 days before -> Registration Deadline: Dec 2.
 */
export function calculateEventDeadline(event: {
  startDate: string;
  registrationCloseDaysBefore?: number;
  registrationCloseDate?: string;
  calculatedDeadline?: string;
}): Date {
  if (event.calculatedDeadline) {
    const d = new Date(event.calculatedDeadline);
    if (!isNaN(d.getTime())) return d;
  }

  const eventStart = new Date(event.startDate).getTime();
  const validStart = isNaN(eventStart) ? Date.now() + 14 * 24 * 60 * 60 * 1000 : eventStart;

  if (typeof event.registrationCloseDaysBefore === 'number' && event.registrationCloseDaysBefore >= 0) {
    // Cutoff is X days before event at end of day (23:59:59)
    const deadlineMs = validStart - event.registrationCloseDaysBefore * 24 * 60 * 60 * 1000;
    const deadlineDate = new Date(deadlineMs);
    deadlineDate.setHours(23, 59, 59, 999);
    return deadlineDate;
  }

  if (event.registrationCloseDate) {
    const d = new Date(event.registrationCloseDate);
    if (!isNaN(d.getTime())) return d;
  }

  // Fallback: 3 days before event start
  const fallback = new Date(validStart - 3 * 24 * 60 * 60 * 1000);
  fallback.setHours(23, 59, 59, 999);
  return fallback;
}

/**
 * Derives comprehensive real-time status and metrics for an event.
 */
export function getEventReservationStatus(
  event: AlumniEvent,
  now: Date = new Date()
): EventReservationStatusDetails {
  const currentTime = now.getTime();
  const eventDate = new Date(event.startDate);
  const deadlineDate = calculateEventDeadline(event);
  const isPastDeadline = currentTime > deadlineDate.getTime();

  // Registration Opening Date
  const minDays = event.registrationCloseDaysBefore ?? 10;
  const defaultOpeningTime = new Date(event.startDate).getTime() - 45 * 24 * 60 * 60 * 1000;
  const openingDate = event.registrationOpenDate ? new Date(event.registrationOpenDate) : new Date(defaultOpeningTime);
  const isBeforeOpening = !isNaN(openingDate.getTime()) && currentTime < openingDate.getTime();

  // Capacity & Occupancy
  const totalCapacity = event.maxParticipants || event.maxAttendees || 200;
  const reservedCount = event.reservedSeatsCount ?? event.attendeesCount ?? 0;
  const availableSeats = Math.max(0, totalCapacity - reservedCount);
  const occupancyPercentage = Math.min(100, Math.round((reservedCount / totalCapacity) * 100));

  const isFullyBooked = availableSeats <= 0 || occupancyPercentage >= 100;
  const isAlmostFull = !isFullyBooked && occupancyPercentage >= 80;

  // Remaining time math
  const diffMs = deadlineDate.getTime() - currentTime;
  const daysRemaining = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const hoursRemaining = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));

  // Countdown text
  let countdownText = '';
  if (isPastDeadline) {
    countdownText = 'Registration closed';
  } else if (daysRemaining > 1) {
    countdownText = `Registration closes in ${daysRemaining} days`;
  } else if (daysRemaining === 1) {
    countdownText = `Registration closes in 1 day (${hoursRemaining}h remaining)`;
  } else {
    countdownText = `Registration closes in ${Math.max(1, hoursRemaining)} hours`;
  }

  // Determine Primary Status with priority: Override > Deadline Closed > Opening Soon > Fully Booked > Almost Full > Open
  let status: EventRegistrationStatusType = 'open';
  let label = 'Registration Open';
  let dotEmoji = '🟢';
  let indicatorColor: 'emerald' | 'amber' | 'rose' | 'stone' | 'sky' = 'emerald';
  let badgeClass = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';

  if (event.manualStatusOverride && event.manualStatusOverride !== 'auto') {
    status = event.manualStatusOverride;
    if (status === 'almost_full') {
      label = 'Almost Full';
      dotEmoji = '🟡';
      indicatorColor = 'amber';
      badgeClass = 'bg-amber-50 text-amber-800 border-amber-200/80';
    } else if (status === 'closed') {
      label = 'Registration Closed';
      dotEmoji = '🔴';
      indicatorColor = 'rose';
      badgeClass = 'bg-rose-50 text-rose-800 border-rose-200/80';
    } else if (status === 'fully_booked') {
      label = 'Event Fully Booked';
      dotEmoji = '⚫';
      indicatorColor = 'stone';
      badgeClass = 'bg-stone-900 text-stone-100 border-stone-800';
    }
  } else if (isPastDeadline) {
    status = 'closed';
    label = 'Registration Closed';
    dotEmoji = '🔴';
    indicatorColor = 'rose';
    badgeClass = 'bg-rose-50 text-rose-800 border-rose-200/80';
  } else if (isBeforeOpening) {
    status = 'upcoming';
    label = 'Registration Opens Soon';
    dotEmoji = '🔵';
    indicatorColor = 'sky';
    badgeClass = 'bg-sky-50 text-sky-800 border-sky-200/80';
  } else if (isFullyBooked) {
    status = 'fully_booked';
    label = 'Event Fully Booked';
    dotEmoji = '⚫';
    indicatorColor = 'stone';
    badgeClass = 'bg-stone-900 text-white border-stone-900';
  } else if (isAlmostFull) {
    status = 'almost_full';
    label = 'Almost Full';
    dotEmoji = '🟡';
    indicatorColor = 'amber';
    badgeClass = 'bg-amber-50 text-amber-800 border-amber-200/80';
  }

  const canReserve = status === 'open' || status === 'almost_full';
  const canJoinWaitlist = isFullyBooked && event.enableWaitingList !== false && !isPastDeadline;

  const deadlineFormatted = isNaN(deadlineDate.getTime())
    ? 'TBA'
    : deadlineDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

  return {
    status,
    label,
    dotEmoji,
    indicatorColor,
    badgeClass,
    deadlineDate,
    deadlineFormatted,
    daysRemaining,
    hoursRemaining,
    isPastDeadline,
    totalCapacity,
    reservedCount,
    availableSeats,
    occupancyPercentage,
    isAlmostFull,
    isFullyBooked,
    canReserve,
    canJoinWaitlist,
    isBeforeOpening,
    openingDate,
    countdownText,
    timeline: {
      opensDate: openingDate,
      deadlineDate,
      eventDate,
      minDaysNotice: minDays
    }
  };
}

/**
 * Generates an official reservation code (e.g. ALM-2026-00125).
 */
export function generateReservationId(): string {
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  return `ALM-2026-${randomSuffix}`;
}

/**
 * Generates a downloadable iCalendar (.ics) string.
 */
export function generateCalendarIcs(event: AlumniEvent, reservation?: EventReservation): string {
  const start = new Date(event.startDate);
  const end = new Date(event.endDate || new Date(start.getTime() + 4 * 60 * 60 * 1000));

  const formatIcsDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const title = event.title.replace(/[,;]/g, ' ');
  const venue = (event.venue || event.location || 'St. Cecilia\'s College').replace(/[,;]/g, ' ');
  const desc = [
    event.tagline || event.description,
    reservation ? `Your Reservation ID: ${reservation.id} (${reservation.totalSeats} seats)` : '',
    'St. Cecilia\'s College Global Alumni Association'
  ]
    .filter(Boolean)
    .join('\\n');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//St. Cecilia\'s College//Alumni Event Hub//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${reservation?.id || event.id}@alumni.stcecilia.edu`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${desc}`,
    `LOCATION:${venue}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');
}

/**
 * Triggers downloading the .ics calendar file.
 */
export function downloadCalendarIcs(event: AlumniEvent, reservation?: EventReservation): void {
  const icsData = generateCalendarIcs(event, reservation);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${event.title.replace(/[^a-zA-Z0-9]/g, '_')}_Reservation.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Creates Google Calendar URL for one-click web integration.
 */
export function getGoogleCalendarUrl(event: AlumniEvent, reservation?: EventReservation): string {
  const start = new Date(event.startDate).toISOString().replace(/-|:|\.\d\d\d/g, '');
  const end = new Date(event.endDate || new Date(new Date(event.startDate).getTime() + 4 * 60 * 60 * 1000))
    .toISOString()
    .replace(/-|:|\.\d\d\d/g, '');

  const text = encodeURIComponent(event.title);
  const details = encodeURIComponent(
    `${event.tagline || ''}\n\n${event.description}\n\nReservation ID: ${
      reservation?.id || 'Pending'
    }\nSeats: ${reservation?.totalSeats || 1}`
  );
  const location = encodeURIComponent(event.venue || event.location);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${start}/${end}&details=${details}&location=${location}`;
}

export type EventTemporalStatus = 'upcoming' | 'ongoing' | 'completed';

export interface EventLifecycleInfo {
  status: EventTemporalStatus;
  label: 'Upcoming' | 'Ongoing' | 'Completed';
  color: 'emerald' | 'amber' | 'stone';
  badgeClass: string;
  isUpcoming: boolean;
  isOngoing: boolean;
  isCompleted: boolean;
}

/**
 * Automatically manages event lifecycle status based on configured start and end date/time.
 * - Upcoming: Event has not started yet (now < startDate)
 * - Ongoing: Event is currently happening (now >= startDate && now <= endDate)
 * - Completed: Event date/time has passed (now > endDate)
 */
export function getEventLifecycleStatus(
  event: { startDate: string; endDate?: string } | AlumniEvent,
  now: Date = new Date()
): EventLifecycleInfo {
  const currentTime = now.getTime();
  const startTime = new Date(event.startDate).getTime();
  const validStartTime = isNaN(startTime) ? Date.now() + 86400000 : startTime;

  // Default end time to 4 hours after start if not specified or invalid
  const endTimeRaw = event.endDate ? new Date(event.endDate).getTime() : NaN;
  const validEndTime = !isNaN(endTimeRaw) && endTimeRaw >= validStartTime
    ? endTimeRaw
    : validStartTime + 4 * 60 * 60 * 1000;

  if (currentTime < validStartTime) {
    return {
      status: 'upcoming',
      label: 'Upcoming',
      color: 'emerald',
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      isUpcoming: true,
      isOngoing: false,
      isCompleted: false
    };
  }

  if (currentTime >= validStartTime && currentTime <= validEndTime) {
    return {
      status: 'ongoing',
      label: 'Ongoing',
      color: 'amber',
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60 font-semibold',
      isUpcoming: false,
      isOngoing: true,
      isCompleted: false
    };
  }

  return {
    status: 'completed',
    label: 'Completed',
    color: 'stone',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200/80 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700',
    isUpcoming: false,
    isOngoing: false,
    isCompleted: true
  };
}
