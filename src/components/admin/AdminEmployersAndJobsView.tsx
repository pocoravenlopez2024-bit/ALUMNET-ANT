/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Briefcase,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Users,
  DollarSign,
  MapPin,
  Check,
  X,
  RefreshCw,
  Plus,
  Eye,
  Globe,
  Mail,
  Phone,
  TrendingUp,
  Download,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  ArrowRight,
  FileText,
  SlidersHorizontal,
  BriefcaseBusiness,
  Layers,
  Send,
  Building,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpen,
  BadgeCheck,
  CheckCheck,
  AlertCircle
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { Opportunity, UserProfile } from '../../types';

interface AdminEmployersAndJobsViewProps {
  initialSubTab?: 'jobs' | 'employers';
}

/**
 * Custom Executive Placement & Corporate Relations Suite
 * Distinct 3-Column Tactical Command Grid Architecture
 */
export const AdminEmployersAndJobsView: React.FC<AdminEmployersAndJobsViewProps> = ({
  initialSubTab = 'jobs'
}) => {
  const {
    opportunities,
    users,
    currentUser,
    approveOpportunity,
    rejectOpportunity,
    verifyEmployer,
    toggleEmployerJobPosting,
    showToast,
    addAuditLog,
    createOpportunity,
    setSelectedUserIdForModal,
    permissions
  } = useAlumni();

  // Primary active focus: 'all' | 'jobs' | 'employers' | 'moderation'
  const [activeViewMode, setActiveViewMode] = useState<'all' | 'jobs' | 'employers' | 'moderation'>(
    initialSubTab === 'employers' && permissions.canAccessEmployerAccreditation ? 'employers' : 'all'
  );

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedJobType, setSelectedJobType] = useState<string>('all');
  const [selectedArrangement, setSelectedArrangement] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'company' | 'salary'>('newest');
  const [displayLayout, setDisplayLayout] = useState<'dossier' | 'table'>('dossier');

  // Modals & Drawers
  const [showCreateJobModal, setShowCreateJobModal] = useState(false);
  const [rejectingJobId, setRejectingJobId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Incomplete position qualifications or compensation rate.');
  const [inspectingJob, setInspectingJob] = useState<Opportunity | null>(null);
  const [inspectingEmployer, setInspectingEmployer] = useState<UserProfile | null>(null);

  // New Job Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newLocation, setNewLocation] = useState('Cebu, Philippines');
  const [newType, setNewType] = useState<Opportunity['type']>('Full-time');
  const [newSalary, setNewSalary] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newRequirements, setNewRequirements] = useState('');
  const [newApplicationUrl, setNewApplicationUrl] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newRequiredCourse, setNewRequiredCourse] = useState('BS Information Technology');

  // Datasets derived from system
  const allEmployers = useMemo(() => {
    return (users || []).filter((u) => u.role === 'employer');
  }, [users]);

  const pendingEmployers = useMemo(() => {
    return allEmployers.filter(
      (u) => (u.employerVerificationStatus || 'pending_verification') === 'pending_verification'
    );
  }, [allEmployers]);

  const verifiedEmployers = useMemo(() => {
    return allEmployers.filter((u) => u.employerVerificationStatus === 'verified');
  }, [allEmployers]);

  const pendingJobs = useMemo(() => {
    return (opportunities || []).filter((o) => o.approvalStatus === 'pending_approval');
  }, [opportunities]);

  const approvedJobs = useMemo(() => {
    return (opportunities || []).filter(
      (o) => o.approvalStatus === 'approved' || !o.approvalStatus
    );
  }, [opportunities]);

  const totalPendingModeration = pendingJobs.length + pendingEmployers.length;

  // Real Alumni Employment Tracer
  const employedAlumni = useMemo(() => {
    return users.filter((u) => u.company || u.currentPosition || u.industry);
  }, [users]);
  const employmentRate = users.length > 0 ? Math.round((employedAlumni.length / users.length) * 100) : 89;

  // Top companies where alumni work
  const topAlumniHiringFirms = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      const comp = (u.company || '').trim();
      if (comp) {
        counts[comp] = (counts[comp] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));
  }, [users]);

  // Industry sectors with dynamic counts
  const industrySectors = useMemo(() => {
    const list = [
      { id: 'all', label: 'All Industries' },
      { id: 'technology', label: 'Technology & IT' },
      { id: 'business', label: 'Business & Finance' },
      { id: 'healthcare', label: 'Healthcare & Nursing' },
      { id: 'education', label: 'Education & Academics' },
      { id: 'hospitality', label: 'Hospitality & Tourism' },
      { id: 'maritime', label: 'Maritime & Logistics' },
    ];
    return list.map((item) => {
      if (item.id === 'all') {
        return { ...item, count: opportunities.length };
      }
      const count = opportunities.filter((o) => {
        const text = `${o.title} ${o.description} ${o.company} ${o.requiredCourse || ''}`.toLowerCase();
        return text.includes(item.id);
      }).length;
      return { ...item, count };
    });
  }, [opportunities]);

  // Filtered Opportunities
  const filteredOpportunities = useMemo(() => {
    let result = [...opportunities];

    // Sub-view filter
    if (activeViewMode === 'moderation') {
      result = result.filter((o) => o.approvalStatus === 'pending_approval');
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o.title?.toLowerCase().includes(q) ||
          o.company?.toLowerCase().includes(q) ||
          o.location?.toLowerCase().includes(q) ||
          o.description?.toLowerCase().includes(q) ||
          o.requiredCourse?.toLowerCase().includes(q)
      );
    }

    // Industry filter
    if (selectedIndustry !== 'all') {
      result = result.filter((o) => {
        const text = `${o.title} ${o.description} ${o.company} ${o.requiredCourse || ''}`.toLowerCase();
        return text.includes(selectedIndustry);
      });
    }

    // Job type filter
    if (selectedJobType !== 'all') {
      result = result.filter((o) => o.type?.toLowerCase() === selectedJobType.toLowerCase());
    }

    // Work arrangement filter
    if (selectedArrangement !== 'all') {
      result = result.filter((o) => {
        const text = `${o.location} ${o.description}`.toLowerCase();
        return text.includes(selectedArrangement.toLowerCase());
      });
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        const timeA = (a.postedAt || a.createdAt) ? new Date(a.postedAt || a.createdAt || '').getTime() : 0;
        const timeB = (b.postedAt || b.createdAt) ? new Date(b.postedAt || b.createdAt || '').getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === 'company') {
        return (a.company || '').localeCompare(b.company || '');
      }
      return 0;
    });

    return result;
  }, [opportunities, activeViewMode, searchQuery, selectedIndustry, selectedJobType, selectedArrangement, sortBy]);

  // Filtered Employers
  const filteredEmployers = useMemo(() => {
    let list = [...allEmployers];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (e) =>
          (e.name || '').toLowerCase().includes(q) ||
          (e.company || '').toLowerCase().includes(q) ||
          (e.email || '').toLowerCase().includes(q) ||
          (e.industry || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [allEmployers, searchQuery]);

  // Actions
  const handleApproveJob = useCallback(
    (jobId: string) => {
      approveOpportunity(jobId);
      addAuditLog({
        action: 'APPROVE_JOB_OPPORTUNITY',
        actorId: currentUser?.uid || 'career_officer',
        actorName: currentUser?.name || 'Career Placement Officer',
        actorRole: currentUser?.role || 'admin',
        category: 'career',
        details: `Approved career opportunity with ID: ${jobId}`,
        severity: 'success'
      });
      showToast('Career opportunity approved and dispatched to alumni network.', 'success');
    },
    [approveOpportunity, addAuditLog, currentUser, showToast]
  );

  const handleConfirmRejectJob = useCallback(() => {
    if (!rejectingJobId) return;
    rejectOpportunity(rejectingJobId, rejectReason);
    addAuditLog({
      action: 'REJECT_JOB_OPPORTUNITY',
      actorId: currentUser?.uid || 'career_officer',
      actorName: currentUser?.name || 'Career Placement Officer',
      actorRole: currentUser?.role || 'admin',
      category: 'career',
      details: `Rejected listing ${rejectingJobId}. Reason: ${rejectReason}`,
      severity: 'warning'
    });
    showToast('Listing rejected and feedback logged for employer.', 'info');
    setRejectingJobId(null);
  }, [rejectingJobId, rejectOpportunity, rejectReason, addAuditLog, currentUser, showToast]);

  const handleAccreditEmployer = useCallback(
    (employerUid: string, companyName: string) => {
      verifyEmployer(employerUid, 'verified');
      addAuditLog({
        action: 'VERIFY_EMPLOYER',
        actorId: currentUser?.uid || 'career_officer',
        actorName: currentUser?.name || 'Career Placement Officer',
        actorRole: currentUser?.role || 'admin',
        category: 'career',
        details: `Accredited corporate partner: ${companyName} (${employerUid})`,
        severity: 'success'
      });
      showToast(`Accredited corporate partner: ${companyName}`, 'success');
    },
    [verifyEmployer, addAuditLog, currentUser, showToast]
  );

  const handleCreateJobSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle.trim() || !newCompany.trim()) {
        showToast('Please provide both job title and hiring company.', 'error');
        return;
      }

      createOpportunity({
        title: newTitle.trim(),
        company: newCompany.trim(),
        location: newLocation.trim(),
        type: newType,
        salaryOrStipend: newSalary.trim() || 'Competitive',
        description: newDescription.trim() || 'Comprehensive role description available upon application.',
        requirements: newRequirements
          .split('\n')
          .map((r) => r.trim())
          .filter(Boolean),
        requiredCourse: newRequiredCourse.trim(),
        applicationUrl: newApplicationUrl.trim(),
        contactEmail: newContactEmail.trim() || currentUser?.email || 'careers@stcecilia.edu.ph',
        approvalStatus: 'approved'
      });

      addAuditLog({
        action: 'CREATE_JOB_OPPORTUNITY',
        actorId: currentUser?.uid || 'career_officer',
        actorName: currentUser?.name || 'Career Placement Officer',
        actorRole: currentUser?.role || 'admin',
        category: 'career',
        details: `Published institutional placement opening: "${newTitle}" at ${newCompany}`,
        severity: 'info'
      });

      showToast('Opportunity successfully created and published.', 'success');
      setShowCreateJobModal(false);

      // Reset
      setNewTitle('');
      setNewCompany('');
      setNewSalary('');
      setNewDescription('');
      setNewRequirements('');
      setNewApplicationUrl('');
    },
    [
      newTitle,
      newCompany,
      newLocation,
      newType,
      newSalary,
      newDescription,
      newRequirements,
      newRequiredCourse,
      newApplicationUrl,
      newContactEmail,
      currentUser,
      createOpportunity,
      addAuditLog,
      showToast
    ]
  );

  const handleExportPlacementLedger = useCallback(() => {
    const headers = ['Opportunity ID', 'Job Title', 'Company', 'Type', 'Location', 'Salary / Stipend', 'Approval Status', 'Posted Date'];
    const rows = opportunities.map((o) => [
      `"${o.id}"`,
      `"${(o.title || '').replace(/"/g, '""')}"`,
      `"${(o.company || '').replace(/"/g, '""')}"`,
      `"${o.type || 'Full-time'}"`,
      `"${(o.location || '').replace(/"/g, '""')}"`,
      `"${(o.salaryOrStipend || '').replace(/"/g, '""')}"`,
      `"${o.approvalStatus || 'approved'}"`,
      `"${o.postedAt || o.createdAt || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `SCC_Career_Placement_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Placement ledger exported to CSV.', 'success');
  }, [opportunities, showToast]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* 1. EXECUTIVE CAREER COMMAND RIBBON */}
      <div className="bg-white border border-stone-200/90 rounded-2xl p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8B181B] tracking-wide uppercase">
              <Building2 className="w-4 h-4 stroke-[2]" />
              <span>St. Cecilia's College - Cebu · Directorate of Corporate Alliances</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900">
              Corporate Recruitment & Career Placements
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span>Active Listings: <strong className="text-stone-900 font-semibold">{opportunities.length}</strong></span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span>Accredited Partners: <strong className="text-stone-900 font-semibold">{verifiedEmployers.length}</strong></span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span>Alumni Employment Index: <strong className="text-stone-900 font-semibold">{employmentRate}%</strong></span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span>Pending Review: <strong className={totalPendingModeration > 0 ? 'text-amber-600 font-semibold' : 'text-stone-700'}>{totalPendingModeration}</strong></span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportPlacementLedger}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200/80 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            {permissions.canAccessEmployerAccreditation && (
              <button
                type="button"
                onClick={() => setActiveViewMode(activeViewMode === 'employers' ? 'all' : 'employers')}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  activeViewMode === 'employers'
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200/80'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Partner Directory ({allEmployers.length})</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowCreateJobModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#8B181B] hover:bg-[#721316] shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Post New Opportunity</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. HORIZONTAL 4-TILE VELOCITY LEDGER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tile 1: Opportunity Pipeline */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Opportunity Pool</span>
            <Briefcase className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-stone-900">{opportunities.length}</span>
            <span className="text-xs text-stone-500 font-medium">live postings</span>
          </div>
          <div className="text-xs text-stone-500 flex items-center gap-1.5 pt-1 border-t border-stone-100">
            <span className="text-emerald-700 font-medium">{approvedJobs.length} active</span>
            <span className="text-stone-300">·</span>
            <span className={pendingJobs.length > 0 ? 'text-amber-700 font-medium' : 'text-stone-400'}>
              {pendingJobs.length} in moderation
            </span>
          </div>
        </div>

        {/* Tile 2: Corporate Partners */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Corporate Partners</span>
            <Building2 className="w-4 h-4 text-stone-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-stone-900">{allEmployers.length}</span>
            <span className="text-xs text-stone-500 font-medium">registered firms</span>
          </div>
          <div className="text-xs text-stone-500 flex items-center gap-1.5 pt-1 border-t border-stone-100">
            <span className="text-emerald-700 font-medium">{verifiedEmployers.length} accredited</span>
            <span className="text-stone-300">·</span>
            <span className={pendingEmployers.length > 0 ? 'text-amber-700 font-medium' : 'text-stone-400'}>
              {pendingEmployers.length} pending audit
            </span>
          </div>
        </div>

        {/* Tile 3: Tracer Study Index */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Tracer Index</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-stone-900">{employmentRate}%</span>
            <span className="text-xs text-emerald-700 font-semibold">employed alumni</span>
          </div>
          <div className="text-xs text-stone-500 flex items-center gap-1.5 pt-1 border-t border-stone-100">
            <span>{employedAlumni.length} verified in field</span>
            <span className="text-stone-300">·</span>
            <span className="text-stone-600">CHED Benchmark</span>
          </div>
        </div>

        {/* Tile 4: Moderation Pressure */}
        <div
          onClick={() => setActiveViewMode(activeViewMode === 'moderation' ? 'all' : 'moderation')}
          className={`border rounded-2xl p-5 shadow-2xs space-y-2 cursor-pointer transition-all ${
            totalPendingModeration > 0
              ? 'bg-amber-50/60 border-amber-200/90 hover:bg-amber-50'
              : 'bg-white border-stone-200/80 hover:bg-stone-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider ${totalPendingModeration > 0 ? 'text-amber-800' : 'text-stone-500'}`}>
              Moderation Desk
            </span>
            <AlertCircle className={`w-4 h-4 ${totalPendingModeration > 0 ? 'text-amber-600' : 'text-stone-400'}`} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold tracking-tight ${totalPendingModeration > 0 ? 'text-amber-900' : 'text-stone-900'}`}>
              {totalPendingModeration}
            </span>
            <span className={`text-xs font-medium ${totalPendingModeration > 0 ? 'text-amber-800' : 'text-stone-500'}`}>
              items require review
            </span>
          </div>
          <div className="text-xs flex items-center justify-between pt-1 border-t border-amber-200/60 text-amber-800">
            <span>{pendingJobs.length} jobs · {pendingEmployers.length} partners</span>
            <span className="font-semibold underline">Filter & Review →</span>
          </div>
        </div>
      </div>

      {/* 3. TACTICAL TRI-COLUMN COMMAND GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= COLUMN A (3 cols): SECTOR & PARTNER CONSOLE ================= */}
        <div className="lg:col-span-3 space-y-5">
          {/* Industry Sectors Card */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 uppercase tracking-wider">
                <Layers className="w-3.5 h-3.5 text-[#8B181B]" />
                <span>Sector Filter</span>
              </div>
              {selectedIndustry !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedIndustry('all')}
                  className="text-[11px] font-semibold text-[#8B181B] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="space-y-1">
              {industrySectors.map((sector) => (
                <button
                  key={sector.id}
                  type="button"
                  onClick={() => setSelectedIndustry(sector.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                    selectedIndustry === sector.id
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'text-stone-700 hover:bg-stone-100/80'
                  }`}
                >
                  <span className="truncate">{sector.label}</span>
                  <span
                    className={`ml-2 text-[11px] font-semibold tabular-nums px-1.5 py-0.5 rounded-md ${
                      selectedIndustry === sector.id
                        ? 'bg-stone-800 text-stone-200'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {sector.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Job Type & Work Arrangement Filter */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="text-xs font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-3">
              Engagement Type
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-stone-500 mb-1.5 block">Position Scope</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {['all', 'Full-time', 'Part-time', 'Internship'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedJobType(type === 'all' ? 'all' : type)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-center cursor-pointer ${
                        selectedJobType.toLowerCase() === type.toLowerCase()
                          ? 'bg-[#8B181B] text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70'
                      }`}
                    >
                      {type === 'all' ? 'All Types' : type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-stone-500 mb-1.5 block">Work Arrangement</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['all', 'Remote', 'Hybrid'].map((arr) => (
                    <button
                      key={arr}
                      type="button"
                      onClick={() => setSelectedArrangement(arr === 'all' ? 'all' : arr)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-center cursor-pointer ${
                        selectedArrangement.toLowerCase() === arr.toLowerCase()
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-700 hover:bg-stone-200/70'
                      }`}
                    >
                      {arr === 'all' ? 'Any' : arr}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Placement Standards & Guidelines */}
          <div className="bg-stone-50/80 border border-stone-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
              <ShieldCheck className="w-4 h-4 text-[#8B181B]" />
              <span>SCC Placement Governance</span>
            </div>
            <ul className="text-xs text-stone-600 space-y-2 leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-[#8B181B] font-bold">·</span>
                <span>All listings must guarantee at least minimum statutory wage or standard internship allowance.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#8B181B] font-bold">·</span>
                <span>Unverified employers are held in moderation until institutional MOUs are confirmed.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-[#8B181B] font-bold">·</span>
                <span>Direct CHED Tracer study tagging for graduate employment outcomes.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* ================= COLUMN B (6 cols): THE OPPORTUNITY EXCHANGE DECK ================= */}
        <div className="lg:col-span-6 space-y-4">
          {/* Search, Scope Toggles & View Controls */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search role, company, skills, or target course..."
                  className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8B181B] focus:border-[#8B181B] transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort listings"
                className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-700 focus:outline-none focus:ring-1 focus:ring-[#8B181B] cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="company">By Company</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center bg-stone-100 p-0.5 rounded-xl border border-stone-200">
                <button
                  type="button"
                  onClick={() => setDisplayLayout('dossier')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    displayLayout === 'dossier' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="Dossier Cards"
                >
                  <Briefcase className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setDisplayLayout('table')}
                  className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                    displayLayout === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                  }`}
                  title="Compact Ledger Table"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scope Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setActiveViewMode('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeViewMode === 'all'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                All Opportunities ({opportunities.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('moderation')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeViewMode === 'moderation'
                    ? 'bg-amber-700 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                <span>Needs Moderation</span>
                {pendingJobs.length > 0 && (
                  <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {pendingJobs.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setActiveViewMode('employers')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  activeViewMode === 'employers'
                    ? 'bg-stone-900 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                Partners ({allEmployers.length})
              </button>
            </div>
          </div>

          {/* ACTIVE VIEW: EMPLOYERS DIRECTORY */}
          {activeViewMode === 'employers' ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Partner Firms ({filteredEmployers.length})
                </span>
                <span className="text-xs text-stone-500">Corporate accreditation records</span>
              </div>

              {filteredEmployers.length === 0 ? (
                <div className="bg-white border border-stone-200/80 rounded-2xl p-10 text-center space-y-2">
                  <Building2 className="w-8 h-8 text-stone-400 mx-auto" />
                  <p className="text-sm font-semibold text-stone-800">No corporate partners match the filter</p>
                  <p className="text-xs text-stone-500">Try adjusting your search query.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredEmployers.map((emp) => {
                    const isVerified = emp.employerVerificationStatus === 'verified';
                    const canPost = emp.canPostJobs !== false;
                    return (
                      <div
                        key={emp.uid}
                        className="bg-white border border-stone-200/80 hover:border-stone-300 rounded-2xl p-4 shadow-2xs transition-all space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-stone-900">{emp.company || emp.name}</h3>
                              {isVerified ? (
                                <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                                  <BadgeCheck className="w-3.5 h-3.5" />
                                  <span>Accredited</span>
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-amber-700 flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>Pending Audit</span>
                                </span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
                              <span>Contact: {emp.name}</span>
                              <span className="text-stone-300">·</span>
                              <span>{emp.email}</span>
                              {emp.industry && (
                                <>
                                  <span className="text-stone-300">·</span>
                                  <span>{emp.industry}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {!isVerified && (
                              <button
                                type="button"
                                onClick={() => handleAccreditEmployer(emp.uid, emp.company || emp.name)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors cursor-pointer"
                              >
                                Accredit
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                toggleEmployerJobPosting(emp.uid, !canPost);
                                showToast(`Job posting permissions ${!canPost ? 'granted' : 'suspended'}.`, 'info');
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                                canPost
                                  ? 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                  : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                              }`}
                            >
                              {canPost ? 'Suspend Posts' : 'Allow Posts'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : /* ACTIVE VIEW: OPPORTUNITIES (DOSSIER OR TABLE) */
          displayLayout === 'table' ? (
            /* Structured Ledger Table */
            <div className="bg-white border border-stone-200/80 rounded-2xl shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-600">
                  <thead className="bg-stone-50/80 text-stone-700 font-semibold border-b border-stone-200/80 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Opportunity</th>
                      <th className="py-3 px-3">Company</th>
                      <th className="py-3 px-3">Type</th>
                      <th className="py-3 px-3">Compensation</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredOpportunities.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-stone-400">
                          No opportunities match the criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOpportunities.map((job) => {
                        const isPending = job.approvalStatus === 'pending_approval';
                        return (
                          <tr key={job.id} className="hover:bg-stone-50/60 transition-colors">
                            <td className="py-3 px-4">
                              <div className="font-semibold text-stone-900">{job.title}</div>
                              <div className="text-[11px] text-stone-400">{job.location}</div>
                            </td>
                            <td className="py-3 px-3 font-medium text-stone-800">{job.company}</td>
                            <td className="py-3 px-3">{job.type || 'Full-time'}</td>
                            <td className="py-3 px-3 font-mono text-stone-700">{job.salaryOrStipend || 'Competitive'}</td>
                            <td className="py-3 px-3">
                              {isPending ? (
                                <span className="text-amber-700 font-medium">In Review</span>
                              ) : (
                                <span className="text-emerald-700 font-medium">Approved</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              {isPending ? (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleApproveJob(job.id)}
                                    className="p-1 rounded-md text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                                    title="Approve"
                                  >
                                    <Check className="w-4 h-4 stroke-[2.5]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setRejectingJobId(job.id)}
                                    className="p-1 rounded-md text-rose-700 hover:bg-rose-50 cursor-pointer"
                                    title="Reject"
                                  >
                                    <X className="w-4 h-4 stroke-[2.5]" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => setInspectingJob(job)}
                                  className="text-stone-500 hover:text-stone-900 text-xs font-medium cursor-pointer"
                                >
                                  Inspect
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Dossier Cards View */
            <div className="space-y-3">
              {filteredOpportunities.length === 0 ? (
                <div className="bg-white border border-stone-200/80 rounded-2xl p-10 text-center space-y-2">
                  <Briefcase className="w-8 h-8 text-stone-400 mx-auto" />
                  <p className="text-sm font-semibold text-stone-800">No opportunities match the criteria</p>
                  <p className="text-xs text-stone-500">Try loosening your search query or sector filters.</p>
                </div>
              ) : (
                filteredOpportunities.map((job) => {
                  const isPending = job.approvalStatus === 'pending_approval';
                  return (
                    <div
                      key={job.id}
                      className={`bg-white border rounded-2xl p-5 shadow-2xs transition-all space-y-3 ${
                        isPending
                          ? 'border-amber-200 bg-amber-50/20'
                          : 'border-stone-200/80 hover:border-stone-300'
                      }`}
                    >
                      {/* Card Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-stone-500 font-medium">
                            <span className="font-semibold text-stone-900">{job.company}</span>
                            <span className="text-stone-300">·</span>
                            <span>{job.location}</span>
                            <span className="text-stone-300">·</span>
                            <span>{job.type || 'Full-time'}</span>
                          </div>
                          <h3 className="text-base font-bold text-stone-900 tracking-tight">
                            {job.title}
                          </h3>
                        </div>

                        {/* Status Tag */}
                        {isPending ? (
                          <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>In Review</span>
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <CheckCheck className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        )}
                      </div>

                      {/* Metadata Row */}
                      <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 bg-stone-50/80 p-2.5 rounded-xl border border-stone-100">
                        {job.salaryOrStipend && (
                          <div className="flex items-center gap-1 font-mono font-medium text-stone-900">
                            <DollarSign className="w-3.5 h-3.5 text-stone-400" />
                            <span>{job.salaryOrStipend}</span>
                          </div>
                        )}
                        {job.requiredCourse && (
                          <div className="flex items-center gap-1 text-stone-600">
                            <GraduationCap className="w-3.5 h-3.5 text-stone-400" />
                            <span>Target: {job.requiredCourse}</span>
                          </div>
                        )}
                      </div>

                      {/* Description Excerpt */}
                      {job.description && (
                        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>
                      )}

                      {/* Interactive Footer & Actions */}
                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                        <div className="text-stone-400">
                          {(job.postedAt || job.createdAt) ? `Posted ${new Date(job.postedAt || job.createdAt || '').toLocaleDateString()}` : 'Institutional Posting'}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setInspectingJob(job)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors cursor-pointer"
                          >
                            View Details
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => setRejectingJobId(job.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                              <button
                                type="button"
                                onClick={() => handleApproveJob(job.id)}
                                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 shadow-2xs transition-colors cursor-pointer"
                              >
                                Approve Listing
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* ================= COLUMN C (3 cols): ACCREDITATION DESK & ALUMNI TRACERS ================= */}
        <div className="lg:col-span-3 space-y-5">
          {/* Partner Accreditation Desk */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-stone-900 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-[#8B181B]" />
                <span>Accreditation Desk</span>
              </div>
              <span className="text-[11px] font-semibold text-stone-500">
                {pendingEmployers.length} pending
              </span>
            </div>

            {pendingEmployers.length === 0 ? (
              <div className="text-center py-4 space-y-1.5">
                <CheckCircle2 className="w-7 h-7 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-stone-900">All Corporate Partners Accredited</p>
                <p className="text-[11px] text-stone-500 leading-normal">
                  All registered employer organizations meet SCC institutional verification standards.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingEmployers.slice(0, 3).map((emp) => (
                  <div
                    key={emp.uid}
                    className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-2"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-stone-900">{emp.company || emp.name}</div>
                      <div className="text-[11px] text-stone-500 truncate">{emp.email}</div>
                    </div>
                    <div className="flex items-center justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAccreditEmployer(emp.uid, emp.company || emp.name)}
                        className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 transition-colors cursor-pointer"
                      >
                        Accredit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Alumni Hiring Partners */}
          <div className="bg-white border border-stone-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="text-xs font-bold text-stone-900 uppercase tracking-wider border-b border-stone-100 pb-3">
              Top Alumni Employers
            </div>
            <p className="text-xs text-stone-500 leading-relaxed">
              Leading organizations where verified St. Cecilia alumni currently practice professionally:
            </p>

            <div className="space-y-2">
              {topAlumniHiringFirms.length > 0 ? (
                topAlumniHiringFirms.map((firm) => (
                  <div
                    key={firm.name}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-stone-50 hover:bg-stone-100/80 transition-colors"
                  >
                    <span className="text-xs font-semibold text-stone-800 truncate mr-2">{firm.name}</span>
                    <span className="text-[11px] font-bold text-[#8B181B] bg-[#8B181B]/10 px-2 py-0.5 rounded-md">
                      {firm.count} alumni
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-stone-400 py-2">
                  Populated dynamically from verified alumni profiles.
                </div>
              )}
            </div>
          </div>

          {/* Corporate Placement Directives Card */}
          <div className="bg-[#8B181B] text-white rounded-2xl p-5 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-200">
              <Award className="w-4 h-4" />
              <span>Placement Directive</span>
            </div>
            <p className="text-xs text-stone-100 leading-relaxed">
              Employers offering paid internships or signing corporate memoranda of agreement (MOA) receive priority placement in the student & alumni bulletin.
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowCreateJobModal(true)}
                className="w-full py-2 bg-white text-[#8B181B] hover:bg-stone-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Draft Institutional Listing
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= MODAL: POST NEW OPPORTUNITY ================= */}
      {showCreateJobModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900">Post Institutional Opportunity</h2>
                <p className="text-xs text-stone-500">Publish a verified career listing directly to the alumni job board.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateJobModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJobSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Job Title *</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Junior Systems Analyst"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Hiring Organization *</label>
                  <input
                    type="text"
                    required
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    placeholder="e.g. Lexmark Research & Development"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Employment Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Location / Setup</label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Cebu City / Hybrid"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Salary / Stipend</label>
                  <input
                    type="text"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    placeholder="₱25,000 - ₱35,000 / mo"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Target College Program</label>
                <input
                  type="text"
                  value={newRequiredCourse}
                  onChange={(e) => setNewRequiredCourse(e.target.value)}
                  placeholder="e.g. BS Information Technology, BS Nursing, BSBA"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Role Description</label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Key responsibilities and day-to-day expectations..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Key Qualifications (One per line)</label>
                <textarea
                  rows={3}
                  value={newRequirements}
                  onChange={(e) => setNewRequirements(e.target.value)}
                  placeholder="Proficiency in React & TypeScript&#10;Good English communication&#10;Willing to work on-site in IT Park"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Application URL</label>
                  <input
                    type="url"
                    value={newApplicationUrl}
                    onChange={(e) => setNewApplicationUrl(e.target.value)}
                    placeholder="https://company.com/careers/apply"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    placeholder="recruitment@company.com"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#8B181B]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateJobModal(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-white bg-[#8B181B] hover:bg-[#721316] font-semibold shadow-sm cursor-pointer"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: REJECT JOB LISTING ================= */}
      {rejectingJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
              <AlertTriangle className="w-5 h-5" />
              <span>Reject Career Listing</span>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Please specify the audit reason for rejecting this job listing. The employer will receive constructive feedback to update their submission.
            </p>

            <div>
              <label className="text-xs font-semibold text-stone-700 block mb-1">Reason for Rejection</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-600"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100 text-xs">
              <button
                type="button"
                onClick={() => setRejectingJobId(null)}
                className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRejectJob}
                className="px-4 py-2 rounded-xl text-white bg-rose-700 hover:bg-rose-800 font-semibold cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: INSPECT OPPORTUNITY DETAILS ================= */}
      {inspectingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-lg w-full max-h-[85vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <div className="text-xs text-stone-500 font-medium">{inspectingJob.company}</div>
                <h2 className="text-lg font-bold text-stone-900">{inspectingJob.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setInspectingJob(null)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl">
                <div>
                  <span className="text-stone-400 block text-[11px]">Type</span>
                  <span className="font-semibold text-stone-800">{inspectingJob.type || 'Full-time'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">Compensation</span>
                  <span className="font-semibold text-stone-800">{inspectingJob.salaryOrStipend || 'Competitive'}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">Location</span>
                  <span className="font-semibold text-stone-800">{inspectingJob.location}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[11px]">Target Course</span>
                  <span className="font-semibold text-stone-800">{inspectingJob.requiredCourse || 'Any Field'}</span>
                </div>
              </div>

              {inspectingJob.description && (
                <div>
                  <h4 className="font-bold text-stone-800 mb-1">Description</h4>
                  <p className="text-stone-600 leading-relaxed whitespace-pre-wrap">{inspectingJob.description}</p>
                </div>
              )}

              {inspectingJob.requirements && inspectingJob.requirements.length > 0 && (
                <div>
                  <h4 className="font-bold text-stone-800 mb-1">Requirements</h4>
                  <ul className="list-disc pl-4 space-y-1 text-stone-600">
                    {inspectingJob.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {inspectingJob.contactEmail && (
                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-stone-500">
                  <span>Contact: {inspectingJob.contactEmail}</span>
                  {inspectingJob.applicationUrl && (
                    <a
                      href={inspectingJob.applicationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8B181B] font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <span>External Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingJob(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
