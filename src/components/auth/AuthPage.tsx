import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Briefcase,
  Building,
  Building2,
  Globe,
  MapPin,
  Phone,
  User,
  Shield,
  ShieldCheck,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  School,
  Clock,
  ShieldAlert,
  KeyRound,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  RefreshCw,
  HelpCircle,
  FileSpreadsheet,
  Moon,
  Sun,
  Scale,
  X,
  FileText,
  Send,
  ScanFace
} from 'lucide-react';
import {
  checkBiometricAvailability,
  authenticateWithBiometrics,
  enableBiometricLogin,
  BiometricAvailability
} from '../../services/biometricAuthService';
import { useAlumni } from '../../context/AlumniContext';
import { useTheme } from '../../lib/theme';
import { UserRole, UserProfile, StudentVerificationRecord, OFFICIAL_DEGREE_PROGRAMS } from '../../types';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import {
  verifyStudentRecord,
  findRegistryMatch,
  markRegistryRecordAsRegistered,
  getRegistrarRecords,
  isValidStudentIdPattern,
  validateStudentRegistrationStrict,
  generateAlumniId,
  lookupStudentBySchoolId,
  addRegistrationConflict
} from '../../services/studentVerificationService';
import { getCentenaryBatchYears } from '../../services/longevityService';

interface AuthPageProps {
  initialMode?: 'login' | 'register' | 'forgot';
  initialRole?: 'alumni' | 'employer';
  onLoginSuccess?: (role: string) => void;
  onBackToApp?: () => void;
}

// Local storage keys for persistent login rate-limiting / lockout timer
const LOCKOUT_STORAGE_KEYS = {
  UNTIL: 'sc_alumni_login_lockout_until',
  ATTEMPTS: 'sc_alumni_login_failed_attempts',
  CYCLE: 'sc_alumni_login_lockout_cycle'
};

// Lockout duration math:
// First 1-3 attempts = 1 min (60s)
// Subsequent 1-3 attempts = +2 mins each trial (Trial 2 = 3m, Trial 3 = 5m, etc.)
const getLockoutDurationSeconds = (cycle: number): number => {
  return (1 + Math.max(0, cycle - 1) * 2) * 60;
};

const formatSecondsToMMSS = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  initialRole = 'alumni',
  onLoginSuccess,
  onBackToApp
}) => {
  const { login, register, users, resetUserPasswordByEmail, addAuditLog, showToast } = useAlumni();
  const { isDark, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [loginMethod, setLoginMethod] = useState<'email' | 'studentId'>('email');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [loginError, setLoginError] = useState('');

  // Biometric Authentication State (Face Detection)
  const [biometricAvail, setBiometricAvail] = useState<BiometricAvailability>({
    isAvailable: false,
    biometryType: 'none',
    label: 'Biometrics'
  });
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);

  useEffect(() => {
    checkBiometricAvailability().then((avail) => {
      setBiometricAvail(avail);
    });
  }, []);

  const handleBiometricSignIn = async () => {
    setIsBiometricLoading(true);
    try {
      const res = await authenticateWithBiometrics();
      if (res.success && res.credentials) {
        const emailOrUser = res.credentials.email;
        const pwd = res.credentials.password;
        
        let ok = false;
        if (pwd && pwd !== 'session_token') {
          ok = await login(emailOrUser, pwd);
        } else {
          // If stored token or email quick sign-in
          const matched = users.find(
            (u) =>
              u.email?.toLowerCase() === emailOrUser.toLowerCase() ||
              u.studentId?.toLowerCase() === emailOrUser.toLowerCase()
          );
          if (matched) {
            ok = await login(matched.email, 'demo-biometric-key');
          }
        }

        if (ok) {
          showToast('Biometric authentication verified!', 'success');
          if (onLoginSuccess) {
            onLoginSuccess('alumni');
          } else if (onBackToApp) {
            onBackToApp();
          }
        } else {
          setLoginIdentifier(emailOrUser);
          showToast('Biometric verified! Please enter your password to renew your session.', 'info');
        }
      } else if (res.error) {
        showToast(res.error, 'error');
      }
    } catch (err: any) {
      showToast(err?.message || 'Biometric authentication failed.', 'error');
    } finally {
      setIsBiometricLoading(false);
    }
  };

  // Forgot Password modal state
  const [showForgotModal, setShowForgotModal] = useState(initialMode === 'forgot');
  const [forgotEmail, setForgotEmail] = useState('');

  const handleOpenForgotPassword = () => {
    if (loginIdentifier && loginIdentifier.includes('@')) {
      setForgotEmail(loginIdentifier.trim());
    }
    setShowForgotModal(true);
  };

  const handlePasswordResetSuccess = (email: string, newPassword?: string) => {
    // Clear any lockout constraints upon identity verification & password reset
    try {
      localStorage.removeItem(LOCKOUT_STORAGE_KEYS.UNTIL);
      localStorage.removeItem(LOCKOUT_STORAGE_KEYS.ATTEMPTS);
      localStorage.removeItem(LOCKOUT_STORAGE_KEYS.CYCLE);
    } catch {
      // ignore
    }
    setFailedAttempts(0);
    setLockoutCycle(1);
    setLockoutSecondsRemaining(0);
    setLoginError('');

    // Prepopulate sign-in form with newly reset credentials
    setLoginMethod('email');
    setLoginIdentifier(email);
    if (newPassword) {
      setLoginPassword(newPassword);
    }
    setShowForgotModal(false);
  };

  // Failed login rate-limiting / lockout timer state
  const [failedAttempts, setFailedAttempts] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCKOUT_STORAGE_KEYS.ATTEMPTS);
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [lockoutCycle, setLockoutCycle] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(LOCKOUT_STORAGE_KEYS.CYCLE);
      return saved ? Math.max(1, parseInt(saved, 10)) : 1;
    } catch {
      return 1;
    }
  });

  const [lockoutSecondsRemaining, setLockoutSecondsRemaining] = useState<number>(() => {
    try {
      const savedUntil = localStorage.getItem(LOCKOUT_STORAGE_KEYS.UNTIL);
      if (!savedUntil) return 0;
      const untilMs = parseInt(savedUntil, 10);
      const diff = Math.ceil((untilMs - Date.now()) / 1000);
      return diff > 0 ? diff : 0;
    } catch {
      return 0;
    }
  });

  // Countdown timer effect for login lockout
  useEffect(() => {
    if (lockoutSecondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setLockoutSecondsRemaining((prev) => {
        if (prev <= 1) {
          try {
            localStorage.removeItem(LOCKOUT_STORAGE_KEYS.UNTIL);
          } catch {
            // ignore
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [lockoutSecondsRemaining]);

  const isLockedOut = lockoutSecondsRemaining > 0;

  // Registration multi-step state (1: Initial Student ID Screening, 2: Account & Profile, 3: Review & Honor Pledge)
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [registrationType, setRegistrationType] = useState<'alumni' | 'employer'>(initialRole);

  useEffect(() => {
    if (initialRole) {
      setRegistrationType(initialRole);
    }
  }, [initialRole]);

  // Employer Registration State
  const [companyName, setCompanyName] = useState('');
  const [companyIndustry, setCompanyIndustry] = useState('Information Technology & Software');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [companyAddress, setCompanyAddress] = useState('Cebu City, Philippines');
  const [employerContactPerson, setEmployerContactPerson] = useState('');
  const [employerEmail, setEmployerEmail] = useState('');
  const [employerPhone, setEmployerPhone] = useState('');
  const [employerPassword, setEmployerPassword] = useState('');
  const [employerConfirmPassword, setEmployerConfirmPassword] = useState('');
  const [showEmployerPassword, setShowEmployerPassword] = useState(false);
  const [showEmployerConfirmPassword, setShowEmployerConfirmPassword] = useState(false);
  const [employerError, setEmployerError] = useState('');
  const [isSubmittingEmployer, setIsSubmittingEmployer] = useState(false);

  // Step 1: Initial Student ID Screening
  const [studentId, setStudentId] = useState('');
  const [screeningError, setScreeningError] = useState('');
  const [studentVerificationStatus, setStudentVerificationStatus] = useState<
    'idle' | 'checking' | 'verified' | 'failed'
  >('idle');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verifiedRecord, setVerifiedRecord] = useState<StudentVerificationRecord | null>(null);
  const [isRegistryMatched, setIsRegistryMatched] = useState(false);

  // Step 2: Account Details & Profile Credentials
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [batch, setBatch] = useState('2024');
  const [course, setCourse] = useState('B.S. Information Technology');
  const [location, setLocation] = useState('Cebu, Philippines');
  const [headline, setHeadline] = useState('');
  const [phone, setPhone] = useState('');
  const [step2Error, setStep2Error] = useState('');

  // ID Conflict / Dispute Claim state (when ID is taken/already registered)
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeStudentId, setDisputeStudentId] = useState('');
  const [disputeFullName, setDisputeFullName] = useState('');
  const [disputeEmail, setDisputeEmail] = useState('');
  const [disputeBatch, setDisputeBatch] = useState('2024');
  const [disputeCourse, setDisputeCourse] = useState('B.S. Information Technology');
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeReferenceId, setDisputeReferenceId] = useState<string | null>(null);

  // Manual Verification Request state (when alumnus has no ID or ID unlisted in registrar masterlist)
  const [showManualVerificationModal, setShowManualVerificationModal] = useState(false);
  const [manualFullName, setManualFullName] = useState('');
  const [manualEmail, setManualEmail] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualBatch, setManualBatch] = useState('2024');
  const [manualCourse, setManualCourse] = useState('B.S. Information Technology');
  const [manualNotes, setManualNotes] = useState('');
  const [manualPassword, setManualPassword] = useState('');
  const [showManualPassword, setShowManualPassword] = useState(false);
  const [manualReferenceId, setManualReferenceId] = useState<string | null>(null);
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState(false);

  // 100-Year Centenary batches (from 1968 to 50 years into the future)
  const centenaryBatches = React.useMemo(() => getCentenaryBatchYears(1968, 50), []);

  // Degree Program options from official registry & accredited offerings
  const allDegreeOptions = React.useMemo(() => {
    const list: string[] = [...OFFICIAL_DEGREE_PROGRAMS];
    const records = getRegistrarRecords();
    records.forEach((r) => {
      if (r.course && !list.includes(r.course)) {
        list.push(r.course);
      }
    });
    return list;
  }, []);

  // Compute preview Alumni ID (Distinct from Student ID)
  const previewAlumniId = React.useMemo(() => {
    return generateAlumniId(batch, studentId);
  }, [batch, studentId]);

  // Open Dispute Modal helper
  const handleOpenDispute = (idToDispute?: string) => {
    setDisputeStudentId(idToDispute || studentId || '');
    setDisputeFullName(firstName && lastName ? `${firstName} ${lastName}` : firstName || '');
    setDisputeEmail(regEmail || '');
    setDisputeReferenceId(null);
    setShowDisputeModal(true);
  };

  // Open Manual Verification Modal helper
  const handleOpenManualVerification = () => {
    setManualFullName(firstName && lastName ? `${firstName} ${lastName}` : firstName || '');
    setManualEmail(regEmail || '');
    setManualPhone(phone || '');
    setManualReferenceId(null);
    setShowManualVerificationModal(true);
  };

  // Submit ID Ownership Dispute & Conflict
  const handleDisputeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeFullName.trim() || !disputeEmail.trim() || !disputeReason.trim()) {
      showToast('Please fill out all required fields.', 'error');
      return;
    }

    const targetStudentId = disputeStudentId.trim() || studentId.trim();

    const conflict = addRegistrationConflict({
      applicantName: disputeFullName.trim(),
      applicantEmail: disputeEmail.trim().toLowerCase(),
      applicantStudentId: targetStudentId,
      applicantBatch: disputeBatch.trim(),
      applicantCourse: disputeCourse.trim(),
      targetRegistryStudentId: targetStudentId,
      conflictType: 'claimed_id_dispute',
      severity: 'high',
      confidenceScore: 85,
      notes: `STUDENT ID CLAIM DISPUTE: Claimant ${disputeFullName.trim()} (${disputeEmail.trim()}) is contesting ownership of Student ID "${targetStudentId}". Course: ${disputeCourse.trim()}, Batch: Class of ${disputeBatch.trim()}. Statement: "${disputeReason.trim()}". Verification of diploma/TOR required.`
    });

    addAuditLog({
      action: 'REGISTRATION_CONFLICT_DISPUTE_FILED',
      actorId: `claimant_${Date.now()}`,
      actorName: disputeFullName.trim(),
      actorRole: 'alumni',
      category: 'conflict_resolution',
      details: `Official ID dispute filed for Student ID "${targetStudentId}" by ${disputeFullName} (${disputeEmail}). Forwarded to Requests & Conflicts queue.`,
      severity: 'alert'
    });

    setDisputeReferenceId(conflict.id);
    showToast(`Registration conflict filed! Reference #${conflict.id}`, 'success');
  };

  // Submit Manual Verification Request (when No ID or Unlisted Record)
  const handleManualVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFullName.trim() || !manualEmail.trim() || !manualBatch.trim() || !manualCourse.trim() || !manualPassword.trim()) {
      showToast('Please complete all required fields including password.', 'error');
      return;
    }

    setIsSubmittingAppeal(true);
    const provisionalStudentId = `SCC-PENDING-${Date.now().toString().slice(-4)}`;

    // 1. Create provisional account so they exist in user records & request lists
    register({
      name: manualFullName.trim(),
      email: manualEmail.trim().toLowerCase(),
      password: manualPassword.trim(),
      role: 'alumni',
      batch: manualBatch.trim(),
      course: manualCourse.trim(),
      phone: manualPhone.trim() || '+63 917 123 4567',
      location: 'Cebu, Philippines',
      headline: `${manualCourse.trim()} Alumnus • Class of ${manualBatch.trim()}`,
      studentId: provisionalStudentId,
      isVerified: false
    });

    // 2. Also register conflict/appeal in Registration Conflicts queue
    const conflict = addRegistrationConflict({
      applicantName: manualFullName.trim(),
      applicantEmail: manualEmail.trim().toLowerCase(),
      applicantStudentId: provisionalStudentId,
      applicantBatch: manualBatch.trim(),
      applicantCourse: manualCourse.trim(),
      conflictType: 'manual_verification_request',
      severity: 'medium',
      confidenceScore: 50,
      notes: `MANUAL REGISTRAR APPEAL (NO ID / UNLISTED): Alumnus requested manual identity confirmation. Degree: ${manualCourse.trim()}, Cohort: Class of ${manualBatch.trim()}, Phone: ${manualPhone.trim() || 'N/A'}. Details: "${manualNotes.trim() || 'No electronic student ID record on file. Academic archive verification requested.'}".`
    });

    addAuditLog({
      action: 'MANUAL_VERIFICATION_REQUEST_SUBMITTED',
      actorId: `appeal_${Date.now()}`,
      actorName: manualFullName.trim(),
      actorRole: 'alumni',
      category: 'alumni_registration',
      details: `Manual verification appeal submitted for ${manualFullName.trim()} (${manualEmail.trim()}) for Degree ${manualCourse.trim()}, Batch ${manualBatch.trim()}. Placed in Requests & Conflicts inbox.`,
      severity: 'info'
    });

    setIsSubmittingAppeal(false);
    setManualReferenceId(conflict.id);
    showToast(`Verification appeal submitted! Case #${conflict.id}`, 'success');
  };

  // Step 1 Screening Verification Handler (Primary School ID Verification & Duplicate Prevention)
  const handleVerifyStudentClick = async (
    e?: React.MouseEvent | React.FormEvent,
    overrideId?: string
  ) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    const targetId = (overrideId || studentId).trim();

    if (!targetId) {
      setScreeningError('Please enter your St. Cecilia’s School / Student ID (e.g., SCC-2020-0192).');
      setStudentVerificationStatus('idle');
      return;
    }

    setScreeningError('');
    setStudentVerificationStatus('checking');

    // 1. Primary lookup using School ID with duplicate detection
    const lookup = lookupStudentBySchoolId(targetId, users);

    if (lookup.isDuplicate) {
      setStudentVerificationStatus('failed');
      setIsRegistryMatched(false);
      setVerifiedRecord(null);
      const msg = lookup.errorMessage || `School ID "${targetId}" is already registered to an active account. Duplicate registration is prevented.`;
      setScreeningError(msg);
      setVerificationMessage(msg);
      return;
    }

    if (lookup.isValid && lookup.matchedRecord) {
      setStudentVerificationStatus('verified');
      setIsRegistryMatched(true);
      setVerifiedRecord(lookup.matchedRecord);
      setVerificationMessage(
        `Registrar Match Confirmed: ${lookup.matchedRecord.fullName} • ${lookup.matchedRecord.course}, Class of ${lookup.matchedRecord.batchYear}`
      );
      setScreeningError('');

      // Auto-populate user details from registrar record to reduce user typing and clicks
      const fullName = lookup.matchedRecord.fullName.trim();
      const parts = fullName.split(' ');
      if (parts.length > 1) {
        setLastName(parts[parts.length - 1]);
        setFirstName(parts.slice(0, -1).join(' '));
      } else {
        setFirstName(fullName);
        setLastName('');
      }
      if (lookup.matchedRecord.batchYear) setBatch(lookup.matchedRecord.batchYear);
      if (lookup.matchedRecord.course) setCourse(lookup.matchedRecord.course);
      if (lookup.matchedRecord.email && !regEmail) setRegEmail(lookup.matchedRecord.email);
    } else {
      setStudentVerificationStatus('failed');
      setIsRegistryMatched(false);
      setVerifiedRecord(null);
      const msg = lookup.errorMessage || `School ID "${targetId}" was not found in the official registrar masterlist. Expected format: SCC-YYYY-XXXX (e.g. SCC-2020-0192).`;
      setScreeningError(msg);
      setVerificationMessage(msg);
    }
  };

  // Step 3: Terms, Privacy & Zero Disclosure Agreement
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPrivacyConsent, setAgreedToPrivacyConsent] = useState(false);
  const [agreedToZeroDisclosure, setAgreedToZeroDisclosure] = useState(false);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const [showZeroDisclosureDetails, setShowZeroDisclosureDetails] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const allConsentsAgreed = agreedToTerms && agreedToPrivacyConsent && agreedToZeroDisclosure;
  const toggleAllConsents = () => {
    const nextVal = !allConsentsAgreed;
    setAgreedToPrivacyConsent(nextVal);
    setAgreedToZeroDisclosure(nextVal);
    setAgreedToTerms(nextVal);
  };

  // Password requirements validation
  const hasMinLength = regPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(regPassword);
  const hasNumber = /[0-9]/.test(regPassword);
  const isPasswordValid = hasMinLength && hasUppercase && hasNumber;

  // Handle Login submission with strict rate-limiting and progressive lockout timers
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (isLockedOut) {
      setLoginError(
        `Account temporarily locked due to failed attempts. Please wait ${formatSecondsToMMSS(
          lockoutSecondsRemaining
        )} before attempting to sign in again.`
      );
      return;
    }

    if (!loginIdentifier.trim()) {
      setLoginError(loginMethod === 'email' ? 'Please enter your email address.' : 'Please enter your Student ID.');
      return;
    }

    if (!loginPassword || !loginPassword.trim()) {
      setLoginError('Please enter your password.');
      return;
    }

    // Strict Password Validation: A correct User ID/email alone must NEVER allow login.
    // The password must ALWAYS be validated. If the User ID/email is correct but the password
    // is incorrect, authentication MUST fail.
    const success = await login(loginIdentifier.trim(), loginPassword);
    if (success) {
      // Clear all lockout state on successful authentication
      try {
        localStorage.removeItem(LOCKOUT_STORAGE_KEYS.UNTIL);
        localStorage.removeItem(LOCKOUT_STORAGE_KEYS.ATTEMPTS);
        localStorage.removeItem(LOCKOUT_STORAGE_KEYS.CYCLE);
      } catch {
        // ignore
      }
      setFailedAttempts(0);
      setLockoutCycle(1);
      setLockoutSecondsRemaining(0);

      const trimmed = loginIdentifier.trim().toLowerCase();
      const rawClean = trimmed.replace(/^scc-?/i, '').replace(/^alum-?/i, '');
      const normalizedInputId = trimmed.replace(/[^a-zA-Z0-9]/g, '');

      const matchedUser = users.find((u) => {
        if (u.email && u.email.toLowerCase() === trimmed) return true;
        if (trimmed === 'juan@email.com' && (u.email === 'alumni@stcecilia.edu' || u.email === 'maria.santos@alumni.stcecilia.edu')) return true;

        if (u.studentId) {
          const uLower = u.studentId.toLowerCase();
          const uClean = uLower.replace(/^scc-?/i, '');
          const uDigits = u.studentId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (
            uLower === trimmed ||
            uClean === rawClean ||
            uDigits === normalizedInputId ||
            `scc${normalizedInputId}` === uDigits ||
            uDigits === `scc${normalizedInputId}` ||
            `scc-${rawClean}` === uLower
          ) {
            return true;
          }
        }

        if (u.alumniId) {
          const aLower = u.alumniId.toLowerCase();
          const aDigits = u.alumniId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          if (aLower === trimmed || aDigits === normalizedInputId || aLower.replace(/^scc-alum-?/i, '') === rawClean) {
            return true;
          }
        }

        if (u.employeeId) {
          const eLower = u.employeeId.toLowerCase();
          const eClean = eLower.replace(/^scc-?/i, '');
          if (eLower === trimmed || eLower === `scc-${trimmed}` || eClean === rawClean) {
            return true;
          }
        }

        return false;
      });

      const userRole = matchedUser?.role || 'alumni';
      if (onLoginSuccess) {
        onLoginSuccess(userRole);
      } else if (onBackToApp) {
        onBackToApp();
      }
    } else {
      // Failed login attempt tracking
      const newAttempts = failedAttempts + 1;

      if (newAttempts >= 3) {
        // Reached 3 failed attempts in current trial -> trigger lockout
        const durationSec = getLockoutDurationSeconds(lockoutCycle);
        const untilMs = Date.now() + durationSec * 1000;
        const nextCycle = lockoutCycle + 1;

        try {
          localStorage.setItem(LOCKOUT_STORAGE_KEYS.UNTIL, untilMs.toString());
          localStorage.setItem(LOCKOUT_STORAGE_KEYS.ATTEMPTS, '0');
          localStorage.setItem(LOCKOUT_STORAGE_KEYS.CYCLE, nextCycle.toString());
        } catch {
          // ignore
        }

        setLockoutSecondsRemaining(durationSec);
        setFailedAttempts(0);
        setLockoutCycle(nextCycle);
        setLoginError('');
      } else {
        // 1st or 2nd failed attempt in current trial
        setFailedAttempts(newAttempts);
        try {
          localStorage.setItem(LOCKOUT_STORAGE_KEYS.ATTEMPTS, newAttempts.toString());
        } catch {
          // ignore
        }
        const trialDurationMins = Math.round(getLockoutDurationSeconds(lockoutCycle) / 60);
        const attemptsRemaining = 3 - newAttempts;
        setLoginError(
          `Invalid email/Student ID or password. (${newAttempts} of 3 attempts used). Warning: ${attemptsRemaining} attempt${
            attemptsRemaining > 1 ? 's' : ''
          } remaining before a ${trialDurationMins}-minute account lockout.`
        );
      }
    }
  };

  // Step 1 Screening Validation -> Proceed to Step 2 Account & Profile (School ID Primary Identifier)
  const handleProceedFromStep1ToStep2 = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setScreeningError('');

    const targetId = studentId.trim();
    if (!targetId) {
      setScreeningError('Please enter your St. Cecilia’s School ID (format: SCC-YYYY-XXXX) to proceed.');
      return;
    }

    // 1. Check for duplicates in existing users
    const lookup = lookupStudentBySchoolId(targetId, users);
    if (lookup.isDuplicate) {
      setStudentVerificationStatus('failed');
      setIsRegistryMatched(false);
      setVerifiedRecord(null);
      const msg = lookup.errorMessage || `School ID "${targetId}" is already registered. Duplicate registration is prevented.`;
      setScreeningError(msg);
      setVerificationMessage(msg);
      return;
    }

    // If not yet verified, check if valid registrar record
    if (!verifiedRecord) {
      if (lookup.isValid && lookup.matchedRecord) {
        setStudentVerificationStatus('verified');
        setIsRegistryMatched(true);
        setVerifiedRecord(lookup.matchedRecord);
        const fullName = lookup.matchedRecord.fullName.trim();
        const parts = fullName.split(' ');
        if (parts.length > 1) {
          setFirstName(parts.slice(0, -1).join(' '));
          setLastName(parts[parts.length - 1]);
        } else {
          setFirstName(fullName);
          setLastName('');
        }
        if (lookup.matchedRecord.batchYear) setBatch(lookup.matchedRecord.batchYear);
        if (lookup.matchedRecord.course) setCourse(lookup.matchedRecord.course);
        if (lookup.matchedRecord.email && !regEmail) setRegEmail(lookup.matchedRecord.email);
        setStep(2);
        return;
      } else {
        setStudentVerificationStatus('failed');
        setIsRegistryMatched(false);
        setVerifiedRecord(null);
        const msg = lookup.errorMessage || `School ID "${targetId}" was not found in the official registrar masterlist. Expected format: SCC-YYYY-XXXX (e.g. SCC-2020-0192).`;
        setScreeningError(msg);
        setVerificationMessage(msg);
        return;
      }
    }

    setStep(2);
  };

  // Step 2 Validation -> Proceed to Step 3 Review & Honor Pledge
  const handleProceedFromStep2ToStep3 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep2Error('');

    const officialFullName = verifiedRecord?.fullName?.trim() || `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!officialFullName) {
      setStep2Error('Official alumnus record not found. Please return to Step 1 and verify your Student ID.');
      return;
    }
    if (!regEmail.trim() || !regEmail.includes('@')) {
      setStep2Error('A valid email address is required.');
      return;
    }
    if (!isPasswordValid) {
      setStep2Error('Please ensure password satisfies all security requirements (8+ chars, uppercase, number).');
      return;
    }
    if (regPassword !== confirmPassword) {
      setStep2Error('Passwords do not match.');
      return;
    }

    setStep(3);
  };

  // Step 3 Submit Registration (Strictly Alumni Role)
  const handleCompleteRegistration = () => {
    if (!agreedToPrivacyConsent || !agreedToZeroDisclosure || !agreedToTerms) {
      alert('Please confirm all required consents (Data Privacy Consent, Zero Disclosure Agreement, and Honor Pledge) to complete registration.');
      return;
    }

    const fullName = verifiedRecord?.fullName?.trim() || `${firstName.trim()} ${lastName.trim()}`.trim();
    const finalCourse = verifiedRecord?.course || course;
    const finalBatch = verifiedRecord?.batchYear || batch;
    const generatedHeadline = headline.trim() || `${finalCourse} Graduate • Class of ${finalBatch}`;
    const isAutoVerified = true;
    const finalStudentId = studentId.trim();
    const generatedAlumniId = generateAlumniId(finalBatch, finalStudentId);

    const registered = register({
      name: fullName,
      email: regEmail.trim(),
      password: regPassword,
      role: 'alumni', // Exclusively Alumni
      batch: finalBatch,
      course: finalCourse,
      location: location.trim() || 'Cebu, Philippines',
      headline: generatedHeadline,
      phone: phone.trim() || '+63 917 123 4567',
      studentId: finalStudentId,
      alumniId: generatedAlumniId,
      isVerified: isAutoVerified
    });

    if (!registered) {
      return;
    }

    if (finalStudentId) {
      markRegistryRecordAsRegistered(finalStudentId, `user_${Date.now()}`);
      addAuditLog({
        action: 'INSTANT_REGISTRY_AUTO_REGISTRATION',
        actorId: 'alumni_registration_screening',
        actorName: fullName,
        actorRole: 'alumni',
        category: 'alumni_registration',
        details: `Alumnus completed screening and registered with verified Student ID (${finalStudentId}) and Official Alumni ID (${generatedAlumniId}). Account pre-authenticated and registered into Cecilian alumni network.`,
        severity: 'success'
      });
      showToast(`🎉 Welcome to St. Cecilia's Alumni Network, ${fullName}! Your Official Alumni ID is ${generatedAlumniId}`, 'success');
    }

    setRegistrationComplete(true);
    if (isAutoVerified) {
      setTimeout(() => {
        if (onLoginSuccess) {
          onLoginSuccess('alumni');
        } else if (onBackToApp) {
          onBackToApp();
        }
      }, 1200);
    }
  };

  // Employer Registration Form Handler
  const handleEmployerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setEmployerError('');

    if (!companyName.trim()) {
      setEmployerError('Company / Organization Name is required.');
      return;
    }
    if (!employerContactPerson.trim()) {
      setEmployerError('Contact Person / HR Representative full name is required.');
      return;
    }
    if (!employerEmail.trim() || !employerEmail.includes('@')) {
      setEmployerError('A valid corporate work email address is required.');
      return;
    }
    if (!employerPassword || employerPassword.length < 6) {
      setEmployerError('Password must be at least 6 characters long.');
      return;
    }
    if (employerPassword !== employerConfirmPassword) {
      setEmployerError('Passwords do not match.');
      return;
    }

    // Check duplicate email
    const existing = users.find((u) => u.email.toLowerCase() === employerEmail.trim().toLowerCase());
    if (existing) {
      setEmployerError(`An account with email "${employerEmail}" is already registered. Please sign in or use a different email.`);
      return;
    }

    setIsSubmittingEmployer(true);

    const registered = register({
      role: 'employer',
      name: employerContactPerson.trim(),
      email: employerEmail.trim().toLowerCase(),
      password: employerPassword,
      companyName: companyName.trim(),
      companyIndustry: companyIndustry.trim(),
      companyWebsite: companyWebsite.trim() ? (companyWebsite.startsWith('http') ? companyWebsite.trim() : `https://${companyWebsite.trim()}`) : '',
      companyAddress: companyAddress.trim() || 'Cebu City, Philippines',
      location: companyAddress.trim() || 'Cebu City, Philippines',
      phone: employerPhone.trim() || '+63 917 123 4567',
      contactPhone: employerPhone.trim() || '+63 917 123 4567',
      contactPerson: employerContactPerson.trim(),
      headline: `Hiring Partner • ${companyName.trim()}`,
      isVerified: false,
      verified: false
    });

    if (!registered) {
      setIsSubmittingEmployer(false);
      setEmployerError('Registration could not be completed. Please review your details.');
      return;
    }

    addAuditLog({
      action: 'EMPLOYER_REGISTER',
      actorId: 'new_employer',
      actorName: employerContactPerson.trim(),
      actorRole: 'employer',
      category: 'user_management',
      details: `Employer partner registered: "${companyName.trim()}" by ${employerContactPerson.trim()} (${employerEmail.trim()}). Account provisioned for employer portal access, pending accreditation verification.`,
      severity: 'info'
    });

    setRegistrationComplete(true);
    setTimeout(() => {
      if (onLoginSuccess) {
        onLoginSuccess('employer');
      } else if (onBackToApp) {
        onBackToApp();
      }
    }, 1200);
  };

  return (
    <div className="min-h-[100dvh] w-full flex bg-stone-900 text-stone-800 font-sans pt-safe pb-safe">
      
      {/* ================= LEFT HALF: DARK ARCHITECTURE HERO ================= */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 text-white overflow-hidden">
        {/* Background Image with Dark Vignette - St. Cecilia's College Building Photo */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/landing-building-2.jpg"
            alt="St. Cecilia's College Architecture"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-45 filter contrast-110 brightness-80 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/50" />
        </div>

        {/* Top Bar: Back Button */}
        <div className="relative z-10">
          {onBackToApp && (
            <button
              onClick={onBackToApp}
              className="inline-flex items-center gap-1.5 text-stone-300 hover:text-white text-xs font-semibold tracking-wider uppercase transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Public Page</span>
            </button>
          )}
        </div>

        {/* Center Hero Content */}
        <div className="relative z-10 max-w-lg my-auto py-8">
          {/* Eyebrow with Team Seal */}
          <div className="flex items-center gap-2.5 mb-4">
            <img
              src="/assets/cecilians-seal.jpg"
              alt="Alumni Cecilian's Logo"
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover border border-white/20 shadow-sm"
            />
            <span className="w-5 h-[2px] bg-[#991B1B]" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#fca5a5]">
              ST. CECILIA'S • ALUMNI
            </span>
          </div>

          {/* Large Serif Heading */}
          <h1 className="font-serif text-5xl xl:text-6xl font-normal text-white tracking-tight leading-[1.1] mb-5">
            {mode === 'login'
              ? 'Welcome Back.'
              : registrationType === 'employer'
              ? 'Hiring Partner Network.'
              : 'Join the Network.'}
          </h1>

          {/* Subtitle */}
          <p className="text-stone-300 text-base xl:text-lg leading-relaxed font-light mb-8">
            {mode === 'login'
              ? 'Sign in to access your alumni network, events, and career opportunities.'
              : registrationType === 'employer'
              ? 'Register your organization to hire certified Cecilian graduates, publish job openings, and access our career recruitment portal.'
              : "Apply for exclusive access to the St. Cecilia's alumni community."}
          </p>

          {/* Stepper (Only on Register Mode) */}
          {mode === 'register' && (
            registrationType === 'employer' ? (
              <div className="space-y-4 pt-4 border-t border-white/10 max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#8B181B] text-white flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <span className="text-sm font-bold text-white">Company Registration</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border border-white/40 text-white/50 flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <span className="text-sm font-medium text-stone-400">Accreditation Verification</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-4 border-t border-white/10 max-w-xs">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      step === 1
                        ? 'bg-white text-stone-950 shadow-md'
                        : step > 1
                        ? 'bg-[#8B181B] text-white'
                        : 'border border-white/40 text-white/50'
                    }`}
                  >
                    {step > 1 ? '✓' : '1'}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step === 1 ? 'text-white font-bold' : step > 1 ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    Student ID Screening
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      step === 2
                        ? 'bg-white text-stone-950 shadow-md'
                        : step > 2
                        ? 'bg-[#8B181B] text-white'
                        : 'border border-white/40 text-white/50'
                    }`}
                  >
                    {step > 2 ? '✓' : '2'}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step === 2 ? 'text-white font-bold' : step > 2 ? 'text-stone-300' : 'text-stone-500'
                    }`}
                  >
                    Account & Profile
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      step === 3
                        ? 'bg-white text-stone-950 shadow-md'
                        : 'border border-white/40 text-white/50'
                    }`}
                  >
                    3
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      step === 3 ? 'text-white font-bold' : 'text-stone-500'
                    }`}
                  >
                    Review & Pledge
                  </span>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer Notes */}
        <div className="relative z-10 text-xs text-stone-400 font-light flex items-center gap-2">
          <span>St. Cecilia's College Global Alumni Association</span>
          <span>•</span>
          <span>Institutional Portal</span>
        </div>
      </div>

      {/* ================= RIGHT HALF: CLEAN WHITE FORM ================= */}
      <div className="w-full lg:w-1/2 bg-white dark:bg-[#111827] flex flex-col justify-center px-4 sm:px-12 xl:px-20 py-8 sm:py-12 overflow-y-auto min-h-[100dvh] lg:max-h-screen relative">
        
        {/* Quick Theme Toggle & Navigation Controls */}
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 z-20">
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle Dark/Light Theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400 stroke-[1.75]" />
            ) : (
              <Moon className="w-5 h-5 stroke-[1.75]" />
            )}
          </button>
        </div>

        {/* Mobile Header (When screen is small) */}
        <div className="lg:hidden mb-6 pb-4 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/assets/cecilians-seal.jpg"
                alt="Alumni Cecilian's Logo"
                referrerPolicy="no-referrer"
                className="w-7 h-7 rounded-full object-cover border border-stone-200"
              />
              <span className="text-xs font-bold uppercase tracking-wider text-[#991B1B]">
                St. Cecilia's Alumni
              </span>
            </div>
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="text-xs text-stone-500 hover:text-stone-800"
              >
                Back to App
              </button>
            )}
          </div>
        </div>

        {/* ========================================================
            VIEW A: SIGN IN FORM (Matches Screenshot 2)
            ======================================================== */}
        {mode === 'login' && (
          <div className="max-w-md w-full mx-auto">
            {/* Form Title & Subtitle */}
            <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal tracking-tight mb-2">
              Sign In
            </h2>
            <p className="text-sm text-stone-500 font-normal mb-6">
              Enter your credentials to access the portal.
            </p>

            {/* Prominent Live Countdown Lockout Banner or Error State */}
            {isLockedOut ? (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border-2 border-red-300 text-red-900 shadow-sm animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-red-100 text-red-700 shrink-0 mt-0.5">
                    <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: '4s' }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-bold text-sm text-red-900 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-red-600" />
                        Account Temporarily Locked
                      </h4>
                      <span className="font-mono text-sm font-black px-2.5 py-0.5 rounded-md bg-red-600 text-white tracking-widest shadow-xs">
                        {formatSecondsToMMSS(lockoutSecondsRemaining)}
                      </span>
                    </div>
                    <p className="text-xs text-red-700 mt-1.5 leading-relaxed">
                      Too many consecutive failed sign-in attempts (3 of 3). For security, sign-in is suspended. Please wait until the timer finishes before trying again.
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-red-200 text-[11px] text-red-700 flex items-center justify-between flex-wrap gap-2">
                      <span>Rate limit rule: 1st trial = 1 min (+2 mins each subsequent trial)</span>
                      <button
                        type="button"
                        onClick={handleOpenForgotPassword}
                        className="font-bold underline text-red-900 hover:text-red-950 cursor-pointer"
                      >
                        Reset Credentials via Email
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : loginError ? (
              <div className="mb-4 p-3.5 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium leading-relaxed">{loginError}</p>
                </div>
              </div>
            ) : failedAttempts > 0 ? (
              <div className="mb-4 p-3 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px] font-medium">
                  {failedAttempts} of 3 attempts used in this trial. {3 - failedAttempts} attempt{3 - failedAttempts > 1 ? 's' : ''} remaining before temporary lockout.
                </span>
              </div>
            ) : null}

            {/* Sign In Form */}
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Identifier Field */}
              <div>
                <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Sign in with Email or SCC ID
                </label>
                <div className="relative">
                  <input
                    type="text"
                    autoComplete="username"
                    required
                    disabled={isLockedOut}
                    value={loginIdentifier}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLoginIdentifier(val);
                      if (val.includes('@')) {
                        setLoginMethod('email');
                      } else {
                        setLoginMethod('studentId');
                      }
                    }}
                    placeholder="e.g. SCC-2020-0192 or maria.santos@alumni.stcecilia.edu"
                    className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B] transition-all disabled:bg-stone-100 disabled:text-stone-400 disabled:cursor-not-allowed"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                  Alumni can sign in using their registered <strong>Email</strong> or official <strong>SCC ID Number</strong> (e.g. <code>SCC-2020-0192</code> or <code>2020-0192</code>).
                </p>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    className="text-xs text-[#8B181B] hover:underline font-semibold cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    disabled={isLockedOut}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-4 pr-11 py-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B] transition-all disabled:bg-stone-100 dark:disabled:bg-stone-800 disabled:text-stone-400 disabled:cursor-not-allowed"
                  />
                  <button
                    type="button"
                    disabled={isLockedOut}
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    aria-label={showLoginPassword ? 'Hide password' : 'Show password'}
                    title={showLoginPassword ? 'Hide password' : 'Show password'}
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      right: '10px',
                      marginTop: 'auto',
                      marginBottom: 'auto',
                      height: '34px',
                      width: '34px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: 'none',
                      translate: 'none'
                    }}
                    className="no-gooey text-stone-400 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800/80 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none z-10"
                  >
                    {showLoginPassword ? (
                      <EyeOff className="w-5 h-5 transition-transform active:scale-90" strokeWidth={1.75} />
                    ) : (
                      <Eye className="w-5 h-5 transition-transform active:scale-90" strokeWidth={1.75} />
                    )}
                  </button>
                </div>
              </div>

              {/* Stay Signed In */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="staySignedIn"
                  disabled={isLockedOut}
                  checked={staySignedIn}
                  onChange={(e) => setStaySignedIn(e.target.checked)}
                  className="w-4 h-4 text-[#8B181B] rounded border-stone-300 focus:ring-[#8B181B] disabled:cursor-not-allowed"
                />
                <label htmlFor="staySignedIn" className="text-xs text-stone-600 select-none">
                  Stay signed in
                </label>
              </div>

              {/* Red Submit Button with dynamic lockout countdown */}
              <button
                type="submit"
                disabled={isLockedOut}
                className={`w-full py-3.5 rounded-xl text-xs font-bold tracking-widest uppercase transition-all shadow-md ${
                  isLockedOut
                    ? 'bg-stone-300 text-stone-600 cursor-not-allowed shadow-none'
                    : 'bg-[#8B181B] hover:bg-[#721316] text-white hover:shadow-lg cursor-pointer'
                }`}
              >
                {isLockedOut
                  ? `LOCKED — TRY AGAIN IN ${formatSecondsToMMSS(lockoutSecondsRemaining)}`
                  : 'SIGN IN'}
              </button>

              {/* Biometric Quick Login (Face Detection & Face ID) */}
              {biometricAvail.isAvailable && (
                <div className="pt-2">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-stone-200"></div>
                    <span className="flex-shrink mx-3 text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                      or facial recognition
                    </span>
                    <div className="flex-grow border-t border-stone-200"></div>
                  </div>
                  <button
                    type="button"
                    disabled={isLockedOut || isBiometricLoading}
                    onClick={handleBiometricSignIn}
                    className="w-full py-3 px-4 rounded-xl border border-stone-200/90 hover:border-[#8B181B] bg-white hover:bg-stone-50/80 text-stone-800 text-xs font-bold tracking-wide transition-all shadow-2xs flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <ScanFace className="w-4 h-4 text-[#8B181B]" />
                    <span>{isBiometricLoading ? 'Detecting Face...' : 'Sign in with Face Detection'}</span>
                  </button>
                </div>
              )}

              {/* Bottom Switcher */}
              <div className="text-center pt-4 text-xs text-stone-500 space-y-1.5">
                <div>
                  Don't have an alumni account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setRegistrationType('alumni');
                      setStep(1);
                    }}
                    className="text-[#8B181B] font-bold hover:underline cursor-pointer"
                  >
                    Register as Alumnus
                  </button>
                </div>
                <div className="text-stone-400">
                  Looking to hire Cecilians?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('register');
                      setRegistrationType('employer');
                    }}
                    className="text-[#8B181B] font-bold hover:underline cursor-pointer"
                  >
                    Register as Employer Partner
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================
            VIEW B: MULTI-STEP REGISTRATION (Matches Screenshot 1)
            ======================================================== */}
        {mode === 'register' && (
          <div className="max-w-md w-full mx-auto">
            {registrationComplete ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
                <h3 className="font-serif text-2xl font-bold text-stone-900">
                  {registrationType === 'employer'
                    ? 'Registration Received — Pending Review'
                    : (studentVerificationStatus === 'verified' || isRegistryMatched)
                    ? "Welcome to St. Cecilia's Alumni!"
                    : "Registration Submitted — Pending Verification"}
                </h3>
                <p className="text-sm text-stone-500 mt-2 max-w-sm mx-auto">
                  {registrationType === 'employer'
                    ? 'Your employer profile has been submitted for institutional accreditation. You cannot log in until the account is approved.'
                    : (studentVerificationStatus === 'verified' || isRegistryMatched)
                    ? 'Your credentials have been verified by the Registrar. Redirecting you to the portal...'
                    : 'Your registration has been recorded. In accordance with institutional policy, unverified alumni cannot log in until their academic records are confirmed by the Office of the Registrar.'}
                </p>
                {!(registrationType !== 'employer' && (studentVerificationStatus === 'verified' || isRegistryMatched)) && (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setRegistrationComplete(false);
                        setMode('login');
                      }}
                      className="px-5 py-2.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-sm font-semibold transition-colors cursor-pointer shadow-xs"
                    >
                      Return to Sign In
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* If user navigated to Employer Registration, provide clean back link to Alumni Registration */}
                {registrationType === 'employer' && (
                  <div className="mb-4">
                    <button
                      type="button"
                      onClick={() => {
                        setRegistrationType('alumni');
                        setEmployerError('');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Alumni Registration</span>
                    </button>
                  </div>
                )}

                {registrationType === 'employer' ? (
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-100 text-[#8B181B] mb-2 border border-red-200">
                      <Building2 className="w-3 h-3" />
                      Corporate Accreditation & Recruitment Partner
                    </div>
                    <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal tracking-tight mb-1">
                      Register Organization
                    </h2>
                    <p className="text-sm text-stone-500 font-normal mb-4">
                      Create an employer account to post career opportunities, browse candidate profiles, and hire certified Cecilian graduates.
                    </p>

                    {/* Notice Banner */}
                    <div className="mb-5 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                      <Briefcase className="w-4 h-4 text-[#8B181B] shrink-0 mt-0.5" />
                      <div className="leading-snug">
                        <span className="font-bold">Employer Placement Accreditation:</span>{' '}
                        <span>
                          Account credentials allow instant access to candidate listings. The Alumni & Placement Office verifies company details before job posts are published to alumni.
                        </span>
                      </div>
                    </div>

                    {employerError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{employerError}</span>
                      </div>
                    )}

                    <form onSubmit={handleEmployerRegister} className="space-y-4">
                      {/* Company Name */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                          Company / Organization Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Building className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g., TechSolutions Philippines Inc."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                          />
                        </div>
                      </div>

                      {/* Industry & Website */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                            Industry Sector <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={companyIndustry}
                            onChange={(e) => setCompanyIndustry(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                          >
                            <option value="Information Technology & Software">Information Technology & Software</option>
                            <option value="BPO & Shared Services">BPO & Shared Services</option>
                            <option value="Healthcare & Nursing">Healthcare & Nursing</option>
                            <option value="Education & Academics">Education & Academics</option>
                            <option value="Engineering & Construction">Engineering & Construction</option>
                            <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                            <option value="Banking & Financial Services">Banking & Financial Services</option>
                            <option value="Retail & E-Commerce">Retail & E-Commerce</option>
                            <option value="Manufacturing & Logistics">Manufacturing & Logistics</option>
                            <option value="Government & Public Sector">Government & Public Sector</option>
                            <option value="Other Industry">Other Industry</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                            Company Website <span className="text-stone-400 font-normal">(optional)</span>
                          </label>
                          <div className="relative">
                            <Globe className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={companyWebsite}
                              onChange={(e) => setCompanyWebsite(e.target.value)}
                              placeholder="https://company.com"
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Office Address / Location */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                          Office / Headquarters Location <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <MapPin className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            placeholder="e.g., Cebu IT Park, Apas, Cebu City"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                          />
                        </div>
                      </div>

                      {/* Contact Person Name & Phone */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                            Contact Person <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              required
                              value={employerContactPerson}
                              onChange={(e) => setEmployerContactPerson(e.target.value)}
                              placeholder="e.g., Juan Dela Cruz (HR)"
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                            Phone / Mobile Number <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="tel"
                              required
                              value={employerPhone}
                              onChange={(e) => setEmployerPhone(e.target.value)}
                              placeholder="+63 917 123 4567"
                              className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Work Email */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                          Official Corporate Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            required
                            value={employerEmail}
                            onChange={(e) => setEmployerEmail(e.target.value)}
                            placeholder="careers@company.com or hr@company.com"
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                          />
                        </div>
                        <p className="text-[11px] text-stone-400 mt-1">This email will be used for applicant notifications and corporate login.</p>
                      </div>

                      {/* Passwords */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                            Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type={showEmployerPassword ? 'text' : 'password'}
                              required
                              value={employerPassword}
                              onChange={(e) => setEmployerPassword(e.target.value)}
                              placeholder="Min. 6 chars"
                              className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowEmployerPassword(!showEmployerPassword)}
                              style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                right: '10px',
                                marginTop: 'auto',
                                marginBottom: 'auto',
                                height: '32px',
                                width: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transform: 'none',
                                translate: 'none'
                              }}
                              className="no-gooey text-stone-400 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer z-10"
                              aria-label={showEmployerPassword ? 'Hide password' : 'Show password'}
                            >
                              {showEmployerPassword ? <EyeOff className="w-4.5 h-4.5" strokeWidth={1.75} /> : <Eye className="w-4.5 h-4.5" strokeWidth={1.75} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                            Confirm Password <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                              type={showEmployerConfirmPassword ? 'text' : 'password'}
                              required
                              value={employerConfirmPassword}
                              onChange={(e) => setEmployerConfirmPassword(e.target.value)}
                              placeholder="Re-enter password"
                              className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B]"
                            />
                            <button
                              type="button"
                              onClick={() => setShowEmployerConfirmPassword(!showEmployerConfirmPassword)}
                              style={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                right: '10px',
                                marginTop: 'auto',
                                marginBottom: 'auto',
                                height: '32px',
                                width: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transform: 'none',
                                translate: 'none'
                              }}
                              className="no-gooey text-stone-400 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer z-10"
                              aria-label={showEmployerConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                              {showEmployerConfirmPassword ? <EyeOff className="w-4.5 h-4.5" strokeWidth={1.75} /> : <Eye className="w-4.5 h-4.5" strokeWidth={1.75} />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Policy acknowledgement */}
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-[#8B181B] shrink-0 mt-0.5" />
                        <span>
                          By registering, you certify that you are an authorized representative of this organization and agree to maintain ethical recruitment standards and Cecilian student privacy.
                        </span>
                      </div>

                      {/* Action Button */}
                      <button
                        type="submit"
                        disabled={isSubmittingEmployer}
                        className="w-full py-3.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold tracking-widest uppercase transition-all shadow-md shadow-red-950/20 hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {isSubmittingEmployer ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <Building2 className="w-4 h-4" />
                            <span>REGISTER COMPANY ACCOUNT</span>
                          </>
                        )}
                      </button>

                      {/* Switch to login */}
                      <div className="text-center pt-2 text-xs text-stone-500">
                        Already have an employer account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setMode('login');
                          }}
                          className="text-[#8B181B] font-bold hover:underline cursor-pointer"
                        >
                          Sign In
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <>
                    {/* NOTICE BANNER: ALUMNI-ONLY REGISTRATION (Only on Step 1) */}
                    {step === 1 && (
                      <div className="mb-5 p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                        <GraduationCap className="w-4 h-4 text-[#8B181B] shrink-0 mt-0.5" />
                        <div className="leading-snug">
                          <span className="font-bold">Official Cecilian Alumni Registration:</span>{' '}
                          <span>
                            Exclusively for graduates and alumni of St. Cecilia’s College. Faculty, staff, and administrators receive pre-configured credentials directly from the Registrar and IT Services.
                          </span>
                        </div>
                      </div>
                    )}

                {/* Multi-Step Animated Progress Indicator */}
                <div className="mb-6 pt-1">
                  <div className="flex items-center justify-between relative">
                    {/* Step 1 Pill */}
                    <div className="flex flex-col items-center gap-1 z-10">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          step === 1
                            ? 'bg-[#8B181B] text-white ring-4 ring-[#8B181B]/15 scale-105 shadow-sm'
                            : step > 1
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {step > 1 ? <Check className="w-4 h-4 stroke-[2.5]" /> : '1'}
                      </div>
                      <span
                        className={`text-[11px] tracking-tight transition-colors ${
                          step === 1
                            ? 'text-[#8B181B] font-bold'
                            : step > 1
                            ? 'text-emerald-700 font-semibold'
                            : 'text-stone-400 font-medium'
                        }`}
                      >
                        Verify Student ID
                      </span>
                    </div>

                    {/* Connecting Track 1 -> 2 */}
                    <div className="flex-1 h-0.5 mx-2 bg-stone-200 relative -top-3">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-500 ease-out"
                        style={{ width: step > 1 ? '100%' : '0%' }}
                      />
                    </div>

                    {/* Step 2 Pill */}
                    <div className="flex flex-col items-center gap-1 z-10">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          step === 2
                            ? 'bg-[#8B181B] text-white ring-4 ring-[#8B181B]/15 scale-105 shadow-sm'
                            : step > 2
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-stone-100 border border-stone-300 text-stone-500'
                        }`}
                      >
                        {step > 2 ? <Check className="w-4 h-4 stroke-[2.5]" /> : '2'}
                      </div>
                      <span
                        className={`text-[11px] tracking-tight transition-colors ${
                          step === 2
                            ? 'text-[#8B181B] font-bold'
                            : step > 2
                            ? 'text-emerald-700 font-semibold'
                            : 'text-stone-400 font-medium'
                        }`}
                      >
                        Account Setup
                      </span>
                    </div>

                    {/* Connecting Track 2 -> 3 */}
                    <div className="flex-1 h-0.5 mx-2 bg-stone-200 relative -top-3">
                      <div
                        className="h-full bg-emerald-600 transition-all duration-500 ease-out"
                        style={{ width: step > 2 ? '100%' : '0%' }}
                      />
                    </div>

                    {/* Step 3 Pill */}
                    <div className="flex flex-col items-center gap-1 z-10">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                          step === 3
                            ? 'bg-[#8B181B] text-white ring-4 ring-[#8B181B]/15 scale-105 shadow-sm'
                            : 'bg-stone-100 border border-stone-300 text-stone-500'
                        }`}
                      >
                        3
                      </div>
                      <span
                        className={`text-[11px] tracking-tight transition-colors ${
                          step === 3 ? 'text-[#8B181B] font-bold' : 'text-stone-400 font-medium'
                        }`}
                      >
                        Review & Pledge
                      </span>
                    </div>
                  </div>
                </div>

                {/* STEP 1: ONLY STUDENT ID COLLECTED & AUTHENTICATE OWNERSHIP */}
                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-50 text-[#8B181B] mb-2 border border-red-200/80">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Official Alumni Verification
                      </div>
                      <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal tracking-tight mb-1">
                        Verify Student ID
                      </h2>
                      <p className="text-sm text-stone-500 font-normal leading-relaxed">
                        Enter your official St. Cecilia’s College Student ID number to authenticate your graduation record with the Registrar.
                      </p>
                    </div>

                    {screeningError && (
                      <div className="mb-4 p-3.5 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200/80 flex items-start gap-2.5 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-semibold block mb-0.5">Verification Notice</span>
                          <p className="leading-relaxed">{screeningError}</p>
                          {!screeningError.toLowerCase().includes('already registered') && (
                            <button
                              type="button"
                              onClick={() => handleOpenManualVerification()}
                              className="mt-2 text-xs font-bold text-[#8B181B] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Request manual registrar record review & verification appeal</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Duplicate Account Alert with direct 1-click Sign In & Dispute Trigger */}
                    {screeningError && screeningError.toLowerCase().includes('already registered') && (
                      <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs flex flex-col gap-2.5 animate-in fade-in">
                        <div className="flex items-center gap-2 font-bold text-amber-800">
                          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Student ID Already Registered</span>
                        </div>
                        <p className="text-amber-800 text-[11px] leading-relaxed">
                          An active alumni account with Student ID <strong>{studentId}</strong> is already registered. If this is your account, please sign in. If someone else claimed your ID or this is an unauthorized duplicate, you can submit an official conflict dispute to the Registrar.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-0.5">
                          <button
                            type="button"
                            onClick={() => {
                              setLoginIdentifier(studentId);
                              setMode('login');
                            }}
                            className="px-3.5 py-2 bg-amber-800 hover:bg-amber-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs hover:shadow-sm"
                          >
                            <span>Sign In With Student ID</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenDispute(studentId)}
                            className="px-3.5 py-2 bg-white hover:bg-amber-100 text-amber-950 border border-amber-300 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-2xs hover:border-amber-400"
                          >
                            <Scale className="w-3.5 h-3.5 text-amber-700" />
                            <span>Dispute Claim (Trigger Conflict)</span>
                          </button>
                        </div>
                      </div>
                    )}

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleProceedFromStep1ToStep2();
                      }}
                      className="space-y-4"
                    >
                      {/* Student ID Field with Interactive Hover Popup */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                              Student ID Number <span className="text-red-600">*</span>
                            </label>

                            {/* Hover Tooltip Popover */}
                            <div className="relative group/tooltip">
                              <button
                                type="button"
                                className="text-stone-400 hover:text-[#8B181B] transition-colors p-0.5 rounded-full hover:bg-stone-100 cursor-help"
                                aria-label="Student ID help"
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                              </button>
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3.5 bg-stone-900 text-stone-100 text-[11px] rounded-xl shadow-2xl pointer-events-none opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 transform translate-y-1 group-hover/tooltip:translate-y-0 border border-stone-800">
                                <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
                                  <School className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Where to find your Student ID?</span>
                                </div>
                                <p className="text-stone-300 leading-relaxed mb-2">
                                  Your official Student ID is printed on your SCC Student/Alumni Card, Official Transcript of Records (TOR), or graduation diploma.
                                </p>
                                <div className="p-1.5 bg-stone-800/90 rounded-lg font-mono text-[10px] text-amber-300 flex items-center justify-between">
                                  <span>Format: SCC-YYYY-XXXX</span>
                                  <span className="text-stone-400">e.g. SCC-2020-0192</span>
                                </div>
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-stone-900" />
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] text-stone-400 font-mono">
                            Format: SCC-YYYY-XXXX
                          </span>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={studentId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStudentId(val);
                              if (studentVerificationStatus !== 'idle') {
                                setStudentVerificationStatus('idle');
                                setVerificationMessage('');
                              }
                            }}
                            placeholder="e.g. SCC-2020-0192"
                            className={`w-full pl-4 pr-10 py-3 bg-white border rounded-xl text-sm font-mono tracking-wide transition-all shadow-2xs ${
                              studentVerificationStatus === 'verified'
                                ? 'border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-semibold'
                                : studentVerificationStatus === 'failed'
                                ? 'border-red-400 ring-2 ring-red-400/20'
                                : 'border-stone-200 focus:border-[#8B181B] focus:ring-2 focus:ring-[#8B181B]/15'
                            }`}
                          />
                          {studentVerificationStatus === 'verified' && (
                            <Check className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2 stroke-[2.5]" />
                          )}
                        </div>
                      </div>

                      {/* Verify & Authenticate Ownership Button with Hover Animation */}
                      <button
                        type="button"
                        disabled={studentVerificationStatus === 'checking' || !studentId.trim()}
                        onClick={() => handleVerifyStudentClick()}
                        className="w-full py-3.5 px-4 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer group"
                      >
                        {studentVerificationStatus === 'checking' ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                            <span>Verifying with Registrar Records...</span>
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                            <span>Verify & Authenticate Ownership</span>
                          </>
                        )}
                      </button>

                      {/* No Student ID / Unlisted Record Helper Card */}
                      <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-2xs">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <HelpCircle className="w-4 h-4 text-stone-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <span className="font-bold text-stone-800 block truncate">
                              No Student ID or graduated before digital records?
                            </span>
                            <span className="text-[11px] text-stone-500 block leading-tight">
                              Submit a direct verification appeal to the Registrar.
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenManualVerification()}
                          className="shrink-0 px-3 py-1.5 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 hover:border-[#8B181B] hover:text-[#8B181B] rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
                        >
                          Request Verification
                        </button>
                      </div>

                      {/* Verified Record Display & Continue Button */}
                      {studentVerificationStatus === 'verified' && verifiedRecord && (
                        <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-2xl space-y-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300 shadow-sm">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span>Identity Record Authenticated</span>
                            </div>
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase tracking-wider">
                              Registrar Confirmed
                            </span>
                          </div>

                          <div className="p-3 bg-white/95 border border-emerald-100 rounded-xl space-y-1.5 shadow-2xs">
                            <div>
                              <span className="text-[10px] text-stone-400 font-semibold uppercase block">
                                Official Student Record
                              </span>
                              <span className="text-sm font-bold text-stone-900">
                                {verifiedRecord.fullName}
                              </span>
                            </div>
                            <div className="pt-1.5 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-600 gap-1">
                              <span className="font-medium text-stone-700">{verifiedRecord.course}</span>
                              <span className="font-semibold text-stone-900">Class of {verifiedRecord.batchYear}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={handleProceedFromStep1ToStep2}
                            className="w-full py-3.5 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold tracking-widest uppercase shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer group"
                          >
                            <span>Continue to Account Setup</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>
                      )}

                      {/* Bottom Switcher */}
                      <div className="text-center pt-2 text-xs text-stone-500">
                        Already have an alumni account?{' '}
                        <button
                          type="button"
                          onClick={() => setMode('login')}
                          className="text-[#8B181B] font-bold hover:underline cursor-pointer"
                        >
                          Sign In
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* STEP 2: ACCOUNT CREDENTIALS (NAME CANNOT BE MODIFIED, DISPLAYS ID RECORD) */}
                {step === 2 && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="mb-4">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-red-50 text-[#8B181B] mb-2 border border-red-200/80">
                        <UserCheck className="w-3.5 h-3.5" />
                        Step 2 of 3 • Account Setup
                      </div>
                      <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal tracking-tight mb-1">
                        Account Credentials
                      </h2>
                      <p className="text-sm text-stone-500 font-normal leading-relaxed">
                        Your identity has been verified. Set up your portal login credentials below.
                      </p>
                    </div>

                    {/* Official Verified Identity Card - Read Only / Locked Name */}
                    <div className="mb-5 p-4 bg-stone-50/90 border border-stone-200 rounded-2xl relative shadow-2xs space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>Official Verified Identity</span>
                        </div>
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-stone-200/80 text-[10px] font-bold text-stone-700">
                          <Lock className="w-3 h-3 text-stone-500" />
                          <span>Locked to Registrar</span>
                        </div>
                      </div>

                      {/* Official Alumnus Name Display - Cannot be modified */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <label className="block text-[10px] font-bold text-stone-600 uppercase tracking-wider">
                              OFFICIAL ALUMNUS NAME
                            </label>

                            {/* Hover Tooltip explaining locked name */}
                            <div className="relative group/tooltip">
                              <button
                                type="button"
                                className="text-stone-400 hover:text-stone-700 transition-colors p-0.5 rounded cursor-help"
                                aria-label="Why name is locked"
                              >
                                <HelpCircle className="w-3 h-3 text-stone-400" />
                              </button>
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 p-3 bg-stone-900 text-stone-100 text-[11px] rounded-xl shadow-xl pointer-events-none opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 transform translate-y-1 group-hover/tooltip:translate-y-0 border border-stone-800">
                                <div className="font-semibold text-white mb-1 flex items-center gap-1">
                                  <Lock className="w-3 h-3 text-amber-400" />
                                  <span>Registrar-Bound Official Name</span>
                                </div>
                                <p className="text-stone-300 leading-snug">
                                  Your legal full name is permanently locked to match official St. Cecilia’s College graduation records to preserve verified institutional credentialing.
                                </p>
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-stone-900" />
                              </div>
                            </div>
                          </div>

                          <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Registrar Verified
                          </span>
                        </div>

                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={verifiedRecord?.fullName || `${firstName} ${lastName}`.trim()}
                            className="w-full pl-9 pr-10 py-2.5 bg-stone-100/90 border border-stone-200/90 text-stone-900 font-semibold rounded-xl text-sm cursor-not-allowed select-none shadow-2xs"
                          />
                          <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-stone-400">
                            <Lock className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* Degree Program & Graduation Batch (Read-Only from ID Record) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-0.5">
                        <div className="p-2.5 bg-white border border-stone-200/80 rounded-xl">
                          <span className="text-[10px] text-stone-400 font-semibold uppercase block">
                            Degree Program
                          </span>
                          <span className="font-semibold text-stone-800 line-clamp-1">
                            {verifiedRecord?.course || course}
                          </span>
                        </div>
                        <div className="p-2.5 bg-white border border-stone-200/80 rounded-xl">
                          <span className="text-[10px] text-stone-400 font-semibold uppercase block">
                            Graduation Batch
                          </span>
                          <span className="font-semibold text-stone-800">
                            Class of {verifiedRecord?.batchYear || batch}
                          </span>
                        </div>
                      </div>

                      {/* Official Alumni ID Preview */}
                      <div className="flex items-center justify-between pt-1 px-1 text-[11px] text-stone-500">
                        <span>Generated Alumni ID:</span>
                        <span className="font-mono font-bold text-[#8B181B] bg-red-50 px-2 py-0.5 rounded border border-red-200/70">
                          {previewAlumniId}
                        </span>
                      </div>
                    </div>

                    {step2Error && (
                      <div className="mb-4 p-3.5 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200/80 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                        <span>{step2Error}</span>
                      </div>
                    )}

                    <form onSubmit={handleProceedFromStep2ToStep3} className="space-y-3.5">
                      {/* Email Address */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                          Portal Email Address <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            required
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="e.g. juan.delacruz@alumni.stcecilia.edu"
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:border-[#8B181B] focus:ring-2 focus:ring-[#8B181B]/15 transition-all"
                          />
                          <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                      </div>

                      {/* Password with Hover Checklist Tooltip */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider">
                              Create Password <span className="text-red-600">*</span>
                            </label>

                            {/* Hover Tooltip for Password Rules */}
                            <div className="relative group/tooltip">
                              <button
                                type="button"
                                className="text-stone-400 hover:text-[#8B181B] transition-colors p-0.5 rounded cursor-help"
                                aria-label="Password rules"
                              >
                                <HelpCircle className="w-3.5 h-3.5" />
                              </button>
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-stone-900 text-stone-100 text-[11px] rounded-xl shadow-xl pointer-events-none opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all duration-200 z-50 transform translate-y-1 group-hover/tooltip:translate-y-0 border border-stone-800">
                                <div className="font-semibold text-white mb-1.5 flex items-center gap-1">
                                  <KeyRound className="w-3 h-3 text-amber-400" />
                                  <span>Password Security Criteria</span>
                                </div>
                                <div className="space-y-1 text-stone-300">
                                  <div
                                    className={`flex items-center gap-1.5 ${
                                      hasMinLength ? 'text-emerald-400 font-semibold' : ''
                                    }`}
                                  >
                                    <span>{hasMinLength ? '✓' : '•'}</span>
                                    <span>At least 8 characters</span>
                                  </div>
                                  <div
                                    className={`flex items-center gap-1.5 ${
                                      hasUppercase ? 'text-emerald-400 font-semibold' : ''
                                    }`}
                                  >
                                    <span>{hasUppercase ? '✓' : '•'}</span>
                                    <span>At least one uppercase letter (A-Z)</span>
                                  </div>
                                  <div
                                    className={`flex items-center gap-1.5 ${
                                      hasNumber ? 'text-emerald-400 font-semibold' : ''
                                    }`}
                                  >
                                    <span>{hasNumber ? '✓' : '•'}</span>
                                    <span>At least one number (0-9)</span>
                                  </div>
                                </div>
                                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-stone-900" />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            required
                            value={regPassword}
                            onChange={(e) => setRegPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full pl-9 pr-10 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:border-[#8B181B] focus:ring-2 focus:ring-[#8B181B]/15 transition-all"
                          />
                          <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            style={{
                              position: 'absolute',
                              top: 0,
                              bottom: 0,
                              right: '10px',
                              marginTop: 'auto',
                              marginBottom: 'auto',
                              height: '32px',
                              width: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transform: 'none',
                              translate: 'none'
                            }}
                            className="no-gooey text-stone-400 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer z-10"
                            aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                          >
                            {showRegPassword ? <EyeOff className="w-4.5 h-4.5" strokeWidth={1.75} /> : <Eye className="w-4.5 h-4.5" strokeWidth={1.75} />}
                          </button>
                        </div>
                      </div>

                      {/* Confirm Password */}
                      <div>
                        <label className="block text-[11px] font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                          Confirm Password <span className="text-red-600">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••••••"
                            className="w-full pl-9 pr-10 py-2.5 bg-white border border-stone-200 rounded-xl text-sm focus:border-[#8B181B] focus:ring-2 focus:ring-[#8B181B]/15 transition-all"
                          />
                          <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                              position: 'absolute',
                              top: 0,
                              bottom: 0,
                              right: '10px',
                              marginTop: 'auto',
                              marginBottom: 'auto',
                              height: '32px',
                              width: '32px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transform: 'none',
                              translate: 'none'
                            }}
                            className="no-gooey text-stone-400 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer z-10"
                            aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                          >
                            {showConfirmPassword ? <EyeOff className="w-4.5 h-4.5" strokeWidth={1.75} /> : <Eye className="w-4.5 h-4.5" strokeWidth={1.75} />}
                          </button>
                        </div>
                      </div>

                      {/* Optional Phone & Location */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-0.5">
                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                            Contact Number <span className="text-stone-400 font-normal">(optional)</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+63 917 123 4567"
                              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-sm"
                            />
                            <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                            Residence / City <span className="text-stone-400 font-normal">(optional)</span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                              placeholder="Cebu, Philippines"
                              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-sm"
                            />
                            <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          </div>
                        </div>
                      </div>

                      {/* Navigation Buttons */}
                      <div className="flex gap-3 pt-3">
                        <button
                          type="button"
                          onClick={() => setStep(1)}
                          className="w-1/3 py-3 border border-stone-300 hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-700 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                        >
                          BACK
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold tracking-widest uppercase shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 group"
                        >
                          <span>Continue to Review & Pledge</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* STEP 3: REVIEW APPLICATION & CECILIAN ALUMNI PLEDGE */}
                {step === 3 && (
                  <div>
                    <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8B181B] mb-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Step 3 of 3 · Final Verification & Covenants</span>
                    </div>
                    <h2 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal tracking-tight mb-1">
                      Review & Honor Pledge
                    </h2>
                    <p className="text-sm text-stone-500 font-normal mb-5">
                      Verify your alumni credentials before submitting to St. Cecilia’s College alumni portal.
                    </p>

                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3 text-xs mb-5">
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span className="text-stone-500">Official Alumni ID</span>
                        <div className="text-right">
                          <span className="font-mono font-bold text-[#8B181B] text-sm">{previewAlumniId}</span>
                          <span className="text-[10px] text-stone-500 block font-mono">Academic Student ID: {studentId}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold block">
                            <Check className="w-3 h-3 text-emerald-600 inline" />
                            Official Registrar Screened
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span className="text-stone-500">Alumnus Name</span>
                        <span className="font-bold text-stone-900">{firstName} {lastName}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span className="text-stone-500">Degree & Batch</span>
                        <span className="font-semibold text-stone-800">{course} • Class of {batch}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span className="text-stone-500">Portal Email</span>
                        <span className="font-semibold text-stone-800">{regEmail}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-200 pb-2">
                        <span className="text-stone-500">Residence</span>
                        <span className="text-stone-800">{location || 'Cebu, Philippines'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Community Role</span>
                        <span className="font-bold uppercase text-[#8B181B] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          Alumni Member
                        </span>
                      </div>
                    </div>

                    {/* DATA PRIVACY ACT & INSTITUTIONAL COMPLIANCE SECTION */}
                    <div className="p-4 sm:p-5 bg-stone-50/70 border border-stone-200/90 rounded-2xl mb-5 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                      {/* Section Header with All-Select Action */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-3.5 border-b border-stone-200/80">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-red-100/80 text-[#8B181B] flex items-center justify-center shrink-0">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-stone-900 text-xs sm:text-sm">
                              Compliance & Institutional Covenants
                            </h3>
                            <p className="text-[11px] text-stone-500">
                              Data Privacy Act (RA 10173) & Cecilian Directory Governance
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2.5">
                          <span className="text-[11px] font-medium">
                            {allConsentsAgreed ? (
                              <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                All 3 confirmed
                              </span>
                            ) : (
                              <span className="text-stone-500">
                                {(agreedToPrivacyConsent ? 1 : 0) + (agreedToZeroDisclosure ? 1 : 0) + (agreedToTerms ? 1 : 0)} of 3 confirmed
                              </span>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={toggleAllConsents}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-stone-200 bg-white text-stone-700 hover:text-[#8B181B] hover:border-red-200 hover:bg-red-50/30 transition-all cursor-pointer shadow-2xs"
                          >
                            {allConsentsAgreed ? 'Clear All' : 'Agree to All'}
                          </button>
                        </div>
                      </div>

                      {/* 3 Structured Consent Cards */}
                      <div className="space-y-2.5">
                        {/* 1. Data Privacy Act (RA 10173) */}
                        <div
                          role="checkbox"
                          tabIndex={0}
                          aria-checked={agreedToPrivacyConsent}
                          onClick={() => setAgreedToPrivacyConsent(!agreedToPrivacyConsent)}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              setAgreedToPrivacyConsent(!agreedToPrivacyConsent);
                            }
                          }}
                          className={`group relative p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                            agreedToPrivacyConsent
                              ? 'bg-red-50/30 border-red-200/90 shadow-2xs'
                              : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5 shrink-0">
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                  agreedToPrivacyConsent
                                    ? 'bg-[#8B181B] border-[#8B181B] text-white shadow-2xs'
                                    : 'border-stone-300 bg-white group-hover:border-stone-400'
                                }`}
                              >
                                {agreedToPrivacyConsent && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                                <span className="font-semibold text-stone-900 text-xs sm:text-sm">
                                  Data Privacy Consent (RA 10173)
                                </span>
                                <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                                  Required by Law
                                </span>
                              </div>
                              <p className="text-xs text-stone-600 leading-relaxed">
                                I consent to the collection, secure storage, and institutional processing of my academic, graduation, and tracer records by St. Cecilia’s College - Cebu, Inc. strictly for official alumni records and CHED compliance.
                              </p>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowPrivacyDetails(!showPrivacyDetails);
                                }}
                                className="mt-2 text-[11px] font-medium text-[#8B181B] hover:text-[#721316] inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>{showPrivacyDetails ? 'Hide details' : 'View official purposes & statutory safeguards'}</span>
                                {showPrivacyDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>

                              {showPrivacyDetails && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-2.5 pt-2.5 border-t border-stone-200/70 text-[11px] text-stone-600 space-y-1.5"
                                >
                                  <p className="font-medium text-stone-700">Official Institutional Scope under RA 10173:</p>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 pt-0.5">
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B181B] shrink-0" />
                                      <span>Alumni record & registrar verification</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B181B] shrink-0" />
                                      <span>Official college communications</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B181B] shrink-0" />
                                      <span>Reunions, convocations & campus events</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B181B] shrink-0" />
                                      <span>CHED graduate tracer study reporting</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B181B] shrink-0" />
                                      <span>Career placement & professional tracking</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <span className="w-1.5 h-1.5 rounded-full bg-[#8B181B] shrink-0" />
                                      <span>Zero commercial sharing / marketing guarantee</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 2. Zero Disclosure & Confidentiality */}
                        <div
                          role="checkbox"
                          tabIndex={0}
                          aria-checked={agreedToZeroDisclosure}
                          onClick={() => setAgreedToZeroDisclosure(!agreedToZeroDisclosure)}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              setAgreedToZeroDisclosure(!agreedToZeroDisclosure);
                            }
                          }}
                          className={`group relative p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                            agreedToZeroDisclosure
                              ? 'bg-amber-50/30 border-amber-200/90 shadow-2xs'
                              : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5 shrink-0">
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                  agreedToZeroDisclosure
                                    ? 'bg-[#8B181B] border-[#8B181B] text-white shadow-2xs'
                                    : 'border-stone-300 bg-white group-hover:border-stone-400'
                                }`}
                              >
                                {agreedToZeroDisclosure && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                                <span className="font-semibold text-stone-900 text-xs sm:text-sm">
                                  Zero Disclosure & Directory Confidentiality
                                </span>
                                <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                                  Directory Covenant
                                </span>
                              </div>
                              <p className="text-xs text-stone-600 leading-relaxed">
                                I agree to protect fellow Cecilians' directory privacy and pledge never to disclose, scrape, export, or commercially distribute alumni profiles, phone numbers, or contact records.
                              </p>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowZeroDisclosureDetails(!showZeroDisclosureDetails);
                                }}
                                className="mt-2 text-[11px] font-medium text-[#8B181B] hover:text-[#721316] inline-flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <span>{showZeroDisclosureDetails ? 'Hide details' : 'View directory terms & safeguards'}</span>
                                {showZeroDisclosureDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>

                              {showZeroDisclosureDetails && (
                                <div
                                  onClick={(e) => e.stopPropagation()}
                                  className="mt-2.5 pt-2.5 border-t border-stone-200/70 text-[11px] text-stone-600 leading-relaxed"
                                >
                                  Member contact records, phone numbers, and graduation credentials are provided strictly for collegiate networking and campus engagement. Automated crawling, third-party marketing solicitation, and bulk extraction are strictly prohibited under institutional cybersecurity guidelines.
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* 3. Cecilian Alumni Honor Pledge */}
                        <div
                          role="checkbox"
                          tabIndex={0}
                          aria-checked={agreedToTerms}
                          onClick={() => setAgreedToTerms(!agreedToTerms)}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              setAgreedToTerms(!agreedToTerms);
                            }
                          }}
                          className={`group relative p-3.5 rounded-xl border transition-all duration-150 cursor-pointer select-none ${
                            agreedToTerms
                              ? 'bg-red-50/30 border-red-200/90 shadow-2xs'
                              : 'bg-white border-stone-200 hover:border-stone-300 hover:bg-stone-50/50'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5 shrink-0">
                              <div
                                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                                  agreedToTerms
                                    ? 'bg-[#8B181B] border-[#8B181B] text-white shadow-2xs'
                                    : 'border-stone-300 bg-white group-hover:border-stone-400'
                                }`}
                              >
                                {agreedToTerms && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1">
                                <span className="font-semibold text-stone-900 text-xs sm:text-sm">
                                  Cecilian Alumni Honor Pledge
                                </span>
                                <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-md bg-stone-100 text-stone-600">
                                  Honor Code
                                </span>
                              </div>
                              <p className="text-xs text-stone-600 leading-relaxed">
                                I solemnly affirm that I am an alumnus/graduate of <strong className="text-stone-800">St. Cecilia’s College - Cebu, Inc.</strong> and pledge to uphold the collegiate values of <span className="font-medium text-stone-900">Excellence, Integrity, and Compassionate Service</span>, adhering to all portal terms of use.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="w-1/3 py-3.5 border border-stone-300 hover:bg-stone-50 rounded-xl text-xs font-bold text-stone-700 transition-colors cursor-pointer"
                      >
                        BACK
                      </button>
                      <button
                        type="button"
                        disabled={!allConsentsAgreed}
                        onClick={handleCompleteRegistration}
                        className={`flex-1 py-3.5 rounded-xl text-xs font-bold tracking-widest uppercase shadow-md transition-all ${
                          allConsentsAgreed
                            ? 'bg-[#8B181B] hover:bg-[#721316] text-white cursor-pointer shadow-red-950/20 hover:shadow-lg active:scale-[0.99]'
                            : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                        }`}
                      >
                        {allConsentsAgreed ? 'COMPLETE ALUMNI REGISTRATION' : 'CONFIRM ALL CONSENTS TO FINISH'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            </>
          )}
          </div>
        )}
      </div>

      {/* FORGOT PASSWORD MODAL */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        initialEmail={forgotEmail || (loginIdentifier?.includes('@') ? loginIdentifier.trim() : '')}
        onClose={() => setShowForgotModal(false)}
        onSuccess={handlePasswordResetSuccess}
      />

      {/* ========================================================
          ID DISPUTE & REGISTRATION CONFLICT MODAL
          ======================================================== */}
      {showDisputeModal && (
        <div
          className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setShowDisputeModal(false)}
        >
          <div
            className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {disputeReferenceId ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200 shadow-2xs">
                  <Scale className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300">
                    Conflict Case Flagged: #{disputeReferenceId}
                  </span>
                  <h3 className="text-xl font-bold font-serif text-stone-900 mt-2">
                    ID Dispute Submitted to Registrar
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto mt-2">
                    Your claim for Student ID <strong>{disputeStudentId || studentId}</strong> has been logged in the official <strong>Requests & Conflicts</strong> queue. A Registrar Officer will review your academic credentials and initiate hearing resolution.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisputeModal(false);
                      setDisputeReferenceId(null);
                    }}
                    className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                      <Scale className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-stone-900">Dispute Student ID Claim</h3>
                      <p className="text-xs text-stone-500">Report duplicate registration conflict to the Registrar</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(false)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleDisputeSubmit} className="space-y-4 mt-5">
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                    Student ID <strong>{disputeStudentId || studentId}</strong> is already registered. If someone registered using your credentials, submit your details below to place this in the Registrar Requests & Conflicts hearing queue.
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Contested Student ID Number
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={disputeStudentId || studentId}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-100 font-mono text-xs font-bold text-stone-700 cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Your Full Legal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={disputeFullName}
                      onChange={(e) => setDisputeFullName(e.target.value)}
                      placeholder="e.g. Maria Santos Dela Cruz"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B181B]/20"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Your Contact Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={disputeEmail}
                      onChange={(e) => setDisputeEmail(e.target.value)}
                      placeholder="name@email.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B181B]/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Degree Program
                      </label>
                      <select
                        value={disputeCourse}
                        onChange={(e) => setDisputeCourse(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900"
                      >
                        {allDegreeOptions.map((prog) => (
                          <option key={prog} value={prog}>
                            {prog}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Graduation Batch Year
                      </label>
                      <select
                        value={disputeBatch}
                        onChange={(e) => setDisputeBatch(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900"
                      >
                        {centenaryBatches.map((yr) => (
                          <option key={yr} value={yr}>
                            Class of {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Dispute Explanation & Supporting Statement <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={disputeReason}
                      onChange={(e) => setDisputeReason(e.target.value)}
                      placeholder="Explain why this ID belongs to you (e.g. graduation year, transcript details, previous student number)..."
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900 resize-none focus:outline-none focus:ring-2 focus:ring-[#8B181B]/20"
                    />
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowDisputeModal(false)}
                      className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Submit ID Dispute</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          MANUAL ALUMNI VERIFICATION REQUEST MODAL (NO ID)
          ======================================================== */}
      {showManualVerificationModal && (
        <div
          className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
          onClick={() => setShowManualVerificationModal(false)}
        >
          <div
            className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full p-6 sm:p-7 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {manualReferenceId ? (
              <div className="text-center py-6 space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
                  <CheckCircle2 className="w-7 h-7 stroke-[2]" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-300">
                    Appeal Reference: #{manualReferenceId}
                  </span>
                  <h3 className="text-xl font-bold font-serif text-stone-900 mt-2">
                    Verification Appeal Received
                  </h3>
                  <p className="text-xs text-stone-500 leading-relaxed max-w-sm mx-auto mt-2">
                    Your manual verification request has been queued in the <strong>Requests & Conflicts</strong> inbox. The Registrar will review your academic archives and update your status.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowManualVerificationModal(false);
                      setManualReferenceId(null);
                    }}
                    className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Done & Return to Sign In
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between pb-4 border-b border-stone-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-red-50 text-[#8B181B] flex items-center justify-center">
                      <FileText className="w-4 h-4 stroke-[2]" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-stone-900">Manual Verification Request</h3>
                      <p className="text-xs text-stone-500">For unlisted records or alumni without an electronic ID</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualVerificationModal(false)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleManualVerificationSubmit} className="space-y-3.5 mt-4">
                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl text-[11px] text-stone-600 leading-relaxed">
                    If you graduated before modern Student IDs were assigned or cannot locate your ID, submit your details. The Registrar will verify your graduation records against the university archives.
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Full Legal Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={manualFullName}
                      onChange={(e) => setManualFullName(e.target.value)}
                      placeholder="e.g. Maria Santos Dela Cruz"
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#8B181B]/20"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Degree Program <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={manualCourse}
                        onChange={(e) => setManualCourse(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900"
                      >
                        {allDegreeOptions.map((prog) => (
                          <option key={prog} value={prog}>
                            {prog}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Graduation Batch Year <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={manualBatch}
                        onChange={(e) => setManualBatch(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900"
                      >
                        {centenaryBatches.map((yr) => (
                          <option key={yr} value={yr}>
                            Class of {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Contact Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={manualEmail}
                        onChange={(e) => setManualEmail(e.target.value)}
                        placeholder="you@email.com"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium text-stone-900"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-stone-700 block mb-1">
                        Mobile / Phone Number
                      </label>
                      <input
                        type="tel"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        placeholder="+63 917 123 4567"
                        className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Account Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showManualPassword ? 'text' : 'password'}
                        required
                        value={manualPassword}
                        onChange={(e) => setManualPassword(e.target.value)}
                        placeholder="Min. 8 characters"
                        className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowManualPassword(!showManualPassword)}
                        style={{
                          position: 'absolute',
                          top: 0,
                          bottom: 0,
                          right: '10px',
                          marginTop: 'auto',
                          marginBottom: 'auto',
                          height: '30px',
                          width: '30px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transform: 'none',
                          translate: 'none'
                        }}
                        className="no-gooey text-stone-400 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 cursor-pointer z-10"
                        aria-label={showManualPassword ? 'Hide password' : 'Show password'}
                      >
                        {showManualPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.75} /> : <Eye className="w-4 h-4" strokeWidth={1.75} />}
                      </button>
                    </div>
                    <span className="text-[10px] text-stone-400 mt-0.5 block">
                      This password will activate once the Registrar approves your account.
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-stone-700 block mb-1">
                      Academic Details & Remarks
                    </label>
                    <textarea
                      rows={2}
                      value={manualNotes}
                      onChange={(e) => setManualNotes(e.target.value)}
                      placeholder="e.g., Campus branch, old student number, honors, or attendance years..."
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900 resize-none"
                    />
                  </div>

                  <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowManualVerificationModal(false)}
                      className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingAppeal}
                      className="px-5 py-2 bg-[#8B181B] hover:bg-[#721316] text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingAppeal ? 'Submitting...' : 'Submit Verification Request'}</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
