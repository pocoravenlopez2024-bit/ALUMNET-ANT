import React, { useState, useMemo } from 'react';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Globe,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  AlertCircle,
  Check,
  X,
  FileText,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { UserProfile } from '../../types';

export const EmployerManagementModule: React.FC = () => {
  const {
    users,
    verifyEmployer,
    toggleEmployerJobPosting,
    opportunities,
    setSelectedUserIdForModal,
    showToast,
    renewEmployerAccount,
    isEmployerExpired
  } = useAlumni();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected' | 'renewal' | 'expired'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection modal state
  const [rejectingEmployer, setRejectingEmployer] = useState<UserProfile | null>(null);
  const [rejectNotes, setRejectNotes] = useState('Business registration documentation incomplete or could not be validated.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter all employer role accounts
  const allEmployers = useMemo(() => {
    return (users || []).filter((u) => u.role === 'employer');
  }, [users]);

  // Counts
  const pendingCount = useMemo(() => {
    return allEmployers.filter((u) => (u.employerVerificationStatus || 'pending_verification') === 'pending_verification').length;
  }, [allEmployers]);

  const verifiedCount = useMemo(() => {
    return allEmployers.filter((u) => u.employerVerificationStatus === 'verified').length;
  }, [allEmployers]);

  const rejectedCount = useMemo(() => {
    return allEmployers.filter((u) => u.employerVerificationStatus === 'rejected').length;
  }, [allEmployers]);

  const renewalCount = useMemo(() => {
    return allEmployers.filter((u) => u.employerStatus === 'pending_renewal' || u.employerRenewalRequested).length;
  }, [allEmployers]);

  const expiredCount = useMemo(() => {
    return allEmployers.filter((u) => isEmployerExpired(u)).length;
  }, [allEmployers, isEmployerExpired]);

  // Filtered employers list
  const filteredEmployers = useMemo(() => {
    return allEmployers.filter((emp) => {
      const currentStatus = emp.employerVerificationStatus || 'pending_verification';
      const isExpired = isEmployerExpired(emp);
      const isRenewal = emp.employerStatus === 'pending_renewal' || emp.employerRenewalRequested;

      if (statusFilter === 'pending' && currentStatus !== 'pending_verification') return false;
      if (statusFilter === 'verified' && currentStatus !== 'verified') return false;
      if (statusFilter === 'rejected' && currentStatus !== 'rejected') return false;
      if (statusFilter === 'renewal' && !isRenewal) return false;
      if (statusFilter === 'expired' && !isExpired) return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const cName = (emp.companyName || emp.name || '').toLowerCase();
        const cIndustry = (emp.companyIndustry || '').toLowerCase();
        const cEmail = (emp.email || '').toLowerCase();
        const cPerson = (emp.contactPerson || emp.name || '').toLowerCase();
        return (
          cName.includes(query) ||
          cIndustry.includes(query) ||
          cEmail.includes(query) ||
          cPerson.includes(query)
        );
      }
      return true;
    });
  }, [allEmployers, statusFilter, searchQuery, isEmployerExpired]);

  const handleApprove = (emp: UserProfile) => {
    verifyEmployer(emp.uid, true);
  };

  const handleOpenRejectModal = (emp: UserProfile) => {
    setRejectingEmployer(emp);
    setRejectNotes('Business registration credentials incomplete or could not be verified with SEC/DTI.');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingEmployer) return;
    setIsSubmitting(true);
    verifyEmployer(rejectingEmployer.uid, false, rejectNotes.trim());
    setIsSubmitting(false);
    setRejectingEmployer(null);
  };

  const handleToggleJobPosting = (emp: UserProfile) => {
    const nextState = !emp.canPostJobs;
    toggleEmployerJobPosting(emp.uid, nextState);
  };

  // Get job postings count for an employer
  const getJobPostingsCount = (uid: string) => {
    return (opportunities || []).filter((o) => o.postedBy === uid).length;
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Banner */}
      <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-6 rounded-2xl border border-stone-800 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 bg-red-950/80 text-red-400 border border-red-800/60 rounded-xl shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  Employer Partner & Company Accreditation Desk
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-900/60 text-red-200 border border-red-700/50">
                  Admin Authority
                </span>
              </div>
              <p className="text-xs text-stone-300 mt-1 max-w-2xl leading-relaxed">
                Review and moderate corporate employer partner registrations, grant institutional accreditation,
                and manage real-time job posting privileges to ensure legitimate career opportunities for St. Cecilia's College graduates.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right sm:border-l sm:border-stone-700 sm:pl-4">
              <div className="text-2xl font-black text-white">{pendingCount}</div>
              <div className="text-[11px] text-amber-400 font-semibold">Pending Accreditations</div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-5 pt-4 border-t border-stone-800 grid grid-cols-3 gap-3 text-center text-xs">
          <div className="bg-stone-800/50 p-2.5 rounded-xl border border-stone-700/60">
            <span className="text-stone-400 text-[10px] uppercase font-bold block">Total Employers</span>
            <span className="text-base font-bold text-white mt-0.5 block">{allEmployers.length}</span>
          </div>
          <div className="bg-stone-800/50 p-2.5 rounded-xl border border-stone-700/60">
            <span className="text-emerald-400 text-[10px] uppercase font-bold block">Accredited Active</span>
            <span className="text-base font-bold text-emerald-300 mt-0.5 block">{verifiedCount}</span>
          </div>
          <div className="bg-stone-800/50 p-2.5 rounded-xl border border-stone-700/60">
            <span className="text-rose-400 text-[10px] uppercase font-bold block">Declined / Revoked</span>
            <span className="text-base font-bold text-rose-300 mt-0.5 block">{rejectedCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            All Companies ({allEmployers.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('verified')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'verified'
                ? 'bg-emerald-700 text-white'
                : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Accredited ({verifiedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'rejected'
                ? 'bg-rose-700 text-white'
                : 'text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Declined ({rejectedCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('renewal')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'renewal'
                ? 'bg-blue-600 text-white'
                : 'text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Renewal Requests ({renewalCount})</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('expired')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              statusFilter === 'expired'
                ? 'bg-stone-800 text-white'
                : 'text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Expired ({expiredCount})</span>
          </button>
        </div>

        {/* Search Field */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, recruiter, or industry..."
            className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
          />
        </div>
      </div>

      {/* Employers List */}
      {filteredEmployers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-stone-800">No Employers Found</h4>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            {statusFilter !== 'all'
              ? `There are currently no employers matching the "${statusFilter}" status filter.`
              : 'No company registrations have been submitted yet.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredEmployers.map((emp) => {
            const status = emp.employerVerificationStatus || 'pending_verification';
            const isPending = status === 'pending_verification';
            const isVerified = status === 'verified';
            const isRejected = status === 'rejected';
            const isExpired = isEmployerExpired(emp);
            const isRenewalRequested = emp.employerStatus === 'pending_renewal' || emp.employerRenewalRequested;
            const expiryDate = emp.employerExpirationDate ? new Date(emp.employerExpirationDate) : null;
            const jobCount = getJobPostingsCount(emp.uid);

            return (
              <div
                key={emp.uid}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-2xs flex flex-col justify-between gap-4 ${
                  isPending
                    ? 'border-amber-300 ring-1 ring-amber-200/50 bg-amber-50/20'
                    : isRenewalRequested
                    ? 'border-blue-300 ring-1 ring-blue-200/50 bg-blue-50/10'
                    : isExpired
                    ? 'border-rose-200 bg-rose-50/10'
                    : isVerified
                    ? 'border-stone-200 hover:border-emerald-300'
                    : 'border-stone-200 opacity-80'
                }`}
              >
                {/* Header Information */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-stone-700 text-sm shrink-0">
                        {emp.photoUrl ? (
                          <img
                            src={emp.photoUrl}
                            alt={emp.companyName || emp.name}
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-stone-500" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-stone-900 leading-tight">
                          {emp.companyName || emp.name}
                        </h4>
                        <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-1 font-medium flex-wrap">
                          <span>{emp.companyIndustry || 'Corporate Partner'}</span>
                          {emp.companyAddress && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[180px]">{emp.companyAddress}</span>
                            </>
                          )}
                          {expiryDate && (
                            <>
                              <span>•</span>
                              <span className={isExpired ? 'text-rose-600 font-bold' : 'text-stone-500'}>
                                {isExpired ? 'Expired: ' : 'Exp: '}{expiryDate.toLocaleDateString()}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0 flex items-center gap-1.5 flex-wrap justify-end">
                      {isRenewalRequested && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                          <Sparkles className="w-3 h-3 text-blue-700" />
                          Renewal Req.
                        </span>
                      )}
                      {isExpired && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                          <Clock className="w-3 h-3 text-rose-700" />
                          Expired
                        </span>
                      )}
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-700" />
                          Pending Review
                        </span>
                      )}
                      {isVerified && !isExpired && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <ShieldCheck className="w-3 h-3 text-emerald-700" />
                          Accredited
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
                          <XCircle className="w-3 h-3 text-rose-700" />
                          Declined
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Company Bio & Registration Details */}
                  {emp.about && (
                    <p className="text-xs text-stone-600 mt-3 line-clamp-2 leading-relaxed bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      {emp.about}
                    </p>
                  )}

                  {/* Renewal Request Callout */}
                  {isRenewalRequested && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <span className="font-bold flex items-center gap-1.5 text-blue-900">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          Accreditation Renewal Requested
                        </span>
                        {emp.employerRenewalNotes && (
                          <p className="text-[11px] text-blue-800 mt-1">"{emp.employerRenewalNotes}"</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => renewEmployerAccount(emp.uid, 12)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shrink-0 transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Approve Renewal (+12 Mo)</span>
                      </button>
                    </div>
                  )}

                  {/* Contact details grid */}
                  <div className="mt-3 pt-3 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <Mail className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span className="truncate">{emp.email}</span>
                    </div>
                    {emp.contactPhone && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Phone className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{emp.contactPhone}</span>
                      </div>
                    )}
                    {emp.contactPerson && (
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-semibold text-stone-700">Contact:</span>
                        <span className="truncate">{emp.contactPerson}</span>
                      </div>
                    )}
                    {emp.companyWebsite && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Globe className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <a
                          href={emp.companyWebsite.startsWith('http') ? emp.companyWebsite : `https://${emp.companyWebsite}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline truncate"
                        >
                          {emp.companyWebsite.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Rejection Notes if any */}
                  {emp.employerVerificationNotes && isRejected && (
                    <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800">
                      <span className="font-bold">Declined Reason: </span>
                      {emp.employerVerificationNotes}
                    </div>
                  )}
                </div>

                {/* Bottom Actions & Job Posting Toggle Bar */}
                <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  {/* Job Posting Rights Toggle */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleJobPosting(emp)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        emp.canPostJobs
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-stone-100 text-stone-600 border border-stone-200 hover:bg-stone-200'
                      }`}
                      title="Click to toggle job posting authorization in Firestore"
                    >
                      {emp.canPostJobs ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Job Posting: Enabled</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5 text-stone-400" />
                          <span>Job Posting: Disabled</span>
                        </>
                      )}
                    </button>

                    <span className="text-[11px] text-stone-400 font-medium">
                      ({jobCount} active {jobCount === 1 ? 'posting' : 'postings'})
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2 shrink-0">
                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(emp)}
                          className="px-3 py-1.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-rose-50 hover:text-rose-700 rounded-xl transition-colors cursor-pointer"
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(emp)}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Accredit & Approve</span>
                        </button>
                      </>
                    ) : isVerified ? (
                      <>
                        <button
                          type="button"
                          onClick={() => renewEmployerAccount(emp.uid, 12)}
                          className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                          title="Extend accreditation by 12 months"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Renew +12 Mo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenRejectModal(emp)}
                          className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-rose-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                        >
                          Revoke Status
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedUserIdForModal(emp.uid)}
                          className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors cursor-pointer"
                        >
                          View Profile
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => renewEmployerAccount(emp.uid, 12)}
                          className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                          title="Restore and extend accreditation by 12 months"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span>Renew +12 Mo</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApprove(emp)}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Re-approve Company</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingEmployer && (
        <div
          id="employer-rejection-modal-overlay"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            id="employer-rejection-modal-container"
            className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 text-stone-900 my-auto animate-in fade-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900">
                    Decline Employer Accreditation
                  </h4>
                  <p className="text-xs text-stone-500">
                    {rejectingEmployer.companyName || rejectingEmployer.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRejectingEmployer(null)}
                className="text-stone-400 hover:text-stone-600 text-sm p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="mt-4 space-y-3.5">
              <p className="text-xs text-stone-600 leading-relaxed">
                Declining this application will set their status to <strong>Rejected</strong>, disable their
                job posting permissions in Firestore, and notify the company with the reason specified below.
              </p>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Reason for Non-Accreditation / Feedback *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Explain why the registration could not be verified (e.g. invalid SEC registration, missing corporate credentials, or non-matching contact info)..."
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingEmployer(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !rejectNotes.trim()}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Updating Status...' : 'Confirm Non-Accreditation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
