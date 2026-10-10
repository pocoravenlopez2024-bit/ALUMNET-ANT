import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Mail,
  Phone,
  Briefcase,
  GraduationCap,
  MessageSquare,
  UserCheck,
  UserPlus,
  Building,
  Calendar,
  CheckCircle2,
  Sparkles,
  FileDown,
  Clock,
  Check
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { exportProfileToPdfResume } from '../../services/pdfResumeService';
import { ImageViewerModal } from '../common/ImageViewerModal';
import { ConfirmationModal } from '../common/ConfirmationModal';
import {
  getUserAvatar,
  getCoverPhoto,
  handleUserAvatarError,
  handleCoverPhotoError
} from '../../lib/defaultImages';

export const PublicProfileModal: React.FC = () => {
  const {
    users,
    currentUser,
    selectedUserIdForModal,
    setSelectedUserIdForModal,
    isConnected,
    hasPendingRequestWith,
    friendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    getOrCreateChat,
    setActiveTab,
    showToast
  } = useAlumni();

  const [viewerImage, setViewerImage] = useState<{ url: string; title: string } | null>(null);
  const [showCancelRequestConfirm, setShowCancelRequestConfirm] = useState(false);

  if (!selectedUserIdForModal) return null;

  const targetUser = users.find((u) => u.uid === selectedUserIdForModal);
  if (!targetUser) return null;

  const isSelf = currentUser?.uid === targetUser.uid;
  const connected = isConnected(targetUser.uid);
  const reqState = hasPendingRequestWith(targetUser.uid);

  // Find active pending request if any
  const pendingReq = friendRequests.find(
    (r) =>
      r.status === 'pending' &&
      ((r.fromUid === currentUser?.uid && r.toUid === targetUser.uid) ||
        (r.fromUid === targetUser.uid && r.toUid === currentUser?.uid))
  );

  if (typeof document === 'undefined') return null;

  const modalElement = (
    <>
      <div
        className="fixed inset-0 z-[75] bg-black/60 dark:bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe animate-in fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget) setSelectedUserIdForModal(null);
        }}
      >
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 w-full max-w-2xl max-h-[90dvh] overflow-hidden flex flex-col animate-in zoom-in-95 transition-colors">
          
          {/* Scrollable Container */}
          <div className="flex-1 overflow-y-auto">
            {/* Cover Photo Header */}
            <div className="relative h-44 sm:h-52 bg-stone-800 shrink-0">
              <img
                src={getCoverPhoto(targetUser.coverPhotoUrl)}
                alt="Cover"
                onError={handleCoverPhotoError}
                onClick={() =>
                  setViewerImage({
                    url: getCoverPhoto(targetUser.coverPhotoUrl),
                    title: `${targetUser.name} — Cover Photo`
                  })
                }
                className="w-full h-full object-cover opacity-90 dark:opacity-80 cursor-pointer hover:opacity-100 transition-opacity"
                title="Click to view full cover photo"
              />
              <button
                onClick={() => setSelectedUserIdForModal(null)}
                className="absolute top-4 right-4 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors cursor-pointer z-20 border border-white/10"
                aria-label="Close profile"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Card Body */}
            <div className="px-4 sm:px-6 pb-6">
              {/* Avatar and Action Buttons Row */}
              <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-3.5 -mt-12 sm:-mt-14 mb-5">
                <div className="relative self-start shrink-0 z-10">
                  <img
                    src={getUserAvatar(targetUser.profilePictureUrl)}
                    alt={targetUser.name}
                    onError={handleUserAvatarError}
                    onClick={() =>
                      setViewerImage({
                        url: getUserAvatar(targetUser.profilePictureUrl),
                        title: `${targetUser.name} — Profile Picture`
                      })
                    }
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white dark:border-stone-900 shadow-lg bg-stone-100 dark:bg-stone-800 ring-1 ring-stone-900/10 dark:ring-stone-700/50 aspect-square cursor-pointer hover:scale-[1.03] transition-transform"
                    title="Click to view enlarged profile photo"
                  />
                  <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-stone-900 shadow-xs"></span>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-1 xs:grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto pt-1 sm:pt-0">
                  {isSelf && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await exportProfileToPdfResume(targetUser, currentUser);
                          showToast('Official PDF Resume downloaded successfully!', 'success');
                        } catch (err: any) {
                          showToast(err?.message || 'Could not export PDF resume.', 'error');
                        }
                      }}
                      className="justify-center flex items-center gap-2 px-3.5 py-2.5 bg-stone-900 hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs cursor-pointer transition-colors min-h-[42px]"
                      title="Download verified resume as PDF"
                    >
                      <FileDown className="w-4 h-4 text-amber-300 shrink-0" />
                      <span className="whitespace-nowrap">Export PDF Resume</span>
                    </button>
                  )}

                  {!isSelf && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          getOrCreateChat(targetUser.uid);
                          setSelectedUserIdForModal(null);
                          setActiveTab('messages');
                        }}
                        className="justify-center flex items-center gap-2 px-4 py-2.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs cursor-pointer min-h-[42px] transition-colors"
                      >
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        <span>Message</span>
                      </button>

                      {connected ? (
                        <div className="justify-center flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs sm:text-sm font-semibold min-h-[42px]">
                          <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Connected</span>
                        </div>
                      ) : reqState === 'sent' ? (
                        <button
                          type="button"
                          onClick={() => setShowCancelRequestConfirm(true)}
                          className="justify-center flex items-center gap-2 px-3.5 py-2.5 bg-amber-50 hover:bg-red-50 dark:bg-amber-950/40 dark:hover:bg-red-950/40 text-amber-900 hover:text-red-700 dark:text-amber-300 dark:hover:text-red-300 border border-amber-200/90 dark:border-amber-800/60 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer min-h-[42px]"
                          title="Click to cancel pending connection request"
                        >
                          <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span>Request Sent (Cancel)</span>
                        </button>
                      ) : reqState === 'received' ? (
                        <div className="flex items-center gap-1.5 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => {
                              if (pendingReq) acceptFriendRequest(pendingReq.id);
                            }}
                            className="flex-1 sm:flex-initial justify-center flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold cursor-pointer shadow-xs min-h-[42px]"
                          >
                            <Check className="w-4 h-4" />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (pendingReq) declineFriendRequest(pendingReq.id);
                            }}
                            className="justify-center flex items-center gap-1 px-3 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 rounded-xl text-xs sm:text-sm font-semibold cursor-pointer min-h-[42px]"
                            title="Decline request"
                          >
                            <X className="w-4 h-4" />
                            <span className="hidden xs:inline">Decline</span>
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => sendFriendRequest(targetUser.uid)}
                          className="justify-center flex items-center gap-2 px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 rounded-xl text-xs sm:text-sm font-semibold shadow-xs hover:shadow-md cursor-pointer transition-all active:scale-98 min-h-[42px]"
                        >
                          <UserPlus className="w-4 h-4 shrink-0" />
                          <span>Connect</span>
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* User Details */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 dark:text-white">
                    {targetUser.name}
                  </h2>
                  {targetUser.isVerified && (
                    <span className="px-2 py-0.5 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 rounded-full inline-flex items-center gap-1 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Verified Alum</span>
                    </span>
                  )}
                  <span className="uppercase text-[11px] px-2 py-0.5 rounded-full font-semibold bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                    {targetUser.role}
                  </span>
                </div>

                <p className="text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-300 mt-1 leading-relaxed">
                  {targetUser.headline || 'St. Cecilia’s College Alumnus'}
                </p>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
                  <span className="flex items-center gap-1 text-[#8B181B] dark:text-red-400 font-semibold">
                    <GraduationCap className="w-3.5 h-3.5 text-[#8B181B] dark:text-red-400" />
                    Batch of {targetUser.batch || '—'} • {targetUser.course || 'Degree Program'}
                  </span>
                  {targetUser.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" />
                      {targetUser.location}
                    </span>
                  )}
                </div>
              </div>

              {/* Metrics Row */}
              <div className="mt-4 p-3 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/80 dark:border-stone-700/60 grid grid-cols-3 text-center">
                <div>
                  <span className="text-base font-bold text-stone-900 dark:text-white block font-mono">
                    {targetUser.connectionsCount || 0}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Connections</span>
                </div>
                <div>
                  <span className="text-base font-bold text-stone-900 dark:text-white block font-mono">
                    {targetUser.batch || '2024'}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Graduation Batch</span>
                </div>
                <div>
                  <span className="text-base font-bold text-[#8B181B] dark:text-red-400 block font-mono">
                    {targetUser.isVerified ? 'Verified' : 'Member'}
                  </span>
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">Portal Status</span>
                </div>
              </div>

              {/* About Section */}
              <div className="mt-5">
                <h3 className="font-serif text-sm font-bold text-stone-900 dark:text-white tracking-tight uppercase mb-1.5">
                  About
                </h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed whitespace-pre-line bg-stone-50/60 dark:bg-stone-800/40 p-3.5 rounded-xl border border-stone-200/60 dark:border-stone-700/50">
                  {targetUser.about || 'No bio written yet.'}
                </p>
              </div>

              {/* Experience Timeline */}
              {(targetUser.experience || []).length > 0 && (
                <div className="mt-6">
                  <h3 className="font-serif text-sm font-bold text-stone-900 dark:text-white tracking-tight uppercase mb-3 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#8B181B] dark:text-red-400" />
                    <span>Professional Experience</span>
                  </h3>

                  <div className="space-y-3">
                    {(targetUser.experience || []).map((exp) => (
                      <div key={exp.id} className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/70 dark:border-stone-700/60 text-xs">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-stone-900 dark:text-white text-sm">{exp.title}</h4>
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">{exp.startDate}</span>
                        </div>
                        <div className="text-[#8B181B] dark:text-red-400 font-semibold mt-0.5">
                          {exp.company} • <span className="text-stone-600 dark:text-stone-400 font-normal">{exp.location}</span>
                        </div>
                        {exp.description && (
                          <p className="text-stone-600 dark:text-stone-300 mt-1.5 leading-relaxed">{exp.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education Timeline */}
              {(targetUser.education || []).length > 0 && (
                <div className="mt-6">
                  <h3 className="font-serif text-sm font-bold text-stone-900 dark:text-white tracking-tight uppercase mb-3 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-[#8B181B] dark:text-red-400" />
                    <span>Education & Academics</span>
                  </h3>

                  <div className="space-y-3">
                    {(targetUser.education || []).map((edu) => (
                      <div key={edu.id} className="p-3.5 bg-stone-50 dark:bg-stone-800/60 rounded-xl border border-stone-200/70 dark:border-stone-700/60 text-xs">
                        <div className="flex items-start justify-between">
                          <h4 className="font-bold text-stone-900 dark:text-white text-sm">{edu.degree}</h4>
                          <span className="text-[10px] text-stone-400 dark:text-stone-500 font-medium">
                            {edu.startYear} - {edu.endYear}
                          </span>
                        </div>
                        <div className="text-stone-700 dark:text-stone-300 font-medium mt-0.5">
                          {edu.institution} • <span className="text-stone-500 dark:text-stone-400">{edu.fieldOfStudy}</span>
                        </div>
                        {edu.honors && (
                          <div className="text-[11px] text-[#8B181B] dark:text-red-400 font-semibold mt-1">
                            Honors: {edu.honors}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Enlarged Image Viewer Modal for Profile Picture and Cover Photo */}
      <ImageViewerModal
        isOpen={Boolean(viewerImage)}
        imageUrl={viewerImage?.url || ''}
        title={viewerImage?.title || 'Image Viewer'}
        onClose={() => setViewerImage(null)}
      />

      {/* Cancel Connection Request Confirmation Dialog */}
      <ConfirmationModal
        isOpen={showCancelRequestConfirm}
        onClose={() => setShowCancelRequestConfirm(false)}
        onConfirm={() => {
          if (pendingReq) {
            cancelFriendRequest(pendingReq.id);
          }
          setShowCancelRequestConfirm(false);
        }}
        title="Withdraw Connection Request"
        message={`Are you sure you want to withdraw your pending connection request to ${targetUser.name}? You can send another request at any time.`}
        confirmLabel="Withdraw Request"
        cancelLabel="Keep Request"
        variant="warning"
      />
    </>
  );

  return createPortal(modalElement, document.body);
};
