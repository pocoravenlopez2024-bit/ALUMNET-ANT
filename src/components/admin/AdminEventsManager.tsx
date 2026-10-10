/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Calendar,
  Search,
  Plus,
  Trash2,
  Users,
  MapPin,
  Clock,
  Video,
  ExternalLink,
  Check,
  X,
  Sparkles,
  LayoutGrid,
  List,
  Flame,
  Award,
  Compass,
  Upload,
  Camera,
  Loader2,
  AlertTriangle,
  Sliders,
  ShieldCheck,
  Download,
  CheckCircle2,
  ArrowRight,
  Filter,
  Eye,
  SlidersHorizontal,
  ChevronRight,
  UserCheck,
  BarChart3,
  Share2
} from 'lucide-react';
import { shareEventViaCapacitor } from '../../services/nativeShareService';
import { useAlumni } from '../../context/AlumniContext';
import { AlumniEvent, EventAttendee } from '../../types';
import { compressImage } from '../../lib/utils';
import {
  DEFAULT_EVENT_IMAGE,
  EVENT_IMAGE_PRESETS,
  getEventImage,
  handleEventImageError
} from '../../lib/defaultImages';
import {
  calculateEventDeadline,
  getEventReservationStatus,
  getEventLifecycleStatus
} from '../../services/eventReservationService';

/**
 * Custom Executive Convocations Deck & Chronological Schedule Stream
 * Distinct 2-Deck Split Calendar Architecture
 */
export const AdminEventsManager: React.FC = () => {
  const {
    events,
    createEvent,
    deleteEvent,
    permissions,
    showToast,
    currentUser,
    addAuditLog
  } = useAlumni();

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'dossier' | 'table'>('dossier');
  const [filterScope, setFilterScope] = useState<'all' | 'upcoming' | 'virtual' | 'reunions'>('all');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null);
  const [inspectingEvent, setInspectingEvent] = useState<AlumniEvent | null>(null);

  // Form State with sensible defaults
  const [formTitle, setFormTitle] = useState('');
  const [formTagline, setFormTagline] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formCategory, setFormCategory] = useState<AlumniEvent['type']>('reunion');
  const [formStartDate, setFormStartDate] = useState('2026-10-15T09:00');
  const [formEndDate, setFormEndDate] = useState('2026-10-15T17:00');
  const [formLocation, setFormLocation] = useState('St. Cecilia Quadrangle');
  const [formIsVirtual, setFormIsVirtual] = useState(false);
  const [formHeroImage, setFormHeroImage] = useState(
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&auto=format&fit=crop&q=80'
  );
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const photoFileInputRef = useRef<HTMLInputElement>(null);

  // Capacity & RSVP Settings
  const [formMaxAttendees, setFormMaxAttendees] = useState(250);
  const [formMaxGuests, setFormMaxGuests] = useState(2);
  const [formRegCloseDaysBefore, setFormRegCloseDaysBefore] = useState(10);
  const [formEnableWaitlist, setFormEnableWaitlist] = useState(true);
  const [formAutoConfirm, setFormAutoConfirm] = useState(true);
  const [formEmailNotification, setFormEmailNotification] = useState(true);

  // Photo compression
  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    setPhotoError('');
    setIsProcessingPhoto(true);
    try {
      const compressed = await compressImage(file, 1280, 0.85);
      setFormHeroImage(compressed);
      showToast('Event banner image processed and attached.', 'success');
    } catch {
      setPhotoError('Failed to compress image. Using raw upload.');
      const reader = new FileReader();
      reader.onload = (e) => setFormHeroImage(e.target?.result as string);
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Metrics derived from data
  const totalRsvps = useMemo(() => events.reduce((acc, ev) => acc + (ev.attendeesCount || 0), 0), [events]);
  const reunionCount = useMemo(() => events.filter((e) => e.type === 'reunion').length, [events]);
  const virtualCount = useMemo(() => events.filter((e) => e.isVirtual).length, [events]);

  // Next Upcoming Event Spotlight
  const upcomingSpotlightEvent = useMemo(() => {
    if (events.length === 0) return null;
    const now = Date.now();
    const sorted = [...events].sort((a, b) => {
      const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return timeA - timeB;
    });
    const upcoming = sorted.find((e) => (e.startDate ? new Date(e.startDate).getTime() > now : false));
    return upcoming || sorted[0];
  }, [events]);

  // Categories list with counts
  const categoriesList = useMemo(() => {
    const list = [
      { id: 'all', label: 'All Gatherings' },
      { id: 'reunion', label: 'Grand Reunions' },
      { id: 'workshop', label: 'Academic & Workshops' },
      { id: 'networking', label: 'Career Networking' },
      { id: 'webinar', label: 'Webinars & Virtual' },
      { id: 'social', label: 'Collegiate Socials' }
    ];
    return list.map((item) => {
      if (item.id === 'all') return { ...item, count: events.length };
      const count = events.filter((e) => e.type === item.id).length;
      return { ...item, count };
    });
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    let result = [...events];

    // Scope filter
    const now = Date.now();
    if (filterScope === 'upcoming') {
      result = result.filter((e) => e.startDate && new Date(e.startDate).getTime() >= now);
    } else if (filterScope === 'virtual') {
      result = result.filter((e) => e.isVirtual);
    } else if (filterScope === 'reunions') {
      result = result.filter((e) => e.type === 'reunion');
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((e) => e.type === selectedCategory);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          (e.title || '').toLowerCase().includes(q) ||
          (e.location || '').toLowerCase().includes(q) ||
          (e.description || '').toLowerCase().includes(q) ||
          (e.tagline || '').toLowerCase().includes(q)
      );
    }

    // Sort by start date ascending
    result.sort((a, b) => {
      const timeA = a.startDate ? new Date(a.startDate).getTime() : 0;
      const timeB = b.startDate ? new Date(b.startDate).getTime() : 0;
      return timeA - timeB;
    });

    return result;
  }, [events, filterScope, selectedCategory, searchQuery]);

  // Form Submit Handler
  const handleCreateSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!formTitle.trim()) {
        showToast('Event title is required.', 'error');
        return;
      }

      const calculatedDeadline = calculateEventDeadline({
        startDate: formStartDate,
        registrationCloseDaysBefore: formRegCloseDaysBefore
      });

      createEvent({
        title: formTitle.trim(),
        tagline: formTagline.trim() || undefined,
        description: formDesc.trim() || 'Join fellow alumni and staff for this collegiate assembly.',
        location: formLocation.trim() || 'St. Cecilia Quadrangle',
        venue: formLocation.trim() || 'St. Cecilia Quadrangle',
        type: formCategory,
        startDate: new Date(formStartDate).toISOString(),
        endDate: new Date(formEndDate).toISOString(),
        heroImageUrl: formHeroImage.trim() || DEFAULT_EVENT_IMAGE,
        isVirtual: formIsVirtual,
        isImportant: false,
        maxAttendees: Number(formMaxAttendees) || 250,
        maxParticipants: Number(formMaxAttendees) || 250,
        maxGuestsPerAlumni: Number(formMaxGuests) || 2,
        registrationCloseDaysBefore: Number(formRegCloseDaysBefore) || 10,
        calculatedDeadline: calculatedDeadline.toISOString(),
        enableWaitingList: formEnableWaitlist,
        autoConfirm: formAutoConfirm,
        emailNotificationEnabled: formEmailNotification
      });

      addAuditLog({
        action: 'CREATE_CAMPUS_EVENT',
        actorId: currentUser?.uid || 'events_officer',
        actorName: currentUser?.name || 'Alumni Events Coordinator',
        actorRole: currentUser?.role || 'admin',
        category: 'engagement',
        details: `Scheduled campus convocation: "${formTitle.trim()}" (${formCategory})`,
        severity: 'info'
      });

      setFormTitle('');
      setFormTagline('');
      setFormDesc('');
      setShowCreateModal(false);
      showToast('Collegiate assembly scheduled and published.', 'success');
    },
    [
      formTitle,
      formTagline,
      formDesc,
      formCategory,
      formStartDate,
      formEndDate,
      formLocation,
      formHeroImage,
      formIsVirtual,
      formMaxAttendees,
      formMaxGuests,
      formRegCloseDaysBefore,
      formEnableWaitlist,
      formAutoConfirm,
      formEmailNotification,
      createEvent,
      addAuditLog,
      currentUser,
      showToast
    ]
  );

  // Delete Event Handler
  const confirmDelete = useCallback(() => {
    if (!eventToDelete) return;
    deleteEvent(eventToDelete.id);

    addAuditLog({
      action: 'DELETE_CAMPUS_EVENT',
      actorId: currentUser?.uid || 'events_officer',
      actorName: currentUser?.name || 'Alumni Events Coordinator',
      actorRole: currentUser?.role || 'admin',
      category: 'engagement',
      details: `Removed campus convocation: "${eventToDelete.title}" (ID: ${eventToDelete.id})`,
      severity: 'warning'
    });

    setEventToDelete(null);
    showToast('Event removed from collegiate calendar.', 'info');
  }, [eventToDelete, deleteEvent, addAuditLog, currentUser, showToast]);

  // Export CSV
  const handleExportCsv = useCallback(() => {
    const headers = ['ID', 'Event Title', 'Category', 'Start Date', 'End Date', 'Location / Format', 'Capacity', 'RSVPs', 'Status'];
    const rows = events.map((ev) => [
      `"${ev.id}"`,
      `"${(ev.title || '').replace(/"/g, '""')}"`,
      `"${ev.type || 'reunion'}"`,
      `"${ev.startDate || ''}"`,
      `"${ev.endDate || ''}"`,
      `"${(ev.location || '').replace(/"/g, '""')}"`,
      `"${ev.maxAttendees || 200}"`,
      `"${ev.attendeesCount || 0}"`,
      `"${ev.isVirtual ? 'Virtual' : 'In-Person'}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SCC_Campus_Events_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Convocations schedule exported to CSV.', 'success');
  }, [events, showToast]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. EXECUTIVE CONVOCATIONS RIBBON */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8B181B] tracking-wide uppercase">
              <Calendar className="w-4 h-4 stroke-[2]" />
              <span>Office of Alumni Affairs · St. Cecilia's College Convocations Desk</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Campus Gatherings, Assemblies & Grand Reunions
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span>Total Gatherings: <strong className="text-stone-900 font-semibold">{events.length}</strong></span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span>Grand Reunions: <strong className="text-stone-900 font-semibold">{reunionCount}</strong></span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span>Virtual / Hybrid: <strong className="text-stone-900 font-semibold">{virtualCount}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200/80 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#8B181B] hover:bg-[#721316] shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Post New Gathering</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. MAIN VIEW: ASYMMETRIC 2-DECK SCHEDULE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT DECK (4 cols): UPCOMING SPOTLIGHT & CAPACITY RADAR ================= */}
        <div className="lg:col-span-4 space-y-5">
          {/* Spotlight Card */}
          {upcomingSpotlightEvent && (
            <div className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-2xs space-y-4">
              <div className="relative h-44 bg-stone-100 overflow-hidden">
                <img
                  src={upcomingSpotlightEvent.heroImageUrl || DEFAULT_EVENT_IMAGE}
                  alt={upcomingSpotlightEvent.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />
                <div className="absolute top-3 left-3 bg-stone-900/80 backdrop-blur-xs text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
                  Next Upcoming Gathering
                </div>
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
                    {upcomingSpotlightEvent.startDate ? new Date(upcomingSpotlightEvent.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBA'}
                  </span>
                  <h3 className="text-base font-bold text-white leading-snug line-clamp-1">
                    {upcomingSpotlightEvent.title}
                  </h3>
                </div>
              </div>

              <div className="p-4 pt-0 space-y-3 text-xs">
                <div className="flex items-center gap-1.5 text-stone-600">
                  <MapPin className="w-3.5 h-3.5 text-[#8B181B] shrink-0" />
                  <span className="truncate">{upcomingSpotlightEvent.location}</span>
                </div>

                {upcomingSpotlightEvent.description && (
                  <p className="text-stone-600 line-clamp-2 leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                    {upcomingSpotlightEvent.description}
                  </p>
                )}

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setInspectingEvent(upcomingSpotlightEvent)}
                    className="font-semibold text-[#8B181B] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>View Gathering Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] uppercase font-bold text-stone-400">
                    {upcomingSpotlightEvent.type}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Category Filter Radar */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Gathering Classifications
              </span>
              {selectedCategory !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className="text-[11px] font-semibold text-[#8B181B] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-1">
              {categoriesList.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'text-stone-700 hover:bg-stone-100/80'
                  }`}
                >
                  <span className="truncate">{cat.label}</span>
                  <span
                    className={`ml-2 text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${
                      selectedCategory === cat.id
                        ? 'bg-stone-800 text-stone-200'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Institutional Convocation Directives */}
          <div className="bg-stone-50/80 border border-stone-200/80 rounded-2xl p-4 shadow-2xs space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
              <ShieldCheck className="w-4 h-4 text-[#8B181B]" />
              <span>Collegiate Gathering Directives</span>
            </div>
            <ul className="text-xs text-stone-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-[#8B181B] font-bold">·</span>
                <span>Post open campus gatherings, grand homecomings, and batch reunions.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#8B181B] font-bold">·</span>
                <span>Gatherings are announced across the alumni network without gatekeeping or ticket monitoring.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#8B181B] font-bold">·</span>
                <span>Alumni can coordinate attendance, batch discussions, and program agendas freely.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ================= RIGHT DECK (8 cols): CONVOCATIONS TIMELINE & SCHEDULE ================= */}
        <div className="lg:col-span-8 space-y-4">
          {/* Controls Bar */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search gathering by title, venue, or description..."
                  className="w-full pl-9 pr-7 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* View Layout Toggle */}
              <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200 shrink-0 self-end sm:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('dossier')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    viewMode === 'dossier' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="Timeline Dossiers"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="Convocations Table"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scope Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setFilterScope('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filterScope === 'all'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                All Gatherings ({events.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterScope('upcoming')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filterScope === 'upcoming'
                    ? 'bg-[#8B181B] text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Upcoming Dates
              </button>
              <button
                type="button"
                onClick={() => setFilterScope('virtual')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filterScope === 'virtual'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Virtual / Hybrid ({virtualCount})
              </button>
              <button
                type="button"
                onClick={() => setFilterScope('reunions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  filterScope === 'reunions'
                    ? 'bg-[#8B181B] text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Reunions ({reunionCount})
              </button>
            </div>
          </div>

          {/* VIEW 1: TIMELINE DOSSIER CARDS */}
          {viewMode === 'dossier' ? (
            filteredEvents.length === 0 ? (
              <div className="bg-white border border-stone-200/80 rounded-2xl p-10 text-center space-y-2">
                <Calendar className="w-8 h-8 text-stone-400 mx-auto" />
                <p className="text-sm font-semibold text-stone-800">No gatherings match the current criteria</p>
                <p className="text-xs text-stone-500">Try adjusting your category selection or search keywords.</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {filteredEvents.map((ev) => {
                  const maxCap = ev.maxAttendees || 250;
                  const currentRsvp = ev.attendeesCount || 0;
                  const pct = Math.min(100, Math.round((currentRsvp / maxCap) * 100));
                  const startDateObj = ev.startDate ? new Date(ev.startDate) : null;

                  return (
                    <div
                      key={ev.id}
                      className="bg-white border border-stone-200/80 hover:border-stone-300 rounded-2xl p-5 shadow-2xs transition-all space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Date Flag & Details */}
                        <div className="flex items-start gap-4">
                          {/* Collegiate Date Monogram */}
                          <div className="w-16 h-16 rounded-xl bg-stone-100 border border-stone-200 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B181B]">
                              {startDateObj ? startDateObj.toLocaleDateString([], { month: 'short' }) : 'TBA'}
                            </span>
                            <span className="text-xl font-bold text-stone-900 leading-tight">
                              {startDateObj ? startDateObj.getDate() : '--'}
                            </span>
                            <span className="text-[9px] text-stone-400">
                              {startDateObj ? startDateObj.getFullYear() : ''}
                            </span>
                          </div>

                          {/* Titles & Meta */}
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                              <span className="font-semibold text-[#8B181B] uppercase tracking-wider text-[10px]">
                                {ev.type}
                              </span>
                              {(() => {
                                const lifecycle = getEventLifecycleStatus(ev);
                                return (
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${lifecycle.badgeClass}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${lifecycle.status === 'ongoing' ? 'bg-amber-500 animate-ping' : lifecycle.status === 'upcoming' ? 'bg-emerald-500' : 'bg-stone-400'}`} />
                                    {lifecycle.label}
                                  </span>
                                );
                              })()}
                              <span className="text-stone-300">·</span>
                              <span>{ev.location}</span>
                              {ev.isVirtual && (
                                <>
                                  <span className="text-stone-300">·</span>
                                  <span className="text-blue-700 font-medium">Virtual Gathering</span>
                                </>
                              )}
                            </div>
                            <h3 className="text-base font-bold text-stone-900 tracking-tight leading-snug">
                              {ev.title}
                            </h3>
                            {ev.tagline && (
                              <p className="text-xs text-stone-600 italic">"{ev.tagline}"</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Excerpt */}
                      {ev.description && (
                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {ev.description}
                        </p>
                      )}

                      {/* Actions Footer */}
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                        <div className="text-stone-400">
                          {startDateObj ? startDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBA'}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => setInspectingEvent(ev)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5 text-stone-600" />
                            <span>Inspect Details</span>
                          </button>
                          {permissions.canDeleteEvents && (
                            <button
                              type="button"
                              onClick={() => setEventToDelete({ id: ev.id, title: ev.title })}
                              className="p-1.5 text-stone-400 hover:text-rose-700 rounded-lg transition-colors cursor-pointer"
                              title="Delete Event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* VIEW 2: STRUCTURED CONVOCATIONS TABLE */
            <div className="bg-white border border-stone-200/80 rounded-2xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="bg-stone-50/80 text-stone-700 font-semibold border-b border-stone-200/80 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Gathering & Category</th>
                      <th className="py-3 px-3">Date & Time</th>
                      <th className="py-3 px-3">Location</th>
                      <th className="py-3 px-3">Format</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredEvents.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-stone-400">
                          No gatherings scheduled matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredEvents.map((ev) => (
                        <tr key={ev.id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-stone-900">{ev.title}</div>
                            <div className="text-[11px] text-[#8B181B] font-medium uppercase tracking-wider">{ev.type}</div>
                          </td>
                          <td className="py-3 px-3">
                            <div>{ev.startDate ? new Date(ev.startDate).toLocaleDateString() : 'TBA'}</div>
                            <div className="text-[11px] text-stone-400">
                              {ev.startDate ? new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            <div className="text-stone-800">{ev.location}</div>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${ev.isVirtual ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-stone-100 text-stone-700'}`}>
                              {ev.isVirtual ? 'Virtual' : 'In-Person'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => setInspectingEvent(ev)}
                                className="px-2.5 py-1 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg cursor-pointer transition-colors"
                              >
                                Details
                              </button>
                              {permissions.canDeleteEvents && (
                                <button
                                  type="button"
                                  onClick={() => setEventToDelete({ id: ev.id, title: ev.title })}
                                  className="p-1 rounded text-stone-400 hover:text-rose-700 cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODAL: CREATE EVENT ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Schedule Collegiate Gathering</h2>
                <p className="text-xs text-stone-500">Publish a campus event or grand alumni homecoming assembly.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-stone-400 hover:text-stone-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Grand Alumni Homecoming 2026"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                  >
                    <option value="reunion">Grand Reunion</option>
                    <option value="workshop">Academic & Workshop</option>
                    <option value="networking">Career Networking</option>
                    <option value="webinar">Webinar</option>
                    <option value="social">Collegiate Social</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Tagline / Motto</label>
                  <input
                    type="text"
                    value={formTagline}
                    onChange={(e) => setFormTagline(e.target.value)}
                    placeholder="e.g. Reliving Memories, Building Legacies"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Venue / Location</label>
                <input
                  type="text"
                  value={formLocation}
                  onChange={(e) => setFormLocation(e.target.value)}
                  placeholder="St. Cecilia Quadrangle / Auditorium / Campus Grounds"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsVirtual}
                    onChange={(e) => setFormIsVirtual(e.target.checked)}
                    className="w-4 h-4 text-[#8B181B] rounded border-stone-300"
                  />
                  <span className="font-semibold text-stone-800">Virtual / Hybrid Format</span>
                </label>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Event Hero Banner</label>
                <input
                  type="file"
                  ref={photoFileInputRef}
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                  }}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => photoFileInputRef.current?.click()}
                    disabled={isProcessingPhoto}
                    className="px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                  </button>
                  <span className="text-stone-400">or use preset default image</span>
                </div>
                {formHeroImage && (
                  <div className="mt-2 h-28 rounded-xl overflow-hidden border border-stone-200">
                    <img src={formHeroImage} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Details regarding registration, dress code, and program flow..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-[#8B181B] hover:bg-[#721316] font-semibold shadow-sm cursor-pointer"
                >
                  Publish Gathering
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: INSPECT EVENT ================= */}
      {inspectingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold text-[#8B181B] uppercase tracking-wider">
                  {inspectingEvent.type}
                </span>
                <h2 className="text-lg font-bold text-stone-900 mt-0.5">{inspectingEvent.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setInspectingEvent(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectingEvent.heroImageUrl && (
              <div className="rounded-xl overflow-hidden h-44 bg-stone-100">
                <img
                  src={inspectingEvent.heroImageUrl}
                  alt={inspectingEvent.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl text-xs">
              <div>
                <span className="text-stone-400 block text-[11px]">Date</span>
                <span className="font-semibold text-stone-800">
                  {inspectingEvent.startDate ? new Date(inspectingEvent.startDate).toLocaleDateString() : 'TBA'}
                </span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Venue</span>
                <span className="font-semibold text-stone-800">{inspectingEvent.location}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Category</span>
                <span className="font-semibold text-stone-800 uppercase">{inspectingEvent.type}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Format</span>
                <span className="font-semibold text-stone-800">{inspectingEvent.isVirtual ? 'Virtual Stream' : 'In-Person Gathering'}</span>
              </div>
            </div>

            <div className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">
              {inspectingEvent.description}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
              <button
                type="button"
                onClick={async () => {
                  const res = await shareEventViaCapacitor(inspectingEvent);
                  if (res.shared) {
                    showToast(`Broadcasted "${inspectingEvent.title}" to external apps!`, 'success');
                  } else if (res.copiedToClipboard) {
                    showToast('Event details & invitation link copied to clipboard!', 'success');
                  }
                }}
                className="px-3.5 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5 shadow-2xs transition-colors"
                title="Broadcast event to external apps via Capacitor Share"
              >
                <Share2 className="w-3.5 h-3.5 text-white" />
                <span>Share Gathering</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectingEvent(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE EVENT ================= */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Cancel Gathering?</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to cancel and remove <strong>"{eventToDelete.title}"</strong> from the campus schedule? This will be permanently recorded in the institutional audit log.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 text-xs">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-white bg-rose-700 hover:bg-rose-800 font-semibold cursor-pointer"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
