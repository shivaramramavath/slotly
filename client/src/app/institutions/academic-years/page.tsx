// Academic years view displaying cohort levels and semester term management.
'use client';

import { useMemo } from 'react';
import { useInstitutionContext, InstitutionEmptyState } from '@/features/institution';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

/** React page component rendering academic years list and management cards. */
export default function AcademicYearsPage() {
  const { structure, openAddAcademicYear, openAddSemester, deleteAcademicYear } = useInstitutionContext();
  const departments = useMemo(() => structure?.departments || [], [structure?.departments]);
  const programs = useMemo(() => departments.flatMap((d) => d.programs), [departments]);
  const academicYears = useMemo(() => programs.flatMap((p) => p.academicYears), [programs]);

  if (programs.length === 0) {
    return (
      <div className="rounded-[20px] border border-[#232323] bg-[#111111] p-8 text-center flex flex-col items-center justify-center min-h-[260px]">
        <div className="w-12 h-12 rounded-full border border-[#232323] bg-[#161616] flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-[#8A8A8A]" />
        </div>
        <h3 className="text-base font-semibold text-[#FAFAFA] mb-2">Degree Program Required</h3>
        <p className="text-sm font-sans text-[#8A8A8A] max-w-md mx-auto mb-6">
          You must create at least one degree program before configuring academic year cohorts.
        </p>
        <Link href="/institutions/programs">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 rounded-[12px] border-[#232323] text-[#FAFAFA] hover:bg-[#161616]"
          >
            Go to Programs
          </Button>
        </Link>
      </div>
    );
  }

  if (academicYears.length === 0) {
    return (
      <InstitutionEmptyState
        icon={CalendarDays}
        title="No academic years yet"
        description="Academic years represent annual cohort levels (e.g. Year 1, Year 2) established under a program."
        actionLabel="Create first academic year"
        onAction={() => openAddAcademicYear()}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {academicYears.map((ay) => (
        <div
          key={ay.id}
          className="rounded-[16px] border border-[#232323] bg-[#111111] p-5 flex flex-col justify-between min-h-[160px] transition-colors hover:border-[#333333]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <CalendarDays className="h-4 w-4 text-[#FAFAFA]" />
                <h3 className="text-base font-semibold text-[#FAFAFA]">{ay.label}</h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded border border-[#232323] bg-[#161616] text-[#FAFAFA]">
                Year {ay.yearNumber}
              </span>
            </div>
            <p className="text-xs font-mono text-[#8A8A8A]">
              Contains {ay.semesters.length} semester{ay.semesters.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#232323]/40 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddSemester(ay.id)}
              className="text-xs h-8 px-3 rounded-[8px] border-[#232323] hover:bg-[#161616]"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Semester
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteAcademicYear(ay.id, ay.label)}
              className="text-[#8A8A8A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 h-8 w-8 p-0 rounded-[8px]"
              aria-label={`Delete academic year ${ay.label}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
