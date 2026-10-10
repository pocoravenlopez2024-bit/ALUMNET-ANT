import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  Lock,
  FileCheck,
  AlertTriangle,
  RotateCcw,
  Save,
  CheckCircle2,
  Sliders,
  Database,
  Eye,
  Info
} from 'lucide-react';
import {
  getGovernancePolicies,
  saveGovernancePolicies,
  DEFAULT_GOVERNANCE_POLICIES,
  GovernancePolicies
} from '../../services/governanceLogicService';
import { useAlumni } from '../../context/AlumniContext';

export const AdminGovernancePoliciesView: React.FC = () => {
  const { showToast, addAuditLog } = useAlumni();
  const [policies, setPolicies] = useState<GovernancePolicies>(() => getGovernancePolicies());
  const [isSaved, setIsSaved] = useState(false);

  const handleToggle = (key: keyof GovernancePolicies) => {
    setPolicies((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      saveGovernancePolicies(next);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      return next;
    });

    addAuditLog({
      action: 'GOVERNANCE_POLICY_MODIFIED',
      actorId: 'admin_officer',
      actorName: 'System Administrator',
      actorRole: 'admin',
      category: 'settings',
      details: `Modified governance policy rule: "${key}" toggled to ${!policies[key] ? 'ENABLED' : 'DISABLED'}.`,
      severity: 'info'
    });

    showToast('Governance security policy updated successfully.', 'success');
  };

  const handleReset = () => {
    if (window.confirm('Reset all governance policies to official St. Cecilia\'s College institutional baseline?')) {
      setPolicies(DEFAULT_GOVERNANCE_POLICIES);
      saveGovernancePolicies(DEFAULT_GOVERNANCE_POLICIES);
      showToast('Governance policies reset to institutional defaults.', 'info');
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Advisory Card */}
      <div className="bg-stone-900 text-white p-5 rounded-2xl shadow-xs border border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B181B] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold font-serif">
                  Institutional Security & Integrity Rules Engine
                </h2>
                {isSaved && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>Saved</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-300 mt-1 max-w-2xl leading-relaxed">
                Rules configured here govern real-time access gates, automated student ID duplicate quarantine, and cross-registry discrepancy detection across the entire St. Cecilia's College alumni network.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 border border-stone-700"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Baseline</span>
          </button>
        </div>
      </div>

      {/* Policy Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Rule 1: Strict Verification Login Gate */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-red-50 text-[#8B181B] flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Strict Login Gate Enforcement
                </h3>
                <span className="text-[11px] text-stone-500">Core Identity Security</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('strictLoginGate')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                policies.strictLoginGate ? 'bg-[#8B181B]' : 'bg-stone-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  policies.strictLoginGate ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Strictly prohibits unverified alumni from logging into the portal. Users without confirmed Registrar accreditation are blocked at the authentication gate and redirected to registration verification.
          </p>
          <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Actively enforced across standard & Google login handlers.</span>
          </div>
        </div>

        {/* Rule 2: Automatic Duplicate Student ID Quarantine */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Duplicate ID Quarantine
                </h3>
                <span className="text-[11px] text-stone-500">Anti-Spoofing & Collisions</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('autoQuarantineDuplicateIds')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                policies.autoQuarantineDuplicateIds ? 'bg-[#8B181B]' : 'bg-stone-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  policies.autoQuarantineDuplicateIds ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Automatically isolates and locks any registration attempt that claims a Student ID already verified to another alumnus, routing both profiles to the Identity Conflict Resolution Desk.
          </p>
          <div className="text-[11px] font-semibold text-amber-700 flex items-center gap-1.5 pt-1">
            <Info className="w-3.5 h-3.5 text-amber-600" />
            <span>Directly feeds the Identity Conflict Desk with side-by-side dossiers.</span>
          </div>
        </div>

        {/* Rule 3: Smart 1-Click Auto-Reconcile */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <FileCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Smart Auto-Reconcile
                </h3>
                <span className="text-[11px] text-stone-500">100% Match Clearance</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('autoReconcilePerfectMatches')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                policies.autoReconcilePerfectMatches ? 'bg-[#8B181B]' : 'bg-stone-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  policies.autoReconcilePerfectMatches ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Permits administrators to execute high-logic batch reconciliation, verifying all accounts whose ID, full name, and degree program match official registrar archives with 100% precision.
          </p>
          <div className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Protects against blind batch-verification of unverified accounts.</span>
          </div>
        </div>

        {/* Rule 4: Transcript Degree Discrepancy Flagging */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                  Transcript Degree Discrepancy
                </h3>
                <span className="text-[11px] text-stone-500">Academic Data Integrity</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleToggle('requireDegreeMatch')}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                policies.requireDegreeMatch ? 'bg-[#8B181B]' : 'bg-stone-200'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  policies.requireDegreeMatch ? 'translate-x-5.5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          <p className="text-xs text-stone-600 leading-relaxed">
            Detects discrepancies when an alumnus submits a degree program different from the accredited diploma roll, providing a 1-click "Sync to Registrar & Verify" action for automatic alignment.
          </p>
          <div className="text-[11px] font-semibold text-blue-700 flex items-center gap-1.5 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Prevents cross-course misrepresentation in public directories.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
