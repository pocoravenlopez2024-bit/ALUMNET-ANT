import React, { useState, useMemo } from 'react';
import {
  X,
  Users,
  Briefcase,
  Building2,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  Send,
  ExternalLink,
  Search,
  Filter,
  Phone,
  Mail,
  GraduationCap
} from 'lucide-react';
import { Opportunity, JobApplication, ApplicationStatus } from '../../types';
import { useAlumni } from '../../context/AlumniContext';

interface JobApplicantsTrackerModalProps {
  opportunity: Opportunity;
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_COLORS: Record<ApplicationStatus, { bg: string; text: string; border: string }> = {
  Applied: { bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-200' },
  Screening: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  Interview: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Offer: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Hired: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  Rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' }
};

export const JobApplicantsTrackerModal: React.FC<JobApplicantsTrackerModalProps> = ({
  opportunity,
  isOpen,
  onClose
}) => {
  const { jobApplications, updateApplicationStatus, setSelectedUserIdForModal } = useAlumni();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [newStatus, setNewStatus] = useState<ApplicationStatus>('Applied');
  const [statusNote, setStatusNote] = useState('');

  const applicantsForJob = useMemo(() => {
    return jobApplications.filter((app) => app.jobId === opportunity.id);
  }, [jobApplications, opportunity.id]);

  const filteredApplicants = useMemo(() => {
    return applicantsForJob.filter((app) => {
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        app.applicantName.toLowerCase().includes(q) ||
        (app.applicantCourse || '').toLowerCase().includes(q) ||
        (app.applicantEmail || '').toLowerCase().includes(q) ||
        (app.applicantSkills || []).some((s) => s.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [applicantsForJob, statusFilter, searchQuery]);

  if (!isOpen) return null;

  const handleOpenDetail = (app: JobApplication) => {
    setSelectedApp(app);
    setNewStatus(app.status);
    setStatusNote(app.statusNotes || '');
  };

  const handleUpdateStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    updateApplicationStatus(selectedApp.id, newStatus, statusNote);
    setSelectedApp({
      ...selectedApp,
      status: newStatus,
      statusNotes: statusNote
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-4xl my-8 overflow-hidden animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-stone-200">
                Applicant Tracking System (ATS)
              </span>
              <span className="text-xs text-stone-300 font-medium">
                {opportunity.company}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white mt-1 flex items-center gap-2">
              <span>{opportunity.title}</span>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {applicantsForJob.length} Total Candidates
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate by name, course, or skills..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg text-stone-700 w-full sm:w-auto font-medium"
            >
              <option value="all">All Statuses ({applicantsForJob.length})</option>
              <option value="Applied">Applied</option>
              <option value="Screening">Screening</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer</option>
              <option value="Hired">Hired</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Content Body: Split List & Selected Detail */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Candidates List */}
          <div className="md:col-span-5 border-r border-stone-200 overflow-y-auto p-3 space-y-2 bg-stone-50/40">
            {filteredApplicants.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs font-semibold text-stone-600">No applicants found</p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Candidates who apply via the portal will appear here in real time.
                </p>
              </div>
            ) : (
              filteredApplicants.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                const statusTheme = STATUS_COLORS[app.status] || STATUS_COLORS.Applied;

                return (
                  <div
                    key={app.id}
                    onClick={() => handleOpenDetail(app)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white border-blue-500 shadow-xs ring-1 ring-blue-500'
                        : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-xs text-stone-900">{app.applicantName}</h4>
                          {app.matchScore && (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              {app.matchScore}% Match
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          {app.applicantCourse} • Batch {app.applicantBatch || 'Alum'}
                        </p>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusTheme.bg} ${statusTheme.text} ${statusTheme.border}`}
                      >
                        {app.status}
                      </span>
                    </div>

                    {/* Quick Skills */}
                    {app.applicantSkills && app.applicantSkills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {app.applicantSkills.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-medium"
                          >
                            {s}
                          </span>
                        ))}
                        {app.applicantSkills.length > 3 && (
                          <span className="text-[9px] text-stone-400 font-medium">
                            +{app.applicantSkills.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Candidate Detail View */}
          <div className="md:col-span-7 overflow-y-auto p-5 bg-white">
            {selectedApp ? (
              <div className="space-y-5">
                {/* Candidate Banner */}
                <div className="flex items-start justify-between pb-3 border-b border-stone-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-stone-900">{selectedApp.applicantName}</h3>
                      <button
                        type="button"
                        onClick={() => setSelectedUserIdForModal(selectedApp.applicantUid)}
                        className="text-[11px] text-blue-600 hover:underline font-semibold flex items-center gap-1"
                      >
                        <span>View Alumni Profile</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mt-1">
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3.5 h-3.5 text-stone-400" />
                        {selectedApp.applicantCourse} (Batch {selectedApp.applicantBatch || 'N/A'})
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-stone-400" />
                        {selectedApp.applicantEmail}
                      </span>
                      {selectedApp.applicantPhone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-stone-400" />
                          {selectedApp.applicantPhone}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedApp.matchScore && (
                    <div className="text-right shrink-0">
                      <div className="text-lg font-black text-emerald-700">
                        {selectedApp.matchScore}%
                      </div>
                      <div className="text-[10px] text-emerald-800 font-semibold">
                        Automated Match
                      </div>
                    </div>
                  )}
                </div>

                {/* Match Breakdown Card */}
                {selectedApp.matchBreakdown && (
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-xs">
                    <div className="font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>System Match Breakdown</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-900">
                      <div>
                        • Course Requirement:{' '}
                        <strong>{selectedApp.matchBreakdown.courseMatch ? 'Matched' : 'Cross-Program'}</strong>
                      </div>
                      <div>
                        • Required Skills:{' '}
                        <strong>
                          {selectedApp.matchBreakdown.skillsMatchCount} of{' '}
                          {selectedApp.matchBreakdown.totalSkillsCount}
                        </strong>
                      </div>
                    </div>
                  </div>
                )}

                {/* Resume Box */}
                <div>
                  <h4 className="text-xs font-bold text-stone-900 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Attached Resume / Qualifications</span>
                  </h4>
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-stone-900">
                        {selectedApp.resumeFileName || 'Alumni_Resume.pdf'}
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {selectedApp.resumeSummary || 'Verified Cecilian candidate credentials.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => alert(`Simulated downloading ${selectedApp.resumeFileName || 'resume.pdf'}`)}
                      className="px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                    >
                      Download
                    </button>
                  </div>
                </div>

                {/* Portfolio / Website */}
                {selectedApp.portfolioUrl && (
                  <div>
                    <h4 className="text-xs font-bold text-stone-900 mb-1">Portfolio / Online Profiles</h4>
                    <a
                      href={selectedApp.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                    >
                      <span>{selectedApp.portfolioUrl}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                {/* Cover Letter */}
                <div>
                  <h4 className="text-xs font-bold text-stone-900 mb-1">Cover Letter</h4>
                  <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs text-stone-700 whitespace-pre-line leading-relaxed">
                    {selectedApp.coverLetter || 'No cover letter provided.'}
                  </div>
                </div>

                {/* Update Applicant Status Form */}
                <form
                  onSubmit={handleUpdateStatus}
                  className="bg-stone-50/80 border border-stone-200 rounded-xl p-4 space-y-3"
                >
                  <div className="font-bold text-xs text-stone-900 flex items-center justify-between">
                    <span>Manage Candidate Hiring Pipeline</span>
                    <span className="text-[10px] text-stone-500">Candidate receives live notification</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Stage / Status</label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as ApplicationStatus)}
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg font-medium"
                      >
                        <option value="Applied">Applied (Initial Review)</option>
                        <option value="Screening">Screening (Profile Evaluated)</option>
                        <option value="Interview">Interview Scheduled</option>
                        <option value="Offer">Job Offer Extended</option>
                        <option value="Hired">Hired (Candidate Accepted)</option>
                        <option value="Rejected">Declined / Not Selected</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-stone-700 block mb-1">Internal / Feedback Notes</label>
                      <input
                        type="text"
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        placeholder="e.g. Technical interview scheduled for Friday 2:00 PM"
                        className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      Update Candidate Status
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="text-center py-20 text-stone-400">
                <Users className="w-10 h-10 mx-auto mb-2 text-stone-300" />
                <p className="text-xs font-medium text-stone-600">Select an applicant to review details</p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Evaluate profile match scores, resumes, and progress through hiring stages.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
