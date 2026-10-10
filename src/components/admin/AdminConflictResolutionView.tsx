/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  RefreshCw,
  UserCheck,
  UserX,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
  Clock,
  User,
  Mail,
  GraduationCap,
  Calendar,
  FileText,
  FileDown,
  CheckSquare,
  Square,
  Scale,
  Copy,
  Check,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { RegistrationConflictRecord } from '../../types';
import {
  getRegistrationConflicts,
  resolveConflictRecord,
  getRegistrarRecords,
  evaluateIncomingRegistration
} from '../../services/studentVerificationService';
import { generateConflictResolutionPdfReport } from '../../services/conflictReportPdfService';
import { useAlumni } from '../../context/AlumniContext';

export const AdminConflictResolutionView: React.FC = () => {
  const { currentUser, users, setUserVerified, showToast, addAuditLog, setSelectedUserIdForModal } = useAlumni();

  const [conflicts, setConflicts] = useState<RegistrationConflictRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [selectedConflict, setSelectedConflict] = useState<RegistrationConflictRecord | null>(null);

  // Multi-select & Bulk Action states
  const [selectedConflictIds, setSelectedConflictIds] = useState<string[]>([]);
  const [bulkNote, setBulkNote] = useState('');
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  // Resolution note state
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadConflicts = () => {
    const list = getRegistrationConflicts();
    setConflicts(list);
  };

  useEffect(() => {
    loadConflicts();
  }, []);

  // Filtered conflict records
  const filteredConflicts = useMemo(() => {
    return conflicts.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.applicantName.toLowerCase().includes(q) ||
        c.applicantEmail.toLowerCase().includes(q) ||
        (c.applicantStudentId && c.applicantStudentId.toLowerCase().includes(q)) ||
        (c.registryRecord?.fullName && c.registryRecord.fullName.toLowerCase().includes(q));

      const matchesType = typeFilter === 'all' || c.conflictType === typeFilter;
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [conflicts, searchQuery, typeFilter, statusFilter]);

  // Summary counts
  const pendingCount = useMemo(() => conflicts.filter((c) => c.status === 'pending').length, [conflicts]);
  const verifiedCount = useMemo(() => conflicts.filter((c) => c.status === 'resolved_verified').length, [conflicts]);
  const rejectedCount = useMemo(() => conflicts.filter((c) => c.status === 'resolved_rejected').length, [conflicts]);

  // Handle resolution action
  const handleResolve = (
    conflict: RegistrationConflictRecord,
    action: 'resolved_verified' | 'resolved_rejected' | 'dismissed'
  ) => {
    const actorName = currentUser?.name || 'Registrar Officer';
    const success = resolveConflictRecord(
      conflict.id,
      action,
      actorName,
      resolutionNote || undefined
    );

    if (success) {
      if (conflict.applicantUid) {
        if (action === 'resolved_verified') {
          setUserVerified(conflict.applicantUid, true);
        } else if (action === 'resolved_rejected') {
          setUserVerified(conflict.applicantUid, false);
        }
      } else {
        const matchedUser = users.find(
          (u) =>
            u.email.toLowerCase() === conflict.applicantEmail.toLowerCase() ||
            (conflict.applicantStudentId && u.studentId === conflict.applicantStudentId)
        );
        if (matchedUser) {
          setUserVerified(matchedUser.uid, action === 'resolved_verified');
        }
      }

      addAuditLog({
        action: `CONFLICT_RESOLUTION_${action.toUpperCase()}`,
        actorId: currentUser?.uid || 'registrar',
        actorName,
        actorRole: currentUser?.role || 'registrar',
        category: 'security',
        details: `${action === 'resolved_verified' ? 'Approved and auto-verified' : 'Rejected/Dismissed'} registration conflict for ${conflict.applicantName} (Student ID: ${conflict.applicantStudentId || 'N/A'}). Note: ${resolutionNote || 'Routine registrar inspection'}.`,
        severity: action === 'resolved_verified' ? 'success' : 'warning'
      });

      showToast(
        action === 'resolved_verified'
          ? `✓ Applicant ${conflict.applicantName} approved and granted verified alumni access.`
          : action === 'resolved_rejected'
          ? `Duplicate registration for ${conflict.applicantName} rejected to protect masterlist integrity.`
          : `Dispute flag dismissed.`,
        action === 'resolved_verified' ? 'success' : 'info'
      );

      loadConflicts();
      setResolvingId(null);
      setResolutionNote('');
      if (selectedConflict?.id === conflict.id) {
        setSelectedConflict(null);
      }
    }
  };

  // Visible pending records for multi-select
  const visiblePendingConflicts = useMemo(() => {
    return filteredConflicts.filter((c) => c.status === 'pending');
  }, [filteredConflicts]);

  const isAllPendingSelected =
    visiblePendingConflicts.length > 0 &&
    visiblePendingConflicts.every((c) => selectedConflictIds.includes(c.id));

  const handleToggleSelect = (id: string) => {
    setSelectedConflictIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAllPending = () => {
    if (isAllPendingSelected) {
      const pendingIds = new Set(visiblePendingConflicts.map((c) => c.id));
      setSelectedConflictIds((prev) => prev.filter((id) => !pendingIds.has(id)));
    } else {
      const newIds = new Set([...selectedConflictIds, ...visiblePendingConflicts.map((c) => c.id)]);
      setSelectedConflictIds(Array.from(newIds));
    }
  };

  // Perform bulk action
  const handleBulkResolve = (action: 'resolved_verified' | 'resolved_rejected') => {
    if (selectedConflictIds.length === 0) return;
    setIsProcessingBulk(true);

    const actorName = currentUser?.name || 'Registrar Officer';
    let processed = 0;

    selectedConflictIds.forEach((id) => {
      const conflict = conflicts.find((c) => c.id === id);
      if (!conflict) return;

      const note =
        bulkNote.trim() ||
        `Bulk resolution (${action === 'resolved_verified' ? 'Approved' : 'Rejected'}) by ${actorName}`;
      const success = resolveConflictRecord(id, action, actorName, note);

      if (success) {
        processed++;
        if (conflict.applicantUid) {
          setUserVerified(conflict.applicantUid, action === 'resolved_verified');
        } else {
          const matchedUser = users.find(
            (u) =>
              u.email.toLowerCase() === conflict.applicantEmail.toLowerCase() ||
              (conflict.applicantStudentId && u.studentId === conflict.applicantStudentId)
          );
          if (matchedUser) {
            setUserVerified(matchedUser.uid, action === 'resolved_verified');
          }
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
      `✓ Processed ${processed} records: ${
        action === 'resolved_verified' ? 'Bulk Approved and Verified' : 'Bulk Rejected and Blocked'
      }!`,
      'success'
    );

    setSelectedConflictIds([]);
    setBulkNote('');
    setIsProcessingBulk(false);
    loadConflicts();
  };

  // Generate official PDF report
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1800);
    showToast(`Copied ${text}`);
  };

  const formatConflictLabel = (type: string) => {
    switch (type) {
      case 'duplicate_id':
        return 'Duplicate Student ID';
      case 'name_mismatch':
        return 'Name Variance';
      case 'batch_discrepancy':
        return 'Batch Cohort Variance';
      case 'partial_match':
        return 'Partial Transcript Match';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls & Search Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-stone-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student ID, applicant name, email, or masterlist record..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 text-xs text-stone-700 py-2 px-3 rounded-xl focus:outline-hidden font-medium"
            >
              <option value="all">All Collision Types</option>
              <option value="duplicate_id">Duplicate Student ID</option>
              <option value="name_mismatch">Name Variance</option>
              <option value="batch_discrepancy">Batch Variance</option>
              <option value="partial_match">Partial Match</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-stone-50 border border-stone-200 text-xs text-stone-800 py-2 px-3 rounded-xl focus:outline-hidden font-semibold"
            >
              <option value="pending">Pending Cases ({pendingCount})</option>
              <option value="resolved_verified">Approved & Cleared ({verifiedCount})</option>
              <option value="resolved_rejected">Rejected Duplicates ({rejectedCount})</option>
              <option value="all">All Statuses ({conflicts.length})</option>
            </select>

            <button
              type="button"
              onClick={handleGeneratePdfReport}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Generate PDF forensic audit report"
            >
              <FileDown className="w-3.5 h-3.5 text-[#8B181B]" />
              <span>Audit PDF</span>
            </button>
          </div>
        </div>

        {/* Multi-Select & Bulk Actions Bar */}
        {visiblePendingConflicts.length > 0 && (
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
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
                  {isAllPendingSelected ? 'Deselect All' : `Select All Pending (${visiblePendingConflicts.length})`}
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
                  placeholder="Official justification note..."
                  className="text-xs px-3 py-1.5 bg-white border border-stone-200 rounded-lg w-full sm:w-64"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isProcessingBulk}
                    onClick={() => handleBulkResolve('resolved_verified')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Approve Selected</span>
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingBulk}
                    onClick={() => handleBulkResolve('resolved_rejected')}
                    className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Reject Selected</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Dispute Cards List */}
      <div className="space-y-3.5">
        {filteredConflicts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-2xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-stone-900">Dispute Hearing Docket Clear</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
              No registration conflicts require registrar deliberation under the current filter settings.
            </p>
          </div>
        ) : (
          filteredConflicts.map((conflict) => (
            <div
              key={conflict.id}
              className={`bg-white rounded-2xl border transition-all shadow-2xs overflow-hidden ${
                conflict.status === 'pending'
                  ? selectedConflictIds.includes(conflict.id)
                    ? 'border-[#8B181B] ring-2 ring-[#8B181B]/20'
                    : 'border-amber-300 ring-1 ring-amber-300/40'
                  : 'border-stone-200'
              }`}
            >
              {/* Card Header Bar */}
              <div className="p-4 sm:p-4.5 bg-stone-50/70 border-b border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {conflict.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleToggleSelect(conflict.id)}
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
                        {formatConflictLabel(conflict.conflictType)}
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

                {/* Status Indicator */}
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

              {/* Forensic Comparison Split Pane */}
              <div className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column: Applicant Registration Claim */}
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                        <User className="w-3.5 h-3.5 text-stone-500" />
                        <span>Incoming Claimant Details</span>
                      </div>
                      <span className="text-[10px] font-semibold text-stone-500 uppercase">Self-Declared</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-500 font-medium">Claimed Student ID:</span>
                        <span className="font-mono font-bold text-stone-900">
                          {conflict.applicantStudentId || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500 font-medium">Declared Name:</span>
                        <span className="font-bold text-stone-900">{conflict.applicantName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500 font-medium">Declared Cohort:</span>
                        <span className="font-semibold text-stone-800">
                          Class of {conflict.applicantBatch || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500 font-medium">Degree:</span>
                        <span className="text-stone-800 text-right truncate max-w-[200px]">
                          {conflict.applicantCourse || 'Not specified'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Masterlist Record */}
                  <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2.5">
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900">
                        <GraduationCap className="w-3.5 h-3.5 text-[#8B181B]" />
                        <span>Registrar Masterlist Record</span>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 uppercase">Official Archive</span>
                    </div>

                    {conflict.registryRecord ? (
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className="text-stone-500 font-medium">Archive Student ID:</span>
                          <span className="font-mono font-bold text-emerald-800">
                            {conflict.registryRecord.studentId}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500 font-medium">Archived Full Name:</span>
                          <span className="font-bold text-stone-900">
                            {conflict.registryRecord.fullName}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500 font-medium">Official Cohort:</span>
                          <span className="font-semibold text-stone-800">
                            Class of {conflict.registryRecord.batchYear}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-stone-500 font-medium">Accredited Program:</span>
                          <span className="text-stone-800 text-right truncate max-w-[200px]">
                            {conflict.registryRecord.course}
                          </span>
                        </div>
                        {conflict.registryRecord.isRegistered && (
                          <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium mt-1">
                            ⚠️ Note: Student ID is already bound to an active registered profile.
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-stone-500 text-xs py-5 text-center">
                        <p>No masterlist record found with Student ID {conflict.applicantStudentId}.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Diagnostics Note */}
                <div className="bg-stone-50/80 p-3 rounded-xl border border-stone-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-stone-900">Dispute Note: </span>
                    <span className="text-stone-700">{conflict.notes}</span>
                    {conflict.resolutionNote && (
                      <p className="mt-1 text-stone-600 italic">
                        Resolution Note: {conflict.resolutionNote}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions for Pending Conflict */}
                {conflict.status === 'pending' && (
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-stone-100">
                    <div className="flex-1">
                      {resolvingId === conflict.id ? (
                        <input
                          type="text"
                          value={resolutionNote}
                          onChange={(e) => setResolutionNote(e.target.value)}
                          placeholder="Add official registrar hearing note..."
                          className="w-full px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs"
                          autoFocus
                        />
                      ) : (
                        <p className="text-[11px] text-stone-400">
                          Review official identity documentation or diplomas before resolving.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (resolvingId !== conflict.id) {
                            setResolvingId(conflict.id);
                          } else {
                            handleResolve(conflict, 'resolved_rejected');
                          }
                        }}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Reject Duplicate
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (resolvingId !== conflict.id) {
                            setResolvingId(conflict.id);
                          } else {
                            handleResolve(conflict, 'dismissed');
                          }
                        }}
                        className="px-3 py-1.5 text-stone-500 hover:text-stone-800 text-xs font-medium cursor-pointer"
                      >
                        Dismiss
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (resolvingId !== conflict.id) {
                            setResolvingId(conflict.id);
                          } else {
                            handleResolve(conflict, 'resolved_verified');
                          }
                        }}
                        className="px-3.5 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white text-xs font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Approve & Grant Access</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
