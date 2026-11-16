import React from 'react';
import { ReservationStatus, FacultyCode } from '../../types';
import { FACULTIES_DATA } from '../../data/seedData';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'default'
    | 'forest'
    | 'sage'
    | 'pending'
    | 'approved'
    | 'rejected'
    | 'revision_requested'
    | 'completed'
    | 'info';
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  size = 'md',
}) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-medium';

  const variantMap = {
    default: 'bg-stone-100 text-stone-800 border-stone-200',
    forest: 'bg-emerald-900/10 text-emerald-900 border-emerald-800/20 font-semibold',
    sage: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    pending: 'bg-amber-100 text-amber-900 border-amber-300 font-medium',
    approved: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-semibold',
    rejected: 'bg-rose-100 text-rose-900 border-rose-300 font-medium',
    revision_requested: 'bg-orange-100 text-orange-900 border-orange-300 font-semibold',
    completed: 'bg-slate-100 text-slate-800 border-slate-300',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${sizeClasses} ${variantMap[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: ReservationStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="pending" size={size}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
          Menunggu TU
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="approved" size={size}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
          Disetujui
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="rejected" size={size}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          Ditolak
        </Badge>
      );
    case 'revision_requested':
      return (
        <Badge variant="revision_requested" size={size}>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
          Perlu Revisi Dokumen
        </Badge>
      );
    case 'completed':
      return (
        <Badge variant="completed" size={size}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          Selesai
        </Badge>
      );
    case 'cancelled':
      return (
        <Badge variant="default" size={size}>
          <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
          Dibatalkan
        </Badge>
      );
  }
};

export const FacultyBadge: React.FC<{ faculty: FacultyCode; className?: string }> = ({
  faculty,
  className = '',
}) => {
  const meta = FACULTIES_DATA[faculty] || FACULTIES_DATA.PUSAT_RIK;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${meta.badgeBg} ${className}`}
    >
      {meta.code} • {meta.shortName}
    </span>
  );
};
