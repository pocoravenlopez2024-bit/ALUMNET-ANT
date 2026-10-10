import React, { useState, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Inbox,
  AlertTriangle,
  Megaphone,
  Calendar,
  Briefcase,
  Building2,
  FileText,
  Bot,
  BarChart3,
  Award,
  MapPin,
  ImageIcon,
  ShieldCheck,
  ShieldAlert,
  Plus,
  UserPlus,
  Upload,
  Shield,
  Trash2,
  ChevronDown,
  Camera,
  Check,
  Loader2
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { UserRole } from '../../types';
import { AdminDashboardOverview } from './AdminDashboardOverview';
import { AdminUsersTable } from './AdminUsersTable';
import { RegistrarRegistryMatcher } from './RegistrarRegistryMatcher';
import { AdminRequestsAndConflictsView } from './AdminRequestsAndConflictsView';
import { AdminGovernanceView } from './AdminGovernanceView';
import { AdminAnnouncementsManager } from './AdminAnnouncementsManager';
import { AdminEventsManager } from './AdminEventsManager';
import { JobModerationQueue } from '../opportunities/JobModerationQueue';
import { EmployerManagementModule } from './EmployerManagementModule';
import { AdminEmployersAndJobsView } from './AdminEmployersAndJobsView';
import { AuditLogView } from './AuditLogView';
import { getRegistrationConflicts } from '../../services/studentVerificationService';
import { compressImage } from '../../lib/utils';
import { AdminCommandBar } from './AdminCommandBar';
import { AdminQuickActionBar } from './AdminQuickActionBar';
import { exportAlumniRosterCsv } from '../../services/adminExportService';

export type AdminTab =
  | 'overview'
  | 'users'
  | 'registry'
  | 'governance'
  | 'requests'
  | 'conflicts'
  | 'announcements'
  | 'events'
  | 'attendance'
  | 'jobs'
  | 'employers'
  | 'audit'
  | 'automations'
  | 'metrics'
  | 'milestones'
  | 'chapters'
  | 'gallery';

export const AdminPanelView: React.FC = () => {
  const {
    currentUser,
    users,
    chapters,
    createChapter,
    milestones,
    createMilestone,
    permissions,
    createUserByAdmin,
    galleryItems,
    addGalleryItem,
    deleteGalleryItem,
    automationJobs,
    auditLogs,
    opportunities,
    announcements,
    events,
    syncAllDataToCloud,
    isFirestoreSyncing,
    showToast
  } = useAlumni();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Compute pending counts for badges
  const pendingConflictsCount = useMemo(() => {
    try {
      return getRegistrationConflicts().filter((c) => c.status === 'pending').length;
    } catch {
      return 0;
    }
  }, [activeTab]);

  const pendingJobsCount = useMemo(() => {
    return (opportunities || []).filter((o) => o.approvalStatus === 'pending_approval' || (o as any).status === 'pending_approval').length;
  }, [opportunities]);

  const pendingEmployersCount = useMemo(() => {
    return (users || []).filter(
      (u) => u.role === 'employer' && u.employerVerificationStatus === 'pending_verification'
    ).length;
  }, [users]);

  const pendingUsersCount = useMemo(() => {
    return (users || []).filter((u) => !u.isVerified).length;
  }, [users]);

  const totalRequestsCount =
    pendingUsersCount + pendingEmployersCount + pendingJobsCount + pendingConflictsCount;

  // Modals
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('Password123!');
  const [newUserRole, setNewUserRole] = useState<UserRole>('admin');
  const [newUserDepartment, setNewUserDepartment] = useState('');

  const [showGalleryUploadModal, setShowGalleryUploadModal] = useState(false);
  const [galTitle, setGalTitle] = useState('');
  const [galCategory, setGalCategory] = useState<'campus' | 'homecoming' | 'commencement' | 'heritage'>('campus');
  const [galYear, setGalYear] = useState('2026');
  const [galUrl, setGalUrl] = useState('');
  const [galDesc, setGalDesc] = useState('');
  const [galPhotoFileName, setGalPhotoFileName] = useState('');
  const [isDraggingGalPhoto, setIsDraggingGalPhoto] = useState(false);
  const [isProcessingGalPhoto, setIsProcessingGalPhoto] = useState(false);
  const [galPhotoError, setGalPhotoError] = useState('');
  const [showGalDirectUrlInput, setShowGalDirectUrlInput] = useState(false);
  const galPhotoFileInputRef = useRef<HTMLInputElement>(null);

  const handleGalPhotoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setGalPhotoError('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setGalPhotoError('Selected image is too large (max 20MB).');
      return;
    }
    setGalPhotoError('');
    setIsProcessingGalPhoto(true);
    try {
      const compressed = await compressImage(file, 1280, 800, 0.85);
      setGalUrl(compressed);
      setGalPhotoFileName(file.name);
    } catch (err) {
      console.error('Failed to compress gallery image:', err);
      setGalPhotoError('Failed to process image. Please try another file.');
    } finally {
      setIsProcessingGalPhoto(false);
    }
  };

  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [mAlumnusId, setMAlumnusId] = useState('');
  const [mTitle, setMTitle] = useState('');
  const [mCategory, setMCategory] = useState<'promotion' | 'startup' | 'award' | 'publication' | 'honor'>('promotion');
  const [mDescription, setMDescription] = useState('');
  const [mCompany, setMCompany] = useState('');

  const [showChapterModal, setShowChapterModal] = useState(false);
  const [cName, setCName] = useState('');
  const [cRegion, setCRegion] = useState('');
  const [cLeadName, setCLeadName] = useState('');
  const [cLeadEmail, setCLeadEmail] = useState('');

  // Modules configuration with permissions, badges, groups, and responsive metadata
  const modulesList = useMemo(() => {
    return [
      {
        id: 'overview' as AdminTab,
        label: 'Overview & Analytics',
        shortLabel: 'Overview',
        group: 'Core Administration',
        icon: LayoutDashboard,
        badge: null,
        badgeColor: '',
        visible: true
      },
      {
        id: 'users' as AdminTab,
        label: 'Members Directory',
        shortLabel: 'Members',
        group: 'Core Administration',
        icon: Users,
        badge: null,
        badgeColor: '',
        visible: true
      },
      {
        id: 'registry' as AdminTab,
        label: 'Registrar Registry',
        shortLabel: 'Registry',
        group: 'Core Administration',
        icon: GraduationCap,
        badge: null,
        badgeColor: '',
        visible: permissions.canAccessRegistry
      },
      {
        id: 'governance' as AdminTab,
        label: 'Verification & Identity',
        shortLabel: 'Verification',
        group: 'Verification & Compliance',
        icon: ShieldCheck,
        badge: totalRequestsCount > 0 ? totalRequestsCount : null,
        badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
        visible: currentUser?.role === 'admin' || currentUser?.role === 'superadmin'
      },
      {
        id: 'jobs' as AdminTab,
        label: 'Employers & Jobs',
        shortLabel: 'Jobs & Partners',
        group: 'Verification & Compliance',
        icon: Briefcase,
        badge: (pendingJobsCount + pendingEmployersCount) > 0 ? (pendingJobsCount + pendingEmployersCount) : null,
        badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
        visible: permissions.canManageJobModeration || permissions.canAccessEmployerAccreditation
      },
      {
        id: 'audit' as AdminTab,
        label: 'System Audit Logs',
        shortLabel: 'Audit',
        group: 'Verification & Compliance',
        icon: FileText,
        badge: null,
        badgeColor: '',
        visible: currentUser?.role === 'admin' || currentUser?.role === 'superadmin'
      },
      {
        id: 'announcements' as AdminTab,
        label: 'Announcements',
        shortLabel: 'Announcements',
        group: 'Alumni Engagement',
        icon: Megaphone,
        badge: null,
        badgeColor: '',
        visible: true
      },
      {
        id: 'events' as AdminTab,
        label: 'Events & Reunions',
        shortLabel: 'Events',
        group: 'Alumni Engagement',
        icon: Calendar,
        badge: null,
        badgeColor: '',
        visible: true
      },
      {
        id: 'milestones' as AdminTab,
        label: 'Alumni Milestones',
        shortLabel: 'Milestones',
        group: 'Alumni Engagement',
        icon: Award,
        badge: null,
        badgeColor: '',
        visible: true
      },
      {
        id: 'chapters' as AdminTab,
        label: 'Regional Chapters',
        shortLabel: 'Chapters',
        group: 'Alumni Engagement',
        icon: MapPin,
        badge: null,
        badgeColor: '',
        visible: true
      },
      {
        id: 'gallery' as AdminTab,
        label: 'Campus Gallery',
        shortLabel: 'Gallery',
        group: 'Alumni Engagement',
        icon: ImageIcon,
        badge: null,
        badgeColor: '',
        visible: true
      }
    ].filter((m) => m.visible);
  }, [
    users.length,
    permissions.canAccessRegistry,
    permissions.canManageJobModeration,
    permissions.canAccessEmployerAccreditation,
    totalRequestsCount,
    pendingJobsCount,
    pendingEmployersCount,
    currentUser?.role,
    announcements.length,
    events.length,
    milestones.length,
    chapters.length,
    galleryItems.length
  ]);

  const groupedModules = useMemo(() => {
    const groups: Record<string, typeof modulesList> = {};
    modulesList.forEach((mod) => {
      const grp = mod.group || 'Core Administration';
      if (!groups[grp]) groups[grp] = [];
      groups[grp].push(mod);
    });
    return groups;
  }, [modulesList]);

  // Permission Gate
  if (!permissions.canAccessAdminPanel) {
    return (
      <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center max-w-lg mx-auto shadow-2xs">
        <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <h2 className="text-base font-bold text-stone-900 font-serif">Restricted Administration Portal</h2>
        <p className="text-xs text-stone-500 mt-2 leading-relaxed">
          Your current account role is <span className="font-bold text-stone-800 uppercase">{currentUser?.role}</span>.
          Access to this management console requires Admin, Registrar, Staff, or Moderator privileges.
        </p>
      </div>
    );
  }

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    const alumnus = users.find((u) => u.uid === mAlumnusId) || users[0];
    if (!alumnus || !mTitle || !mDescription) return;

    createMilestone({
      alumnusId: alumnus.uid,
      alumnusName: alumnus.name,
      alumnusAvatar: alumnus.profilePictureUrl,
      title: mTitle,
      category: mCategory,
      description: mDescription,
      companyOrOrg: mCompany || undefined
    });

    setMTitle('');
    setMDescription('');
    setMCompany('');
    setShowMilestoneModal(false);
  };

  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName || !cRegion || !cLeadName) return;

    createChapter({
      name: cName,
      region: cRegion,
      leadName: cLeadName,
      leadEmail: cLeadEmail || 'chapter@stcecilia.edu'
    });

    setCName('');
    setCRegion('');
    setCLeadName('');
    setCLeadEmail('');
    setShowChapterModal(false);
  };

  const handleExportCsv = () => {
    exportAlumniRosterCsv(users, 'st_cecilia_official_alumni_roster');
    showToast(`Exported ${users.length} verified and active alumni records!`, 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Collegiate Institutional Administration Banner - Strict Minimalist Bento */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        {/* Institutional St. Cecilia Crimson Architectural Top Trim */}
        <div className="h-1 w-full bg-[#8B181B]" />

        <div className="relative z-10 p-5 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
                <span className="text-[#8B181B] font-bold">St. Cecilia's College - Cebu, Inc.</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span>Administration Console</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="text-stone-400">Minglanilla Campus</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-[#8B181B] border border-red-100 flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldCheck className="w-5 h-5 stroke-[1.75]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight leading-tight">
                      Institutional Administration
                    </h1>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#8B181B]/10 text-[#8B181B] border border-[#8B181B]/20 rounded-md uppercase tracking-wider">
                      {currentUser?.role}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Logged in as <span className="font-semibold text-stone-700">{currentUser?.name}</span> • All administrative operations logged to audit trail.
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Global Header Actions */}
            <div className="flex items-center gap-2 shrink-0 self-start lg:self-center">
              <button
                type="button"
                onClick={() => syncAllDataToCloud()}
                disabled={isFirestoreSyncing}
                title="Synchronize database with Firestore cloud"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <Loader2 className={`w-3.5 h-3.5 ${isFirestoreSyncing ? 'animate-spin' : ''}`} />
                <span>{isFirestoreSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5 rotate-180" />
                <span>Export Roster</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Universal Omnibar / Spotlight Command Search (Shown on sub-tabs for fast navigation) */}
      {activeTab !== 'overview' && (
        <AdminCommandBar
          onNavigateTab={(tab) => setActiveTab(tab as AdminTab)}
          onOpenCreateUser={() => setShowCreateUserModal(true)}
          onOpenCreateEvent={() => setActiveTab('events')}
          onOpenCreateAnnouncement={() => setActiveTab('announcements')}
          onOpenGalleryUpload={() => setShowGalleryUploadModal(true)}
          onExportCsv={handleExportCsv}
        />
      )}

      {/* Admin Fast Action & Triage Bar (Shown only on non-overview tabs to prevent visual clutter) */}
      {activeTab !== 'overview' && (
        <AdminQuickActionBar
          onNavigateTab={(tab) => setActiveTab(tab as AdminTab)}
          onOpenCreateUser={() => setShowCreateUserModal(true)}
          onOpenCreateEvent={() => setActiveTab('events')}
          onOpenCreateAnnouncement={() => setActiveTab('announcements')}
          onOpenGalleryUpload={() => setShowGalleryUploadModal(true)}
          onExportCsv={handleExportCsv}
          pendingUsersCount={pendingUsersCount}
          pendingEmployersCount={pendingEmployersCount}
          pendingJobsCount={pendingJobsCount}
          pendingConflictsCount={pendingConflictsCount}
        />
      )}

      {/* Main Structural Layout: Responsive Navigation + Module Viewport */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Mobile Module Navigation (lg:hidden): Sticky Header + Fast Horizontal Pill Strip */}
        <div className="lg:hidden w-full space-y-2.5 sticky top-14 sm:top-16 z-20 bg-[#F9FAFB]/95 backdrop-blur-md py-1.5 -mx-1 px-1">
          {/* Active Module Header Card with 1-Tap Dropdown Selector */}
          <div className="bg-white rounded-2xl border border-stone-200/90 p-3 shadow-2xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-red-50 text-[#8B181B] border border-red-100 flex items-center justify-center shrink-0">
                {(() => {
                  const currentMod =
                    modulesList.find(
                      (m) =>
                        m.id === activeTab ||
                        (m.id === 'overview' && activeTab === 'metrics') ||
                        (m.id === 'governance' && (activeTab === 'requests' || activeTab === 'conflicts')) ||
                        (m.id === 'jobs' && activeTab === 'employers')
                    ) || modulesList[0];
                  const ModIcon = currentMod?.icon || LayoutDashboard;
                  return <ModIcon className="w-4 h-4" />;
                })()}
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                  Active Admin Module
                </span>
                <span className="text-xs font-bold text-stone-900 truncate block">
                  {modulesList.find(
                    (m) =>
                      m.id === activeTab ||
                      (m.id === 'overview' && activeTab === 'metrics') ||
                      (m.id === 'governance' && (activeTab === 'requests' || activeTab === 'conflicts')) ||
                      (m.id === 'jobs' && activeTab === 'employers')
                  )?.label || 'Overview & Analytics'}
                </span>
              </div>
            </div>

            {/* Quick Switch Dropdown for Touch Accessibility */}
            <div className="relative shrink-0">
              <select
                value={
                  activeTab === 'metrics'
                    ? 'overview'
                    : activeTab === 'requests' || activeTab === 'conflicts'
                    ? 'governance'
                    : activeTab === 'employers'
                    ? 'jobs'
                    : activeTab
                }
                onChange={(e) => setActiveTab(e.target.value as AdminTab)}
                aria-label="Select Administrative Module"
                className="appearance-none pl-3 pr-8 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-[#8B181B]/20 cursor-pointer"
              >
                {modulesList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} {m.badge ? `(${m.badge})` : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-stone-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Horizontally Scrollable Smooth Pill Navigation Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 px-0.5">
            {modulesList.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeTab === item.id ||
                (item.id === 'overview' && activeTab === 'metrics') ||
                (item.id === 'governance' && (activeTab === 'requests' || activeTab === 'conflicts')) ||
                (item.id === 'jobs' && activeTab === 'employers');

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-all cursor-pointer min-h-[42px] active:scale-95 ${
                    isActive
                      ? 'bg-[#8B181B] text-white shadow-xs font-extrabold'
                      : 'bg-white text-stone-700 hover:text-stone-950 hover:bg-stone-50 border border-stone-200/90'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                  <span>{item.shortLabel}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive
                          ? 'bg-white text-[#8B181B]'
                          : item.badgeColor || 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Management Modules Sidebar */}
        <aside className="hidden lg:block w-64 bg-white rounded-2xl border border-stone-200 p-3 shadow-2xs shrink-0 space-y-4 sticky top-28 self-start max-h-[calc(100vh-8.5rem)] overflow-y-auto scrollbar-thin">
          <div className="space-y-4">
            {Object.entries(groupedModules).map(([groupTitle, items]) => (
              <div key={groupTitle} className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-3 block">
                  {groupTitle}
                </span>
                <nav className="space-y-1">
                  {items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                      activeTab === item.id ||
                      (item.id === 'overview' && activeTab === 'metrics') ||
                      (item.id === 'governance' && (activeTab === 'requests' || activeTab === 'conflicts')) ||
                      (item.id === 'jobs' && activeTab === 'employers');

                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                            : 'text-stone-700 hover:text-stone-950 hover:bg-stone-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {item.badge !== null && item.badge !== undefined && (
                          <span
                            className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold shrink-0 ${
                              isActive
                                ? 'bg-white text-[#8B181B]'
                                : item.badgeColor || 'bg-stone-100 text-stone-700 border border-stone-200'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          {/* Institutional Stats Summary */}
          <div className="pt-3 border-t border-stone-100">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-stone-50 p-2 rounded-lg border border-stone-100">
                <span className="text-sm font-bold text-stone-900 block">{users.length}</span>
                <span className="text-[9px] text-stone-500 uppercase font-semibold">Total Roster</span>
              </div>
              <div className="bg-stone-50 p-2 rounded-lg border border-stone-100">
                <span className="text-sm font-bold text-stone-900 block">
                  {users.filter((u) => u.isVerified).length}
                </span>
                <span className="text-[9px] text-stone-500 uppercase font-semibold">Verified</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center Main Display Area */}
        <div className="flex-1 min-w-0 w-full space-y-4">
          {/* TAB: OVERVIEW & ANALYTICS */}
          {(activeTab === 'overview' || activeTab === 'metrics') && (
            <AdminDashboardOverview
              onNavigateTab={(tab) => setActiveTab(tab as AdminTab)}
              onOpenCreateUser={() => setShowCreateUserModal(true)}
              onOpenCreateEvent={() => setActiveTab('events')}
              onOpenCreateAnnouncement={() => setActiveTab('announcements')}
              onOpenGalleryUpload={() => setShowGalleryUploadModal(true)}
            />
          )}

          {/* TAB: MEMBERS */}
          {activeTab === 'users' && (
            <AdminUsersTable onOpenCreateUser={() => setShowCreateUserModal(true)} />
          )}

          {/* TAB: REGISTRY */}
          {activeTab === 'registry' &&
            (permissions.canAccessRegistry ? (
              <RegistrarRegistryMatcher />
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-lg mx-auto shadow-2xs space-y-3 my-8">
                <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center mx-auto border border-stone-200">
                  <ShieldAlert className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-base font-bold text-stone-900 font-serif">Access Restricted</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  The Student Registry module is restricted to Registrar and System Administrator accounts.
                </p>
              </div>
            ))}

          {/* TAB: GOVERNANCE (COMBINED REQUESTS & CONFLICTS) */}
          {(activeTab === 'governance' || activeTab === 'requests' || activeTab === 'conflicts') && (
            <AdminGovernanceView initialSubTab={activeTab === 'conflicts' ? 'conflicts' : 'requests'} />
          )}

          {/* TAB: ANNOUNCEMENTS */}
          {activeTab === 'announcements' && <AdminAnnouncementsManager />}

          {/* TAB: EVENTS & GATHERINGS */}
          {(activeTab === 'events' || activeTab === 'attendance') && <AdminEventsManager />}

          {/* TAB: EMPLOYERS & JOBS (MERGED SINGLE PAGE) */}
          {(activeTab === 'jobs' || activeTab === 'employers') && (
            (permissions.canManageJobModeration || permissions.canAccessEmployerAccreditation) ? (
              <AdminEmployersAndJobsView initialSubTab={activeTab === 'employers' ? 'employers' : 'jobs'} />
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-lg mx-auto shadow-2xs space-y-3 my-8">
                <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center mx-auto border border-stone-200">
                  <ShieldAlert className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-base font-bold text-stone-900 font-serif">Access Restricted</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Career opportunities and employer accreditation management is restricted to authorized moderators and administrators.
                </p>
              </div>
            )
          )}

          {/* TAB: AUDIT & SYSTEM LOGS */}
          {activeTab === 'audit' &&
            (permissions.canAccessAuditTrails ? (
              <AuditLogView />
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center max-w-lg mx-auto shadow-2xs space-y-3 my-8">
                <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-700 flex items-center justify-center mx-auto border border-stone-200">
                  <ShieldAlert className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-base font-bold text-stone-900 font-serif">Access Restricted</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Audit logs and compliance trails are viewable by Administrators only.
                </p>
              </div>
            ))}

          {/* TAB: MILESTONES (BENTO GRID REDESIGN) */}
          {activeTab === 'milestones' && (
            <div className="space-y-6">
              {/* Bento Hero Header - Strict Minimalist Bento */}
              <div className="relative overflow-hidden bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                {/* Institutional St. Cecilia Crimson Architectural Top Trim */}
                <div className="h-1 absolute top-0 left-0 right-0 bg-[#8B181B]" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="max-w-2xl space-y-2">
                    <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
                      <span className="text-[#8B181B] font-bold">St. Cecilia's College</span>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span>Institutional Laureates & Honors</span>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span>Alumni Hall of Fame</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 tracking-tight leading-tight">
                      Alumni Milestones & Honors Roster
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      Commemorate distinguished Cecilians across industry advancements, civil recognitions, research patents, and leadership achievements.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="hidden sm:flex flex-col text-right">
                      <span className="text-xs font-bold text-stone-900">{milestones.length} Records</span>
                      <span className="text-[10px] text-stone-500">Official Accreditations</span>
                    </div>
                    <button
                      onClick={() => setShowMilestoneModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-all shadow-[0_2px_8px_rgba(139,24,27,0.25)] cursor-pointer active:scale-95"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Publish Milestone</span>
                    </button>
                  </div>
                </div>

                {/* Quick Metrics Strip */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-stone-200/70">
                  <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Total Honors</span>
                    <span className="text-2xl font-bold text-stone-900 mt-1 block">{milestones.length}</span>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Accredited laureates</span>
                  </div>
                  <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Career Advancements</span>
                    <span className="text-2xl font-bold text-amber-800 mt-1 block">
                      {milestones.filter(m => m.category?.toLowerCase().includes('career') || m.category?.toLowerCase().includes('promotion')).length}
                    </span>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Corporate & leadership</span>
                  </div>
                  <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Civic & Honors</span>
                    <span className="text-2xl font-bold text-[#8B181B] mt-1 block">
                      {milestones.filter(m => !m.category?.toLowerCase().includes('career')).length}
                    </span>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Community impact</span>
                  </div>
                  <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Active Laureates</span>
                    <span className="text-2xl font-bold text-emerald-800 mt-1 block">
                      {new Set(milestones.map(m => m.alumnusId || m.alumnusName)).size}
                    </span>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Unique honorees</span>
                  </div>
                </div>
              </div>

              {/* Bento Milestones Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {milestones.map((m, idx) => (
                  <div
                    key={m.id}
                    className={`group relative overflow-hidden bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-amber-300/80 transition-all duration-200 flex flex-col justify-between ${
                      idx === 0 ? 'md:col-span-2 lg:col-span-2 bg-gradient-to-br from-white via-amber-50/20 to-white' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={m.alumnusAvatar}
                            alt={m.alumnusName}
                            className="w-12 h-12 rounded-xl object-cover border border-stone-200 shadow-2xs"
                          />
                          <div>
                            <h4 className="text-sm font-bold text-stone-900 tracking-tight group-hover:text-[#8B181B] transition-colors">
                              {m.alumnusName}
                            </h4>
                            <p className="text-xs text-stone-500 font-medium">
                              {m.companyOrOrg ? `${m.companyOrOrg}` : "St. Cecilia's Alumnus"}
                            </p>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 shrink-0">
                          {m.category}
                        </span>
                      </div>

                      <div className="mt-3.5">
                        <h3 className="text-base font-bold text-stone-900 font-serif leading-snug">
                          {m.title}
                        </h3>
                        <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                          {m.description}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
                      <span className="inline-flex items-center gap-1.5 text-stone-600 font-medium">
                        <Award className="w-3.5 h-3.5 text-amber-600" />
                        <span>Verified Achievement</span>
                      </span>
                      <span>{new Date(m.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CHAPTERS (BENTO GRID REDESIGN) */}
          {activeTab === 'chapters' && (
            <div className="space-y-6">
              {/* Bento Hero Header - Strict Minimalist Bento */}
              <div className="relative overflow-hidden bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                {/* Institutional St. Cecilia Crimson Architectural Top Trim */}
                <div className="h-1 absolute top-0 left-0 right-0 bg-[#8B181B]" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="max-w-2xl space-y-2">
                    <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
                      <span className="text-[#8B181B] font-bold">St. Cecilia's College</span>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span>Regional & Global Chapters</span>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span>Geographical Hubs</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 tracking-tight leading-tight">
                      Cecilian Chapters & Geographical Hubs
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      Official alumni community chapters organizing local meetups, mentorship cohorts, scholarships, and regional networking.
                    </p>
                  </div>

                  {permissions.canManageChapters && (
                    <button
                      onClick={() => setShowChapterModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-all shadow-[0_2px_8px_rgba(139,24,27,0.25)] cursor-pointer active:scale-95 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Charter Chapter</span>
                    </button>
                  )}
                </div>

                {/* Quick Metrics Strip */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-stone-200/70">
                  <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Chartered Hubs</span>
                    <span className="text-2xl font-bold text-stone-900 mt-1 block">{chapters.length}</span>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Official regions</span>
                  </div>
                  <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Enrolled Members</span>
                    <span className="text-2xl font-bold text-[#8B181B] mt-1 block">
                      {chapters.reduce((acc, c) => acc + (c.memberCount || 0), 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Network membership</span>
                  </div>
                  <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Lead Ambassadors</span>
                    <span className="text-2xl font-bold text-amber-800 mt-1 block">{chapters.length}</span>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Appointed leaders</span>
                  </div>
                  <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Accreditation</span>
                    <span className="text-2xl font-bold text-emerald-800 mt-1 block">100%</span>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Institutionally recognized</span>
                  </div>
                </div>
              </div>

              {/* Bento Chapters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {chapters.map((ch, idx) => (
                  <div
                    key={ch.id}
                    className={`group relative overflow-hidden bg-white rounded-2xl border border-stone-200/80 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-[#8B181B]/40 transition-all duration-200 flex flex-col justify-between ${
                      idx === 0 ? 'sm:col-span-2 lg:col-span-2 bg-gradient-to-br from-white via-rose-50/15 to-white' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B181B] bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200/70">
                          {ch.region}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 bg-stone-100/80 px-2.5 py-1 rounded-md">
                          <Users className="w-3.5 h-3.5 text-stone-500" />
                          <span>{ch.memberCount.toLocaleString()} members</span>
                        </div>
                      </div>

                      <div className="mt-3.5">
                        <h3 className="text-lg font-bold text-stone-900 font-serif group-hover:text-[#8B181B] transition-colors">
                          {ch.name}
                        </h3>
                        <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                          Official chartered regional community of St. Cecilia's College graduates.
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-stone-400 block text-[10px] font-medium uppercase tracking-wider">Chapter President / Lead</span>
                        <span className="font-semibold text-xs text-stone-900 block mt-0.5">{ch.leadName}</span>
                        <span className="text-[11px] text-stone-500 block truncate">{ch.leadEmail}</span>
                      </div>
                      <div className="w-9 h-9 rounded-xl bg-stone-100 flex items-center justify-center text-stone-500 group-hover:bg-[#8B181B] group-hover:text-white transition-colors shadow-2xs">
                        <MapPin className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: GALLERY (BENTO GRID REDESIGN) */}
          {activeTab === 'gallery' && (
            <div className="space-y-6">
              {/* Bento Hero Header - Strict Minimalist Bento */}
              <div className="relative overflow-hidden bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                {/* Institutional St. Cecilia Crimson Architectural Top Trim */}
                <div className="h-1 absolute top-0 left-0 right-0 bg-[#8B181B]" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="max-w-2xl space-y-2">
                    <div className="flex items-center gap-2 flex-wrap text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
                      <span className="text-[#8B181B] font-bold">St. Cecilia's College</span>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span>Institutional Heritage Archive</span>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span>Visual History</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 tracking-tight leading-tight">
                      Campus Visual Archive & Gallery
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                      Curated photography spanning commencement ceremonies, varsity athletic cups, jubilee celebrations, and campus architecture.
                    </p>
                  </div>

                  {permissions.canUploadGallery && (
                    <button
                      onClick={() => setShowGalleryUploadModal(true)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-all shadow-[0_2px_8px_rgba(139,24,27,0.25)] cursor-pointer active:scale-95 shrink-0"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload Photo</span>
                    </button>
                  )}
                </div>

                {/* Quick Metrics Strip */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-stone-200/70">
                  <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Archived Photos</span>
                    <span className="text-2xl font-bold text-stone-900 mt-1 block">{galleryItems.length}</span>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Curated historical prints</span>
                  </div>
                  <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Commencements</span>
                    <span className="text-2xl font-bold text-[#8B181B] mt-1 block">
                      {galleryItems.filter(g => g.category?.toLowerCase().includes('commencement') || g.category?.toLowerCase().includes('graduation')).length}
                    </span>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Graduation memories</span>
                  </div>
                  <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Historical Eras</span>
                    <span className="text-2xl font-bold text-amber-800 mt-1 block">
                      {new Set(galleryItems.map(g => g.year)).size} Years
                    </span>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">Documented milestones</span>
                  </div>
                  <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/60 shadow-2xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Resolution</span>
                    <span className="text-2xl font-bold text-emerald-800 mt-1 block">HD Curated</span>
                    <span className="text-[10px] text-stone-500 mt-0.5 block">100% Verified archive</span>
                  </div>
                </div>
              </div>

              {/* Bento Gallery Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {galleryItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`group relative overflow-hidden bg-white rounded-2xl border border-stone-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 flex flex-col justify-between ${
                      idx === 0 ? 'sm:col-span-2 lg:col-span-2' : ''
                    }`}
                  >
                    <div>
                      <div className={`relative w-full overflow-hidden bg-stone-100 ${idx === 0 ? 'h-64 sm:h-80' : 'h-52'}`}>
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-stone-950/20 to-transparent" />

                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-stone-900/80 text-white backdrop-blur-md border border-white/10 shadow-xs">
                            {item.category}
                          </span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#8B181B] text-white shadow-xs">
                            Class of {item.year}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 text-white">
                          <h4 className="text-base sm:text-lg font-bold font-serif tracking-tight text-white drop-shadow-xs line-clamp-1">
                            {item.title}
                          </h4>
                          {item.description && (
                            <p className="text-xs text-stone-200 line-clamp-2 mt-0.5 text-shadow-xs">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Shield className="w-3.5 h-3.5 text-[#8B181B]" />
                        <span className="truncate">Archived by {item.uploadedByName || 'Registrar'}</span>
                      </div>

                      {permissions.canUploadGallery && (
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${item.title}"?`)) {
                              deleteGalleryItem(item.id);
                            }
                          }}
                          className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* PROVISION USER MODAL */}
      {showCreateUserModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-stone-100 text-[#8B181B] rounded-lg">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-serif">Provision University Account</h3>
                  <p className="text-[11px] text-stone-500">Official Institutional Setup</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newUserName.trim() || !newUserEmail.trim()) return;
                createUserByAdmin({
                  name: newUserName.trim(),
                  email: newUserEmail.trim(),
                  password: newUserPassword || 'Password123!',
                  role: newUserRole,
                  department: newUserDepartment.trim() || undefined
                });
                setNewUserName('');
                setNewUserEmail('');
                setNewUserDepartment('');
                setShowCreateUserModal(false);
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Dr. Arthur Pendelton"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="name@stcecilia.edu"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Role *</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-semibold text-stone-800"
                  >
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                    <option value="registrar">Registrar</option>
                    <option value="staff">Staff</option>
                    <option value="moderator">Moderator</option>
                    <option value="employer">Employer</option>
                    <option value="alumni">Alumni</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Password *</label>
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Department</label>
                <input
                  type="text"
                  value={newUserDepartment}
                  onChange={(e) => setNewUserDepartment(e.target.value)}
                  placeholder="e.g. Office of Institutional Advancement"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-3.5 py-1.5 bg-stone-100 text-stone-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white font-semibold rounded-lg shadow-xs"
                >
                  Provision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MILESTONE MODAL */}
      {showMilestoneModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md p-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold font-serif text-stone-900">Publish Alumni Milestone</h3>
              <button onClick={() => setShowMilestoneModal(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="mt-3 space-y-3">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Select Alumnus *</label>
                <select
                  value={mAlumnusId}
                  onChange={(e) => setMAlumnusId(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
                >
                  <option value="">Choose alumnus...</option>
                  {users.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.name} (Batch {u.batch})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Category</label>
                <select
                  value={mCategory}
                  onChange={(e) => setMCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700"
                >
                  <option value="promotion">Executive Promotion</option>
                  <option value="startup">Startup Founding & Funding</option>
                  <option value="award">Industry / Civic Award</option>
                  <option value="publication">Research Publication</option>
                  <option value="honor">Institutional Honor</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Headline *</label>
                <input
                  type="text"
                  required
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  placeholder="e.g. Appointed Chief Technology Officer"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Company / Organization</label>
                <input
                  type="text"
                  value={mCompany}
                  onChange={(e) => setMCompany(e.target.value)}
                  placeholder="e.g. Stripe, Stanford, Tesla"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  value={mDescription}
                  onChange={(e) => setMDescription(e.target.value)}
                  placeholder="Share details of the achievement..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-3 py-1.5 bg-stone-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#8B181B] text-white font-semibold rounded-lg shadow-xs"
                >
                  Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHAPTER MODAL */}
      {showChapterModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md p-5 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="text-sm font-bold font-serif text-stone-900">Charter Regional Chapter</h3>
              <button onClick={() => setShowChapterModal(false)} className="text-stone-400 hover:text-stone-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateChapter} className="mt-3 space-y-3">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Chapter Name *</label>
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="e.g. Austin Regional Chapter"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Region / Location *</label>
                <input
                  type="text"
                  required
                  value={cRegion}
                  onChange={(e) => setCRegion(e.target.value)}
                  placeholder="e.g. Texas, USA"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Chapter President Name *</label>
                <input
                  type="text"
                  required
                  value={cLeadName}
                  onChange={(e) => setCLeadName(e.target.value)}
                  placeholder="Alumni President Name"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Lead Email</label>
                <input
                  type="email"
                  value={cLeadEmail}
                  onChange={(e) => setCLeadEmail(e.target.value)}
                  placeholder="lead@stcecilia.edu"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowChapterModal(false)}
                  className="px-3 py-1.5 bg-stone-100 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#8B181B] text-white font-semibold rounded-lg shadow-xs"
                >
                  Charter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GALLERY UPLOAD MODAL */}
      {showGalleryUploadModal && permissions.canUploadGallery && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-stone-100 text-[#8B181B] rounded-lg">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-stone-900 font-serif">Upload Archival Photo</h3>
                  <p className="text-[11px] text-stone-500">Curated Campus Collection</p>
                </div>
              </div>
              <button
                onClick={() => setShowGalleryUploadModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!galTitle.trim() || !galUrl.trim()) return;
                addGalleryItem({
                  title: galTitle.trim(),
                  category: galCategory,
                  year: galYear.trim() || '2026',
                  url: galUrl.trim(),
                  description: galDesc.trim() || undefined
                });
                setGalTitle('');
                setGalUrl('');
                setGalDesc('');
                setGalPhotoFileName('');
                setGalPhotoError('');
                setShowGalDirectUrlInput(false);
                setShowGalleryUploadModal(false);
              }}
              className="mt-4 space-y-3"
            >
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Photo Title *</label>
                <input
                  type="text"
                  required
                  value={galTitle}
                  onChange={(e) => setGalTitle(e.target.value)}
                  placeholder="e.g. Quadrangle Heritage Arbor"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Category *</label>
                  <select
                    value={galCategory}
                    onChange={(e) => setGalCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                  >
                    <option value="campus">Campus & Facilities</option>
                    <option value="commencement">Commencement & Honors</option>
                    <option value="homecoming">Homecoming & Gala</option>
                    <option value="heritage">Heritage Archives</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Year / Era *</label>
                  <input
                    type="text"
                    required
                    value={galYear}
                    onChange={(e) => setGalYear(e.target.value)}
                    placeholder="2026"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg"
                  />
                </div>
              </div>

              {/* Photo Upload (Direct to Database) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-700 block mb-1 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-[#8B181B]" />
                    <span>Upload Archival Photo *</span>
                    <span className="text-[10px] font-normal text-stone-500">(Saved to database)</span>
                  </label>
                  {!showGalDirectUrlInput ? (
                    <button
                      type="button"
                      onClick={() => setShowGalDirectUrlInput(true)}
                      className="text-[11px] text-stone-500 hover:text-[#8B181B] underline cursor-pointer"
                    >
                      Paste link instead
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowGalDirectUrlInput(false)}
                      className="text-[11px] text-stone-500 hover:text-[#8B181B] underline cursor-pointer"
                    >
                      Use photo uploader
                    </button>
                  )}
                </div>

                {galPhotoError && (
                  <div className="p-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-red-600" />
                    <span>{galPhotoError}</span>
                  </div>
                )}

                {galUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-stone-200 bg-stone-100 shadow-2xs">
                    <img
                      src={galUrl}
                      alt="Archival photo preview"
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute top-2 left-2 px-2 py-0.5 bg-emerald-900/85 backdrop-blur-xs text-white rounded-md text-[10px] font-semibold flex items-center gap-1 shadow-sm">
                      <Check className="w-3 h-3 text-emerald-300 stroke-[2.5]" />
                      <span>Ready for Database</span>
                    </div>
                    {galPhotoFileName && (
                      <div className="absolute bottom-2 left-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white rounded-md text-[10px] truncate">
                        {galPhotoFileName}
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => galPhotoFileInputRef.current?.click()}
                        className="px-2 py-1 bg-white/95 hover:bg-white text-stone-800 rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3 text-[#8B181B]" />
                        <span>Replace Photo</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGalUrl('');
                          setGalPhotoFileName('');
                          if (galPhotoFileInputRef.current) galPhotoFileInputRef.current.value = '';
                        }}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1 cursor-pointer"
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
                      setIsDraggingGalPhoto(true);
                    }}
                    onDragLeave={() => setIsDraggingGalPhoto(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingGalPhoto(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleGalPhotoUpload(file);
                    }}
                    onClick={() => galPhotoFileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                      isDraggingGalPhoto
                        ? 'border-[#8B181B] bg-red-50/70 ring-2 ring-red-200'
                        : 'border-stone-300 bg-stone-50 hover:bg-stone-100/80 hover:border-stone-400'
                    }`}
                  >
                    <input
                      ref={galPhotoFileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleGalPhotoUpload(file);
                      }}
                    />

                    {isProcessingGalPhoto ? (
                      <div className="py-2 flex flex-col items-center justify-center gap-1.5 text-stone-600">
                        <Loader2 className="w-5 h-5 animate-spin text-[#8B181B]" />
                        <span className="text-xs font-medium">Optimizing photo for database storage...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-1">
                        <div className="w-9 h-9 rounded-full bg-red-50 text-[#8B181B] border border-red-100 flex items-center justify-center mb-1.5 shadow-2xs">
                          <Upload className="w-4 h-4 stroke-[1.75]" />
                        </div>
                        <span className="text-xs font-bold text-stone-800">
                          Click to upload archival photo or drag & drop
                        </span>
                        <span className="text-[10px] text-stone-500 mt-0.5">
                          PNG, JPG, or WebP. Uploaded directly to database.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {showGalDirectUrlInput && (
                  <div className="pt-1.5 animate-in fade-in duration-150">
                    <input
                      type="url"
                      value={galUrl}
                      onChange={(e) => {
                        setGalUrl(e.target.value);
                        setGalPhotoFileName('');
                      }}
                      placeholder="Or enter direct photo link: https://..."
                      className="w-full px-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-[#8B181B] outline-none"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={galDesc}
                  onChange={(e) => setGalDesc(e.target.value)}
                  placeholder="Brief archival description..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg resize-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowGalleryUploadModal(false)}
                  className="px-3.5 py-1.5 bg-stone-100 text-stone-700 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white font-semibold rounded-lg shadow-xs"
                >
                  Publish Photo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
