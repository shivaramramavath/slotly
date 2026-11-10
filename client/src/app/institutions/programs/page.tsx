// Degree programs view displaying curriculum track cards and cohort creation.
'use client';

import { useMemo } from 'react';
import { useInstitutionContext, InstitutionEmptyState } from '@/features/institution';
import { Button } from '@/components/ui/button';
import { GraduationCap, Plus, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

/** React page component rendering degree programs list and management cards. */
export default function ProgramsPage() {
  const { structure, openAddProgram, openAddAcademicYear, deleteProgram } = useInstitutionContext();
  const departments = useMemo(() => structure?.departments || [], [structure?.departments]);
  const programs = useMemo(() => departments.flatMap((d) => d.programs), [departments]);

  if (departments.length === 0) {
    return (
      <div className="rounded-[20px] border border-[#232323] bg-[#111111] p-8 text-center flex flex-col items-center justify-center min-h-[260px]">
        <div className="w-12 h-12 rounded-full border border-[#232323] bg-[#161616] flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-[#8A8A8A]" />
        </div>
        <h3 className="text-base font-semibold text-[#FAFAFA] mb-2">Department Required</h3>
        <p className="text-sm font-sans text-[#8A8A8A] max-w-md mx-auto mb-6">
          You must establish at least one academic department before configuring degree programs.
        </p>
        <Link href="/institutions/departments">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 rounded-[12px] border-[#232323] text-[#FAFAFA] hover:bg-[#161616]"
          >
            Go to Departments
          </Button>
        </Link>
      </div>
    );
  }

  if (programs.length === 0) {
    return (
      <InstitutionEmptyState
        icon={GraduationCap}
        title="No degree programs yet"
        description="Degree programs establish curriculum tracks and cohorts within an academic department."
        actionLabel="Create first program"
        onAction={() => openAddProgram()}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {programs.map((prog) => (
        <div
          key={prog.id}
          className="rounded-[16px] border border-[#232323] bg-[#111111] p-5 flex flex-col justify-between min-h-[160px] transition-colors hover:border-[#333333]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <GraduationCap className="h-4 w-4 text-[#FAFAFA]" />
                <h3 className="text-base font-semibold text-[#FAFAFA]">{prog.name}</h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded border border-[#232323] bg-[#161616] text-[#FAFAFA]">
                {prog.code}
              </span>
            </div>
            <p className="text-xs font-mono text-[#8A8A8A]">
              Duration: {prog.durationYears} Years • {prog.academicYears.length} cohort(s)
            </p>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#232323]/40 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openAddAcademicYear(prog.id)}
              className="text-xs h-8 px-3 rounded-[8px] border-[#232323] hover:bg-[#161616]"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add Year
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteProgram(prog.id, prog.name)}
              className="text-[#8A8A8A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 h-8 w-8 p-0 rounded-[8px]"
              aria-label={`Delete program ${prog.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
