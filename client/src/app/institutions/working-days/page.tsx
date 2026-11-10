// Working days and period schedule configuration route for the institution.
'use client';

import { useInstitutionContext, WorkingDaysConfig } from '@/features/institution';
import { Skeleton } from '@/components/ui/skeleton';

/** React page component rendering working days and period timing configuration view. */
export default function WorkingDaysPage() {
  const { structure, isLoading, refetch } = useInstitutionContext();

  if (isLoading && !structure) {
    return (
      <div className="space-y-6 max-w-3xl" aria-busy="true">
        <Skeleton className="h-40 w-full rounded-[16px] bg-[#141414]" />
        <Skeleton className="h-64 w-full rounded-[16px] bg-[#141414]" />
      </div>
    );
  }

  if (!structure?.institution) {
    return (
      <div className="rounded-[16px] border border-[#232323] bg-[#111111] p-8 text-center text-xs font-mono text-[#8A8A8A]">
        Institution settings not found.
      </div>
    );
  }

  return (
    <div className="w-full">
      <WorkingDaysConfig
        institution={structure.institution}
        onSuccess={() => void refetch()}
      />
    </div>
  );
}
