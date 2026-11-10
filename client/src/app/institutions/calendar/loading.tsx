// Loading skeleton placeholder for Calendar route.
import { Skeleton } from '@/components/ui/skeleton';

/** React component rendering loading skeleton for calendar events grid. */
export default function CalendarLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4" aria-busy="true">
      <Skeleton className="h-36 w-full rounded-[16px] bg-[#141414]" />
      <Skeleton className="h-36 w-full rounded-[16px] bg-[#141414]" />
      <Skeleton className="h-36 w-full rounded-[16px] bg-[#141414]" />
      <Skeleton className="h-36 w-full rounded-[16px] bg-[#141414]" />
    </div>
  );
}
