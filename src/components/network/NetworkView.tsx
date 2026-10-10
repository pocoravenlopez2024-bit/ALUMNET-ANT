/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Search,
  UserCheck,
  UserPlus,
  Clock,
  Check,
  X,
  MapPin,
  Building2,
  GraduationCap,
  Filter,
  ShieldCheck,
  MessageSquare,
  Sparkles,
  Compass,
  BookOpen,
  Briefcase,
  ChevronRight,
  Award,
  ArrowUpRight,
  CheckCircle2,
  Share2,
  Heart,
  Download,
  LayoutGrid,
  List,
  Globe,
  ArrowRight,
  Activity,
  Layers,
  Send
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { UserProfile } from '../../types';
import { getStatusConfig, QUICK_STATUS_OPTIONS, QuickStatusSelector } from '../dashboard/QuickStatusSelector';
import { ConfirmationModal } from '../common/ConfirmationModal';
import { getUserAvatar, handleUserAvatarError } from '../../lib/defaultImages';
import { exportAlumniRosterCsv } from '../../services/adminExportService';

export const NetworkView: React.FC = () => {
  const {
    currentUser,
    users,
    friendRequests,
    acceptFriendRequest,
    declineFriendRequest,
    cancelFriendRequest,
    sendFriendRequest,
    isConnected,
    hasPendingRequestWith,
    connectionIds,
    getOrCreateChat,
    setActiveTab,
    setSelectedUserIdForModal,
    showToast
  } = useAlumni();

  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'recommended' | 'connections' | 'requests'>('directory');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [requestToCancel, setRequestToCancel] = useState<{ id: string; name: string } | null>(null);

  // Progressive "See More" visibility limits
  const [visibleDirectoryCount, setVisibleDirectoryCount] = useState<number>(12);
  const [visibleRecommendedCount, setVisibleRecommendedCount] = useState<number>(8);
  const [visibleConnectionsCount, setVisibleConnectionsCount] = useState<number>(12);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut listener: Cmd+K / Ctrl+K / '/' focuses search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === 'input' || activeTag === 'textarea';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === '/' && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Global search event listener
  useEffect(() => {
    const handleRemoteSearch = (e: any) => {
      if (e?.detail?.query !== undefined) {
        setSearchQuery(e.detail.query);
        setActiveSubTab('directory');
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      }
    };
    window.addEventListener('applet:network-search', handleRemoteSearch);
    return () => window.removeEventListener('applet:network-search', handleRemoteSearch);
  }, []);

  // Reset directory pagination when any filter changes
  useEffect(() => {
    setVisibleDirectoryCount(12);
  }, [searchQuery, selectedBatch, selectedCourse, selectedRole, selectedStatus]);

  // Distinct batches and courses for filter dropdowns
  const allBatches = useMemo(() => {
    const batches = Array.from(new Set(users.map((u) => u.batch).filter(Boolean)));
    return ['all', ...batches.sort().reverse()];
  }, [users]);

  const allCourses = useMemo(() => {
    const courses = Array.from(new Set(users.map((u) => u.course).filter(Boolean)));
    return ['all', ...courses.sort()];
  }, [users]);

  // Received and Sent Requests
  const receivedRequests = useMemo(() => {
    return friendRequests
      .filter((r) => r.toUid === currentUser?.uid && r.status === 'pending')
      .map((r) => ({
        request: r,
        user: users.find((u) => u.uid === r.fromUid)
      }))
      .filter((item): item is { request: typeof item.request; user: UserProfile } => Boolean(item.user));
  }, [friendRequests, currentUser, users]);

  const sentRequests = useMemo(() => {
    return friendRequests
      .filter((r) => r.fromUid === currentUser?.uid && r.status === 'pending')
      .map((r) => ({
        request: r,
        user: users.find((u) => u.uid === r.toUid)
      }))
      .filter((item): item is { request: typeof item.request; user: UserProfile } => Boolean(item.user));
  }, [friendRequests, currentUser, users]);

  // Connections List
  const connectedUsers = useMemo(() => {
    return users.filter((u) => (connectionIds || []).includes(u.uid));
  }, [users, connectionIds]);

  // Recommended Friends / People You May Know
  const recommendedUsers = useMemo(() => {
    if (!currentUser) return [];
    return users.filter((u) => {
      if (u.uid === currentUser.uid) return false;
      if ((connectionIds || []).includes(u.uid)) return false;
      const sameBatch = u.batch && currentUser.batch && u.batch === currentUser.batch;
      const sameCourse = u.course && currentUser.course && (u.course || '').toLowerCase() === (currentUser.course || '').toLowerCase();
      const sameLocation = u.location && currentUser.location && (u.location || '').toLowerCase().includes((currentUser.location || '').toLowerCase());
      return sameBatch || sameCourse || sameLocation;
    });
  }, [users, currentUser, connectionIds]);


  // Spotlight Alumnus / Community Mentor: An inspiring Cecilian
  const spotlightAlumnus = useMemo(() => {
    const candidates = users.filter((u) => u.uid !== currentUser?.uid && (u.isVerified || u.company || u.quickStatus === 'Mentoring' || u.quickStatus === 'Hiring'));
    return candidates.length > 0 ? candidates[0] : users.find((u) => u.uid !== currentUser?.uid);
  }, [users, currentUser]);

  // Filtered Directory
  const filteredDirectory = useMemo(() => {
    return users.filter((u) => {
      if (currentUser?.uid && u.uid === currentUser.uid) return false;

      const q = searchQuery.toLowerCase().trim();
      const isAllAlumniQuery =
        q === 'all' ||
        q === 'all alumni' ||
        q === 'alumni' ||
        q === 'alumnus' ||
        q === 'all graduates' ||
        q === 'graduates';

      const matchesSearch =
        !q ||
        (isAllAlumniQuery && (u.role === 'alumni' || !u.role)) ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.course || '').toLowerCase().includes(q) ||
        (u.headline || '').toLowerCase().includes(q) ||
        (u.location || '').toLowerCase().includes(q) ||
        (u.batch || '').includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.studentId || '').toLowerCase().includes(q) ||
        (u.employeeId || '').toLowerCase().includes(q) ||
        (u.role || '').toLowerCase().includes(q) ||
        (u.about || '').toLowerCase().includes(q) ||
        (u.bio || '').toLowerCase().includes(q) ||
        (u.currentPosition || '').toLowerCase().includes(q) ||
        (u.company || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q) ||
        (u.skills || []).some((s) => s.toLowerCase().includes(q));

      const matchesBatch = selectedBatch === 'all' || u.batch === selectedBatch;
      const matchesCourse = selectedCourse === 'all' || u.course === selectedCourse;
      const matchesRole =
        selectedRole === 'all' ||
        u.role === selectedRole ||
        (selectedRole === 'alumni' && (u.role === 'alumni' || !u.role));
      const matchesStatus =
        selectedStatus === 'all' ||
        u.quickStatus === selectedStatus;

      return matchesSearch && matchesBatch && matchesCourse && matchesRole && matchesStatus;
    }).sort((a, b) => {
      // Prioritize "People You May Know": Same Course, Same Batch, Same Class/Department displayed FIRST
      let scoreA = 0;
      let scoreB = 0;
      if (currentUser?.course && a.course && a.course.toLowerCase() === currentUser.course.toLowerCase()) scoreA += 100;
      if (currentUser?.batch && a.batch && a.batch === currentUser.batch) scoreA += 50;
      if (currentUser?.department && a.department && a.department.toLowerCase() === currentUser.department.toLowerCase()) scoreA += 25;

      if (currentUser?.course && b.course && b.course.toLowerCase() === currentUser.course.toLowerCase()) scoreB += 100;
      if (currentUser?.batch && b.batch && b.batch === currentUser.batch) scoreB += 50;
      if (currentUser?.department && b.department && b.department.toLowerCase() === currentUser.department.toLowerCase()) scoreB += 25;

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }
      return (a.name || '').localeCompare(b.name || '');
    });
  }, [users, currentUser, searchQuery, selectedBatch, selectedCourse, selectedRole, selectedStatus]);


  // Framer Motion Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.04 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] as const } }
  };

  return (
    <div className="space-y-6 pb-12 antialiased">
      {/* ========================================================
          COMMAND CENTER TOP HEADER SECTION
          Exact parity with Institutional Command Center layout:
          Alumni Directory Header + Subtab Navigation + View Switcher + CSV Download
          ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        {/* Left: Brand Kicker & Title */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B181B] bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 rounded-full border border-red-200/60 dark:border-red-900/60 shadow-2xs">
              Alumni Community
            </span>
            <span className="text-xs text-stone-500 font-medium">Classmates & Cohorts</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white tracking-tight font-sans">
            Alumni Directory
          </h1>
          <p className="text-xs text-stone-500 font-medium mt-0.5">
            Connect with verified fellow Cecilian graduates across Minglanilla and global chapters
          </p>
        </div>

        {/* Right: Subtab Pill Strip + View Mode Toggle + Download CSV */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Subtab Segmented Pill Strip */}
          <div className="inline-flex items-center p-1 bg-stone-100/90 dark:bg-stone-800 rounded-full border border-stone-200 dark:border-stone-700 shadow-2xs relative">
            <button
              type="button"
              onClick={() => setActiveSubTab('directory')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'directory'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <span>Directory</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeSubTab === 'directory' ? 'bg-white/20 text-white' : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
              }`}>
                {filteredDirectory.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('recommended')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'recommended'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <span>Recommended</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeSubTab === 'recommended' ? 'bg-white/20 text-white' : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
              }`}>
                {recommendedUsers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('connections')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'connections'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <span>My Network</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeSubTab === 'connections' ? 'bg-white/20 text-white' : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
              }`}>
                {connectedUsers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('requests')}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSubTab === 'requests'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <span>Inquiries</span>
              {receivedRequests.length > 0 ? (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-extrabold animate-pulse">
                  {receivedRequests.length}
                </span>
              ) : (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  activeSubTab === 'requests' ? 'bg-white/20 text-white' : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                }`}>
                  0
                </span>
              )}
            </button>
          </div>

          {/* View Mode Switcher: Cards vs Table */}
          <div className="inline-flex items-center p-1 bg-stone-100/90 dark:bg-stone-800 rounded-full border border-stone-200 dark:border-stone-700 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              title="Switch to High-Density Bento Cards"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#8B181B] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              title="Switch to Command Roster Table"
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#8B181B] text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Download Alumni Roster Masterlist CSV */}
          <button
            type="button"
            onClick={() => {
              exportAlumniRosterCsv(users, 'st_cecilia_alumni_directory');
              showToast?.(`Exported ${users.length} alumni records to CSV!`, 'success');
            }}
            title="Export Roster Masterlist CSV"
            className="w-9 h-9 rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 border border-stone-200 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 transition-all cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================
          COMMAND OMNIBAR & FAST MULTI-FILTER CONTROL CONSOLE
          Sticky/Floating Omnibar with keyboard shortcut ⌘K
          ======================================================== */}
      <div className="sticky top-14 sm:top-16 md:top-24 z-20 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-stone-200/90 dark:border-stone-800 shadow-[0_2px_12px_rgba(0,0,0,0.06)] space-y-3.5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Omnibar Input */}
          <div className="relative flex-1 w-full min-w-0">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              ref={searchInputRef}
              id="network-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeSubTab !== 'directory') {
                  setActiveSubTab('directory');
                }
              }}
              placeholder="Search roster by name, course, batch, company, or skills..."
              className="w-full pl-9 pr-14 py-2.5 text-xs sm:text-sm bg-stone-50/80 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B] text-stone-900 dark:text-white placeholder:text-stone-400 transition-all font-sans cursor-text"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono bg-white dark:bg-stone-700 text-stone-400 border border-stone-200 dark:border-stone-600 rounded absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none shadow-2xs">
                ⌘K
              </kbd>
            )}
          </div>

          {/* Quick Select Filter Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              aria-label="Filter by Member Role"
              className="w-full md:w-auto px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200/90 dark:border-stone-700 rounded-xl text-stone-700 dark:text-stone-300 focus:outline-hidden focus:border-[#8B181B] cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="alumni">Alumni Only</option>
              <option value="registrar">Registrar / Staff</option>
              <option value="admin">Administrators</option>
              <option value="employer">Employers</option>
            </select>

            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              aria-label="Filter by Graduation Batch"
              className="w-full md:w-auto px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200/90 dark:border-stone-700 rounded-xl text-stone-700 dark:text-stone-300 focus:outline-hidden focus:border-[#8B181B] cursor-pointer"
            >
              <option value="all">All Batches</option>
              {allBatches.filter((b) => b !== 'all').map((b) => (
                <option key={b} value={b}>
                  Batch {b}
                </option>
              ))}
            </select>

            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              aria-label="Filter by Academic Discipline"
              className="w-full md:w-auto px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200/90 dark:border-stone-700 rounded-xl text-stone-700 dark:text-stone-300 focus:outline-hidden focus:border-[#8B181B] md:max-w-[170px] truncate cursor-pointer"
            >
              <option value="all">All Disciplines</option>
              {allCourses.filter((c) => c !== 'all').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              aria-label="Filter by Status"
              className="w-full md:w-auto px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200/90 dark:border-stone-700 rounded-xl text-stone-700 dark:text-stone-300 focus:outline-hidden focus:border-[#8B181B] cursor-pointer"
            >
              <option value="all">Any Status</option>
              {QUICK_STATUS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            {(searchQuery || selectedBatch !== 'all' || selectedCourse !== 'all' || selectedRole !== 'all' || selectedStatus !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBatch('all');
                  setSelectedCourse('all');
                  setSelectedRole('all');
                  setSelectedStatus('all');
                }}
                className="col-span-2 sm:col-span-4 md:col-span-1 px-3 py-2 text-xs font-semibold text-stone-600 hover:text-[#8B181B] bg-stone-100 dark:bg-stone-800 hover:bg-red-50 rounded-xl transition-colors cursor-pointer text-center"
                title="Reset all active filters"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Quick Filter Tag Directives */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none pt-1 border-t border-stone-100 dark:border-stone-800">
          <span className="text-stone-400 text-[11px] font-semibold shrink-0 flex items-center gap-1 pr-1">
            <Filter className="w-3 h-3 stroke-[1.75]" /> Directives:
          </span>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedRole('all');
              setSelectedBatch('all');
              setSelectedCourse('all');
              setSelectedStatus('all');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
              !searchQuery && selectedRole === 'all' && selectedBatch === 'all' && selectedCourse === 'all' && selectedStatus === 'all'
                ? 'bg-[#8B181B] text-white shadow-2xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200/80'
            }`}
          >
            All Members ({users.filter((u) => u.uid !== currentUser?.uid).length})
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('Open to Networking')}
            className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedStatus === 'Open to Networking'
                ? 'bg-emerald-700 text-white font-semibold shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200/70 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Open to Networking</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('Mentoring')}
            className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedStatus === 'Mentoring'
                ? 'bg-teal-700 text-white font-semibold shadow-2xs'
                : 'bg-teal-50 text-teal-800 border border-teal-200/70 hover:bg-teal-100 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-teal-500" />
            <span>Mentors Available</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedStatus('Hiring')}
            className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
              selectedStatus === 'Hiring'
                ? 'bg-purple-700 text-white font-semibold shadow-2xs'
                : 'bg-purple-50 text-purple-800 border border-purple-200/70 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Actively Hiring</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedBatch('2024')}
            className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
              selectedBatch === '2024'
                ? 'bg-[#8B181B] text-white font-semibold'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200/80'
            }`}
          >
            Batch 2024
          </button>

          <button
            type="button"
            onClick={() => setSelectedBatch('2023')}
            className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
              selectedBatch === '2023'
                ? 'bg-[#8B181B] text-white font-semibold'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200/80'
            }`}
          >
            Batch 2023
          </button>
        </div>
      </div>

      {/* ========================================================
          SUB-TAB 1: PRIMARY ALUMNI ROSTER & DIRECTORY VIEW
          ======================================================== */}
      {activeSubTab === 'directory' && (
        <div className="space-y-6">
          {/* Spotlight Alumnus Lead Card */}
          {spotlightAlumnus && !searchQuery && selectedBatch === 'all' && selectedCourse === 'all' && (
            <motion.div
              whileHover={{ y: -2, transition: { duration: 0.2, ease: 'easeOut' } }}
              className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-[28px] border border-stone-200/90 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden transition-shadow duration-200"
            >
              <div className="h-1 bg-[#8B181B] absolute top-0 left-0 right-0" />

              <div>
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-red-50 dark:bg-red-950/40 text-[#8B181B] border border-red-200/70 dark:border-red-900/60">
                      <Award className="w-3.5 h-3.5 text-[#8B181B]" />
                      Spotlight Cecilian
                    </span>
                    <span className="text-stone-300 dark:text-stone-700">·</span>
                    <span className="text-xs text-stone-500 font-medium">Alumni Community Spotlight</span>
                  </div>

                  {spotlightAlumnus.quickStatus && (
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                      getStatusConfig(spotlightAlumnus.quickStatus).badgeBg
                    } ${getStatusConfig(spotlightAlumnus.quickStatus).badgeBorder} ${
                      getStatusConfig(spotlightAlumnus.quickStatus).badgeText
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${getStatusConfig(spotlightAlumnus.quickStatus).dotColor}`} />
                      <span>{spotlightAlumnus.quickStatus}</span>
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="relative shrink-0">
                    <img
                      src={getUserAvatar(spotlightAlumnus.profilePictureUrl)}
                      alt={spotlightAlumnus.name}
                      onError={handleUserAvatarError}
                      onClick={() => setSelectedUserIdForModal(spotlightAlumnus.uid)}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-stone-200 dark:ring-stone-700 shadow-sm border border-stone-100 cursor-pointer hover:opacity-95 transition-opacity"
                    />
                    {spotlightAlumnus.isVerified && (
                      <span
                        title="Verified Cecilian Graduate"
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] shadow-2xs font-bold"
                      >
                        ✓
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3
                        onClick={() => setSelectedUserIdForModal(spotlightAlumnus.uid)}
                        className="text-lg sm:text-xl font-bold text-stone-900 dark:text-white hover:text-[#8B181B] cursor-pointer tracking-tight transition-colors truncate"
                      >
                        {spotlightAlumnus.name}
                      </h3>
                      <span className="text-xs font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md">
                        Class of {spotlightAlumnus.batch || '2024'}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-[#8B181B] mt-0.5">
                      {spotlightAlumnus.course || 'Bachelor of Science Graduate'}
                    </p>

                    <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                      {spotlightAlumnus.headline || spotlightAlumnus.about || spotlightAlumnus.bio || 'Proud graduate of St. Cecilia’s College, contributing to regional enterprise and professional excellence.'}
                    </p>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-500">
                      {spotlightAlumnus.company && (
                        <span className="inline-flex items-center gap-1 font-medium text-stone-700 dark:text-stone-300">
                          <Building2 className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          {spotlightAlumnus.company}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        {spotlightAlumnus.location || 'Minglanilla, Cebu'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-stone-100 dark:border-stone-800 flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-stone-500">
                  Recognized for active institutional participation and verified credentials
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedUserIdForModal(spotlightAlumnus.uid)}
                    className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  >
                    View Dossier
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      getOrCreateChat(spotlightAlumnus.uid);
                      setActiveTab('messages');
                    }}
                    className="px-3.5 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message</span>
                  </button>
                  {!isConnected(spotlightAlumnus.uid) && (
                    <button
                      type="button"
                      onClick={() => sendFriendRequest(spotlightAlumnus.uid)}
                      className="px-3.5 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Connect</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* EMPTY STATE */}
          {filteredDirectory.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 p-12 text-center rounded-[28px] border border-stone-200/90 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <Users className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-800 dark:text-stone-200">No alumni records match specified criteria</p>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto leading-relaxed">
                Try searching with different keywords, resetting filters, or switching batches.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedBatch('all');
                  setSelectedCourse('all');
                  setSelectedRole('all');
                  setSelectedStatus('all');
                }}
                className="mt-4 px-4 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewMode === 'table' ? (
            /* ========================================================
               COMMAND ROSTER TABLE VIEW (Dense, High-Precision Command Table)
               ======================================================== */
            <div className="bg-white dark:bg-stone-900 rounded-[28px] border border-stone-200/90 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/60 text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                      <th className="py-3 px-4 sm:px-6">Member Profile</th>
                      <th className="py-3 px-4">Academic Program</th>
                      <th className="py-3 px-3">Batch</th>
                      <th className="py-3 px-4">Availability Status</th>
                      <th className="py-3 px-4">Verification</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                    {filteredDirectory.slice(0, visibleDirectoryCount).map((user) => {
                      const connected = isConnected(user.uid);
                      const reqState = hasPendingRequestWith(user.uid);
                      const statusConfig = getStatusConfig(user.quickStatus);

                      return (
                        <tr
                          key={user.uid}
                          className="hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition-colors group"
                        >
                          {/* Member Column */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <div className="relative shrink-0">
                                <img
                                  src={getUserAvatar(user.profilePictureUrl)}
                                  alt={user.name}
                                  onError={handleUserAvatarError}
                                  onClick={() => setSelectedUserIdForModal(user.uid)}
                                  className="w-10 h-10 rounded-xl object-cover ring-1 ring-stone-200 dark:ring-stone-700 cursor-pointer shadow-2xs"
                                />
                                <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-white ring-2 ring-white">
                                  <span className={`block h-2 w-2 rounded-full ${statusConfig.dotColor}`} />
                                </span>
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    onClick={() => setSelectedUserIdForModal(user.uid)}
                                    className="font-bold text-stone-900 dark:text-white hover:text-[#8B181B] cursor-pointer truncate text-sm"
                                  >
                                    {user.name}
                                  </span>
                                  {user.isVerified && (
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  )}
                                </div>
                                <p className="text-[11px] text-stone-500 truncate max-w-xs">
                                  {user.currentPosition || user.company || user.headline || 'Cecilian Alumnus'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Academic Program Column */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-stone-800 dark:text-stone-200 truncate max-w-xs">
                              {user.course || 'Degree Program'}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              {user.department || 'Undergraduate Division'}
                            </div>
                          </td>

                          {/* Batch Column */}
                          <td className="py-3.5 px-3">
                            <span className="font-mono font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md text-[11px]">
                              {user.batch ? `'${user.batch.slice(-2)}` : '2024'}
                            </span>
                          </td>

                          {/* Availability Status */}
                          <td className="py-3.5 px-4">
                            {user.quickStatus ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig.badgeBg} ${statusConfig.badgeBorder} ${statusConfig.badgeText}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`} />
                                <span>{user.quickStatus}</span>
                              </span>
                            ) : (
                              <span className="text-stone-400 text-[11px]">Inactive</span>
                            )}
                          </td>

                          {/* Verification Column */}
                          <td className="py-3.5 px-4">
                            {user.isVerified ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Verified</span>
                              </span>
                            ) : (
                              <span className="text-stone-400 text-[11px]">Unverified</span>
                            )}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedUserIdForModal(user.uid)}
                                className="px-2.5 py-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
                              >
                                Dossier
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  getOrCreateChat(user.uid);
                                  setActiveTab('messages');
                                }}
                                className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#8B181B] hover:bg-[#721316] rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                title="Dispatch peer message"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Message</span>
                              </button>

                              {connected ? (
                                <span className="px-2 py-1 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  <span>Connected</span>
                                </span>
                              ) : reqState === 'sent' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const req = friendRequests.find(
                                      (r) => r.fromUid === currentUser?.uid && r.toUid === user.uid && r.status === 'pending'
                                    );
                                    if (req) {
                                      cancelFriendRequest(req.id);
                                      showToast(`Connection request to ${user.name} cancelled`, 'info');
                                    }
                                  }}
                                  className="px-2 py-1 text-[10px] font-semibold text-amber-800 bg-amber-50 hover:bg-red-50 hover:text-red-700 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                                  title="Click again to undo request"
                                >
                                  Pending (Undo)
                                </button>
                              ) : reqState === 'received' ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const req = friendRequests.find(
                                      (r) => r.fromUid === user.uid && r.toUid === currentUser?.uid && r.status === 'pending'
                                    );
                                    if (req) acceptFriendRequest(req.id);
                                  }}
                                  className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs cursor-pointer"
                                >
                                  Accept
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => sendFriendRequest(user.uid)}
                                  className="px-2.5 py-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg shadow-2xs flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                                >
                                  <UserPlus className="w-3 h-3" />
                                  <span>Connect</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* ========================================================
               HIGH-DENSITY BENTO CARDS VIEW
               ======================================================== */
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filteredDirectory.slice(0, visibleDirectoryCount).map((user) => {
                const connected = isConnected(user.uid);
                const reqState = hasPendingRequestWith(user.uid);
                const statusConfig = getStatusConfig(user.quickStatus);

                return (
                  <motion.div
                    key={user.uid}
                    variants={itemVariants}
                    whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
                    className="bg-white dark:bg-stone-900 rounded-[28px] border border-stone-200/90 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] hover:border-stone-300 dark:hover:border-stone-700 transition-all duration-200 overflow-hidden flex flex-col justify-between relative group"
                  >
                    {/* St. Cecilia Crimson Top Trim */}
                    <div className="h-0.5 w-full bg-[#8B181B]/40 group-hover:bg-[#8B181B] transition-colors absolute top-0 left-0 right-0" />

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={getUserAvatar(user.profilePictureUrl)}
                            alt={user.name}
                            onError={handleUserAvatarError}
                            onClick={() => setSelectedUserIdForModal(user.uid)}
                            className="w-13 h-13 rounded-2xl object-cover ring-1 ring-stone-200 dark:ring-stone-700 cursor-pointer hover:opacity-90 transition-opacity shadow-2xs"
                          />
                          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-2 ring-white shadow-2xs">
                            <span className={`block h-2.5 w-2.5 rounded-full ${statusConfig.dotColor}`} />
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 px-2 py-0.5 rounded-lg">
                            Class of {user.batch || '2024'}
                          </span>
                          {user.department && (
                            <span className="text-[10px] font-semibold text-[#8B181B] bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-900/60 px-2 py-0.5 rounded-md">
                              {user.department}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3
                            onClick={() => setSelectedUserIdForModal(user.uid)}
                            className="font-bold text-sm text-stone-900 dark:text-white hover:text-[#8B181B] cursor-pointer transition-colors truncate"
                          >
                            {user.name}
                          </h3>
                          {user.isVerified && (
                            <span title="Verified Cecilian Record" className="text-emerald-600 shrink-0">
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>

                        <p className="text-xs font-semibold text-[#8B181B] mt-0.5 truncate">
                          {user.course || 'Degree Program Graduate'}
                        </p>

                        <p className="text-xs text-stone-600 dark:text-stone-400 mt-1.5 line-clamp-2 leading-relaxed">
                          {user.headline || user.currentPosition || (user.company ? `At ${user.company}` : 'St. Cecilia’s College Alumnus')}
                        </p>

                        <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-stone-400">
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                            <span className="truncate">{user.location || 'Minglanilla, Cebu'}</span>
                          </div>

                          {user.quickStatus && (
                            <span className={`text-[10px] font-medium px-2 py-0.2 rounded-md border shrink-0 ${statusConfig.badgeBg} ${statusConfig.badgeBorder} ${statusConfig.badgeText}`}>
                              {user.quickStatus}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar Footer */}
                    <div className="p-3 bg-stone-50/70 dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedUserIdForModal(user.uid)}
                        className="flex-1 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-200/70 dark:hover:bg-stone-700 bg-white dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 rounded-xl text-center transition-colors cursor-pointer"
                      >
                        Dossier
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          getOrCreateChat(user.uid);
                          setActiveTab('messages');
                        }}
                        className="flex-1 py-1.5 text-xs font-semibold text-white bg-[#8B181B] hover:bg-[#721316] rounded-xl flex items-center justify-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message</span>
                      </button>

                      {connected ? (
                        <span className="p-1.5 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl" title="Connected">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      ) : reqState === 'sent' ? (
                        <button
                          type="button"
                          onClick={() => {
                            const req = friendRequests.find(
                              (r) => r.fromUid === currentUser?.uid && r.toUid === user.uid && r.status === 'pending'
                            );
                            if (req) {
                              cancelFriendRequest(req.id);
                              showToast(`Connection request to ${user.name} cancelled`, 'info');
                            }
                          }}
                          className="px-2 py-1.5 text-[11px] font-semibold text-amber-900 bg-amber-50 hover:bg-red-50 hover:text-red-700 border border-amber-200/80 rounded-xl transition-colors cursor-pointer"
                          title="Click to cancel request"
                        >
                          <Clock className="w-3 h-3 text-amber-600" />
                        </button>
                      ) : reqState === 'received' ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const req = friendRequests.find(
                                (r) => r.fromUid === user.uid && r.toUid === currentUser?.uid && r.status === 'pending'
                              );
                              if (req) acceptFriendRequest(req.id);
                            }}
                            className="p-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer shadow-2xs"
                            title="Accept connection"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const req = friendRequests.find(
                                (r) => r.fromUid === user.uid && r.toUid === currentUser?.uid && r.status === 'pending'
                              );
                              if (req) declineFriendRequest(req.id);
                            }}
                            className="p-1.5 text-[11px] font-semibold text-stone-500 hover:text-stone-800 hover:bg-stone-200 bg-stone-100 rounded-xl transition-colors cursor-pointer"
                            title="Decline request"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => sendFriendRequest(user.uid)}
                          className="p-1.5 text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-xl transition-all cursor-pointer active:scale-95"
                          title="Connect with classmate"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Progressive "See More" Controls */}
          {filteredDirectory.length > visibleDirectoryCount && (
            <div className="mt-8 pt-6 border-t border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-[28px] border border-stone-200/90 shadow-2xs">
              <div className="text-xs text-stone-600 dark:text-stone-400 text-center sm:text-left">
                Showing <strong className="text-stone-900 dark:text-white font-bold">{Math.min(visibleDirectoryCount, filteredDirectory.length)}</strong> of{' '}
                <strong className="text-stone-900 dark:text-white font-bold">{filteredDirectory.length}</strong> Cecilians
                <div className="w-48 sm:w-64 bg-stone-200 dark:bg-stone-700 rounded-full h-1.5 mt-1.5 overflow-hidden mx-auto sm:mx-0">
                  <div
                    className="bg-[#8B181B] h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(Math.min(visibleDirectoryCount, filteredDirectory.length) / filteredDirectory.length) * 100}%`
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleDirectoryCount((prev) => prev + 12)}
                  className="px-5 py-2.5 bg-[#8B181B] hover:bg-[#721316] text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95"
                >
                  Load Next 12 (+{Math.min(12, filteredDirectory.length - visibleDirectoryCount)})
                </button>
                <button
                  type="button"
                  onClick={() => setVisibleDirectoryCount(filteredDirectory.length)}
                  className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Display Complete Directory
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: RECOMMENDED PEERS
          ======================================================== */}
      {activeSubTab === 'recommended' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-5 rounded-[28px] border border-stone-200/90 dark:border-stone-800 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white tracking-tight">
                Recommended Batchmates & Peers ({recommendedUsers.length})
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Alumni matched based on shared graduation cohort, degree program, or regional chapter
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('directory')}
              className="text-xs font-semibold text-[#8B181B] hover:text-[#721316] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Explore All Alumni</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recommendedUsers.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 p-12 text-center rounded-[28px] border border-stone-200/90 dark:border-stone-800 shadow-2xs">
              <Sparkles className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-800 dark:text-stone-200">No new recommendations available</p>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                You are either linked with all batchmates or need to update your degree in your profile.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('directory')}
                className="mt-4 px-4 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                Browse Full Directory
              </button>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {recommendedUsers.slice(0, visibleRecommendedCount).map((user) => {
                const reqState = hasPendingRequestWith(user.uid);
                const isSameBatch = user.batch && currentUser?.batch && user.batch === currentUser.batch;
                const isSameCourse = user.course && currentUser?.course && user.course.toLowerCase() === currentUser.course.toLowerCase();
                const statusConfig = getStatusConfig(user.quickStatus);

                return (
                  <motion.div
                    key={user.uid}
                    variants={itemVariants}
                    whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
                    className="bg-white dark:bg-stone-900 rounded-[28px] border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] transition-all duration-200 flex flex-col justify-between overflow-hidden relative group"
                  >
                    <div className="h-0.5 w-full bg-amber-500/60 group-hover:bg-amber-600 transition-colors absolute top-0 left-0 right-0" />

                    <div className="p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={getUserAvatar(user.profilePictureUrl)}
                            alt={user.name}
                            onError={handleUserAvatarError}
                            onClick={() => setSelectedUserIdForModal(user.uid)}
                            className="w-13 h-13 rounded-2xl object-cover ring-1 ring-stone-200 dark:ring-stone-700 cursor-pointer hover:opacity-90"
                          />
                          <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white ring-2 ring-white shadow-2xs">
                            <span className={`block h-2.5 w-2.5 rounded-full ${statusConfig.dotColor}`} />
                          </span>
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {isSameBatch && (
                            <span className="text-[10px] font-bold text-[#8B181B] bg-red-50 dark:bg-red-950/40 border border-red-200/60 px-2 py-0.5 rounded-md">
                              Batchmate ('{user.batch?.slice(-2) || '24'})
                            </span>
                          )}
                          {isSameCourse && (
                            <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 px-2 py-0.5 rounded-md">
                              Same Discipline
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-3.5">
                        <h4
                          onClick={() => setSelectedUserIdForModal(user.uid)}
                          className="text-sm font-bold text-stone-900 dark:text-white hover:text-[#8B181B] cursor-pointer truncate"
                        >
                          {user.name}
                        </h4>
                        <p className="text-xs font-semibold text-[#8B181B] mt-0.5 truncate">
                          {user.course || 'Alumnus'}
                        </p>
                        <p className="text-xs text-stone-600 dark:text-stone-400 line-clamp-2 mt-1 leading-relaxed">
                          {user.headline || user.currentPosition || 'St. Cecilia’s College Alumnus'}
                        </p>
                        {user.location && (
                          <p className="text-[11px] text-stone-400 mt-2 flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{user.location}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="p-3 bg-stone-50/70 dark:bg-stone-800/50 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedUserIdForModal(user.uid)}
                        className="flex-1 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-800 hover:bg-stone-100 border border-stone-200/80 dark:border-stone-700 rounded-xl text-center transition-colors cursor-pointer"
                      >
                        Dossier
                      </button>

                      {reqState === 'sent' ? (
                        <button
                          type="button"
                          onClick={() => {
                            const req = friendRequests.find(
                              (r) => r.fromUid === currentUser?.uid && r.toUid === user.uid && r.status === 'pending'
                            );
                            if (req) {
                              setRequestToCancel({ id: req.id, name: user.name });
                            }
                          }}
                          className="flex-1 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-red-50 hover:text-red-700 border border-amber-200/80 rounded-xl text-center cursor-pointer transition-colors"
                          title="Click to cancel request"
                        >
                          Sent
                        </button>
                      ) : reqState === 'received' ? (
                        <div className="flex-1 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              const req = friendRequests.find(
                                (r) => r.fromUid === user.uid && r.toUid === currentUser?.uid && r.status === 'pending'
                              );
                              if (req) acceptFriendRequest(req.id);
                            }}
                            className="flex-1 py-1.5 text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl text-center shadow-2xs cursor-pointer"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const req = friendRequests.find(
                                (r) => r.fromUid === user.uid && r.toUid === currentUser?.uid && r.status === 'pending'
                              );
                              if (req) declineFriendRequest(req.id);
                            }}
                            className="p-1.5 text-[11px] font-semibold text-stone-500 hover:text-stone-800 hover:bg-stone-200 bg-stone-100 rounded-xl cursor-pointer"
                            title="Decline request"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => sendFriendRequest(user.uid)}
                          className="flex-1 py-1.5 text-xs font-semibold text-white bg-[#8B181B] hover:bg-[#721316] rounded-xl text-center shadow-2xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Connect</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {recommendedUsers.length > visibleRecommendedCount && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setVisibleRecommendedCount((prev) => prev + 8)}
                className="px-5 py-2.5 bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800 hover:bg-stone-50 text-[#8B181B] font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer"
              >
                See More Recommendations (+{Math.min(8, recommendedUsers.length - visibleRecommendedCount)})
              </button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: MY NETWORK (CONFIRMED CONNECTIONS)
          ======================================================== */}
      {activeSubTab === 'connections' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-stone-900 p-5 rounded-[28px] border border-stone-200/90 dark:border-stone-800 shadow-2xs">
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-white tracking-tight">
                Your Confirmed Alumni Network ({connectedUsers.length})
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Mutual collegiate links with direct messenger access and credentials transparency
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveSubTab('directory')}
              className="text-xs font-semibold text-[#8B181B] hover:text-[#721316] hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>Explore Alumni Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {connectedUsers.length === 0 ? (
            <div className="bg-white dark:bg-stone-900 p-12 text-center rounded-[28px] border border-stone-200/90 dark:border-stone-800 shadow-2xs">
              <UserCheck className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-800 dark:text-stone-200">No confirmed connections yet</p>
              <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto leading-relaxed">
                Search alumni in the directory and dispatch connection invitations to your peers and fellow alumni.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('directory')}
                className="mt-4 px-4 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
              >
                Browse Alumni Directory
              </button>
            </div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {connectedUsers.map((user) => {
                const statusConfig = getStatusConfig(user.quickStatus);

                return (
                  <motion.div
                    key={user.uid}
                    variants={itemVariants}
                    whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
                    className="bg-white dark:bg-stone-900 rounded-[28px] border border-stone-200/90 dark:border-stone-800 shadow-2xs hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] transition-all duration-200 p-5 flex flex-col justify-between relative group overflow-hidden"
                  >
                    <div className="h-0.5 w-full bg-emerald-600/60 group-hover:bg-emerald-600 transition-colors absolute top-0 left-0 right-0" />

                    <div>
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <img
                            src={getUserAvatar(user.profilePictureUrl)}
                            alt={user.name}
                            onError={handleUserAvatarError}
                            onClick={() => setSelectedUserIdForModal(user.uid)}
                            className="w-12 h-12 rounded-2xl object-cover ring-1 ring-stone-200 dark:ring-stone-700 cursor-pointer shadow-2xs"
                          />
                          <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white ring-2 ring-white shadow-2xs">
                            <span className={`block h-2 w-2 rounded-full ${statusConfig.dotColor}`} />
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <h3
                              onClick={() => setSelectedUserIdForModal(user.uid)}
                              className="font-bold text-sm text-stone-900 dark:text-white hover:text-[#8B181B] cursor-pointer truncate"
                            >
                              {user.name}
                            </h3>
                            <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded shrink-0">
                              '{user.batch?.slice(-2) || '24'}
                            </span>
                          </div>
                          <p className="text-xs text-[#8B181B] font-semibold truncate">{user.course}</p>
                          <p className="text-[11px] text-stone-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                            <span>{user.location || 'Minglanilla, Cebu'}</span>
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-400 mt-2.5 line-clamp-2 leading-relaxed">
                        {user.headline || user.currentPosition || 'Verified Cecilian Alumnus'}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          getOrCreateChat(user.uid);
                          setActiveTab('messages');
                        }}
                        className="flex-1 py-1.5 text-xs font-semibold text-white bg-[#8B181B] hover:bg-[#721316] rounded-xl flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedUserIdForModal(user.uid)}
                        className="px-3 py-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
                      >
                        Dossier
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 4: INQUIRIES & CONNECTION REQUESTS
          ======================================================== */}
      {activeSubTab === 'requests' && (
        <div className="space-y-6">
          {/* Received Requests */}
          <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-[28px] border border-stone-200/90 dark:border-stone-800 shadow-2xs relative overflow-hidden">
            <div className="h-1 bg-amber-500 absolute top-0 left-0 right-0" />

            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>Received Connection Requests</span>
                  <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 rounded-full font-mono">
                    {receivedRequests.length}
                  </span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Cecilians who have requested direct professional and peer links with your account
                </p>
              </div>
            </div>

            {receivedRequests.length === 0 ? (
              <div className="py-10 text-center text-stone-400 text-xs">
                No pending incoming connection requests.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {receivedRequests.map(({ request, user }) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getUserAvatar(user.profilePictureUrl)}
                        alt={user.name}
                        onError={handleUserAvatarError}
                        onClick={() => setSelectedUserIdForModal(user.uid)}
                        className="w-11 h-11 rounded-xl object-cover ring-1 ring-stone-200 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <h4
                          onClick={() => setSelectedUserIdForModal(user.uid)}
                          className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white hover:text-[#8B181B] cursor-pointer truncate"
                        >
                          {user.name}
                        </h4>
                        <p className="text-[11px] text-[#8B181B] truncate">{user.course}</p>
                        <p className="text-[10px] text-stone-400 truncate">Class of {user.batch || '2024'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => acceptFriendRequest(request.id)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => declineFriendRequest(request.id)}
                        className="p-1.5 bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 text-stone-600 dark:text-stone-300 rounded-xl transition-all cursor-pointer"
                        title="Decline request"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Requests */}
          <div className="bg-white dark:bg-stone-900 p-5 sm:p-6 rounded-[28px] border border-stone-200/90 dark:border-stone-800 shadow-2xs relative overflow-hidden">
            <div className="h-1 bg-stone-300 dark:bg-stone-700 absolute top-0 left-0 right-0" />

            <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
              <div>
                <h3 className="text-base font-bold text-stone-900 dark:text-white tracking-tight flex items-center gap-2">
                  <Send className="w-4 h-4 text-stone-500" />
                  <span>Sent Invitations Pending Action</span>
                  <span className="px-2 py-0.5 text-xs font-bold bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full font-mono">
                    {sentRequests.length}
                  </span>
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Connection invitations dispatched by you awaiting recipient confirmation
                </p>
              </div>
            </div>

            {sentRequests.length === 0 ? (
              <div className="py-10 text-center text-stone-400 text-xs">
                No active sent requests pending review.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {sentRequests.map(({ request, user }) => (
                  <div
                    key={request.id}
                    className="p-4 rounded-2xl bg-stone-50/80 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={getUserAvatar(user.profilePictureUrl)}
                        alt={user.name}
                        onError={handleUserAvatarError}
                        onClick={() => setSelectedUserIdForModal(user.uid)}
                        className="w-11 h-11 rounded-xl object-cover ring-1 ring-stone-200 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <h4
                          onClick={() => setSelectedUserIdForModal(user.uid)}
                          className="font-bold text-xs sm:text-sm text-stone-900 dark:text-white hover:text-[#8B181B] cursor-pointer truncate"
                        >
                          {user.name}
                        </h4>
                        <p className="text-[11px] text-stone-500 truncate">{user.course}</p>
                        <p className="text-[10px] text-stone-400 truncate">Batch of {user.batch || '2024'}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setRequestToCancel({ id: request.id, name: user.name })}
                      className="px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-red-700 bg-white dark:bg-stone-700 border border-stone-200 dark:border-stone-600 rounded-xl transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Canceling Sent Connection Requests */}
      <ConfirmationModal
        isOpen={Boolean(requestToCancel)}
        title="Cancel Connection Invitation"
        message={`Are you sure you want to withdraw your connection invitation to ${requestToCancel?.name || 'this Cecilian'}?`}
        confirmLabel="Withdraw Request"
        cancelLabel="Keep Invitation"
        variant="danger"
        onConfirm={() => {
          if (requestToCancel) {
            cancelFriendRequest(requestToCancel.id);
            setRequestToCancel(null);
            showToast?.('Connection request withdrawn', 'info');
          }
        }}
        onClose={() => setRequestToCancel(null)}
      />
    </div>
  );
};
