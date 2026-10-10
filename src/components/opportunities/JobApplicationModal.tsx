import React, { useState, useMemo } from 'react';
import {
  X,
  Briefcase,
  Building2,
  FileText,
  UploadCloud,
  CheckCircle2,
  Sparkles,
  Link2,
  Send,
  AlertCircle
} from 'lucide-react';
import { Opportunity } from '../../types';
import { useAlumni } from '../../context/AlumniContext';
import { validateUploadedFile, sanitizeFileName } from '../../lib/security';

interface JobApplicationModalProps {
  opportunity: Opportunity;
  isOpen: boolean;
  onClose: () => void;
}

export const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  opportunity,
  isOpen,
  onClose
}) => {
  const { currentUser, applyForJob } = useAlumni();

  const [applicantName, setApplicantName] = useState(currentUser?.name || '');
  const [applicantEmail, setApplicantEmail] = useState(currentUser?.email || '');
  const [applicantPhone, setApplicantPhone] = useState(currentUser?.phone || '+63 917 123 4567');
  const [applicantCourse, setApplicantCourse] = useState(currentUser?.course || 'BS Information Technology');
  const [applicantBatch, setApplicantBatch] = useState(currentUser?.batch || '2024');
  const [applicantLocation, setApplicantLocation] = useState(currentUser?.location || 'Cebu City, Philippines');
  const [skillsInput, setSkillsInput] = useState((currentUser?.skills || ['PHP', 'MySQL', 'JavaScript', 'HTML/CSS']).join(', '));
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState(
    `Dear ${opportunity.company} Hiring Team,\n\nI am writing to express my enthusiastic interest in the ${opportunity.title} role. As a proud graduate/student of St. Cecilia's College, my coursework in ${opportunity.requiredCourse || applicantCourse} and technical background closely align with your requirements.\n\nThank you for considering my application.`
  );
  const [resumeFileName, setResumeFileName] = useState(`${(currentUser?.name || 'Applicant').replace(/\s+/g, '_')}_Resume.pdf`);
  const [resumeSummary, setResumeSummary] = useState(
    currentUser?.about || 'Dedicated Cecilian alumnus with hands-on coursework and project experience.'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Compute live match score preview
  const matchInfo = useMemo(() => {
    const jobCourse = (opportunity.requiredCourse || '').toLowerCase();
    const myCourse = applicantCourse.toLowerCase();
    const courseMatch = jobCourse ? myCourse.includes(jobCourse) || jobCourse.includes(myCourse) || jobCourse.includes('all') : true;

    const jobSkills = opportunity.skills || [];
    const mySkillsList = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const matchedSkills = jobSkills.filter((js) =>
      mySkillsList.some((ms) => ms.toLowerCase().includes(js.toLowerCase()) || js.toLowerCase().includes(ms.toLowerCase()))
    );

    let score = 50;
    if (courseMatch) score += 25;
    if (jobSkills.length > 0) {
      score += Math.round((matchedSkills.length / jobSkills.length) * 20);
    } else {
      score += 20;
    }
    if ((opportunity.location || '').toLowerCase().includes('cebu') || (opportunity.location || '').toLowerCase().includes('remote')) {
      score += 5;
    }
    const finalScore = Math.min(Math.max(score, 45), 98);

    return {
      score: finalScore,
      courseMatch,
      matchedSkills,
      totalSkills: jobSkills.length
    };
  }, [opportunity, applicantCourse, skillsInput]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const val = await validateUploadedFile(file, 'documents');
        if (!val.valid) {
          alert(val.error || 'Invalid resume file format.');
          setIsUploading(false);
          return;
        }
        const safeName = sanitizeFileName(file.name);
        setResumeFileName(safeName);
        setResumeSummary(`Uploaded resume (${safeName}, ${(file.size / 1024).toFixed(1)} KB) - Security verified.`);
      } catch (err: any) {
        alert(err?.message || 'Failed to inspect uploaded file.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setSubmitting(true);

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const res = applyForJob({
      jobId: opportunity.id,
      jobTitle: opportunity.title,
      companyName: opportunity.company,
      applicantUid: currentUser.uid,
      applicantName,
      applicantEmail,
      applicantPhone,
      applicantCourse,
      applicantBatch,
      applicantSkills: skills,
      applicantLocation,
      portfolioUrl: portfolioUrl || undefined,
      resumeFileName,
      resumeSummary,
      coverLetter
    });

    setSubmitting(false);
    if (res.success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="bg-stone-900 text-white p-5 flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20 text-red-300">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-stone-200">
                  Direct Application
                </span>
                <span className="text-xs text-stone-300 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5" />
                  {opportunity.company}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white mt-1 leading-snug">
                {opportunity.title}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Automated Match Badge Banner */}
        <div className="bg-emerald-50/90 border-b border-emerald-100 p-3 px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-emerald-950">Automated Match Score: </span>
              <span className="font-extrabold text-emerald-700 text-sm">{matchInfo.score}% Compatible</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-emerald-800">
            <span>Course: {matchInfo.courseMatch ? '✅ Aligned' : '⚠️ Cross-disciplinary'}</span>
            <span>Skills: {matchInfo.matchedSkills.length}/{matchInfo.totalSkills || 1} matched</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Candidate Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="font-semibold text-stone-700 block mb-1">Full Legal Name *</label>
              <input
                type="text"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Contact Email *</label>
              <input
                type="email"
                required
                value={applicantEmail}
                onChange={(e) => setApplicantEmail(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Phone / Mobile *</label>
              <input
                type="text"
                required
                value={applicantPhone}
                onChange={(e) => setApplicantPhone(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Current Location</label>
              <input
                type="text"
                value={applicantLocation}
                onChange={(e) => setApplicantLocation(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Academic Degree / Course *</label>
              <input
                type="text"
                required
                value={applicantCourse}
                onChange={(e) => setApplicantCourse(e.target.value)}
                placeholder="e.g. BS Information Technology"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label className="font-semibold text-stone-700 block mb-1">Batch / Graduation Year</label>
              <input
                type="text"
                value={applicantBatch}
                onChange={(e) => setApplicantBatch(e.target.value)}
                placeholder="e.g. 2024"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Technical Skills */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-stone-700 text-xs">Relevant Skills & Technologies</label>
              {opportunity.skills && (
                <span className="text-[11px] text-stone-500">
                  Target: {opportunity.skills.join(', ')}
                </span>
              )}
            </div>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. PHP, Laravel, MySQL, JavaScript, React"
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          {/* Resume Upload Box */}
          <div className="border-2 border-dashed border-stone-200 rounded-xl p-4 bg-stone-50 hover:bg-stone-100/50 transition-colors">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-left">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-stone-900">{resumeFileName}</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-semibold">
                      PDF Ready
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">{resumeSummary}</p>
                </div>
              </div>

              <label className="px-3 py-2 bg-white hover:bg-stone-100 border border-stone-200 rounded-lg text-xs font-semibold text-stone-700 cursor-pointer shadow-2xs shrink-0 flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-stone-500" />
                <span>{isUploading ? 'Uploading...' : 'Replace Resume'}</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          </div>

          {/* Portfolio Link */}
          <div>
            <label className="font-semibold text-stone-700 text-xs block mb-1">
              Portfolio URL / GitHub / LinkedIn (Optional)
            </label>
            <div className="relative">
              <Link2 className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                placeholder="https://github.com/my-profile or https://portfolio.dev"
                className="w-full pl-8 pr-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Cover Letter */}
          <div>
            <label className="font-semibold text-stone-700 text-xs block mb-1">
              Cover Letter / Candidate Introduction *
            </label>
            <textarea
              required
              rows={4}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:bg-white leading-relaxed"
            />
          </div>

          {/* Terms info */}
          <div className="flex items-start gap-2 text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-200">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              By submitting, your verified student/alumni credentials from St. Cecilia's College will be transmitted to the hiring managers at {opportunity.company}.
            </span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto px-5 py-2.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Submitting...' : 'Submit Official Application'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
