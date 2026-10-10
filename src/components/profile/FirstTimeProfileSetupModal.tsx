import React, { useState } from 'react';
import {
  Briefcase,
  Building2,
  MapPin,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Globe,
  GraduationCap,
  Upload,
  X
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import {
  DEFAULT_USER_AVATAR,
  USER_AVATAR_PRESETS,
  getUserAvatar,
  handleUserAvatarError
} from '../../lib/defaultImages';
import { compressImage } from '../../lib/utils';
import { triggerHaptic } from '../../services/hapticsService';

interface FirstTimeProfileSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const INDUSTRIES = [
  'Information Technology & Software',
  'Education & Academic Research',
  'Healthcare, Medical & Nursing',
  'Engineering & Construction',
  'Banking, Finance & Insurance',
  'Business Process Outsourcing (BPO)',
  'Government & Public Administration',
  'Hospitality, Culinary & Tourism',
  'Media, Arts & Creative Design',
  'Manufacturing & Logistics',
  'Legal & Professional Services',
  'Non-Profit & Community Development',
  'Other Professional Field'
];

const FirstTimeProfileSetupModalContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentUser, updateProfile, showToast, addAuditLog } = useAlumni();

  const [employmentStatus, setEmploymentStatus] = useState<
    'Employed' | 'Self-employed' | 'Unemployed' | 'Student' | 'Retired'
  >(currentUser?.employmentStatus || 'Employed');
  const [currentPosition, setCurrentPosition] = useState(currentUser?.currentPosition || '');
  const [company, setCompany] = useState(currentUser?.company || '');
  const [industry, setIndustry] = useState(currentUser?.industry || 'Information Technology & Software');
  const [workLocation, setWorkLocation] = useState(currentUser?.location || 'Cebu, Philippines');
  const [headline, setHeadline] = useState(
    currentUser?.headline || (currentUser?.course ? `${currentUser.course} Graduate` : 'Cecilian Alumnus')
  );
  const [skillsInput, setSkillsInput] = useState(
    (currentUser?.skills || ['Leadership', 'Problem Solving']).join(', ')
  );
  const [profilePictureUrl, setProfilePictureUrl] = useState(
    currentUser?.profilePictureUrl || DEFAULT_USER_AVATAR
  );
  const [website, setWebsite] = useState((currentUser as any)?.website || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const avatarFileRef = React.useRef<HTMLInputElement | null>(null);

  if (!currentUser) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const parsedSkills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const generatedHeadline =
      currentPosition && company
        ? `${currentPosition} at ${company}`
        : headline || `${currentPosition || 'Professional'} • Class of ${currentUser.batch || '2024'}`;

    const updates = {
      employmentStatus,
      currentPosition: currentPosition.trim(),
      company: company.trim(),
      industry,
      location: workLocation.trim(),
      headline: generatedHeadline,
      skills: parsedSkills.length > 0 ? parsedSkills : ['Communication', 'Teamwork'],
      website: website.trim(),
      profilePictureUrl: profilePictureUrl || DEFAULT_USER_AVATAR,
      isProfileSetupCompleted: true
    };

    updateProfile(updates);

    addAuditLog({
      action: 'Initial Profile Setup Completed',
      actorId: currentUser.uid,
      actorName: currentUser.name,
      actorRole: currentUser.role || 'alumni',
      category: 'settings',
      details: `Profile completion updated. Current role: ${currentPosition || 'Alum'} at ${company || 'N/A'}`,
      severity: 'info'
    });

    setIsSubmitting(false);
    sessionStorage.setItem(`dismissed_setup_${currentUser.uid}`, 'true');
    triggerHaptic('success');
    showToast('Your alumni profile is now active and published!', 'success');
    onClose();
  };

  const handleDismissOrSave = () => {
    // Save any data user has inputted before closing
    const parsedSkills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const generatedHeadline =
      currentPosition && company
        ? `${currentPosition} at ${company}`
        : headline || (currentPosition ? `${currentPosition} • Class of ${currentUser.batch || '2024'}` : currentUser.headline);

    const updates: any = {};
    if (employmentStatus) updates.employmentStatus = employmentStatus;
    if (currentPosition.trim()) updates.currentPosition = currentPosition.trim();
    if (company.trim()) updates.company = company.trim();
    if (industry.trim()) updates.industry = industry.trim();
    if (workLocation.trim()) updates.location = workLocation.trim();
    if (generatedHeadline) updates.headline = generatedHeadline;
    if (parsedSkills.length > 0) updates.skills = parsedSkills;
    if (website.trim()) updates.website = website.trim();
    if (profilePictureUrl && profilePictureUrl !== DEFAULT_USER_AVATAR) {
      updates.profilePictureUrl = profilePictureUrl;
    }
    updates.isProfileSetupCompleted = true;

    // Save whatever the user inputted directly into their alumni profile
    updateProfile(updates);
    showToast('Details saved to your alumni profile!', 'success');

    try {
      localStorage.setItem(`dismissed_setup_${currentUser.uid}`, 'true');
      sessionStorage.setItem(`dismissed_setup_${currentUser.uid}`, 'true');
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pt-safe pb-safe animate-in fade-in">
      <div className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl max-w-xl w-full max-h-[90dvh] overflow-hidden flex flex-col relative animate-in zoom-in-95 transition-colors">
        
        {/* Decorative Top Accent Banner */}
        <div className="relative bg-gradient-to-r from-[#8B181B] via-[#721316] to-[#550c0f] p-6 text-white text-center select-none shrink-0">
          <button
            type="button"
            onClick={handleDismissOrSave}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
            title="Save & Close"
            aria-label="Save and close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3 shadow-md">
            <Sparkles className="w-6 h-6 text-amber-300" />
          </div>

          <h2 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white">
            Welcome, {currentUser.name}!
          </h2>
          <p className="text-xs text-white/85 mt-1 max-w-md mx-auto leading-relaxed">
            Please complete your professional details. This data enables alumni career networking, mentor matching, and official graduate tracer records.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-stone-700 dark:text-stone-300 max-h-[75vh] overflow-y-auto">
          {/* Profile Picture Option */}
          <div className="p-3.5 bg-stone-50/80 dark:bg-stone-800/60 rounded-2xl border border-stone-200/90 dark:border-stone-700/60 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-stone-900 dark:text-white uppercase tracking-wider text-[11px]">
                Profile Photo
              </label>
              <span className="text-[10px] text-stone-400 dark:text-stone-500">
                {profilePictureUrl === DEFAULT_USER_AVATAR ? 'Default Official Avatar' : 'Custom Photo Selected'}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={getUserAvatar(profilePictureUrl)}
                alt="Profile Preview"
                onError={handleUserAvatarError}
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white dark:border-stone-800 shadow-2xs bg-stone-200 dark:bg-stone-700 shrink-0"
              />
              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <input
                    ref={avatarFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const compressed = await compressImage(file, 400, 400, 0.85);
                        setProfilePictureUrl(compressed);
                        showToast('Custom photo selected!', 'success');
                      } catch {
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setProfilePictureUrl(reader.result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => avatarFileRef.current?.click()}
                    className="px-2.5 py-1 text-xs bg-[#8B181B] hover:bg-[#721316] text-white rounded-lg font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setProfilePictureUrl(DEFAULT_USER_AVATAR);
                      showToast('Default institutional avatar applied.', 'info');
                    }}
                    className="px-2 py-1 text-[11px] bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 rounded-lg font-medium cursor-pointer"
                  >
                    Default Avatar
                  </button>

                  {USER_AVATAR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setProfilePictureUrl(preset.url)}
                      className={`px-2 py-1 text-[10px] rounded-lg border transition-colors cursor-pointer ${
                        profilePictureUrl === preset.url
                          ? 'bg-red-50 dark:bg-red-950/40 text-[#8B181B] dark:text-red-300 border-[#8B181B] font-bold'
                          : 'bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-750'
                      }`}
                    >
                      {preset.name.replace(' (Default)', '')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Employment Status */}
          <div>
            <label className="block font-bold text-stone-900 dark:text-white uppercase tracking-wider text-[11px] mb-1.5">
              Current Employment Status <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {(['Employed', 'Self-employed', 'Unemployed', 'Student', 'Retired'] as const).map((st) => (
                <button
                  type="button"
                  key={st}
                  onClick={() => setEmploymentStatus(st)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                    employmentStatus === st
                      ? 'bg-[#8B181B] text-white border-[#8B181B] shadow-2xs'
                      : 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-750'
                  }`}
                >
                  {st === 'Unemployed' ? 'Seeking Opportunities' : st}
                </button>
              ))}
            </div>
          </div>

          {/* Job Title & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-900 dark:text-white uppercase tracking-wider text-[11px] mb-1.5">
                Current Job Title / Position <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={currentPosition}
                  onChange={(e) => setCurrentPosition(e.target.value)}
                  placeholder="e.g., Lead Cloud Engineer"
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-850 focus:border-[#8B181B]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-stone-900 dark:text-white uppercase tracking-wider text-[11px] mb-1.5">
                Company / Organization <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <div className="relative">
                <Building2 className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g., Archipelagic Systems"
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-850 focus:border-[#8B181B]"
                />
              </div>
            </div>
          </div>

          {/* Industry & Work Location */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-900 dark:text-white uppercase tracking-wider text-[11px] mb-1.5">
                Industry Sector <span className="text-red-600 dark:text-red-400">*</span>
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 font-medium focus:bg-white dark:focus:bg-stone-850 focus:border-[#8B181B]"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind} className="dark:bg-stone-800">
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-900 dark:text-white uppercase tracking-wider text-[11px] mb-1.5">
                Work Location / City
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={workLocation}
                  onChange={(e) => setWorkLocation(e.target.value)}
                  placeholder="Cebu City, Philippines or Remote"
                  className="w-full pl-10 pr-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:bg-stone-850 focus:border-[#8B181B]"
                />
              </div>
            </div>
          </div>

          {/* Professional Headline */}
          <div>
            <label className="block font-bold text-stone-900 dark:text-white uppercase tracking-wider text-[11px] mb-1.5">
              Professional Headline / Tagline
            </label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., Lead Full Stack Engineer @ Acmeda | SCC Class of 2023"
              className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:border-[#8B181B]"
            />
          </div>

          {/* Key Skills */}
          <div>
            <label className="block font-bold text-stone-900 dark:text-white uppercase tracking-wider text-[11px] mb-1.5">
              Key Skills & Specializations (Comma-separated)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g., React, TypeScript, Cloud Architecture, Project Management"
              className="w-full px-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:border-[#8B181B]"
            />
          </div>

          {/* Portfolio or LinkedIn Link */}
          <div>
            <label className="block font-bold text-stone-900 dark:text-white uppercase tracking-wider text-[11px] mb-1.5">
              LinkedIn Profile or Portfolio URL (Optional)
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                className="w-full pl-10 pr-3 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:bg-white dark:focus:border-[#8B181B]"
              />
            </div>
          </div>

          {/* Confidentiality Reminder */}
          <div className="p-3 bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 rounded-xl flex items-start gap-2 text-[11px] text-stone-600 dark:text-stone-300">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Your professional data is safeguarded under the Philippine Data Privacy Act of 2012 and Institutional Zero Disclosure policy. You can update these details anytime in your Profile tab.
            </span>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleDismissOrSave}
              className="w-1/3 py-3 rounded-xl border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 font-bold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Skip For Now
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-[#8B181B] hover:bg-[#721316] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>SAVE & COMPLETE SETUP</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const FirstTimeProfileSetupModal: React.FC<FirstTimeProfileSetupModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;
  return <FirstTimeProfileSetupModalContent onClose={onClose} />;
};
