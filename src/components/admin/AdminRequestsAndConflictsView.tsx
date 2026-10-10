/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Scale,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  Sparkles,
  ArrowRight,
  Clock,
  User,
  Mail,
  GraduationCap,
  Calendar,
  FileText,
  FileDown,
  CheckSquare,
  Square,
  Copy,
  Check,
  ChevronRight,
  AlertCircle,
  Building2,
  Briefcase,
  Database,
  Lock,
  FileCheck2,
  ExternalLink,
  Eye,
  X,
  Download,
  Activity,
  Layers,
  Globe,
  Radio,
  Plus
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import {
  getRegistrationConflicts,
  resolveConflictRecord,
  getRegistrarRecords,
  normalizeStudentId,
  markRegistryRecordAsRegistered
} from '../../services/studentVerificationService';
import {
  analyzeUserRegistryIntegrity,
  calculateGovernanceIntegrityMetrics,
  RegistryDiscrepancyAnalysis
} from '../../services/governanceLogicService';
import { generateConflictResolutionPdfReport } from '../../services/conflictReportPdfService';
import { RegistrationConflictRecord, UserProfile } from '../../types';

interface AdminRequestsAndConflictsViewProps {
  initialSubTab?: 'alumni' | 'conflicts' | 'employers' | 'jobs' | 'requests' | 'identity' | 'history';
}

export const AdminRequestsAndConflictsView: React.FC<AdminRequestsAndConflictsViewProps> = ({
  initialSubTab = 'alumni'
}) => {
  const {
    users,
    opportunities,
    currentUser,
    showToast,
    addAuditLog,
    setUserVerified,
    updateAlumniProfile,
    setSelectedUserIdForModal,
    verifyEmployer,
    approveOpportunity,
    rejectOpportunity
  } = useAlumni();

  // Tab mapping
  const resolveInitialTab = (): 'alumni' | 'conflicts' | 'employers' | 'jobs' | 'history' => {
    if (initialSubTab === 'conflicts') return 'conflicts';
    if (initialSubTab === 'employers') return 'employers';
    if (initialSubTab === 'jobs') return 'jobs';
    if (initialSubTab === 'history') return 'history';
    return 'alumni';
  };

  const [activeTab, setActiveTab] = useState<'alumni' | 'conflicts' | 'employers' | 'jobs' | 'history'>(resolveInitialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'perfect' | 'discrepancy' | 'high_priority'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved_verified' | 'resolved_rejected'>('pending');
  const [selectedSpectrumIndex, setSelectedSpectrumIndex] = useState<number | null>(null);

  // Conflict state & selection
  const [conflicts, setConflicts] = useState<RegistrationConflictRecord[]>([]);
  const [selectedConflictIds, setSelectedConflictIds] = useState<string[]>([]);
  const [bulkNote, setBulkNote] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [resolvingConflictId, setResolvingConflictId] = useState<string | null>(null);
  const [singleNote, setSingleNote] = useState('');

  // Auto-reconciliation loading state
  const [isReconciling, setIsReconciling] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Sync conflicts from storage
  const loadConflicts = useCallback(() => {
    try {
      const data = getRegistrationConflicts();
      setConflicts(data);
    } catch {
      setConflicts([]);
    }
  }, []);

  useEffect(() => {
    loadConflicts();
  }, [loadConflicts]);

  // Sync if initialSubTab prop changes
  useEffect(() => {
    setActiveTab(resolveInitialTab());
  }, [initialSubTab]);

  // Derived datasets
  const registrarRecords = useMemo(() => getRegistrarRecords(), []);

  // Pending items
  const pendingAlumniUsers = useMemo(() => {
    return users.filter((u) => !u.isVerified && u.role === 'alumni');
  }, [users]);

  const pendingEmployers = useMemo(() => {
    return users.filter(
      (u) => u.role === 'employer' && u.employerVerificationStatus === 'pending_verification'
    );
  }, [users]);

  const pendingJobs = useMemo(() => {
    return (opportunities || []).filter((o) => o.approvalStatus === 'pending_approval');
  }, [opportunities]);

  // Deep integrity analysis across pending alumni
  const pendingAnalyses: RegistryDiscrepancyAnalysis[] = useMemo(() => {
    return pendingAlumniUsers.map((u) => analyzeUserRegistryIntegrity(u, users, registrarRecords));
  }, [pendingAlumniUsers, users, registrarRecords]);

  const perfectMatchAnalyses = useMemo(() => {
    return pendingAnalyses.filter((a) => a.status === 'PERFECT_MATCH');
  }, [pendingAnalyses]);

  const discrepancyAnalyses = useMemo(() => {
    return pendingAnalyses.filter((a) => a.status !== 'PERFECT_MATCH');
  }, [pendingAnalyses]);

  const pendingConflicts = useMemo(() => {
    return conflicts.filter((c) => c.status === 'pending');
  }, [conflicts]);

  const resolvedConflicts = useMemo(() => {
    return conflicts.filter((c) => c.status !== 'pending');
  }, [conflicts]);

  const integrityMetrics = useMemo(() => {
    return calculateGovernanceIntegrityMetrics(users, conflicts);
  }, [users, conflicts]);

  const totalWorkloadCount =
    pendingAlumniUsers.length + pendingConflicts.length + pendingEmployers.length + pendingJobs.length;

  // Command Center Signature: Interactive 7-Segment Spectrum Data
  const dynamicHeroData = useMemo(() => {
    const categories = [
      { id: 'collisions', label: 'ID Clash', count: pendingConflicts.length, sub: 'ID Collisions', isUrgent: pendingConflicts.length > 0 },
      { id: 'perfect', label: '100% Match', count: perfectMatchAnalyses.length, sub: 'Exact Archive Match', isUrgent: false },
      { id: 'degree', label: 'Curriculum', count: pendingAnalyses.filter((a) => a.status === 'DEGREE_DISCREPANCY').length, sub: 'Degree Variance', isUrgent: false },
      { id: 'name', label: 'Name Diff', count: pendingAnalyses.filter((a) => a.status === 'NAME_DISCREPANCY').length, sub: 'Spelling Variance', isUrgent: false },
      { id: 'unreg', label: 'Unlisted', count: pendingAnalyses.filter((a) => a.status === 'UNREGISTERED_ID').length, sub: 'Unregistered ID', isUrgent: false },
      { id: 'employers', label: 'Partners', count: pendingEmployers.length, sub: 'Employer Vetting', isUrgent: pendingEmployers.length > 0 },
      { id: 'jobs', label: 'Job Review', count: pendingJobs.length, sub: 'Career Quality Check', isUrgent: pendingJobs.length > 0 }
    ];

    const bars = categories.map((cat) => {
      const segments: ('crimson' | 'muted')[] = [];
      const segCount = Math.min(5, Math.max(1, cat.count || 1));
      for (let i = 0; i < segCount; i++) {
        segments.push(cat.count > 0 ? 'crimson' : 'muted');
      }

      return {
        id: cat.id,
        label: cat.label,
        count: cat.count,
        sub: cat.sub,
        segments,
        activeDot: cat.isUrgent
      };
    });

    return {
      badge: 'Zero-Trust Tribunal',
      subtitle: 'Dispute Hearing Docket',
      title: 'Governance & Claims Triage',
      description: `${totalWorkloadCount} total claims in compliance queue • ${integrityMetrics.purityScore}% Masterlist Purity Index`,
      chip1Title: 'Masterlist Integrity',
      chip1Sub: `${integrityMetrics.purityScore}% archival alignment with Registrar`,
      chip1Count: `${integrityMetrics.verifiedAlumniCount} verified`,
      chip2Title: '1-Click Auto Reconcile',
      chip2Sub: `${perfectMatchAnalyses.length} alumni match 100% with official diploma archives`,
      bars
    };
  }, [
    pendingConflicts.length,
    perfectMatchAnalyses.length,
    pendingAnalyses,
    pendingEmployers.length,
    pendingJobs.length,
    totalWorkloadCount,
    integrityMetrics
  ]);

  // Filtered Alumni Applicants
  const filteredAlumniAnalyses = useMemo(() => {
    return pendingAnalyses.filter((analysis) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        analysis.user.name.toLowerCase().includes(q) ||
        analysis.user.email.toLowerCase().includes(q) ||
        (analysis.user.studentId && analysis.user.studentId.toLowerCase().includes(q)) ||
        (analysis.user.course && analysis.user.course.toLowerCase().includes(q));

      let matchesFilter = true;
      if (filterType === 'perfect') {
        matchesFilter = analysis.status === 'PERFECT_MATCH';
      } else if (filterType === 'discrepancy') {
        matchesFilter = analysis.status !== 'PERFECT_MATCH';
      } else if (filterType === 'high_priority') {
        matchesFilter = analysis.status === 'COLLISION_RISK' || analysis.status === 'UNREGISTERED_ID';
      }

      if (selectedSpectrumIndex !== null) {
        const cat = dynamicHeroData.bars[selectedSpectrumIndex];
        if (cat) {
          if (cat.id === 'perfect') matchesFilter = analysis.status === 'PERFECT_MATCH';
          if (cat.id === 'degree') matchesFilter = analysis.status === 'DEGREE_DISCREPANCY';
          if (cat.id === 'name') matchesFilter = analysis.status === 'NAME_DISCREPANCY';
          if (cat.id === 'unreg') matchesFilter = analysis.status === 'UNREGISTERED_ID';
        }
      }

      return matchesSearch && matchesFilter;
    });
  }, [pendingAnalyses, searchQuery, filterType, selectedSpectrumIndex, dynamicHeroData]);

  // Filtered Conflicts
  const filteredConflicts = useMemo(() => {
    return conflicts.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.applicantName.toLowerCase().includes(q) ||
        c.applicantEmail.toLowerCase().includes(q) ||
        (c.applicantStudentId && c.applicantStudentId.toLowerCase().includes(q)) ||
        (c.registryRecord?.fullName && c.registryRecord.fullName.toLowerCase().includes(q));

      const matchesStatus =
        activeTab === 'history'
          ? c.status !== 'pending'
          : statusFilter === 'all'
          ? true
          : c.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [conflicts, searchQuery, statusFilter, activeTab]);

  // Filtered Employers
  const filteredEmployers = useMemo(() => {
    return pendingEmployers.filter((e) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        e.name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.companyName && e.companyName.toLowerCase().includes(q))
      );
    });
  }, [pendingEmployers, searchQuery]);

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    return pendingJobs.filter((j) => {
      const q = searchQuery.toLowerCase().trim();
      return (
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q)
      );
    });
  }, [pendingJobs, searchQuery]);

  // Clipboard copy helper
  const copyToClipboard = (text: string, label: string = 'Text') => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showToast(`Copied ${label} to clipboard`, 'info');
    setTimeout(() => setCopiedText(null), 1800);
  };

  // 1-Click Smart Auto-Reconcile for all 100% matched alumni
  const handleSmartAutoReconcile = async () => {
    if (perfectMatchAnalyses.length === 0) {
      showToast('No 100% Registrar-matched records found for auto-reconciliation.', 'info');
      return;
    }

    setIsReconciling(true);
    const count = perfectMatchAnalyses.length;

    try {
      for (const item of perfectMatchAnalyses) {
        setUserVerified(item.userId, true);
        if (item.registryRecord) {
          markRegistryRecordAsRegistered(item.registryRecord.studentId, item.userId);
        }
      }

      addAuditLog({
        action: 'SMART_GOVERNANCE_AUTO_RECONCILE',
        actorId: currentUser?.uid || 'registrar_officer',
        actorName: currentUser?.name || 'Registrar Officer',
        actorRole: currentUser?.role || 'admin',
        category: 'alumni_verification',
        details: `Smart Governance Auto-Reconciliation executed: Verified ${count} alumni claimants with 100% Registrar archive alignment.`,
        severity: 'success'
      });

      showToast(`✓ Auto-reconciled ${count} verified Cecilian graduates!`, 'success');
    } finally {
      setIsReconciling(false);
    }
  };

  // 1-Click Sync to Registrar Transcript & Approve single user
  const handleSyncToTranscriptAndVerify = (analysis: RegistryDiscrepancyAnalysis) => {
    const reg = analysis.registryRecord;
    if (!reg) {
      setUserVerified(analysis.userId, true);
      showToast(`Verified applicant ${analysis.user.name}.`, 'success');
      return;
    }

    updateAlumniProfile(analysis.userId, {
      course: reg.course,
      batch: reg.batchYear || analysis.user.batch
    });

    setUserVerified(analysis.userId, true);
    markRegistryRecordAsRegistered(reg.studentId, analysis.userId);

    addAuditLog({
      action: 'REGISTRAR_TRANSCRIPT_SYNC_VERIFY',
      actorId: currentUser?.uid || 'registrar_officer',
      actorName: currentUser?.name || 'Registrar Officer',
      actorRole: currentUser?.role || 'admin',
      category: 'alumni_verification',
      details: `Corrected profile for ${analysis.user.name} to official Registrar record (${reg.course}, Class of ${reg.batchYear}) and granted verified alumni status.`,
      severity: 'info'
    });

    showToast(`✓ Synced ${analysis.user.name}'s profile to official transcript and approved!`, 'success');
  };

  // Direct single alumni approve as is
  const handleApproveAlumniAsDeclared = (userId: string, userName: string, studentId?: string) => {
    setUserVerified(userId, true);
    if (studentId) {
      markRegistryRecordAsRegistered(studentId, userId);
    }

    addAuditLog({
      action: 'MANUAL_ALUMNI_VERIFY',
      actorId: currentUser?.uid || 'registrar',
      actorName: currentUser?.name || 'Registrar Officer',
      actorRole: currentUser?.role || 'admin',
      category: 'alumni_verification',
      details: `Manually approved and granted verified alumni status to ${userName} (Student ID: ${studentId || 'N/A'}).`,
      severity: 'success'
    });

    showToast(`✓ Approved ${userName} as verified alumnus.`, 'success');
  };

  // Handle single conflict resolution
  const handleResolveConflict = (
    conflict: RegistrationConflictRecord,
    action: 'resolved_verified' | 'resolved_rejected' | 'dismissed'
  ) => {
    const actorName = currentUser?.name || 'Registrar Officer';
    const note = singleNote.trim() || undefined;

    const success = resolveConflictRecord(conflict.id, action, actorName, note);

    if (success) {
      if (conflict.applicantUid) {
        setUserVerified(conflict.applicantUid, action === 'resolved_verified');
      } else {
        const matched = users.find(
          (u) =>
            u.email.toLowerCase() === conflict.applicantEmail.toLowerCase() ||
            (conflict.applicantStudentId && u.studentId === conflict.applicantStudentId)
        );
        if (matched) {
          setUserVerified(matched.uid, action === 'resolved_verified');
        }
      }

      addAuditLog({
        action: `CONFLICT_RESOLUTION_${action.toUpperCase()}`,
        actorId: currentUser?.uid || 'registrar',
        actorName,
        actorRole: currentUser?.role || 'registrar',
        category: 'conflict_resolution',
        details: `${action === 'resolved_verified' ? 'Approved and auto-verified' : 'Rejected/Dismissed'} registration dispute for ${conflict.applicantName} (Student ID: ${conflict.applicantStudentId || 'N/A'}). Note: ${note || 'Routine hearing deliberation'}.`,
        severity: action === 'resolved_verified' ? 'success' : 'warning'
      });

      showToast(
        action === 'resolved_verified'
          ? `✓ Applicant ${conflict.applicantName} approved and verified.`
          : action === 'resolved_rejected'
          ? `Duplicate registration for ${conflict.applicantName} rejected to maintain masterlist integrity.`
          : `Dispute flag dismissed.`,
        action === 'resolved_verified' ? 'success' : 'info'
      );

      loadConflicts();
      setResolvingConflictId(null);
      setSingleNote('');
    }
  };

  // Multi-select for conflicts
  const isAllPendingSelected =
    pendingConflicts.length > 0 &&
    pendingConflicts.every((c) => selectedConflictIds.includes(c.id));

  const handleToggleSelectConflict = (id: string) => {
    setSelectedConflictIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllPending = () => {
    if (isAllPendingSelected) {
      setSelectedConflictIds([]);
    } else {
      setSelectedConflictIds(pendingConflicts.map((c) => c.id));
    }
  };

  // Bulk resolve conflicts
  const handleBulkResolveConflicts = (action: 'resolved_verified' | 'resolved_rejected') => {
    if (selectedConflictIds.length === 0) return;
    setIsProcessingBulk(true);

    const actorName = currentUser?.name || 'Registrar Officer';
    let processed = 0;

    selectedConflictIds.forEach((id) => {
      const conflict = conflicts.find((c) => c.id === id);
      if (!conflict) return;

      const note = bulkNote.trim() || `Bulk resolution (${action}) by ${actorName}`;
      const success = resolveConflictRecord(id, action, actorName, note);

      if (success) {
        processed++;
        if (conflict.applicantUid) {
          setUserVerified(conflict.applicantUid, action === 'resolved_verified');
        }
      }
    });

    addAuditLog({
      action: `BULK_CONFLICT_RESOLUTION_${action.toUpperCase()}`,
      actorId: currentUser?.uid || 'registrar',
      actorName,
      actorRole: currentUser?.role || 'registrar',
      category: 'conflict_resolution',
      details: `Bulk ${action === 'resolved_verified' ? 'approved & verified' : 'rejected & blocked'} ${processed} student registration conflict records.`,
      severity: action === 'resolved_verified' ? 'success' : 'warning'
    });

    showToast(
      `✓ Processed ${processed} collision records: ${
        action === 'resolved_verified' ? 'Bulk Approved' : 'Bulk Rejected'
      }!`,
      'success'
    );

    setSelectedConflictIds([]);
    setBulkNote('');
    setIsProcessingBulk(false);
    loadConflicts();
  };

  // Official PDF audit download
  const handleGeneratePdfReport = () => {
    try {
      generateConflictResolutionPdfReport(conflicts, {
        officerName: currentUser?.name || 'Registrar Officer',
        officerRole: currentUser?.role === 'admin' ? 'System Administrator' : 'Office of the Registrar',
        institutionName: "St. Cecilia's College - Cebu, Inc."
      });

      addAuditLog({
        action: 'CONFLICT_REPORT_PDF_GENERATED',
        actorId: currentUser?.uid || 'registrar',
        actorName: currentUser?.name || 'Registrar Officer',
        actorRole: currentUser?.role || 'registrar',
        category: 'conflict_resolution',
        details: `Generated session Conflict Resolution & Manual Overrides PDF audit report for ${conflicts.length} incidents.`,
        severity: 'info'
      });

      showToast('Downloaded official PDF audit report of session resolutions', 'success');
    } catch (err: any) {
      showToast(`Failed to generate PDF: ${err?.message || 'Unknown error'}`, 'error');
    }
  };

  // Export full CSV of requests & conflicts
  const handleExportCsv = () => {
    try {
      const headers = [
        'Record Type',
        'Applicant Name',
        'Email Address',
        'Claimed Student ID',
        'Course / Degree',
        'Cohort Year',
        'Status / Integrity',
        'Conflict Severity',
        'Flagged / Submitted Date'
      ];

      const rows: string[][] = [];

      pendingAnalyses.forEach((a) => {
        rows.push([
          'Alumni Verification Request',
          `"${a.user.name}"`,
          a.user.email,
          a.user.studentId || 'N/A',
          `"${a.user.course || 'Not specified'}"`,
          a.user.batch || 'N/A',
          a.status,
          a.status === 'PERFECT_MATCH' ? 'NONE' : 'MEDIUM',
          a.user.createdAt || new Date().toISOString()
        ]);
      });

      conflicts.forEach((c) => {
        rows.push([
          'ID Collision Dispute',
          `"${c.applicantName}"`,
          c.applicantEmail,
          c.applicantStudentId || 'N/A',
          `"${c.applicantCourse || 'Not specified'}"`,
          c.applicantBatch || 'N/A',
          c.status,
          c.severity || 'HIGH',
          c.flaggedAt
        ]);
      });

      const csvContent = [
        headers.join(','),
        ...rows.map((row) => row.join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const dateStr = new Date().toISOString().split('T')[0];
      link.setAttribute('download', `st_cecilias_requests_conflicts_triage_${dateStr}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showToast('Exported Requests & Conflicts triage ledger to CSV', 'success');
    } catch {
      showToast('Failed to export CSV report', 'error');
    }
  };

  // Spotlight discrepancy
  const spotlitDiscrepancy = useMemo(() => {
    return (
      pendingAnalyses.find((a) => a.status === 'DEGREE_DISCREPANCY' && a.registryRecord) ||
      pendingAnalyses.find((a) => a.status !== 'PERFECT_MATCH' && a.registryRecord) ||
      null
    );
  }, [pendingAnalyses]);

  // Strict RBAC Gate
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-3xl border border-stone-200/90 p-10 text-center max-w-xl mx-auto shadow-2xs space-y-4 my-8">
        <div className="w-14 h-14 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center mx-auto border border-stone-200">
          <ShieldAlert className="w-7 h-7 text-[#8B181B]" />
        </div>
        <h3 className="text-lg font-bold text-stone-900 font-serif">Administrative Clearance Required</h3>
        <p className="text-xs text-stone-600 leading-relaxed">
          The Requests & Conflict Resolution Tribunal is restricted to authorized St. Cecilia's College System Administrators and University Registrar Officers.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 antialiased">
      {/* ========================================================
          1. TOP COMMAND CENTER-STYLE HEADER:
             Large title + Circular Metric Telemetry Pills + Round Pill Switcher + Export Circle
          ======================================================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-2">
        <div className="flex flex-wrap items-center gap-6 sm:gap-10">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight font-sans">
              Requests & Conflicts
            </h1>
            <p className="text-xs text-stone-500 font-medium mt-0.5">
              St. Cecilia's College • Governance, Identity & Dispute Tribunal
            </p>
          </div>

          {/* Metric Pill 1: ID Collisions (Matching Command Center Pill Style) */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${
              pendingConflicts.length > 0
                ? 'border-amber-400 bg-amber-50 text-amber-800 animate-pulse'
                : 'border-stone-300 text-stone-700'
            }`}>
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block leading-tight font-medium">
                ID Collisions
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-extrabold tracking-tight ${
                  pendingConflicts.length > 0 ? 'text-[#8B181B]' : 'text-stone-900'
                }`}>
                  {pendingConflicts.length}
                </span>
                <span className="text-[10px] text-stone-400 font-medium">
                  {pendingConflicts.length > 0 ? 'hearing required' : 'docket clear'}
                </span>
              </div>
            </div>
          </div>

          {/* Metric Pill 2: Unverified Alumni Backlog */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full border border-stone-300 flex items-center justify-center text-stone-700 shrink-0">
              <GraduationCap className="w-4 h-4 text-[#8B181B]" />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block leading-tight font-medium">
                Alumni Claims
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-stone-900 tracking-tight">
                  {pendingAlumniUsers.length}
                </span>
                <span className="text-[10px] text-emerald-700 font-bold">
                  {perfectMatchAnalyses.length} ready
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Command Center-Style Segmented Pill Switcher & Action Circles */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="inline-flex items-center p-1 bg-stone-100/90 rounded-full border border-stone-200 shadow-2xs relative">
            <button
              type="button"
              onClick={() => {
                setActiveTab('alumni');
                setSelectedSpectrumIndex(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'alumni'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <span>Alumni</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'alumni' ? 'bg-white/20 text-white' : 'bg-stone-200/80 text-stone-600'
              }`}>
                {pendingAlumniUsers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('conflicts');
                setSelectedSpectrumIndex(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'conflicts'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <span>Collisions</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'conflicts'
                  ? 'bg-white/20 text-white'
                  : pendingConflicts.length > 0
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-stone-200/80 text-stone-600'
              }`}>
                {pendingConflicts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('employers');
                setSelectedSpectrumIndex(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'employers'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <span>Employers</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'employers' ? 'bg-white/20 text-white' : 'bg-stone-200/80 text-stone-600'
              }`}>
                {pendingEmployers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('jobs');
                setSelectedSpectrumIndex(null);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'jobs'
                  ? 'bg-[#8B181B] text-white shadow-xs font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <span>Jobs</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'jobs' ? 'bg-white/20 text-white' : 'bg-stone-200/80 text-stone-600'
              }`}>
                {pendingJobs.length}
              </span>
            </button>
          </div>

          {/* Quick Action Button: Audit PDF Download */}
          <button
            type="button"
            onClick={handleGeneratePdfReport}
            title="Download Forensic Audit PDF Docket"
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center justify-center text-stone-700 transition-all cursor-pointer shrink-0"
          >
            <FileDown className="w-4 h-4 text-[#8B181B]" />
          </button>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={handleExportCsv}
            title="Export Triage Ledger to CSV"
            className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 border border-stone-200 flex items-center justify-center text-stone-700 transition-all cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ========================================================
          2. MAIN 2-COLUMN VIEWPORT (Center 8.5 Cols + Right 3.5 Cols)
          ======================================================== */}
      <div className="grid grid-cols-12 gap-6 items-start">
        
        {/* ======================================================
            CENTER WORKSPACE COLUMN (8.5 cols on desktop XL)
            ====================================================== */}
        <div className="col-span-12 xl:col-span-8 space-y-6">

          {/* ----------------------------------------------------
              COMMAND CENTER SIGNATURE: WIDE HERO BENTO CARD
              With St. Cecilia Crimson Top Trim & Interactive 7-Segment Spectrum
              ---------------------------------------------------- */}
          <div className="bg-white rounded-[32px] p-6 sm:p-7 relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02),0_8px_24px_rgba(0,0,0,0.03)] border border-stone-200/90 transition-all duration-300">
            {/* Institutional St. Cecilia Crimson Architectural Top Trim */}
            <div className="h-1 absolute top-0 left-0 right-0 bg-[#8B181B]" />

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-1">
              
              {/* Left Sub-Card Details */}
              <div className="space-y-4 max-w-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B181B] bg-red-50 px-2.5 py-0.5 rounded-full border border-red-200/60 shadow-2xs">
                    {dynamicHeroData.badge}
                  </span>
                  <span className="text-xs font-semibold text-stone-500">
                    {dynamicHeroData.subtitle}
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-extrabold text-stone-900 tracking-tight leading-tight">
                    {dynamicHeroData.title}
                  </h3>
                  <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                    {dynamicHeroData.description}
                  </p>
                </div>

                <div className="space-y-2 pt-1">
                  {/* Status Chip 1: Masterlist Purity */}
                  <div className="bg-stone-50/80 rounded-2xl p-3 flex items-center justify-between border border-stone-200/80 shadow-2xs">
                    <div>
                      <span className="text-[11px] font-bold text-stone-800 block">
                        {dynamicHeroData.chip1Title}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {dynamicHeroData.chip1Sub}
                      </span>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-800 font-mono bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {dynamicHeroData.chip1Count}
                    </span>
                  </div>

                  {/* Status Chip 2: Auto Reconcile Action Button */}
                  <div className="bg-stone-50/80 rounded-2xl p-3 flex items-center justify-between border border-stone-200/80 shadow-2xs">
                    <div>
                      <span className="text-[11px] font-bold text-stone-800 block">
                        {dynamicHeroData.chip2Title}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {dynamicHeroData.chip2Sub}
                      </span>
                    </div>

                    {perfectMatchAnalyses.length > 0 ? (
                      <button
                        type="button"
                        onClick={handleSmartAutoReconcile}
                        disabled={isReconciling}
                        className="px-3 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-[10px] font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5 active:scale-95 disabled:opacity-50"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>Verify All ({perfectMatchAnalyses.length})</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-stone-400 px-2 py-1 bg-stone-100 rounded-lg">
                        Aligned
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Interactive Dynamic 7-Channel Dispute Spectrum */}
              <div className="flex-1 flex flex-col items-center md:items-end justify-center gap-3 pt-4 md:pt-0">
                {/* Selected Spectrum Inspector Banner */}
                {selectedSpectrumIndex !== null && dynamicHeroData.bars[selectedSpectrumIndex] && (
                  <div className="w-full max-w-md bg-stone-50 rounded-xl p-2.5 border border-stone-200/90 shadow-xs flex items-center justify-between gap-3 text-xs animate-in fade-in zoom-in-95 duration-150">
                    <div className="min-w-0">
                      <span className="font-bold text-stone-900 block truncate">
                        {dynamicHeroData.bars[selectedSpectrumIndex].sub}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {dynamicHeroData.bars[selectedSpectrumIndex].count} records in this channel
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedSpectrumIndex(null)}
                      className="text-[10px] font-bold text-[#8B181B] hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}

                {/* 7 Interactive Segmented Columns */}
                <div className="flex items-end justify-center md:justify-end gap-2.5 sm:gap-3.5 pt-2">
                  {dynamicHeroData.bars.map((bar, idx) => {
                    const isSelected = selectedSpectrumIndex === idx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setSelectedSpectrumIndex(isSelected ? null : idx)
                        }
                        className="flex flex-col items-center gap-1.5 cursor-pointer group transition-transform hover:scale-105"
                      >
                        {/* Segmented Tube */}
                        <div
                          className={`w-7 sm:w-8 h-28 rounded-full p-1 flex flex-col justify-end gap-1 relative overflow-hidden border transition-all ${
                            isSelected
                              ? 'border-[#8B181B] ring-2 ring-[#8B181B]/20 bg-red-50/40'
                              : 'border-stone-200 bg-stone-100'
                          }`}
                        >
                          {bar.activeDot && (
                            <span className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
                          )}

                          {bar.segments.map((seg, sIdx) => (
                            <div
                              key={sIdx}
                              className={`w-full rounded-full transition-all duration-300 ${
                                seg === 'crimson'
                                  ? 'h-3.5 bg-[#8B181B]'
                                  : 'h-2 bg-stone-200'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Label & Count */}
                        <span className="text-[10px] font-extrabold font-mono text-stone-900">
                          {bar.count}
                        </span>
                        <span className="text-[9px] font-bold text-stone-500 uppercase tracking-tight truncate max-w-[50px]">
                          {bar.label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[10px] text-stone-400 font-medium text-center md:text-right">
                  Click any channel above to filter the tribunal stream
                </div>
              </div>
            </div>
          </div>

          {/* ----------------------------------------------------
              THE TRIBUNAL STREAM & FORENSIC CARDS
              ---------------------------------------------------- */}
          <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-stone-200/90 shadow-2xs space-y-4">
            
            {/* Search & Action Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by student ID, claimant legal name, email, or degree program..."
                  className="w-full pl-9 pr-9 py-2.5 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {activeTab === 'alumni' && (
                <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      filterType === 'all'
                        ? 'bg-stone-900 text-white font-bold'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    All ({pendingAnalyses.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('perfect')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      filterType === 'perfect'
                        ? 'bg-emerald-700 text-white font-bold'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Exact ({perfectMatchAnalyses.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFilterType('discrepancy')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                      filterType === 'discrepancy'
                        ? 'bg-amber-600 text-white font-bold'
                        : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    <AlertTriangle className="w-3 h-3" />
                    <span>Variances ({discrepancyAnalyses.length})</span>
                  </button>
                </div>
              )}

              {activeTab === 'conflicts' && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-stone-50 border border-stone-200 text-xs text-stone-800 py-2 px-3 rounded-xl focus:outline-hidden font-semibold cursor-pointer"
                  >
                    <option value="pending">Pending Cases ({pendingConflicts.length})</option>
                    <option value="all">All Collision Records ({conflicts.length})</option>
                    <option value="resolved_verified">Approved Claims</option>
                    <option value="resolved_rejected">Rejected Duplicates</option>
                  </select>
                </div>
              )}
            </div>

            {/* Bulk Actions for Conflicts */}
            {activeTab === 'conflicts' && pendingConflicts.length > 0 && (
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleToggleSelectAllPending}
                    className="flex items-center gap-2 text-xs font-bold text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
                  >
                    {isAllPendingSelected ? (
                      <CheckSquare className="w-4 h-4 text-[#8B181B]" />
                    ) : (
                      <Square className="w-4 h-4 text-stone-400" />
                    )}
                    <span>
                      {isAllPendingSelected
                        ? 'Deselect All'
                        : `Select All Pending (${pendingConflicts.length})`}
                    </span>
                  </button>

                  {selectedConflictIds.length > 0 && (
                    <span className="text-xs bg-red-100 text-red-900 font-bold px-2 py-0.5 rounded-md">
                      {selectedConflictIds.length} selected
                    </span>
                  )}
                </div>

                {selectedConflictIds.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1 md:justify-end">
                    <input
                      type="text"
                      value={bulkNote}
                      onChange={(e) => setBulkNote(e.target.value)}
                      placeholder="Registrar justification note..."
                      className="text-xs px-3 py-1.5 bg-white border border-stone-200 rounded-lg w-full sm:w-64"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isProcessingBulk}
                        onClick={() => handleBulkResolveConflicts('resolved_verified')}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve Selected</span>
                      </button>
                      <button
                        type="button"
                        disabled={isProcessingBulk}
                        onClick={() => handleBulkResolveConflicts('resolved_rejected')}
                        className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Reject Selected</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: ALUMNI APPLICANTS */}
            {activeTab === 'alumni' && (
              <div className="space-y-3.5">
                {filteredAlumniAnalyses.length === 0 ? (
                  <div className="bg-stone-50/70 rounded-2xl border border-stone-200/80 p-12 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-stone-900">Alumni Intake Docket Clear</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                      No unverified alumni registration requests match the active filter criteria.
                    </p>
                  </div>
                ) : (
                  filteredAlumniAnalyses.map((analysis) => {
                    const reg = analysis.registryRecord;
                    const isPerfect = analysis.status === 'PERFECT_MATCH';
                    const isDegreeDiff = analysis.status === 'DEGREE_DISCREPANCY';
                    const isNameDiff = analysis.status === 'NAME_DISCREPANCY';

                    return (
                      <div
                        key={analysis.userId}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          isPerfect
                            ? 'bg-white border-emerald-300/80 ring-1 ring-emerald-300/30'
                            : isDegreeDiff
                            ? 'bg-white border-sky-300/80 ring-1 ring-sky-300/30'
                            : 'bg-white border-amber-300/80 ring-1 ring-amber-300/30'
                        }`}
                      >
                        {/* Header Row */}
                        <div className="p-4 sm:p-4.5 bg-stone-50/70 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isPerfect
                                ? 'bg-emerald-100 text-emerald-800'
                                : isDegreeDiff
                                ? 'bg-sky-100 text-sky-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {analysis.user.name.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-sm text-stone-900">
                                  {analysis.user.name}
                                </span>

                                {isPerfect && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" />
                                    100% Match
                                  </span>
                                )}

                                {isDegreeDiff && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                                    Curriculum Variance
                                  </span>
                                )}

                                {isNameDiff && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                                    Name Discrepancy
                                  </span>
                                )}
                              </div>

                              <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-stone-400" />
                                  <span className="font-mono">{analysis.user.email}</span>
                                </span>
                                <span className="text-stone-300">·</span>
                                <span className="flex items-center gap-1">
                                  <span className="font-mono font-bold text-stone-700">
                                    {analysis.user.studentId || 'No ID Provided'}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Block */}
                          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                            {analysis.user.studentId && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(analysis.user.studentId!, 'Student ID')}
                                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/70 transition-colors cursor-pointer"
                                title="Copy Student ID"
                              >
                                {copiedText === analysis.user.studentId ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedUserIdForModal(analysis.userId)}
                              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Profile</span>
                            </button>

                            {isDegreeDiff && reg ? (
                              <button
                                type="button"
                                onClick={() => handleSyncToTranscriptAndVerify(analysis)}
                                className="px-3.5 py-1.5 bg-sky-700 hover:bg-sky-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Sync Transcript</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleApproveAlumniAsDeclared(
                                    analysis.userId,
                                    analysis.user.name,
                                    analysis.user.studentId
                                  )
                                }
                                className="px-3.5 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Approve Access</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Forensic Split-Screen Details */}
                        <div className="p-4 sm:p-4.5 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-1.5">
                              <span className="font-bold text-stone-900 block text-[11px] pb-1 border-b border-stone-200 uppercase tracking-tight">
                                User Self-Declaration
                              </span>
                              <div className="space-y-1 text-[11px]">
                                <div className="flex justify-between">
                                  <span className="text-stone-500">Claimed ID:</span>
                                  <span className="font-mono font-bold text-stone-900">{analysis.user.studentId || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-stone-500">Degree:</span>
                                  <span className="text-stone-800 font-medium truncate max-w-[180px]">{analysis.user.course || 'Not specified'}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-stone-500">Class of:</span>
                                  <span className="text-stone-800 font-medium">{analysis.user.batch || 'N/A'}</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/80 space-y-1.5">
                              <span className="font-bold text-emerald-800 block text-[11px] pb-1 border-b border-stone-200 uppercase tracking-tight">
                                Official Registrar Archive
                              </span>
                              {reg ? (
                                <div className="space-y-1 text-[11px]">
                                  <div className="flex justify-between">
                                    <span className="text-stone-500">Archive ID:</span>
                                    <span className="font-mono font-bold text-emerald-800">{reg.studentId}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-stone-500">Accredited:</span>
                                    <span className="text-emerald-900 font-bold truncate max-w-[180px]">{reg.course}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-stone-500">Class of:</span>
                                    <span className="text-stone-900 font-semibold">{reg.batchYear}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="text-center py-2 text-stone-500 text-[11px]">
                                  No diploma record found in official Registrar masterlist.
                                </div>
                              )}
                            </div>
                          </div>

                          {analysis.discrepancyDetails.length > 0 && (
                            <div className="p-2.5 rounded-xl bg-stone-50/80 border border-stone-200 text-xs flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="space-y-0.5">
                                <span className="font-bold text-stone-900">Diagnostic Finding: </span>
                                <span className="text-stone-700">
                                  {analysis.discrepancyDetails.join(' ')}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 2: ID COLLISIONS */}
            {activeTab === 'conflicts' && (
              <div className="space-y-3.5">
                {filteredConflicts.length === 0 ? (
                  <div className="bg-stone-50/70 rounded-2xl border border-stone-200/80 p-12 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-stone-900">Collision Docket Clear</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                      No active Student ID registration disputes require registrar deliberation.
                    </p>
                  </div>
                ) : (
                  filteredConflicts.map((conflict) => (
                    <div
                      key={conflict.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        conflict.status === 'pending'
                          ? selectedConflictIds.includes(conflict.id)
                            ? 'border-[#8B181B] ring-2 ring-[#8B181B]/20 bg-white'
                            : 'border-amber-300 ring-1 ring-amber-300/40 bg-white'
                          : 'border-stone-200 bg-stone-50/60'
                      }`}
                    >
                      <div className="p-4 sm:p-4.5 bg-stone-50/70 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {conflict.status === 'pending' && (
                            <button
                              type="button"
                              onClick={() => handleToggleSelectConflict(conflict.id)}
                              className="text-stone-400 hover:text-stone-700 transition-colors p-0.5 cursor-pointer"
                            >
                              {selectedConflictIds.includes(conflict.id) ? (
                                <CheckSquare className="w-4 h-4 text-[#8B181B]" />
                              ) : (
                                <Square className="w-4 h-4 text-stone-400" />
                              )}
                            </button>
                          )}

                          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center shrink-0">
                            <Scale className="w-4 h-4" />
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-stone-900">{conflict.applicantName}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-800 border border-stone-200">
                                {conflict.conflictType === 'duplicate_id'
                                  ? 'Duplicate Student ID'
                                  : conflict.conflictType === 'claimed_id_dispute'
                                  ? 'ID Claim Dispute'
                                  : conflict.conflictType === 'manual_verification_request' || conflict.conflictType === 'unlisted_record'
                                  ? 'Manual Verification Appeal'
                                  : conflict.conflictType === 'name_mismatch'
                                  ? 'Name Discrepancy'
                                  : conflict.conflictType === 'batch_discrepancy'
                                  ? 'Batch Discrepancy'
                                  : conflict.conflictType}
                              </span>
                              <span className="text-[10px] font-semibold text-stone-500">
                                Severity: {(conflict.severity || 'medium').toUpperCase()}
                              </span>
                            </div>
                            <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2">
                              <Mail className="w-3 h-3 text-stone-400" />
                              <span className="font-mono">{conflict.applicantEmail}</span>
                              <span className="text-stone-300">·</span>
                              <Clock className="w-3 h-3 text-stone-400" />
                              <span>{new Date(conflict.flaggedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          {conflict.status === 'pending' ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1.5">
                              <Clock className="w-3 h-3" />
                              Hearing Required
                            </span>
                          ) : conflict.status === 'resolved_verified' ? (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved & Verified
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                              Rejected Claim
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-4 sm:p-5 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
                            <span className="text-[10px] font-semibold text-stone-500 uppercase block pb-1 border-b border-stone-200">
                              Incoming Claimant
                            </span>
                            <div className="space-y-1.5 text-xs">
                              <div className="flex justify-between">
                                <span className="text-stone-500">Claimed ID:</span>
                                <span className="font-mono font-bold text-stone-900">{conflict.applicantStudentId || 'N/A'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-500">Declared Name:</span>
                                <span className="font-bold text-stone-900">{conflict.applicantName}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-stone-500">Cohort:</span>
                                <span className="font-semibold text-stone-800">Class of {conflict.applicantBatch || 'N/A'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase block pb-1 border-b border-stone-200">
                              Registrar Masterlist
                            </span>
                            {conflict.registryRecord ? (
                              <div className="space-y-1.5 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-stone-500">Archive ID:</span>
                                  <span className="font-mono font-bold text-emerald-800">{conflict.registryRecord.studentId}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-stone-500">Archive Name:</span>
                                  <span className="font-bold text-stone-900">{conflict.registryRecord.fullName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-stone-500">Accredited:</span>
                                  <span className="font-semibold text-stone-800">{conflict.registryRecord.course}</span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-stone-500 text-xs py-3 text-center">
                                No record found with Student ID {conflict.applicantStudentId}.
                              </div>
                            )}
                          </div>
                        </div>

                        {conflict.status === 'pending' && (
                          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-stone-100">
                            <div className="flex-1">
                              {resolvingConflictId === conflict.id ? (
                                <input
                                  type="text"
                                  value={singleNote}
                                  onChange={(e) => setSingleNote(e.target.value)}
                                  placeholder="Official hearing justification note..."
                                  className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                                  autoFocus
                                />
                              ) : (
                                <p className="text-[11px] text-stone-400">
                                  Verify identity documents or diplomas before resolving.
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  if (resolvingConflictId !== conflict.id) {
                                    setResolvingConflictId(conflict.id);
                                  } else {
                                    handleResolveConflict(conflict, 'resolved_rejected');
                                  }
                                }}
                                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                              >
                                Reject Duplicate
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (resolvingConflictId !== conflict.id) {
                                    setResolvingConflictId(conflict.id);
                                  } else {
                                    handleResolveConflict(conflict, 'dismissed');
                                  }
                                }}
                                className="px-3 py-1.5 text-stone-500 hover:text-stone-800 text-xs font-medium cursor-pointer"
                              >
                                Dismiss
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (resolvingConflictId !== conflict.id) {
                                    setResolvingConflictId(conflict.id);
                                  } else {
                                    handleResolveConflict(conflict, 'resolved_verified');
                                  }
                                }}
                                className="px-3.5 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Approve & Verify</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: EMPLOYERS */}
            {activeTab === 'employers' && (
              <div className="space-y-3.5">
                {filteredEmployers.length === 0 ? (
                  <div className="bg-stone-50/70 rounded-2xl border border-stone-200/80 p-12 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-stone-900">Employer Vetting Docket Clear</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                      All corporate recruiters and industry hiring partners have been accredited.
                    </p>
                  </div>
                ) : (
                  filteredEmployers.map((emp) => (
                    <div
                      key={emp.uid}
                      className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-sm shrink-0 border border-stone-200">
                          <Building2 className="w-5 h-5 text-[#8B181B]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-900">{emp.companyName || emp.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              Pending Accreditation
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2">
                            <span>Contact: {emp.name}</span>
                            <span className="text-stone-300">·</span>
                            <span className="font-mono">{emp.email}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            verifyEmployer(emp.uid, false);
                            showToast(`Declined employer registration for ${emp.companyName || emp.name}`, 'info');
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            verifyEmployer(emp.uid, true);
                            showToast(`✓ Accredited ${emp.companyName || emp.name} as verified employer!`, 'success');
                          }}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Accredit Partner</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 4: JOBS */}
            {activeTab === 'jobs' && (
              <div className="space-y-3.5">
                {filteredJobs.length === 0 ? (
                  <div className="bg-stone-50/70 rounded-2xl border border-stone-200/80 p-12 text-center">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <h3 className="text-sm font-bold text-stone-900">Career Moderation Docket Clear</h3>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
                      All employment postings and internship openings have been vetted.
                    </p>
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      className="bg-white rounded-2xl border border-stone-200/90 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold text-sm shrink-0 border border-stone-200">
                          <Briefcase className="w-5 h-5 text-[#8B181B]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-stone-900">{job.title}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200">
                              {job.type}
                            </span>
                          </div>
                          <div className="text-[11px] text-stone-500 mt-0.5 flex items-center gap-2">
                            <span className="font-semibold text-stone-700">{job.company}</span>
                            <span className="text-stone-300">·</span>
                            <span>{job.location}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            rejectOpportunity(job.id, 'Does not meet career compliance guidelines');
                            showToast(`Rejected job listing: ${job.title}`, 'info');
                          }}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            approveOpportunity(job.id);
                            showToast(`✓ Published job opportunity to alumni: ${job.title}`, 'success');
                          }}
                          className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>Approve & Publish</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ======================================================
            RIGHT SIDEBAR COLUMN (3.5 cols on desktop XL)
            Matching Command Center's Right Bento Stack Architecture
            ====================================================== */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          
          {/* Bento Tile 1: Masterlist Purity & Security Index */}
          <div className="bg-white rounded-[32px] p-6 border border-stone-200/90 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#8B181B]" />
                <span>Security & Integrity Telemetry</span>
              </h4>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Gate Active
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[11px]">Masterlist Purity Index</span>
                  <span className="font-bold text-stone-900 text-sm font-mono tabular-nums">
                    {integrityMetrics.purityScore}% match
                  </span>
                </div>
                <Database className="w-5 h-5 text-stone-400" />
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[11px]">Flawless 100% Matches</span>
                  <span className="font-bold text-emerald-700 text-sm font-mono tabular-nums">
                    {integrityMetrics.perfectMatchesCount} ready
                  </span>
                </div>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[11px]">Quarantined Discrepancies</span>
                  <span className="font-bold text-amber-700 text-sm font-mono tabular-nums">
                    {integrityMetrics.discrepanciesCount} flagged
                  </span>
                </div>
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>

              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
                <div>
                  <span className="text-stone-500 block text-[11px]">Duplicate ID Collisions</span>
                  <span className={`font-bold text-sm font-mono tabular-nums ${
                    pendingConflicts.length > 0 ? 'text-[#8B181B]' : 'text-stone-900'
                  }`}>
                    {pendingConflicts.length} disputes
                  </span>
                </div>
                <Scale className="w-5 h-5 text-stone-400" />
              </div>
            </div>
          </div>

          {/* Bento Tile 2: 1-Click Transcript Alignment Assistant */}
          {spotlitDiscrepancy && spotlitDiscrepancy.registryRecord ? (
            <div className="bg-gradient-to-br from-[#8B181B] to-[#721316] text-white rounded-[32px] p-6 shadow-md space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                  Curriculum Alignment Assistant
                </span>
              </div>

              <h4 className="text-lg font-bold font-serif leading-tight">
                {spotlitDiscrepancy.user.name}
              </h4>

              <div className="bg-white/10 rounded-2xl p-3 border border-white/15 text-xs space-y-1.5">
                <div className="flex justify-between text-red-100">
                  <span>Declared:</span>
                  <span className="font-medium text-white">{spotlitDiscrepancy.user.course}</span>
                </div>
                <div className="flex justify-between text-emerald-200">
                  <span>Archive:</span>
                  <span className="font-bold text-white">{spotlitDiscrepancy.registryRecord.course}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSyncToTranscriptAndVerify(spotlitDiscrepancy)}
                className="w-full py-2.5 bg-white hover:bg-stone-100 text-[#8B181B] font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Sync to Transcript & Verify</span>
              </button>
            </div>
          ) : (
            <div className="bg-stone-50 rounded-[32px] p-6 border border-stone-200/80 space-y-3">
              <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-700" />
                <span>Discrepancy Hearing Protocol</span>
              </h4>
              <p className="text-xs text-stone-500 leading-relaxed">
                When student claims differ from the diploma archive, click <strong>"Sync Transcript"</strong> on their card to automatically bind their profile to accredited university curriculum.
              </p>
            </div>
          )}

          {/* Bento Tile 3: Enforced Institutional Policies */}
          <div className="bg-white rounded-[32px] p-6 border border-stone-200/90 shadow-2xs space-y-3">
            <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-stone-600" />
              <span>Institutional Governance Mandates</span>
            </h4>

            <div className="space-y-2.5 text-xs text-stone-600">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B181B] mt-1.5 shrink-0" />
                <span><strong>Zero-Trust ID Lock:</strong> Competing claims on verified Student IDs are automatically quarantined.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B181B] mt-1.5 shrink-0" />
                <span><strong>Transcript Binding:</strong> Self-declared degrees are aligned with official curriculum titles for tracer accuracy.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8B181B] mt-1.5 shrink-0" />
                <span><strong>Immutable Audit Log:</strong> Every hearing override logs actor name, timestamp, and justification.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Aliases for router compatibility
export const AdminGovernanceView = AdminRequestsAndConflictsView;
export const AdminVerificationAndIdentityView = AdminRequestsAndConflictsView;
