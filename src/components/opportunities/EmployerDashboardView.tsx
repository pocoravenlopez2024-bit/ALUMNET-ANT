import React, { useState, useMemo } from 'react';
import {
  Building2,
  Briefcase,
  Plus,
  Users,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Globe,
  Mail,
  Phone,
  MapPin,
  FileText,
  Search,
  Filter,
  Eye,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award,
  ShieldCheck
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { Opportunity, JobApplication } from '../../types';
import { JobApplicantsTrackerModal } from './JobApplicantsTrackerModal';
import { EmployerDashboardSkeleton } from '../common/BentoSkeleton';

interface EmployerDashboardViewProps {
  onInitiateJobPost?: () => void;
}

export const EmployerDashboardView: React.FC<EmployerDashboardViewProps> = ({ onInitiateJobPost }) => {
  const {
    currentUser,
    opportunities,
    jobApplications,
    createOpportunity,
    showToast,
    setSelectedUserIdForModal,
    setActiveTab,
    isEmployerExpired,
    requestEmployerRenewal,
    isLoadingData
  } = useAlumni();

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<Opportunity | null>(null);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalNotes, setRenewalNotes] = useState('');

  if (isLoadingData) {
    return <EmployerDashboardSkeleton />;
  }

  // Job creation form states
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [jobType, setJobType] = useState<'Full-time' | 'Part-time' | 'Internship' | 'Contract'>('Full-time');
  const [workLocation, setWorkLocation] = useState(currentUser?.companyAddress || 'Cebu City, Philippines');
  const [description, setDescription] = useState('');
  const [salaryOrStipend, setSalaryOrStipend] = useState('');
  const [requiredCourse, setRequiredCourse] = useState('B.S. Information Technology');
  const [experienceLevel, setExperienceLevel] = useState<'Entry Level' | 'Mid Level' | 'Senior' | 'Lead' | 'Intern'>('Entry Level');
  const [skillsInput, setSkillsInput] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [howToApply, setHowToApply] = useState<'internal' | 'external' | 'both'>('internal');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || '');

  // Filter state for my jobs
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending_approval' | 'rejected'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter jobs posted by this employer
  const myOpportunities = useMemo(() => {
    if (!currentUser) return [];
    return opportunities.filter((o) => {
      // Check if posted by this user uid or matching company name
      return o.postedBy === currentUser.uid || (currentUser.companyName && o.company.toLowerCase() === currentUser.companyName.toLowerCase());
    });
  }, [opportunities, currentUser]);

  // Filtered by search/status
  const displayedOpportunities = useMemo(() => {
    return myOpportunities.filter((o) => {
      if (statusFilter !== 'all' && o.approvalStatus !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (o.title || '').toLowerCase().includes(q) || (o.location || '').toLowerCase().includes(q) || (o.requiredCourse || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [myOpportunities, statusFilter, searchQuery]);

  // Applications for this employer's jobs
  const myJobIds = useMemo(() => new Set(myOpportunities.map((o) => o.id)), [myOpportunities]);
  const receivedApplications = useMemo(() => {
    return jobApplications.filter((app) => myJobIds.has(app.jobId));
  }, [jobApplications, myJobIds]);

  const hiredCount = useMemo(() => {
    return receivedApplications.filter((a) => a.status === 'Hired').length;
  }, [receivedApplications]);

  const interviewCount = useMemo(() => {
    return receivedApplications.filter((a) => a.status === 'Interview').length;
  }, [receivedApplications]);

  // Protect route check
  if (!currentUser) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-2xs">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h3 className="text-base font-bold text-stone-900">Protected Employer Portal</h3>
        <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
          Please log in with an accredited employer account to view this corporate recruitment dashboard.
        </p>
      </div>
    );
  }

  // Determine employer properties
  const isEmployer = currentUser.role === 'employer';
  const isVerified = currentUser.employerVerificationStatus === 'verified';
  const isPending = (currentUser.employerVerificationStatus || 'pending_verification') === 'pending_verification';
  const isRejected = currentUser.employerVerificationStatus === 'rejected';
  
  // Expiration & Renewal Logic
  const isExpired = isEmployerExpired(currentUser);
  const expiryDate = currentUser.employerExpirationDate
    ? new Date(currentUser.employerExpirationDate)
    : currentUser.createdAt
    ? new Date(new Date(currentUser.createdAt).getTime() + 365 * 86400000)
    : null;
  const daysUntilExpiry = expiryDate ? Math.ceil((expiryDate.getTime() - Date.now()) / (86400000)) : null;
  const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  const isRenewalPending = currentUser.employerStatus === 'pending_renewal' || currentUser.employerRenewalRequested;

  // Job posting permission: Requires active accreditation and unexpired status
  const canPost = (currentUser.canPostJobs ?? isVerified) && !isExpired && !isPending && !isRejected;

  const handleOpenPostModal = () => {
    if (onInitiateJobPost) {
      onInitiateJobPost();
      return;
    }
    if (!canPost) {
      showToast('Your company accreditation is pending review. Job posting will be enabled upon administrator approval.', 'info');
      return;
    }
    setShowCreateModal(true);
  };

  const handleCreateJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Please fill in required job title and description.', 'error');
      return;
    }

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    createOpportunity({
      title: title.trim(),
      company: currentUser.companyName || currentUser.name,
      location: workLocation.trim(),
      type: jobType,
      description: description.trim(),
      salaryOrStipend: salaryOrStipend.trim() || undefined,
      requiredCourse: requiredCourse.trim(),
      skills: skills.length > 0 ? skills : ['General Competencies', 'Communication'],
      experienceLevel,
      applicationDeadline: applicationDeadline || undefined,
      howToApply,
      contactEmail: contactEmail.trim() || currentUser.email
    });

    showToast('Job listing submitted! Awaiting Alumni Office moderation before going live.', 'success');
    setShowCreateModal(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    // Reset form
    setTitle('');
    setDescription('');
    setSkillsInput('');
    setSalaryOrStipend('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Company Header Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-stone-100 border border-stone-200 flex items-center justify-center font-bold text-xl text-stone-700 shrink-0 overflow-hidden shadow-2xs">
              {currentUser.profilePictureUrl || (currentUser as any).photoUrl ? (
                <img
                  src={currentUser.profilePictureUrl || (currentUser as any).photoUrl}
                  alt={currentUser.companyName || currentUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Building2 className="w-8 h-8 text-stone-500" />
              )}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  {currentUser.companyName || currentUser.name}
                </h2>
                {isVerified && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    Accredited Partner
                  </span>
                )}
                {isPending && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    <Clock className="w-3.5 h-3.5 text-amber-700" />
                    Accreditation Pending
                  </span>
                )}
                {isRejected && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300">
                    <XCircle className="w-3.5 h-3.5 text-rose-700" />
                    Application Declined
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-stone-500 mt-1 flex flex-wrap items-center gap-3">
                <span className="font-semibold text-stone-700">
                  {currentUser.companyIndustry || 'Corporate Partner'}
                </span>
                {currentUser.companyAddress && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    {currentUser.companyAddress}
                  </span>
                )}
                {currentUser.companyWebsite && (
                  <a
                    href={currentUser.companyWebsite.startsWith('http') ? currentUser.companyWebsite : `https://${currentUser.companyWebsite}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Visit Website
                  </a>
                )}
              </p>
            </div>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleOpenPostModal}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer ${
                canPost
                  ? 'bg-[#991B1B] hover:bg-[#7F1D1D] text-white'
                  : 'bg-stone-200 text-stone-500 hover:bg-stone-300 cursor-not-allowed'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Post New Career Opportunity</span>
            </button>
          </div>
        </div>

        {/* Accreditation Advisory Banner if not verified */}
        {!isVerified && (
          <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <h4 className="font-bold text-amber-950">
                {isPending ? 'Company Accreditation in Progress' : 'Accreditation Notice'}
              </h4>
              <p className="mt-0.5 text-amber-900/90">
                {isPending
                  ? 'The St. Cecilia’s College Alumni Career Services Desk is currently reviewing your company registration. Once institutional accreditation is granted by administrators, your job posting privileges will be activated and your listings will appear to qualified alumni.'
                  : currentUser.employerVerificationNotes || 'Your employer registration requires document updates. Please contact the Alumni Placement Office.'}
              </p>
            </div>
          </div>
        )}

        {/* Accreditation Expiry & Renewal Alerts for Accredited Employers */}
        {isVerified && (
          <>
            {isRenewalPending ? (
              <div className="mt-5 p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <h4 className="font-bold text-blue-950">Accreditation Renewal Under Review</h4>
                    <p className="mt-0.5 text-blue-800">
                      Your institutional partner renewal request has been submitted to University Career Services. Administrator confirmation will extend your accreditation for an additional 12 months.
                    </p>
                    {currentUser.employerRenewalNotes && (
                      <p className="mt-1.5 text-[11px] text-blue-950 bg-blue-100/60 p-2 rounded-lg border border-blue-200">
                        <span className="font-bold">Submitted Notes: </span>{currentUser.employerRenewalNotes}
                      </p>
                    )}
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-200/70 text-blue-900 rounded-lg shrink-0">
                  Pending Review
                </span>
              </div>
            ) : isExpired ? (
              <div className="mt-5 p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <h4 className="font-bold text-rose-900">Partner Accreditation Expired</h4>
                    <p className="mt-0.5 text-rose-800">
                      Your annual corporate partner accreditation expired on {expiryDate ? expiryDate.toLocaleDateString() : 'recent date'}. Job posting privileges and applicant outreach are temporarily paused until renewal is completed.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-auto"
                >
                  Request Accreditation Renewal
                </button>
              </div>
            ) : isExpiringSoon ? (
              <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed">
                    <h4 className="font-bold text-amber-900">
                      Accreditation Renewal Notice ({daysUntilExpiry} Days Remaining)
                    </h4>
                    <p className="mt-0.5 text-amber-800">
                      Your corporate partner accreditation is valid through {expiryDate?.toLocaleDateString()}. Request an early renewal to ensure uninterrupted access for recruitment and campus placement.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(true)}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer self-start sm:self-auto"
                >
                  Renew Credentials
                </button>
              </div>
            ) : expiryDate ? (
              <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs text-stone-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Accreditation Active & Valid through <strong>{expiryDate.toLocaleDateString()}</strong> ({daysUntilExpiry} days remaining)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(true)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                >
                  Request Early Extension
                </button>
              </div>
            ) : null}
          </>
        )}

        {/* Overview Metrics Cards */}
        <div className="mt-6 pt-5 border-t border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/70">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Active Postings
            </span>
            <span className="text-2xl font-black text-stone-900 mt-1 block">
              {myOpportunities.length}
            </span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/70">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Total Applicants
            </span>
            <span className="text-2xl font-black text-blue-700 mt-1 block">
              {receivedApplications.length}
            </span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/70">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              In Interview Stage
            </span>
            <span className="text-2xl font-black text-amber-700 mt-1 block">
              {interviewCount}
            </span>
          </div>

          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/70">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
              Hired Cecilians
            </span>
            <span className="text-2xl font-black text-emerald-700 mt-1 block">
              {hiredCount}
            </span>
          </div>
        </div>
      </div>

      {/* Main Job Postings Management Section */}
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Status Tabs */}
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
              All Jobs ({myOpportunities.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('approved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'approved'
                  ? 'bg-emerald-700 text-white'
                  : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              Live ({myOpportunities.filter((o) => o.approvalStatus === 'approved').length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('pending_approval')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                statusFilter === 'pending_approval'
                  ? 'bg-amber-600 text-white'
                  : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              Pending Approval ({myOpportunities.filter((o) => o.approvalStatus === 'pending_approval').length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your postings..."
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>
        </div>

        {/* Postings List */}
        {displayedOpportunities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-2xs">
            <Briefcase className="w-12 h-12 text-stone-400 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-stone-900">No Job Postings Found</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              {myOpportunities.length === 0
                ? 'Your company has not posted any career opportunities yet. Initiate your first posting above to attract Cecilian talent.'
                : 'No postings match the selected filter criteria.'}
            </p>
            {canPost && myOpportunities.length === 0 && (
              <button
                type="button"
                onClick={handleOpenPostModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Post First Job Opening</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedOpportunities.map((job) => {
              const applicantsForJob = jobApplications.filter((a) => a.jobId === job.id);
              const isApproved = job.approvalStatus === 'approved';
              const isPendingAppr = job.approvalStatus === 'pending_approval';

              return (
                <div
                  key={job.id}
                  className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-stone-300"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isPendingAppr
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {job.approvalStatus ? job.approvalStatus.replace('_', ' ') : 'Live'}
                      </span>
                      <h4 className="text-sm font-bold text-stone-900">{job.title}</h4>
                      <span className="text-xs text-stone-500 font-medium">
                        • {job.type} • {job.experienceLevel || 'Entry Level'}
                      </span>
                    </div>

                    <p className="text-xs text-stone-600 flex flex-wrap items-center gap-3">
                      <span>{job.location}</span>
                      <span>•</span>
                      <span>Target: {job.requiredCourse || 'Open to All Programs'}</span>
                      {job.salaryOrStipend && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-emerald-700">{job.salaryOrStipend}</span>
                        </>
                      )}
                    </p>

                    {job.rejectionReason && (
                      <p className="text-xs text-rose-800 bg-rose-50 p-2.5 rounded-xl border border-rose-200 mt-2">
                        <strong>Admin Feedback:</strong> {job.rejectionReason}
                      </p>
                    )}
                  </div>

                  {/* Applicants CTA */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedJobForApplicants(job)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Review Applicants ({applicantsForJob.length})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Applicant Tracking Modal */}
      {selectedJobForApplicants && (
        <JobApplicantsTrackerModal
          opportunity={selectedJobForApplicants}
          isOpen={true}
          onClose={() => setSelectedJobForApplicants(null)}
        />
      )}

      {/* Job Creation Modal */}
      {showCreateModal && (
        <div
          id="employer-create-job-modal-overlay"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            id="employer-create-job-modal-container"
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 text-stone-900 my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#991B1B]" />
                <h3 className="font-bold text-base text-stone-900">
                  Post New Opportunity for Cecilians
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-600 text-sm p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateJobSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-stone-700 block mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Junior Software Engineer, Marketing Associate"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Employment Type *</label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Target Degree / Program</label>
                  <select
                    value={requiredCourse}
                    onChange={(e) => setRequiredCourse(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  >
                    <option value="B.S. Information Technology">B.S. Information Technology</option>
                    <option value="B.S. Computer Engineering">B.S. Computer Engineering</option>
                    <option value="B.S. Business Administration">B.S. Business Administration</option>
                    <option value="B.S. Hospitality Management">B.S. Hospitality Management</option>
                    <option value="B.S. Criminology">B.S. Criminology</option>
                    <option value="Bachelor of Elementary Education">Bachelor of Elementary Education</option>
                    <option value="Bachelor of Secondary Education">Bachelor of Secondary Education</option>
                    <option value="All Degree Programs">All Degree Programs</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Location / Setup</label>
                  <input
                    type="text"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    placeholder="e.g. Cebu IT Park (Hybrid) / Remote"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Salary / Compensation</label>
                  <input
                    type="text"
                    value={salaryOrStipend}
                    onChange={(e) => setSalaryOrStipend(e.target.value)}
                    placeholder="e.g. ₱25,000 - ₱35,000 / month"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Job Description & Responsibilities *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Outline core responsibilities, team structure, and growth opportunities for graduates..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div>
                <label className="font-bold text-stone-700 block mb-1">Required Skills (Comma-separated)</label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g. React, TypeScript, Node.js, SQL"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-stone-700 block mb-1">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-700 block mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={applicationDeadline}
                    onChange={(e) => setApplicationDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              {/* Sticky action footer */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-1 -mx-6 -mb-6 px-6 border-t border-stone-200 flex items-center justify-end gap-2 shadow-xs z-10">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[#991B1B] hover:bg-[#7F1D1D] rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ACCREDITATION RENEWAL REQUEST MODAL */}
      {showRenewalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">Request Accreditation Renewal</h3>
                  <p className="text-xs text-stone-500 mt-0.5">Extend institutional partnership for 12 months</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRenewalModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="p-3 bg-stone-50 rounded-xl text-xs text-stone-600 border border-stone-200/80">
                <p>
                  Accreditation renewals are verified by the <strong>St. Cecilia’s College Alumni Career Services Desk</strong>. Approval extends your corporate recruiting privileges and candidate outreach for an additional 12-month period.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Renewal Notes & Compliance Information (Optional)
                </label>
                <textarea
                  value={renewalNotes}
                  onChange={(e) => setRenewalNotes(e.target.value)}
                  placeholder="e.g., Updated business permits submitted, requested continuation of engineering and IT hiring partnership..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991B1B]"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRenewalModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    requestEmployerRenewal(renewalNotes.trim() || 'Standard annual partner renewal requested.');
                    setShowRenewalModal(false);
                    setRenewalNotes('');
                  }}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#991B1B] hover:bg-[#7F1D1D] rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Submit Renewal Request
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
