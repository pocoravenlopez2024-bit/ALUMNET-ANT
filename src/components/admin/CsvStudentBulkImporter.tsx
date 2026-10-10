import React, { useState, useRef, useMemo } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  FileDown,
  RefreshCw,
  Search,
  Database,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  UserCheck,
  Layers,
  X,
  FileText
} from 'lucide-react';
import { StudentVerificationRecord } from '../../types';
import { validateUploadedFile, sanitizeFileName } from '../../lib/security';
import {
  parseRegistrarFile,
  downloadSampleCsvTemplate,
  downloadSampleExcelTemplate,
  bulkImportStudentsToFirestore,
  SAMPLE_TEST_STUDENTS,
  getRegistrarRecords,
  normalizeStudentId,
  isValidStudentIdPattern,
  BulkImportResult
} from '../../services/studentVerificationService';
import { useAlumni } from '../../context/AlumniContext';

interface CsvStudentBulkImporterProps {
  onImportComplete?: () => void;
  onClose?: () => void;
}

interface ParsedRowValidation {
  record: StudentVerificationRecord;
  isValid: boolean;
  isDuplicateInFile: boolean;
  existsInDatabase: boolean;
  errors: string[];
  warnings: string[];
}

export const CsvStudentBulkImporter: React.FC<CsvStudentBulkImporterProps> = ({
  onImportComplete,
  onClose
}) => {
  const { currentUser, showToast, addAuditLog } = useAlumni();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);

  const [rawRecords, setRawRecords] = useState<StudentVerificationRecord[] | null>(null);
  const [dedupMode, setDedupMode] = useState<'merge' | 'skip_existing' | 'overwrite'>('merge');

  // Preview filtering & search
  const [previewFilter, setPreviewFilter] = useState<'all' | 'valid' | 'existing' | 'warnings' | 'invalid'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Firestore import state
  const [isImportingToFirestore, setIsImportingToFirestore] = useState(false);
  const [importProgress, setImportProgress] = useState<{ processed: number; total: number } | null>(null);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Existing database IDs set for instant lookups
  const existingRecords = useMemo(() => getRegistrarRecords(), [importResult]);
  const existingMap = useMemo(() => {
    const map = new Map<string, StudentVerificationRecord>();
    existingRecords.forEach((r) => {
      map.set(normalizeStudentId(r.studentId).toUpperCase(), r);
    });
    return map;
  }, [existingRecords]);

  // Validated rows
  const validatedRows: ParsedRowValidation[] = useMemo(() => {
    if (!rawRecords) return [];

    const seenInFile = new Set<string>();
    return rawRecords.map((rec) => {
      const normId = normalizeStudentId(rec.studentId).toUpperCase();
      const errors: string[] = [];
      const warnings: string[] = [];

      if (!normId) {
        errors.push('Student ID is missing');
      } else if (!isValidStudentIdPattern(normId)) {
        warnings.push(`Non-standard ID format (Expected SC-YYYY-XXXX)`);
      }

      if (!rec.fullName || !rec.fullName.trim()) {
        errors.push('Full name is required');
      }

      if (!rec.batchYear) {
        warnings.push('Batch year missing (defaulted to 2024)');
      }

      if (!rec.course) {
        warnings.push('Course / Program missing (defaulted)');
      }

      if (rec.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rec.email.trim())) {
        warnings.push('Email syntax non-standard');
      }

      const isDuplicateInFile = Boolean(normId && seenInFile.has(normId));
      if (normId) seenInFile.add(normId);

      const existsInDatabase = Boolean(normId && existingMap.has(normId));

      return {
        record: rec,
        isValid: errors.length === 0,
        isDuplicateInFile,
        existsInDatabase,
        errors,
        warnings
      };
    });
  }, [rawRecords, existingMap]);

  // Summary counts
  const counts = useMemo(() => {
    let valid = 0;
    let existing = 0;
    let warnings = 0;
    let invalid = 0;

    validatedRows.forEach((r) => {
      if (r.isValid) valid++;
      else invalid++;

      if (r.existsInDatabase) existing++;
      if (r.warnings.length > 0) warnings++;
    });

    return { total: validatedRows.length, valid, existing, warnings, invalid };
  }, [validatedRows]);

  // Filtered rows for display
  const displayedRows = useMemo(() => {
    return validatedRows.filter((item) => {
      // Filter tab
      if (previewFilter === 'valid' && !item.isValid) return false;
      if (previewFilter === 'existing' && !item.existsInDatabase) return false;
      if (previewFilter === 'warnings' && item.warnings.length === 0) return false;
      if (previewFilter === 'invalid' && item.isValid) return false;

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const rec = item.record;
        const matches =
          rec.studentId.toLowerCase().includes(q) ||
          rec.fullName.toLowerCase().includes(q) ||
          (rec.course && rec.course.toLowerCase().includes(q)) ||
          (rec.batchYear && rec.batchYear.toLowerCase().includes(q)) ||
          (rec.email && rec.email.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [validatedRows, previewFilter, searchQuery]);

  // Process selected file
  const handleFileProcess = async (file: File) => {
    setIsParsing(true);
    const safeName = sanitizeFileName(file.name);
    setFileName(safeName);
    setFileSize(`${(file.size / 1024).toFixed(1)} KB`);
    setImportResult(null);

    try {
      // Production security: inspect file size, extension, MIME type, and structure
      const valResult = await validateUploadedFile(file, 'documents');
      if (!valResult.valid) {
        throw new Error(valResult.error || 'File validation failed.');
      }

      const parsed = await parseRegistrarFile(file);
      if (!parsed || parsed.length === 0) {
        throw new Error('No student records found in file. Please ensure column headers match.');
      }
      setRawRecords(parsed);
      showToast(`Parsed ${parsed.length} student records from ${file.name}. Review below.`, 'info');
    } catch (err: any) {
      showToast(err?.message || 'Failed to parse file.', 'error');
      setRawRecords(null);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileProcess(file);
    }
  };

  // Quick load sample dataset
  const handleLoadSampleDataset = () => {
    setFileName('st_cecilia_sample_students.csv');
    setFileSize('4.2 KB');
    setImportResult(null);
    const sampleRecords: StudentVerificationRecord[] = SAMPLE_TEST_STUDENTS.map((s) => ({
      studentId: s.studentId,
      fullName: s.fullName,
      batchYear: s.batchYear,
      course: s.course,
      status: s.status,
      honors: s.honors,
      email: s.email,
      phone: s.phone,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'Pre-loaded Cecilian Sample'
    }));
    setRawRecords(sampleRecords);
    showToast(`Loaded ${sampleRecords.length} ready-to-test Cecilian student records!`, 'success');
  };

  // Execute bulk import to Firestore
  const handleExecuteBulkImport = async () => {
    if (!rawRecords || rawRecords.length === 0) return;

    setIsImportingToFirestore(true);
    setImportProgress({ processed: 0, total: rawRecords.length });

    try {
      const result = await bulkImportStudentsToFirestore(rawRecords, {
        deduplicationMode: dedupMode,
        uploadedBy: currentUser?.name || 'Academic Registrar',
        sourceFile: fileName || 'student_registry.csv',
        onProgress: (processed, total) => {
          setImportProgress({ processed, total });
        }
      });

      setImportResult(result);

      addAuditLog({
        action: 'REGISTRAR_REGISTRY_UPLOAD',
        actorId: currentUser?.uid || 'registrar',
        actorName: currentUser?.name || 'Academic Registrar',
        actorRole: currentUser?.role || 'registrar',
        category: 'alumni_registration',
        details: `Bulk imported ${result.importedToFirestore} new students and updated ${result.updatedCount} in Firestore registry from ${fileName || 'CSV'}.`,
        severity: 'success'
      });

      showToast(
        `Successfully bulk-imported ${result.importedToFirestore} students into Firestore!`,
        'success'
      );

      if (onImportComplete) {
        onImportComplete();
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to bulk-import records to Firestore.', 'error');
    } finally {
      setIsImportingToFirestore(false);
      setImportProgress(null);
    }
  };

  const copyStudentId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast(`Copied Student ID ${id} to clipboard!`);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#991B1B]/10 text-[#991B1B] flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-extrabold text-stone-900">
              Registrar CSV / Excel Student Bulk Importer
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
              Firestore Cloud
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Parse, validate, and bulk-import official student records into the Firestore database for instant registration verification.
          </p>
        </div>

        {/* Quick Sample Downloads */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={downloadSampleCsvTemplate}
            className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download formatted CSV file with ready-to-test student records"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Sample CSV</span>
          </button>

          <button
            onClick={downloadSampleExcelTemplate}
            className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Download formatted Excel workbook (.xlsx) with ready-to-test student records"
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-600" />
            <span>Sample Excel (.xlsx)</span>
          </button>

          <button
            onClick={handleLoadSampleDataset}
            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Directly load test students into the parser for testing"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Quick Load Sample</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg hover:bg-stone-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Upload & Drag-and-Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed transition-all p-6 sm:p-8 text-center cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
            : 'border-stone-300 hover:border-blue-400 bg-stone-50/60 hover:bg-blue-50/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv, .xlsx, .xls, .txt"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileProcess(file);
          }}
          className="hidden"
        />

        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto shadow-2xs">
            {isParsing ? (
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
            ) : (
              <Upload className="w-6 h-6 text-blue-600" />
            )}
          </div>

          <div>
            <h3 className="text-sm font-bold text-stone-900">
              {fileName ? `Active File: ${fileName}` : 'Drag & drop student CSV or Excel file here'}
            </h3>
            <p className="text-xs text-stone-500 mt-1">
              Supports <strong className="text-stone-700">.CSV</strong>,{' '}
              <strong className="text-stone-700">.XLSX</strong>, and{' '}
              <strong className="text-stone-700">.XLS</strong> files. Or click to browse your computer.
            </p>
          </div>

          {fileName && fileSize && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 text-xs font-semibold">
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{fileName} ({fileSize})</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-center gap-4 text-[11px] text-stone-400">
            <span>• Auto Header Detection</span>
            <span>• Format Validation</span>
            <span>• Batch Firestore Write</span>
          </div>
        </div>
      </div>

      {/* PARSED DATA PREVIEW & DIAGNOSTICS */}
      {rawRecords && rawRecords.length > 0 && (
        <div className="space-y-5 pt-2 border-t border-stone-200">
          {/* Top Diagnostics Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <button
              onClick={() => setPreviewFilter('all')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                previewFilter === 'all'
                  ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold block ${previewFilter === 'all' ? 'text-stone-300' : 'text-stone-400'}`}>
                Total Records
              </span>
              <span className="text-xl font-black mt-0.5 block">{counts.total}</span>
            </button>

            <button
              onClick={() => setPreviewFilter('valid')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                previewFilter === 'valid'
                  ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold block ${previewFilter === 'valid' ? 'text-emerald-200' : 'text-emerald-600'}`}>
                Valid & Ready
              </span>
              <span className="text-xl font-black mt-0.5 block text-emerald-700">{counts.valid}</span>
            </button>

            <button
              onClick={() => setPreviewFilter('existing')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                previewFilter === 'existing'
                  ? 'bg-blue-700 text-white border-blue-700 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold block ${previewFilter === 'existing' ? 'text-blue-200' : 'text-blue-600'}`}>
                Already In DB
              </span>
              <span className="text-xl font-black mt-0.5 block text-blue-700">{counts.existing}</span>
            </button>

            <button
              onClick={() => setPreviewFilter('warnings')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                previewFilter === 'warnings'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold block ${previewFilter === 'warnings' ? 'text-amber-200' : 'text-amber-600'}`}>
                Warnings
              </span>
              <span className="text-xl font-black mt-0.5 block text-amber-600">{counts.warnings}</span>
            </button>

            <button
              onClick={() => setPreviewFilter('invalid')}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                previewFilter === 'invalid'
                  ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                  : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
              }`}
            >
              <span className={`text-[10px] uppercase font-bold block ${previewFilter === 'invalid' ? 'text-rose-200' : 'text-rose-600'}`}>
                Invalid / Skipped
              </span>
              <span className="text-xl font-black mt-0.5 block text-rose-700">{counts.invalid}</span>
            </button>
          </div>

          {/* Configuration & Action Bar */}
          <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-bold text-stone-700 shrink-0">
                Deduplication Strategy:
              </span>
              <div className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="dedup"
                    value="merge"
                    checked={dedupMode === 'merge'}
                    onChange={() => setDedupMode('merge')}
                    className="text-[#991B1B] focus:ring-[#991B1B]"
                  />
                  <span className="text-stone-800 font-medium">Merge & Update (Keep registration links)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer ml-2">
                  <input
                    type="radio"
                    name="dedup"
                    value="skip_existing"
                    checked={dedupMode === 'skip_existing'}
                    onChange={() => setDedupMode('skip_existing')}
                    className="text-[#991B1B] focus:ring-[#991B1B]"
                  />
                  <span className="text-stone-800 font-medium">Skip Existing</span>
                </label>
              </div>
            </div>

            {/* Commit Button */}
            <div className="flex items-center gap-2 self-end md:self-auto">
              <button
                onClick={() => {
                  setRawRecords(null);
                  setFileName(null);
                }}
                disabled={isImportingToFirestore}
                className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Clear
              </button>

              <button
                onClick={handleExecuteBulkImport}
                disabled={isImportingToFirestore || counts.valid === 0}
                className="px-5 py-2 bg-[#991B1B] hover:bg-[#7F1D1D] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isImportingToFirestore ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Writing to Firestore...</span>
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    <span>Import {counts.valid} Records to Firestore</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Live Progress Bar during Firestore batch write */}
          {importProgress && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" />
                  <span>Committing records into Firestore collection 'registry_records'...</span>
                </span>
                <span>
                  {importProgress.processed} / {importProgress.total} records
                </span>
              </div>
              <div className="w-full h-2.5 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.round((importProgress.processed / importProgress.total) * 100)}%`
                  }}
                />
              </div>
            </div>
          )}

          {/* Search Filter for Table */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search parsed records by ID, name, course..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <span className="text-xs text-stone-400 font-medium">
              Showing {displayedRows.length} of {validatedRows.length} records
            </span>
          </div>

          {/* Parsed Rows Review Table */}
          <div className="overflow-x-auto border border-stone-200 rounded-xl max-h-80 overflow-y-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-100 text-stone-700 font-bold sticky top-0 z-10 border-b border-stone-200">
                <tr>
                  <th className="p-2.5">Status</th>
                  <th className="p-2.5">Student ID</th>
                  <th className="p-2.5">Full Name</th>
                  <th className="p-2.5">Batch</th>
                  <th className="p-2.5">Course / Degree</th>
                  <th className="p-2.5">Honors</th>
                  <th className="p-2.5">Email</th>
                  <th className="p-2.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-800">
                {displayedRows.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-stone-400">
                      No records match the current filter.
                    </td>
                  </tr>
                ) : (
                  displayedRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-stone-50 ${
                        !row.isValid
                          ? 'bg-rose-50/40'
                          : row.existsInDatabase
                          ? 'bg-blue-50/20'
                          : ''
                      }`}
                    >
                      <td className="p-2.5 whitespace-nowrap">
                        {!row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                            <AlertCircle className="w-3 h-3" />
                            Invalid
                          </span>
                        ) : row.existsInDatabase ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-md">
                            <RefreshCw className="w-3 h-3" />
                            Update
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                            <CheckCircle2 className="w-3 h-3" />
                            Ready
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-stone-900">
                        {row.record.studentId || <span className="text-rose-500 italic">Empty</span>}
                      </td>
                      <td className="p-2.5 font-semibold text-stone-900">
                        {row.record.fullName || <span className="text-rose-500 italic">Missing</span>}
                      </td>
                      <td className="p-2.5 font-mono text-stone-600">{row.record.batchYear || '—'}</td>
                      <td className="p-2.5 text-stone-700 max-w-[180px] truncate" title={row.record.course}>
                        {row.record.course || '—'}
                      </td>
                      <td className="p-2.5 text-stone-500 max-w-[150px] truncate" title={row.record.honors}>
                        {row.record.honors || '—'}
                      </td>
                      <td className="p-2.5 text-stone-500">{row.record.email || '—'}</td>
                      <td className="p-2.5 text-[11px]">
                        {row.errors.length > 0 && (
                          <span className="text-rose-600 font-semibold">{row.errors.join(', ')}</span>
                        )}
                        {row.errors.length === 0 && row.warnings.length > 0 && (
                          <span className="text-amber-600">{row.warnings.join(', ')}</span>
                        )}
                        {row.errors.length === 0 && row.warnings.length === 0 && (
                          <span className="text-stone-400">OK</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* POST-IMPORT SUCCESS BANNER & READY-TO-TEST STUDENT IDS */}
      {importResult && (
        <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-950">
                  Bulk Import to Firestore Completed Successfully!
                </h3>
                <p className="text-xs text-emerald-800">
                  Imported <strong className="font-extrabold">{importResult.importedToFirestore}</strong> new records,
                  updated <strong className="font-extrabold">{importResult.updatedCount}</strong> records, and skipped {importResult.skippedCount} duplicates.
                </p>
              </div>
            </div>

            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full self-start sm:self-auto">
              Live in Database
            </span>
          </div>

          {/* Test Student IDs for Registration Testing */}
          {importResult.readyStudentIds && importResult.readyStudentIds.length > 0 && (
            <div className="bg-white rounded-xl border border-emerald-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Ready-to-Test Student Credentials (for Actual Registration)</span>
                  </h4>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Click "Copy ID" on any student below, then go to the Registration page. When you input this Student ID, the system will automatically match and verify the graduate instantly!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {importResult.readyStudentIds.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl border border-stone-200 bg-stone-50/60 hover:bg-stone-50 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-xs font-bold text-[#991B1B] truncate">
                        {item.studentId}
                      </div>
                      <div className="text-[11px] font-semibold text-stone-800 truncate">
                        {item.fullName}
                      </div>
                      <div className="text-[10px] text-stone-400 truncate">
                        {item.course} • Batch {item.batchYear}
                      </div>
                    </div>

                    <button
                      onClick={() => copyStudentId(item.studentId)}
                      className="px-2 py-1 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 transition-colors cursor-pointer"
                      title="Copy Student ID"
                    >
                      {copiedId === item.studentId ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-700">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-stone-500" />
                          <span>Copy ID</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
