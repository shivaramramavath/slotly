// Overview hierarchy tree page displaying the complete academic graph for the institution.
'use client';

import { useInstitutionContext, StructureTree } from '@/features/institution';
import { Skeleton } from '@/components/ui/skeleton';

/** React page component rendering the Overview Tree tab for academic hierarchy. */
export default function OverviewTreePage() {
  const {
    structure,
    isLoading,
    openAddDepartment,
    openAddProgram,
    openAddAcademicYear,
    openAddSemester,
    openAddSection,
    deleteDepartment,
    deleteProgram,
    deleteAcademicYear,
    deleteSemester,
    deleteSection,
  } = useInstitutionContext();

  if (isLoading && !structure) {
    return (
      <div className="space-y-3" aria-busy="true">
        <Skeleton className="h-16 w-full rounded-[16px] bg-[#141414]" />
        <Skeleton className="h-16 w-full rounded-[16px] bg-[#141414]" />
        <Skeleton className="h-16 w-full rounded-[16px] bg-[#141414]" />
      </div>
    );
  }

  const departments = structure?.departments || [];

  return (
    <div className="w-full">
      <StructureTree
        departments={departments}
        onAddDepartment={openAddDepartment}
        onAddProgram={openAddProgram}
        onAddYear={openAddAcademicYear}
        onAddSemester={openAddSemester}
        onAddSection={openAddSection}
        onDeleteDepartment={deleteDepartment}
        onDeleteProgram={deleteProgram}
        onDeleteYear={deleteAcademicYear}
        onDeleteSemester={deleteSemester}
        onDeleteSection={deleteSection}
      />
    </div>
  );
}
