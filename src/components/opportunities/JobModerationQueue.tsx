import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  DollarSign,
  GraduationCap,
  Calendar,
  Briefcase,
  ShieldCheck,
  Check,
  X,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { Opportunity } from '../../types';

export const JobModerationQueue: React.FC = () => {
  const {
    opportunities,
    approveOpportunity,
    rejectOpportunity,
    users,
    verifyEmployer
  } = useAlumni();

  const [rejectingJobId, setRejectingJobId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('Incomplete job qualifications or compensation details.');

  // Pending opportunities
  const pendingJobs = opportunities.filter((o) => o.approvalStatus === 'pending_approval');
  // Pending employer partner accreditation requests
  const pendingEmployers = users.filter(
    (u) => u.role === 'employer' && u.employerVerificationStatus === 'pending_verification'
  );

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingJobId) return;
    rejectOpportunity(rejectingJobId, rejectReason);
    setRejectingJobId(null);
    setRejectReason('Incomplete job qualifications or compensation details.');
  };

  return (
    <div className="space-y-6">
      {/* Moderation Banner */}
      <div className="bg-amber-50/80 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-amber-950">
            Alumni Career Office • Job Post & Employer Moderation Desk
          </h3>
          <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">
            Protect Cecilian graduates by reviewing company legitimacy, ensuring reasonable compensation rates, and verifying relevance to college programs before postings go live.
          </p>
        </div>
      </div>

      {/* Pending Employer Accreditations */}
      {pendingEmployers.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              <h4 className="text-sm font-bold text-stone-900">
                Pending Employer Company Accreditations ({pendingEmployers.length})
              </h4>
            </div>
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
              Requires Admin Verification
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingEmployers.map((emp) => (
              <div
                key={emp.uid}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h5 className="font-bold text-xs text-stone-900">
                        {emp.companyName || emp.name}
                      </h5>
                      <p className="text-[11px] text-stone-500">{emp.companyIndustry || 'Industry Partner'}</p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Unverified
                    </span>
                  </div>

                  <p className="text-xs text-stone-600 mt-2 line-clamp-2">
                    {emp.about || 'Company submitted accreditation registration to hire Cecilian graduates.'}
                  </p>

                  <div className="mt-2 text-[11px] text-stone-500 space-y-0.5">
                    <div>Contact: {emp.contactPerson || emp.name} ({emp.email})</div>
                    {emp.companyWebsite && <div>Web: {emp.companyWebsite}</div>}
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-200 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => verifyEmployer(emp.uid, false, 'Accreditation documents incomplete')}
                    className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => verifyEmployer(emp.uid, true)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Company</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending Job Postings Queue */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-stone-900 flex items-center gap-2">
            <span>Job Postings Awaiting Approval</span>
            <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-900 rounded-full">
              {pendingJobs.length} Pending
            </span>
          </h4>
        </div>

        {pendingJobs.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center shadow-2xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-stone-800">Moderation Queue Clear</p>
            <p className="text-xs text-stone-500 mt-1">
              All submitted job opportunities have been verified and approved or resolved.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-amber-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      Pending Approval
                    </span>
                    <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded">
                      {job.type}
                    </span>
                    <span className="text-xs text-stone-500 font-medium">
                      Submitted {new Date(job.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-stone-900">{job.title}</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-stone-600 font-medium">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-stone-400" />
                      <span>{job.company}</span>
                    </div>
                    {job.salaryOrStipend && (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{job.salaryOrStipend}</span>
                      </div>
                    )}
                    {job.requiredCourse && (
                      <div className="flex items-center gap-1.5 text-blue-700">
                        <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
                        <span>{job.requiredCourse}</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed line-clamp-2">
                    {job.description}
                  </p>

                  {/* Skills tags */}
                  {job.skills && job.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {job.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-stone-100 text-stone-700 text-[10px] font-medium rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Moderation Checklist Criteria */}
                  <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-stone-500">
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Company Legitimate
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Salary Standard
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Target Course Relevant
                    </span>
                  </div>
                </div>

                {/* Moderation Actions */}
                <div className="flex items-center gap-2 shrink-0 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 justify-end">
                  <button
                    type="button"
                    onClick={() => setRejectingJobId(job.id)}
                    className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => approveOpportunity(job.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Publish Live</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rejection Modal with Feedback */}
      {rejectingJobId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-md p-5 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-bold text-stone-900 mb-2">
              Reject Opportunity Posting
            </h3>
            <p className="text-xs text-stone-500 mb-4 leading-relaxed">
              Provide constructive feedback to the employer or alumnus so they can amend and resubmit their listing.
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Reason for Rejection *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingJobId(null)}
                  className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-2xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
