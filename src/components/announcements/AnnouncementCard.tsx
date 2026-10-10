import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Trash2,
  Archive,
  ArchiveRestore,
  Pin,
  Paperclip,
  Image as ImageIcon
} from 'lucide-react';
import { Announcement } from '../../types';
import { ShareButton } from '../common/ShareButton';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { useAlumni } from '../../context/AlumniContext';
import { InteractiveHeartReaction } from '../common/InteractiveHeartReaction';

interface AnnouncementCardProps {
  announcement: Announcement;
  isArchived?: boolean;
  canManage?: boolean;
  onSelect: (announcement: Announcement) => void;
  onDelete?: (announcementId: string) => void;
  onToggleArchive?: (announcementId: string) => void;
  onTogglePin?: (announcementId: string) => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  isArchived,
  canManage,
  onSelect,
  onDelete,
  onToggleArchive,
  onTogglePin
}) => {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://alumni.stcecilia.edu';
  const shareUrl = `${origin}?tab=announcements&id=${announcement.id}`;
  const shareText = `${announcement.title} — Official Institutional Announcement from St. Cecilia's College: ${announcement.content.slice(
    0,
    160
  )}...`;

  const isUrgent = Boolean(announcement.urgent);
  const isImportant = Boolean(announcement.isImportant || announcement.important);
  const isPinned = Boolean(announcement.isPinned);
  const dateStr = announcement.publishedAt || announcement.createdAt || new Date().toISOString();

  const { currentUser, users, toggleHeartAnnouncement } = useAlumni();
  const isHearted = Boolean(currentUser && (announcement.hearts || []).includes(currentUser.uid));
  const heartsCount = (announcement.hearts || []).length || announcement.likes || 0;

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  return (
    <div
      onClick={() => onSelect(announcement)}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-200 cursor-pointer group flex flex-col justify-between hover:-translate-y-0.5 ${
        isArchived
          ? 'bg-stone-50/90 border-stone-200 opacity-80'
          : isUrgent
          ? 'bg-gradient-to-br from-red-50/50 to-white border-red-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(139,24,27,0.06)] ring-1 ring-red-500/20'
          : isPinned
          ? 'bg-gradient-to-br from-amber-50/40 to-white border-amber-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(180,83,9,0.05)]'
          : 'bg-white border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-md'
      }`}
    >
      {/* Top accent line */}
      <div
        className={`h-1 w-full ${
          isUrgent
            ? 'bg-red-600'
            : isPinned
            ? 'bg-amber-600'
            : 'bg-stone-200/80 group-hover:bg-[#8B181B] transition-colors'
        }`}
      />

      {/* Hero Photo Banner if available */}
      {announcement.imageUrl && (
        <div className="relative h-44 sm:h-48 w-full overflow-hidden bg-stone-100 border-b border-stone-100">
          <img
            src={announcement.imageUrl}
            alt={announcement.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
        </div>
      )}

      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2.5">
            {/* Zero-Pill Metadata Line */}
            <div className="flex items-center gap-x-2 gap-y-1 flex-wrap text-[11px] font-semibold tracking-wider uppercase text-stone-500">
              <span className="text-[#8B181B] font-bold">
                {announcement.category || 'General'}
              </span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="text-stone-400">
                {new Date(dateStr).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              {isUrgent && (
                <>
                  <span aria-hidden="true" className="text-stone-300">·</span>
                  <span className="text-red-700 font-bold flex items-center gap-1 animate-pulse">
                    <AlertTriangle className="w-3 h-3 text-red-600" />
                    Urgent
                  </span>
                </>
              )}
              {isPinned && !isUrgent && (
                <>
                  <span aria-hidden="true" className="text-stone-300">·</span>
                  <span className="text-amber-800 font-bold flex items-center gap-1">
                    <Pin className="w-3 h-3 fill-amber-700 text-amber-700" />
                    Pinned
                  </span>
                </>
              )}
            </div>

            <div className="flex items-center gap-1">
              <ShareButton
                title={announcement.title}
                text={shareText}
                url={shareUrl}
                variant="icon"
                className="p-1.5 text-stone-400 hover:text-[#8B181B] hover:bg-stone-100 rounded-lg cursor-pointer transition-colors"
              />

              {canManage && onTogglePin && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onTogglePin(announcement.id);
                  }}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    isPinned
                      ? 'text-amber-700 bg-amber-100 hover:bg-amber-200'
                      : 'text-stone-400 hover:text-stone-700 hover:bg-stone-100'
                  }`}
                  title={isPinned ? 'Unpin announcement' : 'Pin to top as featured'}
                >
                  <Pin className={`w-3.5 h-3.5 ${isPinned ? 'fill-amber-700' : ''}`} />
                </button>
              )}

              {canManage && onToggleArchive && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleArchive(announcement.id);
                  }}
                  className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors cursor-pointer"
                  title={isArchived ? 'Restore from Archive' : 'Archive Notice'}
                >
                  {isArchived ? (
                    <ArchiveRestore className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Archive className="w-3.5 h-3.5" />
                  )}
                </button>
              )}

              {canManage && onDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                  className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Delete announcement"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-3">
          <h2 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-[#8B181B] transition-colors leading-snug">
            {announcement.title}
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 mt-2 line-clamp-3 leading-relaxed">
            {announcement.content}
          </p>

          {/* Media or Attachment preview indicators */}
          {(announcement.imageUrl || (announcement.attachments && announcement.attachments.length > 0)) && (
            <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-stone-100 text-xs text-stone-500">
              {announcement.imageUrl && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded">
                  <ImageIcon className="w-3.5 h-3.5 text-stone-500" />
                  <span>Has Photo</span>
                </span>
              )}
              {announcement.attachments && announcement.attachments.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>{announcement.attachments.length} Attachment{announcement.attachments.length > 1 ? 's' : ''}</span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-800">{announcement.authorName || 'Office of Communications'}</span>
          <span>•</span>
          <span className="uppercase text-[10px] bg-stone-100 px-1.5 py-0.5 rounded font-medium text-stone-700">
            {announcement.authorRole || 'ADMIN'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <InteractiveHeartReaction
            isHearted={isHearted}
            heartsCount={heartsCount}
            onToggle={() => toggleHeartAnnouncement(announcement.id)}
            reactorUids={announcement.hearts || []}
            allUsers={users}
            size="sm"
            variant="inline"
            label={isHearted ? 'Hearted' : 'Heart'}
          />

          <span className="text-[#8B181B] font-semibold text-xs group-hover:underline flex items-center gap-1">
            <span>Read notice</span>
            <span>&rarr;</span>
          </span>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          if (onDelete) onDelete(announcement.id);
          setShowDeleteConfirm(false);
        }}
        title="Delete Announcement"
        message={`Are you sure you want to permanently delete "${announcement.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
      />
    </div>
  </div>
  );
};
