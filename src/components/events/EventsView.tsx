import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  MapPin,
  Users,
  Heart,
  MessageCircle,
  Plus,
  Filter,
  Check,
  Video,
  Clock,
  Sparkles,
  Edit2,
  Trash2,
  Share2,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Send,
  CornerDownRight,
  Search,
  UserCheck,
  UserPlus,
  Mail,
  Upload,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Flame,
  ArrowRight,
  ExternalLink,
  Loader2,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { AlumniEvent } from '../../types';
import { ShareModal, ShareItem } from '../common/ShareModal';
import { getEventCancellationInfo } from '../../services/eventCancellationService';
import { compressImage } from '../../lib/utils';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  DEFAULT_EVENT_IMAGE,
  EVENT_IMAGE_PRESETS,
  getEventImage,
  handleEventImageError,
  getUserAvatar,
  handleUserAvatarError
} from '../../lib/defaultImages';
import { InteractiveHeartReaction } from '../common/InteractiveHeartReaction';
import { EventReminderToggle } from './EventReminderToggle';
import { getEventLifecycleStatus } from '../../services/eventReservationService';
import { shareEventViaCapacitor } from '../../services/nativeShareService';

export const EventsView: React.FC = () => {
  const {
    currentUser,
    users,
    events,
    reservations,
    createEvent,
    editEvent,
    deleteEvent,
    toggleLikeEvent,
    addCommentToEvent,
    rsvpEvent,
    updateEventAttendance,
    permissions,
    setSelectedUserIdForModal,
    getOrCreateChat,
    setActiveTab,
    setActiveChatId,
    sendFriendRequest,
    isConnected,
    showToast
  } = useAlumni();

  const [filterType, setFilterType] = useState<'upcoming' | 'ongoing' | 'past' | 'all'>('upcoming');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'reunion' | 'workshop' | 'networking' | 'webinar' | 'social'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<AlumniEvent | null>(null);

  const handleShareEventWithCapacitor = async (evt: AlumniEvent) => {
    const result = await shareEventViaCapacitor(evt);
    if (result.shared) {
      if (showToast) showToast(`Broadcasted "${evt.title}" to external apps!`, 'success');
    } else if (result.copiedToClipboard) {
      if (showToast) showToast('Event details & link copied to clipboard!', 'success');
    }
  };

  const [modalTab, setModalTab] = useState<'details' | 'attendees'>('details');
  const [attendeeSearchQuery, setAttendeeSearchQuery] = useState('');
  const [attendeeStatusFilter, setAttendeeStatusFilter] = useState<'all' | 'going' | 'interested'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  
  // Side-panel comment drawer state (replaces messy inline card accordion)
  const [sidePanelEventId, setSidePanelEventId] = useState<string | null>(null);
  const [sidePanelCommentInput, setSidePanelCommentInput] = useState('');
  const [isDraggingHeroImage, setIsDraggingHeroImage] = useState(false);
  const [isCompressingHero, setIsCompressingHero] = useState(false);

  // Form State for Create / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formType, setFormType] = useState<'reunion' | 'workshop' | 'networking' | 'webinar' | 'social'>('networking');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formHeroImage, setFormHeroImage] = useState('');
  const [formIsVirtual, setFormIsVirtual] = useState(false);
  const [formIsImportant, setFormIsImportant] = useState(false);
  const [formMaxAttendees, setFormMaxAttendees] = useState(250);
  const [formCancellationHours, setFormCancellationHours] = useState<number>(24);
  const [shareItem, setShareItem] = useState<ShareItem | null>(null);

  // Confirmation dialog state for destructive/committed event actions (Requirement 5 & 13)
  const [eventActionConfirm, setEventActionConfirm] = useState<{
    type: 'cancel_rsvp' | 'delete_event';
    eventId: string;
    title: string;
  } | null>(null);

  const handleRsvpClick = (evt: AlumniEvent) => {
    if (evt.userRsvp === 'going') {
      setEventActionConfirm({
        type: 'cancel_rsvp',
        eventId: evt.id,
        title: evt.title
      });
    } else {
      rsvpEvent(evt.id, 'going');
    }
  };

  const handleDeleteClick = (evt: { id: string; title: string }) => {
    setEventActionConfirm({
      type: 'delete_event',
      eventId: evt.id,
      title: evt.title
    });
  };

  const now = new Date();


  // Featured flagship or nearest upcoming event
  const spotlightEvent = useMemo(() => {
    const upcoming = events.filter((e) => new Date(e.startDate) >= now);
    return upcoming.find((e) => e.isImportant) || upcoming[0] || null;
  }, [events, now]);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      const lifecycle = getEventLifecycleStatus(e, now);
      if (filterType === 'upcoming' && lifecycle.status !== 'upcoming') return false;
      if (filterType === 'ongoing' && lifecycle.status !== 'ongoing') return false;
      if (filterType === 'past' && lifecycle.status !== 'completed') return false;

      if (categoryFilter !== 'all' && e.type !== categoryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (e.title || '').toLowerCase().includes(q);
        const matchDesc = (e.description || '').toLowerCase().includes(q);
        const matchLoc = (e.location || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLoc) return false;
      }

      return true;
    }).sort((a, b) => {
      if (filterType === 'past') {
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      }
      return new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
    });
  }, [events, filterType, categoryFilter, searchQuery, now]);

  // Dynamically resolve active modal event from events list for live sync
  const activeEvent = useMemo(() => {
    if (!selectedEventForDetail) return null;
    return events.find((e) => e.id === selectedEventForDetail.id) || selectedEventForDetail;
  }, [events, selectedEventForDetail]);

  // Filtered attendees for the active event
  const filteredAttendees = useMemo(() => {
    if (!activeEvent) return [];
    let list = activeEvent.attendees || [];
    if (attendeeStatusFilter !== 'all') {
      list = list.filter((a) => a.status === attendeeStatusFilter);
    }
    if (attendeeSearchQuery.trim()) {
      const q = attendeeSearchQuery.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.batch && a.batch.toLowerCase().includes(q)) ||
          (a.course && a.course.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeEvent, attendeeStatusFilter, attendeeSearchQuery]);

  const openCreateModal = () => {
    setEditingEventId(null);
    setFormTitle('');
    setFormDescription('');
    setFormLocation('Campus Main Pavilion, San Francisco, CA');
    setFormType('networking');
    // default to 2 weeks ahead
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + 14);
    setFormStartDate(nextDate.toISOString().slice(0, 16));
    setFormEndDate(nextDate.toISOString().slice(0, 16));
    setFormHeroImage('https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1200&auto=format&fit=crop&q=80');
    setFormIsVirtual(false);
    setFormIsImportant(false);
    setFormMaxAttendees(200);
    setFormCancellationHours(24);
    setShowCreateModal(true);
  };

  const openEditModal = (e: AlumniEvent) => {
    setEditingEventId(e.id);
    setFormTitle(e.title);
    setFormDescription(e.description);
    setFormLocation(e.location);
    setFormType(e.type);
    setFormStartDate(e.startDate.slice(0, 16));
    setFormEndDate(e.endDate.slice(0, 16));
    setFormHeroImage(e.heroImageUrl);
    setFormIsVirtual(e.isVirtual);
    setFormIsImportant(e.isImportant);
    setFormMaxAttendees(e.maxAttendees);
    setFormCancellationHours(e.cancellationDeadlineHours ?? 24);
    setShowCreateModal(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDescription || !formLocation) return;

    if (editingEventId) {
      editEvent(editingEventId, {
        title: formTitle,
        description: formDescription,
        location: formLocation,
        type: formType,
        startDate: new Date(formStartDate).toISOString(),
        endDate: new Date(formEndDate).toISOString(),
        heroImageUrl: formHeroImage.trim() || DEFAULT_EVENT_IMAGE,
        isVirtual: formIsVirtual,
        isImportant: formIsImportant,
        maxAttendees: Number(formMaxAttendees),
        cancellationDeadlineHours: Number(formCancellationHours)
      });
    } else {
      createEvent({
        title: formTitle,
        description: formDescription,
        location: formLocation,
        type: formType,
        startDate: new Date(formStartDate).toISOString(),
        endDate: new Date(formEndDate).toISOString(),
        heroImageUrl: formHeroImage.trim() || DEFAULT_EVENT_IMAGE,
        isVirtual: formIsVirtual,
        isImportant: formIsImportant,
        maxAttendees: Number(formMaxAttendees),
        cancellationDeadlineHours: Number(formCancellationHours)
      });
    }

    setShowCreateModal(false);
  };

  const sidePanelEvent = useMemo(() => {
    if (!sidePanelEventId) return null;
    return events.find((e) => e.id === sidePanelEventId) || null;
  }, [events, sidePanelEventId]);

  const handleSidePanelCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sidePanelEventId || !sidePanelCommentInput.trim()) return;
    addCommentToEvent(sidePanelEventId, sidePanelCommentInput.trim());
    setSidePanelCommentInput('');
  };

  const handleHeroFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressingHero(true);
    try {
      const compressed = await compressImage(file, 1280, 800, 0.85);
      setFormHeroImage(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormHeroImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingHero(false);
    }
  };

  const handleHeroFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingHeroImage(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    setIsCompressingHero(true);
    try {
      const compressed = await compressImage(file, 1280, 800, 0.85);
      setFormHeroImage(compressed);
    } catch {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setFormHeroImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsCompressingHero(false);
    }
  };

  const handlePostComment = (eventId: string) => {
    if (!commentInput.trim()) return;
    addCommentToEvent(eventId, commentInput);
    setCommentInput('');
    // refresh selected event
    if (selectedEventForDetail?.id === eventId) {
      const updated = events.find((e) => e.id === eventId);
      if (updated) setSelectedEventForDetail(updated);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Institutional Collegiate Events Header */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#8B181B] via-[#991B1B] to-[#B45309]" />
        
        <div className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
                <span className="text-[#8B181B] font-bold">St. Cecilia's College - Cebu, Inc.</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span>Office of Alumni Relations</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="text-stone-400">Academic Year 2025–2026</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight">
                Campus Gatherings & Reunions
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl">
                Alumni homecomings, batch reunions, chapter assemblies, and fellowship gatherings uniting generations of Cecilians.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {permissions.canCreateEvents && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-98 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.2]" />
                  <span>Post Gathering / Reunion</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Flagship Gathering Spotlight Bento Hero (Show when upcoming and available) */}
      {spotlightEvent && filterType !== 'past' && !searchQuery && categoryFilter === 'all' && (
        <motion.div
          whileHover={{ y: -3, transition: { duration: 0.2, ease: "easeOut" } }}
          className="relative overflow-hidden rounded-2xl bg-white border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] grid grid-cols-1 lg:grid-cols-12 cursor-pointer group"
          onClick={() => setSelectedEventForDetail(spotlightEvent)}
        >
          <div className="lg:col-span-5 relative h-56 sm:h-64 lg:h-auto bg-stone-100 overflow-hidden">
            <img
              src={getEventImage(spotlightEvent.heroImageUrl)}
              alt={spotlightEvent.title}
              onError={handleEventImageError}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent lg:hidden" />
            <div className="absolute top-4 left-4 flex items-center gap-2">
              <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#8B181B] text-white rounded-lg shadow-sm flex items-center gap-1.5">
                <Flame className="w-3 h-3 fill-white" />
                Featured Flagship Convocation
              </span>
            </div>
          </div>

          <div className="lg:col-span-7 p-5 sm:p-7 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 mb-2">
                <span className="font-bold text-[#8B181B] uppercase tracking-wider">
                  {spotlightEvent.type}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-stone-400" />
                  {new Date(spotlightEvent.startDate).toLocaleDateString([], {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {spotlightEvent.location}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-stone-900 group-hover:text-[#8B181B] transition-colors tracking-tight leading-snug">
                {spotlightEvent.title}
              </h3>

              <p className="text-xs sm:text-sm text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                {spotlightEvent.description}
              </p>
            </div>

            <div className="mt-5 pt-4 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 overflow-hidden py-0.5">
                  {(spotlightEvent.attendees || []).slice(0, 4).map((att, idx) => (
                    <img
                      key={att.uid || idx}
                      src={getUserAvatar(att.avatar || att.avatarUrl)}
                      alt={att.name}
                      onError={handleUserAvatarError}
                      className="w-6 h-6 rounded-full ring-2 ring-white object-cover shadow-2xs"
                    />
                  ))}
                </div>
                <span className="text-xs font-semibold text-stone-700">
                  <strong className="text-stone-900">{spotlightEvent.attendeesCount}</strong> alumni attending
                </span>
              </div>

              <div className="flex items-center gap-2">
                <EventReminderToggle
                  event={spotlightEvent}
                  variant="button"
                  size="sm"
                />

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRsvpClick(spotlightEvent);
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                    spotlightEvent.userRsvp === 'going'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-[#8B181B] hover:bg-[#721316] text-white'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{spotlightEvent.userRsvp === 'going' ? 'Attending • Cancel RSVP' : 'RSVP Going'}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEventForDetail(spotlightEvent);
                  }}
                  className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>Program Dossier</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Filter, Search and View Controls Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] space-y-4">
        {/* Top Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5">
          {/* Timeframe Segment Tabs */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterType('upcoming')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'upcoming'
                  ? 'bg-white text-[#8B181B] shadow-2xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Upcoming ({events.filter((e) => getEventLifecycleStatus(e, now).status === 'upcoming').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('ongoing')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'ongoing'
                  ? 'bg-white text-amber-700 shadow-2xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping inline-block" />
              <span>Ongoing ({events.filter((e) => getEventLifecycleStatus(e, now).status === 'ongoing').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('past')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                filterType === 'past'
                  ? 'bg-white text-[#8B181B] shadow-2xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Completed ({events.filter((e) => getEventLifecycleStatus(e, now).status === 'completed').length})</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filterType === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span>All ({events.length})</span>
            </button>
          </div>

          {/* Search and View Mode Switcher */}
          <div className="flex items-center gap-2 flex-1 md:max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search convocations by title, venue, or speaker..."
                className="w-full pl-9 pr-8 py-1.5 bg-stone-50 border border-stone-200/90 rounded-xl text-xs text-stone-800 placeholder-stone-400 focus:bg-white focus:border-[#8B181B] focus:ring-1 focus:ring-[#8B181B] outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Bento Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewMode === 'timeline' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-900'
                }`}
                title="Chronological Agenda Timeline"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Category Filter Chips (Zero-pill, subtle collegiate tone) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mr-1 shrink-0">
            Format:
          </span>
          {[
            { id: 'all', label: 'All Formats' },
            { id: 'reunion', label: 'Reunions' },
            { id: 'workshop', label: 'Workshops' },
            { id: 'networking', label: 'Networking' },
            { id: 'webinar', label: 'Webinars' },
            { id: 'social', label: 'Socials' }
          ].map((cat) => {
            const isSelected = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id as any)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-[#8B181B] text-white shadow-2xs'
                    : 'bg-stone-50 text-stone-600 hover:bg-stone-100 hover:text-stone-900 border border-stone-200/80'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Events Grid or Timeline View */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)]">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-stone-700">No gatherings found</p>
          <p className="text-xs text-stone-500 mt-1">
            {searchQuery
              ? `No gatherings match your search "${searchQuery}".`
              : `There are no ${filterType} gatherings scheduled in this format.`}
          </p>
          {permissions.canCreateEvents && (
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#8B181B] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#721316] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Post a Gathering or Reunion</span>
            </button>
          )}
        </div>
      ) : viewMode === 'timeline' ? (
        /* Timeline Agenda View */
        <div className="space-y-3.5">
          {filteredEvents.map((evt, idx) => {
            const eventDate = new Date(evt.startDate);
            const isLiked = currentUser ? (evt.likes || []).includes(currentUser.uid) : false;

            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(idx * 0.04, 0.3) }}
                whileHover={{ y: -2, transition: { duration: 0.15 } }}
                onClick={() => setSelectedEventForDetail(evt)}
                className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group"
              >
                <div className="flex items-start gap-4 min-w-0">
                  {/* Architectural Date Stamp */}
                  <div className="w-14 h-14 rounded-xl bg-stone-50 border border-stone-200/90 flex flex-col items-center justify-center shrink-0 group-hover:bg-[#8B181B] group-hover:border-[#8B181B] transition-colors">
                    <span className="text-[10px] uppercase font-bold text-[#8B181B] group-hover:text-red-100 transition-colors">
                      {eventDate.toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-xl font-black text-stone-900 group-hover:text-white leading-none transition-colors">
                      {eventDate.getDate()}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-500 mb-1">
                      <span className="font-bold text-[#8B181B] uppercase tracking-wider">
                        {evt.type}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1 text-stone-600">
                        <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-stone-900 group-hover:text-[#8B181B] transition-colors truncate">
                      {evt.title}
                    </h4>

                    <p className="text-xs text-stone-600 line-clamp-1 mt-1">
                      {evt.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                  <div className="text-right hidden md:block">
                    <div className="text-xs font-bold text-stone-900">
                      {evt.attendeesCount} Attending
                    </div>
                    <div className="text-[10px] text-stone-400">
                      {evt.isVirtual ? 'Virtual Stream' : 'Campus Venue'}
                    </div>
                  </div>

                  <EventReminderToggle
                    event={evt}
                    variant="button"
                    size="sm"
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEventForDetail(evt);
                    }}
                    className="px-3.5 py-1.5 bg-stone-50 hover:bg-[#8B181B] hover:text-white text-stone-800 border border-stone-200/90 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>View Dossier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* Bento Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredEvents.map((evt, idx) => {
            const eventDate = new Date(evt.startDate);
            const isLiked = currentUser ? (evt.likes || []).includes(currentUser.uid) : false;

            return (
              <motion.div
                key={evt.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: Math.min(idx * 0.05, 0.4), ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
                className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-md transition-shadow flex flex-col justify-between group"
              >
                <div>
                  {/* Hero Image */}
                  <div className="relative h-44 overflow-hidden bg-stone-100">
                    <img
                      src={getEventImage(evt.heroImageUrl)}
                      alt={evt.title}
                      onError={handleEventImageError}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Flags */}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      {evt.isImportant && (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-[#8B181B] text-white rounded-md shadow-xs">
                          Flagship
                        </span>
                      )}
                      {evt.isVirtual ? (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 text-white rounded-md flex items-center gap-1 shadow-xs">
                          <Video className="w-3 h-3" />
                          Virtual
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] font-bold bg-black/60 backdrop-blur-xs text-white rounded-md">
                          In-Person
                        </span>
                      )}
                    </div>

                    {/* Date Badge */}
                    <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs rounded-xl px-2.5 py-1 text-center shadow-xs border border-stone-200">
                      <span className="text-[10px] uppercase font-bold text-[#8B181B] block">
                        {eventDate.toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-sm font-extrabold text-stone-900 block leading-tight">
                        {eventDate.getDate()}
                      </span>
                    </div>

                    {/* Top Actions: Reminder Toggle & Admin Delete/Edit */}
                    <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                      <EventReminderToggle event={evt} variant="icon" size="sm" />

                      {permissions.canDeleteEventsComments && (
                        <div className="flex items-center gap-1 bg-white/90 backdrop-blur-xs rounded-lg p-1 border border-stone-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(evt);
                            }}
                            className="p-1 hover:text-[#8B181B] text-stone-600 rounded"
                            title="Edit Event"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(evt);
                            }}
                            className="p-1 hover:text-red-600 text-stone-600 rounded cursor-pointer"
                            title="Delete Event"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4">
                    <div className="text-[11px] font-semibold text-[#8B181B] uppercase tracking-wider mb-1">
                      {evt.type}
                    </div>

                    <h3
                      onClick={() => setSelectedEventForDetail(evt)}
                      className="text-base font-bold text-stone-900 hover:text-[#8B181B] cursor-pointer line-clamp-2 leading-snug transition-colors"
                    >
                      {evt.title}
                    </h3>

                    <div className="mt-2 space-y-1 text-xs text-stone-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>
                          {eventDate.toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}{' '}
                          • {eventDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{evt.location}</span>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 mt-2.5 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>
                </div>

                {/* Footer Controls: RSVP, Likes & Comments */}
                <div className="p-4 pt-3 bg-stone-50/60 border-t border-stone-100">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-stone-500">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedEventForDetail(evt);
                        setModalTab('attendees');
                      }}
                      className="flex items-center gap-1.5 hover:text-[#8B181B] transition-colors group text-left cursor-pointer"
                      title="Click to view full attendee roster"
                    >
                      <div className="flex -space-x-1.5 overflow-hidden py-0.5 shrink-0">
                        {(evt.attendees && evt.attendees.length > 0 ? evt.attendees.slice(0, 3) : []).map((att, i) => (
                          <img
                            key={att.uid || i}
                            src={getUserAvatar(att.avatar || att.avatarUrl)}
                            alt=""
                            onError={handleUserAvatarError}
                            className="inline-block h-5 w-5 rounded-full ring-1 ring-white object-cover shadow-2xs"
                          />
                        ))}
                      </div>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-stone-400 group-hover:text-[#8B181B]" />
                        <span className="font-bold text-stone-800 group-hover:text-[#8B181B]">
                          {evt.attendeesCount}
                        </span>
                        <span className="underline decoration-dotted text-[11px] text-stone-500 group-hover:text-[#8B181B]">
                          attendees
                        </span>
                      </span>
                    </button>

                    <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShareItem({
                            title: evt.title,
                            text: `${evt.title} — scheduled for ${new Date(evt.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at ${evt.location}. Join the St. Cecilia's Alumni Network!`,
                            type: evt.type === 'reunion' ? 'reunion' : 'event'
                          });
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-stone-500 hover:text-[#8B181B] hover:bg-stone-100 rounded-lg font-medium transition-colors cursor-pointer"
                        title="Share Event across apps"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Share</span>
                      </button>

                      <InteractiveHeartReaction
                        isHearted={isLiked}
                        heartsCount={(evt.likes || []).length}
                        onToggle={() => toggleLikeEvent(evt.id)}
                        reactorUids={evt.likes || []}
                        allUsers={users}
                        size="sm"
                        variant="button"
                        label={isLiked ? 'Hearted' : 'Heart'}
                      />

                      <button
                        type="button"
                        onClick={() => setSidePanelEventId(evt.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-stone-700 hover:text-[#8B181B] bg-white hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-stone-200/80 shadow-2xs whitespace-nowrap"
                        title="Open comments side-panel"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-[#8B181B]" />
                        <span>Comments ({(evt.comments || []).length})</span>
                      </button>
                    </div>
                  </div>

                  {/* Gathering Attendance & Action Row */}
                  <div className="pt-3 border-t border-stone-200/80 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <Users className="w-3.5 h-3.5 text-[#8B181B]" />
                        <span>
                          <strong className="text-stone-900 font-bold">{evt.attendeesCount || 0}</strong> alumni attending
                        </span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        evt.userRsvp === 'going'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-stone-100 text-stone-600'
                      }`}>
                        {evt.userRsvp === 'going' ? '✓ You’re Going' : 'Open Gathering'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleRsvpClick(evt)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs min-h-[38px] ${
                          evt.userRsvp === 'going'
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-[#8B181B] hover:bg-[#721316] text-white active:scale-98'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{evt.userRsvp === 'going' ? 'I’m Going ✓' : 'RSVP: I’m Going'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedEventForDetail(evt)}
                        className="py-2 px-3 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer min-h-[38px] flex items-center justify-center text-center"
                        title="View Full Gathering Details"
                      >
                        Details
                      </button>
                    </div>

                    {/* Quick Access to Event Group Chat */}
                    {evt.groupChatId && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveChatId(evt.groupChatId!);
                          setActiveTab('messages');
                        }}
                        className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-[#991B1B] border border-rose-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[36px] mt-0.5"
                        title="Open official event group chat"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Open Event Group Chat</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* EVENT DETAIL MODAL */}
      {activeEvent && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEventForDetail(null);
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95">
            {/* Hero Banner inside modal */}
            <div className="relative h-52 bg-stone-900 shrink-0">
              <img
                src={getEventImage(activeEvent.heroImageUrl)}
                alt={activeEvent.title}
                onError={handleEventImageError}
                className="w-full h-full object-cover opacity-80"
              />
              <button
                onClick={() => setSelectedEventForDetail(null)}
                className="absolute top-4 right-4 p-1.5 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={() => handleShareEventWithCapacitor(activeEvent)}
                className="absolute top-4 right-14 px-3 py-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-all cursor-pointer text-xs font-semibold flex items-center gap-1.5 backdrop-blur-xs border border-white/20 active:scale-95 shadow-xs"
                title="Broadcast event details to external apps using Capacitor Share"
              >
                <Share2 className="w-3.5 h-3.5 text-white" />
                <span className="hidden xs:inline">Share</span>
              </button>

              <EventReminderToggle
                event={activeEvent}
                variant="icon"
                size="md"
                className="absolute top-4 right-24 bg-black/60 text-white rounded-full hover:bg-black/80 transition-colors border-0"
              />

              <div className="absolute bottom-4 left-4 right-4 text-white">
                <div className="flex items-center gap-2 mb-1">
                  {activeEvent.isImportant && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-red-600 rounded">
                      Important
                    </span>
                  )}
                  {activeEvent.isVirtual && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-600 rounded">
                      Virtual Event
                    </span>
                  )}
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-white/20 backdrop-blur-xs rounded uppercase">
                    {activeEvent.type}
                  </span>
                </div>
                <h2 className="text-xl font-extrabold leading-tight">
                  {activeEvent.title}
                </h2>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-stone-200 bg-stone-50/80 px-5 pt-2">
              <button
                type="button"
                onClick={() => setModalTab('details')}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  modalTab === 'details'
                    ? 'border-[#991B1B] text-[#991B1B]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Event Overview & Discussions</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('attendees')}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                  modalTab === 'attendees'
                    ? 'border-[#991B1B] text-[#991B1B]'
                    : 'border-transparent text-stone-500 hover:text-stone-800'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Attendees & Guest Roster ({activeEvent.attendeesCount || (activeEvent.attendees ? activeEvent.attendees.length : 0)})</span>
              </button>
            </div>

            {/* Tab 1: Details & Discussions */}
            {modalTab === 'details' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Event Metadata */}
                <div className="grid grid-cols-2 gap-3 p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs">
                  <div>
                    <span className="text-stone-400 block">Date & Time</span>
                    <span className="font-semibold text-stone-800">
                      {new Date(activeEvent.startDate).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short'
                      })}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Location / Platform</span>
                    <span className="font-semibold text-stone-800">
                      {activeEvent.location}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Organized By</span>
                    <span className="font-semibold text-stone-800">
                      {activeEvent.createdByName || 'University Alumni Board'}
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-400 block">Alumni Attending</span>
                    <span className="font-semibold text-emerald-800">
                      {activeEvent.attendeesCount || 0} attending
                    </span>
                  </div>
                </div>

                {/* External App Broadcast Banner */}
                <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-stone-200/80 flex items-center justify-center shrink-0 text-stone-700">
                      <Share2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-stone-900 block truncate">Broadcast to External Apps</span>
                      <p className="text-[11px] text-stone-500 truncate">Share this gathering across Messages, WhatsApp, Mail, and Socials</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleShareEventWithCapacitor(activeEvent)}
                    className="px-3.5 py-1.5 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer active:scale-95 shadow-2xs min-h-[36px]"
                    title="Broadcast event via Capacitor Share"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share</span>
                  </button>
                </div>

                {/* 1-Hour Prior Scheduled Local Reminder Panel */}
                <EventReminderToggle
                  event={activeEvent}
                  variant="detail-panel"
                />

                {/* Attendance & RSVP Status Box */}
                <div className="p-4 sm:p-5 bg-stone-50/95 border border-stone-200/90 rounded-2xl space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="min-w-0">
                      <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                        Gathering Attendance
                      </div>
                      <div className="text-xs font-semibold mt-1 flex items-center gap-1.5 flex-wrap">
                        {activeEvent.userRsvp === 'going' ? (
                          <span className="text-emerald-700 flex items-center gap-1 font-bold whitespace-nowrap">
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>You are attending this gathering</span>
                          </span>
                        ) : (
                          <span className="text-stone-500 font-medium whitespace-nowrap">
                            Let fellow alumni know you plan to attend
                          </span>
                        )}
                        <span className="text-stone-300">•</span>
                        <span className="text-[11px] text-[#8B181B] font-bold whitespace-nowrap">
                          {activeEvent.attendeesCount || 0} alumni attending
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-stone-200/70">
                    <div className="text-xs text-stone-500 leading-relaxed max-w-sm">
                      Coordinate with classmates and batchmates who are attending.
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => handleRsvpClick(activeEvent)}
                        className={`flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer min-h-[44px] shadow-xs ${
                          activeEvent.userRsvp === 'going'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-[#8B181B] text-white hover:bg-[#721316]'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                        <span>
                          {activeEvent.userRsvp === 'going'
                            ? 'I’m Attending (Cancel RSVP)'
                            : 'RSVP: I’m Going'}
                        </span>
                      </button>

                      {activeEvent.groupChatId && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveChatId(activeEvent.groupChatId!);
                            setActiveTab('messages');
                            setSelectedEventForDetail(null);
                          }}
                          className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-rose-50 hover:bg-rose-100 text-[#991B1B] border border-rose-200 flex items-center gap-2 transition-all cursor-pointer min-h-[44px]"
                          title="Open live coordination group chat for this event"
                        >
                          <Users className="w-4 h-4" />
                          <span>Group Chat</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleShareEventWithCapacitor(activeEvent)}
                        className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-200/90 flex items-center gap-2 transition-all cursor-pointer min-h-[44px] shadow-xs active:scale-98"
                        title="Broadcast event details to external apps (WhatsApp, Messages, AirDrop, etc.)"
                      >
                        <Share2 className="w-4 h-4 text-stone-600 stroke-[2.2]" />
                        <span>Share</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-1.5">
                  About this Event
                </h3>
                  <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                    {activeEvent.description}
                  </p>
                </div>

                {/* Comments Section */}
                <div className="pt-4 border-t border-stone-200">
                  <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-3">
                    Alumni Discussions ({(activeEvent.comments || []).length})
                  </h3>

                  <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
                    {(activeEvent.comments || []).length === 0 ? (
                      <p className="text-xs text-stone-400 italic">No comments yet. Start the conversation!</p>
                    ) : (
                      (activeEvent.comments || []).map((comm) => (
                        <div key={comm.id} className="flex items-start gap-2.5 p-2.5 bg-stone-50 rounded-xl">
                          <img
                            src={getUserAvatar(comm.authorAvatar)}
                            alt={comm.authorName}
                            onError={handleUserAvatarError}
                            className="w-7 h-7 rounded-full object-cover border border-stone-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-stone-900">{comm.authorName}</span>
                              <span className="text-[10px] text-stone-400">
                                {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-stone-700 mt-0.5">{comm.text}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comment Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      placeholder="Write a comment or ask a question..."
                      className="flex-1 px-3.5 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handlePostComment(activeEvent.id);
                        }
                      }}
                    />
                    <button
                      onClick={() => handlePostComment(activeEvent.id)}
                      className="px-4 py-2 bg-[#991B1B] hover:bg-[#7f1616] text-white text-xs font-semibold rounded-lg"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Dynamic Attendee List & Guest Roster */}
            {modalTab === 'attendees' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* Gathering Guestlist & Community Header */}
                <div className="p-4 rounded-2xl bg-stone-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
                      <Users className="w-5 h-5 text-amber-300 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold flex items-center gap-2 flex-wrap">
                        <span>Gathering Guestlist & Alumni Network</span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-md text-[10px] font-mono font-bold">
                          {activeEvent.attendeesCount || 0} Alumni Attending
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-400 mt-0.5 leading-relaxed truncate">
                        Connect and coordinate directly with fellow Cecilian alumni attending this gathering.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleShareEventWithCapacitor(activeEvent)}
                      className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title="Broadcast gathering to external apps via Capacitor Share"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share Gathering</span>
                    </button>
                  </div>
                </div>

                {/* RSVP Attendance Prompt Bar */}
                <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-blue-700" />
                      <span>Your RSVP Status:</span>
                      <span className={`font-extrabold ${
                        activeEvent.userRsvp === 'going'
                          ? 'text-emerald-700'
                          : 'text-stone-600'
                      }`}>
                        {activeEvent.userRsvp === 'going'
                          ? 'Confirmed Attending'
                          : 'Not RSVP’d yet'}
                      </span>
                    </div>
                    <p className="text-[11px] text-blue-700 mt-0.5">
                      Mark yourself as attending to let other alumni from your batch and program know you'll be there.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleRsvpClick(activeEvent)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                        activeEvent.userRsvp === 'going'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-[#8B181B] text-white hover:bg-[#721316]'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{activeEvent.userRsvp === 'going' ? 'Attending ✓' : 'RSVP: I am Going'}</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Controls for Attendees */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={attendeeSearchQuery}
                      onChange={(e) => setAttendeeSearchQuery(e.target.value)}
                      placeholder="Search attendees by name, batch, course..."
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#991B1B]"
                    />
                  </div>

                  <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-lg shrink-0">
                    <button
                      type="button"
                      onClick={() => setAttendeeStatusFilter('all')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                        attendeeStatusFilter === 'all'
                          ? 'bg-white text-stone-900 shadow-2xs'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      All ({(activeEvent.attendees || []).length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttendeeStatusFilter('going')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                        attendeeStatusFilter === 'going'
                          ? 'bg-white text-emerald-700 shadow-2xs font-bold'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      Confirmed Attendees ({((activeEvent.attendees || []).filter((a) => a.status === 'going')).length})
                    </button>
                  </div>
                </div>

                {/* Dynamic Attendees List */}
                {filteredAttendees.length === 0 ? (
                  <div className="p-8 text-center bg-stone-50 rounded-xl border border-stone-200/70">
                    <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <h4 className="text-xs font-bold text-stone-700">No attendees found</h4>
                    <p className="text-[11px] text-stone-500 mt-1">
                      {attendeeSearchQuery ? 'Try adjusting your search criteria.' : 'Be the first alumnus to RSVP for this event!'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {filteredAttendees.map((att) => {
                      const isMe = att.uid === currentUser?.uid;
                      const userConnected = isConnected(att.uid);

                      return (
                        <div
                          key={att.uid}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isMe
                              ? 'bg-emerald-50/50 border-emerald-200 ring-1 ring-emerald-300/40'
                              : 'bg-stone-50/60 hover:bg-stone-50 border-stone-200'
                          }`}
                        >
                          <div
                            className="flex items-center gap-3 cursor-pointer min-w-0"
                            onClick={() => setSelectedUserIdForModal(att.uid)}
                          >
                            <img
                              src={getUserAvatar(att.avatarUrl || att.avatar)}
                              alt={att.name}
                              onError={handleUserAvatarError}
                              className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-stone-900 truncate hover:text-blue-600">
                                  {att.name}
                                </span>
                                {isMe && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-200 text-emerald-900">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-stone-500 truncate flex items-center gap-1.5 mt-0.5">
                                {att.batch && <span>Batch {att.batch}</span>}
                                {att.batch && att.course && <span>•</span>}
                                {att.course && <span>{att.course}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                att.status === 'going'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {att.status === 'going' ? (
                                <>
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>RSVP Going</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3 h-3 text-amber-600" />
                                  <span>Interested</span>
                                </>
                              )}
                            </span>

                            {!isMe && (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    getOrCreateChat(att.uid);
                                    setActiveTab('messages');
                                  }}
                                  title="Send direct message"
                                  className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-stone-600 transition-colors"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                                {!userConnected && (
                                  <button
                                    type="button"
                                    onClick={() => sendFriendRequest(att.uid)}
                                    title="Connect"
                                    className="p-1.5 rounded-lg bg-white border border-stone-200 hover:bg-stone-100 text-blue-600 transition-colors"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE / EDIT EVENT MODAL */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreateModal(false);
          }}
        >
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900">
                {editingEventId ? 'Edit Event Details' : 'Create New Alumni Event'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-3.5 mt-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. 2026 Grand Alumni Homecoming & Tech Gala"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Description *</label>
                <textarea
                  required
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide event details, schedule, dress code, speaker lineup..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Event Category</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
                  >
                    <option value="reunion">Reunion</option>
                    <option value="networking">Networking</option>
                    <option value="workshop">Workshop</option>
                    <option value="webinar">Webinar</option>
                    <option value="social">Social Mixer</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Location / Platform *</label>
                  <input
                    type="text"
                    required
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="Venue name or Zoom Link"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">End Date & Time</label>
                  <input
                    type="datetime-local"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1.5">
                  Upload Event Hero Photo / Banner * <span className="text-[11px] font-normal text-stone-500">(Direct database sync)</span>
                </label>

                {/* Drag and Drop Direct Upload Area */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingHeroImage(true);
                  }}
                  onDragLeave={() => setIsDraggingHeroImage(false)}
                  onDrop={handleHeroFileDrop}
                  className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-all ${
                    isDraggingHeroImage
                      ? 'border-[#991B1B] bg-red-50/60 ring-2 ring-red-200'
                      : 'border-stone-300 bg-stone-50/70 hover:bg-stone-100/70'
                  }`}
                >
                  {isCompressingHero ? (
                    <div className="py-6 flex flex-col items-center justify-center gap-2 text-stone-600">
                      <Loader2 className="w-6 h-6 animate-spin text-[#8B181B]" />
                      <span className="text-xs font-semibold">Optimizing hero photo for database...</span>
                    </div>
                  ) : formHeroImage ? (
                    <div className="relative group rounded-lg overflow-hidden border border-stone-200 bg-stone-100 max-h-48">
                      <img
                        src={getEventImage(formHeroImage)}
                        alt="Event Banner Preview"
                        onError={handleEventImageError}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2.5 py-0.5 bg-emerald-900/85 backdrop-blur-xs text-white rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                        <Check className="w-3 h-3 text-emerald-300 stroke-[2.5]" />
                        <span>Ready for Database</span>
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                        <label className="px-3 py-1.5 bg-white text-stone-800 rounded-lg text-xs font-bold hover:bg-stone-100 cursor-pointer shadow-sm flex items-center gap-1.5">
                          <Upload className="w-3.5 h-3.5 text-stone-600" />
                          <span>Replace Photo</span>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            className="hidden"
                            onChange={handleHeroFileInput}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => setFormHeroImage('')}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer flex flex-col items-center justify-center py-4">
                      <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-500 flex items-center justify-center mb-2 shadow-2xs">
                        <Upload className="w-5 h-5 text-stone-600" />
                      </div>
                      <span className="text-xs font-bold text-stone-800">
                        Drag & Drop event hero photo here
                      </span>
                      <span className="text-[11px] text-stone-500 mt-0.5">
                        or click to browse local files (PNG, JPG, WebP) · Uploaded directly to database
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="hidden"
                        onChange={handleHeroFileInput}
                      />
                    </label>
                  )}
                </div>

                {/* Optional Image URL Input */}
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="url"
                    value={formHeroImage}
                    onChange={(e) => setFormHeroImage(e.target.value)}
                    placeholder="Or paste an image web URL: https://..."
                    className="flex-1 px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  {formHeroImage && (
                    <button
                      type="button"
                      onClick={() => setFormHeroImage('')}
                      className="px-2 py-1.5 text-xs text-stone-500 hover:text-red-600 hover:bg-stone-100 rounded-lg cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Default Banner & Campus Preset Options */}
                <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFormHeroImage(DEFAULT_EVENT_IMAGE)}
                    className="px-2.5 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-[#8B181B] border border-amber-200/80 rounded-lg font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                    title="Use official default St. Cecilia campus banner"
                  >
                    <Sparkles className="w-3 h-3 text-amber-600" />
                    <span>Use Default Banner</span>
                  </button>
                  {EVENT_IMAGE_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormHeroImage(p.url)}
                      className={`px-2 py-1 text-[11px] rounded-lg border transition-colors cursor-pointer ${
                        formHeroImage === p.url
                          ? 'bg-red-50 border-[#8B181B] text-[#8B181B] font-bold'
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      {p.name.replace(' (Default)', '')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={formIsVirtual}
                    onChange={(e) => setFormIsVirtual(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Virtual Event</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={formIsImportant}
                    onChange={(e) => setFormIsImportant(e.target.checked)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span>Flag as Important</span>
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-xs"
                >
                  {editingEventId ? 'Save Changes' : 'Publish Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* SIDE-PANEL / HOVERING COMMENT SYSTEM */}
      {sidePanelEvent && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-150">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setSidePanelEventId(null)}
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col z-10 border-l border-stone-200 animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/90">
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-red-50 text-[#8B181B] shrink-0 border border-red-100">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-stone-900 truncate">
                    {sidePanelEvent.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                    <span className="capitalize font-semibold text-[#8B181B]">
                      {sidePanelEvent.type}
                    </span>
                    <span>•</span>
                    <span>{(sidePanelEvent.comments || []).length} Comments</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEventForDetail(sidePanelEvent);
                    setSidePanelEventId(null);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View full event details"
                >
                  Full Details ↗
                </button>
                <button
                  type="button"
                  onClick={() => setSidePanelEventId(null)}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors"
                  title="Close comments drawer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Comments Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(sidePanelEvent.comments || []).length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-800">No Comments Yet</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                    Be the first to share questions, program ideas, or coordinate reunion meetups with fellow alumni!
                  </p>
                </div>
              ) : (
                (sidePanelEvent.comments || []).map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <img
                          src={comm.authorAvatar}
                          alt={comm.authorName}
                          className="w-6 h-6 rounded-full object-cover border border-stone-200"
                        />
                        <span className="text-xs font-bold text-stone-900 truncate">
                          {comm.authorName}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-400 shrink-0">
                        {new Date(comm.createdAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-stone-700 leading-relaxed pl-8 break-words">
                      {comm.text}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Drawer Comment Form */}
            <form
              onSubmit={handleSidePanelCommentSubmit}
              className="p-3.5 border-t border-stone-200 bg-stone-50/70 flex items-center gap-2"
            >
              <input
                type="text"
                value={sidePanelCommentInput}
                onChange={(e) => setSidePanelCommentInput(e.target.value)}
                placeholder="Write a comment, question, or greeting..."
                className="flex-1 px-3.5 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991B1B] focus:border-[#991B1B]"
              />
              <button
                type="submit"
                disabled={!sidePanelCommentInput.trim()}
                className="px-4 py-2 bg-[#991B1B] hover:bg-[#7f1616] disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs shrink-0 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cross-App Share Modal */}
      <ShareModal
        isOpen={!!shareItem}
        onClose={() => setShareItem(null)}
        item={shareItem || { title: '' }}
      />

      {/* Confirmation Dialog for Destructive / Committed Event Actions (Requirement 5 & 13) */}
      <ConfirmationModal
        isOpen={Boolean(eventActionConfirm)}
        onClose={() => setEventActionConfirm(null)}
        onConfirm={() => {
          if (eventActionConfirm) {
            if (eventActionConfirm.type === 'cancel_rsvp') {
              rsvpEvent(eventActionConfirm.eventId, 'going');
            } else if (eventActionConfirm.type === 'delete_event') {
              deleteEvent(eventActionConfirm.eventId);
            }
          }
          setEventActionConfirm(null);
        }}
        title={eventActionConfirm?.type === 'cancel_rsvp' ? 'Cancel Event RSVP' : 'Delete Campus Event'}
        message={
          eventActionConfirm?.type === 'cancel_rsvp'
            ? `Are you sure you want to cancel your RSVP for "${eventActionConfirm.title}"? Your seat reservation will be released for other Cecilian alumni.`
            : `Are you sure you want to permanently delete "${eventActionConfirm?.title}"? All attendance records and event data will be removed.`
        }
        confirmLabel={eventActionConfirm?.type === 'cancel_rsvp' ? 'Cancel RSVP' : 'Delete Event'}
        cancelLabel={eventActionConfirm?.type === 'cancel_rsvp' ? 'Keep RSVP' : 'Cancel'}
        variant={eventActionConfirm?.type === 'cancel_rsvp' ? 'warning' : 'danger'}
      />
    </div>
  );
};
