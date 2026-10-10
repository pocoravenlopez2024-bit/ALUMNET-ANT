import { AlumniEvent } from '../types';

export interface EventCancellationInfo {
  canCancel: boolean;
  deadlineDate: Date;
  deadlineFormatted: string;
  isPastDeadline: boolean;
  hoursRemaining: number;
  reason?: string;
}

/**
 * Calculates whether an RSVP for an event can be cancelled based on its cancellation window.
 * Default cancellation window is 24 hours prior to event start date.
 */
export function getEventCancellationInfo(event: AlumniEvent): EventCancellationInfo {
  const eventStart = new Date(event.startDate).getTime();
  const deadlineHours = event.cancellationDeadlineHours ?? 24;
  
  const deadlineTime = event.cancellationDeadline
    ? new Date(event.cancellationDeadline).getTime()
    : (isNaN(eventStart) ? Date.now() + 24 * 60 * 60 * 1000 : eventStart - deadlineHours * 60 * 60 * 1000);

  const now = Date.now();
  const isPastDeadline = now > deadlineTime;
  const canCancel = !isPastDeadline;
  const deadlineDate = new Date(deadlineTime);

  const deadlineFormatted = isNaN(deadlineDate.getTime())
    ? '24 hours prior to event'
    : deadlineDate.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      });

  const hoursRemaining = Math.max(0, Math.round((deadlineTime - now) / (1000 * 60 * 60)));

  return {
    canCancel,
    deadlineDate,
    deadlineFormatted,
    isPastDeadline,
    hoursRemaining,
    reason: isPastDeadline
      ? `Cancellation deadline passed on ${deadlineFormatted}`
      : `Cancellations accepted until ${deadlineFormatted}`
  };
}
