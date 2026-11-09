// Table skeleton component matching library table dimensions and column widths with zero layout shift.
'use client';

import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SurfaceCard } from '@/components/ui/surface-card';

/** Column specification for library table skeleton. */
export interface LibraryColumnSpec {
  label: string;
  widthClass?: string | undefined;
  align?: 'left' | 'right' | undefined;
}

/** Standard column specs for Faculty directory table. */
export const FACULTY_COLUMNS: LibraryColumnSpec[] = [
  { label: 'Code', widthClass: 'w-24 min-w-[80px]' },
  { label: 'Name', widthClass: 'min-w-[180px]' },
  { label: 'Department', widthClass: 'w-28 min-w-[100px]' },
  { label: 'Designation', widthClass: 'min-w-[120px]' },
  { label: 'Teaching Workload', widthClass: 'w-56 min-w-[220px]' },
  { label: 'Qualified Subjects', widthClass: 'w-36 min-w-[140px]' },
  { label: 'Status', widthClass: 'w-24 min-w-[90px]' },
  { label: 'Actions', widthClass: 'w-28 min-w-[110px]', align: 'right' },
];

/** Standard column specs for Subjects catalog table. */
export const SUBJECT_COLUMNS: LibraryColumnSpec[] = [
  { label: 'Code', widthClass: 'w-24 min-w-[80px]' },
  { label: 'Name', widthClass: 'min-w-[180px]' },
  { label: 'Department', widthClass: 'w-28 min-w-[100px]' },
  { label: 'Type', widthClass: 'w-24 min-w-[90px]' },
  { label: 'Credits', widthClass: 'w-20 min-w-[80px]' },
  { label: 'Weekly / Lab Hrs', widthClass: 'w-36 min-w-[140px]' },
  { label: 'Room Requirements', widthClass: 'min-w-[160px]' },
  { label: 'Elective Group', widthClass: 'w-32 min-w-[120px]' },
  { label: 'Actions', widthClass: 'w-28 min-w-[110px]', align: 'right' },
];

/** Standard column specs for Rooms directory table. */
export const ROOM_COLUMNS: LibraryColumnSpec[] = [
  { label: 'Code', widthClass: 'w-24 min-w-[80px]' },
  { label: 'Name', widthClass: 'min-w-[160px]' },
  { label: 'Building', widthClass: 'w-32 min-w-[120px]' },
  { label: 'Type', widthClass: 'w-24 min-w-[90px]' },
  { label: 'Capacity', widthClass: 'w-28 min-w-[100px]' },
  { label: 'Equipment', widthClass: 'min-w-[180px]' },
  { label: 'Shared', widthClass: 'w-20 min-w-[80px]' },
  { label: 'Status', widthClass: 'w-24 min-w-[90px]' },
  { label: 'Actions', widthClass: 'w-28 min-w-[110px]', align: 'right' },
];

/** Props for LibraryTableSkeleton component. */
export interface LibraryTableSkeletonProps {
  columns: LibraryColumnSpec[];
  rows?: number | undefined;
  className?: string | undefined;
}

/** React component rendering zero-layout-shift table skeleton for library resource pages. */
export function LibraryTableSkeleton({
  columns,
  rows = 8,
  className = '',
}: LibraryTableSkeletonProps) {
  // Show skeleton after 150ms delay to avoid flash on fast cache hits
  const [show, setShow] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setShow(true), 150);
    return () => clearTimeout(timer);
  }, []);

  if (!show) {
    return (
      <div className={`min-h-[400px] ${className}`} aria-busy="true" />
    );
  }

  return (
    <SurfaceCard flush={true} className={`overflow-x-auto ${className}`}>
      <table className="w-full text-left text-xs font-sans" aria-busy="true">
        <thead className="bg-[#111111] border-b border-[#232323] text-[#8A8A8A] font-mono">
          <tr>
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-4 py-3 ${col.widthClass || ''} ${
                  col.align === 'right' ? 'text-right' : 'text-left'
                }`}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#232323]">
          {Array.from({ length: rows }).map((_, rIdx) => (
            <tr key={rIdx} className="h-[52px]">
              {columns.map((col, cIdx) => (
                <td
                  key={cIdx}
                  className={`px-4 py-3 ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  <Skeleton
                    className={`h-4 bg-[#181818] rounded motion-reduce:animate-none ${
                      col.align === 'right' ? 'ml-auto w-16' : 'w-3/4 max-w-[140px]'
                    }`}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </SurfaceCard>
  );
}
