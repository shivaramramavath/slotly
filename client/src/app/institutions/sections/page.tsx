// Sections and batches view displaying student cohorts and practical group divisions.
'use client';

import { useMemo } from 'react';
import { useInstitutionContext, InstitutionEmptyState } from '@/features/institution';
import { Button } from '@/components/ui/button';
import { Users, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

/** React page component rendering sections and batches list and management cards. */
export default function SectionsPage() {
  const { structure, openAddSection, deleteSection } = useInstitutionContext();
  const departments = useMemo(() => structure?.departments || [], [structure?.departments]);
  const programs = useMemo(() => departments.flatMap((d) => d.programs), [departments]);
  const academicYears = useMemo(() => programs.flatMap((p) => p.academicYears), [programs]);
  const semesters = useMemo(() => academicYears.flatMap((ay) => ay.semesters), [academicYears]);
  const sections = useMemo(() => semesters.flatMap((sem) => sem.sections), [semesters]);

  if (semesters.length === 0) {
    return (
      <div className="rounded-[20px] border border-[#232323] bg-[#111111] p-8 text-center flex flex-col items-center justify-center min-h-[260px]">
        <div className="w-12 h-12 rounded-full border border-[#232323] bg-[#161616] flex items-center justify-center mb-4">
          <AlertCircle className="w-6 h-6 text-[#8A8A8A]" />
        </div>
        <h3 className="text-base font-semibold text-[#FAFAFA] mb-2">Instructional Semester Required</h3>
        <p className="text-sm font-sans text-[#8A8A8A] max-w-md mx-auto mb-6">
          You must create at least one semester term before establishing student cohort sections.
        </p>
        <Link href="/institutions/semesters">
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 rounded-[12px] border-[#232323] text-[#FAFAFA] hover:bg-[#161616]"
          >
            Go to Semesters
          </Button>
        </Link>
      </div>
    );
  }

  if (sections.length === 0) {
    return (
      <InstitutionEmptyState
        icon={Users}
        title="No sections yet"
        description="Student sections represent cohorts scheduled for core lectures and divided into lab/tutorial batches."
        actionLabel="Create first section"
        onAction={() => openAddSection()}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {sections.map((sec) => (
        <div
          key={sec.id}
          className="rounded-[16px] border border-[#232323] bg-[#111111] p-5 flex flex-col justify-between min-h-[160px] transition-colors hover:border-[#333333]"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <Users className="h-4 w-4 text-[#FAFAFA]" />
                <h3 className="text-base font-semibold text-[#FAFAFA]">{sec.name}</h3>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded border border-[#232323] bg-[#161616] text-[#FAFAFA]">
                {sec.strength} Students
              </span>
            </div>
            <p className="text-xs font-mono text-[#8A8A8A] mb-3">
              {sec.batches.length} sub-batch{sec.batches.length === 1 ? '' : 'es'} defined
            </p>
            {sec.batches.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {sec.batches.map((b, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] font-mono px-2 py-0.5 rounded border border-[#232323] bg-[#161616] text-[#8A8A8A]"
                  >
                    {b.name}: {b.size}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end border-t border-[#232323]/40 mt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteSection(sec.id, sec.name)}
              className="text-[#8A8A8A] hover:text-[#EF4444] hover:bg-[#EF4444]/10 h-8 w-8 p-0 rounded-[8px]"
              aria-label={`Delete section ${sec.name}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
