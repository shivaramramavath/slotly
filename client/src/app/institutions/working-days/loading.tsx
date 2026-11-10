// Loading skeleton placeholder for Working Days route.
import { Skeleton } from '@/components/ui/skeleton';

/** React component rendering loading skeleton for working days form. */
export default function WorkingDaysLoading() {
  return (
    <div className="space-y-6 max-w-3xl" aria-busy="true">
      <Skeleton className="h-40 w-full rounded-[16px] bg-[#141414]" />
      <Skeleton className="h-64 w-full rounded-[16px] bg-[#141414]" />
    </div>
  );
}
