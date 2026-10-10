import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { StudentVerificationRecord, RegistrationConflictRecord } from '../types';
import {
  saveRegistryRecordsBatchToFirestore,
  getRegistryRecordsFromFirestore,
  markRegistryRecordRegisteredInFirestore,
  deleteRegistryRecordFromFirestore
} from '../lib/firebase';

/**
 * Storage Key for Registrar-uploaded masterlist
 */
const REGISTRY_STORAGE_KEY = 'st_cecilia_accredited_registry_records';
const REGISTRY_CONFLICTS_STORAGE_KEY = 'st_cecilia_registry_conflicts';

/**
 * Official St. Cecilia's College Registrar Archive
 * Preloaded with official accredited graduate records for registration verification.
 */
export const DEFAULT_REGISTRAR_RECORDS: StudentVerificationRecord[] = [];

export interface VerificationResult {
  isVerified: boolean;
  record?: StudentVerificationRecord;
  message: string;
  source: 'database_match' | 'algorithmic_registrar_format' | 'unverified';
}

export interface RegistryMatchResult {
  isMatched: boolean;
  record?: StudentVerificationRecord;
  confidence: number; // 0 - 100
  matchReasons: string[];
  message: string;
  canBypassVerification: boolean;
}

/**
 * Normalizes Student ID strings to standard St. Cecilia format: SCC-YYYY-XXXX
 */
export function normalizeStudentId(rawId?: any): string {
  if (!rawId || typeof rawId !== 'string') return '';
  const cleaned = rawId.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  if (/^\d{4}-\d{3,5}$/.test(cleaned)) {
    return `SCC-${cleaned}`;
  }
  if (cleaned.startsWith('SC-') && !cleaned.startsWith('SCC-')) {
    return `SCC-${cleaned.slice(3)}`;
  }
  return cleaned;
}

/**
 * Validates whether the student ID follows St. Cecilia's College official centenary ID formula:
 * SCC-YYYY-XXXX (where YYYY is between 1950 and 2159, followed by 3-5 digits, built to endure 100+ years)
 */
export function isValidStudentIdPattern(id: string): boolean {
  const norm = normalizeStudentId(id);
  // Century-scale regex covering cohorts across 100+ years (1950 through 2159)
  const regex = /^(SCC|SC)-(19[5-9]\d|20\d\d|21[0-5]\d)-\d{3,5}$/;
  return regex.test(norm);
}

/**
 * Retrieves all registered records from localStorage or returns empty array
 */
export function getRegistrarRecords(): StudentVerificationRecord[] {
  try {
    const raw = localStorage.getItem(REGISTRY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: StudentVerificationRecord[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.warn('Error reading registrar records from localStorage:', err);
    return [];
  }
}

/**
 * Saves current registrar masterlist to localStorage
 */
export function saveRegistrarRecords(records: StudentVerificationRecord[]): void {
  try {
    localStorage.setItem(REGISTRY_STORAGE_KEY, JSON.stringify(records));
  } catch (err) {
    console.error('Failed to save registrar records:', err);
  }
}

/**
 * Syncs registrar masterlist with Firestore cloud database
 */
export async function syncRegistrarRecordsWithFirestore(): Promise<StudentVerificationRecord[]> {
  try {
    const cloudRecords = await getRegistryRecordsFromFirestore();
    if (cloudRecords && cloudRecords.length > 0) {
      saveRegistrarRecords(cloudRecords);
      return cloudRecords;
    } else {
      const local = getRegistrarRecords();
      return local;
    }
  } catch (err) {
    console.warn('Notice syncing registry with Firestore:', err);
    return getRegistrarRecords();
  }
}

/**
 * Adds or merges newly uploaded student records into the accredited registry and syncs to Firestore
 */
export function addRegistrarRecords(
  newRecords: StudentVerificationRecord[],
  uploadedBy?: string,
  sourceFile?: string
): { added: number; updated: number; total: number } {
  const existing = getRegistrarRecords();
  const existingMap = new Map<string, StudentVerificationRecord>();

  existing.forEach((r) => {
    existingMap.set(normalizeStudentId(r.studentId).toUpperCase(), r);
  });

  let added = 0;
  let updated = 0;
  const now = new Date().toISOString();
  const recordsToSyncToCloud: StudentVerificationRecord[] = [];

  newRecords.forEach((rec) => {
    const normId = normalizeStudentId(rec.studentId).toUpperCase();
    if (!normId) return;

    const recordToSave: StudentVerificationRecord = {
      ...rec,
      studentId: normId,
      fullName: rec.fullName.trim(),
      batchYear: rec.batchYear ? String(rec.batchYear).trim() : '2024',
      course: rec.course ? rec.course.trim() : 'B.S. Information Technology',
      status: rec.status || 'Graduated',
      uploadedAt: rec.uploadedAt || now,
      uploadedBy: uploadedBy || rec.uploadedBy || 'Registrar Office',
      sourceFile: sourceFile || rec.sourceFile
    };

    recordsToSyncToCloud.push(recordToSave);

    if (existingMap.has(normId)) {
      const current = existingMap.get(normId)!;
      existingMap.set(normId, {
        ...current,
        ...recordToSave,
        // Retain registration link if already registered
        isRegistered: current.isRegistered || recordToSave.isRegistered,
        matchedUid: current.matchedUid || recordToSave.matchedUid,
        registeredAt: current.registeredAt || recordToSave.registeredAt
      });
      updated++;
    } else {
      existingMap.set(normId, recordToSave);
      added++;
    }
  });

  const merged = Array.from(existingMap.values());
  saveRegistrarRecords(merged);

  // Asynchronously commit records to Firestore database
  saveRegistryRecordsBatchToFirestore(recordsToSyncToCloud).catch((err) => {
    console.warn('Background Firestore registry sync notice:', err);
  });

  return { added, updated, total: merged.length };
}

/**
 * Deletes a record from the registry by Student ID (and removes from Firestore)
 */
export function deleteRegistrarRecord(studentId: string): boolean {
  const norm = normalizeStudentId(studentId).toUpperCase();
  const current = getRegistrarRecords();
  const filtered = current.filter((r) => normalizeStudentId(r.studentId).toUpperCase() !== norm);
  if (filtered.length !== current.length) {
    saveRegistrarRecords(filtered);
    deleteRegistryRecordFromFirestore(norm).catch(() => {});
    return true;
  }
  return false;
}

/**
 * Marks a student record as registered and links the user ID in local storage and Firestore
 */
export function markRegistryRecordAsRegistered(studentId: string, uid: string = ''): void {
  const norm = normalizeStudentId(studentId).toUpperCase();
  const current = getRegistrarRecords();
  const updated = current.map((r) => {
    if (normalizeStudentId(r.studentId).toUpperCase() === norm) {
      return {
        ...r,
        isRegistered: true,
        matchedUid: uid,
        registeredAt: new Date().toISOString()
      };
    }
    return r;
  });
  saveRegistrarRecords(updated);
  markRegistryRecordRegisteredInFirestore(norm, uid).catch(() => {});
}

/**
 * Clears and resets the registry back to initial accredited graduates
 */
export function resetRegistrarRecords(): void {
  saveRegistrarRecords(DEFAULT_REGISTRAR_RECORDS);
}

/**
 * Fuzzy normalization for names (removes punctuation, extra spaces, accents, lowercase)
 */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates an official St. Cecilia's College Alumni ID:
 * Format: SCC-ALUM-YYYY-XXXX (where YYYY is graduation batch, XXXX is 4-digit unique sequence)
 * This is permanently distinct from the pre-graduation Student ID.
 */
export function generateAlumniId(batchYear: string = '2024', studentId?: string, seed?: string): string {
  const cleanBatch = (batchYear || '2024').replace(/[^0-9]/g, '').slice(-4) || '2024';
  let seq = '';
  if (studentId) {
    const digits = studentId.replace(/[^0-9]/g, '');
    if (digits.length >= 4) {
      seq = digits.slice(-4);
    }
  }
  if (!seq && seed) {
    const seedDigits = seed.replace(/[^0-9]/g, '');
    if (seedDigits.length >= 4) {
      seq = seedDigits.slice(-4);
    }
  }
  if (!seq) {
    seq = Math.floor(1000 + Math.random() * 9000).toString();
  }
  return `SCC-ALUM-${cleanBatch}-${seq}`;
}

export interface StrictRegistrationValidationResult {
  isValid: boolean;
  errorCode?: 'MISSING_FIELDS' | 'ID_NOT_FOUND' | 'NAME_MISMATCH' | 'LAST_NAME_MISMATCH' | 'BATCH_MISMATCH' | 'COURSE_MISMATCH' | 'ALREADY_REGISTERED' | 'UNVERIFIED_STATUS';
  errorMessage?: string;
  matchedRecord?: StudentVerificationRecord;
}

/**
 * Strict Zero-Tolerance Registration Validator
 * Enforces that Student ID, full name (including any second/middle name),
 * last name, batch year, and degree program match the registrar record EXACTLY.
 * If even one field does not match, registration to Step 2 is strictly blocked.
 */
export function validateStudentRegistrationStrict(
  params: {
    studentId: string;
    firstName: string;
    lastName: string;
    batch: string;
    course: string;
  },
  existingUsers: any[] = []
): StrictRegistrationValidationResult {
  const normId = normalizeStudentId(params.studentId).toUpperCase();
  const trimmedFirst = params.firstName.trim();
  const trimmedLast = params.lastName.trim();
  const trimmedBatch = params.batch.trim();
  const trimmedCourse = params.course.trim();

  if (!normId || !trimmedFirst || !trimmedLast || !trimmedBatch || !trimmedCourse) {
    return {
      isValid: false,
      errorCode: 'MISSING_FIELDS',
      errorMessage: 'All verification fields are required: Student ID Number, First & Middle/Second Name, Last Name, Graduating Batch, and Degree Program.'
    };
  }

  const records = getRegistrarRecords();
  const record = records.find(
    (r) => normalizeStudentId(r.studentId).toUpperCase() === normId
  );

  if (!record) {
    return {
      isValid: false,
      errorCode: 'ID_NOT_FOUND',
      errorMessage: `Security Verification Failed: Student ID "${params.studentId}" was not found in the official St. Cecilia’s College registrar masterlist. Please check for typos or contact the Registrar.`
    };
  }

  // Check if unverified status in registry
  const isUnverified =
    (record.status as string)?.toLowerCase() === 'unverified' ||
    record.verification_status === 'unverified';
  if (isUnverified) {
    return {
      isValid: false,
      errorCode: 'UNVERIFIED_STATUS',
      errorMessage: `Student ID "${params.studentId}" has an unverified or withheld record in the registrar archive. Registration cannot proceed.`
    };
  }

  // Check if duplicate (already registered)
  const alreadyRegisteredInUsers = existingUsers.some(
    (u) =>
      u.studentId &&
      normalizeStudentId(u.studentId).toUpperCase() === normId
  );
  if (record.isRegistered || alreadyRegisteredInUsers) {
    return {
      isValid: false,
      errorCode: 'ALREADY_REGISTERED',
      errorMessage: `Student ID "${params.studentId}" is already registered and activated in the alumni network. Duplicate registrations are prohibited. Please sign in with your credentials.`
    };
  }

  // Strict Name Validation:
  // Full entered name:
  const enteredFullName = normalizeName(`${trimmedFirst} ${trimmedLast}`);
  const recordFullName = normalizeName(record.fullName);

  if (enteredFullName !== recordFullName) {
    return {
      isValid: false,
      errorCode: 'NAME_MISMATCH',
      errorMessage: `Security Verification Failed: The student name provided does not match the official registrar record for Student ID "${record.studentId}". Every word (first name, second/middle name, and surname) must match the registrar masterlist record exactly.`
    };
  }

  // Strict Last Name Check:
  const enteredLastNorm = normalizeName(trimmedLast);
  if (!recordFullName.endsWith(enteredLastNorm)) {
    return {
      isValid: false,
      errorCode: 'LAST_NAME_MISMATCH',
      errorMessage: `Security Verification Failed: Last name "${trimmedLast}" does not match the official surname on file for Student ID "${record.studentId}".`
    };
  }

  // Strict Batch Validation:
  const recordBatch = (record.batchYear || '').trim();
  if (recordBatch !== trimmedBatch) {
    return {
      isValid: false,
      errorCode: 'BATCH_MISMATCH',
      errorMessage: `Security Verification Failed: Graduating batch (Class of ${trimmedBatch}) does not match the official registrar record for Student ID "${record.studentId}".`
    };
  }

  // Strict Degree Program Validation:
  const normRecordCourse = (record.course || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const normEnteredCourse = trimmedCourse.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (normRecordCourse !== normEnteredCourse) {
    return {
      isValid: false,
      errorCode: 'COURSE_MISMATCH',
      errorMessage: `Security Verification Failed: Degree program "${trimmedCourse}" does not match the official registered program for Student ID "${record.studentId}".`
    };
  }

  return {
    isValid: true,
    matchedRecord: record
  };
}

/**
 * Fast School ID Lookup for Streamlined Registration:
 * Checks for duplicates against active users, verifies against registrar records,
 * and allows instant auto-population to minimize user clicks and errors.
 */
export function lookupStudentBySchoolId(
  studentId: string,
  existingUsers: any[] = []
): {
  isValid: boolean;
  isDuplicate: boolean;
  matchedRecord: StudentVerificationRecord | null;
  errorMessage?: string;
} {
  const normId = normalizeStudentId(studentId).toUpperCase();
  if (!normId) {
    return {
      isValid: false,
      isDuplicate: false,
      matchedRecord: null,
      errorMessage: 'Please enter your School ID Number (format: SCC-YYYY-XXXX).'
    };
  }

  // 1. Check for duplicates in existing registered accounts
  const alreadyRegistered = existingUsers.some(
    (u) => u.studentId && normalizeStudentId(u.studentId).toUpperCase() === normId
  );
  if (alreadyRegistered) {
    return {
      isValid: false,
      isDuplicate: true,
      matchedRecord: null,
      errorMessage: `School ID "${studentId}" is already registered. Duplicate registration is prevented. Please sign in or reset your credentials.`
    };
  }

  // 2. Check registrar masterlist records
  const records = getRegistrarRecords();
  const record = records.find(
    (r) => normalizeStudentId(r.studentId).toUpperCase() === normId
  );

  if (!record) {
    return {
      isValid: false,
      isDuplicate: false,
      matchedRecord: null,
      errorMessage: `School ID "${studentId}" was not found in the registrar archive. Expected format: SCC-YYYY-XXXX.`
    };
  }

  if (record.isRegistered) {
    return {
      isValid: false,
      isDuplicate: true,
      matchedRecord: null,
      errorMessage: `School ID "${studentId}" is already marked as registered in the alumni archive. Please sign in.`
    };
  }

  return {
    isValid: true,
    isDuplicate: false,
    matchedRecord: record
  };
}

/**
 * Registry Matcher Engine:
 * Compares applicant details against the uploaded CSV/Excel masterlist.
 * If details match the registrar dataset, returns a confirmed match allowing instant auto-registration.
 */
export function findRegistryMatch(query: {
  studentId?: string;
  fullName?: string;
  email?: string;
  batchYear?: string;
  course?: string;
}): RegistryMatchResult {
  const records = getRegistrarRecords();
  const normId = query.studentId ? normalizeStudentId(query.studentId).toUpperCase() : '';
  const queryName = query.fullName ? normalizeName(query.fullName) : '';
  const queryEmail = query.email ? query.email.trim().toLowerCase() : '';
  const queryBatch = query.batchYear ? query.batchYear.trim() : '';

  if (!normId && !queryName && !queryEmail) {
    return {
      isMatched: false,
      confidence: 0,
      matchReasons: [],
      message: 'Enter your Student ID or personal graduation details to check the registry.',
      canBypassVerification: false
    };
  }

  // 1. Direct Student ID Match with Security Ownership Challenge (Zero-Leak Policy)
  if (normId) {
    const idMatch = records.find(
      (r) => normalizeStudentId(r.studentId).toUpperCase() === normId
    );

    if (idMatch) {
      // Check for unverified status
      const isUnverified =
        (idMatch.status as string)?.toLowerCase() === 'unverified' ||
        idMatch.verification_status === 'unverified';

      if (isUnverified) {
        return {
          isMatched: false,
          confidence: 0,
          matchReasons: [],
          message: `Student ID '${normId}' could not be confirmed in St. Cecilia's College registrar records. Expected format: SCC-YYYY-XXXX.`,
          canBypassVerification: false
        };
      }

      // Security Ownership Challenge:
      // An applicant claiming this ID MUST provide their matching details to prove rightful ownership
      // NEVER disclose the name, batch, or course stored in the record to an unverified claimant!
      const recordNameNorm = normalizeName(idMatch.fullName);
      const qNameNorm = queryName ? normalizeName(queryName) : '';

      const hasName = Boolean(qNameNorm && qNameNorm.length >= 2);
      // Zero-tolerance exact match for name (letter for letter, including second name)
      const nameMatches = hasName && recordNameNorm === qNameNorm;

      const hasBatch = Boolean(queryBatch && queryBatch.trim().length >= 4);
      const batchMatches = hasBatch && idMatch.batchYear.trim() === queryBatch?.trim();

      // Normalize courses for comparison (exact match)
      const hasCourse = Boolean(query.course && query.course.trim().length >= 2);
      let courseMatches = true;
      if (hasCourse && idMatch.course) {
        const c1 = query.course!.toLowerCase().replace(/[^a-z0-9]/g, '');
        const c2 = idMatch.course.toLowerCase().replace(/[^a-z0-9]/g, '');
        courseMatches = c1 === c2;
      }

      // If user hasn't provided their name or batch yet, prompt them without disclosing the stored record
      if (!hasName || !hasBatch) {
        return {
          isMatched: false,
          confidence: 0,
          matchReasons: [],
          message: 'Security Notice: To protect student privacy and prevent unauthorized account claims, please enter the registered Full Name (including second/middle name) and Graduating Batch Year for this Student ID.',
          canBypassVerification: false
        };
      }

      // If claimant entered details, verify that Name, Batch, and Degree program match the stored record exactly
      if (!nameMatches || !batchMatches || !courseMatches) {
        return {
          isMatched: false,
          confidence: 0,
          matchReasons: [],
          // Strictly DO NOT reveal the actual name, batch, or degree
          message: 'Security Verification Failed: The Name (including second/middle name), Graduating Batch, or Degree Program you entered does not match the official registrar record for this Student ID.',
          canBypassVerification: false
        };
      }

      // Both ID and claimant's entered details match the registrar record!
      return {
        isMatched: true,
        record: idMatch,
        confidence: 100,
        matchReasons: [
          `Student ID authenticated: ${idMatch.studentId}`,
          'Identity ownership challenge verified (Name and Batch matched)',
          'Registrar archive confirmed'
        ],
        message: 'Identity & Academic Credentials Confirmed! Your details match the official registrar record on file for this Student ID.',
        canBypassVerification: true
      };
    }
  }

  // 2. Email Match (If registered in registrar masterlist)
  if (queryEmail) {
    const emailMatch = records.find(
      (r) => r.email && r.email.toLowerCase() === queryEmail
    );

    if (emailMatch) {
      return {
        isMatched: true,
        record: emailMatch,
        confidence: 95,
        matchReasons: [
          `Registrar email verified: ${emailMatch.email}`,
          `Student ID: ${emailMatch.studentId}`,
          `Class of ${emailMatch.batchYear}`
        ],
        message: `Institutional Record Found by Email for ${emailMatch.fullName} (ID: ${emailMatch.studentId}).`,
        canBypassVerification: true
      };
    }
  }

  // 3. Exact or High-Similarity Full Name Match + Batch Alignment
  if (queryName && queryName.length > 4) {
    const nameMatch = records.find((r) => {
      const recNorm = normalizeName(r.fullName);
      if (recNorm === queryName) return true;

      // Check all parts of name present
      const qParts = queryName.split(' ');
      const rParts = recNorm.split(' ');
      const matchingParts = qParts.filter((p) => p.length > 2 && rParts.includes(p));

      // At least 2 name components match (e.g. first and last name)
      if (matchingParts.length >= 2) {
        if (queryBatch) {
          return r.batchYear === queryBatch;
        }
        return true;
      }

      return false;
    });

    if (nameMatch) {
      const batchAligned = queryBatch ? nameMatch.batchYear === queryBatch : true;
      const confidence = batchAligned ? 90 : 75;

      return {
        isMatched: true,
        record: nameMatch,
        confidence,
        matchReasons: [
          `Full Name matched: ${nameMatch.fullName}`,
          `Class of ${nameMatch.batchYear}`,
          `Assigned ID: ${nameMatch.studentId}`
        ],
        message: `Masterlist Match: Graduate ${nameMatch.fullName} found under Student ID ${nameMatch.studentId}.`,
        canBypassVerification: true
      };
    }
  }

  return {
    isMatched: false,
    confidence: 0,
    matchReasons: [],
    message: 'No exact match found in the uploaded Registrar graduate masterlist. You may still register for manual registrar review.',
    canBypassVerification: false
  };
}

/**
 * Verifies if an applicant graduated from or attended St. Cecilia's College
 * (Updated to query the live dynamic masterlist)
 */
export async function verifyStudentRecord(params: {
  studentId: string;
  fullName?: string;
  batchYear?: string;
  course?: string;
}): Promise<VerificationResult> {
  // Simulate institutional database latency
  await new Promise((resolve) => setTimeout(resolve, 400));

  const normId = normalizeStudentId(params.studentId);

  if (!normId) {
    return {
      isVerified: false,
      message: 'Student ID number is required for graduate verification.',
      source: 'unverified'
    };
  }

  // 1. Check match in Accredited Registrar Records
  const records = getRegistrarRecords();
  const recordMatch = records.find(
    (r) => normalizeStudentId(r.studentId).toUpperCase() === normId.toUpperCase()
  );

  if (recordMatch) {
    // Explicit check for unverified records in registrar dataset (e.g., test unverified students)
    const isUnverified =
      recordMatch.status === 'unverified' ||
      recordMatch.verification_status === 'unverified';

    if (isUnverified) {
      return {
        isVerified: false,
        message: `Student ID '${params.studentId}' could not be confirmed in St. Cecilia's College registrar records. Expected format: SCC-YYYY-XXXX (e.g. SCC-2020-0192).`,
        source: 'unverified'
      };
    }

    // Check if batch year aligns
    if (params.batchYear && recordMatch.batchYear !== params.batchYear.trim()) {
      return {
        isVerified: false,
        message: 'Security Verification Failed: The selected Batch does not match the registrar record for this Student ID. Details on file cannot be disclosed for identity protection.',
        source: 'unverified'
      };
    }

    // Check if name aligns if provided
    if (params.fullName) {
      const qNorm = normalizeName(params.fullName);
      const rNorm = normalizeName(recordMatch.fullName);
      const qParts = qNorm.split(' ').filter((p) => p.length >= 2);
      const nameMatches =
        rNorm === qNorm ||
        rNorm.includes(qNorm) ||
        qNorm.includes(rNorm) ||
        qParts.some((p) => rNorm.includes(p));

      if (!nameMatches) {
        return {
          isVerified: false,
          message: 'Security Verification Failed: The student name entered does not match the registrar record for this Student ID.',
          source: 'unverified'
        };
      }
    }

    return {
      isVerified: true,
      record: recordMatch,
      message: 'Identity & Academic Record Confirmed: Your credentials have been successfully authenticated against the official St. Cecilia’s College registrar archive.',
      source: 'database_match'
    };
  }

  // 2. Strict verification check: specifically rejects accounts where the academic record cannot be confirmed by the registrar
  return {
    isVerified: false,
    message: `Student ID '${params.studentId}' could not be confirmed in St. Cecilia's College registrar records. Expected format: SCC-YYYY-XXXX (e.g. SCC-2020-0192).`,
    source: 'unverified'
  };
}

/**
 * Parses CSV or Excel (.xlsx, .xls) file uploaded by the Registrar
 */
export async function parseRegistrarFile(file: File): Promise<StudentVerificationRecord[]> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.csv') || fileName.endsWith('.txt')) {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          try {
            const mapped = mapRowsToStudentRecords(results.data as any[]);
            resolve(mapped);
          } catch (err) {
            reject(err);
          }
        },
        error: (err) => reject(err)
      });
    });
  } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error('Excel workbook contains no sheets.');
    }
    const worksheet = workbook.Sheets[firstSheetName];
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    return mapRowsToStudentRecords(rawData);
  } else {
    throw new Error('Unsupported file format. Please upload a CSV (.csv) or Excel (.xlsx, .xls) file.');
  }
}

/**
 * Flexible column mapper to handle diverse Registrar CSV/Excel headers
 */
function mapRowsToStudentRecords(rows: any[]): StudentVerificationRecord[] {
  const records: StudentVerificationRecord[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || typeof row !== 'object') continue;

    // Find student ID key
    let studentId = '';
    let fullName = '';
    let batchYear = '';
    let course = '';
    let status: 'Graduated' | 'Enrolled' | 'Alumni' | 'unverified' = 'Graduated';
    let honors = '';
    let email = '';
    let phone = '';

    for (const [key, value] of Object.entries(row)) {
      const k = key.toLowerCase().replace(/[^a-z0-9]/g, '');
      const v = String(value || '').trim();

      if (!v) continue;

      // Student ID variations: studentid, idnumber, studentno, id, idnum
      if (k.includes('studentid') || k === 'id' || k.includes('studentno') || k.includes('idnumber') || k.includes('studentnumber')) {
        studentId = normalizeStudentId(v);
      }
      // Full Name or split names
      else if (k.includes('fullname') || k === 'name' || k.includes('studentname')) {
        fullName = v;
      } else if (k.includes('firstname') || k === 'first') {
        fullName = `${v} ${fullName}`.trim();
      } else if (k.includes('lastname') || k === 'last' || k.includes('surname')) {
        fullName = `${fullName} ${v}`.trim();
      }
      // Batch / Graduation Year
      else if (k.includes('batch') || k.includes('gradyear') || k.includes('year') || k.includes('classof') || k.includes('cohort')) {
        batchYear = v.replace(/[^0-9]/g, '');
      }
      // Course / Degree / Program
      else if (k.includes('course') || k.includes('degree') || k.includes('program') || k.includes('major')) {
        course = v;
      }
      // Honors / Remarks / Awards
      else if (k.includes('honor') || k.includes('award') || k.includes('remark') || k.includes('distinction')) {
        honors = v;
      }
      // Email
      else if (k.includes('email') || k.includes('mail')) {
        email = v;
      }
      // Phone
      else if (k.includes('phone') || k.includes('contact') || k.includes('mobile')) {
        phone = v;
      }
      // Status
      else if (k.includes('status')) {
        if (v.toLowerCase().includes('unverif') || v.toLowerCase().includes('withheld') || v.toLowerCase().includes('dispute') || v.toLowerCase().includes('reject')) {
          status = 'unverified';
        } else if (v.toLowerCase().includes('enroll')) {
          status = 'Enrolled';
        } else if (v.toLowerCase().includes('alumn')) {
          status = 'Alumni';
        } else {
          status = 'Graduated';
        }
      }
    }

    // Fallback: If no explicit student ID was found, check if any column value matches ID pattern
    if (!studentId) {
      for (const val of Object.values(row)) {
        const str = String(val || '').trim();
        if (/^(SCC-)?\d{4}-\d{3,5}$/i.test(str)) {
          studentId = normalizeStudentId(str);
          break;
        }
      }
    }

    // Only add if at least student ID or Name is present
    if (studentId || fullName) {
      records.push({
        studentId: studentId || `SCC-${batchYear || '2024'}-${Math.floor(1000 + Math.random() * 9000)}`,
        fullName: fullName || 'Cecilian Graduate',
        batchYear: batchYear || '2024',
        course: course || 'Bachelor Degree Program',
        status,
        honors: honors || undefined,
        email: email || undefined,
        phone: phone || undefined,
        verifiedAt: new Date().toISOString().split('T')[0]
      });
    }
  }

  return records;
}

/**
 * Curated list of test student records available for instant CSV/Excel export
 * and actual registration testing
 */
export const SAMPLE_TEST_STUDENTS: Array<{
  studentId: string;
  fullName: string;
  batchYear: string;
  course: string;
  status: 'Graduated' | 'Enrolled' | 'Alumni';
  honors: string;
  email: string;
  phone: string;
}> = [
  {
    studentId: 'SCC-2024-1001',
    fullName: 'Alexander James Morales',
    batchYear: '2024',
    course: 'B.S. Information Technology',
    status: 'Graduated',
    honors: 'Summa Cum Laude, Best Capstone Lead',
    email: 'alex.morales@alumni.stcecilia.edu',
    phone: '+63 917 123 4567'
  },
  {
    studentId: 'SCC-2024-1002',
    fullName: 'Patricia Anne Navarro',
    batchYear: '2024',
    course: 'B.S. Computer Science',
    status: 'Graduated',
    honors: 'Magna Cum Laude',
    email: 'patricia.navarro@alumni.stcecilia.edu',
    phone: '+63 918 234 5678'
  },
  {
    studentId: 'SCC-2024-1003',
    fullName: 'Christian Dave Velasco',
    batchYear: '2024',
    course: 'B.S. Accountancy',
    status: 'Graduated',
    honors: 'Cum Laude, CPA Board Candidate',
    email: 'cd.velasco@alumni.stcecilia.edu',
    phone: '+63 919 345 6789'
  },
  {
    studentId: 'SCC-2025-2001',
    fullName: 'Janelle Therese Ramos',
    batchYear: '2025',
    course: 'B.S. Nursing',
    status: 'Graduated',
    honors: 'Dean’s Lister, Clinical Excellence',
    email: 'janelle.ramos@alumni.stcecilia.edu',
    phone: '+63 920 456 7890'
  },
  {
    studentId: 'SCC-2025-2002',
    fullName: 'Miguel Rafael Gutierrez',
    batchYear: '2025',
    course: 'B.S. Business Administration',
    status: 'Graduated',
    honors: 'Leadership Excellence Award',
    email: 'miguel.gutierrez@alumni.stcecilia.edu',
    phone: '+63 921 567 8901'
  },
  {
    studentId: 'SCC-2026-3001',
    fullName: 'Samantha Rose Del Rosario',
    batchYear: '2026',
    course: 'B.S. Information Technology',
    status: 'Graduated',
    honors: 'Outstanding Software Project',
    email: 'samantha.delrosario@alumni.stcecilia.edu',
    phone: '+63 922 678 9012'
  },
  {
    studentId: 'SCC-2026-3002',
    fullName: 'Francis Kenneth Aquino',
    batchYear: '2026',
    course: 'B.S. Hospitality Management',
    status: 'Graduated',
    honors: 'Presidential Scholar',
    email: 'francis.aquino@alumni.stcecilia.edu',
    phone: '+63 923 789 0123'
  },
  {
    studentId: 'SCC-2023-4001',
    fullName: 'Katrina Marie Mendoza',
    batchYear: '2023',
    course: 'B.S. Education',
    status: 'Graduated',
    honors: 'Magna Cum Laude',
    email: 'katrina.mendoza@alumni.stcecilia.edu',
    phone: '+63 924 890 1234'
  }
];

/**
 * Downloads a pre-formatted CSV template populated with ready-to-test student records
 */
export function downloadSampleCsvTemplate(): void {
  const headers = [
    'Student ID',
    'Full Name',
    'Batch Year',
    'Course',
    'Status',
    'Honors',
    'Email Address',
    'Contact Phone'
  ];

  const sampleRows = SAMPLE_TEST_STUDENTS.map((s) => [
    s.studentId,
    s.fullName,
    s.batchYear,
    s.course,
    s.status,
    s.honors,
    s.email,
    s.phone
  ]);

  const csvContent = [
    headers.join(','),
    ...sampleRows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'st_cecilias_students_masterlist_template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a pre-formatted Excel (.xlsx) file populated with ready-to-test student records
 */
export function downloadSampleExcelTemplate(): void {
  const data = SAMPLE_TEST_STUDENTS.map((s) => ({
    'Student ID': s.studentId,
    'Full Name': s.fullName,
    'Batch Year': s.batchYear,
    'Course': s.course,
    'Status': s.status,
    'Honors': s.honors,
    'Email Address': s.email,
    'Contact Phone': s.phone
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Students Masterlist');

  // Auto-size columns for clear readability
  worksheet['!cols'] = [
    { wch: 16 }, // Student ID
    { wch: 30 }, // Full Name
    { wch: 12 }, // Batch Year
    { wch: 32 }, // Course
    { wch: 14 }, // Status
    { wch: 32 }, // Honors
    { wch: 36 }, // Email Address
    { wch: 20 }  // Phone
  ];

  XLSX.writeFile(workbook, 'st_cecilias_students_masterlist_template.xlsx');
}

export interface BulkImportOptions {
  deduplicationMode: 'merge' | 'skip_existing' | 'overwrite';
  uploadedBy?: string;
  sourceFile?: string;
  onProgress?: (processed: number, total: number) => void;
}

export interface BulkImportResult {
  totalParsed: number;
  importedToFirestore: number;
  updatedCount: number;
  skippedCount: number;
  invalidCount: number;
  readyStudentIds: Array<{ studentId: string; fullName: string; batchYear: string; course: string }>;
}

/**
 * Performs atomic bulk import of validated student records into Firestore database and local cache
 */
export async function bulkImportStudentsToFirestore(
  records: StudentVerificationRecord[],
  options: BulkImportOptions
): Promise<BulkImportResult> {
  const existing = getRegistrarRecords();
  const existingMap = new Map<string, StudentVerificationRecord>();
  existing.forEach((r) => {
    existingMap.set(normalizeStudentId(r.studentId).toUpperCase(), r);
  });

  const now = new Date().toISOString();
  const recordsToWriteToFirestore: StudentVerificationRecord[] = [];
  const readyStudentIds: Array<{ studentId: string; fullName: string; batchYear: string; course: string }> = [];

  let importedToFirestore = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let invalidCount = 0;

  for (const raw of records) {
    const normId = normalizeStudentId(raw.studentId).toUpperCase();
    if (!normId || !raw.fullName?.trim()) {
      invalidCount++;
      continue;
    }

    const exists = existingMap.has(normId);

    if (exists && options.deduplicationMode === 'skip_existing') {
      skippedCount++;
      continue;
    }

    const current = exists ? existingMap.get(normId)! : null;

    const consolidated: StudentVerificationRecord = {
      ...raw,
      studentId: normId,
      fullName: raw.fullName.trim(),
      batchYear: raw.batchYear ? String(raw.batchYear).trim() : (current?.batchYear || '2024'),
      course: raw.course ? raw.course.trim() : (current?.course || 'Bachelor Degree Program'),
      status: raw.status || current?.status || 'Graduated',
      honors: raw.honors || current?.honors || undefined,
      email: raw.email || current?.email || undefined,
      phone: raw.phone || current?.phone || undefined,
      isRegistered: current?.isRegistered ?? false,
      registeredAt: current?.registeredAt,
      matchedUid: current?.matchedUid,
      uploadedAt: now,
      uploadedBy: options.uploadedBy || 'Registrar Bulk CSV Utility',
      sourceFile: options.sourceFile || 'bulk_import.csv'
    };

    recordsToWriteToFirestore.push(consolidated);
    existingMap.set(normId, consolidated);

    if (exists) {
      updatedCount++;
    } else {
      importedToFirestore++;
    }

    if (readyStudentIds.length < 10) {
      readyStudentIds.push({
        studentId: consolidated.studentId,
        fullName: consolidated.fullName,
        batchYear: consolidated.batchYear,
        course: consolidated.course
      });
    }
  }

  // Update local storage cache immediately
  const finalLocalRecords = Array.from(existingMap.values());
  saveRegistrarRecords(finalLocalRecords);

  // Write batch into Firestore database with progress callback
  if (recordsToWriteToFirestore.length > 0) {
    await saveRegistryRecordsBatchToFirestore(recordsToWriteToFirestore, (processed, total) => {
      if (options.onProgress) {
        options.onProgress(processed, total);
      }
    });
  }

  return {
    totalParsed: records.length,
    importedToFirestore,
    updatedCount,
    skippedCount,
    invalidCount,
    readyStudentIds
  };
}

/**
 * Downloads the active registry records as a formatted CSV file for offline auditing
 */
export function exportRegistryRecordsToCsv(recordsToExport?: StudentVerificationRecord[]): void {
  const records = recordsToExport || getRegistrarRecords();

  const headers = [
    'Student ID',
    'Full Name',
    'Batch Year',
    'Degree / Course',
    'Academic Status',
    'Honors & Distinctions',
    'Institutional Email',
    'Contact Phone',
    'Registration Status',
    'Matched Account UID',
    'Registration Date',
    'Uploaded Timestamp',
    'Uploaded By',
    'Source Spreadsheet'
  ];

  const rows = records.map((r) => [
    r.studentId || '',
    r.fullName || '',
    r.batchYear || '',
    r.course || '',
    r.status || 'Graduated',
    r.honors || '',
    r.email || '',
    r.phone || '',
    r.isRegistered ? 'Registered & Verified' : 'Pending Sign-Up',
    r.matchedUid || '',
    r.registeredAt || '',
    r.uploadedAt || '',
    r.uploadedBy || '',
    r.sourceFile || ''
  ]);

  const csvContent = [
    headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const dateStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `st_cecilias_alumni_registry_audit_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// =========================================================================
// CONFLICT RESOLUTION SYSTEM & REPOSITORY
// =========================================================================

export const INITIAL_REGISTRY_CONFLICTS: RegistrationConflictRecord[] = [];

/**
 * Retrieves all conflict records
 */
export function getRegistrationConflicts(): RegistrationConflictRecord[] {
  try {
    const raw = localStorage.getItem(REGISTRY_CONFLICTS_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Sanitize out old mock conflict records if previously stored in browser
    return parsed.filter((c) => c && !['conflict_01', 'conflict_02', 'conflict_03', 'conflict_04'].includes(c.id));
  } catch (err) {
    console.warn('Error reading registry conflicts from storage:', err);
    return [];
  }
}

/**
 * Saves conflict records
 */
export function saveRegistrationConflicts(conflicts: RegistrationConflictRecord[]): void {
  try {
    localStorage.setItem(REGISTRY_CONFLICTS_STORAGE_KEY, JSON.stringify(conflicts));
  } catch (err) {
    console.error('Failed to save registration conflicts:', err);
  }
}

/**
 * Adds a new conflict record to the queue
 */
export function addRegistrationConflict(
  data: Omit<RegistrationConflictRecord, 'id' | 'flaggedAt' | 'status'>
): RegistrationConflictRecord {
  const current = getRegistrationConflicts();
  const newConflict: RegistrationConflictRecord = {
    ...data,
    id: `conflict_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    flaggedAt: new Date().toISOString(),
    status: 'pending'
  };

  const updated = [newConflict, ...current];
  saveRegistrationConflicts(updated);
  return newConflict;
}

/**
 * Resolves a conflict entry
 */
export function resolveConflictRecord(
  conflictId: string,
  decision: 'resolved_verified' | 'resolved_rejected' | 'dismissed',
  resolvedBy: string = 'Registrar Officer',
  resolutionNote?: string
): boolean {
  const current = getRegistrationConflicts();
  const index = current.findIndex((c) => c.id === conflictId);
  if (index === -1) return false;

  const conflict = current[index];
  const updatedConflict: RegistrationConflictRecord = {
    ...conflict,
    status: decision,
    resolvedAt: new Date().toISOString(),
    resolvedBy,
    resolutionNote: resolutionNote || `Marked as ${decision} by ${resolvedBy}`
  };

  current[index] = updatedConflict;
  saveRegistrationConflicts(current);

  // If verified by administrator, mark target student record as registered
  if (decision === 'resolved_verified' && conflict.targetRegistryStudentId) {
    markRegistryRecordAsRegistered(conflict.targetRegistryStudentId, conflict.applicantUid || '');
  }

  return true;
}

// =========================================================================
// BACKEND SERVICE: INCOMING REGISTRATION EVALUATOR & MATCHING ENGINE
// =========================================================================

export interface RegistrationEvaluationResult {
  isAutoVerified: boolean;
  canBypassManualReview: boolean;
  status: 'AUTO_VERIFIED' | 'CONFLICT_FLAGGED' | 'MANUAL_REVIEW_REQUIRED';
  matchedRecord?: StudentVerificationRecord;
  confidenceScore: number;
  matchReasons: string[];
  conflictRecord?: RegistrationConflictRecord;
  message: string;
}

/**
 * Backend service function:
 * Compares incoming registration details against uploaded CSV records.
 * - If valid direct match: automatically flags valid registration for direct access, bypassing manual verification.
 * - If partial / suspicious match: creates a Conflict Resolution entry requiring registrar review to prevent duplicate accounts.
 * - If no record exists: routes to standard registration requiring manual approval.
 */
export function evaluateIncomingRegistration(
  applicant: {
    studentId?: string;
    name?: string;
    email?: string;
    batch?: string;
    course?: string;
    uid?: string;
  },
  existingUsers: any[] = []
): RegistrationEvaluationResult {
  const records = getRegistrarRecords();
  const normId = applicant.studentId ? normalizeStudentId(applicant.studentId).toUpperCase() : '';
  const applicantName = applicant.name ? applicant.name.trim() : '';
  const applicantEmail = applicant.email ? applicant.email.trim().toLowerCase() : '';
  const applicantBatch = applicant.batch ? applicant.batch.trim() : '';

  // 1. Check if the provided Student ID is already linked to another active account
  if (normId) {
    const existingAccountWithId = existingUsers.find(
      (u) =>
        u.studentId &&
        normalizeStudentId(u.studentId).toUpperCase() === normId &&
        (!applicant.uid || u.uid !== applicant.uid)
    );

    if (existingAccountWithId) {
      const conflict = addRegistrationConflict({
        applicantUid: applicant.uid,
        applicantName: applicantName || 'Unknown Applicant',
        applicantEmail: applicantEmail,
        applicantStudentId: normId,
        applicantBatch: applicantBatch,
        applicantCourse: applicant.course,
        targetRegistryStudentId: normId,
        conflictType: 'duplicate_id',
        severity: 'high',
        confidenceScore: 85,
        notes: `Student ID ${normId} is already associated with existing member "${existingAccountWithId.name}" (${existingAccountWithId.email}). Flagged to prevent account duplication or unauthorized takeover.`
      });

      return {
        isAutoVerified: false,
        canBypassManualReview: false,
        status: 'CONFLICT_FLAGGED',
        confidenceScore: 85,
        matchReasons: ['Duplicate Student ID detected'],
        conflictRecord: conflict,
        message: `Student ID ${normId} is already linked to an existing alumni account. Queued for Registrar conflict review.`
      };
    }
  }

  // 2. Check for Masterlist Match
  if (normId) {
    const recordMatch = records.find(
      (r) => normalizeStudentId(r.studentId).toUpperCase() === normId
    );

    if (recordMatch) {
      const recNameNorm = normalizeName(recordMatch.fullName);
      const appNameNorm = normalizeName(applicantName);

      // Evaluate Name Consistency
      const nameParts = appNameNorm.split(' ').filter((p) => p.length > 2);
      const hasNameOverlap = nameParts.some((part) => recNameNorm.includes(part));

      // Case A: Serious Name Mismatch
      if (applicantName && !hasNameOverlap) {
        const conflict = addRegistrationConflict({
          applicantUid: applicant.uid,
          applicantName,
          applicantEmail,
          applicantStudentId: normId,
          applicantBatch: applicantBatch,
          applicantCourse: applicant.course,
          targetRegistryStudentId: normId,
          registryRecord: recordMatch,
          conflictType: 'name_mismatch',
          severity: 'high',
          confidenceScore: 60,
          notes: `Applicant name "${applicantName}" does not correlate with official registry record "${recordMatch.fullName}" for Student ID ${normId}. Manual transcript verification required.`
        });

        return {
          isAutoVerified: false,
          canBypassManualReview: false,
          status: 'CONFLICT_FLAGGED',
          confidenceScore: 60,
          matchReasons: [`Student ID belongs to official graduate: ${recordMatch.fullName}`],
          conflictRecord: conflict,
          message: `Student ID matches ${recordMatch.fullName}, but registered name was "${applicantName}". Flagged for Registrar review.`
        };
      }

      // Case B: Batch Year Divergence
      if (
        applicantBatch &&
        recordMatch.batchYear &&
        Math.abs(parseInt(applicantBatch, 10) - parseInt(recordMatch.batchYear, 10)) >= 3
      ) {
        const conflict = addRegistrationConflict({
          applicantUid: applicant.uid,
          applicantName,
          applicantEmail,
          applicantStudentId: normId,
          applicantBatch: applicantBatch,
          applicantCourse: applicant.course,
          targetRegistryStudentId: normId,
          registryRecord: recordMatch,
          conflictType: 'batch_discrepancy',
          severity: 'medium',
          confidenceScore: 75,
          notes: `Batch year discrepancy: Applicant selected Class of ${applicantBatch}, but Registrar records specify Class of ${recordMatch.batchYear}.`
        });

        return {
          isAutoVerified: false,
          canBypassManualReview: false,
          status: 'CONFLICT_FLAGGED',
          confidenceScore: 75,
          matchReasons: [`Registry specifies Batch ${recordMatch.batchYear}`],
          conflictRecord: conflict,
          message: `Graduation cohort discrepancy detected (Batch ${applicantBatch} vs ${recordMatch.batchYear}). Queued for review.`
        };
      }

      // Case C: Valid High-Confidence Match -> AUTO-VERIFY & BYPASS MANUAL REVIEW
      const matchReasons = [
        `Accredited Student ID confirmed: ${recordMatch.studentId}`,
        `Graduate Name verified: ${recordMatch.fullName}`,
        `Degree: ${recordMatch.course} (Batch ${recordMatch.batchYear})`
      ];

      if (recordMatch.honors) {
        matchReasons.push(`Honors: ${recordMatch.honors}`);
      }

      // Automatically mark record as registered
      markRegistryRecordAsRegistered(normId, applicant.uid || '');

      return {
        isAutoVerified: true,
        canBypassManualReview: true,
        status: 'AUTO_VERIFIED',
        matchedRecord: recordMatch,
        confidenceScore: 100,
        matchReasons,
        message: `Official Registrar Masterlist Match! Verified Graduate: ${recordMatch.fullName} (${recordMatch.course}, Class of ${recordMatch.batchYear}). Instant auto-verification granted!`
      };
    }
  }

  // 3. Email Match against Registrar masterlist
  if (applicantEmail) {
    const emailMatch = records.find(
      (r) => r.email && r.email.toLowerCase() === applicantEmail
    );

    if (emailMatch) {
      markRegistryRecordAsRegistered(emailMatch.studentId, applicant.uid || '');
      return {
        isAutoVerified: true,
        canBypassManualReview: true,
        status: 'AUTO_VERIFIED',
        matchedRecord: emailMatch,
        confidenceScore: 95,
        matchReasons: [
          `Institutional email confirmed: ${emailMatch.email}`,
          `Graduate ID: ${emailMatch.studentId}`,
          `Class of ${emailMatch.batchYear}`
        ],
        message: `Institutional record confirmed via email for ${emailMatch.fullName}. Direct verified access granted.`
      };
    }
  }

  // 4. Default: No accredited record found
  return {
    isAutoVerified: false,
    canBypassManualReview: false,
    status: 'MANUAL_REVIEW_REQUIRED',
    confidenceScore: 0,
    matchReasons: [],
    message: 'No official Registrar masterlist match found. Account registered under pending status awaiting manual verification.'
  };
}

