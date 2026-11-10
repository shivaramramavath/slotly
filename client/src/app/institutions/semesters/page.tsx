// Instructional semesters view displaying term date ranges and section creation.
'use client';

import { useMemo } from 'react';
import { useInstitutionContext, InstitutionEmptyState } from '@/features/institution';
import { Button } from '@/components/ui/button';
import { Clock, Plus, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

/** React page component rendering semesters list and management cards. */
export default function SemestersPage() {
  const { structure, openAddSemester, openAddSection, deleteSemester } = useInstitutionContext();
  const departments = useMemo(() => structure?.departments || [], [structure?.departments]);
  const programs = useMemo(() => departments.flatMap((d) => d.programs), [departments]);
  const academicYears = useMemo(() => programs.flatMap((p) => p.academicYears), [programs]);
  const semesters = useMemo(() => academicYears.flatMap((ay) => ay.semesters), [academicYears]);

  if (academicYears.length === 0) {
    return (
      <div className="rounded-[20px] border border-[#232323] bg-[#111111] p-8 text-center flex flex-col items-center justify-center min-h-[260px]">
        <div className="w-12 h-12 rounded-full border border-[#232323] bg-[#161616] flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-[#8A8A8A]" />
        </div>
        <h3 className="text-base font-semibold text-[#FAFAFA] mb-2">Academic Year Required</h3>
        <p className="text-sm font-sans text-[#8A8A8A] max-w-md mx-auto mb-6">
          You must create at least one academic year cohort before configuring instructional semesters.
        </p>
        <Link href="/institutions/academic-years">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 rounded-[12px] border-[#232323] text-[#FAFAFA] hover:bg-[#161616]"
          >
            Go to Academic Years
          </Button>
        </Link>
      </div>
    );
  }

  if (semesters.length === 0) {
    return (
      <InstitutionEmptyState
        icon={Clock}
        title="No semesters yet"
        description="Instructional semesters define active scheduling terms with start and end calendar boundaries."
        actionLabel="Create first semester"
        onAction={() => openAddSemester()}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {semesters.map((sem) => (
        <div
          key={sem.id}
          className="rounded-[16px] border border-[#232323] bg-[#111111] p-5 flex flex-col justify-between min-h-[160px] transition-colors hover:border-[#333333]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <Clock className="h-4 w-4 text-[#FAFAFA]" />
                <h3 className="text-base font-semibold text-[#FAFAFA]">{sem.name}</h3>
              </div>
              <span
                className={`text-xs font-mono px-2 py-0.5 rounded border ${
                  sem.active
                    ? 'border-[#22C55E]/40 bg-[#22C55E]/10 text-[#22C55E]'
                    : 'border-[#232323] bg-[#161616] text-[#8A8A8A]'
                }`}
              >
                {sem.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs font-mono text-[#8A8A8A]">
              #{sem.number} • {sem.startDate} to {sem.endDate} • {sem.sections.length} section(s)
            </p>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#232323]/40 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddSection(sem.id)}
              className="text-xs h-8 px-3 rounded-[8px] border-[#232323] hover:bg-[#161616]"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Section
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteSemester(sem.id, sem.name)}
              className="text-[#8A8A8A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 h-8 w-8 p-0 rounded-[8px]"
              aria-label={`Delete semester ${sem.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
