/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  Megaphone,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  Clock,
  User,
  X,
  Sparkles,
  Check,
  LayoutGrid,
  List,
  AlertTriangle,
  Radio,
  Building2,
  Bell,
  Upload,
  Camera,
  Loader2,
  Image as ImageIcon,
  Download,
  RefreshCw,
  Eye,
  Activity,
  ShieldCheck,
  Pin,
  ExternalLink,
  Layers,
  ChevronRight,
  ArrowRight,
  FileCheck2,
  Users,
  Share2,
  Bookmark,
  Calendar,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { Announcement } from '../../types';
import { compressImage } from '../../lib/utils';

/**
 * Custom Executive Campus Gazette & Dispatch Command
 * Distinct Panoramic Billboard & Editorial Newsroom Architecture
 */
export const AdminAnnouncementsManager: React.FC = () => {
  const {
    announcements,
    createAnnouncement,
    deleteAnnouncement,
    permissions,
    currentUser,
    showToast,
    addAuditLog
  } = useAlumni();

  // State
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'important'>('all');
  const [viewLayout, setViewLayout] = useState<'magazine' | 'table'>('magazine');

  // Modals & Inspection
  const [showAuthoringStudio, setShowAuthoringStudio] = useState(false);
  const [inspectingDispatch, setInspectingDispatch] = useState<Announcement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Authoring Form State
  const [headline, setHeadline] = useState('');
  const [category, setCategory] = useState('Institutional Directive');
  const [bodyText, setBodyText] = useState('');
  const [authorName, setAuthorName] = useState(currentUser?.name || 'Office of Communications');
  const [isUrgent, setIsUrgent] = useState(false);
  const [isImportant, setIsImportant] = useState(false);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Metrics derived from data
  const totalCount = announcements.length;
  const urgentCount = announcements.filter((a) => a.urgent).length;
  const importantCount = announcements.filter((a) => a.important).length;

  // Channels with dynamic counts
  const channels = useMemo(() => {
    const list = [
      { id: 'all', label: 'All Dispatches' },
      { id: 'directive', label: 'Directives', match: ['directive', 'institutional', 'administration'] },
      { id: 'academic', label: 'Academic', match: ['academic', 'curriculum', 'registrar'] },
      { id: 'alumni', label: 'Alumni Affairs', match: ['alumni', 'reunion', 'chapter', 'general'] },
      { id: 'career', label: 'Career & Placement', match: ['career', 'job', 'internship'] }
    ];

    return list.map((ch) => {
      if (ch.id === 'all') return { ...ch, count: totalCount };
      const count = announcements.filter((a) => {
        const text = `${a.category || ''} ${a.title || ''}`.toLowerCase();
        return ch.match.some((m) => text.includes(m));
      }).length;
      return { ...ch, count };
    });
  }, [announcements, totalCount]);

  // Featured Spotlight Dispatch (Latest Urgent or most recent)
  const spotlightDispatch = useMemo(() => {
    if (announcements.length === 0) return null;
    const urgent = announcements.find((a) => a.urgent);
    if (urgent) return urgent;
    const important = announcements.find((a) => a.important);
    if (important) return important;
    return announcements[0];
  }, [announcements]);

  // Filtered List
  const filteredDispatches = useMemo(() => {
    let list = [...announcements];

    // Channel filter
    if (selectedChannel !== 'all') {
      const activeCh = channels.find((c) => c.id === selectedChannel);
      if (activeCh && activeCh.match) {
        list = list.filter((a) => {
          const text = `${a.category || ''} ${a.title || ''}`.toLowerCase();
          return activeCh.match.some((m) => text.includes(m));
        });
      }
    }

    // Priority filter
    if (priorityFilter === 'urgent') {
      list = list.filter((a) => a.urgent);
    } else if (priorityFilter === 'important') {
      list = list.filter((a) => a.important || a.urgent);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.title?.toLowerCase().includes(q) ||
          a.content?.toLowerCase().includes(q) ||
          a.category?.toLowerCase().includes(q) ||
          (a.authorName || a.createdBy || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [announcements, selectedChannel, priorityFilter, searchQuery, channels]);

  // Photo Upload Handler with Client Compression
  const handleCoverPhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).', 'error');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const compressed = await compressImage(file, 1200, 0.85);
      setCoverPhotoUrl(compressed);
      showToast('Cover photo compressed and attached.', 'success');
    } catch {
      showToast('Failed to process image. Using original.', 'error');
      const reader = new FileReader();
      reader.onload = (event) => {
        setCoverPhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Submit Handler
  const handlePublishDispatch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!headline.trim() || !bodyText.trim()) {
        showToast('Please provide both headline and dispatch content.', 'error');
        return;
      }

      createAnnouncement({
        title: headline.trim(),
        category: category.trim(),
        content: bodyText.trim(),
        urgent: isUrgent,
        important: isImportant,
        imageUrl: coverPhotoUrl || undefined
      });

      addAuditLog({
        action: 'PUBLISH_INSTITUTIONAL_ANNOUNCEMENT',
        actorId: currentUser?.uid || 'communications_office',
        actorName: currentUser?.name || 'Communications Officer',
        actorRole: currentUser?.role || 'admin',
        category: 'communication',
        details: `Published official dispatch: "${headline.trim()}" (${category})`,
        severity: 'info'
      });

      showToast('Institutional dispatch published to live campus portal.', 'success');
      setShowAuthoringStudio(false);

      // Reset
      setHeadline('');
      setBodyText('');
      setIsUrgent(false);
      setIsImportant(false);
      setCoverPhotoUrl(null);
    },
    [
      headline,
      category,
      bodyText,
      isUrgent,
      isImportant,
      coverPhotoUrl,
      currentUser,
      createAnnouncement,
      addAuditLog,
      showToast
    ]
  );

  // Delete Handler
  const handleConfirmDelete = useCallback(() => {
    if (!deletingId) return;
    deleteAnnouncement(deletingId);

    addAuditLog({
      action: 'DELETE_INSTITUTIONAL_ANNOUNCEMENT',
      actorId: currentUser?.uid || 'communications_office',
      actorName: currentUser?.name || 'Communications Officer',
      actorRole: currentUser?.role || 'admin',
      category: 'communication',
      details: `Removed campus dispatch with ID: ${deletingId}`,
      severity: 'warning'
    });

    showToast('Dispatch archived and removed from bulletin.', 'info');
    setDeletingId(null);
  }, [deletingId, deleteAnnouncement, addAuditLog, currentUser, showToast]);

  // Export CSV
  const handleExportCsv = useCallback(() => {
    const headers = ['ID', 'Headline', 'Channel / Category', 'Priority', 'Author', 'Date Published', 'Content'];
    const rows = announcements.map((a) => [
      `"${a.id}"`,
      `"${(a.title || '').replace(/"/g, '""')}"`,
      `"${(a.category || '').replace(/"/g, '""')}"`,
      `"${a.urgent ? 'URGENT' : a.important ? 'IMPORTANT' : 'STANDARD'}"`,
      `"${(a.authorName || a.createdBy || '').replace(/"/g, '""')}"`,
      `"${a.publishedAt || a.createdAt || ''}"`,
      `"${(a.content || '').replace(/"/g, '""')}"`
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SCC_Campus_Dispatches_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Official gazette ledger exported to CSV.', 'success');
  }, [announcements, showToast]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. TOP INSTITUTIONAL MASTHEAD BANNER */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8B181B] tracking-wide uppercase">
              <Megaphone className="w-4 h-4 stroke-[2]" />
              <span>Office of Communications · St. Cecilia's College Gazette</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Campus Dispatches & Institutional Circulars
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span>Total Dispatches: <strong className="text-stone-900 font-semibold">{totalCount}</strong></span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span>Urgent Alerts: <strong className={urgentCount > 0 ? 'text-rose-600 font-semibold' : 'text-stone-700'}>{urgentCount}</strong></span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span>Important Bulletins: <strong className="text-stone-900 font-semibold">{importantCount}</strong></span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span>Channel Dispatch: <strong className="text-emerald-700 font-semibold">Active & Synced</strong></span>
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
              onClick={() => {
                setIsUrgent(true);
                setCategory('Emergency Advisory');
                setShowAuthoringStudio(true);
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Quick Emergency Alert</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsUrgent(false);
                setIsImportant(false);
                setShowAuthoringStudio(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#8B181B] hover:bg-[#721316] shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Draft New Dispatch</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. PANORAMIC BROADCAST BILLBOARD (ASYMMETRIC NEWSROOM MONITOR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT ZONE (7 cols): FEATURED BROADCAST SPOTLIGHT */}
        <div className="lg:col-span-7 bg-white border border-stone-200/80 rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-900">
                <Radio className="w-4 h-4 text-[#8B181B] animate-pulse" />
                <span>Featured Campus Broadcast</span>
              </div>
              {spotlightDispatch?.urgent ? (
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                  Priority Advisory
                </span>
              ) : (
                <span className="text-xs font-medium text-stone-500">Live on Student & Alumni Portal</span>
              )}
            </div>

            {spotlightDispatch ? (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-stone-500">
                  <span className="font-semibold text-[#8B181B]">{spotlightDispatch.category || 'Announcement'}</span>
                  <span className="text-stone-300">·</span>
                  <span>{(spotlightDispatch.publishedAt || spotlightDispatch.createdAt) ? new Date(spotlightDispatch.publishedAt || spotlightDispatch.createdAt || '').toLocaleDateString() : 'Recent'}</span>
                  <span className="text-stone-300">·</span>
                  <span>By {spotlightDispatch.authorName || spotlightDispatch.createdBy || 'Office of Communications'}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-stone-900 leading-snug">
                  {spotlightDispatch.title}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 line-clamp-3 leading-relaxed">
                  {spotlightDispatch.content}
                </p>
              </div>
            ) : (
              <div className="py-6 text-center text-stone-400 text-xs">
                No active announcements published yet. Click "Draft New Dispatch" above.
              </div>
            )}
          </div>

          {spotlightDispatch && (
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
              <span className="text-stone-400">Broadcast ID: #{spotlightDispatch.id}</span>
              <button
                type="button"
                onClick={() => setInspectingDispatch(spotlightDispatch)}
                className="inline-flex items-center gap-1.5 font-semibold text-[#8B181B] hover:text-[#721316] cursor-pointer"
              >
                <span>Read Full Dispatch</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT ZONE (5 cols): CHANNEL REACH RADAR */}
        <div className="lg:col-span-5 bg-stone-900 text-white rounded-2xl p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
                <Activity className="w-4 h-4" />
                <span>Audience Reach Radar</span>
              </div>
              <span className="text-xs text-stone-400">Portal & Mobile Channels</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between text-stone-300 mb-1">
                  <span>Presidential & Administrative Directives</span>
                  <span className="font-semibold text-white">100% Reach</span>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#8B181B] h-full rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-stone-300 mb-1">
                  <span>Academic Calendar & Registrar Circulars</span>
                  <span className="font-semibold text-white">Active Feed</span>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '85%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-stone-300 mb-1">
                  <span>Alumni Chapters & Career Advisories</span>
                  <span className="font-semibold text-white">Verified Cohorts</span>
                </div>
                <div className="w-full bg-stone-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '92%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between text-xs text-stone-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>Gateway: Operational</span>
            </span>
            <span>All Channels Synced</span>
          </div>
        </div>
      </div>

      {/* 3. NEWSROOM EDITORIAL COMMAND DECK */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs space-y-5">
        {/* Integrated Channel & Search Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-4 border-b border-stone-100">
          {/* Channel Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {channels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedChannel(ch.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  selectedChannel === ch.id
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>{ch.label}</span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-md ${
                  selectedChannel === ch.id ? 'bg-stone-800 text-stone-300' : 'bg-stone-100 text-stone-600'
                }`}>
                  {ch.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search & Layout Toggle Controls */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search dispatches..."
                className="pl-9 pr-7 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              aria-label="Filter priority"
              className="px-2.5 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 focus:outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent Only</option>
              <option value="important">Important</option>
            </select>

            <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => setViewLayout('magazine')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewLayout === 'magazine' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Magazine Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('table')}
                className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                  viewLayout === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
                title="Gazette Ledger"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ================= VIEW 1: MAGAZINE EDITORIAL CARDS GRID ================= */}
        {viewLayout === 'magazine' ? (
          filteredDispatches.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Megaphone className="w-8 h-8 text-stone-400 mx-auto" />
              <p className="text-sm font-semibold text-stone-800">No dispatches match the selected filter</p>
              <p className="text-xs text-stone-500">Try changing your channel selection or search terms.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredDispatches.map((dispatch) => {
                const isUrgentItem = dispatch.urgent;
                const isImportantItem = dispatch.important;

                return (
                  <div
                    key={dispatch.id}
                    className={`bg-white border rounded-2xl overflow-hidden shadow-2xs transition-all hover:shadow-md flex flex-col justify-between ${
                      isUrgentItem
                        ? 'border-rose-200 ring-1 ring-rose-200'
                        : isImportantItem
                        ? 'border-amber-200'
                        : 'border-stone-200/80 hover:border-stone-300'
                    }`}
                  >
                    {/* Optional Cover Photo Thumbnail */}
                    {dispatch.imageUrl ? (
                      <div className="w-full h-40 bg-stone-100 overflow-hidden relative">
                        <img
                          src={dispatch.imageUrl}
                          alt={dispatch.title}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                        />
                        {isUrgentItem && (
                          <div className="absolute top-2.5 right-2.5 bg-rose-700 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
                            URGENT
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-2 bg-[#8B181B]" />
                    )}

                    {/* Card Body */}
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {/* Unboxed Zero-Pill Metadata */}
                        <div className="flex items-center gap-2 text-[11px] text-stone-500">
                          <span className="font-semibold text-[#8B181B]">{dispatch.category || 'General'}</span>
                          <span className="text-stone-300">·</span>
                          <span>{(dispatch.publishedAt || dispatch.createdAt) ? new Date(dispatch.publishedAt || dispatch.createdAt || '').toLocaleDateString() : 'Recent'}</span>
                          {isUrgentItem && (
                            <>
                              <span className="text-stone-300">·</span>
                              <span className="font-bold text-rose-700">Urgent</span>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-stone-900 tracking-tight leading-snug line-clamp-2">
                          {dispatch.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                          {dispatch.content}
                        </p>
                      </div>

                      {/* Author & Footer */}
                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                        <div className="text-stone-500 truncate mr-2">
                          By <strong className="text-stone-700 font-medium">{dispatch.authorName || dispatch.createdBy || 'Office of Communications'}</strong>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setInspectingDispatch(dispatch)}
                            className="p-1.5 rounded-lg text-stone-600 hover:bg-stone-100 cursor-pointer"
                            title="Read Full Dispatch"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingId(dispatch.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                            title="Delete Dispatch"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* ================= VIEW 2: CHRONOLOGICAL GAZETTE ARCHIVE TABLE ================= */
          <div className="border border-stone-200/80 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="bg-stone-50 text-stone-700 font-semibold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-3">Channel</th>
                    <th className="py-3 px-4">Headline & Excerpt</th>
                    <th className="py-3 px-3">Priority</th>
                    <th className="py-3 px-3">Author</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredDispatches.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-stone-400">
                        No dispatches found.
                      </td>
                    </tr>
                  ) : (
                    filteredDispatches.map((dispatch) => (
                      <tr key={dispatch.id} className="hover:bg-stone-50/70 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-stone-500 font-mono text-[11px]">
                          {(dispatch.publishedAt || dispatch.createdAt) ? new Date(dispatch.publishedAt || dispatch.createdAt || '').toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3 px-3 font-semibold text-[#8B181B]">
                          {dispatch.category || 'General'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">{dispatch.title}</div>
                          <div className="text-[11px] text-stone-500 line-clamp-1">{dispatch.content}</div>
                        </td>
                        <td className="py-3 px-3">
                          {dispatch.urgent ? (
                            <span className="text-rose-700 font-bold">Urgent</span>
                          ) : dispatch.important ? (
                            <span className="text-amber-700 font-medium">Important</span>
                          ) : (
                            <span className="text-stone-400">Standard</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-stone-700">{dispatch.authorName || dispatch.createdBy || 'Admin'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setInspectingDispatch(dispatch)}
                              className="p-1 rounded text-stone-500 hover:text-stone-900 cursor-pointer"
                              title="Inspect"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingId(dispatch.id)}
                              className="p-1 rounded text-rose-600 hover:text-rose-800 cursor-pointer"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
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

      {/* ================= MODAL: DRAFT NEW DISPATCH STUDIO ================= */}
      {showAuthoringStudio && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Institutional Dispatch Studio</h2>
                <p className="text-xs text-stone-500">Publish an official circular or advisory to the college network.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAuthoringStudio(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePublishDispatch} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Headline / Dispatch Title *</label>
                <input
                  type="text"
                  required
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. 2026 Grand Alumni Homecoming Registration Guidelines"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Channel / Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                  >
                    <option value="Institutional Directive">Institutional Directive</option>
                    <option value="Academic Advisory">Academic Advisory</option>
                    <option value="Alumni Homecoming">Alumni Homecoming</option>
                    <option value="Career & Placement">Career & Placement</option>
                    <option value="Emergency Advisory">Emergency Advisory</option>
                    <option value="General Campus News">General Campus News</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Author / Signatory</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="e.g. Office of Communications"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                  />
                </div>
              </div>

              {/* Priority Toggles */}
              <div className="flex items-center gap-4 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                    className="w-4 h-4 text-rose-600 rounded border-stone-300 focus:ring-rose-500"
                  />
                  <span className="font-semibold text-stone-800">Urgent Emergency Notice</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isImportant}
                    onChange={(e) => setIsImportant(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500"
                  />
                  <span className="font-medium text-stone-700">Important Bulletin</span>
                </label>
              </div>

              {/* Cover Photo Upload */}
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Cover Photo (Optional)</label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleCoverPhotoSelect}
                  className="hidden"
                />
                {coverPhotoUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-stone-200 h-36 bg-stone-100">
                    <img src={coverPhotoUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setCoverPhotoUrl(null)}
                      className="absolute top-2 right-2 p-1 bg-stone-900/70 text-white rounded-lg hover:bg-stone-900"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    className="w-full py-4 border-2 border-dashed border-stone-200 hover:border-stone-300 rounded-xl flex flex-col items-center justify-center gap-1.5 text-stone-500 cursor-pointer transition-colors"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[#8B181B]" />
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-stone-400" />
                        <span className="font-medium">Upload Cover Image (Client-compressed)</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Content Body */}
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Dispatch Content *</label>
                <textarea
                  rows={6}
                  required
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder="Enter the official announcement body text..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAuthoringStudio(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-[#8B181B] hover:bg-[#721316] font-semibold shadow-sm cursor-pointer"
                >
                  Broadcast Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: READ DISPATCH DETAILS ================= */}
      {inspectingDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                  <span className="font-semibold text-[#8B181B]">{inspectingDispatch.category}</span>
                  <span className="text-stone-300">·</span>
                  <span>{(inspectingDispatch.publishedAt || inspectingDispatch.createdAt) ? new Date(inspectingDispatch.publishedAt || inspectingDispatch.createdAt || '').toLocaleDateString() : 'N/A'}</span>
                </div>
                <h2 className="text-lg font-bold text-stone-900 mt-1">{inspectingDispatch.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setInspectingDispatch(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inspectingDispatch.imageUrl && (
              <div className="rounded-xl overflow-hidden h-48 bg-stone-100">
                <img
                  src={inspectingDispatch.imageUrl}
                  alt={inspectingDispatch.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="text-xs text-stone-700 leading-relaxed whitespace-pre-wrap">
              {inspectingDispatch.content}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
              <span>Published by: {inspectingDispatch.authorName || inspectingDispatch.createdBy || 'Office of Communications'}</span>
              <button
                type="button"
                onClick={() => setInspectingDispatch(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-semibold cursor-pointer"
              >
                Close Dispatch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DELETE CONFIRMATION ================= */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Archive Dispatch?</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to remove this announcement from the campus bulletin? This will be permanently recorded in the institutional audit log.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 text-xs">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-white bg-rose-700 hover:bg-rose-800 font-semibold cursor-pointer"
              >
                Delete Dispatch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
