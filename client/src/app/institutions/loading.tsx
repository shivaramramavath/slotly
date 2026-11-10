// Loading skeleton placeholder for Overview Tree route.
import { Skeleton } from '@/components/ui/skeleton';

/** React component rendering loading skeleton for institution tree view. */
export default function OverviewLoading() {
  return (
    <div className="space-y-3" aria-busy="true">
      <Skeleton className="h-16 w-full rounded-[16px] bg-[#141414]" />
      <Skeleton className="h-16 w-full rounded-[16px] bg-[#141414]" />
      <Skeleton className="h-16 w-full rounded-[16px] bg-[#141414]" />
    </div>
  );
}
