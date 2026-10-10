import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Sparkles,
  X,
  Building,
  HelpCircle
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';

interface RegistrarSelfVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RegistrarSelfVerificationModalContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { currentUser, selfVerifyAlumniWithRegistry } = useAlumni();
  const [studentIdInput, setStudentIdInput] = useState(currentUser?.studentId || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  if (!currentUser) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentIdInput.trim()) return;

    setIsVerifying(true);
    setResult(null);

    try {
      const res = await selfVerifyAlumniWithRegistry(studentIdInput.trim());
      setResult(res);
      if (res.success) {
        setTimeout(() => {
          // Keep open momentarily for celebratory feedback, or user can close
        }, 1500);
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: err?.message || 'Verification process encountered an unexpected error. Please try again.'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      id="registrar-self-verification-modal-overlay"
      className="fixed inset-0 z-50 bg-black/70 dark:bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="registrar-self-verification-modal-container"
        className="relative my-auto bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-stone-200 dark:border-stone-800 max-w-lg w-full p-5 sm:p-6 text-stone-900 dark:text-stone-100 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-[#8B181B] dark:text-red-400 border border-red-100 dark:border-red-900/60 shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-white leading-tight">
                Registrar Degree Verification
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                Office of the Registrar • St. Cecilia's College Official Archives
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informational Guidance */}
        <div className="mt-4 p-3.5 bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 rounded-xl text-xs text-stone-600 dark:text-stone-300 space-y-1">
          <p className="font-semibold text-stone-900 dark:text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Why verify your degree?</span>
          </p>
          <p className="text-[11px] leading-relaxed text-stone-500 dark:text-stone-400">
            Matching your profile with institutional graduation records awards the gold
            <strong className="text-stone-700 dark:text-stone-200"> Verified Alum</strong> seal, activates peer-to-peer alumni messaging,
            and validates your alumni digital pass for campus turnstile access.
          </p>
        </div>

        {/* Current User Summary */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs bg-stone-50 dark:bg-stone-800/60 p-3.5 rounded-xl border border-stone-200/70 dark:border-stone-700/60">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 block">Name</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200 truncate block">{currentUser.name}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 block">Email</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200 truncate block">{currentUser.email}</span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 block">Current Status</span>
            <span className={`font-semibold inline-flex items-center gap-1 ${
              currentUser.isVerified ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
            }`}>
              {currentUser.isVerified ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Verified Cecilian Alum
                </>
              ) : (
                'Pending Official Verification'
              )}
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 dark:text-stone-500 block">Batch / Course</span>
            <span className="font-semibold text-stone-800 dark:text-stone-200 truncate block">
              {currentUser.batch || '—'} • {currentUser.course || '—'}
            </span>
          </div>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerify} className="mt-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-stone-700 dark:text-stone-300 block mb-1">
              Institutional Student ID Number *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={studentIdInput}
                onChange={(e) => setStudentIdInput(e.target.value)}
                placeholder="e.g. SC-2020-0192 or SCC-2022-0142"
                className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#8B181B] font-mono uppercase tracking-wider"
              />
              <Search className="w-4 h-4 text-stone-400 dark:text-stone-500 absolute right-3 top-3 pointer-events-none" />
            </div>
            <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-1">
              Found on your official diploma, transcript of records (TOR), or former student ID.
            </p>
          </div>

          {/* Feedback Display */}
          {result && (
            <div
              className={`p-4 rounded-xl border text-xs leading-relaxed animate-in fade-in ${
                result.success
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {result.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-xs">
                    {result.success ? 'Verification Confirmed!' : 'Verification Unsuccessful'}
                  </h4>
                  <p className="mt-0.5 text-[11px]">{result.message}</p>

                  {!result.success && (
                    <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-800 text-[10px] text-rose-700 dark:text-rose-300 space-y-0.5">
                      <p className="font-semibold">Troubleshooting Steps:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li>Verify the Student ID matches the format on your diploma (e.g. SC-YYYY-XXXX).</li>
                        <li>Ensure your name on this account matches your official matriculation records.</li>
                        <li>If you graduated prior to 2010, request manual digitization via the Registrar Office.</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer"
            >
              {result?.success ? 'Done' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isVerifying || !studentIdInput.trim()}
              className="px-5 py-2.5 bg-[#8B181B] hover:bg-[#721316] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Matching Registrar Archives...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{currentUser.isVerified ? 'Re-verify with Registrar' : 'Verify My Degree'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const RegistrarSelfVerificationModal: React.FC<RegistrarSelfVerificationModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;
  return <RegistrarSelfVerificationModalContent onClose={onClose} />;
};
