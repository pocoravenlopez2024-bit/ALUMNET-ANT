import React, { useState, useEffect } from 'react';
import {
  Mail,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  ShieldCheck,
  Check,
  Copy,
  ChevronLeft
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  initialEmail?: string;
  onClose: () => void;
  onSuccess: (email: string, newPassword?: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  initialEmail = '',
  onClose,
  onSuccess
}) => {
  const { users, resetUserPasswordByEmail, showToast } = useAlumni();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [email, setEmail] = useState(initialEmail);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Verification code state
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeExpiry, setCodeExpiry] = useState<number>(0);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // New password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Reset or initialize when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setErrorMsg('');
      setVerificationCode('');
      setGeneratedCode('');
      setNewPassword('');
      setConfirmPassword('');
      if (initialEmail && initialEmail.includes('@')) {
        setEmail(initialEmail.trim());
      }
    }
  }, [isOpen, initialEmail]);

  // Resend countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  if (!isOpen) return null;

  // Password validation checks
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isNewPasswordValid = hasMinLength && hasUppercase && hasNumber && passwordsMatch;

  // STEP 1: Request code by email
  const handleSendCode = (targetEmail?: string) => {
    const emailToTest = (targetEmail || email).trim().toLowerCase();
    setErrorMsg('');

    if (!emailToTest || !emailToTest.includes('@')) {
      setErrorMsg('Please provide a valid email address.');
      return;
    }

    // Check if account exists
    const matchedAccount = users.find((u) => u.email.toLowerCase() === emailToTest);
    if (!matchedAccount) {
      setErrorMsg('No registered account found with that email address. Please verify your email or register an account.');
      return;
    }

    // Generate random 6-digit numeric OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(otp);
    setCodeExpiry(Date.now() + 10 * 60 * 1000); // 10 minutes expiry
    setResendCooldown(30); // 30 seconds cooldown
    setEmail(emailToTest);
    setVerificationCode('');
    setStep(2);
    showToast(`Verification code dispatched to ${emailToTest}`);
  };

  // STEP 2: Verify code
  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const entered = verificationCode.trim();
    if (!entered) {
      setErrorMsg('Please enter the 6-digit verification code.');
      return;
    }

    if (Date.now() > codeExpiry) {
      setErrorMsg('The verification code has expired. Please click "Resend Code" to generate a new one.');
      return;
    }

    if (entered !== generatedCode) {
      setErrorMsg('Invalid verification code. Please check your simulated dispatch box or re-enter.');
      return;
    }

    // Code verified
    setErrorMsg('');
    setStep(3);
  };

  // STEP 3: Submit new password
  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!isNewPasswordValid) {
      if (!hasMinLength) {
        setErrorMsg('Password must be at least 8 characters long.');
        return;
      }
      if (!hasUppercase) {
        setErrorMsg('Password must contain at least one uppercase letter (A-Z).');
        return;
      }
      if (!hasNumber) {
        setErrorMsg('Password must contain at least one number (0-9).');
        return;
      }
      if (!passwordsMatch) {
        setErrorMsg('Passwords do not match.');
        return;
      }
      return;
    }

    const success = resetUserPasswordByEmail(email.trim(), newPassword);
    if (!success) {
      setErrorMsg('Could not update password. Please check that the email is valid and try again.');
      return;
    }

    // Advance to success view
    setStep(4);
  };

  return (
    <div
      id="forgot-password-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 pt-safe pb-safe overflow-y-auto animate-fadeIn"
    >
      <div
        id="forgot-password-modal-card"
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90dvh] overflow-y-auto border border-stone-200 my-auto text-stone-900 flex flex-col"
      >
        {/* Institutional Crimson Header */}
        <div className="bg-[#8B181B] text-white px-6 py-4 flex items-center justify-between relative overflow-hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <ShieldCheck className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="text-[10px] font-bold tracking-widest text-white/70 uppercase">
                St. Cecilia’s College Portal
              </div>
              <h3 className="font-serif font-bold text-base text-white">
                Account Recovery
              </h3>
            </div>
          </div>
          <button
            id="forgot-password-close-btn"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="bg-stone-50 border-b border-stone-200 px-6 py-2.5 flex items-center justify-between text-[11px] font-medium text-stone-500">
          <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-[#8B181B] font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step > 1 ? 'bg-emerald-600 text-white' : step === 1 ? 'bg-[#8B181B] text-white' : 'bg-stone-200 text-stone-600'
            }`}>
              {step > 1 ? '✓' : '1'}
            </span>
            <span>Identify</span>
          </div>

          <div className="w-6 h-px bg-stone-300" />

          <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-[#8B181B] font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step > 2 ? 'bg-emerald-600 text-white' : step === 2 ? 'bg-[#8B181B] text-white' : 'bg-stone-200 text-stone-600'
            }`}>
              {step > 2 ? '✓' : '2'}
            </span>
            <span>Verify</span>
          </div>

          <div className="w-6 h-px bg-stone-300" />

          <div className={`flex items-center gap-1.5 ${step >= 3 ? 'text-[#8B181B] font-bold' : ''}`}>
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
              step > 3 ? 'bg-emerald-600 text-white' : step === 3 ? 'bg-[#8B181B] text-white' : 'bg-stone-200 text-stone-600'
            }`}>
              {step > 3 ? '✓' : '3'}
            </span>
            <span>New Password</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-800 text-xs border border-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMsg}</div>
            </div>
          )}

          {/* ==================== STEP 1: IDENTIFY EMAIL ==================== */}
          {step === 1 && (
            <div>
              <div className="text-center mb-5">
                <div className="w-12 h-12 rounded-full bg-red-50 text-[#8B181B] flex items-center justify-center mx-auto mb-2 border border-red-100">
                  <Mail className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-lg text-stone-900">
                  Forgot Your Password?
                </h4>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Enter your registered institutional or alumni email address to receive a secure 6-digit verification code.
                </p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSendCode(); }} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                    REGISTERED EMAIL ADDRESS
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. maria.santos@stcecilia.edu"
                      className="w-full pl-10 pr-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B] transition-all"
                    />
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-1/3 py-2.5 px-4 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2.5 px-4 rounded-xl bg-[#8B181B] hover:bg-[#721316] text-white text-xs font-bold tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Send Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==================== STEP 2: VERIFY 6-DIGIT CODE ==================== */}
          {step === 2 && (
            <div>
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-50 text-[#8B181B] flex items-center justify-center mx-auto mb-2 border border-red-100">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-lg text-stone-900">
                  Verify Your Identity
                </h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  We've dispatched a 6-digit security code to:
                  <br />
                  <span className="font-semibold text-stone-800">{email}</span>
                </p>
                <button
                  type="button"
                  onClick={() => { setStep(1); setErrorMsg(''); }}
                  className="text-[11px] text-[#8B181B] hover:underline font-semibold mt-1 inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-3 h-3" /> Change email address
                </button>
              </div>

              {/* Simulated Email Inbox Dispatch Alert with 1-Click Autofill */}
              <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs shadow-xs">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-[11px] uppercase tracking-wider text-amber-800">
                    <Mail className="w-3.5 h-3.5 text-amber-700" />
                    <span>Simulated Campus Mail Dispatch</span>
                  </div>
                  <span className="text-[10px] bg-amber-200 text-amber-900 px-1.5 py-0.5 rounded-md font-mono">
                    Official Notice
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed mb-2">
                  St. Cecilia’s Identity Protection has generated code:
                  <strong className="font-mono text-sm tracking-widest text-[#8B181B] ml-1 px-1.5 py-0.5 bg-white rounded border border-amber-200">
                    {generatedCode}
                  </strong>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setVerificationCode(generatedCode);
                    setCopiedCode(true);
                    setTimeout(() => setCopiedCode(false), 2000);
                  }}
                  className="w-full py-1.5 px-3 bg-white hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Autofilled Code!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-amber-700" />
                      <span>Click to Autofill Code</span>
                    </>
                  )}
                </button>
              </div>

              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5 text-center">
                    ENTER 6-DIGIT VERIFICATION CODE
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center text-2xl font-mono font-bold tracking-[0.4em] py-3 bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B] transition-all"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-stone-500 pt-1">
                  <span>Didn't get the code?</span>
                  <button
                    type="button"
                    disabled={resendCooldown > 0}
                    onClick={() => handleSendCode(email)}
                    className="font-semibold text-[#8B181B] hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${resendCooldown > 0 ? 'animate-spin' : ''}`} />
                    <span>
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-2.5 px-4 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-2.5 px-4 rounded-xl bg-[#8B181B] hover:bg-[#721316] text-white text-xs font-bold tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all"
                  >
                    <span>Verify Code</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==================== STEP 3: CREATE NEW PASSWORD ==================== */}
          {step === 3 && (
            <div>
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-2 border border-emerald-100">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-lg text-stone-900">
                  Create New Password
                </h4>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  Identity confirmed for <span className="font-semibold text-stone-800">{email}</span>.
                  <br />
                  Set a new, strong password below.
                </p>
              </div>

              <form onSubmit={handleResetPasswordSubmit} className="space-y-4">
                {/* New Password */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                    NEW PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-4 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase tracking-wider mb-1.5">
                    CONFIRM NEW PASSWORD
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full pl-4 pr-10 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#8B181B]/20 focus:border-[#8B181B] transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Requirements Checklist */}
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 text-xs">
                  <div className="text-[11px] font-bold text-stone-600 mb-1">
                    Password Requirements:
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-700 font-semibold' : 'text-stone-500'}`}>
                      {hasMinLength ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0" />}
                      <span>8+ characters</span>
                    </div>

                    <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-700 font-semibold' : 'text-stone-500'}`}>
                      {hasUppercase ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0" />}
                      <span>1 uppercase letter</span>
                    </div>

                    <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-semibold' : 'text-stone-500'}`}>
                      {hasNumber ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0" />}
                      <span>1 number (0-9)</span>
                    </div>

                    <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-700 font-semibold' : 'text-stone-500'}`}>
                      {passwordsMatch ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0" />}
                      <span>Passwords match</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-1/3 py-2.5 px-4 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!isNewPasswordValid}
                    className="w-2/3 py-2.5 px-4 rounded-xl bg-[#8B181B] hover:bg-[#721316] text-white text-xs font-bold tracking-wider uppercase shadow-md flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span>Save Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ==================== STEP 4: SUCCESS CONFIRMATION ==================== */}
          {step === 4 && (
            <div className="text-center py-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <h4 className="font-serif font-bold text-xl text-stone-900">
                Password Reset Complete!
              </h4>

              <p className="text-xs text-stone-600 mt-2 max-w-xs mx-auto leading-relaxed">
                Your credentials for <strong className="text-stone-900">{email}</strong> have been securely updated. Any temporary login lockout on your account has been cleared.
              </p>

              <div className="mt-6 p-4 rounded-xl bg-stone-50 border border-stone-200 text-left text-xs space-y-2">
                <div className="flex items-center justify-between text-stone-700">
                  <span className="text-stone-500">Account:</span>
                  <span className="font-semibold">{email}</span>
                </div>
                <div className="flex items-center justify-between text-stone-700">
                  <span className="text-stone-500">Security Status:</span>
                  <span className="font-semibold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" /> Active & Unlocked
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="forgot-password-signin-btn"
                onClick={() => onSuccess(email, newPassword)}
                className="w-full mt-6 py-3.5 rounded-xl bg-[#8B181B] hover:bg-[#721316] text-white text-xs font-bold tracking-widest uppercase shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <span>Sign In with New Password</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
