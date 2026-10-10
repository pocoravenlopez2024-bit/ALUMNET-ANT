import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  ArrowRight,
  Lock,
  Mail,
  Building,
  RefreshCw
} from 'lucide-react';
import { useAlumni } from '../../context/AlumniContext';
import { RegistrarVerificationResult } from '../../types';

interface VerificationGateProps {
  children: React.ReactNode;
  routeName?: string;
  requiredRole?: string;
}

export const VerificationGate: React.FC<VerificationGateProps> = ({
  children,
  routeName = 'this protected section'
}) => {
  const { currentUser, isAlumniVerified, verifyAlumniStatus } = useAlumni();

  const [studentIdInput, setStudentIdInput] = useState<string>(currentUser?.studentId || '');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verificationResult, setVerificationResult] = useState<RegistrarVerificationResult | null>(null);

  // If user is verified or holds an administrative/staff role, permit full access immediately
  if (
    isAlumniVerified ||
    (currentUser && ['admin', 'staff', 'registrar', 'moderator', 'superadmin'].includes(currentUser.role))
  ) {
    return <>{children}</>;
  }

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!studentIdInput.trim()) {
      setVerificationResult({
        isVerified: false,
        status: 'unconfirmed',
        message: "Student ID 'None' could not be confirmed in St. Cecilia's College registrar records. Expected format: SC-YYYY-XXXX (e.g. SC-2020-0192)."
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const result = await verifyAlumniStatus(studentIdInput.trim());
      setVerificationResult(result);
    } catch (err) {
      setVerificationResult({
        isVerified: false,
        status: 'not_found',
        studentId: studentIdInput,
        message: `Student ID '${studentIdInput.trim()}' could not be confirmed in St. Cecilia's College registrar records. Expected format: SC-YYYY-XXXX (e.g. SC-2020-0192).`
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const setTestId = (id: string) => {
    setStudentIdInput(id);
    setVerificationResult(null);
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {/* Institutional Header Banner */}
        <div className="bg-linear-to-r from-[#991B1B] via-[#B91C1C] to-[#7F1D1D] p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
              <Lock className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-bold tracking-wide uppercase">
                <GraduationCap className="w-3.5 h-3.5 text-amber-300" />
                <span>Office of the College Registrar</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black mt-1 tracking-tight">
                Academic Record Verification Required
              </h1>
              <p className="text-xs sm:text-sm text-red-100 mt-1">
                Access to <strong className="text-white font-semibold">{routeName}</strong> requires a verified graduate or student academic record.
              </p>
            </div>
          </div>
        </div>

        {/* Verification Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Informative Explanation */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900 leading-relaxed">
              <p className="font-bold text-amber-950 mb-1">
                Why is my access restricted?
              </p>
              To maintain the integrity and privacy of St. Cecilia's College alumni communications, university event registrations, career job boards, and direct peer-to-peer messaging, all member accounts must have their official academic record confirmed in the College Registrar masterlist.
            </div>
          </div>

          {/* Verification Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label htmlFor="student-id-input" className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
                Official Student ID Number
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="student-id-input"
                  type="text"
                  value={studentIdInput}
                  onChange={(e) => {
                    setStudentIdInput(e.target.value);
                    if (verificationResult) setVerificationResult(null);
                  }}
                  placeholder="SC-YYYY-XXXX (e.g. SC-2020-0192)"
                  className="flex-1 px-4 py-2.5 text-sm bg-stone-50 border border-stone-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#991B1B] focus:border-transparent font-mono"
                />
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="px-5 py-2.5 bg-[#991B1B] hover:bg-[#7F1D1D] disabled:bg-stone-400 text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isVerifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Checking Records...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Academic Record</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-stone-500 mt-1.5">
                Format must match official St. Cecilia's College standard: <span className="font-mono font-semibold text-stone-700">SC-YYYY-XXXX</span> (e.g. SC-2020-0192).
              </p>
            </div>

            {/* Error Message Display - Exact format demanded by user specification */}
            {verificationResult && !verificationResult.isVerified && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-red-900">
                      Academic Record Not Confirmed
                    </p>
                    <p className="text-xs text-red-700 leading-relaxed font-medium">
                      {verificationResult.message}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Success Message Display */}
            {verificationResult && verificationResult.isVerified && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-emerald-950">
                      Academic Record Confirmed!
                    </p>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      {verificationResult.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>

          {/* Test Student IDs Helper */}
          <div className="pt-2 border-t border-stone-100">
            <p className="text-xs font-bold text-stone-700 mb-2">
              Test Sample Student IDs from Registrar Masterlist:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTestId('SC-2020-0192')}
                className="px-2.5 py-1 text-xs rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono transition-colors cursor-pointer border border-stone-200"
                title="Verified Bachelor of Science in Information Technology (Class 2024)"
              >
                SC-2020-0192 (Verified)
              </button>
              <button
                type="button"
                onClick={() => setTestId('SC-2021-0288')}
                className="px-2.5 py-1 text-xs rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 font-mono transition-colors cursor-pointer border border-stone-200"
                title="Verified Class of 2025"
              >
                SC-2021-0288 (Verified)
              </button>
              <button
                type="button"
                onClick={() => setTestId('sc-2016-1')}
                className="px-2.5 py-1 text-xs rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-mono transition-colors cursor-pointer border border-red-200"
                title="Test Unconfirmed/Malformed Student ID"
              >
                sc-2016-1 (Unconfirmed Test)
              </button>
              <button
                type="button"
                onClick={() => setTestId('SC-2022-9999')}
                className="px-2.5 py-1 text-xs rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-mono transition-colors cursor-pointer border border-red-200"
                title="Test Unverified Student ID"
              >
                SC-2022-9999 (Unverified)
              </button>
            </div>
          </div>

          {/* Registrar Contact Card */}
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs text-stone-600 space-y-2">
            <div className="flex items-center gap-2 font-bold text-stone-900">
              <Building className="w-4 h-4 text-[#991B1B]" />
              <span>Office of the College Registrar Assistance</span>
            </div>
            <p className="leading-relaxed">
              If your records have not yet been synchronized or your diploma details need manual accreditation, please reach out to the Registrar with your graduation date and TOR copy:
            </p>
            <div className="flex flex-wrap items-center gap-4 text-stone-700 pt-1">
              <span className="flex items-center gap-1.5 font-medium">
                <Mail className="w-3.5 h-3.5 text-stone-500" />
                <span>registrar@stcecilia.edu</span>
              </span>
              <span className="text-stone-400">•</span>
              <span>St. Cecilia's College - Cebu, Minglanilla Campus</span>
              <span className="text-stone-400">•</span>
              <span>Mon-Fri 8:00 AM - 5:00 PM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
