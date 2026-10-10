import { jsPDF } from 'jspdf';
import { RegistrationConflictRecord } from '../types';

export interface PdfReportOptions {
  officerName: string;
  officerRole?: string;
  institutionName?: string;
}

export function generateConflictResolutionPdfReport(
  conflicts: RegistrationConflictRecord[],
  options: PdfReportOptions
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  let currentY = margin;

  const primaryColor = [153, 27, 27]; // #991B1B Maroon
  const darkStone = [41, 37, 36];
  const mutedStone = [120, 113, 108];
  const lightBg = [245, 245, 244];

  // Helper for text wrapping & paging
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - margin) {
      doc.addPage();
      currentY = margin;
      drawHeaderSmall();
    }
  };

  const drawHeaderSmall = () => {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(mutedStone[0], mutedStone[1], mutedStone[2]);
    doc.text("St. Cecilia's College - Office of the Registrar | Conflict Resolution Audit Report", margin, currentY);
    doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin, currentY, { align: 'right' });
    currentY += 6;
    doc.setDrawColor(220, 220, 220);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 6;
  };

  // 1. Top Decorative Bar
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(margin, currentY, pageWidth - margin * 2, 4, 'F');
  currentY += 10;

  // 2. Institution Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text("ST. CECILIA'S COLLEGE - CEBU, INC.", margin, currentY);
  currentY += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(darkStone[0], darkStone[1], darkStone[2]);
  doc.text("OFFICE OF THE REGISTRAR & ALUMNI ACCREDITATION SERVICES", margin, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedStone[0], mutedStone[1], mutedStone[2]);
  doc.text("Poblacion Ward II, Minglanilla, Cebu, Philippines • Institutional Accredited Masterlist System", margin, currentY);
  currentY += 8;

  // Horizontal separator
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 7;

  // 3. Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(darkStone[0], darkStone[1], darkStone[2]);
  doc.text("STUDENT REGISTRATION CONFLICT & MANUAL OVERRIDE AUDIT REPORT", margin, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(mutedStone[0], mutedStone[1], mutedStone[2]);
  doc.text(
    "Official summary of student credential discrepancies, automated flags, and manual registrar decisions.",
    margin,
    currentY
  );
  currentY += 7;

  // 4. Session Metadata Panel
  doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
  doc.roundedRect(margin, currentY, pageWidth - margin * 2, 22, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(darkStone[0], darkStone[1], darkStone[2]);
  doc.text("REPORT METADATA & COMPLIANCE STAMP", margin + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generated On: ${new Date().toLocaleString()}`, margin + 4, currentY + 11);
  doc.text(`Reviewing Officer: ${options.officerName} (${options.officerRole || 'Registrar Officer'})`, margin + 4, currentY + 16);

  const pendingCount = conflicts.filter((c) => c.status === 'pending').length;
  const verifiedCount = conflicts.filter((c) => c.status === 'resolved_verified').length;
  const rejectedCount = conflicts.filter((c) => c.status === 'resolved_rejected').length;
  const dismissedCount = conflicts.filter((c) => c.status === 'dismissed').length;

  doc.text(`Total Records Evaluated: ${conflicts.length}`, pageWidth / 2 + 10, currentY + 11);
  doc.text(
    `Outcomes: ${verifiedCount} Overridden/Verified  •  ${rejectedCount} Rejected  •  ${pendingCount} Pending`,
    pageWidth / 2 + 10,
    currentY + 16
  );

  currentY += 28;

  // 5. Section Header for Records
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`RESOLVED CONFLICTS & MANUAL AUDIT LOGS (${conflicts.length} Total Incidents)`, margin, currentY);
  currentY += 5;

  // 6. Records Listing
  if (conflicts.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(mutedStone[0], mutedStone[1], mutedStone[2]);
    doc.text("No registration conflicts or discrepancies recorded in the current session.", margin, currentY + 5);
    currentY += 15;
  } else {
    conflicts.forEach((conflict, index) => {
      checkPageBreak(38);

      // Card container
      const cardHeight = 32;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(margin, currentY, pageWidth - margin * 2, cardHeight, 1.5, 1.5, 'FD');

      // Top strip indicating outcome
      let statusColor = [217, 119, 6]; // Amber
      let statusLabel = 'PENDING REVIEW';
      if (conflict.status === 'resolved_verified') {
        statusColor = [22, 101, 52]; // Green
        statusLabel = 'MANUAL OVERRIDE: APPROVED & VERIFIED';
      } else if (conflict.status === 'resolved_rejected') {
        statusColor = [153, 27, 27]; // Red
        statusLabel = 'MANUAL OVERRIDE: CLAIM REJECTED';
      } else if (conflict.status === 'dismissed') {
        statusColor = [100, 116, 139]; // Slate
        statusLabel = 'CONFLICT DISMISSED';
      }

      doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
      doc.rect(margin, currentY, pageWidth - margin * 2, 5, 'F');

      // Header text inside strip
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);
      doc.text(`INCIDENT #${index + 1}: ${statusLabel}`, margin + 3, currentY + 3.8);

      // Conflict Type on right of strip
      const typeLabel =
        conflict.conflictType === 'duplicate_id'
          ? 'DUPLICATE STUDENT ID'
          : conflict.conflictType === 'name_mismatch'
          ? 'NAME MISMATCH'
          : conflict.conflictType === 'batch_discrepancy'
          ? 'BATCH YEAR DISCREPANCY'
          : 'DEGREE PROGRAM MISMATCH';
      doc.text(typeLabel, pageWidth - margin - 3, currentY + 3.8, { align: 'right' });

      // Body text inside record card
      doc.setTextColor(darkStone[0], darkStone[1], darkStone[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`Applicant: ${conflict.applicantName}`, margin + 4, currentY + 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(`Email: ${conflict.applicantEmail}`, margin + 4, currentY + 14);
      doc.text(`Claimed Student ID: ${conflict.applicantStudentId || 'N/A'}`, margin + 4, currentY + 18);

      // Registrar Registry Reference
      const regRef = conflict.registryRecord
        ? `Registry Match: ${conflict.registryRecord.fullName} (${conflict.registryRecord.studentId} • Batch ${conflict.registryRecord.batchYear})`
        : 'Registry Match: No prior match in database';
      doc.text(regRef, pageWidth / 2, currentY + 10);

      const resolutionInfo = conflict.resolvedBy
        ? `Resolved By: ${conflict.resolvedBy} on ${new Date(conflict.resolvedAt || '').toLocaleDateString()}`
        : `Flagged: ${new Date(conflict.flaggedAt).toLocaleString()}`;
      doc.text(resolutionInfo, pageWidth / 2, currentY + 14);

      // Resolution Note / Reason
      const noteText = conflict.resolutionNote
        ? `Registrar Note: "${conflict.resolutionNote}"`
        : `Resolution Reason: ${conflict.notes || 'Standard verification review'}`;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(mutedStone[0], mutedStone[1], mutedStone[2]);
      doc.text(doc.splitTextToSize(noteText, pageWidth - margin * 2 - 10), margin + 4, currentY + 24);

      currentY += cardHeight + 4;
    });
  }

  // 7. Signature & Certification Section
  checkPageBreak(40);
  currentY += 6;

  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.4);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(darkStone[0], darkStone[1], darkStone[2]);
  doc.text("INSTITUTIONAL ACCREDITATION & REGISTRAR CERTIFICATION", margin, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(mutedStone[0], mutedStone[1], mutedStone[2]);
  const certText =
    "I hereby certify that the student registration discrepancies, conflict analyses, and administrative overrides recorded in this report have been reviewed in accordance with the official academic records and registrar guidelines of St. Cecilia's College - Cebu, Inc.";
  doc.text(doc.splitTextToSize(certText, pageWidth - margin * 2), margin, currentY);
  currentY += 16;

  // Signature lines
  const sigWidth = 70;
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, currentY, margin + sigWidth, currentY);
  doc.line(pageWidth - margin - sigWidth, currentY, pageWidth - margin, currentY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(darkStone[0], darkStone[1], darkStone[2]);
  doc.text(`${options.officerName.toUpperCase()}`, margin, currentY + 4);
  doc.text("OFFICE OF THE REGISTRAR HEAD", pageWidth - margin - sigWidth, currentY + 4);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(mutedStone[0], mutedStone[1], mutedStone[2]);
  doc.text("Reviewing Registrar Officer / Evaluator", margin, currentY + 8);
  doc.text("St. Cecilia's College - Cebu, Inc.", pageWidth - margin - sigWidth, currentY + 8);

  // Trigger Save / Download
  const dateStr = new Date().toISOString().slice(0, 10);
  const fileName = `SCC_Conflict_Resolution_Report_${dateStr}.pdf`;
  doc.save(fileName);
}
