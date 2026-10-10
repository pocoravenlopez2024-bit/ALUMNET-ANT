/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  Loader2,
  Search,
  Bell,
  MessageSquare,
  Settings as SettingsIcon,
  LogOut,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  RefreshCw,
  Clock,
  Layers,
  Activity,
  Sliders,
  Radio,
  SlidersHorizontal,
  FileSpreadsheet,
  CheckCircle2,
  HelpCircle,
  TrendingUp,
  Download,
  Filter,
  Eye,
  ArrowRight,
  Scale,
  Moon,
  Sun,
  ScanFace
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlumni, STORAGE_KEYS } from '../../context/AlumniContext';
import { useTheme } from '../../lib/theme';
import { UserRole, UserProfile } from '../../types';
import { AdminDashboardOverview } from './AdminDashboardOverview';
import { AdminUsersTable } from './AdminUsersTable';
import { RegistrarRegistryMatcher } from './RegistrarRegistryMatcher';
import { AdminRequestsAndConflictsView } from './AdminRequestsAndConflictsView';
import { AdminAnnouncementsManager } from './AdminAnnouncementsManager';
import { AdminEventsManager } from './AdminEventsManager';
import { AdminEmployersAndJobsView } from './AdminEmployersAndJobsView';
import { AdminCampusGalleryView } from './AdminCampusGalleryView';
import { AdminGovernancePoliciesView } from './AdminGovernancePoliciesView';
import { AuditLogView } from './AuditLogView';
import { EmployerDashboardView } from '../opportunities/EmployerDashboardView';
import { MessagesView } from '../messages/MessagesView';
import { SettingsView } from '../settings/SettingsView';
import { ProfileView } from '../profile/ProfileView';
import { AdminCommandBar } from './AdminCommandBar';
import { AdminQuickActionBar } from './AdminQuickActionBar';
import { getRegistrationConflicts } from '../../services/studentVerificationService';
import { exportAlumniRosterCsv } from '../../services/adminExportService';
import { compressImage } from '../../lib/utils';
import { getUserAvatar, handleUserAvatarError } from '../../lib/defaultImages';

export type WorkspaceModuleId =
  | 'dashboard'
  | 'users'
  | 'registry'
  | 'conflicts'
  | 'jobs'
  | 'employer_portal'
  | 'announcements'
  | 'events'
  | 'attendance'
  | 'milestones'
  | 'chapters'
  | 'gallery'
  | 'governance'
  | 'audit'
  | 'automations'
  | 'messages'
  | 'settings'
  | 'profile';

interface AdminWorkspaceLayoutProps {
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onGoToLanding?: () => void;
}

export const AdminWorkspaceLayout: React.FC<AdminWorkspaceLayoutProps> = ({
  onOpenAuth,
  onGoToLanding
}) => {
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
    opportunities,
    announcements,
    events,
    syncAllDataToCloud,
    isFirestoreSyncing,
    showToast,
    logout,
    updateUserRole,
    activeTab,
    setActiveTab,
    chats
  } = useAlumni();

  // Internal workspace sub-module navigation
  const [currentModule, setCurrentModule] = useState<WorkspaceModuleId>(() => {
    if (activeTab === 'employer_portal') return 'employer_portal';
    if (activeTab === 'settings') return 'settings';
    if (activeTab === 'profile') return 'profile';
    if (activeTab === 'messages') return 'messages';
    return 'dashboard';
  });

  const [jobSubTab, setJobSubTab] = useState<'jobs' | 'employers'>('jobs');
  const [conflictSubTab, setConflictSubTab] = useState<'requests' | 'conflicts'>('conflicts');

  // Keep in sync with parent activeTab if switched externally
  useEffect(() => {
    if (activeTab === 'employer_portal' && currentModule !== 'employer_portal') {
      setCurrentModule('employer_portal');
    } else if (activeTab === 'settings' && currentModule !== 'settings') {
      setCurrentModule('settings');
    } else if (activeTab === 'profile' && currentModule !== 'profile') {
      setCurrentModule('profile');
    } else if (activeTab === 'messages' && currentModule !== 'messages') {
      setCurrentModule('messages');
    }
  }, [activeTab]);

  // Automatic retract and proximity auto-expand state (no manual toggle button required)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState<boolean>(false);
  const isSidebarCollapsed = !isSidebarExpanded;
  const isEffectiveExpanded = isSidebarExpanded;
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const expandSidebar = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setIsSidebarExpanded(true);
  }, []);

  const retractSidebar = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
    }
    leaveTimerRef.current = setTimeout(() => {
      setIsSidebarExpanded(false);
    }, 200);
  }, []);

  // Proximity detection: when mouse cursor is near the left edge (<= 120px) auto-expand,
  // and when cursor moves away (> 260px) auto-retract
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (typeof window === 'undefined' || window.innerWidth < 1024) return;
      if (e.clientX <= 120) {
        expandSidebar();
      } else if (e.clientX > 260 && isSidebarExpanded) {
        retractSidebar();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, [expandSidebar, retractSidebar, isSidebarExpanded]);

  // Keyboard shortcut listener: [ or Cmd+B / Ctrl+B toggles sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = (document.activeElement as HTMLElement)?.tagName;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag) || (document.activeElement as HTMLElement)?.isContentEditable;
      if (isInput) return;

      if (((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'b') || e.key === '[') {
        e.preventDefault();
        setIsSidebarExpanded((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);


  // Mobile drawer state
  const [showMobileNav, setShowMobileNav] = useState(false);

  // Command bar modal state
  const [showCommandBar, setShowCommandBar] = useState(false);

  // Create User Modal state
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('Password123!');
  const [newUserRole, setNewUserRole] = useState<UserRole>('admin');
  const [newUserDepartment, setNewUserDepartment] = useState('');

  // Milestone Modal state
  const [showMilestoneModal, setShowMilestoneModal] = useState(false);
  const [mAlumnusId, setMAlumnusId] = useState('');
  const [mTitle, setMTitle] = useState('');
  const [mCategory, setMCategory] = useState<'promotion' | 'startup' | 'award' | 'publication' | 'honor'>('promotion');
  const [mCompany, setMCompany] = useState('');
  const [mDescription, setMDescription] = useState('');

  // Chapter Modal state
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [cName, setCName] = useState('');
  const [cRegion, setCRegion] = useState('');
  const [cLeadName, setCLeadName] = useState('');
  const [cLeadEmail, setCLeadEmail] = useState('');

  // Universal Theme Hook
  const { isDark, toggleTheme } = useTheme();

  // Gallery Upload Modal state
  const [showGalleryUploadModal, setShowGalleryUploadModal] = useState(false);
  const [galTitle, setGalTitle] = useState('');
  const [galCategory, setGalCategory] = useState<'campus' | 'homecoming' | 'commencement' | 'heritage'>('campus');
  const [galYear, setGalYear] = useState('2026');
  const [galUrl, setGalUrl] = useState('');
  const [galDesc, setGalDesc] = useState('');
  const [galPhotoFileName, setGalPhotoFileName] = useState('');
  const [isProcessingGalPhoto, setIsProcessingGalPhoto] = useState(false);
  const [galPhotoError, setGalPhotoError] = useState('');
  const galPhotoFileInputRef = useRef<HTMLInputElement>(null);

  // Role preview switcher state
  const [showRoleSwitcher, setShowRoleSwitcher] = useState(false);

  // Profile menu state
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Pending counts computation
  const pendingConflictsCount = useMemo(() => {
    try {
      return getRegistrationConflicts().filter((c) => c.status === 'pending').length;
    } catch {
      return 0;
    }
  }, [currentModule]);

  const pendingJobsCount = useMemo(() => {
    return (opportunities || []).filter(
      (o) => o.approvalStatus === 'pending_approval' || (o as any).status === 'pending_approval'
    ).length;
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

  // Unread messages count
  const unreadMessagesCount = useMemo(() => {
    if (!currentUser || !chats) return 0;
    return chats.reduce((acc, chat) => {
      if (!chat || !chat.unreadCount) return acc;
      return acc + (chat.unreadCount[currentUser.uid] || 0);
    }, 0);
  }, [chats, currentUser]);

  // Handle Photo Upload for Gallery
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

  const handleCreateUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim()) {
      showToast('Name and institutional email are required', 'error');
      return;
    }
    createUserByAdmin({
      name: newUserName.trim(),
      email: newUserEmail.trim(),
      password: newUserPassword,
      role: newUserRole,
      department: newUserDepartment.trim() || 'Institutional Operations'
    });
    setNewUserName('');
    setNewUserEmail('');
    setNewUserDepartment('');
    setShowCreateUserModal(false);
    showToast(`Created new ${newUserRole} account successfully`, 'success');
  };

  const handleExportCsv = () => {
    exportAlumniRosterCsv(users, 'st_cecilia_official_alumni_roster');
    showToast(`Exported ${users.length} verified records to CSV!`, 'success');
  };

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mAlumnusId || !mTitle.trim() || !mDescription.trim()) {
      showToast('Please fill out all required fields', 'error');
      return;
    }
    const alumnus = users.find((u) => u.uid === mAlumnusId);
    if (!alumnus) return;

    createMilestone({
      alumnusId: alumnus.uid,
      alumnusName: alumnus.name,
      alumnusAvatar: getUserAvatar(alumnus.profilePictureUrl),
      title: mTitle.trim(),
      category: mCategory,
      companyOrOrg: mCompany.trim() || undefined,
      description: mDescription.trim()
    });

    showToast('Milestone successfully published to the alumni hall of fame!', 'success');
    setShowMilestoneModal(false);
    setMAlumnusId('');
    setMTitle('');
    setMCompany('');
    setMDescription('');
  };

  const handleCreateChapter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName.trim() || !cRegion.trim() || !cLeadName.trim()) {
      showToast('Please fill out all required fields', 'error');
      return;
    }
    createChapter({
      name: cName.trim(),
      region: cRegion.trim(),
      leadName: cLeadName.trim(),
      leadEmail: cLeadEmail.trim() || `${cLeadName.toLowerCase().replace(/\s+/g, '')}@alumni.stcecilia.edu`,
      memberCount: 1
    });
    showToast(`Chartered ${cName}!`, 'success');
    setShowChapterModal(false);
    setCName('');
    setCRegion('');
    setCLeadName('');
    setCLeadEmail('');
  };

  // Keyboard shortcut listener: Cmd/Ctrl + K opens Command Bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandBar((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format current role display label
  const roleDisplayInfo = useMemo(() => {
    const role = currentUser?.role || 'admin';
    switch (role) {
      case 'superadmin':
        return {
          title: 'Super Administrator',
          subtitle: 'Institutional Executive Console',
          badgeColor: 'bg-purple-100 text-purple-900 border-purple-200'
        };
      case 'admin':
        return {
          title: 'Administrator',
          subtitle: 'Institutional Advancement & Operations',
          badgeColor: 'bg-red-100 text-[#8B181B] border-red-200'
        };
      case 'registrar':
        return {
          title: 'Office of the Registrar',
          subtitle: 'Official Academic Records & Degree Verifications',
          badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-200'
        };
      case 'employer':
        return {
          title: 'Employer Partner',
          subtitle: 'Talent Acquisition & Career Pipeline',
          badgeColor: 'bg-sky-100 text-sky-900 border-sky-200'
        };
      case 'staff':
        return {
          title: 'Academic Staff Officer',
          subtitle: 'Campus Operations & Event Logistics',
          badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200'
        };
      case 'moderator':
        return {
          title: 'Moderation Officer',
          subtitle: 'Community Standards & Job Approvals',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-200'
        };
      default:
        return {
          title: 'Administrative Staff',
          subtitle: 'System Operations & Services',
          badgeColor: 'bg-stone-100 text-stone-900 border-stone-200'
        };
    }
  }, [currentUser?.role]);

  // Sidebar navigation sections tailored to role and permissions
  const navSections = useMemo(() => {
    const isEmployer = currentUser?.role === 'employer';
    const isRegistrar = currentUser?.role === 'registrar';
    const isStaff = currentUser?.role === 'staff';
    const isModerator = currentUser?.role === 'moderator';

    return [
      {
        heading: 'Core Administration',
        items: [
          {
            id: 'dashboard' as WorkspaceModuleId,
            label: isEmployer ? 'Hiring Overview' : 'Command Center',
            shortLabel: 'Overview',
            icon: LayoutDashboard,
            badge: null,
            visible: true
          },
          {
            id: 'users' as WorkspaceModuleId,
            label: 'Alumni Directory',
            shortLabel: 'Directory',
            icon: Users,
            badge: null,
            visible: true
          },
          {
            id: 'messages' as WorkspaceModuleId,
            label: 'Direct Messages',
            shortLabel: 'Messages',
            icon: MessageSquare,
            badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
            badgeColor: 'bg-red-100 text-[#8B181B] border border-red-200 font-bold',
            visible: true
          },
          {
            id: 'registry' as WorkspaceModuleId,
            label: 'Registrar Registry',
            shortLabel: 'Registry',
            icon: GraduationCap,
            badge: null,
            visible: permissions.canAccessRegistry
          },
          {
            id: 'conflicts' as WorkspaceModuleId,
            label: 'Requests & Conflicts',
            shortLabel: 'Triage',
            icon: ShieldCheck,
            badge: totalRequestsCount > 0 ? totalRequestsCount : null,
            badgeColor: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
            visible: !isStaff && (permissions.canAccessConflictResolution || permissions.canAccessRegistry || currentUser?.role === 'admin' || currentUser?.role === 'superadmin')
          }
        ].filter((i) => i.visible)
      },
      {
        heading: isEmployer ? 'Talent & Opportunities' : 'Engagement & Programs',
        items: [
          ...(isEmployer
            ? [
                {
                  id: 'employer_portal' as WorkspaceModuleId,
                  label: 'My Job Postings',
                  shortLabel: 'Jobs',
                  icon: Briefcase,
                  badge: null,
                  visible: true
                }
              ]
            : [
                {
                  id: 'jobs' as WorkspaceModuleId,
                  label: 'Jobs & Employers',
                  shortLabel: 'Careers',
                  icon: Briefcase,
                  badge: (pendingJobsCount + pendingEmployersCount) > 0 ? (pendingJobsCount + pendingEmployersCount) : null,
                  badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
                  visible: permissions.canManageJobModeration || permissions.canAccessEmployerAccreditation || isModerator
                }
              ]),
          {
            id: 'announcements' as WorkspaceModuleId,
            label: 'Announcements',
            shortLabel: 'Notices',
            icon: Megaphone,
            badge: null,
            visible: permissions.canPostAnnouncements || isStaff || isRegistrar
          },
          {
            id: 'events' as WorkspaceModuleId,
            label: 'Events & Reunions',
            shortLabel: 'Events',
            icon: Calendar,
            badge: null,
            visible: permissions.canCreateEvents || isStaff || isRegistrar
          },
          {
            id: 'milestones' as WorkspaceModuleId,
            label: 'Alumni Milestones',
            shortLabel: 'Milestones',
            icon: Award,
            badge: milestones.length > 0 ? milestones.length : null,
            visible: true
          },
          {
            id: 'chapters' as WorkspaceModuleId,
            label: 'Chapters & Hubs',
            shortLabel: 'Chapters',
            icon: MapPin,
            badge: chapters.length > 0 ? chapters.length : null,
            visible: true
          },
          {
            id: 'gallery' as WorkspaceModuleId,
            label: 'Campus Gallery',
            shortLabel: 'Gallery',
            icon: ImageIcon,
            badge: null,
            visible: permissions.canUploadGallery || currentUser?.role === 'admin' || currentUser?.role === 'superadmin'
          }
        ].filter((i) => i.visible)
      },
      {
        heading: 'System & Intelligence',
        items: [
          {
            id: 'audit' as WorkspaceModuleId,
            label: 'System Audit Logs',
            shortLabel: 'Audit',
            icon: FileText,
            badge: null,
            visible: permissions.canAccessAuditTrails || currentUser?.role === 'admin' || currentUser?.role === 'superadmin'
          },
          {
            id: 'governance' as WorkspaceModuleId,
            label: 'Governance Policies',
            shortLabel: 'Policies',
            icon: Scale,
            badge: null,
            visible: permissions.canAccessGovernance || currentUser?.role === 'superadmin'
          },
          {
            id: 'automations' as WorkspaceModuleId,
            label: 'Automations & Sync',
            shortLabel: 'Automations',
            icon: Bot,
            badge: null,
            visible: currentUser?.role === 'superadmin' || currentUser?.role === 'admin'
          },
          {
            id: 'settings' as WorkspaceModuleId,
            label: 'Console Settings',
            shortLabel: 'Settings',
            icon: SettingsIcon,
            badge: null,
            visible: true
          }
        ].filter((i) => i.visible)
      }
    ];
  }, [
    currentUser?.role,
    permissions,
    totalRequestsCount,
    pendingJobsCount,
    pendingEmployersCount,
    unreadMessagesCount
  ]);

  // Current section title for breadcrumbs
  const currentSectionName = useMemo(() => {
    for (const sec of navSections) {
      const match = sec.items.find((item) => item.id === currentModule);
      if (match) return match.label;
    }
    if (currentModule === 'profile') return 'Administrator Profile';
    return 'Console Overview';
  }, [navSections, currentModule]);

  // Click-outside listener for profile menu
  useEffect(() => {
    const handleDismiss = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-profile-dropdown]')) return;
      setShowProfileMenu(false);
    };
    const handleCustomDismiss = () => {
      setShowProfileMenu(false);
    };
    window.addEventListener('click', handleDismiss);
    window.addEventListener('applet:dismiss-hover', handleCustomDismiss);
    return () => {
      window.removeEventListener('click', handleDismiss);
      window.removeEventListener('applet:dismiss-hover', handleCustomDismiss);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F9FAFB] dark:bg-[#121316] flex flex-col font-sans text-stone-900 dark:text-stone-100 antialiased selection:bg-[#8B181B] selection:text-white">
      {/* ========================================================
          ADMINISTRATIVE TOP BAR CONTRACT (Zone 1: Brand Wordmark, Zone 2: Breadcrumbs & Omnibar, Zone 3: Live Sync, Role Badge, Actions)
          ======================================================== */}
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#181615]/95 backdrop-blur-md border-b border-stone-200/90 dark:border-stone-800 shadow-2xs pt-safe">
        {/* Institutional St. Cecilia Crimson Accent Line */}
        <div className="h-[2px] w-full bg-[#8B181B] absolute bottom-0 left-0 right-0 pointer-events-none" />
        <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Zone 1: Institutional Brand Lockup */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setShowMobileNav(true)}
              className="lg:hidden p-2 -ml-1 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              aria-label="Open administrative navigation drawer"
            >
              <Menu className="w-5 h-5 stroke-[1.75]" />
            </button>

            <div
              onClick={() => setCurrentModule('dashboard')}
              className="flex items-center gap-3 cursor-pointer group select-none"
              title="Return to Executive Overview"
            >
              <img
                src="/assets/cecilians-seal.jpg"
                alt="St. Cecilia's College Official Seal"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-stone-200/80 dark:border-stone-700 shadow-2xs shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 tracking-tight font-sans group-hover:text-[#8B181B] dark:group-hover:text-red-400 transition-colors">
                    St. Cecilia's College
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                    Console
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium -mt-0.5">
                  Institutional Management & Identity Desk
                </p>
              </div>
            </div>
          </div>

          {/* Zone 2: Breadcrumb Location & Command Palette Search */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-xl mx-4">
            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-medium shrink-0">
              <span className="text-stone-400 dark:text-stone-500">Admin</span>
              <span>/</span>
              <span className="text-stone-900 dark:text-stone-100 font-semibold">{currentSectionName}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowCommandBar(true)}
              className="flex-1 flex items-center justify-between px-3.5 py-1.5 bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 rounded-xl border border-stone-200 dark:border-stone-700 text-xs transition-colors cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 stroke-[1.75]" />
                <span className="text-stone-400 dark:text-stone-500">Search roster, registry, notices...</span>
              </div>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-stone-700 text-stone-500 dark:text-stone-300 border border-stone-200 dark:border-stone-600 rounded">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Zone 3: Profile & Primary Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Mobile Quick Search Button */}
            <button
              type="button"
              onClick={() => setShowCommandBar(true)}
              className="md:hidden p-2 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer border border-stone-200/80 dark:border-stone-700 shadow-2xs"
              aria-label="Search Console"
              title="Search Console (⌘K)"
            >
              <Search className="w-4 h-4 stroke-[1.75]" />
            </button>

            {/* Sync Database with Cloud Button */}
            <button
              type="button"
              onClick={() => syncAllDataToCloud()}
              disabled={isFirestoreSyncing}
              title="Synchronize database with Firestore cloud"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
            >
              <Loader2 className={`w-3.5 h-3.5 ${isFirestoreSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isFirestoreSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>

            {/* Export Roster CSV Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              title="Export Alumni Roster as CSV spreadsheet"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold transition-all cursor-pointer border border-stone-200 dark:border-stone-700 shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 rotate-180" />
              <span>Export Roster</span>
            </button>

            {/* Universal Quick Theme Toggle (Light / Dark Mode) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer border border-stone-200/80 dark:border-stone-700 shadow-2xs"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle Dark/Light Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 stroke-[1.75]" />
              ) : (
                <Moon className="w-4 h-4 text-stone-600 dark:text-stone-300 stroke-[1.75]" />
              )}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative" data-profile-dropdown="true">
              <button
                type="button"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <img
                  src={getUserAvatar(currentUser?.profilePictureUrl)}
                  onError={handleUserAvatarError}
                  alt={currentUser?.name || 'Administrator'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-stone-200 dark:border-stone-700 shadow-2xs"
                />
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#1c1917] rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <div className="px-3.5 py-2 border-b border-stone-100 dark:border-stone-800">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{currentUser?.name}</p>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate">{currentUser?.email}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold text-[#8B181B] dark:text-red-400 uppercase tracking-wider">
                      {roleDisplayInfo.title}
                    </span>
                  </div>

                  <div className="p-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => setCurrentModule('profile')}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <Users className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 stroke-[1.75]" />
                      <span>Executive Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentModule('settings')}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 stroke-[1.75]" />
                      <span>Console Settings</span>
                    </button>

                    {onGoToLanding && (
                      <button
                        type="button"
                        onClick={onGoToLanding}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 stroke-[1.75]" />
                        <span>Visit Public Landing Page</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        window.dispatchEvent(new CustomEvent('applet:lock-dashboard'));
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2 cursor-pointer font-medium"
                      title="Lock dashboard with Face Detection protection"
                    >
                      <ScanFace className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 stroke-[1.75]" />
                      <span>Lock Dashboard (Face ID)</span>
                    </button>

                    <div className="border-t border-stone-100 dark:border-stone-800 my-1" />
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        if (onOpenAuth) onOpenAuth('login');
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 flex items-center gap-2 cursor-pointer font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5 stroke-[1.75]" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

        </div>
      </header>

      {/* ========================================================
          MAIN WORKSPACE LAYOUT (Left Administrative Sidebar + Main Viewport)
          ======================================================== */}
      <div className="flex-1 flex w-full items-start">
        
        {/* ======================================================
            DESKTOP ADMINISTRATIVE SIDEBAR (PINNED / COLLAPSED / HOVER PEEK)
            ====================================================== */}
        <aside
          onMouseEnter={expandSidebar}
          onMouseLeave={retractSidebar}
          className={`hidden lg:flex shrink-0 sticky top-16 h-[calc(100dvh-4rem)] flex-col border-r border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#181615] transition-[width] duration-250 ease-out select-none z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
            isSidebarCollapsed ? 'w-16' : 'w-60'
          }`}
        >
          {/* Header of Sidebar: Role Context Box (Clean, simple, no expand button) */}
          <div className={`h-14 px-3 border-b border-stone-100 dark:border-stone-800/80 flex items-center overflow-hidden transition-all duration-200 ${
            isSidebarCollapsed ? 'justify-center' : 'gap-2.5 justify-start'
          }`}>
            <img
              src="/assets/cecilians-seal.jpg"
              alt="SCC"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-stone-200/60 dark:ring-stone-700"
            />
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B181B] dark:text-red-400 block truncate">
                  {roleDisplayInfo.title}
                </span>
                <span className="text-xs text-stone-400 dark:text-stone-500 block truncate">
                  {roleDisplayInfo.subtitle}
                </span>
              </div>
            )}
          </div>

          {/* Navigation Links Scroll Container */}
          <div className="flex-1 overflow-y-auto px-2 py-2.5 space-y-4 scrollbar-none">
            {navSections.map((section, idx) => (
              <div key={idx} className="space-y-1">
                {!isSidebarCollapsed && (
                  <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 block pb-1">
                    {section.heading}
                  </span>
                )}
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentModule === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setCurrentModule(item.id);
                        if (item.id === 'employer_portal') setActiveTab('employer_portal');
                        else if (item.id === 'messages') setActiveTab('messages');
                        else if (item.id === 'settings') setActiveTab('settings');
                        else if (item.id === 'profile') setActiveTab('profile');
                        else setActiveTab('admin');
                      }}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#8B181B] text-white font-semibold shadow-xs'
                          : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100/80 dark:hover:bg-stone-800/70'
                      } ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between'}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 stroke-[1.75] ${isActive ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`} />
                        {!isSidebarCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>

                      {!isSidebarCollapsed && item.badge !== null && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : (item as any).badgeColor || 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer of Sidebar: Quick Add & User Identity */}
          <div className="p-2 border-t border-stone-100 dark:border-stone-800/80 space-y-1.5">
            {!isSidebarCollapsed && permissions.canAssignRoles && (
              <button
                type="button"
                onClick={() => setShowCreateUserModal(true)}
                className="w-full flex items-center justify-center gap-2 py-1.5 px-3 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2]" />
                <span>Add Member</span>
              </button>
            )}

            <div
              onClick={() => setCurrentModule('profile')}
              className={`flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-stone-100/80 dark:hover:bg-stone-800/60 transition-colors cursor-pointer ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
              title={isSidebarCollapsed ? currentUser?.name || 'Administrator' : undefined}
            >
              <img
                src={getUserAvatar(currentUser?.profilePictureUrl)}
                onError={handleUserAvatarError}
                alt={currentUser?.name}
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-stone-200 dark:border-stone-700 shrink-0"
              />
              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">{currentUser?.name}</p>
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 capitalize truncate">{currentUser?.role}</p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ======================================================
            MOBILE NAVIGATION DRAWER
            ====================================================== */}
        <AnimatePresence>
          {showMobileNav && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileNav(false)}
                className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs z-50 lg:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-[#181615] z-50 lg:hidden flex flex-col shadow-2xl border-r border-stone-200 dark:border-stone-800"
              >
                <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/assets/cecilians-seal.jpg"
                      alt="St. Cecilia's Seal"
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover border border-stone-200 dark:border-stone-700"
                    />
                    <div>
                      <div className="font-extrabold text-sm text-stone-900 dark:text-stone-100">St. Cecilia's Console</div>
                      <div className="text-[10px] font-bold text-[#8B181B] dark:text-red-400 uppercase">{roleDisplayInfo.title}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMobileNav(false)}
                    className="p-1.5 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                  >
                    <X className="w-5 h-5 stroke-[1.75]" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-4">
                  {navSections.map((sec, idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-stone-400 dark:text-stone-500 block pb-1">
                        {sec.heading}
                      </span>
                      {sec.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentModule === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setCurrentModule(item.id);
                              if (item.id === 'employer_portal') setActiveTab('employer_portal');
                              else if (item.id === 'messages') setActiveTab('messages');
                              else if (item.id === 'settings') setActiveTab('settings');
                              else if (item.id === 'profile') setActiveTab('profile');
                              else setActiveTab('admin');
                              setShowMobileNav(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer ${
                              isActive
                                ? 'bg-[#8B181B] text-white font-bold'
                                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4 stroke-[1.75]" />
                              <span>{item.label}</span>
                            </div>
                            {item.badge !== null && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="p-3 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      if (onOpenAuth) onOpenAuth('login');
                    }}
                    className="w-full py-2 px-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 stroke-[1.75]" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* ======================================================
            PRIMARY ADMINISTRATIVE CONTENT VIEWPORT
            ====================================================== */}
        <main className="flex-1 min-w-0 w-full max-w-full px-3 sm:px-6 lg:px-8 py-6">
          <div className="w-full max-w-[1760px] 2xl:max-w-[1920px] mx-auto animate-in fade-in duration-200">
            
            {/* MODULE: Dashboard Overview (REFERENCE DESIGN) */}
            {currentModule === 'dashboard' && (
              currentUser?.role === 'employer' ? (
                <EmployerDashboardView onInitiateJobPost={() => setCurrentModule('employer_portal')} />
              ) : (
                <AdminDashboardOverview
                  onNavigateTab={(tab) => {
                    if (tab === 'users') setCurrentModule('users');
                    else if (tab === 'registry') setCurrentModule('registry');
                    else if (tab === 'governance') {
                      setCurrentModule('governance');
                    }
                    else if (tab === 'conflicts') {
                      setConflictSubTab('conflicts');
                      setCurrentModule('conflicts');
                    }
                    else if (tab === 'requests') {
                      setConflictSubTab('requests');
                      setCurrentModule('conflicts');
                    }
                    else if (tab === 'jobs') {
                      setJobSubTab('jobs');
                      setCurrentModule('jobs');
                    }
                    else if (tab === 'employers') {
                      setJobSubTab('employers');
                      setCurrentModule('jobs');
                    }
                    else if (tab === 'announcements') setCurrentModule('announcements');
                    else if (tab === 'events' || tab === 'attendance') setCurrentModule('events');
                    else if (tab === 'milestones') setCurrentModule('milestones');
                    else if (tab === 'chapters') setCurrentModule('chapters');
                    else if (tab === 'automations') setCurrentModule('automations');
                    else if (tab === 'gallery') setCurrentModule('gallery');
                    else if (tab === 'audit') setCurrentModule('audit');
                    else if (tab === 'settings') setCurrentModule('settings');
                    else if (tab === 'profile') setCurrentModule('profile');
                    else if (tab === 'messages') setCurrentModule('messages');
                  }}
                  onOpenCreateUser={() => setShowCreateUserModal(true)}
                  onOpenCreateEvent={() => setCurrentModule('events')}
                  onOpenCreateAnnouncement={() => setCurrentModule('announcements')}
                  onOpenGalleryUpload={() => setShowGalleryUploadModal(true)}
                />
              )
            )}

            {/* MODULE: Users & Alumni Directory */}
            {currentModule === 'users' && (
              <AdminUsersTable onOpenCreateUser={() => setShowCreateUserModal(true)} />
            )}

            {/* MODULE: Registrar Registry Matcher */}
            {currentModule === 'registry' && (
              permissions.canAccessRegistry ? (
                <RegistrarRegistryMatcher />
              ) : (
                <div className="bg-white rounded-3xl p-10 text-center border border-stone-200/90 shadow-2xs max-w-xl mx-auto my-8 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                    <ShieldAlert className="w-6 h-6 stroke-[2]" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900">Registrar Masterlist Access Restricted</h3>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Your account role does not have authorization to inspect or modify the official Registrar Graduate Masterlist. Please contact the University Registrar or Super Administrator for elevated credentials.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentModule('dashboard')}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Return to Overview
                  </button>
                </div>
              )
            )}

            {/* MODULE: Requests & Conflicts Inbox */}
            {currentModule === 'conflicts' && (
              <AdminRequestsAndConflictsView initialSubTab={conflictSubTab} key={conflictSubTab} />
            )}

            {/* MODULE: Jobs & Employers */}
            {currentModule === 'jobs' && (
              <AdminEmployersAndJobsView initialSubTab={jobSubTab} key={jobSubTab} />
            )}

            {/* MODULE: Employer Portal for Employer Role */}
            {currentModule === 'employer_portal' && (
              <EmployerDashboardView />
            )}

            {/* MODULE: Announcements */}
            {currentModule === 'announcements' && (
              <AdminAnnouncementsManager />
            )}

            {/* MODULE: Events & Reunions */}
            {(currentModule === 'events' || currentModule === 'attendance') && (
              <AdminEventsManager />
            )}

            {/* MODULE: Milestones & Honors Bento Grid */}
            {currentModule === 'milestones' && (
              <div className="space-y-6">
                {/* Bento Hero Header */}
                <div className="relative overflow-hidden bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/90 shadow-2xs">
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
                        type="button"
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
                        {milestones.filter(m => m.category?.toLowerCase().includes('career') || m.category?.toLowerCase().includes('promotion') || m.category?.toLowerCase().includes('startup')).length}
                      </span>
                      <span className="text-[10px] text-stone-500 mt-0.5 block">Corporate & leadership</span>
                    </div>
                    <div className="p-3.5 bg-stone-50/80 rounded-xl border border-stone-200/60 shadow-2xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 block">Civic & Honors</span>
                      <span className="text-2xl font-bold text-[#8B181B] mt-1 block">
                        {milestones.filter(m => !m.category?.toLowerCase().includes('career') && !m.category?.toLowerCase().includes('promotion')).length}
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
                  {milestones.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-500">
                      No alumni milestones published yet. Click &quot;Publish Milestone&quot; to honor a graduate.
                    </div>
                  ) : (
                    milestones.map((m, idx) => (
                      <div
                        key={m.id}
                        className={`group relative overflow-hidden bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs hover:shadow-md hover:border-amber-300/80 transition-all duration-200 flex flex-col justify-between ${
                          idx === 0 ? 'md:col-span-2 lg:col-span-2 bg-gradient-to-br from-white via-amber-50/20 to-white' : ''
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={m.alumnusAvatar || getUserAvatar()}
                                onError={handleUserAvatarError}
                                alt={m.alumnusName}
                                referrerPolicy="no-referrer"
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
                    ))
                  )}
                </div>
              </div>
            )}

            {/* MODULE: Chapters & Hubs Bento Grid */}
            {currentModule === 'chapters' && (
              <div className="space-y-6">
                {/* Bento Hero Header */}
                <div className="relative overflow-hidden bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/90 shadow-2xs">
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

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowChapterModal(true)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-all shadow-[0_2px_8px_rgba(139,24,27,0.25)] cursor-pointer active:scale-95"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Charter Chapter</span>
                      </button>
                    </div>
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
                  {chapters.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl border border-stone-200 p-8 text-center text-stone-500">
                      No chapters chartered yet. Click &quot;Charter Chapter&quot; to establish an alumni regional chapter.
                    </div>
                  ) : (
                    chapters.map((ch, idx) => (
                      <div
                        key={ch.id}
                        className={`group relative overflow-hidden bg-white rounded-2xl border border-stone-200/80 p-5 shadow-2xs hover:shadow-md hover:border-[#8B181B]/40 transition-all duration-200 flex flex-col justify-between ${
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
                    ))
                  )}
                </div>
              </div>
            )}

            {/* MODULE: Automations & Cloud Sync Controls */}
            {currentModule === 'automations' && (
              <div className="space-y-6">
                <div className="bg-white p-6 sm:p-7 rounded-2xl border border-stone-200/90 shadow-2xs relative overflow-hidden">
                  <div className="h-1 absolute top-0 left-0 right-0 bg-[#8B181B]" />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                        <span className="text-[#8B181B] font-bold">St. Cecilia's College</span>
                        <span>·</span>
                        <span>System Automations & Cloud Sync</span>
                      </div>
                      <h2 className="text-2xl sm:text-3xl font-bold font-serif text-stone-900 tracking-tight mt-1">
                        Automations & Cloud Synchronization
                      </h2>
                      <p className="text-xs sm:text-sm text-stone-600 mt-1">
                        Trigger automated student identity matching, refresh Firestore cloud caches, and verify roster integrity.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => syncAllDataToCloud()}
                        disabled={isFirestoreSyncing}
                        className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-stone-950 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Loader2 className={`w-4 h-4 ${isFirestoreSyncing ? 'animate-spin' : ''}`} />
                        <span>{isFirestoreSyncing ? 'Synchronizing...' : 'Sync Cloud Now'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-[#8B181B] flex items-center justify-center border border-red-100">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-stone-900">Automated Triage</h3>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Scans unverified accounts against official graduation registrar records using student ID and birthdate matching algorithms.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        const unverified = (users || []).filter(u => !u.isVerified);
                        if (unverified.length === 0) {
                          showToast('All alumni accounts are already verified!', 'info');
                          return;
                        }
                        showToast(`Initiating automated verification scan across ${unverified.length} pending profiles...`, 'info');
                      }}
                      className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Run Verification Scan
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-bold text-stone-900">Firestore Cloud Sync</h3>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Commits local state, registry indexes, audit logs, and verified alumni roster to institutional cloud storage.
                    </p>
                    <button
                      type="button"
                      onClick={() => syncAllDataToCloud()}
                      disabled={isFirestoreSyncing}
                      className="w-full py-2 px-3 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isFirestoreSyncing ? 'Syncing...' : 'Execute Cloud Sync'}
                    </button>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                      <Download className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-stone-900">Institutional Export</h3>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      Generates a signed CSV export of the verified alumni roster for accreditation audits and institutional reporting.
                    </p>
                    <button
                      type="button"
                      onClick={handleExportCsv}
                      className="w-full py-2 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Download Roster CSV
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* MODULE: Governance Policies */}
            {currentModule === 'governance' && (
              <AdminGovernancePoliciesView />
            )}

            {/* MODULE: Audit Logs */}
            {currentModule === 'audit' && (
              <AuditLogView />
            )}

            {/* MODULE: Messages */}
            {currentModule === 'messages' && (
              <MessagesView />
            )}

            {/* MODULE: Settings */}
            {currentModule === 'settings' && (
              <SettingsView />
            )}

            {/* MODULE: Profile */}
            {currentModule === 'profile' && (
              <ProfileView />
            )}

            {/* MODULE: Campus Gallery */}
            {currentModule === 'gallery' && (
              <AdminCampusGalleryView />
            )}

          </div>
        </main>
      </div>

      {/* ========================================================
          CREATE USER MODAL
          ======================================================== */}
      {showCreateUserModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 text-[#8B181B] flex items-center justify-center">
                  <UserPlus className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Provision University Account</h3>
                  <p className="text-xs text-stone-500">Authorize staff, registrar, or admin privileges</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 mt-5">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="e.g. Dr. Maria Santos"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B181B]/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Institutional Email Address</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="name@stcecilia.edu.ph"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B181B]/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">System Role</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B181B]/20 cursor-pointer"
                  >
                    <option value="admin">Administrator</option>
                    <option value="registrar">Office of Registrar</option>
                    <option value="staff">Academic Staff</option>
                    <option value="moderator">Moderator</option>
                    <option value="superadmin">Super Administrator</option>
                    <option value="employer">Employer Partner</option>
                    <option value="alumni">Alumnus</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Default Password</label>
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Campus Department / Office</label>
                <input
                  type="text"
                  value={newUserDepartment}
                  onChange={(e) => setNewUserDepartment(e.target.value)}
                  placeholder="e.g. Office of Institutional Advancement"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-xs font-medium text-stone-900"
                />
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Create Member Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          GALLERY UPLOAD MODAL
          ======================================================== */}
      {showGalleryUploadModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <h3 className="text-base font-bold text-stone-900">Upload Campus Heritage Image</h3>
              <button
                type="button"
                onClick={() => setShowGalleryUploadModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mt-5">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Image Title</label>
                <input
                  type="text"
                  value={galTitle}
                  onChange={(e) => setGalTitle(e.target.value)}
                  placeholder="e.g. Cecilian Heritage Library Quadrangle"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Category</label>
                  <select
                    value={galCategory}
                    onChange={(e) => setGalCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900"
                  >
                    <option value="campus">Campus Life</option>
                    <option value="homecoming">Homecoming</option>
                    <option value="commencement">Commencement</option>
                    <option value="heritage">Heritage</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Year</label>
                  <input
                    type="text"
                    value={galYear}
                    onChange={(e) => setGalYear(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Photo File</label>
                <input
                  ref={galPhotoFileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleGalPhotoUpload(file);
                  }}
                  className="w-full text-xs text-stone-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-stone-100 file:text-stone-700 hover:file:bg-stone-200 cursor-pointer"
                />
                {isProcessingGalPhoto && <p className="text-[11px] text-amber-600 mt-1">Compressing image...</p>}
                {galPhotoError && <p className="text-[11px] text-red-600 mt-1">{galPhotoError}</p>}
              </div>

              {galUrl && (
                <div className="aspect-16/9 rounded-xl overflow-hidden border border-stone-200 relative">
                  <img src={galUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowGalleryUploadModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!galTitle || !galUrl || isProcessingGalPhoto}
                  onClick={() => {
                    addGalleryItem({
                      title: galTitle,
                      category: galCategory,
                      year: galYear,
                      url: galUrl,
                      description: galDesc
                    });
                    setGalTitle('');
                    setGalUrl('');
                    setShowGalleryUploadModal(false);
                    showToast('Campus photo added to gallery!', 'success');
                  }}
                  className="px-5 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  Save Photo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          PUBLISH MILESTONE MODAL
          ======================================================== */}
      {showMilestoneModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <Award className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Publish Alumni Milestone</h3>
                  <p className="text-xs text-stone-500">Commemorate outstanding alumnus achievement</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMilestoneModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMilestone} className="space-y-4 mt-5">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Select Alumnus *</label>
                <select
                  value={mAlumnusId}
                  onChange={(e) => setMAlumnusId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B181B]/20 cursor-pointer"
                >
                  <option value="">Choose an alumnus from directory...</option>
                  {users.map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.name} (Batch {u.batch || 'Alumni'}) - {u.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Category *</label>
                  <select
                    value={mCategory}
                    onChange={(e) => setMCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B181B]/20 cursor-pointer"
                  >
                    <option value="promotion">Executive Promotion</option>
                    <option value="startup">Startup Founding & Funding</option>
                    <option value="award">Industry / Civic Award</option>
                    <option value="publication">Research Publication</option>
                    <option value="honor">Institutional Honor</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Company / Organization</label>
                  <input
                    type="text"
                    value={mCompany}
                    onChange={(e) => setMCompany(e.target.value)}
                    placeholder="e.g. Google, Microsoft, Ayala"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-xs text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Milestone Headline *</label>
                <input
                  type="text"
                  required
                  value={mTitle}
                  onChange={(e) => setMTitle(e.target.value)}
                  placeholder="e.g. Appointed Chief Technology Officer"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B181B]/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Achievement Description *</label>
                <textarea
                  rows={3}
                  required
                  value={mDescription}
                  onChange={(e) => setMDescription(e.target.value)}
                  placeholder="Describe the milestone details, impact, and significance..."
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-xs text-stone-900 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowMilestoneModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Publish Milestone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          CHARTER CHAPTER MODAL
          ======================================================== */}
      {showChapterModal && (
        <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#8B181B] flex items-center justify-center border border-rose-200">
                  <MapPin className="w-4 h-4 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Charter Regional Chapter</h3>
                  <p className="text-xs text-stone-500">Establish a new geographical alumni community</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChapterModal(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateChapter} className="space-y-4 mt-5">
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Chapter Name *</label>
                <input
                  type="text"
                  required
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="e.g. Metro Manila Cecilian Alumni Chapter"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-xs font-medium text-stone-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">Region / Location *</label>
                <input
                  type="text"
                  required
                  value={cRegion}
                  onChange={(e) => setCRegion(e.target.value)}
                  placeholder="e.g. National Capital Region, Philippines"
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-xs font-medium text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Chapter President Name *</label>
                  <input
                    type="text"
                    required
                    value={cLeadName}
                    onChange={(e) => setCLeadName(e.target.value)}
                    placeholder="e.g. Atty. Juan Dela Cruz"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-xs font-medium text-stone-900"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-stone-700 block mb-1">Official Lead Email</label>
                  <input
                    type="email"
                    value={cLeadEmail}
                    onChange={(e) => setCLeadEmail(e.target.value)}
                    placeholder="lead@alumni.stcecilia.edu"
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white text-xs font-medium text-stone-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowChapterModal(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Charter Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          GLOBAL COMMAND BAR MODAL
          ======================================================== */}
      {showCommandBar && (
        <div
          className="fixed inset-0 bg-stone-950/60 dark:bg-black/80 backdrop-blur-xs flex items-start justify-center pt-20 p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setShowCommandBar(false)}
        >
          <div
            className="w-full max-w-2xl bg-white dark:bg-[#1c1917] rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <AdminCommandBar
              onNavigateTab={(tab) => {
                if (tab === 'users') setCurrentModule('users');
                else if (tab === 'registry') setCurrentModule('registry');
                else if (tab === 'governance') setCurrentModule('governance');
                else if (tab === 'conflicts' || tab === 'requests') setCurrentModule('conflicts');
                else if (tab === 'jobs' || tab === 'employers') setCurrentModule('jobs');
                else if (tab === 'announcements') setCurrentModule('announcements');
                else if (tab === 'events' || tab === 'attendance') setCurrentModule('events');
                else if (tab === 'milestones') setCurrentModule('milestones');
                else if (tab === 'chapters') setCurrentModule('chapters');
                else if (tab === 'automations') setCurrentModule('automations');
                else if (tab === 'gallery') setCurrentModule('gallery');
                else if (tab === 'audit') setCurrentModule('audit');
                else setCurrentModule('dashboard');
                setShowCommandBar(false);
              }}
              onOpenCreateUser={() => {
                setShowCommandBar(false);
                setShowCreateUserModal(true);
              }}
              onOpenCreateEvent={() => {
                setShowCommandBar(false);
                setCurrentModule('events');
              }}
              onOpenCreateAnnouncement={() => {
                setShowCommandBar(false);
                setCurrentModule('announcements');
              }}
              onOpenGalleryUpload={() => {
                setShowCommandBar(false);
                setShowGalleryUploadModal(true);
              }}
              onExportCsv={handleExportCsv}
            />
          </div>
        </div>
      )}

      {/* ========================================================
          ADMINISTRATIVE FOOTER
          ======================================================== */}
      <footer className="bg-white dark:bg-[#181615] border-t border-stone-200/90 dark:border-stone-800 py-4 px-4 sm:px-6 lg:px-8 mt-auto">
        <div className="w-full max-w-[1760px] 2xl:max-w-[1920px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-800 dark:text-stone-200">St. Cecilia's College - Cebu, Inc.</span>
            <span>•</span>
            <span className="text-stone-400 dark:text-stone-500">Institutional Administration System</span>
            <span>•</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-medium">Sec-Audited</span>
          </div>

          <div className="flex items-center gap-4 text-stone-400 dark:text-stone-500 text-[11px]">
            <span>Audit Trail Enabled</span>
            <span>•</span>
            <span>© {new Date().getFullYear()} St. Cecilia’s College. All Rights Reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
