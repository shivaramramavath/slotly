// Component rendering the 6-stat card summary row for academic institutions matching sys0 guidelines.
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useInstitutionContext } from './institution-context';

/** Props for InstitutionStatsRow component. */
export interface InstitutionStatsRowProps {
  className?: string | undefined;
}

/** React component rendering 6-item monochrome statistics cards row. */
export function InstitutionStatsRow({ className = '' }: InstitutionStatsRowProps) {
  const { structure, isLoading } = useInstitutionContext();
  const stats = structure?.stats;

  const statItems = [
    { label: 'Departments', value: stats?.totalDepartments },
    { label: 'Programs', value: stats?.totalPrograms },
    { label: 'Cohorts / Years', value: stats?.totalAcademicYears },
    { label: 'Semesters', value: stats?.totalSemesters },
    { label: 'Sections', value: stats?.totalSections },
    { label: 'Total Students', value: stats?.totalStudents },
  ];

  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 ${className}`}>
      {statItems.map((item) => (
        <div
          key={item.label}
          className="rounded-[16px] border border-[#232323] bg-[#111111] p-4 flex flex-col justify-center min-h-[96px]"
        >
          {isLoading && item.value === undefined ? (
            <Skeleton className="h-8 w-16 rounded bg-[#232323] mb-2" />
          ) : (
            <span className="text-3xl font-mono font-semibold text-[#FAFAFA] tabular-nums tracking-tight">
              {item.value ?? 0}
            </span>
          )}
          <span className="text-xs font-mono text-[#8A8A8A] mt-1 truncate">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
