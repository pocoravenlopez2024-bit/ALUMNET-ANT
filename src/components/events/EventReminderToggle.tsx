import React, { useState, useEffect } from 'react';
import { Bell, BellRing, Clock, Check, BellOff, Loader2 } from 'lucide-react';
import { AlumniEvent } from '../../types';
import {
  isEventReminderActive,
  toggleEventReminder,
  calculateReminderDetails,
  isNotificationSupported,
  getNotificationPermission
} from '../../services/eventReminderService';
import { useAlumni } from '../../context/AlumniContext';

interface EventReminderToggleProps {
  event: AlumniEvent;
  variant?: 'button' | 'icon' | 'detail-panel';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onToggled?: (isSet: boolean) => void;
}

export const EventReminderToggle: React.FC<EventReminderToggleProps> = ({
  event,
  variant = 'button',
  size = 'md',
  className = '',
  onToggled
}) => {
  const { currentUser, showToast } = useAlumni();
  const [isReminderSet, setIsReminderSet] = useState<boolean>(() => isEventReminderActive(event.id));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Sync state reactively with global event reminders
  useEffect(() => {
    setIsReminderSet(isEventReminderActive(event.id));

    const handleRemindersChanged = (e: any) => {
      const detail = e.detail;
      if (!detail || detail.eventId === event.id) {
        setIsReminderSet(isEventReminderActive(event.id));
      }
    };

    window.addEventListener('applet:event-reminders-changed', handleRemindersChanged);
    return () => {
      window.removeEventListener('applet:event-reminders-changed', handleRemindersChanged);
    };
  }, [event.id]);

  const timing = calculateReminderDetails(event.startDate);

  // If the event has already concluded, do not offer reminder scheduling
  if (timing.isPastEvent) {
    if (variant === 'detail-panel') {
      return (
        <div className="p-3.5 bg-stone-100 rounded-xl border border-stone-200 text-xs text-stone-500 flex items-center gap-2">
          <Clock className="w-4 h-4 text-stone-400 shrink-0" />
          <span>This gathering has concluded. Reminders are unavailable.</span>
        </div>
      );
    }
    return null;
  }

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLoading) return;

    setIsLoading(true);
    try {
      const result = await toggleEventReminder(event, currentUser?.uid);
      setIsReminderSet(result.isReminderSet);

      if (showToast) {
        showToast(
          result.isReminderSet
            ? `Reminder scheduled: You will be notified 1 hour before "${event.title}" begins.`
            : `Reminder cancelled for "${event.title}".`,
          result.isReminderSet ? 'success' : 'info'
        );
      }

      if (onToggled) {
        onToggled(result.isReminderSet);
      }
    } catch (err: any) {
      console.warn('Error toggling event reminder:', err);
      if (showToast) {
        showToast('Unable to update reminder settings. Please try again.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 1. Icon Only Variant (Compact for Card Badges & Toolbars)
  if (variant === 'icon') {
    const iconSizeClasses =
      size === 'sm'
        ? 'w-7 h-7 p-1 text-xs'
        : size === 'lg'
        ? 'w-9 h-9 p-2 text-sm'
        : 'w-8 h-8 p-1.5 text-xs';

    return (
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        aria-label={isReminderSet ? 'Cancel 1-hour pre-event reminder' : 'Set 1-hour pre-event reminder'}
        title={
          isReminderSet
            ? `Reminder active: 1h before start (${timing.formattedReminderTime}). Click to remove.`
            : `Remind me 1h before start (${timing.formattedReminderTime})`
        }
        className={`rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer select-none active:scale-95 ${iconSizeClasses} ${
          isReminderSet
            ? 'bg-[#8B181B] text-white shadow-xs hover:bg-[#721316] ring-2 ring-red-100'
            : 'bg-white/90 text-stone-600 hover:text-[#8B181B] hover:bg-stone-100 border border-stone-200/90 shadow-2xs'
        } ${className}`}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isReminderSet ? (
          <BellRing className="w-3.5 h-3.5 text-amber-300 stroke-[2.2]" />
        ) : (
          <Bell className="w-3.5 h-3.5 stroke-[1.75]" />
        )}
      </button>
    );
  }

  // 2. Full Educational Detail Panel Variant (Used in Event Detail Modal)
  if (variant === 'detail-panel') {
    return (
      <div className={`p-4 rounded-2xl border transition-all duration-200 ${
        isReminderSet
          ? 'bg-red-50/70 border-red-200/90 shadow-2xs'
          : 'bg-stone-50 border-stone-200/90'
      } ${className}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              isReminderSet
                ? 'bg-[#8B181B] text-white shadow-xs'
                : 'bg-stone-200 text-stone-600'
            }`}>
              {isReminderSet ? (
                <BellRing className="w-4 h-4 text-amber-300 stroke-[2.2]" />
              ) : (
                <Bell className="w-4 h-4 stroke-[1.75]" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-stone-900 tracking-tight">
                  1-Hour Prior Notification
                </h4>
                {isReminderSet && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#8B181B] text-white rounded-md tracking-wider uppercase">
                    Active
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                {isReminderSet
                  ? `Scheduled for ${timing.formattedReminderTime}. A collegiate chime and device notification will sound 60 minutes before gates open.`
                  : `Receive a local chime notification on this device at ${timing.formattedReminderTime} (1 hour prior to start).`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 shrink-0 cursor-pointer flex items-center justify-center gap-2 active:scale-98 ${
              isReminderSet
                ? 'bg-white text-stone-700 hover:text-red-700 border border-stone-200 hover:border-red-200 shadow-2xs'
                : 'bg-[#8B181B] hover:bg-[#721316] text-white shadow-xs'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isReminderSet ? (
              <>
                <BellOff className="w-3.5 h-3.5 text-stone-500" />
                <span>Cancel Reminder</span>
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5 text-amber-200" />
                <span>Remind Me (1h Prior)</span>
              </>
            )}
          </button>
        </div>

        {/* Browser Permission Sub-banner if currently default/denied */}
        {isNotificationSupported() && getNotificationPermission() === 'denied' && (
          <div className="mt-3 pt-3 border-t border-stone-200/80 text-[11px] text-amber-800 flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 shrink-0 text-amber-600" />
            <span>Browser notification permission is currently blocked. Alerts will display in-app via toast notifications and chime.</span>
          </div>
        )}
      </div>
    );
  }

  // 3. Standard Button Variant (for Event Cards and Banners)
  const sizeClasses =
    size === 'sm'
      ? 'px-2.5 py-1 text-[11px] rounded-lg gap-1.5'
      : size === 'lg'
      ? 'px-4 py-2 text-xs rounded-xl gap-2 font-bold'
      : 'px-3 py-1.5 text-xs rounded-xl gap-1.5 font-bold';

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      aria-pressed={isReminderSet}
      title={
        isReminderSet
          ? `Reminder set for ${timing.formattedReminderTime}. Click to cancel.`
          : `Get notified at ${timing.formattedReminderTime} (1 hour before)`
      }
      className={`inline-flex items-center justify-center transition-all duration-200 cursor-pointer select-none active:scale-95 ${sizeClasses} ${
        isReminderSet
          ? 'bg-[#8B181B] text-white shadow-2xs hover:bg-[#721316] ring-1 ring-red-200'
          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 hover:text-stone-900 border border-stone-200/90'
      } ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : isReminderSet ? (
        <>
          <BellRing className="w-3.5 h-3.5 text-amber-300 stroke-[2.2] animate-pulse" />
          <span>Reminder Set (1h prior)</span>
        </>
      ) : (
        <>
          <Bell className="w-3.5 h-3.5 text-stone-500 group-hover:text-stone-800 stroke-[1.75]" />
          <span>Remind Me</span>
        </>
      )}
    </button>
  );
};
