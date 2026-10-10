/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Megaphone,
  Briefcase,
  ImageIcon,
  MessageSquare,
  Settings as SettingsIcon,
  LogOut,
  User as UserIcon,
  Search,
  Menu,
  X,
  QrCode,
  ShieldCheck,
  Loader2,
  Moon,
  Sun,
  Bell,
  Sparkles,
  ChevronRight,
  ExternalLink,
  Award,
  BookOpen,
  ScanFace,
  Grid,
  MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlumni } from '../../context/AlumniContext';
import { useTheme } from '../../lib/theme';
import { DashboardView } from '../dashboard/DashboardView';
import { NetworkView } from '../network/NetworkView';
import { MessagesView } from '../messages/MessagesView';
import { EventsView } from '../events/EventsView';
import { AnnouncementsView } from '../announcements/AnnouncementsView';
import { OpportunitiesView } from '../opportunities/OpportunitiesView';
import { ProfileView } from '../profile/ProfileView';
import { SettingsView } from '../settings/SettingsView';
import { CampusGalleryModal } from '../gallery/CampusGalleryModal';
import { DigitalAlumniCard } from '../profile/DigitalAlumniCard';
import { VerificationGate } from '../common/VerificationGate';
import { getUserAvatar, handleUserAvatarError } from '../../lib/defaultImages';
import { exportAlumniRosterCsv } from '../../services/adminExportService';
import { GlobalCommandPalette } from '../common/GlobalCommandPalette';

export type AlumniModuleId =
  | 'dashboard'
  | 'network'
  | 'messages'
  | 'events'
  | 'announcements'
  | 'opportunities'
  | 'gallery'
  | 'profile'
  | 'settings';

interface AlumniWorkspaceLayoutProps {
  onOpenAuth?: (mode: 'login' | 'register') => void;
  onGoToLanding?: () => void;
}

export const AlumniWorkspaceLayout: React.FC<AlumniWorkspaceLayoutProps> = ({
  onOpenAuth,
  onGoToLanding
}) => {
  const {
    currentUser,
    users,
    activeTab,
    setActiveTab,
    chats,
    events,
    announcements,
    opportunities,
    syncAllDataToCloud,
    isFirestoreSyncing,
    logout,
    notifications,
    unreadNotificationsCount,
    markAllNotificationsAsRead,
    showToast
  } = useAlumni();

  const { isDark, toggleTheme } = useTheme();

  // Active module synced with context activeTab
  const currentModule = useMemo<AlumniModuleId>(() => {
    const validModules: AlumniModuleId[] = [
      'dashboard',
      'network',
      'messages',
      'events',
      'announcements',
      'opportunities',
      'gallery',
      'profile',
      'settings'
    ];
    if (validModules.includes(activeTab as AlumniModuleId)) {
      return activeTab as AlumniModuleId;
    }
    return 'dashboard';
  }, [activeTab]);

  const handleSelectModule = (mod: AlumniModuleId) => {
    setActiveTab(mod as any);
  };

  // Automatic retract and proximity auto-expand state (no manual toggle button required)
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  const isSidebarCollapsed = !isSidebarExpanded;
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

  // Listen for global custom events to open alumni pass modal directly
  useEffect(() => {
    const handleOpenPass = () => setShowDigitalPassModal(true);
    window.addEventListener('applet:open-alumni-pass', handleOpenPass);
    return () => window.removeEventListener('applet:open-alumni-pass', handleOpenPass);
  }, []);

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

  // Modals state
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDigitalPassModal, setShowDigitalPassModal] = useState(false);
  const [showGalleryModal, setShowGalleryModal] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Unread messages count
  const unreadMessagesCount = useMemo(() => {
    if (!currentUser || !chats) return 0;
    return chats.reduce((acc, chat) => {
      if (!chat || !chat.unreadCount) return acc;
      return acc + (chat.unreadCount[currentUser.uid] || 0);
    }, 0);
  }, [chats, currentUser]);

  // Active opportunities count
  const activeJobsCount = useMemo(() => {
    return (opportunities || []).filter((o) => o.status === 'active' || o.approvalStatus === 'approved').length;
  }, [opportunities]);

  // Upcoming events count
  const upcomingEventsCount = useMemo(() => {
    const now = new Date();
    return (events || []).filter((e) => new Date(e.startDate || e.endDate || 0) >= now).length;
  }, [events]);

  // Keyboard shortcut listener: Cmd+K / Ctrl+K opens the global command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Clean, simple navigation items
  const mainNavItems = useMemo(() => [
    {
      id: 'dashboard' as AlumniModuleId,
      label: 'Home',
      icon: LayoutDashboard,
      badge: null
    },
    {
      id: 'network' as AlumniModuleId,
      label: 'Directory',
      icon: Users,
      badge: users.length > 0 ? users.length : null
    },
    {
      id: 'messages' as AlumniModuleId,
      label: 'Messages',
      icon: MessageSquare,
      badge: unreadMessagesCount > 0 ? unreadMessagesCount : null,
      isCrimsonBadge: true
    },
    {
      id: 'events' as AlumniModuleId,
      label: 'Events & Reunions',
      icon: Calendar,
      badge: upcomingEventsCount > 0 ? upcomingEventsCount : null
    },
    {
      id: 'announcements' as AlumniModuleId,
      label: 'Announcements',
      icon: Megaphone,
      badge: announcements.length > 0 ? announcements.length : null
    },
    {
      id: 'opportunities' as AlumniModuleId,
      label: 'Job Board',
      icon: Briefcase,
      badge: activeJobsCount > 0 ? activeJobsCount : null
    },
    {
      id: 'gallery' as AlumniModuleId,
      label: 'Campus Gallery',
      icon: ImageIcon,
      badge: null
    }
  ], [users.length, unreadMessagesCount, upcomingEventsCount, announcements.length, activeJobsCount]);

  const secondaryNavItems = useMemo(() => [
    {
      id: 'profile' as AlumniModuleId,
      label: 'My Profile',
      icon: UserIcon,
      badge: null
    },
    {
      id: 'settings' as AlumniModuleId,
      label: 'Settings',
      icon: SettingsIcon,
      badge: null
    }
  ], []);

  // Current module label for breadcrumbs
  const currentSectionName = useMemo(() => {
    const all = [...mainNavItems, ...secondaryNavItems];
    const match = all.find((item) => item.id === currentModule);
    return match ? match.label : 'Home';
  }, [currentModule, mainNavItems, secondaryNavItems]);

  // Check if current active module belongs to the secondary/extended set
  const isSecondaryModuleActive = useMemo(() => {
    return ['opportunities', 'announcements', 'gallery', 'profile', 'settings'].includes(currentModule);
  }, [currentModule]);

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
          ALUMNI TOP BAR (Matching Admin Workspace Specification)
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
              aria-label="Open alumni navigation drawer"
            >
              <Menu className="w-5 h-5 stroke-[1.75]" />
            </button>

            <div
              onClick={() => handleSelectModule('dashboard')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <img
                src="/assets/cecilians-seal.jpg"
                alt="St. Cecilia's College Official Seal"
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-stone-200/80 dark:border-stone-700 shadow-2xs shrink-0 group-hover:scale-105 transition-transform"
              />
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 tracking-tight font-sans">
                    St. Cecilia's College
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-[#8B181B] dark:text-rose-400 border border-rose-200 dark:border-rose-900/60">
                    Alumni Hub
                  </span>
                </div>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium -mt-0.5">
                  Official Global Alumni Network • Class of {currentUser?.batch || '2023'}
                </p>
              </div>
            </div>
          </div>

          {/* Zone 2: Breadcrumbs & Quick Search Omnibar */}
          <div className="hidden md:flex items-center gap-3 flex-1 max-w-xl mx-4">
            <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 font-medium shrink-0">
              <span className="text-stone-400 dark:text-stone-500">Alumni</span>
              <span>/</span>
              <span className="text-stone-900 dark:text-stone-100 font-semibold">{currentSectionName}</span>
            </div>

            <button
              type="button"
              onClick={() => setShowCommandPalette(true)}
              className="flex-1 flex items-center justify-between px-3.5 py-1.5 bg-stone-50 dark:bg-stone-800/80 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 rounded-xl border border-stone-200 dark:border-stone-700 text-xs transition-colors cursor-pointer group shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 stroke-[1.75] group-hover:text-[#8B181B] transition-colors" />
                <span className="text-stone-400 dark:text-stone-500">Search alumni roster, events, jobs...</span>
              </div>
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-stone-700 text-stone-500 dark:text-stone-300 border border-stone-200 dark:border-stone-600 rounded">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Zone 3: Quick Digital Pass, Live Sync, Dark/Light, Notifications & Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Digital Pass Quick Launch Button */}
            <button
              type="button"
              onClick={() => setShowDigitalPassModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Open Digital Alumni ID Card Pass"
            >
              <QrCode className="w-3.5 h-3.5 stroke-[2]" />
              <span className="hidden sm:inline">My Alumni Pass</span>
            </button>

            {/* Cloud Sync Button */}
            <button
              type="button"
              onClick={() => syncAllDataToCloud()}
              disabled={isFirestoreSyncing}
              title="Synchronize database with Firestore cloud"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50 border border-stone-200 dark:border-stone-700"
            >
              <Loader2 className={`w-3.5 h-3.5 ${isFirestoreSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden lg:inline">{isFirestoreSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>

            {/* Universal Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer border border-stone-200/80 dark:border-stone-700 shadow-2xs"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 stroke-[1.75]" />
              ) : (
                <Moon className="w-4 h-4 text-stone-600 dark:text-stone-300 stroke-[1.75]" />
              )}
            </button>

            {/* Alumnus Profile Dropdown */}
            <div className="relative" data-profile-dropdown="true">
              <button
                type="button"
                onClick={() => setShowProfileMenu((prev) => !prev)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
              >
                <img
                  src={getUserAvatar(currentUser?.profilePictureUrl)}
                  onError={handleUserAvatarError}
                  alt={currentUser?.name || 'Alumnus'}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-stone-200 dark:border-stone-700 shadow-2xs"
                />
              </button>

              {showProfileMenu && (
                <div
                  className="absolute right-0 mt-2 w-60 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <div className="px-3.5 py-2 border-b border-stone-100 dark:border-stone-800">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{currentUser?.name}</p>
                    <p className="text-[11px] text-stone-400 dark:text-stone-500 truncate">{currentUser?.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-block text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 uppercase tracking-wider">
                        Verified Alumnus
                      </span>
                      <span className="text-[10px] text-stone-400 dark:text-stone-500 font-mono">
                        {currentUser?.studentId || 'SCC-ALUM'}
                      </span>
                    </div>
                  </div>

                  <div className="p-1 space-y-0.5">
                    <button
                      type="button"
                      onClick={() => handleSelectModule('profile')}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 stroke-[1.75]" />
                      <span>My Alumni Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDigitalPassModal(true)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <QrCode className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 stroke-[1.75]" />
                      <span>Digital Alumni Pass</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectModule('settings')}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <SettingsIcon className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500 stroke-[1.75]" />
                      <span>Account Settings</span>
                    </button>
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
                      className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer font-semibold"
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
          MAIN WORKSPACE LAYOUT (Collegiate Left Sidebar + Viewport)
          ======================================================== */}
      <div className="flex-1 flex w-full items-start">
        {/* ======================================================
            DESKTOP ALUMNI SIDEBAR (SIMPLE, PURPOSEFUL, NO CLUTTER)
            ====================================================== */}
        <aside
          onMouseEnter={expandSidebar}
          onMouseLeave={retractSidebar}
          className={`hidden lg:flex shrink-0 sticky top-16 h-[calc(100dvh-4rem)] flex-col border-r border-stone-200/80 dark:border-stone-800 bg-white dark:bg-[#181615] transition-[width] duration-250 ease-out select-none z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
            isSidebarCollapsed ? 'w-16' : 'w-60'
          }`}
        >
          {/* Header of Sidebar: College Brand (Clean, simple, no expand button) */}
          <div className={`h-14 px-3 border-b border-stone-100 dark:border-stone-800/80 flex items-center overflow-hidden transition-all duration-200 ${
            isSidebarCollapsed ? 'justify-center' : 'gap-2.5 justify-start'
          }`}>
            <img
              src="/assets/cecilians-seal.jpg"
              alt="St. Cecilia's Seal"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-stone-200/60 dark:ring-stone-700"
            />
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block truncate">
                  St. Cecilia's
                </span>
                <span className="text-[10px] font-semibold text-[#8B181B] dark:text-rose-400 block truncate">
                  Alumni Portal
                </span>
              </div>
            )}
          </div>

          {/* Navigation Links Scroll Container */}
          <div className="flex-1 overflow-y-auto px-2 py-2.5 space-y-1 scrollbar-none">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentModule === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (item.id === 'gallery') {
                      setShowGalleryModal(true);
                    } else {
                      handleSelectModule(item.id);
                    }
                  }}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#8B181B] text-white font-semibold shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100/80 dark:hover:bg-stone-800/60'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-between'}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 stroke-[1.75] ${isActive ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`} />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>

                  {!isSidebarCollapsed && item.badge !== null && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold tabular-nums ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : item.isCrimsonBadge
                          ? 'bg-[#8B181B] text-white'
                          : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer of Sidebar: Secondary Links & User Profile */}
          <div className="p-2 border-t border-stone-100 dark:border-stone-800/80 space-y-1">
            {secondaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentModule === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectModule(item.id)}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#8B181B] text-white font-semibold shadow-xs'
                      : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100/80 dark:hover:bg-stone-800/60'
                  } ${isSidebarCollapsed ? 'justify-center px-0' : 'justify-start'}`}
                >
                  <Icon className={`w-4 h-4 shrink-0 stroke-[1.75] ${isActive ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`} />
                  {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                </button>
              );
            })}

            <div
              onClick={() => handleSelectModule('profile')}
              className={`flex items-center gap-2.5 p-1.5 mt-1 rounded-xl hover:bg-stone-100/80 dark:hover:bg-stone-800/60 transition-colors cursor-pointer ${
                isSidebarCollapsed ? 'justify-center' : ''
              }`}
              title={isSidebarCollapsed ? currentUser?.name || 'Alumnus' : undefined}
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
                  <p className="text-[10px] text-stone-400 dark:text-stone-500 truncate">
                    Batch {currentUser?.batch || '2023'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* ======================================================
            MOBILE NAVIGATION DRAWER & FULL MODULE DIRECTORY
            ====================================================== */}
        <AnimatePresence>
          {showMobileNav && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMobileNav(false)}
                className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs z-50 lg:hidden"
              />
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-[#181615] z-50 lg:hidden flex flex-col shadow-2xl border-r border-stone-200/90 dark:border-stone-800"
              >
                {/* Header with College Brand */}
                <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/cecilians-seal.jpg"
                      alt="St. Cecilia's Seal"
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-stone-200 dark:ring-stone-700"
                    />
                    <div>
                      <div className="font-extrabold text-xs text-stone-900 dark:text-stone-100">St. Cecilia's College</div>
                      <div className="text-[10px] font-bold text-[#8B181B] dark:text-rose-400 uppercase tracking-wider">Alumni Network Portal</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowMobileNav(false)}
                    className="p-1.5 rounded-lg text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 stroke-[1.75]" />
                  </button>
                </div>

                {/* Alumnus Identity Card Header */}
                <div className="p-3.5 mx-3 mt-3 rounded-xl bg-stone-50 dark:bg-stone-900/90 border border-stone-200/70 dark:border-stone-800 flex items-center gap-3">
                  <img
                    src={getUserAvatar(currentUser?.profilePictureUrl)}
                    onError={handleUserAvatarError}
                    alt={currentUser?.name || 'Alumnus'}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border border-stone-200 dark:border-stone-700 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{currentUser?.name || 'Alumnus'}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-medium text-stone-500 dark:text-stone-400 truncate">
                        Batch {currentUser?.batch || '2023'}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800">
                        Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation Modules List */}
                <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
                  {/* Category: Core Modules */}
                  <div>
                    <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-2 mb-1.5">
                      Core Workspace
                    </div>
                    <div className="space-y-0.5">
                      {mainNavItems.slice(0, 4).map((item) => {
                        const Icon = item.icon;
                        const isActive = currentModule === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              handleSelectModule(item.id);
                              setShowMobileNav(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                              isActive
                                ? 'bg-[#8B181B] text-white font-bold shadow-2xs'
                                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/70'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-4 h-4 stroke-[1.75] ${isActive ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`} />
                              <span>{item.label}</span>
                            </div>
                            {item.badge !== null && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : item.isCrimsonBadge
                                  ? 'bg-[#8B181B] text-white'
                                  : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Category: Campus & Career Hubs */}
                  <div>
                    <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-2 mb-1.5">
                      Community & Career Hubs
                    </div>
                    <div className="space-y-0.5">
                      {mainNavItems.slice(4).map((item) => {
                        const Icon = item.icon;
                        const isActive = currentModule === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (item.id === 'gallery') {
                                setShowGalleryModal(true);
                              } else {
                                handleSelectModule(item.id);
                              }
                              setShowMobileNav(false);
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                              isActive
                                ? 'bg-[#8B181B] text-white font-bold shadow-2xs'
                                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/70'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className={`w-4 h-4 stroke-[1.75] ${isActive ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`} />
                              <span>{item.label}</span>
                            </div>
                            {item.badge !== null && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                              }`}>
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {/* Quick Digital Pass Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowDigitalPassModal(true);
                          setShowMobileNav(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/70 cursor-pointer"
                      >
                        <QrCode className="w-4 h-4 stroke-[1.75] text-[#8B181B] dark:text-rose-400" />
                        <span>Digital Alumni Pass</span>
                      </button>
                    </div>
                  </div>

                  {/* Category: Account & Security */}
                  <div>
                    <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider px-2 mb-1.5">
                      Account & Security
                    </div>
                    <div className="space-y-0.5">
                      {secondaryNavItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentModule === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              handleSelectModule(item.id);
                              setShowMobileNav(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium cursor-pointer transition-colors ${
                              isActive
                                ? 'bg-[#8B181B] text-white font-bold shadow-2xs'
                                : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800/70'
                            }`}
                          >
                            <Icon className={`w-4 h-4 stroke-[1.75] ${isActive ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}

                      {/* Lock App (Face Detection) */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowMobileNav(false);
                          window.dispatchEvent(new CustomEvent('applet:lock-dashboard'));
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 cursor-pointer"
                        title="Lock dashboard with Face Detection protection"
                      >
                        <ScanFace className="w-4 h-4 stroke-[1.75] text-amber-600 dark:text-amber-400" />
                        <span>Lock App (Face Detection)</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Footer with Sign Out */}
                <div className="p-3 border-t border-stone-100 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      if (onOpenAuth) onOpenAuth('login');
                    }}
                    className="w-full py-2.5 px-3 text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/40 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
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
            PRIMARY ALUMNI CONTENT VIEWPORT
            ====================================================== */}
        <main className="flex-1 min-w-0 w-full max-w-full px-3 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-8">
          <div className="w-full max-w-[1760px] 2xl:max-w-[1920px] mx-auto animate-in fade-in duration-200">
            {/* MODULE: Dashboard Overview (Alumni Hub) */}
            {currentModule === 'dashboard' && <DashboardView />}

            {/* MODULE: Alumni Directory & Network */}
            {currentModule === 'network' && (
              <VerificationGate routeName="Alumni Directory & Networking">
                <NetworkView />
              </VerificationGate>
            )}

            {/* MODULE: Direct Peer Messaging */}
            {currentModule === 'messages' && (
              <VerificationGate routeName="Direct Peer Messaging">
                <MessagesView />
              </VerificationGate>
            )}

            {/* MODULE: Campus Reunions & Events */}
            {currentModule === 'events' && (
              <VerificationGate routeName="Campus Reunions & Official Events">
                <EventsView />
              </VerificationGate>
            )}

            {/* MODULE: Institutional Bulletins */}
            {currentModule === 'announcements' && (
              <VerificationGate routeName="Institutional Announcements">
                <AnnouncementsView />
              </VerificationGate>
            )}

            {/* MODULE: Career Opportunities & Jobs */}
            {currentModule === 'opportunities' && (
              <VerificationGate routeName="Career Opportunities & Job Board">
                <OpportunitiesView />
              </VerificationGate>
            )}

            {/* MODULE: Profile & Card */}
            {currentModule === 'profile' && <ProfileView />}

            {/* MODULE: Account Settings */}
            {currentModule === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>

      {/* ======================================================
          CLEAN, MINIMAL MOBILE BOTTOM BAR NAVIGATION
          ====================================================== */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#181615]/95 backdrop-blur-md border-t border-stone-200/90 dark:border-stone-800 shadow-[0_-4px_20px_rgba(0,0,0,0.06),0_-1px_3px_rgba(0,0,0,0.02)] px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] transition-colors"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* 1. Home */}
          <button
            type="button"
            onClick={() => handleSelectModule('dashboard')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 cursor-pointer min-h-[46px] select-none ${
              currentModule === 'dashboard'
                ? 'text-[#8B181B] dark:text-rose-400 font-bold'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${currentModule === 'dashboard' ? 'bg-rose-50 dark:bg-rose-950/60 text-[#8B181B] dark:text-rose-400' : ''}`}>
              <LayoutDashboard className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Home</span>
          </button>

          {/* 2. Directory */}
          <button
            type="button"
            onClick={() => handleSelectModule('network')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 cursor-pointer min-h-[46px] select-none relative ${
              currentModule === 'network'
                ? 'text-[#8B181B] dark:text-rose-400 font-bold'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <div className={`relative p-1 rounded-lg transition-colors ${currentModule === 'network' ? 'bg-rose-50 dark:bg-rose-950/60 text-[#8B181B] dark:text-rose-400' : ''}`}>
              <Users className="w-5 h-5 stroke-[1.8]" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Directory</span>
          </button>

          {/* 3. Messages */}
          <button
            type="button"
            onClick={() => handleSelectModule('messages')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 cursor-pointer min-h-[46px] select-none relative ${
              currentModule === 'messages'
                ? 'text-[#8B181B] dark:text-rose-400 font-bold'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <div className={`relative p-1 rounded-lg transition-colors ${currentModule === 'messages' ? 'bg-rose-50 dark:bg-rose-950/60 text-[#8B181B] dark:text-rose-400' : ''}`}>
              <MessageSquare className="w-5 h-5 stroke-[1.8]" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-[#8B181B] text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-[#181615]">
                  {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Messages</span>
          </button>

          {/* 4. Events */}
          <button
            type="button"
            onClick={() => handleSelectModule('events')}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 cursor-pointer min-h-[46px] select-none relative ${
              currentModule === 'events'
                ? 'text-[#8B181B] dark:text-rose-400 font-bold'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <div className={`relative p-1 rounded-lg transition-colors ${currentModule === 'events' ? 'bg-rose-50 dark:bg-rose-950/60 text-[#8B181B] dark:text-rose-400' : ''}`}>
              <Calendar className="w-5 h-5 stroke-[1.8]" />
              {upcomingEventsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-amber-600 text-white text-[9px] font-extrabold flex items-center justify-center ring-2 ring-white dark:ring-[#181615]">
                  {upcomingEventsCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">Events</span>
          </button>

          {/* 5. More (All Modules) */}
          <button
            type="button"
            onClick={() => setShowMobileNav((prev) => !prev)}
            aria-label="Open full modules navigation"
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-200 cursor-pointer min-h-[46px] select-none relative ${
              isSecondaryModuleActive || showMobileNav
                ? 'text-[#8B181B] dark:text-rose-400 font-bold'
                : 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
            }`}
          >
            <div className={`relative p-1 rounded-lg transition-colors ${isSecondaryModuleActive || showMobileNav ? 'bg-rose-50 dark:bg-rose-950/60 text-[#8B181B] dark:text-rose-400' : ''}`}>
              <Grid className="w-5 h-5 stroke-[1.8]" />
              {isSecondaryModuleActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#8B181B] dark:bg-rose-400 ring-2 ring-white dark:ring-[#181615]" />
              )}
            </div>
            <span className="text-[10px] mt-0.5 tracking-tight font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Digital Alumni Pass Modal */}
      {showDigitalPassModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowDigitalPassModal(false)}
        >
          <div
            className="max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setShowDigitalPassModal(false)}
                className="p-1.5 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <DigitalAlumniCard />
          </div>
        </div>
      )}

      {/* Campus Heritage Gallery Modal */}
      <CampusGalleryModal
        isOpen={showGalleryModal}
        onClose={() => setShowGalleryModal(false)}
      />

      {/* Global Command Palette (Cmd+K / Ctrl+K) */}
      <GlobalCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onSelectTab={(tab) => handleSelectModule(tab as AlumniModuleId)}
      />
    </div>
  );
};
