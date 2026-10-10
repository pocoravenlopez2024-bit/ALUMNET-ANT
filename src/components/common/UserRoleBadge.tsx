import React from 'react';
import {
  ShieldCheck,
  GraduationCap,
  Briefcase,
  FileCheck2,
  BookmarkCheck,
  BookOpen
} from 'lucide-react';
import { UserRole } from '../../types';

interface UserRoleBadgeProps {
  role?: UserRole | string;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  showIcon?: boolean;
}

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({
  role = 'alumni',
  size = 'xs',
  className = '',
  showIcon = true
}) => {
  const normalizedRole = (role || 'alumni').toLowerCase();

  let label = 'Alumni';
  let colorClasses = 'bg-blue-50 text-blue-700 border-blue-200';
  let Icon = GraduationCap;

  switch (normalizedRole) {
    case 'superadmin':
      label = 'Super Admin';
      colorClasses = 'bg-purple-100 text-purple-900 border-purple-300 font-bold';
      Icon = ShieldCheck;
      break;
    case 'admin':
    case 'administrator':
      label = 'Administrator';
      colorClasses = 'bg-rose-100 text-rose-900 border-rose-300 font-bold';
      Icon = ShieldCheck;
      break;
    case 'moderator':
      label = 'Moderator';
      colorClasses = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
      Icon = ShieldCheck;
      break;
    case 'registrar':
      label = 'Registrar';
      colorClasses = 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold';
      Icon = FileCheck2;
      break;
    case 'employer':
      label = 'Employer';
      colorClasses = 'bg-sky-100 text-sky-900 border-sky-300 font-bold';
      Icon = Briefcase;
      break;
    case 'staff':
      label = 'Staff Officer';
      colorClasses = 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold';
      Icon = BookmarkCheck;
      break;
    case 'alumni':
    default:
      label = 'Alumnus';
      colorClasses = 'bg-blue-50 text-blue-700 border-blue-200 font-semibold';
      Icon = GraduationCap;
      break;
  }

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-[10px] gap-1',
    sm: 'px-2 py-0.5 text-xs gap-1.5',
    md: 'px-2.5 py-1 text-xs gap-1.5'
  }[size];

  const iconSizes = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border tracking-wide select-none ${colorClasses} ${sizeClasses} ${className}`}
      title={`Verified role: ${label}`}
    >
      {showIcon && <Icon className={`${iconSizes} shrink-0`} />}
      <span className="truncate">{label}</span>
    </span>
  );
};
