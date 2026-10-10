/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Briefcase,
  Clock,
  Sparkles,
  GraduationCap,
  Moon,
  ChevronDown,
  Check,
  Edit3,
  X,
  MessageSquare
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { QuickStatusAvailability } from '../../types';
import { Skeleton } from '../common/BentoSkeleton';

export interface StatusOption {
  id: QuickStatusAvailability;
  label: string;
  description: string;
  dotColor: string;
  pulseColor: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const QUICK_STATUS_OPTIONS: StatusOption[] = [
  {
    id: 'Open to Networking',
    label: 'Open to Networking',
    description: 'Welcoming connections, direct messages & collegiate networking',
    dotColor: 'bg-emerald-500',
    pulseColor: 'bg-emerald-400',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    badgeText: 'text-emerald-800',
    icon: Users
  },
  {
    id: 'Hiring',
    label: 'Hiring',
    description: 'Actively recruiting Cecilian talent or interns for your company',
    dotColor: 'bg-purple-500',
    pulseColor: 'bg-purple-400',
    badgeBg: 'bg-purple-50',
    badgeBorder: 'border-purple-200',
    badgeText: 'text-purple-800',
    icon: Briefcase
  },
  {
    id: 'Busy',
    label: 'Busy',
    description: 'Focused on deep work or exam season; delayed response',
    dotColor: 'bg-amber-500',
    pulseColor: 'bg-amber-400',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    badgeText: 'text-amber-900',
    icon: Clock
  },
  {
    id: 'Seeking Opportunities',
    label: 'Seeking Opportunities',
    description: 'Open to job referrals, internships, or new career challenges',
    dotColor: 'bg-sky-500',
    pulseColor: 'bg-sky-400',
    badgeBg: 'bg-sky-50',
    badgeBorder: 'border-sky-200',
    badgeText: 'text-sky-800',
    icon: Sparkles
  },
  {
    id: 'Mentoring',
    label: 'Mentoring',
    description: 'Available to guide student interns & junior batchmates',
    dotColor: 'bg-teal-500',
    pulseColor: 'bg-teal-400',
    badgeBg: 'bg-teal-50',
    badgeBorder: 'border-teal-200',
    badgeText: 'text-teal-800',
    icon: GraduationCap
  },
  {
    id: 'Offline',
    label: 'Offline',
    description: 'Currently away or taking time off from notifications',
    dotColor: 'bg-stone-400',
    pulseColor: 'bg-stone-300',
    badgeBg: 'bg-stone-100',
    badgeBorder: 'border-stone-300',
    badgeText: 'text-stone-700',
    icon: Moon
  }
];

export const getStatusConfig = (status?: string | null): StatusOption => {
  const match = QUICK_STATUS_OPTIONS.find((s) => s.id === status);
  return match || QUICK_STATUS_OPTIONS[0]; // Default to Open to Networking
};

interface QuickStatusSelectorProps {
  compact?: boolean;
  className?: string;
  isLoading?: boolean;
}

export const QuickStatusSelector: React.FC<QuickStatusSelectorProps> = ({
  compact = false,
  className = '',
  isLoading: propIsLoading
}) => {
  const { currentUser, updateUserProfile, isLoadingData } = useAlumni();
  const isLoading = propIsLoading ?? isLoadingData;
  const [isOpen, setIsOpen] = useState(false);
  const [customNote, setCustomNote] = useState(currentUser?.quickStatusNote || '');
  const [isEditingNote, setIsEditingNote] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentConfig = getStatusConfig(currentUser?.quickStatus);

  // Close on outer click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsEditingNote(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelectStatus = (option: StatusOption) => {
    updateUserProfile({
      quickStatus: option.id,
      quickStatusNote: customNote.trim() || undefined,
      quickStatusUpdatedAt: new Date().toISOString()
    });
    setIsOpen(false);
    setIsEditingNote(false);
  };

  const handleSaveNote = () => {
    updateUserProfile({
      quickStatus: currentUser?.quickStatus || 'Open to Networking',
      quickStatusNote: customNote.trim() || undefined,
      quickStatusUpdatedAt: new Date().toISOString()
    });
    setIsEditingNote(false);
  };

  const StatusIcon = currentConfig.icon;

  if (isLoading || !currentUser) {
    return (
      <div className={`inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-850 ${className}`}>
        <Skeleton className="w-2 h-2 rounded-full" />
        <Skeleton className="h-3 w-24 rounded" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button with Color-Coded Indicator */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select availability status"
        aria-expanded={isOpen}
        className={`group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all duration-200 cursor-pointer shadow-2xs ${currentConfig.badgeBg} ${currentConfig.badgeBorder} ${currentConfig.badgeText} hover:shadow-sm active:scale-98`}
      >
        {/* Color-Coded Indicator with Pulsing Ring */}
        <span className="relative flex h-2 sm:h-2.5 w-2 sm:w-2.5 shrink-0 items-center justify-center">
          {['Open to Networking', 'Hiring', 'Seeking Opportunities'].includes(currentConfig.id) && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${currentConfig.pulseColor}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 sm:h-2 w-1.5 sm:w-2 ${currentConfig.dotColor}`} />
        </span>

        <span className="font-bold tracking-tight whitespace-nowrap text-[11px] sm:text-xs">
          {currentConfig.label}
        </span>

        {currentUser?.quickStatusNote && !compact && (
          <span className="max-w-[80px] sm:max-w-[120px] truncate text-[10px] sm:text-[11px] opacity-75 font-normal">
            · {currentUser.quickStatusNote}
          </span>
        )}

        <ChevronDown
          className={`w-3 sm:w-3.5 h-3 sm:h-3.5 opacity-60 transition-transform duration-200 group-hover:opacity-100 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute left-0 sm:left-auto sm:right-0 mt-2 z-50 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl border border-stone-200/90 shadow-[0_12px_32px_rgba(0,0,0,0.12)] p-3.5 overflow-hidden"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-stone-100">
              <div>
                <h4 className="text-xs font-bold text-stone-900 tracking-tight">
                  Alumni Availability Status
                </h4>
                <p className="text-[10px] text-stone-500 font-medium">
                  Visible across directory and profile card
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-md transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Status Options List */}
            <div className="space-y-1">
              {QUICK_STATUS_OPTIONS.map((opt) => {
                const isSelected = (currentUser?.quickStatus || 'Open to Networking') === opt.id;
                const OptIcon = opt.icon;

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectStatus(opt)}
                    className={`w-full text-left p-2 rounded-xl transition-all flex items-start justify-between gap-2.5 cursor-pointer ${
                      isSelected
                        ? `${opt.badgeBg} ${opt.badgeBorder} border shadow-2xs`
                        : 'hover:bg-stone-50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="relative mt-1 shrink-0">
                        <span className={`block w-2.5 h-2.5 rounded-full ${opt.dotColor}`} />
                        {['Open to Networking', 'Hiring'].includes(opt.id) && (
                          <span
                            className={`animate-ping absolute inset-0 rounded-full opacity-60 ${opt.pulseColor}`}
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold ${isSelected ? opt.badgeText : 'text-stone-900'}`}>
                            {opt.label}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500 leading-tight line-clamp-1 mt-0.5">
                          {opt.description}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="shrink-0 mt-0.5">
                        <div className="w-4 h-4 rounded-full bg-[#8B181B] text-white flex items-center justify-center shadow-2xs">
                          <Check className="w-2.5 h-2.5 stroke-[2.5]" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom Availability Note Section */}
            <div className="mt-3 pt-2.5 border-t border-stone-100">
              {!isEditingNote ? (
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-stone-600 min-w-0">
                    <MessageSquare className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">
                      {currentUser?.quickStatusNote
                        ? `"${currentUser.quickStatusNote}"`
                        : 'Add a custom status note...'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingNote(true)}
                    className="text-[10px] font-bold text-[#8B181B] hover:text-[#721316] shrink-0 cursor-pointer flex items-center gap-0.5"
                  >
                    <Edit3 className="w-3 h-3" />
                    <span>{currentUser?.quickStatusNote ? 'Edit' : 'Set'}</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    value={customNote}
                    onChange={(e) => setCustomNote(e.target.value)}
                    placeholder="e.g. Hiring React devs, Mentoring batch 2024..."
                    maxLength={60}
                    className="w-full px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:bg-white focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B] outline-none"
                    autoFocus
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingNote(false)}
                      className="px-2 py-1 text-[10px] font-semibold text-stone-500 hover:text-stone-700 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNote}
                      className="px-2.5 py-1 bg-[#8B181B] hover:bg-[#721316] text-white text-[10px] font-bold rounded-md transition-colors cursor-pointer"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
