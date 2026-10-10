import { UserProfile } from '../types';

/**
 * Exports alumni records as a formatted CSV spreadsheet file.
 */
export function exportAlumniRosterCsv(users: UserProfile[], filenamePrefix: string = 'st_cecilia_alumni_roster') {
  if (!users || users.length === 0) return;

  const headers = [
    'Student ID',
    'Alumni ID',
    'Full Name',
    'Email',
    'Role',
    'Verification Status',
    'Class Batch',
    'Degree Program',
    'Department',
    'Current Position',
    'Company / Organization',
    'City / Location',
    'Phone / Contact'
  ];

  const escapeCsv = (val: any) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = users.map((u) => [
    escapeCsv(u.studentId || ''),
    escapeCsv(u.alumniId || ''),
    escapeCsv(u.name || ''),
    escapeCsv(u.email || ''),
    escapeCsv(u.role || 'alumni'),
    escapeCsv(u.isVerified ? 'VERIFIED' : 'PENDING'),
    escapeCsv(u.batch || ''),
    escapeCsv(u.course || ''),
    escapeCsv(u.department || ''),
    escapeCsv(u.currentPosition || ''),
    escapeCsv(u.company || ''),
    escapeCsv(u.location || ''),
    escapeCsv(u.phone || '')
  ]);

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);

  const dateStamp = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${filenamePrefix}_${dateStamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
