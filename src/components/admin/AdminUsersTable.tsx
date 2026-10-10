/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  UserPlus,
  Lock,
  Check,
  X,
  Shield,
  ShieldCheck,
  AlertCircle,
  GraduationCap,
  Briefcase,
  LayoutGrid,
  List,
  Sparkles,
  TrendingUp,
  Mail,
  Building2,
  Globe,
  BarChart3,
  ArrowRight,
  Activity,
  Layers,
  Download,
  MapPin,
  Clock
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { UserProfile, UserRole } from '../../types';
import { getUserAvatar, handleUserAvatarError } from '../../lib/defaultImages';
import { exportAlumniRosterCsv } from '../../services/adminExportService';

interface AdminUsersTableProps {
  onOpenCreateUser: () => void;
}

export const AdminUsersTable: React.FC<AdminUsersTableProps> = ({ onOpenCreateUser }) => {
  const {
    users,
    currentUser,
    setUserVerified,
    updateUserRole,
    deleteAlumni,
    setSelectedUserIdForModal,
    permissions,
    showToast
  } = useAlumni();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [batchFilter, setBatchFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [userToDelete, setUserToDelete] = useState<{ uid: string; name: string } | null>(null);
  const [visibleUserCount, setVisibleUserCount] = useState<number>(12);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Command Intelligence Bento Card States
  const [selectedChartTool, setSelectedChartTool] = useState<'bars' | 'faculties' | 'status'>('bars');
  const [selectedCohortIndex, setSelectedCohortIndex] = useState<number | null>(null);

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

  useEffect(() => {
    setVisibleUserCount(12);
  }, [searchQuery, roleFilter, batchFilter, courseFilter, statusFilter]);

  // Distinct batches and courses for filter dropdowns
  const allBatches = useMemo(() => {
    const batches = Array.from(new Set(users.map((u) => u.batch).filter(Boolean)));
    return ['all', ...batches.sort().reverse()];
  }, [users]);

  const allCourses = useMemo(() => {
    const courses = Array.from(new Set(users.map((u) => u.course).filter(Boolean)));
    return ['all', ...courses.sort()];
  }, [users]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.course || '').toLowerCase().includes(q) ||
        (u.batch || '').includes(q) ||
        (u.studentId || '').toLowerCase().includes(q) ||
        (u.company || '').toLowerCase().includes(q) ||
        (u.currentPosition || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q);

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;
      const matchesBatch = batchFilter === 'all' || u.batch === batchFilter;
      const matchesCourse = courseFilter === 'all' || u.course === courseFilter;

      const matchesStatus =
        statusFilter === 'all'
          ? true
          : statusFilter === 'verified'
          ? u.isVerified
          : !u.isVerified;

      return matchesSearch && matchesRole && matchesBatch && matchesCourse && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, batchFilter, courseFilter, statusFilter]);

  // Stats calculation
  const totalVerified = useMemo(() => users.filter((u) => u.isVerified).length, [users]);
  const totalPending = useMemo(() => users.filter((u) => !u.isVerified).length, [users]);
  const verifiedRate = users.length > 0 ? Math.round((totalVerified / users.length) * 100) : 0;
  
  const roleBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return counts;
  }, [users]);

  // Command Center 7-Cohort Segmented Bar Distribution Data
  const commandCohortData = useMemo(() => {
    const recentBatches = ['2018', '2019', '2020', '2021', '2022', '2023', '2024'];
    const bars = recentBatches.map((batchYear) => {
      const cohortUsers = users.filter((u) => u.batch === batchYear || (u.course && u.course.includes(batchYear)));
      const verified = cohortUsers.filter((u) => u.isVerified).length;
      const count = cohortUsers.length;
      const segments: ('crimson' | 'muted')[] = [];
      const segCount = Math.min(5, Math.max(1, count || 1));
      for (let i = 0; i < segCount; i++) {
        segments.push(i < verified ? 'crimson' : 'muted');
      }
      return {
        label: `'${batchYear.slice(-2)}`,
        fullTitle: `Class of ${batchYear}`,
        batchYear,
        count: count || 0,
        primaryStat: `${verified} verified`,
        secondaryStat: `${count - verified} pending clearance`,
        segments: segments.length > 0 ? segments : (['crimson'] as ('crimson' | 'muted')[]),
        activeDot: (count - verified) > 0
      };
    });

    return {
      badge: 'Command Registry',
      subtitle: 'Alumni Cohort Intelligence & Clearance',
      title: 'Directory & Clearance Console',
      description: `${users.length} authenticated Cecilians enrolled in registry • ${verifiedRate}% registrar-verified credentials`,
      chip1Title: 'Live Roster Directory',
      chip1Sub: `${filteredUsers.length} records matched in current query`,
      chip1Count: filteredUsers.length,
      chip2Title: 'Pending Clearance',
      chip2Sub: `${totalPending} accounts requiring registrar audit`,
      chip2Count: totalPending,
      bars
    };
  }, [users, filteredUsers.length, totalPending, verifiedRate]);

  // Academic Faculties Distribution
  const facultyMeters = useMemo(() => {
    const counts = { CCS: 0, COE: 0, CBA: 0, CTE: 0, CAS: 0 };
    users.forEach((u) => {
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
    const totalCount = users.length || 1;

    return [
      { code: 'CCS', name: 'Computer Studies & IT', count: counts.CCS, percent: Math.round((counts.CCS / totalCount) * 100), val: Math.max(15, Math.round((counts.CCS / maxCount) * 100)) },
      { code: 'COE', name: 'College of Engineering', count: counts.COE, percent: Math.round((counts.COE / totalCount) * 100), val: Math.max(15, Math.round((counts.COE / maxCount) * 100)) },
      { code: 'CBA', name: 'Business Administration', count: counts.CBA, percent: Math.round((counts.CBA / totalCount) * 100), val: Math.max(15, Math.round((counts.CBA / maxCount) * 100)) },
      { code: 'CTE', name: 'Teacher Education', count: counts.CTE, percent: Math.round((counts.CTE / totalCount) * 100), val: Math.max(15, Math.round((counts.CTE / maxCount) * 100)) },
      { code: 'CAS', name: 'Arts & Sciences', count: counts.CAS, percent: Math.round((counts.CAS / totalCount) * 100), val: Math.max(15, Math.round((counts.CAS / maxCount) * 100)) },
    ];
  }, [users]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedUids.length === filteredUsers.length) {
      setSelectedUids([]);
    } else {
      setSelectedUids(filteredUsers.map((u) => u.uid));
    }
  };

  const handleToggleSelect = (uid: string) => {
    setSelectedUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleBulkVerify = () => {
    if (selectedUids.length === 0) return;
    selectedUids.forEach((uid) => {
      setUserVerified(uid, true);
    });
    showToast(`Successfully verified ${selectedUids.length} selected users!`, 'success');
    setSelectedUids([]);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    await deleteAlumni(userToDelete.uid);
    setUserToDelete(null);
  };

  return (
    <div className="space-y-6 pb-12 antialiased">
      {/* ========================================================
          COMMAND CENTER TOP HEADER SECTION
          Exact parity with Institutional Command Center layout:
          Bold Display Header + Sensor Gauges + Action Strip + View Switcher + CSV Download
          ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        {/* Left: Brand Kicker, Title & Sensor Gauges */}
        <div className="flex flex-wrap items-center gap-6 sm:gap-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B181B] bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 rounded-full border border-red-200/60 dark:border-red-900/60 shadow-2xs">
                Command Registry
              </span>
              <span className="text-xs text-stone-500 font-medium">Alumni Directory & Clearance Desk</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 dark:text-white tracking-tight font-sans">
              Alumni Directory
            </h1>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              St. Cecilia's College • Central Member Registry & Identity Clearance Backlog
            </p>
          </div>

          {/* Sensor Gauge 1: Verified Cecilians */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-stone-300 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block leading-tight font-medium">
                Verified Clearance
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight font-mono">
                  {totalVerified}
                </span>
                <span className="text-[10px] text-stone-400 font-medium">{verifiedRate}% rate</span>
              </div>
            </div>
          </div>

          {/* Sensor Gauge 2: Network Roster Size */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-stone-300 dark:border-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 shrink-0">
              <Globe className="w-4 h-4 text-[#8B181B]" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block leading-tight font-medium">
                Total Enrolled
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight font-mono">
                  {users.length}
                </span>
                <span className="text-[10px] text-stone-400 font-medium">accounts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Provision User + View Mode Toggle + Download CSV */}
        <div className="flex items-center gap-3 flex-wrap">
          {(permissions.canAssignRoles || permissions.canAccessAdminPanel) && (
            <button
              onClick={onOpenCreateUser}
              id="admin-users-add-user-btn"
              className="flex items-center gap-2 px-4 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-all shadow-[0_2px_8px_rgba(139,24,27,0.25)] cursor-pointer active:scale-95"
              title="Provision a new user account with role"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Provision User</span>
            </button>
          )}

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
          COMMAND INTELLIGENCE BENTO GRID
          Hero Wide Bento Card (8 Cols) + Action Queue Bento Card (4 Cols)
          ======================================================== */}
      <div className="grid grid-cols-12 gap-6">
        {/* HERO WIDE BENTO CARD */}
        <div className="col-span-12 xl:col-span-8 bg-white dark:bg-stone-900 rounded-[32px] p-6 sm:p-7 relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)] border border-stone-200/90 dark:border-stone-800 transition-all duration-300">
          {/* Institutional St. Cecilia Crimson Architectural Top Trim */}
          <div className="h-1 absolute top-0 left-0 right-0 bg-[#8B181B]" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-1">
            {/* Left Sub-Card Details */}
            <div className="space-y-4 max-w-sm">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B181B] bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 rounded-full border border-red-200/60 dark:border-red-900/60 shadow-2xs">
                  {commandCohortData.badge}
                </span>
                <span className="text-xs font-semibold text-stone-500">
                  {commandCohortData.subtitle}
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight leading-tight">
                  {commandCohortData.title}
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400 mt-1 leading-relaxed">
                  {commandCohortData.description}
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {/* Status Chip 1: Clickable Filter Reset */}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setRoleFilter('all');
                    setBatchFilter('all');
                    setCourseFilter('all');
                    setStatusFilter('all');
                    setSelectedCohortIndex(null);
                  }}
                  className="w-full text-left bg-stone-50/80 hover:bg-stone-100/90 dark:bg-stone-800 dark:hover:bg-stone-750 rounded-2xl p-3 flex items-center justify-between border border-stone-200/80 dark:border-stone-700 shadow-2xs cursor-pointer group transition-all"
                >
                  <div>
                    <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 group-hover:text-[#8B181B] transition-colors flex items-center gap-1">
                      <span>{commandCohortData.chip1Title}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all stroke-[2]" />
                    </span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400">
                      {commandCohortData.chip1Sub}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-stone-900 dark:text-white font-mono">
                    {commandCohortData.chip1Count}
                  </span>
                </button>

                {/* Status Chip 2: Quick Jump to Pending Clearance */}
                <button
                  type="button"
                  onClick={() => setStatusFilter('pending')}
                  className="w-full text-left bg-stone-50/80 hover:bg-stone-100/90 dark:bg-stone-800 dark:hover:bg-stone-750 rounded-2xl p-3 flex items-center justify-between border border-stone-200/80 dark:border-stone-700 shadow-2xs cursor-pointer group transition-all"
                >
                  <div>
                    <span className="text-[11px] font-bold text-stone-800 dark:text-stone-200 group-hover:text-[#8B181B] transition-colors flex items-center gap-1">
                      <span>{commandCohortData.chip2Title}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all stroke-[2]" />
                    </span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400">
                      {commandCohortData.chip2Sub}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-amber-700 dark:text-amber-300 font-mono">
                    {commandCohortData.chip2Count}
                  </span>
                </button>
              </div>
            </div>

            {/* Center/Right: Interactive dynamic data visualization based on selectedChartTool */}
            <div className="flex-1 flex flex-col items-center md:items-end justify-center gap-3 pt-4 md:pt-0">
              {/* Cohort Detail Banner when a column is selected */}
              {selectedCohortIndex !== null && commandCohortData.bars[selectedCohortIndex] && (
                <div className="w-full max-w-md bg-stone-50 dark:bg-stone-800 rounded-xl p-2.5 border border-stone-200/90 dark:border-stone-700 shadow-xs flex items-center justify-between gap-3 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="min-w-0">
                    <span className="font-bold text-stone-900 dark:text-white block truncate">
                      {commandCohortData.bars[selectedCohortIndex].fullTitle}
                    </span>
                    <span className="text-[10px] text-stone-500 dark:text-stone-400 font-medium">
                      {commandCohortData.bars[selectedCohortIndex].count} records • {commandCohortData.bars[selectedCohortIndex].primaryStat} · {commandCohortData.bars[selectedCohortIndex].secondaryStat}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchFilter(commandCohortData.bars[selectedCohortIndex].batchYear);
                      setSelectedCohortIndex(null);
                    }}
                    className="px-2.5 py-1 bg-[#8B181B] hover:bg-[#721316] text-white rounded-lg text-[10px] font-bold shrink-0 cursor-pointer shadow-2xs"
                  >
                    Filter Batch
                  </button>
                </div>
              )}

              <div className="flex items-end justify-center md:justify-end gap-3 sm:gap-4.5 w-full">
                {/* Tool 1: Cohort Segmented Bar Chart */}
                {selectedChartTool === 'bars' && (
                  <div className="flex items-end gap-3 sm:gap-4.5">
                    {commandCohortData.bars.map((col, idx) => {
                      const isSelected = selectedCohortIndex === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => setSelectedCohortIndex(isSelected ? null : idx)}
                          title={`${col.fullTitle}: ${col.count} alumni (${col.primaryStat}, ${col.secondaryStat}) — Click to inspect`}
                          className={`flex flex-col items-center gap-1.5 cursor-pointer group transition-all ${
                            isSelected ? 'scale-105' : 'hover:scale-102'
                          }`}
                        >
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

                {/* Tool 2: Academic Faculties Meter Breakdown */}
                {selectedChartTool === 'faculties' && (
                  <div className="w-full max-w-sm bg-stone-50/90 dark:bg-stone-800 rounded-2xl p-3.5 border border-stone-200/80 dark:border-stone-700 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-800 dark:text-stone-200 pb-1 border-b border-stone-200/60">
                      <span className="flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-[#8B181B]" />
                        Academic Disciplines Distribution
                      </span>
                      <span className="text-[10px] font-mono text-[#8B181B] font-bold">
                        5 Colleges
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {facultyMeters.map((fac) => (
                        <div
                          key={fac.code}
                          onClick={() => setCourseFilter(fac.name.split(' ')[0])}
                          className="flex items-center justify-between text-[11px] p-1.5 rounded-xl bg-white dark:bg-stone-700/70 hover:bg-red-50/60 transition-colors cursor-pointer border border-stone-100 dark:border-stone-600/60"
                        >
                          <span className="font-semibold text-stone-800 dark:text-stone-200 truncate pr-2">
                            {fac.name}
                          </span>
                          <span className="font-mono text-[10px] font-bold text-[#8B181B] shrink-0">
                            {fac.count} alumni ({fac.percent}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tool 3: Clearance Breakdown Status */}
                {selectedChartTool === 'status' && (
                  <div className="w-full max-w-sm bg-stone-50/90 dark:bg-stone-800 rounded-2xl p-3.5 border border-stone-200/80 dark:border-stone-700 space-y-2.5">
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-800 dark:text-stone-200 pb-1 border-b border-stone-200/60">
                      <span className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-emerald-600" />
                        Clearance Verification Breakdown
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                        {verifiedRate}%
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setStatusFilter('verified')}
                        className="p-2 rounded-xl bg-white dark:bg-stone-700 text-left hover:border-emerald-300 border border-stone-200/60 cursor-pointer"
                      >
                        <span className="text-stone-400 block text-[9px]">Verified</span>
                        <span className="font-extrabold text-emerald-700 dark:text-emerald-300 font-mono text-xs">
                          {totalVerified} cleared
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatusFilter('pending')}
                        className="p-2 rounded-xl bg-white dark:bg-stone-700 text-left hover:border-amber-300 border border-stone-200/60 cursor-pointer"
                      >
                        <span className="text-stone-400 block text-[9px]">Pending</span>
                        <span className="font-extrabold text-amber-700 dark:text-amber-300 font-mono text-xs">
                          {totalPending} backlog
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRoleFilter('alumni')}
                        className="p-2 rounded-xl bg-white dark:bg-stone-700 text-left hover:border-purple-300 border border-stone-200/60 cursor-pointer"
                      >
                        <span className="text-stone-400 block text-[9px]">Alumni</span>
                        <span className="font-extrabold text-purple-700 dark:text-purple-300 font-mono text-xs">
                          {roleBreakdown['alumni'] || 0} graduates
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setStatusFilter('all');
                          setRoleFilter('all');
                        }}
                        className="p-2 rounded-xl bg-white dark:bg-stone-700 text-left border border-stone-200/60 cursor-pointer"
                      >
                        <span className="text-stone-400 block text-[9px]">Total Roster</span>
                        <span className="font-extrabold text-stone-900 dark:text-white font-mono text-xs">
                          {users.length} enrolled
                        </span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Right Tool Rail */}
                <div className="flex flex-col items-center gap-2 pl-3 border-l border-stone-200 dark:border-stone-700 ml-2 relative">
                  <button
                    type="button"
                    onClick={() => setSelectedChartTool('bars')}
                    title="Segmented Cohort Bar View"
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      selectedChartTool === 'bars'
                        ? 'bg-[#8B181B] text-white shadow-2xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 stroke-[1.75]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedChartTool('faculties')}
                    title="Faculty Distribution Breakdown"
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      selectedChartTool === 'faculties'
                        ? 'bg-[#8B181B] text-white shadow-2xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 stroke-[1.75]" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedChartTool('status')}
                    title="Clearance Status Breakdown"
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                      selectedChartTool === 'status'
                        ? 'bg-[#8B181B] text-white shadow-2xs'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5 stroke-[1.75]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BENTO TILE 2: "Verification & Compliance Action Queue" */}
        <div className="col-span-12 xl:col-span-4 bg-white dark:bg-stone-900 rounded-[32px] p-5 sm:p-6 border border-stone-200/90 dark:border-stone-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-base font-extrabold text-stone-900 dark:text-white tracking-tight">
                Clearance Action Queue
              </h4>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  totalPending > 0
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}
              >
                {totalPending > 0 ? `${totalPending} pending` : 'All clear'}
              </span>
            </div>
            <p className="text-[11px] text-stone-400 font-medium">
              Live identity verification & role management
            </p>
          </div>

          {/* Upper Live Status Queue Box */}
          <div className="bg-stone-50 dark:bg-stone-800/80 rounded-2xl p-3.5 my-2 border border-stone-200/90 dark:border-stone-700 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 dark:text-stone-200">
              <span className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${totalPending > 0 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-600'}`} />
                Registrar Backlog
              </span>
              <span className="font-mono text-[10px] text-stone-500 font-bold">
                {verifiedRate}% verified
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
              <button
                type="button"
                onClick={() => setStatusFilter('pending')}
                className="w-full text-left bg-white hover:bg-stone-100/80 dark:bg-stone-700/80 dark:hover:bg-stone-700 rounded-xl p-2 border border-stone-200/80 dark:border-stone-600 cursor-pointer transition-all hover:shadow-2xs active:scale-95"
              >
                <span className="text-stone-400 block text-[9px] font-medium">Pending Clearances</span>
                <span className="font-extrabold font-mono text-amber-700 dark:text-amber-300 text-xs">
                  {totalPending} accounts
                </span>
              </button>

              <button
                type="button"
                onClick={() => setRoleFilter('admin')}
                className="w-full text-left bg-white hover:bg-stone-100/80 dark:bg-stone-700/80 dark:hover:bg-stone-700 rounded-xl p-2 border border-stone-200/80 dark:border-stone-600 cursor-pointer transition-all hover:shadow-2xs active:scale-95"
              >
                <span className="text-stone-400 block text-[9px] font-medium">Staff & Admins</span>
                <span className="font-extrabold font-mono text-stone-900 dark:text-white text-xs">
                  {(roleBreakdown['admin'] || 0) + (roleBreakdown['registrar'] || 0)} officers
                </span>
              </button>
            </div>
          </div>

          {/* Quick Actions Footer */}
          <div className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800">
            <button
              type="button"
              onClick={() => {
                const unverifiedUids = users.filter((u) => !u.isVerified).map((u) => u.uid);
                if (unverifiedUids.length === 0) {
                  showToast('All accounts in the registry are already verified!', 'info');
                  return;
                }
                unverifiedUids.forEach((uid) => setUserVerified(uid, true));
                showToast(`Cleared and verified all ${unverifiedUids.length} pending members!`, 'success');
              }}
              className="w-full py-2.5 px-4 bg-[#8B181B] hover:bg-[#721316] text-white font-bold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify All Pending Accounts ({totalPending})</span>
            </button>
          </div>
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
              id="admin-directory-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search roster by student name, ID number, email, course, company, or batch..."
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
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              aria-label="Filter by Member Role"
              className="w-full md:w-auto px-3 py-2 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-200/90 dark:border-stone-700 rounded-xl text-stone-700 dark:text-stone-300 focus:outline-hidden focus:border-[#8B181B] cursor-pointer"
            >
              <option value="all">All Roles ({users.length})</option>
              <option value="alumni">Alumni ({roleBreakdown['alumni'] || 0})</option>
              <option value="superadmin">Super Admins ({roleBreakdown['superadmin'] || 0})</option>
              <option value="admin">Administrators ({roleBreakdown['admin'] || 0})</option>
              <option value="registrar">Registrar ({roleBreakdown['registrar'] || 0})</option>
              <option value="staff">Staff Officers ({roleBreakdown['staff'] || 0})</option>
              <option value="moderator">Moderators ({roleBreakdown['moderator'] || 0})</option>
              <option value="employer">Employers ({roleBreakdown['employer'] || 0})</option>
            </select>

            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
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
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
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

            {(searchQuery || batchFilter !== 'all' || courseFilter !== 'all' || roleFilter !== 'all' || statusFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setBatchFilter('all');
                  setCourseFilter('all');
                  setRoleFilter('all');
                  setStatusFilter('all');
                }}
                className="col-span-2 sm:col-span-4 md:col-span-1 px-3 py-2 text-xs font-semibold text-stone-600 hover:text-[#8B181B] bg-stone-100 dark:bg-stone-800 hover:bg-red-50 rounded-xl transition-colors cursor-pointer text-center"
                title="Reset all active filters"
              >
                Clear
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
              setRoleFilter('all');
              setBatchFilter('all');
              setCourseFilter('all');
              setStatusFilter('all');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
              !searchQuery && roleFilter === 'all' && batchFilter === 'all' && courseFilter === 'all' && statusFilter === 'all'
                ? 'bg-[#8B181B] text-white shadow-2xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200/80'
            }`}
          >
            All Members ({users.length})
          </button>

          <button
            type="button"
            onClick={() => setBatchFilter('2024')}
            className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
              batchFilter === '2024'
                ? 'bg-[#8B181B] text-white font-semibold'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200/80'
            }`}
          >
            Batch 2024
          </button>

          <button
            type="button"
            onClick={() => setBatchFilter('2023')}
            className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
              batchFilter === '2023'
                ? 'bg-[#8B181B] text-white font-semibold'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200/80'
            }`}
          >
            Batch 2023
          </button>

          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors cursor-pointer ${
              roleFilter === 'admin'
                ? 'bg-[#8B181B] text-white font-semibold'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200/80'
            }`}
          >
            Administrative Staff
          </button>
        </div>

        {/* Bulk Selection Bar */}
        {selectedUids.length > 0 && (
          <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 rounded-xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8B181B] animate-pulse" />
              <p className="text-xs font-bold text-red-950 dark:text-red-200">
                {selectedUids.length} member{selectedUids.length > 1 ? 's' : ''} selected
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleBulkVerify}
                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Verify Selected (1-Click)</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedUids([])}
                className="px-2.5 py-1.5 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          DIRECTORY CONTENT: BENTO CARDS VIEW OR STRUCTURED TABLE VIEW
          ======================================================== */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-stone-900 rounded-[28px] border border-stone-200/90 dark:border-stone-800 p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <Users className="w-10 h-10 text-stone-300 dark:text-stone-600 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-stone-900 dark:text-white">No Members Found</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto leading-relaxed">
            No alumni or staff members match your current filter parameters. Try clearing search keywords or switching directives.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setRoleFilter('all');
              setBatchFilter('all');
              setCourseFilter('all');
              setStatusFilter('all');
            }}
            className="mt-4 px-4 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      ) : viewMode === 'cards' ? (
        /* ========================================================
           HIGH-DENSITY BENTO CARDS VIEW
           ======================================================== */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredUsers.slice(0, visibleUserCount).map((u) => {
            const isSelected = selectedUids.includes(u.uid);

            return (
              <div
                key={u.uid}
                className={`relative overflow-hidden bg-white dark:bg-stone-900 rounded-[28px] border transition-all duration-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.07)] flex flex-col justify-between group ${
                  isSelected ? 'border-[#8B181B] bg-red-50/20 ring-1 ring-[#8B181B]' : 'border-stone-200/90 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
                }`}
              >
                {/* Institutional St. Cecilia Crimson Top Trim */}
                <div className="h-0.5 w-full bg-[#8B181B]/40 group-hover:bg-[#8B181B] transition-colors absolute top-0 left-0 right-0" />

                <div>
                  {/* Top Action & Selection */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={getUserAvatar(u.profilePictureUrl || u.avatar)}
                          alt={u.name}
                          onError={handleUserAvatarError}
                          onClick={() => setSelectedUserIdForModal(u.uid)}
                          className="w-12 h-12 rounded-2xl object-cover ring-1 ring-stone-200 dark:ring-stone-700 cursor-pointer hover:opacity-90 transition-opacity shadow-2xs"
                        />
                        {u.isVerified && (
                          <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 border-2 border-white dark:border-stone-900 shadow-2xs" title="Verified Graduate">
                            <ShieldCheck className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3
                          onClick={() => setSelectedUserIdForModal(u.uid)}
                          className="text-sm font-bold text-stone-900 dark:text-white hover:text-[#8B181B] cursor-pointer tracking-tight truncate transition-colors"
                        >
                          {u.name}
                        </h3>
                        <p className="text-[11px] text-stone-500 truncate mt-0.5">{u.email}</p>
                      </div>
                    </div>

                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(u.uid)}
                      aria-label={`Select ${u.name}`}
                      className="rounded border-stone-300 text-[#8B181B] focus:ring-[#8B181B] cursor-pointer mt-1"
                    />
                  </div>

                  {/* Credentials & Program Details */}
                  <div className="mt-3.5 space-y-1.5 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs">
                    <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Role</span>
                      {permissions.canAccessAdminPanel && u.uid !== currentUser?.uid ? (
                        <select
                          value={u.role}
                          onChange={(e) => {
                            const newRole = e.target.value as UserRole;
                            updateUserRole(u.uid, newRole);
                            showToast(`Updated ${u.name}'s role to ${newRole.toUpperCase()}`, 'success');
                          }}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-800 dark:text-stone-200 hover:border-stone-400 focus:outline-hidden cursor-pointer"
                        >
                          <option value="alumni">Alumni</option>
                          <option value="admin">Admin</option>
                          <option value="registrar">Registrar</option>
                          <option value="staff">Staff</option>
                          <option value="moderator">Moderator</option>
                          <option value="employer">Employer</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                          u.role === 'admin' || u.role === 'superadmin'
                            ? 'bg-red-50 text-[#8B181B] border-red-200/80 dark:bg-red-950/40 dark:text-red-300'
                            : u.role === 'registrar'
                            ? 'bg-amber-50 text-amber-900 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300'
                            : u.role === 'employer'
                            ? 'bg-blue-50 text-blue-800 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300'
                            : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700'
                        }`}>
                          {u.role}
                        </span>
                      )}
                    </div>

                    {u.studentId && (
                      <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Student ID</span>
                        <span className="font-mono text-xs text-stone-800 dark:text-stone-200 font-semibold">{u.studentId}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Discipline / Class</span>
                      <span className="font-semibold text-stone-800 dark:text-stone-200 text-right truncate max-w-[170px]">
                        {u.course ? `${u.course} • ` : ''}Batch {u.batch || '—'}
                      </span>
                    </div>

                    {(u.company || u.currentPosition) && (
                      <div className="flex items-center justify-between text-stone-600 dark:text-stone-400">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Affiliation</span>
                        <span className="font-medium text-stone-700 dark:text-stone-300 truncate max-w-[170px]">
                          {u.currentPosition ? `${u.currentPosition} ` : ''}{u.company ? `@ ${u.company}` : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-4 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between gap-2">
                  {/* Verified Status Display vs Verify Clearance Button */}
                  {u.isVerified ? (
                    <div
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5 select-none"
                      title="Verified institutional member record"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Verified</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setUserVerified(u.uid, true);
                        showToast(`${u.name} has been verified!`, 'success');
                      }}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 hover:bg-emerald-50 hover:text-emerald-800 border border-amber-200 hover:border-emerald-200"
                      title="Verify academic or institutional clearance"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Verify Clearance</span>
                    </button>
                  )}

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedUserIdForModal(u.uid)}
                      className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                    >
                      Dossier
                    </button>

                    {permissions.canAccessAdminPanel && u.uid !== currentUser?.uid && (
                      <button
                        type="button"
                        onClick={() => setUserToDelete({ uid: u.uid, name: u.name })}
                        className="p-1.5 text-stone-400 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors cursor-pointer"
                        title="Delete member record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ========================================================
           COMMAND ROSTER STRUCTURED TABLE VIEW
           ======================================================== */
        <div className="bg-white dark:bg-stone-900 rounded-[28px] border border-stone-200/90 dark:border-stone-800 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-stone-200/80 dark:border-stone-800 bg-stone-50/80 dark:bg-stone-800/60 text-[11px] font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
                  <th className="py-3 px-4 text-center w-10">
                    <input
                      type="checkbox"
                      checked={filteredUsers.length > 0 && selectedUids.length === filteredUsers.length}
                      onChange={handleSelectAll}
                      aria-label="Select all members"
                      className="rounded border-stone-300 text-[#8B181B] focus:ring-[#8B181B] cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-4 sm:px-6">Member Profile</th>
                  <th className="py-3 px-4">Academic Program</th>
                  <th className="py-3 px-3">Batch</th>
                  <th className="py-3 px-4">Clearance Status</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                {filteredUsers.slice(0, visibleUserCount).map((u) => {
                  const isSelected = selectedUids.includes(u.uid);

                  return (
                    <tr
                      key={u.uid}
                      className={`hover:bg-stone-50/70 dark:hover:bg-stone-800/50 transition-colors group ${
                        isSelected ? 'bg-red-50/20 dark:bg-red-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(u.uid)}
                          aria-label={`Select ${u.name}`}
                          className="rounded border-stone-300 text-[#8B181B] focus:ring-[#8B181B] cursor-pointer"
                        />
                      </td>

                      {/* Member Column */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={getUserAvatar(u.profilePictureUrl || u.avatar)}
                              alt={u.name}
                              onError={handleUserAvatarError}
                              onClick={() => setSelectedUserIdForModal(u.uid)}
                              className="w-10 h-10 rounded-xl object-cover ring-1 ring-stone-200 dark:ring-stone-700 cursor-pointer shadow-2xs"
                            />
                            {u.isVerified && (
                              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 border border-white dark:border-stone-900" title="Verified Graduate">
                                <ShieldCheck className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span
                                onClick={() => setSelectedUserIdForModal(u.uid)}
                                className="font-bold text-stone-900 dark:text-white hover:text-[#8B181B] cursor-pointer truncate text-sm"
                              >
                                {u.name}
                              </span>
                            </div>
                            <div className="text-[11px] text-stone-500 truncate max-w-xs">{u.email}</div>
                            {u.studentId && (
                              <div className="text-[10px] font-mono text-stone-400">ID: {u.studentId}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Academic Program Column */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-stone-800 dark:text-stone-200 truncate max-w-xs">
                          {u.course || 'Degree Program'}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          {u.department || 'Undergraduate Division'}
                        </div>
                      </td>

                      {/* Batch Column */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md text-[11px]">
                          {u.batch ? `'${u.batch.slice(-2)}` : '—'}
                        </span>
                      </td>

                      {/* Clearance Status Column */}
                      <td className="py-3.5 px-4">
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Verified</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setUserVerified(u.uid, true);
                              showToast(`${u.name} has been verified!`, 'success');
                            }}
                            className="px-2.5 py-1 rounded-full text-[11px] font-bold border border-amber-200 bg-amber-50 text-amber-800 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200 transition-colors cursor-pointer flex items-center gap-1"
                            title="Verify member clearance"
                          >
                            <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Pending • Verify</span>
                          </button>
                        )}
                      </td>

                      {/* Role Column */}
                      <td className="py-3.5 px-4">
                        {permissions.canAccessAdminPanel && u.uid !== currentUser?.uid ? (
                          <select
                            value={u.role}
                            onChange={(e) => {
                              const newRole = e.target.value as UserRole;
                              updateUserRole(u.uid, newRole);
                              showToast(`Updated ${u.name}'s role to ${newRole.toUpperCase()}`, 'success');
                            }}
                            className="px-2 py-1 rounded-lg text-[11px] font-bold uppercase bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-stone-400 focus:outline-hidden cursor-pointer"
                          >
                            <option value="alumni">Alumni</option>
                            <option value="admin">Admin</option>
                            <option value="registrar">Registrar</option>
                            <option value="staff">Staff</option>
                            <option value="moderator">Moderator</option>
                            <option value="employer">Employer</option>
                          </select>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700">
                            {u.role}
                          </span>
                        )}
                      </td>

                      {/* Action Buttons Column */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedUserIdForModal(u.uid)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-lg transition-colors cursor-pointer"
                          >
                            Dossier
                          </button>

                          {permissions.canAccessAdminPanel && u.uid !== currentUser?.uid && (
                            <button
                              type="button"
                              onClick={() => setUserToDelete({ uid: u.uid, name: u.name })}
                              title="Delete member record"
                              className="p-1.5 text-stone-400 hover:text-red-700 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* ========================================================
          PROGRESSIVE "SEE MORE" PAGINATION CONTROLS
          ======================================================== */}
      {filteredUsers.length > visibleUserCount && (
        <div className="mt-8 pt-6 border-t border-stone-200/80 dark:border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-stone-900 p-5 rounded-[28px] border border-stone-200/90 shadow-2xs">
          <div className="text-xs text-stone-600 dark:text-stone-400 text-center sm:text-left">
            Showing <strong className="text-stone-900 dark:text-white font-bold">{Math.min(visibleUserCount, filteredUsers.length)}</strong> of{' '}
            <strong className="text-stone-900 dark:text-white font-bold">{filteredUsers.length}</strong> Cecilians
            <div className="w-48 sm:w-64 bg-stone-200 dark:bg-stone-700 rounded-full h-1.5 mt-1.5 overflow-hidden mx-auto sm:mx-0">
              <div
                className="bg-[#8B181B] h-full rounded-full transition-all duration-300"
                style={{
                  width: `${(Math.min(visibleUserCount, filteredUsers.length) / filteredUsers.length) * 100}%`
                }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap justify-center">
            <button
              type="button"
              onClick={() => setVisibleUserCount((prev) => prev + 12)}
              className="px-5 py-2.5 bg-[#8B181B] hover:bg-[#721316] text-white font-bold text-xs rounded-xl shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              Load Next 12 (+{Math.min(12, filteredUsers.length - visibleUserCount)})
            </button>
            <button
              type="button"
              onClick={() => setVisibleUserCount(filteredUsers.length)}
              className="px-4 py-2.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 font-semibold text-xs rounded-xl transition-all cursor-pointer"
            >
              Display Complete Directory
            </button>
          </div>
        </div>
      )}

      {visibleUserCount > 12 && filteredUsers.length > 12 && (
        <div className="text-center pt-1">
          <button
            type="button"
            onClick={() => setVisibleUserCount(12)}
            className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 font-semibold underline cursor-pointer"
          >
            Show Less (Reset to 12)
          </button>
        </div>
      )}

      {/* ========================================================
          DELETE CONFIRMATION MODAL
          ======================================================== */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl border border-stone-200 dark:border-stone-800 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center gap-3 text-[#8B181B]">
              <div className="p-2 bg-red-50 dark:bg-red-950/40 rounded-xl">
                <Trash2 className="w-5 h-5 text-[#8B181B]" />
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-white font-sans">Delete Member Record</h3>
            </div>
            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              Are you sure you want to permanently remove <span className="font-bold text-stone-900 dark:text-white">{userToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-3.5 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-lg text-xs font-bold cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
