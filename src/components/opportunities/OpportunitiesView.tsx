import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  Plus,
  Search,
  ExternalLink,
  Calendar,
  CheckCircle2,
  Mail,
  Filter,
  Sparkles,
  Users,
  Clock,
  ShieldCheck,
  Share2,
  GraduationCap,
  ChevronRight,
  AlertCircle,
  FileCheck,
  Send,
  Check,
  Tag,
  X,
  Award,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { Opportunity } from '../../types';
import { JobApplicationModal } from './JobApplicationModal';
import { JobApplicantsTrackerModal } from './JobApplicantsTrackerModal';
import { JobModerationQueue } from './JobModerationQueue';
import { ShareModal, ShareItem } from '../common/ShareModal';
import { ConfirmationModal } from '../common/ConfirmationModal';

export const OpportunitiesView: React.FC = () => {
  const {
    currentUser,
    opportunities,
    createOpportunity,
    setSelectedUserIdForModal,
    permissions,
    jobApplications,
    withdrawJobApplication
  } = useAlumni();

  const [applicationToWithdraw, setApplicationToWithdraw] = useState<{ id: string; jobTitle: string; companyName: string } | null>(null);

  // Navigation sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'explore' | 'my_applications' | 'employer_portal' | 'admin_moderation'>('explore');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string>('all');
  const [matchOnly, setMatchOnly] = useState(false);
  const [filterByMySkills, setFilterByMySkills] = useState(false);
  const [selectedSkillTag, setSelectedSkillTag] = useState<string>('all');

  // Verified skills from current user profile
  const userVerifiedSkills = useMemo(() => {
    return (currentUser?.skills || []).filter((s) => Boolean(s && s.trim()));
  }, [currentUser?.skills]);

  // Unique list of all skills across published opportunities
  const availableJobSkills = useMemo(() => {
    const skillSet = new Set<string>();
    opportunities.forEach((opp) => {
      if (!opp.approvalStatus || opp.approvalStatus === 'approved') {
        (opp.skills || []).forEach((s) => {
          if (s && s.trim()) skillSet.add(s.trim());
        });
      }
    });
    return Array.from(skillSet).sort((a, b) => a.localeCompare(b));
  }, [opportunities]);

  // Job count for each user verified skill
  const userSkillMatchCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    userVerifiedSkills.forEach((skill) => {
      const lower = skill.toLowerCase();
      counts[skill] = opportunities.filter((o) => {
        if (o.approvalStatus && o.approvalStatus !== 'approved') return false;
        return (o.skills || []).some((s) => s.toLowerCase().includes(lower) || lower.includes(s.toLowerCase()));
      }).length;
    });
    return counts;
  }, [opportunities, userVerifiedSkills]);

  // Modals state
  const [showPostModal, setShowPostModal] = useState(false);
  const [selectedOpportunityForModal, setSelectedOpportunityForModal] = useState<Opportunity | null>(null);
  const [applyingOpportunity, setApplyingOpportunity] = useState<Opportunity | null>(null);
  const [trackingOpportunity, setTrackingOpportunity] = useState<Opportunity | null>(null);
  const [shareItem, setShareItem] = useState<ShareItem | null>(null);
  const [expandedJobIds, setExpandedJobIds] = useState<Record<string, boolean>>({});

  const toggleJobExpand = (id: string) => {
    setExpandedJobIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Post Job Form State
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState(currentUser?.role === 'employer' && currentUser?.companyName ? currentUser.companyName : '');
  const [location, setLocation] = useState('Cebu City, Philippines');
  const [type, setType] = useState<Opportunity['type']>('Full-time');
  const [salaryOrStipend, setSalaryOrStipend] = useState('₱25,000 – ₱35,000 / month');
  const [requiredCourse, setRequiredCourse] = useState('BS Information Technology');
  const [skillsInput, setSkillsInput] = useState('PHP, Laravel, MySQL, JavaScript');
  const [experienceLevel, setExperienceLevel] = useState('0–2 years');
  const [applicationDeadline, setApplicationDeadline] = useState('2026-10-31');
  const [howToApply, setHowToApply] = useState<'internal' | 'external' | 'both'>('both');
  const [contactEmail, setContactEmail] = useState(currentUser?.email || 'careers@company.com');
  const [description, setDescription] = useState('');

  // Pending count for badge
  const pendingCount = useMemo(() => {
    return opportunities.filter((o) => o.approvalStatus === 'pending_approval').length;
  }, [opportunities]);

  // My Applications count
  const myApplications = useMemo(() => {
    if (!currentUser) return [];
    return jobApplications.filter((a) => a.applicantUid === currentUser.uid);
  }, [jobApplications, currentUser]);

  // My Job Postings (for employers/posters)
  const myPostings = useMemo(() => {
    if (!currentUser) return [];
    return opportunities.filter((o) => o.postedBy === currentUser.uid);
  }, [opportunities, currentUser]);

  // Helper to compute match score between logged-in user & an opportunity
  const computeUserMatch = (opp: Opportunity) => {
    if (!currentUser) return null;
    const reqCourse = (opp.requiredCourse || '').toLowerCase();
    const userCourse = (currentUser.course || '').toLowerCase();
    const courseMatched = reqCourse ? userCourse.includes(reqCourse) || reqCourse.includes(userCourse) || reqCourse.includes('all') : true;

    const oppSkills = opp.skills || [];
    const userSkills = currentUser.skills || [];
    const matchedSkills = oppSkills.filter((s) =>
      userSkills.some((us) => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase()))
    );

    let score = 50;
    if (courseMatched) score += 25;
    if (oppSkills.length > 0) {
      score += Math.round((matchedSkills.length / oppSkills.length) * 20);
    } else {
      score += 20;
    }
    if ((opp.location || '').toLowerCase().includes('cebu') || (opp.location || '').toLowerCase().includes('remote')) {
      score += 5;
    }
    const finalScore = Math.min(Math.max(score, 45), 98);

    return {
      score: finalScore,
      courseMatched,
      matchedSkillsCount: matchedSkills.length,
      totalSkills: oppSkills.length,
      isHighMatch: finalScore >= 80
    };
  };

  // Filtered approved opportunities for public Explore tab
  const publishedOpportunities = useMemo(() => {
    return opportunities.filter((opp) => {
      // Must be approved to appear in explore
      if (opp.approvalStatus && opp.approvalStatus !== 'approved') return false;

      const q = searchQuery.toLowerCase();
      const matchesSearch =
        opp.title.toLowerCase().includes(q) ||
        opp.company.toLowerCase().includes(q) ||
        opp.location.toLowerCase().includes(q) ||
        opp.description.toLowerCase().includes(q) ||
        (opp.requiredCourse || '').toLowerCase().includes(q) ||
        (opp.skills || []).some((s) => s.toLowerCase().includes(q));

      const matchesType = selectedType === 'all' || opp.type === selectedType;
      const matchesCourse =
        selectedCourseFilter === 'all' ||
        (opp.requiredCourse || '').toLowerCase().includes(selectedCourseFilter.toLowerCase());

      // Skills-based filter: match at least one verified profile skill
      if (filterByMySkills) {
        if (userVerifiedSkills.length > 0) {
          const oppSkills = opp.skills || [];
          const hasMatchingSkill = oppSkills.some((os) =>
            userVerifiedSkills.some(
              (us) => us.toLowerCase().includes(os.toLowerCase()) || os.toLowerCase().includes(us.toLowerCase())
            )
          );
          if (!hasMatchingSkill) return false;
        }
      }

      // Filter by specific selected skill tag
      if (selectedSkillTag !== 'all') {
        const target = selectedSkillTag.toLowerCase();
        const oppSkills = opp.skills || [];
        const matchesTag = oppSkills.some(
          (s) => s.toLowerCase().includes(target) || target.includes(s.toLowerCase())
        );
        if (!matchesTag) return false;
      }

      if (matchOnly) {
        const match = computeUserMatch(opp);
        if (!match || match.score < 75) return false;
      }

      return matchesSearch && matchesType && matchesCourse;
    });
  }, [
    opportunities,
    searchQuery,
    selectedType,
    selectedCourseFilter,
    matchOnly,
    filterByMySkills,
    selectedSkillTag,
    userVerifiedSkills,
    currentUser
  ]);

  const handleOpenPostModal = () => {
    if (currentUser?.role === 'employer' && currentUser?.companyName) {
      setCompany(currentUser.companyName);
    }
    setShowPostModal(true);
  };

  const handlePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !company || !description) return;

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    createOpportunity({
      title,
      company,
      location: location || 'Cebu City, Philippines',
      type,
      description,
      salaryOrStipend: salaryOrStipend || undefined,
      requiredCourse,
      skills: skills.length > 0 ? skills : ['PHP', 'Laravel', 'MySQL'],
      experienceLevel,
      applicationDeadline,
      howToApply,
      contactEmail: contactEmail || currentUser?.email || 'careers@company.com'
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setShowPostModal(false);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };


  // Spotlight job for Bento hero spotlight
  const spotlightJob = useMemo(() => {
    if (publishedOpportunities.length === 0) return null;
    const sorted = [...publishedOpportunities].sort((a, b) => {
      const ma = computeUserMatch(a)?.score || 0;
      const mb = computeUserMatch(b)?.score || 0;
      if (mb !== ma) return mb - ma;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
    return sorted[0];
  }, [publishedOpportunities, currentUser]);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Institutional Header */}
      <div className="bg-white rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#8B181B] via-[#991B1B] to-[#B45309]" />

        <div className="p-5 sm:p-6 lg:p-7">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-1.5 max-w-3xl">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
                <span className="text-[#8B181B] font-bold">St. Cecilia's College - Cebu, Inc.</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span>Career & Professional Development Registry</span>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="text-stone-400">Minglanilla Campus</span>
              </div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-stone-900 tracking-tight">
                Cecilian Career Registry & Job Board
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-2xl">
                Curated employment opportunities, enterprise partnerships, internships, and verified alumni hiring initiatives with accredited industry employers.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              {permissions.canPostJobs && (
                <button
                  type="button"
                  onClick={handleOpenPostModal}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-98 cursor-pointer w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 stroke-[2.2]" />
                  <span>Post Opportunity</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="px-5 sm:px-6 lg:px-7 py-3 bg-stone-50/70 border-t border-stone-100 flex items-center gap-2 overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveSubTab('explore')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeSubTab === 'explore'
                ? 'bg-stone-900 text-white shadow-2xs'
                : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Explore Jobs ({publishedOpportunities.length})</span>
          </button>

          {currentUser && (
            <button
              type="button"
              onClick={() => setActiveSubTab('my_applications')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeSubTab === 'my_applications'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>My Applications</span>
              {myApplications.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 text-blue-800 font-extrabold">
                  {myApplications.length}
                </span>
              )}
            </button>
          )}

          {(currentUser?.role === 'employer' || myPostings.length > 0) && (
            <button
              type="button"
              onClick={() => setActiveSubTab('employer_portal')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeSubTab === 'employer_portal'
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Employer ATS Pipeline</span>
              {myPostings.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-stone-200 text-stone-800 font-extrabold">
                  {myPostings.length}
                </span>
              )}
            </button>
          )}

          {permissions.canManageJobModeration && (
            <button
              type="button"
              onClick={() => setActiveSubTab('admin_moderation')}
              className={`px-3.5 py-2 rounded-xl font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                activeSubTab === 'admin_moderation'
                  ? 'bg-[#8B181B] text-white shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Approval Desk</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-200 text-amber-900 font-extrabold animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>


      {/* VIEW: EXPLORE JOBS */}
      {activeSubTab === 'explore' && (
        <div className="space-y-5">
          {/* Flagship Career Placement Spotlight Bento Card */}
          {spotlightJob && !searchQuery && selectedType === 'all' && selectedCourseFilter === 'all' && selectedSkillTag === 'all' && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-2xl bg-white border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] p-5 sm:p-6 lg:p-7 group"
            >
              <div className="h-1.5 w-full absolute top-0 left-0 bg-gradient-to-r from-[#8B181B] via-[#B45309] to-[#8B181B]" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-14 h-14 rounded-2xl bg-[#8B181B] text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
                    {spotlightJob.company.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-1">
                      <span className="text-[#8B181B] flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        Flagship Opportunity
                      </span>
                      <span aria-hidden="true" className="text-stone-300">·</span>
                      <span>{spotlightJob.type}</span>
                      {spotlightJob.requiredCourse && (
                        <>
                          <span aria-hidden="true" className="text-stone-300">·</span>
                          <span className="text-stone-600">{spotlightJob.requiredCourse}</span>
                        </>
                      )}
                    </div>

                    <h2
                      onClick={() => setSelectedOpportunityForModal(spotlightJob)}
                      className="text-lg sm:text-xl font-bold text-stone-900 group-hover:text-[#8B181B] transition-colors cursor-pointer"
                    >
                      {spotlightJob.title}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 mt-1">
                      <span className="font-semibold text-stone-800">{spotlightJob.company}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-stone-500">
                        <MapPin className="w-3.5 h-3.5 text-stone-400" />
                        {spotlightJob.location}
                      </span>
                      {spotlightJob.salaryOrStipend && (
                        <>
                          <span>•</span>
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                            {spotlightJob.salaryOrStipend}
                          </span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 mt-2 line-clamp-2 max-w-2xl leading-relaxed">
                      {spotlightJob.description}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
                  {computeUserMatch(spotlightJob) && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{computeUserMatch(spotlightJob)?.score}% Profile Match</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setSelectedOpportunityForModal(spotlightJob)}
                      className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      View Dossier
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyingOpportunity(spotlightJob)}
                      className="px-4 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-98 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Apply Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Filters Bar */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] flex flex-col lg:flex-row items-stretch lg:items-center gap-2.5 sm:gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by role, company name, required course, or skill (e.g. PHP, Laravel, React, TypeScript)..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200/90 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-[#8B181B] focus:border-[#8B181B] placeholder:text-stone-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-2 w-full lg:w-auto">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs bg-stone-50 border border-stone-200/90 rounded-xl text-stone-700 font-medium"
              >
                <option value="all">All Job Types</option>
                <option value="Full-time">Full-Time</option>
                <option value="Part-time">Part-Time</option>
                <option value="Internship">Internship</option>
                <option value="Mentorship">Mentorship</option>
                <option value="Contract">Contract</option>
              </select>

              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs bg-stone-50 border border-stone-200/90 rounded-xl text-stone-700 font-medium"
              >
                <option value="all">All Degrees / Courses</option>
                <option value="Information Technology">BS Information Technology</option>
                <option value="Computer Science">BS Computer Science</option>
                <option value="Business">BS Business Administration</option>
                <option value="Education">BSEd / Elementary Education</option>
              </select>

              {/* Skills-Based Dropdown Filter */}
              <select
                value={selectedSkillTag}
                onChange={(e) => setSelectedSkillTag(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 text-xs bg-stone-50 border border-stone-200/90 rounded-xl text-stone-700 font-medium lg:max-w-[180px] truncate"
                title="Filter opportunities by specific required or verified skill"
              >
                <option value="all">All Skills ({availableJobSkills.length})</option>
                {userVerifiedSkills.length > 0 && (
                  <optgroup label="My Profile Skills (Verified)">
                    {userVerifiedSkills.map((skill) => (
                      <option key={`user-skill-${skill}`} value={skill}>
                        ✓ {skill} ({userSkillMatchCounts[skill] || 0} jobs)
                      </option>
                    ))}
                  </optgroup>
                )}
                {availableJobSkills.length > 0 && (
                  <optgroup label="All Industry Skills">
                    {availableJobSkills.map((skill) => (
                      <option key={`job-skill-${skill}`} value={skill}>
                        {skill}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>

              {/* One-Click Verified Skills Filter Toggle */}
              {currentUser && (
                <button
                  type="button"
                  onClick={() => setFilterByMySkills(!filterByMySkills)}
                  className={`w-full sm:w-auto justify-center px-3 py-2 text-xs rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    filterByMySkills
                      ? 'bg-[#8B181B] text-white shadow-2xs ring-2 ring-red-300'
                      : 'bg-stone-50 border border-stone-200/90 text-stone-700 hover:bg-stone-100'
                  }`}
                  title={
                    userVerifiedSkills.length > 0
                      ? `Filter postings matching your verified skills (${userVerifiedSkills.join(', ')})`
                      : 'Filter by your verified profile skills'
                  }
                >
                  <ShieldCheck className={`w-3.5 h-3.5 ${filterByMySkills ? 'text-white' : 'text-[#8B181B]'}`} />
                  <span>My Verified Skills</span>
                  {userVerifiedSkills.length > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                      filterByMySkills ? 'bg-red-900 text-white' : 'bg-red-100 text-[#8B181B]'
                    }`}>
                      {userVerifiedSkills.length}
                    </span>
                  )}
                </button>
              )}

              {currentUser && (
                <button
                  type="button"
                  onClick={() => setMatchOnly(!matchOnly)}
                  className={`w-full sm:w-auto justify-center px-3 py-2 text-xs rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    matchOnly
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-stone-50 border border-stone-200/90 text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Matched For Me</span>
                </button>
              )}
            </div>
          </div>

          {/* 1-Click Quick Filter Chips (Reduces clicks across common queries) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider shrink-0 mr-1">
              Quick Filter:
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedType('all');
                setSelectedCourseFilter('all');
                setMatchOnly(false);
                setFilterByMySkills(false);
                setSelectedSkillTag('all');
              }}
              className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                selectedType === 'all' && selectedCourseFilter === 'all' && !matchOnly && !filterByMySkills && selectedSkillTag === 'all'
                  ? 'bg-[#8B181B] text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              All Openings
            </button>
            <button
              type="button"
              onClick={() => {
                setMatchOnly(!matchOnly);
                setSelectedType('all');
              }}
              className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                matchOnly
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <Sparkles className="w-3 h-3 text-emerald-500" />
              <span>Matched For Me</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedType(selectedType === 'Full-time' ? 'all' : 'Full-time');
                setMatchOnly(false);
              }}
              className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                selectedType === 'Full-time'
                  ? 'bg-[#8B181B] text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              Full-time
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedType(selectedType === 'Internship' ? 'all' : 'Internship');
                setMatchOnly(false);
              }}
              className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                selectedType === 'Internship'
                  ? 'bg-[#8B181B] text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              Internships
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedCourseFilter(selectedCourseFilter !== 'all' ? 'all' : 'Information Technology');
              }}
              className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1 ${
                selectedCourseFilter !== 'all'
                  ? 'bg-[#8B181B] text-white shadow-2xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              <GraduationCap className="w-3 h-3" />
              <span>Technology Roles</span>
            </button>
          </div>

          {/* Active Skills Filter Banner */}
          {(filterByMySkills || selectedSkillTag !== 'all') && (
            <div className="bg-red-50/60 border border-red-200/90 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold text-[#8B181B]">
                  <ShieldCheck className="w-4 h-4 text-[#8B181B] shrink-0" />
                  <span>Skills-Based Filter Active</span>
                  <span className="text-[11px] font-normal text-stone-600">
                    — Showing {publishedOpportunities.length} job{publishedOpportunities.length === 1 ? '' : 's'} matching {selectedSkillTag !== 'all' ? `"${selectedSkillTag}"` : 'your verified profile skills'}
                  </span>
                </div>

                {userVerifiedSkills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">
                      Filter by specific skill:
                    </span>
                    {userVerifiedSkills.map((skill) => {
                      const isSelected = selectedSkillTag.toLowerCase() === skill.toLowerCase();
                      return (
                        <button
                          key={`chip-${skill}`}
                          type="button"
                          onClick={() => setSelectedSkillTag(isSelected ? 'all' : skill)}
                          className={`px-2.5 py-0.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-[#8B181B] text-white shadow-2xs'
                              : 'bg-white border border-red-200 text-[#8B181B] hover:bg-red-100/70'
                          }`}
                        >
                          <span>{skill}</span>
                          <span className={`text-[10px] ${isSelected ? 'text-red-200' : 'text-stone-500'}`}>
                            ({userSkillMatchCounts[skill] || 0})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => {
                    setFilterByMySkills(false);
                    setSelectedSkillTag('all');
                  }}
                  className="px-3 py-1.5 bg-white border border-red-200 hover:bg-red-100/70 text-[#8B181B] text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Skills Filter</span>
                </button>
              </div>
            </div>
          )}

          {/* Job Postings Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {publishedOpportunities.map((opp, idx) => {
              const match = computeUserMatch(opp);
              const hasApplied = myApplications.some((a) => a.jobId === opp.id);

              return (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(idx * 0.04, 0.3) }}
                  whileHover={{ y: -4, transition: { duration: 0.2, ease: "easeOut" } }}
                  className="relative overflow-hidden bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 flex flex-col justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] hover:shadow-md transition-all group"
                >
                  {/* Subtle Top Accent on hover */}
                  <div className="h-1 w-full absolute top-0 left-0 bg-transparent group-hover:bg-[#8B181B] transition-colors" />

                  <div>
                    {/* Top badging & Company Monogram */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 text-stone-800 font-bold text-xs flex items-center justify-center shrink-0 group-hover:bg-[#8B181B] group-hover:text-white group-hover:border-[#8B181B] transition-colors">
                          {opp.company.slice(0, 2).toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          {/* Zero-Pill Metadata Line */}
                          <div className="flex items-center gap-1.5 flex-wrap text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                            <span className="text-[#8B181B] font-bold">{opp.type}</span>
                            <span aria-hidden="true" className="text-stone-300">·</span>
                            <span className="truncate">{opp.company}</span>
                            {hasApplied && (
                              <>
                                <span aria-hidden="true" className="text-stone-300">·</span>
                                <span className="text-emerald-700 font-bold">✓ Applied</span>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-stone-400 mt-0.5">
                            <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                            <span className="truncate">{opp.location}</span>
                          </div>
                        </div>
                      </div>

                      {match && (
                        <div
                          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border shrink-0 ${
                            match.score >= 80
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : 'bg-stone-50 text-stone-700 border-stone-200'
                          }`}
                          title={`Automated Profile Compatibility Score: ${match.score}%`}
                        >
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          <span>{match.score}%</span>
                        </div>
                      )}
                    </div>

                    <h3
                      onClick={() => setSelectedOpportunityForModal(opp)}
                      className="text-base sm:text-lg font-bold text-stone-900 leading-snug group-hover:text-[#8B181B] transition-colors cursor-pointer"
                    >
                      {opp.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {opp.salaryOrStipend && (
                        <div className="text-xs font-bold text-stone-800 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200/80">
                          {opp.salaryOrStipend}
                        </div>
                      )}
                      {opp.requiredCourse && (
                        <div className="text-[11px] font-medium text-stone-600 bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/70">
                          {opp.requiredCourse}
                        </div>
                      )}
                    </div>

                    <p className="text-xs text-stone-600 mt-3 line-clamp-2 leading-relaxed">
                      {opp.description}
                    </p>

                    {/* Required Skills Chips */}
                    {opp.skills && opp.skills.length > 0 && (
                      <div className="mt-3.5 space-y-1.5">
                        {match && match.matchedSkillsCount > 0 && (
                          <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>
                              {match.matchedSkillsCount} of {opp.skills.length} verified skill{match.matchedSkillsCount === 1 ? '' : 's'} match your profile
                            </span>
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {(opp.skills || []).map((s, idx) => {
                            const isSkillMatched = userVerifiedSkills.some(
                              (us) => us.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(us.toLowerCase())
                            );
                            const isCurrentlySelected = selectedSkillTag.toLowerCase() === s.toLowerCase();
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setSelectedSkillTag(isCurrentlySelected ? 'all' : s)}
                                className={`px-2 py-0.5 text-[10px] font-medium rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                                  isCurrentlySelected
                                    ? 'bg-[#8B181B] text-white font-bold shadow-2xs'
                                    : isSkillMatched
                                    ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300 hover:bg-emerald-100'
                                    : 'bg-stone-50 text-stone-700 border border-stone-200 hover:bg-stone-100'
                                }`}
                                title={`Click to filter jobs requiring ${s}`}
                              >
                                <span>{s}</span>
                                {isSkillMatched && <Check className="w-2.5 h-2.5 text-emerald-700 inline" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {/* In-Card Expandable Details Drawer (Reduces clicks without opening modal) */}
                    <AnimatePresence>
                      {expandedJobIds[opp.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3.5 pt-3 border-t border-stone-100 space-y-2 text-xs overflow-hidden"
                        >
                          <div className="p-3 rounded-xl bg-stone-50 space-y-2">
                            <div>
                              <span className="font-bold text-stone-900 block mb-0.5">Role Overview:</span>
                              <p className="text-stone-600 leading-relaxed text-xs">{opp.description}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-stone-200/60">
                              <div>
                                <span className="text-stone-400 block">Experience:</span>
                                <span className="font-semibold text-stone-800">{opp.experienceLevel || 'Entry-level'}</span>
                              </div>
                              <div>
                                <span className="text-stone-400 block">Deadline:</span>
                                <span className="font-semibold text-red-800">{opp.applicationDeadline || 'Open until filled'}</span>
                              </div>
                            </div>
                            {opp.contactEmail && (
                              <div className="text-[11px] pt-1">
                                <span className="text-stone-400 block">Recruiter Contact:</span>
                                <a href={`mailto:${opp.contactEmail}`} className="font-semibold text-[#8B181B] hover:underline truncate block">
                                  {opp.contactEmail}
                                </a>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Card Footer */}
                  <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => toggleJobExpand(opp.id)}
                      className="text-[11px] font-semibold text-stone-500 hover:text-stone-900 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>{expandedJobIds[opp.id] ? 'Collapse Details' : 'Quick View'}</span>
                      <ChevronRight className={`w-3 h-3 transition-transform ${expandedJobIds[opp.id] ? 'rotate-90' : ''}`} />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setShareItem({
                            title: `${opp.title} at ${opp.company}`,
                            text: `Explore career opportunity: ${opp.title} at ${opp.company} (${opp.location}) - Salary: ${opp.salaryOrStipend || 'Competitive'}. Open to St. Cecilia's College graduates!`,
                            type: 'job'
                          })
                        }
                        className="p-2 text-stone-400 hover:text-[#8B181B] hover:bg-stone-100 rounded-xl transition-colors cursor-pointer active:scale-95"
                        title="Share Job Opportunity"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedOpportunityForModal(opp)}
                        className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold transition-colors cursor-pointer active:scale-95"
                      >
                        Dossier
                      </button>

                      <button
                        type="button"
                        onClick={() => setApplyingOpportunity(opp)}
                        className="px-3.5 py-1.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1"
                      >
                        <span>{hasApplied ? 'View / Reapply' : 'Apply Now'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {publishedOpportunities.length === 0 && (
            <div className="bg-white border border-stone-200 rounded-2xl p-12 text-center shadow-2xs space-y-3">
              <Briefcase className="w-10 h-10 text-stone-300 mx-auto" />
              <div>
                <h3 className="text-sm font-bold text-stone-800">No Job Postings Matched Your Filters</h3>
                <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
                  {filterByMySkills || selectedSkillTag !== 'all'
                    ? `No job openings currently require ${selectedSkillTag !== 'all' ? `"${selectedSkillTag}"` : 'your verified profile skills'}. You can clear skills filtering or reset all criteria to view all active openings.`
                    : 'Try expanding your search query or reset employment type and degree filters to browse all open Cecilian roles.'}
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                {(filterByMySkills || selectedSkillTag !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterByMySkills(false);
                      setSelectedSkillTag('all');
                    }}
                    className="px-4 py-2 bg-red-50 border border-red-200 hover:bg-red-100 text-[#8B181B] text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Clear Skills Filter
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('all');
                    setSelectedCourseFilter('all');
                    setMatchOnly(false);
                    setFilterByMySkills(false);
                    setSelectedSkillTag('all');
                  }}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Reset All Filters
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: MY APPLICATIONS */}
      {activeSubTab === 'my_applications' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)]">
            <h3 className="text-base font-bold text-stone-900">
              My Job Applications & Status Pipeline ({myApplications.length})
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Track candidate status, feedback notes, and automated match scores for opportunities you applied to.
            </p>
          </div>

          {myApplications.length === 0 ? (
            <div className="bg-white border border-stone-200/90 rounded-2xl p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)]">
              <FileCheck className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-stone-800">No Applications Submitted Yet</h4>
              <p className="text-xs text-stone-500 mt-1">
                Explore the job board to find open roles matching your course and submit your application with instant match feedback.
              </p>
              <button
                type="button"
                onClick={() => setActiveSubTab('explore')}
                className="mt-4 px-4 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Browse Open Roles
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {myApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white border border-stone-200/90 rounded-2xl p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-stone-900">{app.jobTitle}</span>
                      {app.matchScore && (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          {app.matchScore}% Match
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-600 font-medium">
                      {app.companyName} • Applied on {new Date(app.appliedAt).toLocaleDateString()}
                    </p>
                    {app.statusNotes && (
                      <p className="text-xs text-blue-700 bg-blue-50/70 p-2 rounded-lg mt-2 border border-blue-100">
                        <strong>Feedback / Note:</strong> {app.statusNotes}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <div className="text-right">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                          app.status === 'Hired'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : app.status === 'Interview'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : app.status === 'Rejected'
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {app.status}
                      </span>
                      <div className="text-[10px] text-stone-400 mt-1">Current Candidate Stage</div>
                    </div>
                    {app.status !== 'Hired' && (
                      <button
                        type="button"
                        onClick={() => setApplicationToWithdraw({ id: app.id, jobTitle: app.jobTitle, companyName: app.companyName })}
                        className="px-3 py-1.5 text-xs text-stone-500 hover:text-red-700 hover:bg-red-50 border border-stone-200 hover:border-red-200 rounded-xl font-medium transition-colors cursor-pointer"
                        title="Withdraw this application"
                      >
                        Withdraw
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: EMPLOYER PORTAL / MY JOB POSTINGS */}
      {activeSubTab === 'employer_portal' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Employer Hiring Portal & ATS Tracker ({myPostings.length} Postings)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Review applicant pipelines, download candidate resumes, and evaluate Cecilian graduates.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenPostModal}
              className="px-4 py-2 bg-stone-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Posting</span>
            </button>
          </div>

          <div className="space-y-3">
            {myPostings.map((job) => {
              const applicantsForThis = jobApplications.filter((a) => a.jobId === job.id);
              const isApproved = job.approvalStatus === 'approved';

              return (
                <div
                  key={job.id}
                  className="bg-white border border-stone-200 rounded-2xl p-5 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : job.approvalStatus === 'pending_approval'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {job.approvalStatus ? job.approvalStatus.replace('_', ' ') : 'Live'}
                      </span>
                      <span className="text-xs font-bold text-stone-900">{job.title}</span>
                    </div>

                    <p className="text-xs text-stone-600">
                      {job.company} • {job.location} • {job.type} • {job.salaryOrStipend || 'Competitive'}
                    </p>

                    {job.rejectionReason && (
                      <p className="text-xs text-rose-700 bg-rose-50 p-2 rounded-lg mt-1 border border-rose-100">
                        Admin Feedback: {job.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setTrackingOpportunity(job)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Review Applicants ({applicantsForThis.length})</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW: ADMIN APPROVAL QUEUE */}
      {activeSubTab === 'admin_moderation' && <JobModerationQueue />}

      {/* OPPORTUNITY DETAIL MODAL */}
      {selectedOpportunityForModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-xl p-6 my-8 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                  {selectedOpportunityForModal.type}
                </span>
                <h2 className="text-lg font-bold text-stone-900 mt-1">
                  {selectedOpportunityForModal.title}
                </h2>
                <p className="text-xs text-stone-600 font-medium">
                  {selectedOpportunityForModal.company} • {selectedOpportunityForModal.location}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOpportunityForModal(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs text-stone-700 leading-relaxed max-h-80 overflow-y-auto pr-1">
              <div>
                <h4 className="font-bold text-stone-900 mb-1">Target Academic Degree</h4>
                <p className="text-blue-700 font-medium">
                  {selectedOpportunityForModal.requiredCourse || 'Open to all programs'}
                </p>
              </div>

              {selectedOpportunityForModal.salaryOrStipend && (
                <div>
                  <h4 className="font-bold text-stone-900 mb-1">Salary & Compensation</h4>
                  <p className="text-emerald-700 font-bold">
                    {selectedOpportunityForModal.salaryOrStipend}
                  </p>
                </div>
              )}

              {selectedOpportunityForModal.experienceLevel && (
                <div>
                  <h4 className="font-bold text-stone-900 mb-1">Experience Level</h4>
                  <p className="text-stone-600 font-medium">
                    {selectedOpportunityForModal.experienceLevel}
                  </p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-stone-900 mb-1">Role Description & Qualifications</h4>
                <p className="whitespace-pre-line leading-relaxed">{selectedOpportunityForModal.description}</p>
              </div>

              <div>
                <h4 className="font-bold text-stone-900 mb-1">Required Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedOpportunityForModal.skills || []).map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 bg-stone-100 text-stone-700 text-xs font-medium rounded"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setShareItem({
                    title: `${selectedOpportunityForModal.title} at ${selectedOpportunityForModal.company}`,
                    text: `Check out this career opportunity for Cecilian graduates: ${selectedOpportunityForModal.title} at ${selectedOpportunityForModal.company}.`,
                    type: 'job'
                  });
                }}
                className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share Job</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const opp = selectedOpportunityForModal;
                  setSelectedOpportunityForModal(null);
                  setApplyingOpportunity(opp);
                }}
                className="px-5 py-2.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Submit Direct Portal Application</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POST OPPORTUNITY MODAL */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-xl my-8 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/10 text-stone-200">
                  Career Opportunity Publisher
                </span>
                <h3 className="text-base font-bold text-white mt-1">Post a Career Opportunity</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Approval Notice Banner */}
            <div className="bg-amber-50 border-b border-amber-100 p-3 px-5 text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {permissions.canManageJobModeration
                  ? 'Admin mode active: Job posting will be published immediately upon submission.'
                  : 'Workflow notice: Postings undergo Alumni Office Admin Verification before publishing live.'}
              </span>
            </div>

            <form onSubmit={handlePost} className="p-5 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Junior Web Developer"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. ABC Technologies"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Job Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
                  >
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Internship">Internship</option>
                    <option value="Mentorship">Mentorship</option>
                    <option value="Contract">Contract</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Cebu City"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Salary Range / Compensation</label>
                  <input
                    type="text"
                    value={salaryOrStipend}
                    onChange={(e) => setSalaryOrStipend(e.target.value)}
                    placeholder="e.g. ₱25,000–₱35,000"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Required Academic Course *</label>
                  <input
                    type="text"
                    required
                    value={requiredCourse}
                    onChange={(e) => setRequiredCourse(e.target.value)}
                    placeholder="e.g. BS Information Technology"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Experience Level</label>
                  <input
                    type="text"
                    value={experienceLevel}
                    onChange={(e) => setExperienceLevel(e.target.value)}
                    placeholder="e.g. 0–2 years / Fresh Graduate"
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Required Skills (comma separated) *</label>
                <input
                  type="text"
                  required
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="e.g. PHP, Laravel, MySQL, JavaScript"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Application Deadline</label>
                  <input
                    type="date"
                    value={applicationDeadline}
                    onChange={(e) => setApplicationDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">How to Apply</label>
                  <select
                    value={howToApply}
                    onChange={(e) => setHowToApply(e.target.value as any)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-stone-700 font-medium"
                  >
                    <option value="both">Direct Portal & Email / Web</option>
                    <option value="internal">Direct Portal Application Only</option>
                    <option value="external">External Email / Website Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Recruitment Contact Email *</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="careers@company.com"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Detailed Description & Qualifications *</label>
                <textarea
                  required
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide responsibilities, required coursework background, team culture, and how graduates can excel in this role..."
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white"
                />
              </div>

              {/* Sticky action bar so mobile users don't need to scroll down to see the submit button */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-1 -mx-5 -mb-5 px-5 border-t border-stone-200 flex items-center justify-end gap-2 shadow-xs z-10">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#991B1B] hover:bg-[#7F1D1D] text-white rounded-xl font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  Submit For Admin Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* JOB APPLICATION MODAL */}
      {applyingOpportunity && (
        <JobApplicationModal
          opportunity={applyingOpportunity}
          isOpen={!!applyingOpportunity}
          onClose={() => setApplyingOpportunity(null)}
        />
      )}

      {/* APPLICANT TRACKER MODAL */}
      {trackingOpportunity && (
        <JobApplicantsTrackerModal
          opportunity={trackingOpportunity}
          isOpen={!!trackingOpportunity}
          onClose={() => setTrackingOpportunity(null)}
        />
      )}

      {/* CROSS-APP SHARE MODAL */}
      <ShareModal
        isOpen={!!shareItem}
        onClose={() => setShareItem(null)}
        item={shareItem || { title: '' }}
      />

      {/* WITHDRAW APPLICATION CONFIRMATION MODAL */}
      <ConfirmationModal
        isOpen={Boolean(applicationToWithdraw)}
        onClose={() => setApplicationToWithdraw(null)}
        onConfirm={() => {
          if (applicationToWithdraw) {
            withdrawJobApplication(applicationToWithdraw.id);
            setApplicationToWithdraw(null);
          }
        }}
        title="Withdraw Job Application"
        message={`Are you sure you want to withdraw your application for "${applicationToWithdraw?.jobTitle}" at ${applicationToWithdraw?.companyName}? This action cannot easily be undone.`}
        confirmLabel="Withdraw Application"
        cancelLabel="Keep Application"
        variant="warning"
      />
    </div>
  );
};
