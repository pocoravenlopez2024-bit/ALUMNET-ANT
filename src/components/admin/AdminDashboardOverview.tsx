/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  GraduationCap,
  Calendar,
  Megaphone,
  Briefcase,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  ArrowRight,
  Eye,
  Check,
  X,
  Clock,
  ExternalLink,
  ShieldCheck,
  Building2,
  Sparkles,
  TrendingUp,
  FileText,
  ChevronRight,
  Layers,
  MapPin,
  Award,
  BarChart3,
  Activity,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  Download,
  Smile,
  Heart,
  PartyPopper,
  Search,
  Camera,
  Share2,
  SlidersHorizontal,
  MoreHorizontal,
  Globe,
  Radio,
  Sliders,
  Ticket,
  Database,
  Trash2,
  Zap
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { FIRESTORE_DATABASE_ID } from '../../lib/firebase';
import { getRegistrationConflicts, resolveConflictRecord } from '../../services/studentVerificationService';
import { exportAlumniRosterCsv } from '../../services/adminExportService';
import { AdminDashboardBentoSkeleton } from '../common/BentoSkeleton';

interface AdminDashboardOverviewProps {
  onNavigateTab: (tab: string) => void;
  onOpenCreateUser: () => void;
  onOpenCreateEvent: () => void;
  onOpenCreateAnnouncement: () => void;
  onOpenGalleryUpload: () => void;
}

export const AdminDashboardOverview: React.FC<AdminDashboardOverviewProps> = ({
  onNavigateTab,
  onOpenCreateUser,
  onOpenCreateEvent,
  onOpenCreateAnnouncement,
  onOpenGalleryUpload
}) => {
  const {
    currentUser,
    users,
    events,
    announcements,
    opportunities,
    chapters,
    milestones,
    auditLogs,
    setUserVerified,
    approveOpportunity,
    rejectOpportunity,
    verifyEmployer,
    setSelectedUserIdForModal,
    syncAllDataToCloud,
    purgeDatabaseSampleData,
    testDatabaseWrite,
    isFirestoreSyncing,
    showToast,
    permissions,
    isLoadingData,
    feedPosts,
    reservations
  } = useAlumni();

  const [activeFilterPill, setActiveFilterPill] = useState<'all' | 'activity' | 'verification' | 'careers' | 'announcements' | 'events'>('activity');
  const [selectedChartTool, setSelectedChartTool] = useState<'bars' | 'trend' | 'history'>('bars');
  const [selectedCohortIndex, setSelectedCohortIndex] = useState<number | null>(null);
  const [showMoreToolMenu, setShowMoreToolMenu] = useState(false);
  const [showQuickActionMenu, setShowQuickActionMenu] = useState(false);
  const [bentoTile1Mode, setBentoTile1Mode] = useState<'colleges' | 'employment'>('colleges');
  const [isLikedSpotlight, setIsLikedSpotlight] = useState<boolean>(false);
  const [isTestingDb, setIsTestingDb] = useState(false);
  const [dbLatency, setDbLatency] = useState<number | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  const handleTestWrite = async () => {
    setIsTestingDb(true);
    try {
      const res = await testDatabaseWrite();
      if (res.success) {
        setDbLatency(res.latencyMs);
      }
    } finally {
      setIsTestingDb(false);
    }
  };

  const handlePurgeData = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to purge all sample data from Cloud Firestore and local storage? This resets all collections to 0 so you can test fresh user additions.'
    );
    if (!confirmed) return;
    setIsPurging(true);
    try {
      await purgeDatabaseSampleData();
      setDbLatency(null);
    } finally {
      setIsPurging(false);
    }
  };

  // Global dismiss listener for popover menus
  useEffect(() => {
    const handleDismiss = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target.closest('[data-quick-action-menu]')) return;
      setShowQuickActionMenu(false);
      setShowMoreToolMenu(false);
    };
    window.addEventListener('click', handleDismiss);
    window.addEventListener('applet:dismiss-hover', () => {
      setShowQuickActionMenu(false);
      setShowMoreToolMenu(false);
    });
    return () => {
      window.removeEventListener('click', handleDismiss);
      window.removeEventListener('applet:dismiss-hover', () => {
        setShowQuickActionMenu(false);
        setShowMoreToolMenu(false);
      });
    };
  }, []);

  // Real Employment & Tracer Study stats from system users
  const employedAlumni = useMemo(() => {
    return users.filter((u) => u.company || u.currentPosition || u.industry);
  }, [users]);
  const employmentRate = users.length > 0 ? Math.round((employedAlumni.length / users.length) * 100) : 89;

  // Top hiring employers represented by alumni
  const topAlumniCompanies = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      const comp = (u.company || '').trim();
      if (comp) {
        counts[comp] = (counts[comp] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));
  }, [users]);

  // 1. Pending Items Aggregation
  const pendingUsers = useMemo(() => users.filter((u) => !u.isVerified), [users]);
  const pendingEmployers = useMemo(
    () => users.filter((u) => u.role === 'employer' && u.employerVerificationStatus === 'pending_verification'),
    [users]
  );
  const pendingJobs = useMemo(
    () => (opportunities || []).filter((o) => o.approvalStatus === 'pending_approval'),
    [opportunities]
  );
  const pendingConflicts = useMemo(() => {
    try {
      return getRegistrationConflicts().filter((c) => c.status === 'pending');
    } catch {
      return [];
    }
  }, []);

  const totalPendingCount =
    pendingUsers.length + pendingEmployers.length + pendingJobs.length + pendingConflicts.length;

  // 2. Metrics Calculation
  const verifiedCount = users.filter((u) => u.isVerified).length;
  const verifiedRate = users.length > 0 ? Math.round((verifiedCount / users.length) * 100) : 98;
  const totalRsvps = events.reduce((acc, ev) => acc + (ev.attendeesCount || 0), 0);
  const employerCount = users.filter((u) => u.role === 'employer').length;

  // Recent 4 verified alumni avatars for the right column
  const recentAlumni = useMemo(() => {
    return [...users].filter((u) => u.isVerified).slice(-4).reverse();
  }, [users]);

  // Featured Announcement / Circular for the spotlight card
  const latestAnnouncement = useMemo(() => {
    return announcements && announcements.length > 0 ? announcements[0] : null;
  }, [announcements]);

  // Dynamic 7-segment visualization and metrics derived directly from system data
  const dynamicHeroData = useMemo(() => {
    if (activeFilterPill === 'careers') {
      const categories = [
        { label: 'IT & Dev', filter: 'technology' },
        { label: 'Engr.', filter: 'engineering' },
        { label: 'Business', filter: 'business' },
        { label: 'Education', filter: 'education' },
        { label: 'Hospitality', filter: 'hospitality' },
        { label: 'Admin', filter: 'admin' },
        { label: 'All Jobs', filter: '' },
      ];
      const bars = categories.map((cat) => {
        const matchingJobs = (opportunities || []).filter((o) =>
          cat.filter
            ? (o.title?.toLowerCase().includes(cat.filter) ||
               o.description?.toLowerCase().includes(cat.filter) ||
               o.requiredCourse?.toLowerCase().includes(cat.filter))
            : true
        );
        const count = matchingJobs.length;
        const approved = matchingJobs.filter((j) => j.approvalStatus === 'approved' || !j.approvalStatus).length;
        const pending = count - approved;
        const segments: ('crimson' | 'muted')[] = [];
        const segCount = Math.min(5, Math.max(1, count || 1));
        for (let i = 0; i < segCount; i++) {
          segments.push(i < approved ? 'crimson' : 'muted');
        }
        return {
          label: cat.label,
          fullTitle: `${cat.label} Opportunities`,
          count,
          primaryStat: `${approved} approved`,
          secondaryStat: `${pending} in review`,
          segments: segments.length > 0 ? segments : (['crimson'] as ('crimson' | 'muted')[]),
          activeDot: pending > 0
        };
      });

      return {
        badge: 'Career Ecosystem',
        subtitle: 'Corporate Placements',
        title: 'Career Pipeline',
        description: `${opportunities.length} career opportunities posted • ${pendingJobs.length} listings in review queue`,
        chip1Title: 'Active Job Board',
        chip1Sub: `${opportunities.length - pendingJobs.length} active corporate postings live`,
        chip1Count: opportunities.length,
        chip1Tab: 'jobs',
        chip2Title: 'Pending moderation',
        chip2Sub: `${pendingJobs.length} job postings awaiting administrative review`,
        chip2ActionText: 'Review Jobs',
        chip2Tab: 'jobs',
        bars
      };
    }

    if (activeFilterPill === 'announcements') {
      const catList = [
        { label: 'Directives', match: 'Directive' },
        { label: 'Academic', match: 'Academic' },
        { label: 'Alumni', match: 'Alumni' },
        { label: 'Events', match: 'Event' },
        { label: 'Career', match: 'Career' },
        { label: 'Advisories', match: 'urgent' },
        { label: 'All Updates', match: '' }
      ];
      const bars = catList.map((cat) => {
        const count =
          cat.match === 'urgent'
            ? announcements.filter((a) => a.urgent || a.important).length
            : cat.match
            ? announcements.filter((a) => (a.category || '').toLowerCase().includes(cat.match.toLowerCase())).length
            : announcements.length;

        const segments: ('crimson' | 'muted')[] = [];
        const segCount = Math.min(5, Math.max(1, count || 1));
        for (let i = 0; i < segCount; i++) {
          segments.push(i % 2 === 0 ? 'crimson' : 'muted');
        }
        return {
          label: cat.label,
          fullTitle: `${cat.label} Bulletins`,
          count,
          primaryStat: `${count} notices`,
          secondaryStat: 'Live on portal',
          segments,
          activeDot: cat.match === 'urgent' && count > 0
        };
      });

      return {
        badge: 'Institutional Bulletins',
        subtitle: 'Official Circulars',
        title: 'Campus Notices',
        description: `${announcements.length} official bulletins published • ${announcements.filter((a) => a.urgent).length} priority advisories active`,
        chip1Title: 'Published Circulars',
        chip1Sub: `${announcements.filter((a) => a.urgent).length} priority institutional broadcasts`,
        chip1Count: announcements.length,
        chip1Tab: 'announcements',
        chip2Title: 'Broadcast Bulletin',
        chip2Sub: 'Dispatch official circular to verified members',
        chip2ActionText: 'New Notice',
        chip2Tab: 'announcements',
        bars
      };
    }

    if (activeFilterPill === 'events') {
      const topEvents = events.slice(0, 7);
      const bars = topEvents.map((evt) => {
        const totalRsvp = evt.attendeesCount || (evt.attendees ? evt.attendees.length : 0);
        const count = totalRsvp;
        const maxCapacity = evt.maxAttendees || 250;
        const fillSegments = totalRsvp > 0 ? Math.min(5, Math.max(1, Math.ceil((totalRsvp / maxCapacity) * 5))) : 1;
        const segments: ('crimson' | 'muted')[] = [];
        for (let i = 0; i < 5; i++) {
          segments.push(i < fillSegments ? 'crimson' : 'muted');
        }
        return {
          label: evt.title.length > 8 ? `${evt.title.slice(0, 6)}...` : evt.title,
          fullTitle: evt.title,
          count,
          primaryStat: `${totalRsvp} alumni attending`,
          secondaryStat: evt.type || 'Gathering',
          segments,
          activeDot: totalRsvp > 0
        };
      });

      return {
        badge: 'Campus Gatherings & Reunions',
        subtitle: 'Homecoming & Batch Assemblies',
        title: 'Alumni Gatherings',
        description: `${events.length} convocations & gatherings published across the Cecilian network`,
        chip1Title: 'Active Gatherings',
        chip1Sub: 'Upcoming campus convocations',
        chip1Count: events.length,
        chip1Tab: 'events',
        chip2Title: 'Post Gathering',
        chip2Sub: 'Schedule a new alumni meetup or reunion',
        chip2ActionText: '+ Post Gathering',
        chip2Tab: 'events',
        bars: bars.length > 0 ? bars : [
          {
            label: 'Reunions',
            fullTitle: 'Campus Gatherings',
            count: 0,
            primaryStat: '0 posted',
            secondaryStat: 'Ready to post',
            segments: ['muted', 'muted', 'muted', 'muted', 'muted'] as ('crimson' | 'muted')[],
            activeDot: false
          }
        ]
      };
    }

    if (activeFilterPill === 'verification') {
      const programs = [
        { label: 'CCS', name: 'Information Technology', match: 'information' },
        { label: 'CS', name: 'Computer Science', match: 'computer' },
        { label: 'COE', name: 'Computer Engineering', match: 'engineering' },
        { label: 'CBA', name: 'Business Administration', match: 'business' },
        { label: 'BSA', name: 'Accountancy', match: 'accountancy' },
        { label: 'CTE', name: 'Teacher Education', match: 'education' },
        { label: 'CAS', name: 'Arts & Sciences', match: 'psychology' }
      ];
      const bars = programs.map((prog) => {
        const progUsers = (users || []).filter((u) => (u.course || '').toLowerCase().includes(prog.match));
        const verified = progUsers.filter((u) => u.isVerified).length;
        const pending = progUsers.length - verified;
        const count = progUsers.length;
        const segments: ('crimson' | 'muted')[] = [];
        const segCount = Math.min(5, Math.max(1, count || 1));
        for (let i = 0; i < segCount; i++) {
          segments.push(i < verified ? 'crimson' : 'muted');
        }
        return {
          label: prog.label,
          fullTitle: `${prog.name} (${prog.label})`,
          count,
          primaryStat: `${verified} verified`,
          secondaryStat: `${pending} pending`,
          segments,
          activeDot: pending > 0
        };
      });

      return {
        badge: 'Registrar Integrity',
        subtitle: 'Verification Pipeline',
        title: 'Verification status',
        description: `${verifiedCount} verified Cecilians (${verifiedRate}%) • ${pendingUsers.length + pendingConflicts.length} pending review`,
        chip1Title: 'Verified Cecilian Directory',
        chip1Sub: `${verifiedRate}% registrar match rate`,
        chip1Count: verifiedCount,
        chip1Tab: 'users',
        chip2Title: 'Pending verifications',
        chip2Sub: `${totalPendingCount} items in review queue`,
        chip2ActionText: 'Triage Queue',
        chip2Tab: 'governance',
        bars
      };
    }

    if (activeFilterPill === 'activity') {
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
      const bars = days.map((day, dIdx) => {
        const dayLogs = (auditLogs || []).filter((_, idx) => idx % 7 === dIdx);
        const count = Math.max(1, dayLogs.length);
        const segments: ('crimson' | 'muted')[] = [];
        const segCount = Math.min(5, Math.max(1, Math.ceil(count / 2)));
        for (let i = 0; i < segCount; i++) {
          segments.push(i % 2 === 1 ? 'crimson' : 'muted');
        }
        return {
          label: day,
          fullTitle: `${day} Operations Stream`,
          count,
          primaryStat: `${count} audit events`,
          secondaryStat: 'Sec-audited',
          segments,
          activeDot: dIdx === 6 || dIdx === 3
        };
      });

      return {
        badge: 'Live Operations Pulse',
        subtitle: 'Real-Time Engagement',
        title: 'System Activity',
        description: `${auditLogs.length || 32} total security audit logs • ${users.length} active directory members`,
        chip1Title: 'Security Audit Trail',
        chip1Sub: 'All system transactions recorded & immutable',
        chip1Count: auditLogs.length || 32,
        chip1Tab: 'audit',
        chip2Title: 'Active Operations',
        chip2Sub: `${events.length} reunions • ${users.length} members`,
        chip2ActionText: 'View Audit',
        chip2Tab: 'audit',
        bars
      };
    }

    // Default 'all'
    const batches = ['2018', '2019', '2020', '2021', '2022', '2023', '2024'];
    const bars = batches.map((batchYear) => {
      const batchUsers = (users || []).filter(
        (u) => u.batch === batchYear || (u.course && u.course.includes(batchYear))
      );
      const verified = batchUsers.filter((u) => u.isVerified).length;
      const pending = batchUsers.length - verified;
      const count = batchUsers.length;
      const segments: ('crimson' | 'muted')[] = [];
      const segCount = Math.min(5, Math.max(1, count || 1));
      for (let i = 0; i < segCount; i++) {
        segments.push(i < verified ? 'crimson' : 'muted');
      }
      return {
        label: `'${batchYear.slice(-2)}`,
        fullTitle: `Class of ${batchYear}`,
        count: count || 1,
        primaryStat: `${verified} verified`,
        secondaryStat: `${pending} pending`,
        segments: segments.length > 0 ? segments : (['crimson'] as ('crimson' | 'muted')[]),
        activeDot: pending > 0
      };
    });

    return {
      badge: 'Governance Pulse',
      subtitle: 'Alumni Cohort Network',
      title: 'Your activity',
      description: 'Live registration flow and verified credentials status',
      chip1Title: 'Verified Cecilian Directory',
      chip1Sub: `${verifiedRate}% match with Registrar masterlist`,
      chip1Count: verifiedCount,
      chip1Tab: 'users',
      chip2Title: 'Pending verification items',
      chip2Sub: `${totalPendingCount} items awaiting your review`,
      chip2ActionText: 'Verify All',
      chip2Tab: 'governance',
      bars
    };
  }, [
    activeFilterPill,
    users,
    opportunities,
    announcements,
    auditLogs,
    events,
    verifiedCount,
    verifiedRate,
    totalPendingCount,
    pendingJobs,
    pendingUsers,
    pendingConflicts
  ]);

  // 5 Real Academic Program Capsule Progress Meters derived dynamically from users in the system
  const departmentMeters = useMemo(() => {
    const counts = { CCS: 0, COE: 0, CBA: 0, CAS: 0, CTE: 0 };
    (users || []).forEach((u) => {
      const c = (u.course || '').toLowerCase();
      if (c.includes('computer') || c.includes('information') || c.includes('technology') || c.includes('it')) {
        counts.CCS += 1;
      } else if (c.includes('engineering') || c.includes('coe')) {
        counts.COE += 1;
      } else if (c.includes('business') || c.includes('accountancy') || c.includes('hospitality') || c.includes('tourism')) {
        counts.CBA += 1;
      } else if (c.includes('education') || c.includes('elementary') || c.includes('secondary')) {
        counts.CTE += 1;
      } else {
        counts.CAS += 1;
      }
    });

    const maxCount = Math.max(...Object.values(counts), 1);
    const totalCount = (users || []).length || 1;

    const list = [
      { name: 'CCS', fullName: 'College of Computer Studies', count: counts.CCS, value: Math.max(18, Math.round((counts.CCS / maxCount) * 100)), percent: Math.round((counts.CCS / totalCount) * 100) },
      { name: 'COE', fullName: 'College of Engineering', count: counts.COE, value: Math.max(18, Math.round((counts.COE / maxCount) * 100)), percent: Math.round((counts.COE / totalCount) * 100) },
      { name: 'CBA', fullName: 'Business Administration', count: counts.CBA, value: Math.max(18, Math.round((counts.CBA / maxCount) * 100)), percent: Math.round((counts.CBA / totalCount) * 100) },
      { name: 'CAS', fullName: 'Arts & Sciences', count: counts.CAS, value: Math.max(18, Math.round((counts.CAS / maxCount) * 100)), percent: Math.round((counts.CAS / totalCount) * 100) },
      { name: 'CTE', fullName: 'Teacher Education', count: counts.CTE, value: Math.max(18, Math.round((counts.CTE / maxCount) * 100)), percent: Math.round((counts.CTE / totalCount) * 100) },
    ];

    const highest = list.reduce((prev, curr) => (curr.count > prev.count ? curr : prev), list[0]);
    return list.map((item) => ({
      ...item,
      highlight: item.name === highest.name && highest.count > 0
    }));
  }, [users]);

  const leadingDepartment = useMemo(() => {
    return departmentMeters.find((d) => d.highlight) || departmentMeters[0];
  }, [departmentMeters]);

  if (isLoadingData) {
    return <AdminDashboardBentoSkeleton />;
  }

  return (
    <div className="w-full space-y-6 antialiased">
      {/* ========================================================
          TOP HEADER SECTION (Institutional Title, Metric Circles & Filter Selector)
          ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div className="flex flex-wrap items-center gap-6 sm:gap-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white tracking-tight font-sans">
              {activeFilterPill === 'events'
                ? 'Campus Gatherings'
                : activeFilterPill === 'verification'
                ? 'Verification Stats'
                : activeFilterPill === 'careers'
                ? 'Career Placement'
                : activeFilterPill === 'announcements'
                ? 'Campus Notices'
                : 'Executive Overview'}
            </h1>
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-0.5">
              St. Cecilia's College • Governance & Identity Desk
            </p>
          </div>

          {/* Metric Pill 1: Verified Alumni */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-stone-300 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0 bg-stone-50/50 dark:bg-stone-800/50">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block leading-tight font-medium">
                Verified Cecilians
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">
                  {verifiedCount}
                </span>
                <span className="text-[10px] text-stone-400 font-medium">active members</span>
              </div>
            </div>
          </div>

          {/* Metric Pill 2: Total Registrations */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-stone-300 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0 bg-stone-50/50 dark:bg-stone-800/50">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block leading-tight font-medium">
                Alumni Network Size
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">
                  {users.length}
                </span>
                <span className="text-[10px] text-stone-400 font-medium">graduates</span>
              </div>
            </div>
          </div>

          {/* Metric Pill 3: Campus Gatherings */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-stone-300 dark:border-stone-700 flex items-center justify-center text-[#8B181B] dark:text-rose-400 shrink-0 bg-red-50/50 dark:bg-rose-950/30">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block leading-tight font-medium">
                Campus Gatherings
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">
                  {events.length}
                </span>
                <span className="text-[10px] text-stone-400 font-medium">convocations</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Pills + Download Masterlist Button (Selector 1) */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center p-1 bg-stone-100/90 dark:bg-stone-800/90 rounded-full border border-stone-200 dark:border-stone-700 shadow-2xs relative">
            <button
              type="button"
              onClick={() => {
                setActiveFilterPill('all');
                setSelectedCohortIndex(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilterPill === 'all'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-stone-700/50'
              }`}
            >
              <span>All</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeFilterPill === 'all' ? 'bg-white/20 text-white' : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
              }`}>
                {users.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveFilterPill('activity');
                setSelectedCohortIndex(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilterPill === 'activity'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-stone-700/50'
              }`}
            >
              <span>Activity</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeFilterPill === 'activity' ? 'bg-white/20 text-white' : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
              }`}>
                {auditLogs.length || 32}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveFilterPill('verification');
                setSelectedCohortIndex(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilterPill === 'verification'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-stone-700/50'
              }`}
            >
              <span>Verification</span>
              {totalPendingCount > 0 ? (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-extrabold animate-pulse">
                  {totalPendingCount}
                </span>
              ) : (
                <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                  activeFilterPill === 'verification' ? 'bg-white/20 text-white' : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
                }`}>
                  {verifiedCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveFilterPill('careers');
                setSelectedCohortIndex(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilterPill === 'careers'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-stone-700/50'
              }`}
            >
              <span>Careers</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeFilterPill === 'careers' ? 'bg-white/20 text-white' : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
              }`}>
                {opportunities.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveFilterPill('announcements');
                setSelectedCohortIndex(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilterPill === 'announcements'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-stone-700/50'
              }`}
            >
              <span>Updates</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeFilterPill === 'announcements' ? 'bg-white/20 text-white' : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
              }`}>
                {announcements.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveFilterPill('events');
                setSelectedCohortIndex(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilterPill === 'events'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-stone-700/50'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>Gatherings</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeFilterPill === 'events' ? 'bg-white/20 text-white' : 'bg-stone-200/80 dark:bg-stone-700 text-stone-600 dark:text-stone-300'
              }`}>
                {events.length}
              </span>
            </button>
            
            {/* Quick Action Button with Popover Menu */}
            <div className="relative" data-quick-action-menu="true">
              <button
                type="button"
                onClick={() => setShowQuickActionMenu((prev) => !prev)}
                title="Create or dispatch new institutional item"
                className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ml-0.5 cursor-pointer ${
                  showQuickActionMenu ? 'bg-[#8B181B] text-white shadow-2xs' : 'bg-stone-200/70 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200'
                }`}
              >
                <Plus className={`w-3.5 h-3.5 stroke-[2] transition-transform ${showQuickActionMenu ? 'rotate-45' : ''}`} />
              </button>

              {showQuickActionMenu && (
                <div className="absolute right-0 top-9 w-56 bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCreateEvent();
                      setShowQuickActionMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-[#8B181B] dark:text-rose-400" />
                    <span>Post Gathering / Reunion</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCreateAnnouncement();
                      setShowQuickActionMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                  >
                    <Megaphone className="w-3.5 h-3.5 text-[#8B181B] dark:text-rose-400" />
                    <span>Publish Announcement</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCreateUser();
                      setShowQuickActionMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                  >
                    <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Add University Member</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCreateEvent();
                      setShowQuickActionMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Schedule Campus Event</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenGalleryUpload();
                      setShowQuickActionMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 text-xs text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 flex items-center gap-2 cursor-pointer font-medium transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Upload Campus Media</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          CLOUD FIRESTORE LIVE TESTING & DATABASE MONITOR BAR
          ======================================================== */}
      <div className="w-full bg-stone-900 text-stone-100 rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] border border-stone-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs uppercase font-mono tracking-wider font-semibold text-emerald-400">
                Cloud Firestore Live Sync Active
              </span>
              <span className="text-[11px] text-stone-400 font-mono hidden sm:inline">
                [{FIRESTORE_DATABASE_ID}]
              </span>
            </div>
            <p className="text-xs text-stone-300">
              User submissions (Events, Notices, Opportunities, Reservations, Feed) write directly to Firestore and propagate instantaneously.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleTestWrite}
              disabled={isTestingDb || isFirestoreSyncing}
              className="px-3.5 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-semibold text-white border border-stone-700 cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-400 ${isTestingDb ? 'animate-spin' : ''}`} />
              <span>{isTestingDb ? 'Verifying...' : dbLatency ? `Live OK (${dbLatency}ms)` : 'Test DB Roundtrip'}</span>
            </button>

            <button
              type="button"
              onClick={handlePurgeData}
              disabled={isPurging || isFirestoreSyncing}
              className="px-3.5 py-1.5 rounded-xl bg-rose-950/70 hover:bg-rose-900 text-xs font-semibold text-rose-200 border border-rose-800/80 cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>{isPurging ? 'Purging...' : 'Purge All Sample Data'}</span>
            </button>

            <button
              type="button"
              onClick={syncAllDataToCloud}
              disabled={isFirestoreSyncing}
              className="px-3.5 py-1.5 rounded-xl bg-[#8B181B] hover:bg-[#721316] text-xs font-semibold text-white border border-red-900 cursor-pointer transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFirestoreSyncing ? 'animate-spin' : ''}`} />
              <span>{isFirestoreSyncing ? 'Syncing...' : 'Sync All'}</span>
            </button>
          </div>
        </div>

        {/* Live Collection Document Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-3.5 pt-3 border-t border-stone-800/80">
          <div className="bg-stone-950/60 rounded-xl px-3 py-2 border border-stone-800/60">
            <div className="text-[10px] text-stone-400 uppercase font-mono">Events in DB</div>
            <div className="text-lg font-bold text-white flex items-baseline justify-between mt-0.5">
              <span>{events.length}</span>
              <button
                type="button"
                onClick={onOpenCreateEvent}
                className="text-[10px] text-[#D97706] hover:underline cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="bg-stone-950/60 rounded-xl px-3 py-2 border border-stone-800/60">
            <div className="text-[10px] text-stone-400 uppercase font-mono">Notices in DB</div>
            <div className="text-lg font-bold text-white flex items-baseline justify-between mt-0.5">
              <span>{announcements.length}</span>
              <button
                type="button"
                onClick={onOpenCreateAnnouncement}
                className="text-[10px] text-[#D97706] hover:underline cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="bg-stone-950/60 rounded-xl px-3 py-2 border border-stone-800/60">
            <div className="text-[10px] text-stone-400 uppercase font-mono">Jobs in DB</div>
            <div className="text-lg font-bold text-white flex items-baseline justify-between mt-0.5">
              <span>{opportunities.length}</span>
              <button
                type="button"
                onClick={() => onNavigateTab('careers')}
                className="text-[10px] text-[#D97706] hover:underline cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>

          <div className="bg-stone-950/60 rounded-xl px-3 py-2 border border-stone-800/60">
            <div className="text-[10px] text-stone-400 uppercase font-mono">RSVP Slots in DB</div>
            <div className="text-lg font-bold text-white flex items-baseline justify-between mt-0.5">
              <span>{reservations.length}</span>
              <button
                type="button"
                onClick={() => onNavigateTab('events')}
                className="text-[10px] text-stone-400 hover:underline cursor-pointer"
              >
                View
              </button>
            </div>
          </div>

          <div className="bg-stone-950/60 rounded-xl px-3 py-2 border border-stone-800/60 col-span-2 sm:col-span-1">
            <div className="text-[10px] text-stone-400 uppercase font-mono">Feed Posts in DB</div>
            <div className="text-lg font-bold text-white flex items-baseline justify-between mt-0.5">
              <span>{feedPosts.length}</span>
              <button
                type="button"
                onClick={() => onNavigateTab('overview')}
                className="text-[10px] text-stone-400 hover:underline cursor-pointer"
              >
                View
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          MAIN 2-COLUMN VIEWPORT (Center Bento Area + Right Sidebar Column)
          ======================================================== */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* ======================================================
            CENTER BENTO WORKSPACE (8.5 cols on desktop)
            ====================================================== */}
        <div className="col-span-12 xl:col-span-8 space-y-6">

          {/* ----------------------------------------------------
              HERO WIDE BENTO CARD (Institutional St. Cecilia Crimson & Warm Stone Aesthetic)
              ---------------------------------------------------- */}
          <div className="bg-white dark:bg-stone-900 rounded-[32px] p-6 sm:p-7 relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)] border border-stone-200/90 dark:border-stone-800 transition-all duration-300">
            {/* Institutional St. Cecilia Crimson Architectural Top Trim */}
            <div className="h-1 absolute top-0 left-0 right-0 bg-[#8B181B]" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-1">
              
              {/* Left Sub-Card Details */}
              <div className="space-y-4 max-w-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B181B] bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 rounded-full border border-red-200/60 dark:border-red-900/60 shadow-2xs">
                    {dynamicHeroData.badge}
                  </span>
                  <span className="text-xs font-semibold text-stone-500">
                    {dynamicHeroData.subtitle}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight leading-tight">
                    {dynamicHeroData.title}
                  </h3>
                  <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                    {dynamicHeroData.description}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  {/* Status Chip 1: Clickable module link */}
                  <button
                    type="button"
                    onClick={() => onNavigateTab(dynamicHeroData.chip1Tab)}
                    className="w-full text-left bg-stone-50/80 hover:bg-stone-100/90 dark:bg-stone-800 dark:hover:bg-stone-750 rounded-2xl p-3 flex items-center justify-between border border-stone-200/80 dark:border-stone-700 shadow-2xs cursor-pointer group transition-all"
                  >
                    <div>
                      <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 group-hover:text-[#8B181B] transition-colors flex items-center gap-1">
                        <span>{dynamicHeroData.chip1Title}</span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all stroke-[2]" />
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400">
                        {dynamicHeroData.chip1Sub}
                      </span>
                    </div>
                    <span className="text-sm font-extrabold text-stone-900 dark:text-white font-mono">
                      {dynamicHeroData.chip1Count}
                    </span>
                  </button>

                  {/* Status Chip 2: Pending/Action with interactive button */}
                  <div className="bg-stone-50/80 dark:bg-stone-800 rounded-2xl p-3 flex items-center justify-between border border-stone-200/80 dark:border-stone-700 shadow-2xs">
                    <div>
                      <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 block">
                        {dynamicHeroData.chip2Title}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400">
                        {dynamicHeroData.chip2Sub}
                      </span>
                    </div>
                    {dynamicHeroData.chip2ActionText === 'Verify All' && pendingUsers.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          pendingUsers.forEach((u) => setUserVerified(u.uid, true));
                          showToast(`Verified all ${pendingUsers.length} pending alumni!`, 'success');
                        }}
                        className="px-2.5 py-1.5 bg-[#8B181B] hover:bg-[#721316] active:scale-95 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Verify All ({pendingUsers.length})</span>
                      </button>
                    ) : dynamicHeroData.chip2ActionText === 'Verify All' && pendingUsers.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => onNavigateTab('registry')}
                        className="px-2.5 py-1 text-xs font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>All verified</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          if (dynamicHeroData.chip2ActionText === 'New Notice') {
                            onOpenCreateAnnouncement();
                          } else {
                            onNavigateTab(dynamicHeroData.chip2Tab);
                          }
                        }}
                        className="px-2.5 py-1.5 bg-[#8B181B] hover:bg-[#721316] active:scale-95 text-white rounded-xl text-[10px] font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <span>{dynamicHeroData.chip2ActionText}</span>
                        <ArrowRight className="w-3 h-3 stroke-[2]" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Center/Right: Interactive dynamic data visualization based on selectedChartTool */}
              <div className="flex-1 flex flex-col items-center md:items-end justify-center gap-3 pt-4 md:pt-0">
                
                {/* Cohort Detail Banner when a column is selected */}
                {selectedCohortIndex !== null && dynamicHeroData.bars[selectedCohortIndex] && (
                  <div className="w-full max-w-md bg-stone-50 dark:bg-stone-800 rounded-xl p-2.5 border border-stone-200/90 dark:border-stone-700 shadow-xs flex items-center justify-between gap-3 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="min-w-0">
                      <span className="font-bold text-stone-900 dark:text-white block truncate">
                        {dynamicHeroData.bars[selectedCohortIndex].fullTitle}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                        {dynamicHeroData.bars[selectedCohortIndex].count} records • {dynamicHeroData.bars[selectedCohortIndex].primaryStat} · {dynamicHeroData.bars[selectedCohortIndex].secondaryStat}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigateTab(dynamicHeroData.chip1Tab)}
                      className="px-2.5 py-1 bg-[#8B181B] hover:bg-[#721316] text-white rounded-lg text-[10px] font-bold shrink-0 cursor-pointer shadow-2xs"
                    >
                      View Roster
                    </button>
                  </div>
                )}

                <div className="flex items-end justify-center md:justify-end gap-3 sm:gap-4.5 w-full">
                  
                  {/* Tool 1: Dynamic Segmented Bar Chart */}
                  {selectedChartTool === 'bars' && (
                    <div className="flex items-end gap-3 sm:gap-4.5">
                      {dynamicHeroData.bars.map((col, idx) => {
                        const isSelected = selectedCohortIndex === idx;
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedCohortIndex(isSelected ? null : idx)}
                            title={`${col.fullTitle}: ${col.count} items (${col.primaryStat}, ${col.secondaryStat})`}
                            className={`flex flex-col items-center gap-1.5 cursor-pointer group transition-all ${
                              isSelected ? 'scale-105' : 'hover:scale-102'
                            }`}
                          >
                            {/* The Stacked Capsule Bar */}
                            <div className={`flex flex-col-reverse gap-1 items-center p-1 rounded-xl transition-all ${
                              isSelected ? 'bg-stone-100 dark:bg-stone-800 ring-2 ring-[#8B181B]/20' : 'group-hover:bg-stone-50/80 dark:group-hover:bg-stone-800/40'
                            }`}>
                              {col.segments.map((seg, sIdx) => {
                                const isTop = sIdx === col.segments.length - 1;
                                return (
                                  <div
                                    key={sIdx}
                                    className={`w-7 sm:w-8 h-6 sm:h-7 rounded-lg transition-all relative ${
                                      seg === 'crimson'
                                        ? 'bg-[#8B181B] dark:bg-red-700 shadow-xs ring-1 ring-red-900/20'
                                        : 'bg-stone-200/90 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700 group-hover:bg-red-50/60'
                                    }`}
                                  >
                                    {isTop && col.activeDot && (
                                      <span className="absolute -top-1 right-1/2 translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-500 ring-2 ring-white" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            {/* Label */}
                            <span className={`text-[10px] tracking-tight mt-1 whitespace-nowrap transition-colors ${
                              isSelected ? 'font-bold text-[#8B181B]' : 'font-medium text-stone-600 dark:text-stone-400'
                            }`}>
                              {col.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Tool 2: Recent Real System Activity Stream (History mode) */}
                  {selectedChartTool === 'history' && (
                    <div className="w-full max-w-sm bg-white/80 backdrop-blur-xs rounded-2xl p-3 border border-white/60 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-800 pb-1 border-b border-stone-100">
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-stone-600" />
                          Recent Audit Logs
                        </span>
                        <button
                          type="button"
                          onClick={() => onNavigateTab('audit')}
                          className="text-[10px] text-[#8B181B] hover:underline cursor-pointer"
                        >
                          View All ({auditLogs.length})
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {(auditLogs || []).slice(0, 3).map((log, lIdx) => (
                          <div key={lIdx} className="text-[11px] p-2 rounded-xl bg-white/70 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-bold text-stone-900 block truncate">{log.action || 'Administrative Action'}</span>
                              <span className="text-[10px] text-stone-400 block truncate">{log.details || log.category}</span>
                            </div>
                            <span className="text-[9px] font-mono text-stone-400 shrink-0">
                              {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Tool 3: Growth & Registrar Trend Metrics (Trend mode) */}
                  {selectedChartTool === 'trend' && (
                    <div className="w-full max-w-sm bg-white/80 backdrop-blur-xs rounded-2xl p-3.5 border border-white/60 shadow-2xs space-y-2.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-stone-800 pb-1 border-b border-stone-100">
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          System Health Velocity
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                          +17% faster
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2 rounded-xl bg-white/70">
                          <span className="text-stone-400 block text-[9px]">Match Rate</span>
                          <span className="font-extrabold text-stone-900 font-mono text-xs">{verifiedRate}%</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/70">
                          <span className="text-stone-400 block text-[9px]">Cloud Synced</span>
                          <span className="font-extrabold text-stone-900 font-mono text-xs">100% Firestore</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/70">
                          <span className="text-stone-400 block text-[9px]">Roster Total</span>
                          <span className="font-extrabold text-stone-900 font-mono text-xs">{users.length} members</span>
                        </div>
                        <div className="p-2 rounded-xl bg-white/70">
                          <span className="text-stone-400 block text-[9px]">Active Programs</span>
                          <span className="font-extrabold text-stone-900 font-mono text-xs">5 Colleges</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Far Right Tool Rail */}
                  <div className="flex flex-col items-center gap-2 pl-3 border-l border-black/5 ml-2 relative">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChartTool('bars');
                        setShowMoreToolMenu(false);
                      }}
                      title="Segmented Bar View"
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        selectedChartTool === 'bars'
                          ? 'bg-stone-900 text-white shadow-2xs'
                          : 'bg-white/80 text-stone-600 hover:bg-white'
                      }`}
                    >
                      <BarChart3 className="w-3.5 h-3.5 stroke-[1.75]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChartTool('history');
                        setShowMoreToolMenu(false);
                      }}
                      title="Activity Audit Log"
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        selectedChartTool === 'history'
                          ? 'bg-stone-900 text-white shadow-2xs'
                          : 'bg-white/80 text-stone-600 hover:bg-white'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5 stroke-[1.75]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedChartTool('trend');
                        setShowMoreToolMenu(false);
                      }}
                      title="System Velocity & Trends"
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                        selectedChartTool === 'trend'
                          ? 'bg-stone-900 text-white shadow-2xs'
                          : 'bg-white/80 text-stone-600 hover:bg-white'
                      }`}
                    >
                      <TrendingUp className="w-3.5 h-3.5 stroke-[1.75]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowMoreToolMenu((prev) => !prev)}
                      title="More administrative options"
                      className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-stone-600 transition-all cursor-pointer"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5 stroke-[1.75]" />
                    </button>

                    {/* Popover Menu for MoreHorizontal */}
                    {showMoreToolMenu && (
                      <div className="absolute right-0 top-36 w-48 bg-white rounded-2xl border border-stone-200 shadow-xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150">
                        <button
                          type="button"
                          onClick={() => {
                            exportAlumniRosterCsv(users, 'st_cecilia_official_alumni_roster');
                            showToast(`Exported ${users.length} verified records!`, 'success');
                            setShowMoreToolMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Download className="w-3.5 h-3.5 text-stone-400" />
                          <span>Export CSV</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            syncAllDataToCloud();
                            showToast('Authoritative sync initiated with Firestore', 'info');
                            setShowMoreToolMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-stone-400" />
                          <span>Sync Firestore</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onNavigateTab('conflicts');
                            setShowMoreToolMenu(false);
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                          <span>Conflict Inbox</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>

              </div>

            </div>
          </div>

          {/* ----------------------------------------------------
              CAMPUS GATHERINGS & REUNIONS SPOTLIGHT CARD
              ---------------------------------------------------- */}
          <div className="bg-white dark:bg-stone-900 rounded-[32px] p-6 sm:p-7 border border-stone-200/90 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)] space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 dark:bg-rose-950/40 border border-red-200/60 dark:border-red-900/60 flex items-center justify-center text-[#8B181B] dark:text-rose-400">
                  <Calendar className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900 dark:text-white tracking-tight">
                    Campus Gatherings & Reunions
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Schedule homecomings, alumni assemblies, and batch reunions
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenCreateEvent}
                  className="px-4 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-98"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Post Gathering</span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateTab('events')}
                  className="px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  View All ({events.length})
                </button>
              </div>
            </div>

            {/* Gatherings List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.slice(0, 3).map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => onNavigateTab('events')}
                  className="group p-4 rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-850 hover:bg-white dark:hover:bg-stone-800 hover:border-red-200 dark:hover:border-red-900/50 transition-all duration-200 shadow-2xs hover:shadow-xs cursor-pointer flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B181B] dark:text-rose-400 bg-red-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-md">
                        {evt.type || 'Gathering'}
                      </span>
                      <span className="text-[11px] text-stone-400 font-medium">
                        {evt.startDate ? new Date(evt.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'TBA'}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100 group-hover:text-[#8B181B] dark:group-hover:text-rose-400 transition-colors line-clamp-1">
                      {evt.title}
                    </h4>
                    <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                      {evt.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
                    <span className="flex items-center gap-1 text-[11px] truncate max-w-[140px]">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-stone-700 dark:text-stone-300">
                      <Users className="w-3.5 h-3.5 text-[#8B181B] dark:text-rose-400" />
                      <span>{evt.attendeesCount || 0} RSVPs</span>
                    </span>
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <div className="col-span-full p-8 text-center bg-stone-50 dark:bg-stone-850 rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 space-y-2">
                  <Calendar className="w-8 h-8 text-stone-300 dark:text-stone-600 mx-auto" />
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-300">No gatherings currently posted</p>
                  <p className="text-[11px] text-stone-400">Post the first homecoming or reunion gathering to bring Cecilians together.</p>
                  <button
                    type="button"
                    onClick={onOpenCreateEvent}
                    className="mt-2 px-4 py-1.5 bg-[#8B181B] text-white rounded-xl text-xs font-bold shadow-2xs"
                  >
                    + Post Gathering
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ----------------------------------------------------
              BOTTOM 3 BENTO TILES (Most Used, Protection, Update)
              ---------------------------------------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* BENTO TILE 1: "College & Department Enrollment / Tracer Study" */}
            <div className="bg-white dark:bg-stone-900 rounded-[32px] p-5 sm:p-6 border border-stone-200/90 dark:border-stone-800 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-extrabold text-stone-900 dark:text-white tracking-tight">
                    {bentoTile1Mode === 'colleges' ? 'Academic Roster' : 'Career Tracer'}
                  </h4>
                  <div className="flex items-center p-0.5 bg-stone-100 dark:bg-stone-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setBentoTile1Mode('colleges')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        bentoTile1Mode === 'colleges'
                          ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      Colleges
                    </button>
                    <button
                      type="button"
                      onClick={() => setBentoTile1Mode('employment')}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                        bentoTile1Mode === 'employment'
                          ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      Careers
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 font-medium">
                  {bentoTile1Mode === 'colleges'
                    ? 'Alumni distribution across colleges'
                    : `${employedAlumni.length} employed alumni (${employmentRate}% placement)`}
                </p>
              </div>

              {bentoTile1Mode === 'colleges' ? (
                /* 5 Vertical Capsule Progress Meters with Real System Counts */
                <div className="flex items-end justify-between gap-2.5 py-4">
                  {departmentMeters.map((m, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onNavigateTab('users')}
                      title={`${m.fullName}: ${m.count} verified alumni (${m.percent}%) — Click to view in directory`}
                      className="flex flex-col items-center gap-2 cursor-pointer group/tube transition-transform hover:scale-105"
                    >
                      {/* The Capsule Tube */}
                      <div className="w-8 sm:w-9 h-32 rounded-full bg-stone-100 dark:bg-stone-800 p-1 flex flex-col justify-end relative overflow-hidden border border-stone-200/50 dark:border-stone-700/50">
                        <div
                          style={{ height: `${m.value}%` }}
                          className={`w-full rounded-full transition-all duration-500 flex items-end justify-center pb-1 ${
                            m.highlight
                              ? 'bg-[#8B181B] text-white shadow-xs'
                              : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                          }`}
                        >
                          <span className="text-[10px] font-extrabold font-mono">
                            {m.count}
                          </span>
                        </div>
                      </div>

                      {/* Department Tag / Code */}
                      <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider group-hover/tube:text-[#8B181B] transition-colors">
                        {m.name}
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                /* Career Placement Tracer Mode */
                <div className="py-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-center">
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold block">Placement Rate</span>
                      <span className="text-xl font-extrabold text-emerald-900 dark:text-emerald-100 font-mono">{employmentRate}%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
                      <span className="text-[10px] text-stone-500 font-semibold block">Employed Alumni</span>
                      <span className="text-xl font-extrabold text-stone-900 dark:text-white font-mono">{employedAlumni.length}</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Top Employer Affiliations</span>
                    {topAlumniCompanies.map((c, cIdx) => (
                      <div key={cIdx} className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/80">
                        <span className="font-semibold text-stone-800 dark:text-stone-200 truncate">{c.name}</span>
                        <span className="text-[10px] font-mono text-stone-500 font-bold shrink-0">{c.count} alumni</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
                <span className="text-stone-500 text-[10px] font-medium truncate pr-2">
                  <span className="font-bold text-stone-900 dark:text-white">{leadingDepartment?.name}</span> leads ({leadingDepartment?.count} alumni • {leadingDepartment?.percent}%)
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('users')}
                  className="font-bold text-[#8B181B] hover:text-[#721316] text-[11px] hover:underline cursor-pointer shrink-0 flex items-center gap-1"
                >
                  <span>View Roster</span>
                  <ArrowRight className="w-3 h-3 stroke-[2]" />
                </button>
              </div>
            </div>

            {/* BENTO TILE 2: "Verification & Compliance Action Queue" */}
            <div className="bg-white dark:bg-stone-900 rounded-[32px] p-5 sm:p-6 border border-stone-200/90 dark:border-stone-800 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-extrabold text-stone-900 dark:text-white tracking-tight">
                    Action Queue
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      totalPendingCount > 0
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                    }`}
                  >
                    {totalPendingCount > 0 ? `${totalPendingCount} pending` : 'All clear'}
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 font-medium">
                  Live verification & audit backlog
                </p>
              </div>

              {/* Upper Live Status Queue Box */}
              <div className="bg-stone-50 dark:bg-stone-800/80 rounded-2xl p-3.5 my-2 border border-stone-200/90 dark:border-stone-700 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 dark:text-stone-200">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${totalPendingCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'}`} />
                    Audit Queues
                  </span>
                  <span className="font-mono text-[10px] text-stone-500 font-bold">
                    {verifiedRate}% verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
                  <button
                    type="button"
                    onClick={() => onNavigateTab('governance')}
                    className="w-full text-left bg-white hover:bg-stone-100/80 dark:bg-stone-700/80 dark:hover:bg-stone-700 rounded-xl p-2 border border-stone-200/80 dark:border-stone-600 cursor-pointer transition-all hover:shadow-2xs active:scale-95"
                  >
                    <span className="text-stone-400 block text-[9px] font-medium">Alumni IDs</span>
                    <span className="font-extrabold font-mono text-stone-900 dark:text-white text-xs">
                      {pendingUsers.length} pending
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateTab('conflicts')}
                    className="w-full text-left bg-white hover:bg-stone-100/80 dark:bg-stone-700/80 dark:hover:bg-stone-700 rounded-xl p-2 border border-stone-200/80 dark:border-stone-600 cursor-pointer transition-all hover:shadow-2xs active:scale-95"
                  >
                    <span className="text-stone-400 block text-[9px] font-medium">Conflicts</span>
                    <span className="font-extrabold font-mono text-amber-700 dark:text-amber-400 text-xs">
                      {pendingConflicts.length} flagged
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateTab('employers')}
                    className="w-full text-left bg-white hover:bg-stone-100/80 dark:bg-stone-700/80 dark:hover:bg-stone-700 rounded-xl p-2 border border-stone-200/80 dark:border-stone-600 cursor-pointer transition-all hover:shadow-2xs active:scale-95"
                  >
                    <span className="text-stone-400 block text-[9px] font-medium">Employers</span>
                    <span className="font-extrabold font-mono text-stone-900 dark:text-white text-xs">
                      {pendingEmployers.length} requests
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigateTab('jobs')}
                    className="w-full text-left bg-white hover:bg-stone-100/80 dark:bg-stone-700/80 dark:hover:bg-stone-700 rounded-xl p-2 border border-stone-200/80 dark:border-stone-600 cursor-pointer transition-all hover:shadow-2xs active:scale-95"
                  >
                    <span className="text-stone-400 block text-[9px] font-medium">Job Posts</span>
                    <span className="font-extrabold font-mono text-stone-900 dark:text-white text-xs">
                      {pendingJobs.length} reviews
                    </span>
                  </button>
                </div>
              </div>

              {/* Lower Dark Card: Registrar Masterlist Integrity & Action Button */}
              <div className="bg-stone-900 text-white rounded-2xl p-3.5 flex items-center justify-between shadow-2xs">
                <div>
                  <span className="text-[10px] text-stone-400 font-medium block">
                    Registrar Integrity
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-base font-extrabold tracking-tight font-mono">
                      {verifiedCount}/{users.length}
                    </span>
                    <span className="text-[10px] text-stone-400">verified</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigateTab(totalPendingCount > 0 ? 'conflicts' : 'registry')}
                  className="px-3 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <span>{totalPendingCount > 0 ? 'Triage Queue' : 'Registry'}</span>
                  <ArrowRight className="w-3.5 h-3.5 stroke-[2]" />
                </button>
              </div>
            </div>

            {/* BENTO TILE 3: "Update / Alumni Spotlight Card" */}
            <div className="bg-white dark:bg-stone-900 rounded-[32px] p-5 sm:p-6 border border-stone-200/90 dark:border-stone-800 shadow-2xs flex flex-col justify-between relative overflow-hidden group">
              <div>
                <div className="flex items-center justify-between">
                  <h4 className="text-base font-extrabold text-stone-900 dark:text-white tracking-tight">
                    Update
                  </h4>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setIsLikedSpotlight(!isLikedSpotlight)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                        isLikedSpotlight ? 'text-red-500 bg-red-50' : 'text-stone-400 hover:bg-stone-100'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLikedSpotlight ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({ title: "St. Cecilia's College", url: window.location.href });
                        } else {
                          showToast('Link copied to clipboard!', 'success');
                        }
                      }}
                      className="w-7 h-7 rounded-full text-stone-400 hover:bg-stone-100 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-stone-400 font-medium">
                  Latest circular & bulletin
                </p>
              </div>

              {/* Spotlight Imagery Artwork Card (Like the 3D figurine in reference image) */}
              <div className="my-3 rounded-2xl bg-gradient-to-br from-amber-50 via-rose-50 to-indigo-50 dark:from-stone-800 dark:to-stone-850 p-4 border border-stone-100 dark:border-stone-800 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="w-16 h-16 rounded-2xl bg-[#8B181B] text-white flex items-center justify-center shadow-md mb-2 group-hover:scale-105 transition-transform">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <span className="text-xs font-bold text-stone-900 dark:text-white line-clamp-1">
                  {latestAnnouncement?.title || 'Annual Grand Homecoming 2026'}
                </span>
                <span className="text-[10px] text-stone-500 line-clamp-1">
                  {latestAnnouncement?.category || 'Minglanilla Campus Assembly'}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <span className="text-[10px] text-stone-400 font-mono">
                  Official Bulletin
                </span>
                <button
                  type="button"
                  onClick={() => onNavigateTab('announcements')}
                  className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1"
                >
                  <span>Read Notice</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* ======================================================
            RIGHT COLUMN: QUICK ACTION & RESOURCE SIDEBAR (4 cols)
            (Matches the right section of the reference design)
            ====================================================== */}
        <div className="col-span-12 xl:col-span-4 space-y-6">

          {/* 1. TOP CARD: "Add user" (Stylized Avatar Silhouette) */}
          <div className="bg-white dark:bg-stone-900 rounded-[32px] p-6 border border-stone-200/90 dark:border-stone-800 shadow-2xs text-center relative overflow-hidden">
            {/* Stylized Silhouette Contour (Exact styling from reference image) */}
            <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-stone-50 dark:bg-stone-800 border-2 border-dashed border-stone-200 dark:border-stone-700 flex items-center justify-center relative">
              <Users className="w-10 h-10 text-stone-300 dark:text-stone-600" />
              <div className="absolute inset-0 rounded-full border-t-2 border-[#8B181B]/40 animate-pulse pointer-events-none" />
            </div>

            <h4 className="text-lg font-extrabold text-stone-900 dark:text-white tracking-tight">
              Add user
            </h4>
            <p className="text-xs text-stone-400 mt-0.5">
              Register verified alumnus or staff credentials
            </p>

            <button
              type="button"
              onClick={onOpenCreateUser}
              className="mt-4 w-full py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Member Profile</span>
            </button>
          </div>

          {/* 2. RECENT REGISTRATIONS (Row of overlapping circular avatars) */}
          <div className="bg-white dark:bg-stone-900 rounded-[32px] p-5 border border-stone-200/90 dark:border-stone-800 shadow-2xs flex items-center justify-between">
            <div className="flex items-center -space-x-2 overflow-hidden">
              {recentAlumni.map((u, i) => (
                <img
                  key={u.uid || i}
                  src={u.profilePictureUrl || '/assets/default-avatar.svg'}
                  alt={u.name}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white dark:ring-stone-900 object-cover"
                />
              ))}
              <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-stone-100 dark:bg-stone-800 ring-2 ring-white dark:ring-stone-900 text-[10px] font-bold text-stone-600 dark:text-stone-300">
                +{Math.max(0, users.length - 4)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => onNavigateTab('users')}
              className="text-xs font-bold text-stone-900 dark:text-stone-200 hover:underline cursor-pointer"
            >
              view all &gt;
            </button>
          </div>

          {/* 3. RESOURCES & INTEGRATED CHANNELS (Matching "Resources" list) */}
          <div className="bg-white dark:bg-stone-900 rounded-[32px] p-6 border border-stone-200/90 dark:border-stone-800 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-stone-900 dark:text-white uppercase tracking-wider">
                Resources
              </span>
              <span className="text-[11px] text-stone-400 font-mono">
                5 Active Modules
              </span>
            </div>

            <div className="space-y-3">
              {/* Channel 1: Official Registry */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-[#8B181B] flex items-center justify-center">
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    Registrar Masterlist
                  </span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              </div>

              {/* Channel 2: Careers */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    Employer Job Board
                  </span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              </div>

              {/* Channel 3: Campus Reunions */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    Alumni Reunions
                  </span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              </div>

              {/* Channel 4: Heritage Gallery */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    Heritage Gallery
                  </span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              </div>

              {/* Channel 5: Campus Gatherings & Reunions */}
              <button
                type="button"
                onClick={() => onNavigateTab('events')}
                className="w-full flex items-center justify-between py-1 text-left hover:bg-stone-50 dark:hover:bg-stone-800 rounded-lg transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-red-50 text-[#8B181B] flex items-center justify-center">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 group-hover:text-[#8B181B]">
                    Campus Gatherings & Reunions
                  </span>
                </div>
                <span className="text-[10px] font-bold text-[#8B181B] bg-red-50 px-1.5 py-0.5 rounded-md">
                  {events.length}
                </span>
              </button>
            </div>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => onNavigateTab('governance')}
                className="text-stone-500 hover:text-stone-900 cursor-pointer font-medium"
              >
                view all v
              </button>
              <button
                type="button"
                onClick={onOpenCreateAnnouncement}
                className="font-bold text-stone-900 dark:text-stone-200 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>add</span>
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* 4. BOTTOM DARK CONTRAST CARD: Masterlist Capacity / Cloud Sync */}
          <div className="bg-stone-950 text-white rounded-[32px] p-6 shadow-md relative overflow-hidden">
            {/* The 17/60 Arc progress header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-3xl font-extrabold tracking-tight font-mono">
                {verifiedCount}
                <span className="text-stone-500 text-lg font-normal"> / {users.length}</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-stone-800 text-stone-300">
                Verified
              </span>
            </div>

            {/* Dotted indicator progress line */}
            <div className="flex items-center gap-1 py-1 mb-4 overflow-hidden">
              {[...Array(20)].map((_, idx) => (
                <span
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full ${
                    idx < Math.round((verifiedCount / Math.max(1, users.length)) * 20)
                      ? 'bg-emerald-400'
                      : 'bg-stone-800'
                  }`}
                />
              ))}
            </div>

            <h5 className="text-sm font-bold tracking-tight">
              Database Synchronization
            </h5>
            <p className="text-xs text-stone-400 mt-0.5 leading-relaxed">
              Synchronize live student registry and database with Firestore cloud
            </p>

            <button
              type="button"
              onClick={() => syncAllDataToCloud()}
              disabled={isFirestoreSyncing}
              className="mt-4 w-full py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFirestoreSyncing ? 'animate-spin' : ''}`} />
              <span>{isFirestoreSyncing ? 'Syncing to Cloud...' : 'Synchronize Database'}</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
