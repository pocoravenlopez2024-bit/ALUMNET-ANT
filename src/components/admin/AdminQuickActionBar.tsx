import React from 'react';
import {
  ShieldCheck,
  UserCheck,
  Briefcase,
  AlertTriangle,
  Building2,
  Plus,
  Megaphone,
  Calendar,
  ImageIcon,
  Download,
  RefreshCw,
  CheckCircle,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';

interface AdminQuickActionBarProps {
  onNavigateTab: (tab: string) => void;
  onOpenCreateUser: () => void;
  onOpenCreateEvent: () => void;
  onOpenCreateAnnouncement: () => void;
  onOpenGalleryUpload: () => void;
  onExportCsv: () => void;
  pendingUsersCount: number;
  pendingEmployersCount: number;
  pendingJobsCount: number;
  pendingConflictsCount: number;
}

export const AdminQuickActionBar: React.FC<AdminQuickActionBarProps> = ({
  onNavigateTab,
  onOpenCreateUser,
  onOpenCreateEvent,
  onOpenCreateAnnouncement,
  onOpenGalleryUpload,
  onExportCsv,
  pendingUsersCount,
  pendingEmployersCount,
  pendingJobsCount,
  pendingConflictsCount
}) => {
  const {
    users,
    setUserVerified,
    syncAllDataToCloud,
    isFirestoreSyncing,
    showToast
  } = useAlumni();

  const totalPending =
    pendingUsersCount + pendingEmployersCount + pendingJobsCount + pendingConflictsCount;

  const handleVerifyAllPendingUsers = () => {
    const unverified = (users || []).filter((u) => !u.isVerified);
    if (unverified.length === 0) return;
    unverified.forEach((u) => setUserVerified(u.uid, true));
    showToast(`Approved & verified all ${unverified.length} pending alumni!`, 'success');
  };

  return (
    <div className="w-full space-y-3">
      {/* 1. Triage Strip: Needs Attention Bar */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-3.5 sm:p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status / Pending Summary */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-2xs ${
              totalPending > 0
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {totalPending > 0 ? (
              <AlertTriangle className="w-4 h-4 stroke-[2]" />
            ) : (
              <CheckCircle className="w-4 h-4 stroke-[2]" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-stone-900">
                {totalPending > 0
                  ? `${totalPending} Action Items Need Attention`
                  : 'Institutional Governance: All Rosters Cleared'}
              </span>
              {totalPending > 0 && (
                <span className="animate-pulse flex h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              )}
            </div>
            <p className="text-[11px] text-stone-500 truncate mt-0.5">
              {totalPending > 0
                ? 'Review unverified graduates, accredited employers, and pending career listings.'
                : 'All graduate records verified. Registry algorithms synchronized with PACUCOA standards.'}
            </p>
          </div>
        </div>

        {/* Action Badges & Triage Chips */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {pendingUsersCount > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200/80 px-2.5 py-1 rounded-xl text-xs">
              <span className="font-semibold text-amber-900">
                {pendingUsersCount} Alumni
              </span>
              <button
                type="button"
                onClick={() => onNavigateTab('governance')}
                className="text-[10px] font-bold text-[#8B181B] hover:underline cursor-pointer ml-1"
              >
                Review
              </button>
              <span className="text-amber-300">·</span>
              <button
                type="button"
                onClick={handleVerifyAllPendingUsers}
                className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 cursor-pointer"
              >
                Verify All
              </button>
            </div>
          )}

          {pendingEmployersCount > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('jobs')}
              className="flex items-center gap-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2.5 py-1 rounded-xl text-xs font-semibold text-purple-900 transition-colors cursor-pointer"
            >
              <Building2 className="w-3 h-3 text-purple-700" />
              <span>{pendingEmployersCount} Employers</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {pendingJobsCount > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('jobs')}
              className="flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 rounded-xl text-xs font-semibold text-blue-900 transition-colors cursor-pointer"
            >
              <Briefcase className="w-3 h-3 text-blue-700" />
              <span>{pendingJobsCount} Jobs</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {pendingConflictsCount > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab('governance')}
              className="flex items-center gap-1.5 bg-red-50 hover:bg-red-100 border border-red-200 px-2.5 py-1 rounded-xl text-xs font-semibold text-red-900 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3 h-3 text-[#8B181B]" />
              <span>{pendingConflictsCount} Conflicts</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}

          {totalPending === 0 && (
            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
              <CheckCircle className="w-3 h-3" />
              <span>100% Up to Date</span>
            </span>
          )}
        </div>
      </div>

      {/* 2. Fast Administrative Actions Toolbar */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-3 sm:p-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Action: New Member */}
          <button
            type="button"
            onClick={onOpenCreateUser}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Member</span>
          </button>

          {/* Quick Action: New Announcement */}
          <button
            type="button"
            onClick={onOpenCreateAnnouncement}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95"
          >
            <Megaphone className="w-3.5 h-3.5 text-stone-600" />
            <span>Broadcast Notice</span>
          </button>

          {/* Quick Action: New Event */}
          <button
            type="button"
            onClick={onOpenCreateEvent}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95"
          >
            <Calendar className="w-3.5 h-3.5 text-stone-600" />
            <span>New Gathering</span>
          </button>

          {/* Quick Action: Gallery Upload */}
          <button
            type="button"
            onClick={onOpenGalleryUpload}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95"
          >
            <ImageIcon className="w-3.5 h-3.5 text-stone-600" />
            <span>Add Photo</span>
          </button>
        </div>

        {/* Right side utilities: Export CSV & Cloud Sync */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onExportCsv}
            title="Export verified graduates roster as CSV spreadsheet"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 rounded-xl text-xs font-semibold transition-all cursor-pointer active:scale-95 border border-stone-200/80"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span className="hidden sm:inline">Export Roster</span>
            <span className="sm:hidden">Export</span>
          </button>

          <button
            type="button"
            onClick={() => syncAllDataToCloud()}
            disabled={isFirestoreSyncing}
            title="Push local modifications to Firebase Firestore"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFirestoreSyncing ? 'animate-spin' : ''}`} />
            <span>{isFirestoreSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
