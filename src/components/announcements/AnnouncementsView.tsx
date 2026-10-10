import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Megaphone,
  AlertCircle,
  AlertTriangle,
  Plus,
  Trash2,
  X,
  Search,
  ArrowUpDown,
  Archive,
  Filter,
  CheckCircle2,
  Share2,
  Pin,
  Paperclip,
  ExternalLink,
  Download,
  Image as ImageIcon,
  Upload,
  Camera,
  Check,
  Loader2
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { Announcement } from '../../types';
import { ShareModal, ShareItem } from '../common/ShareModal';
import { AnnouncementCard } from './AnnouncementCard';
import { compressImage } from '../../lib/utils';

const ARCHIVED_STORAGE_KEY = 'sc_alumni_archived_announcements_v1';

export const AnnouncementsView: React.FC = () => {
  const {
    currentUser,
    announcements,
    createAnnouncement,
    deleteAnnouncement,
    togglePinAnnouncement,
    permissions
  } = useAlumni();

  const [tabFilter, setTabFilter] = useState<'active' | 'important' | 'pinned' | 'archived'>('active');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'important_first'>('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [shareItem, setShareItem] = useState<ShareItem | null>(null);

  // Archived Announcements set persisted locally
  const [archivedIds, setArchivedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(ARCHIVED_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(ARCHIVED_STORAGE_KEY, JSON.stringify(archivedIds));
    } catch {}
  }, [archivedIds]);

  const toggleArchive = (id: string) => {
    setArchivedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'general' | 'academic' | 'career' | 'campus' | 'reunion' | 'emergency'>('general');
  const [isImportant, setIsImportant] = useState(false);
  const [isUrgent, setIsUrgent] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [photoFileName, setPhotoFileName] = useState('');
  const [isDraggingPhoto, setIsDraggingPhoto] = useState(false);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [showDirectUrlInput, setShowDirectUrlInput] = useState(false);
  const photoFileInputRef = useRef<HTMLInputElement>(null);
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');

  const handlePhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setPhotoError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setPhotoError('Selected image is too large (max 20MB).');
      return;
    }
    setPhotoError('');
    setIsProcessingPhoto(true);
    try {
      const compressed = await compressImage(file, 1280, 800, 0.85);
      setImageUrl(compressed);
      setPhotoFileName(file.name);
    } catch (err) {
      console.error('Failed to compress image:', err);
      setPhotoError('Failed to process image. Please try another file.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Filter and Sort Announcements
  const filteredAnnouncements = useMemo(() => {
    return announcements
      .filter((a) => {
        const isArchived = archivedIds.includes(a.id);
        if (tabFilter === 'archived') {
          if (!isArchived) return false;
        } else {
          if (isArchived) return false;
          if (tabFilter === 'important' && !a.important && !a.isImportant && !a.urgent) return false;
          if (tabFilter === 'pinned' && !a.isPinned) return false;
        }

        if (categoryFilter !== 'all' && a.category !== categoryFilter) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = (a.title || '').toLowerCase().includes(q);
          const matchContent = (a.content || '').toLowerCase().includes(q);
          const matchAuthor = (a.authorName || '').toLowerCase().includes(q);
          if (!matchTitle && !matchContent && !matchAuthor) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Urgent and Pinned announcements always rise to the top
        const aUrgent = a.urgent ? 1 : 0;
        const bUrgent = b.urgent ? 1 : 0;
        if (aUrgent !== bUrgent) return bUrgent - aUrgent;

        const aPin = a.isPinned ? 1 : 0;
        const bPin = b.isPinned ? 1 : 0;
        if (aPin !== bPin) return bPin - aPin;

        if (sortOrder === 'important_first') {
          const aImp = a.isImportant || a.important ? 1 : 0;
          const bImp = b.isImportant || b.important ? 1 : 0;
          if (aImp !== bImp) return bImp - aImp;
        }

        const timeA = new Date(a.publishedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.publishedAt || b.createdAt || 0).getTime();
        return sortOrder === 'oldest' ? timeA - timeB : timeB - timeA;
      });
  }, [announcements, tabFilter, categoryFilter, sortOrder, searchQuery, archivedIds]);

  const activeCount = announcements.filter((a) => !archivedIds.includes(a.id)).length;
  const archivedCount = announcements.filter((a) => archivedIds.includes(a.id)).length;
  const importantCount = announcements.filter((a) => !archivedIds.includes(a.id) && (a.important || a.isImportant || a.urgent)).length;
  const pinnedCount = announcements.filter((a) => !archivedIds.includes(a.id) && a.isPinned).length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const attachmentsList = attachmentName.trim() && attachmentUrl.trim()
      ? [{ name: attachmentName.trim(), url: attachmentUrl.trim(), size: 'Document PDF' }]
      : undefined;

    createAnnouncement({
      title: title.trim(),
      content: content.trim(),
      category,
      important: isImportant || isUrgent,
      isImportant: isImportant || isUrgent,
      urgent: isUrgent,
      isPinned,
      imageUrl: imageUrl.trim() || undefined,
      attachments: attachmentsList
    });

    setTitle('');
    setContent('');
    setIsImportant(false);
    setIsUrgent(false);
    setIsPinned(false);
    setImageUrl('');
    setPhotoFileName('');
    setPhotoError('');
    setShowDirectUrlInput(false);
    setAttachmentName('');
    setAttachmentUrl('');
    setShowCreateModal(false);
  };

  // Active urgent announcement for lead advisory callout
  const urgentLeadNotice = useMemo(() => {
    return announcements.find((a) => !archivedIds.includes(a.id) && a.urgent);
  }, [announcements, archivedIds]);

  return (
    <div className="space-y-6 pb-16">
      {/* Institutional Gazette Header */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#8B181B] via-[#991B1B] to-[#B45309]" />

        <div className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
                <span className="text-[#8B181B] font-bold">St. Cecilia's College - Cebu, Inc.</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span>Official Gazette & Bulletins</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="text-stone-400">Minglanilla Campus</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight">
                Campus Advisories & Official Circulars
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl">
                Administrative memoranda, registrar notices, reunion directives, and official institutional announcements published by college administration.
              </p>
            </div>

            {permissions.canPostAnnouncements && (
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-98 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[2.2]" />
                <span>Publish Institutional Directive</span>
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Urgent Advisory Placard (if any exists and not in archived tab) */}
      {urgentLeadNotice && tabFilter !== 'archived' && (
        <div
          onClick={() => setSelectedAnnouncement(urgentLeadNotice)}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-50 via-white to-red-50/40 border border-red-200/90 p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(139,24,27,0.07)] cursor-pointer group hover:border-red-300 transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[11px] font-bold text-red-700 uppercase tracking-wider mb-1">
                  <span>Urgent Institutional Directive</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {new Date(urgentLeadNotice.publishedAt || urgentLeadNotice.createdAt || '').toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-red-700 transition-colors">
                  {urgentLeadNotice.title}
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 mt-1">
                  {urgentLeadNotice.content}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedAnnouncement(urgentLeadNotice);
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors shrink-0 self-end sm:self-center cursor-pointer"
            >
              Read Full Notice
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl shrink-0 overflow-x-auto">
            <button
              type="button"
              onClick={() => setTabFilter('active')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                tabFilter === 'active'
                  ? 'bg-white text-stone-900 shadow-2xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Active ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setTabFilter('pinned')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                tabFilter === 'pinned'
                  ? 'bg-white text-amber-900 shadow-2xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Pin className="w-3.5 h-3.5 text-amber-600 fill-amber-600" />
              <span>Pinned ({pinnedCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setTabFilter('important')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                tabFilter === 'important'
                  ? 'bg-white text-red-700 shadow-2xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              <span>Important ({importantCount})</span>
            </button>
            <button
              type="button"
              onClick={() => setTabFilter('archived')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                tabFilter === 'archived'
                  ? 'bg-white text-stone-900 shadow-2xs font-extrabold'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Archive className="w-3.5 h-3.5 text-stone-500" />
              <span>Archived ({archivedCount})</span>
            </button>
          </div>

          {/* Search, Category, and Sort controls */}
          <div className="flex items-center gap-2 flex-1 md:max-w-xl">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search circulars by keyword, title, or author..."
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

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200/90 rounded-xl text-xs text-stone-700 font-medium cursor-pointer focus:border-[#8B181B] outline-none"
            >
              <option value="all">All Departments</option>
              <option value="general">General</option>
              <option value="academic">Academic Affairs</option>
              <option value="career">Career & Industry</option>
              <option value="campus">Campus Life</option>
              <option value="reunion">Homecoming & Reunions</option>
              <option value="emergency">Emergency Bulletins</option>
            </select>

            {/* Sort Order */}
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200/90 rounded-xl text-xs text-stone-700 font-medium cursor-pointer focus:border-[#8B181B] outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="important_first">Important First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Announcements List */}
      {filteredAnnouncements.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
          <Megaphone className="w-8 h-8 text-stone-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-stone-800">No Announcements Found</p>
          <p className="text-xs text-stone-500 mt-1">
            {searchQuery
              ? `No announcements matching "${searchQuery}".`
              : tabFilter === 'archived'
              ? 'No archived announcements.'
              : tabFilter === 'pinned'
              ? 'No pinned announcements yet.'
              : 'There are currently no announcements in this category.'}
          </p>
          {permissions.canPostAnnouncements && (
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#8B181B] text-white text-xs font-bold rounded-xl shadow-sm hover:bg-[#721316] transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Publish First Notice</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAnnouncements.map((ann, idx) => (
            <AnnouncementCard
              key={ann.id}
              announcement={ann}
              isArchived={archivedIds.includes(ann.id)}
              canManage={permissions.canDeleteAnnouncements}
              onSelect={(selected) => setSelectedAnnouncement(selected)}
              onDelete={(id) => deleteAnnouncement(id)}
              onToggleArchive={(id) => toggleArchive(id)}
              onTogglePin={(id) => togglePinAnnouncement(id)}
            />
          ))}
        </div>
      )}

      {/* DETAIL MODAL WITH RICH CONTENT & ATTACHMENTS */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2 flex-wrap">
                {selectedAnnouncement.isPinned && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 rounded-md flex items-center gap-1">
                    <Pin className="w-3 h-3 fill-amber-700 text-amber-700" />
                    Pinned
                  </span>
                )}
                {selectedAnnouncement.urgent ? (
                  <span className="px-2.5 py-0.5 text-[10px] font-bold bg-red-700 text-white rounded-md flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    Urgent Advisory
                  </span>
                ) : (selectedAnnouncement.isImportant || selectedAnnouncement.important) ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-red-600 text-white rounded-md flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Important Notice
                  </span>
                ) : null}
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-stone-100 text-stone-700 rounded-md uppercase tracking-wider">
                  {selectedAnnouncement.category || 'General'}
                </span>
                {archivedIds.includes(selectedAnnouncement.id) && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-stone-200 text-stone-700 rounded-md">
                    Archived
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedAnnouncement(null)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer p-1 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4">
              {/* Optional Hero Image */}
              {selectedAnnouncement.imageUrl && (
                <div className="mb-4 rounded-xl overflow-hidden max-h-72 border border-stone-200">
                  <img
                    src={selectedAnnouncement.imageUrl}
                    alt={selectedAnnouncement.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
                {selectedAnnouncement.title}
              </h2>

              <div className="mt-2.5 flex items-center gap-2 text-xs text-stone-500 pb-4 border-b border-stone-100 flex-wrap">
                <span className="font-bold text-stone-800">{selectedAnnouncement.authorName || 'Office of Communications'}</span>
                <span>({(selectedAnnouncement.authorRole || 'ADMIN').toUpperCase()})</span>
                <span>•</span>
                <span>
                  {new Date(selectedAnnouncement.publishedAt || selectedAnnouncement.createdAt || new Date()).toLocaleDateString([], {
                    dateStyle: 'full'
                  })}
                </span>
              </div>

              <div className="mt-5 text-sm text-stone-700 leading-relaxed space-y-4 whitespace-pre-line">
                {selectedAnnouncement.content}
              </div>

              {/* Attachments Section */}
              {selectedAnnouncement.attachments && selectedAnnouncement.attachments.length > 0 && (
                <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-stone-200">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-stone-500" />
                    <span>Official Attachments ({selectedAnnouncement.attachments.length})</span>
                  </h4>
                  <div className="space-y-2">
                    {selectedAnnouncement.attachments.map((att, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-white rounded-lg border border-stone-200 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                          <span className="font-semibold text-stone-800 truncate">{att.name}</span>
                          {att.size && <span className="text-[10px] text-stone-400">({att.size})</span>}
                        </div>
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium rounded-md transition-colors shrink-0 ml-2"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Footer Controls */}
              <div className="mt-8 pt-4 border-t border-stone-100 flex items-center justify-between gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() =>
                    setShareItem({
                      title: selectedAnnouncement.title,
                      text: `${selectedAnnouncement.title} — Official Announcement from St. Cecilia's College: ${selectedAnnouncement.content.slice(0, 180)}...`,
                      type: 'announcement'
                    })
                  }
                  className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-2xs transition-colors cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Notice</span>
                </button>

                <div className="flex items-center gap-2">
                  {permissions.canDeleteAnnouncements && (
                    <>
                      <button
                        onClick={() => togglePinAnnouncement(selectedAnnouncement.id)}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer ${
                          selectedAnnouncement.isPinned
                            ? 'bg-amber-100 hover:bg-amber-200 text-amber-900'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                        }`}
                      >
                        <Pin className="w-3.5 h-3.5" />
                        <span>{selectedAnnouncement.isPinned ? 'Unpin' : 'Pin to Top'}</span>
                      </button>
                      <button
                        onClick={() => toggleArchive(selectedAnnouncement.id)}
                        className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-xl cursor-pointer"
                      >
                        {archivedIds.includes(selectedAnnouncement.id) ? 'Unarchive' : 'Archive'}
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelectedAnnouncement(null)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-lg p-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                <Megaphone className="w-4 h-4 text-[#8B181B]" />
                <span>Post Institutional Announcement</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-600 cursor-pointer p-1 rounded-lg hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 2026 Distinguished Alumni Awards Nomination"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-[#8B181B]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
                  >
                    <option value="general">General</option>
                    <option value="academic">Academic</option>
                    <option value="career">Career</option>
                    <option value="campus">Campus</option>
                    <option value="reunion">Reunion</option>
                    <option value="emergency">Emergency Advisory</option>
                  </select>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                    <input
                      type="checkbox"
                      checked={isImportant}
                      onChange={(e) => setIsImportant(e.target.checked)}
                      className="rounded text-red-600 focus:ring-red-500"
                    />
                    <span className="text-red-700 font-semibold">Important Notice</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                    <input
                      type="checkbox"
                      checked={isPinned}
                      onChange={(e) => setIsPinned(e.target.checked)}
                      className="rounded text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-amber-800 font-semibold">Pin / Feature at Top</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium text-stone-700">
                    <input
                      type="checkbox"
                      checked={isUrgent}
                      onChange={(e) => setIsUrgent(e.target.checked)}
                      className="rounded text-red-700 focus:ring-red-600"
                    />
                    <span className="text-red-900 font-bold">Urgent Alert</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Content *</label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write the announcement details, dates, and instructions..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-[#8B181B]"
                />
              </div>

              {/* Hero Photo / Cover Image Upload (Uploaded to Database) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-[#8B181B]" />
                    <span>Upload Hero Photo / Image</span>
                    <span className="text-[11px] font-normal text-stone-500">(Saves to database)</span>
                  </label>
                  {!showDirectUrlInput ? (
                    <button
                      type="button"
                      onClick={() => setShowDirectUrlInput(true)}
                      className="text-[11px] text-stone-500 hover:text-[#8B181B] underline cursor-pointer"
                    >
                      Paste image link instead
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDirectUrlInput(false)}
                      className="text-[11px] text-stone-500 hover:text-[#8B181B] underline cursor-pointer"
                    >
                      Use photo file uploader
                    </button>
                  )}
                </div>

                {photoError && (
                  <div className="p-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                    <span>{photoError}</span>
                  </div>
                )}

                {imageUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-2xs">
                    <img
                      src={imageUrl}
                      alt="Uploaded hero preview"
                      className="w-full h-44 object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2.5 py-1 bg-emerald-900/85 backdrop-blur-xs text-white rounded-md text-[11px] font-semibold flex items-center gap-1.5 shadow-sm">
                      <Check className="w-3.5 h-3.5 text-emerald-300 stroke-[2.5]" />
                      <span>Photo Attached & Synced</span>
                    </div>
                    {photoFileName && (
                      <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1 bg-black/60 backdrop-blur-xs text-white rounded-md text-[10px] truncate">
                        {photoFileName}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => photoFileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-white/95 hover:bg-white text-stone-800 rounded-md text-xs font-semibold shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Upload className="w-3 h-3 text-[#8B181B]" />
                        <span>Replace</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageUrl('');
                          setPhotoFileName('');
                          if (photoFileInputRef.current) photoFileInputRef.current.value = '';
                        }}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs font-semibold shadow-sm flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingPhoto(true);
                    }}
                    onDragLeave={() => setIsDraggingPhoto(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingPhoto(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handlePhotoUpload(file);
                    }}
                    onClick={() => photoFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                      isDraggingPhoto
                        ? 'border-[#8B181B] bg-red-50/70 ring-2 ring-red-200'
                        : 'border-stone-300 bg-stone-50 hover:bg-stone-100/80 hover:border-stone-400'
                    }`}
                  >
                    <input
                      ref={photoFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file);
                      }}
                    />

                    {isProcessingPhoto ? (
                      <div className="py-3 flex flex-col items-center justify-center gap-2 text-stone-600">
                        <Loader2 className="w-6 h-6 animate-spin text-[#8B181B]" />
                        <span className="text-xs font-medium">Optimizing photo for database storage...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-2">
                        <div className="w-11 h-11 rounded-full bg-red-50 text-[#8B181B] border border-red-100 flex items-center justify-center mb-2.5 shadow-2xs">
                          <Upload className="w-5 h-5 stroke-[1.75]" />
                        </div>
                        <span className="text-xs font-bold text-stone-800">
                          Click to upload photo or drag & drop here
                        </span>
                        <span className="text-[11px] text-stone-500 mt-1 max-w-sm">
                          PNG, JPG, or WebP. The photo will be automatically compressed and uploaded directly to the database.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {showDirectUrlInput && (
                  <div className="pt-2 animate-in fade-in duration-150">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setPhotoFileName('');
                      }}
                      placeholder="Or enter direct image URL: https://..."
                      className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-[#8B181B] outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Optional Attachment */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
                <span className="font-bold text-stone-700 block text-[11px] uppercase tracking-wider">
                  Attachment / Document (Optional)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={attachmentName}
                    onChange={(e) => setAttachmentName(e.target.value)}
                    placeholder="Document Name (e.g. Schedule.pdf)"
                    className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                  />
                  <input
                    type="url"
                    value={attachmentUrl}
                    onChange={(e) => setAttachmentUrl(e.target.value)}
                    placeholder="URL (https://...)"
                    className="px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-stone-100 text-stone-700 rounded-lg font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-lg font-bold shadow-xs cursor-pointer transition-colors"
                >
                  Publish Notice
                </button>
              </div>
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
    </div>
  );
};
