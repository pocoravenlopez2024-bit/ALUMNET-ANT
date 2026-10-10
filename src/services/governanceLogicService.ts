import { UserProfile, StudentVerificationRecord, RegistrationConflictRecord } from '../types';
import {
  getRegistrarRecords,
  normalizeStudentId
} from './studentVerificationService';

export interface GovernancePolicies {
  strictLoginGate: boolean;
  autoQuarantineDuplicateIds: boolean;
  autoReconcilePerfectMatches: boolean;
  requireDegreeMatch: boolean;
  logAllAdministrativeActions: boolean;
}

const GOVERNANCE_POLICY_STORAGE_KEY = 'st_cecilia_governance_policies_v1';

export const DEFAULT_GOVERNANCE_POLICIES: GovernancePolicies = {
  strictLoginGate: true,
  autoQuarantineDuplicateIds: true,
  autoReconcilePerfectMatches: true,
  requireDegreeMatch: true,
  logAllAdministrativeActions: true
};

export function getGovernancePolicies(): GovernancePolicies {
  try {
    const raw = localStorage.getItem(GOVERNANCE_POLICY_STORAGE_KEY);
    if (!raw) return DEFAULT_GOVERNANCE_POLICIES;
    return { ...DEFAULT_GOVERNANCE_POLICIES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_GOVERNANCE_POLICIES;
  }
}

export function saveGovernancePolicies(policies: GovernancePolicies): void {
  try {
    localStorage.setItem(GOVERNANCE_POLICY_STORAGE_KEY, JSON.stringify(policies));
  } catch (err) {
    console.warn('Failed to save governance policies to localStorage', err);
  }
}

export type DiscrepancyType =
  | 'PERFECT_MATCH'
  | 'NAME_DISCREPANCY'
  | 'DEGREE_DISCREPANCY'
  | 'UNREGISTERED_ID'
  | 'COLLISION_RISK'
  | 'MISSING_STUDENT_ID';

export interface RegistryDiscrepancyAnalysis {
  userId: string;
  user: UserProfile;
  status: DiscrepancyType;
  confidenceScore: number;
  registryRecord?: StudentVerificationRecord;
  competingUser?: UserProfile;
  discrepancyDetails: string[];
  recommendedAction: 'AUTO_VERIFY' | 'MANUAL_INSPECTION' | 'SYNC_AND_VERIFY' | 'FLAG_COLLISION' | 'REJECT';
}

function normalizeName(name: string = ''): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Analyzes an individual user record against the official Registrar database
 * and returns high-logic integrity scores, collision detection, and discrepancies.
 */
export function analyzeUserRegistryIntegrity(
  user: UserProfile,
  allUsers: UserProfile[],
  registryRecords?: StudentVerificationRecord[]
): RegistryDiscrepancyAnalysis {
  const records = registryRecords || getRegistrarRecords();
  const discrepancyDetails: string[] = [];

  // If user has no student ID registered
  if (!user.studentId || !user.studentId.trim()) {
    return {
      userId: user.uid,
      user,
      status: 'MISSING_STUDENT_ID',
      confidenceScore: 10,
      discrepancyDetails: ['No institutional Student ID provided during registration.'],
      recommendedAction: 'MANUAL_INSPECTION'
    };
  }

  const normId = normalizeStudentId(user.studentId).toUpperCase();

  // 1. Check for Collision Risk: Does another active user already have this ID?
  const competing = allUsers.find(
    (u) =>
      u.uid !== user.uid &&
      u.studentId &&
      normalizeStudentId(u.studentId).toUpperCase() === normId &&
      u.isVerified
  );

  if (competing) {
    return {
      userId: user.uid,
      user,
      status: 'COLLISION_RISK',
      confidenceScore: 0,
      competingUser: competing,
      discrepancyDetails: [
        `Student ID ${user.studentId} is already claimed and verified by alumnus "${competing.name}" (${competing.email}). Immediate collision review required.`
      ],
      recommendedAction: 'FLAG_COLLISION'
    };
  }

  // 2. Cross-reference against the Registrar Master Archive
  const matchedRecord = records.find(
    (r) => normalizeStudentId(r.studentId).toUpperCase() === normId
  );

  if (!matchedRecord) {
    return {
      userId: user.uid,
      user,
      status: 'UNREGISTERED_ID',
      confidenceScore: 15,
      discrepancyDetails: [
        `Student ID "${user.studentId}" does not exist in St. Cecilia's official Registrar masterlist. Potential ghost record or external applicant.`
      ],
      recommendedAction: 'REJECT'
    };
  }

  // 3. Name comparison
  const userNameNorm = normalizeName(user.name);
  const recordNameNorm = normalizeName(matchedRecord.fullName);
  const nameMatches = userNameNorm === recordNameNorm;

  // Partial name check (e.g. contains first and last names)
  const userWords = user.name.toLowerCase().split(/\s+/).filter(Boolean);
  const recordWords = matchedRecord.fullName.toLowerCase().split(/\s+/).filter(Boolean);
  const sharedWords = userWords.filter((w) => recordWords.includes(w));
  const partialNameMatch = sharedWords.length >= 2;

  if (!nameMatches && !partialNameMatch) {
    discrepancyDetails.push(
      `Name Discrepancy: Account name "${user.name}" does not match Registrar diploma record "${matchedRecord.fullName}".`
    );
  } else if (!nameMatches && partialNameMatch) {
    discrepancyDetails.push(
      `Minor Name Variance: Account name "${user.name}" varies slightly from diploma record "${matchedRecord.fullName}".`
    );
  }

  // 4. Degree / Program comparison
  const userCourseNorm = (user.course || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const recordCourseNorm = (matchedRecord.course || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const courseMatches = userCourseNorm.length > 0 && (
    userCourseNorm === recordCourseNorm ||
    userCourseNorm.includes(recordCourseNorm) ||
    recordCourseNorm.includes(userCourseNorm)
  );

  if (!courseMatches && user.course) {
    discrepancyDetails.push(
      `Degree Discrepancy: User declared "${user.course}", but official transcript indicates "${matchedRecord.course}".`
    );
  }

  // 5. Batch comparison
  const userBatch = (user.batch || '').trim();
  const recordBatch = (matchedRecord.batchYear || '').trim();
  if (userBatch && recordBatch && userBatch !== recordBatch) {
    discrepancyDetails.push(
      `Graduation Batch Variance: Declared ${userBatch} vs Registrar record ${recordBatch}.`
    );
  }

  // Compute confidence score
  let confidence = 50; // ID matched baseline
  if (nameMatches) confidence += 30;
  else if (partialNameMatch) confidence += 15;

  if (courseMatches) confidence += 15;
  if (userBatch && recordBatch && userBatch === recordBatch) confidence += 5;

  confidence = Math.min(100, Math.max(0, confidence));

  // Determine final status
  if (confidence === 100) {
    return {
      userId: user.uid,
      user,
      status: 'PERFECT_MATCH',
      confidenceScore: 100,
      registryRecord: matchedRecord,
      discrepancyDetails: ['100% Exact match with St. Cecilia\'s College Registrar diploma archives.'],
      recommendedAction: 'AUTO_VERIFY'
    };
  }

  if (!courseMatches && (nameMatches || partialNameMatch)) {
    return {
      userId: user.uid,
      user,
      status: 'DEGREE_DISCREPANCY',
      confidenceScore: confidence,
      registryRecord: matchedRecord,
      discrepancyDetails,
      recommendedAction: 'SYNC_AND_VERIFY'
    };
  }

  if (!nameMatches) {
    return {
      userId: user.uid,
      user,
      status: 'NAME_DISCREPANCY',
      confidenceScore: confidence,
      registryRecord: matchedRecord,
      discrepancyDetails,
      recommendedAction: 'MANUAL_INSPECTION'
    };
  }

  return {
    userId: user.uid,
    user,
    status: 'PERFECT_MATCH',
    confidenceScore: confidence,
    registryRecord: matchedRecord,
    discrepancyDetails: discrepancyDetails.length > 0 ? discrepancyDetails : ['Slight variance; verified by ID match.'],
    recommendedAction: 'AUTO_VERIFY'
  };
}

/**
 * Calculates aggregate institutional integrity metrics across the alumni roster
 */
export function calculateGovernanceIntegrityMetrics(
  users: UserProfile[],
  conflicts: RegistrationConflictRecord[]
) {
  const records = getRegistrarRecords();
  const alumniUsers = users.filter((u) => u.role === 'alumni');
  const verifiedAlumni = alumniUsers.filter((u) => u.isVerified);
  const pendingAlumni = alumniUsers.filter((u) => !u.isVerified);

  let verifiedMatchesCount = 0;
  verifiedAlumni.forEach((u) => {
    if (u.studentId) {
      const normId = normalizeStudentId(u.studentId).toUpperCase();
      const match = records.find((r) => normalizeStudentId(r.studentId).toUpperCase() === normId);
      if (match) verifiedMatchesCount++;
    }
  });

  const purityScore =
    verifiedAlumni.length > 0
      ? Math.round((verifiedMatchesCount / verifiedAlumni.length) * 1000) / 10
      : 100;

  const pendingAnalyses = pendingAlumni.map((u) =>
    analyzeUserRegistryIntegrity(u, users, records)
  );

  const perfectMatchesCount = pendingAnalyses.filter((a) => a.status === 'PERFECT_MATCH').length;
  const discrepanciesCount = pendingAnalyses.filter(
    (a) => a.status === 'NAME_DISCREPANCY' || a.status === 'DEGREE_DISCREPANCY'
  ).length;
  const unregisteredCount = pendingAnalyses.filter((a) => a.status === 'UNREGISTERED_ID').length;
  const collisionsCount = conflicts.filter((c) => c.status === 'pending').length;

  return {
    purityScore,
    verifiedAlumniCount: verifiedAlumni.length,
    pendingAlumniCount: pendingAlumni.length,
    perfectMatchesCount,
    discrepanciesCount,
    unregisteredCount,
    collisionsCount,
    totalRecordsInRegistry: records.length
  };
}
